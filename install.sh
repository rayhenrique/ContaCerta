#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute o script como root (sudo ./install.sh)${NC}"
    exit 1
fi

# Função para verificar memória disponível
check_memory() {
    local available_mem=$(free -m | awk '/^Mem:/{print $7}')
    if [ $available_mem -lt 100 ]; then
        echo -e "${YELLOW}Pouca memória disponível ($available_mem MB). Configurando SWAP...${NC}"
        return 1
    fi
    return 0
}

# Configurar SWAP
setup_swap() {
    if [ ! -f /swapfile ]; then
        echo -e "${YELLOW}Configurando SWAP...${NC}"
        fallocate -l 1G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        echo 'vm.swappiness=10' >> /etc/sysctl.conf
        echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
        sysctl -p
    fi
}

# Limpar processos e cache
clean_system() {
    echo -e "${YELLOW}Limpando sistema...${NC}"
    sync; echo 3 > /proc/sys/vm/drop_caches
    systemctl stop apache2 2>/dev/null
    systemctl disable apache2 2>/dev/null
}

# Instalar dependências básicas
echo -e "${YELLOW}Instalando dependências básicas...${NC}"
apt update
apt install -y curl wget git software-properties-common

# Verificar e configurar SWAP se necessário
check_memory || setup_swap

# Limpar sistema
clean_system

# Configurar MySQL otimizado
setup_mysql() {
    echo -e "${YELLOW}Instalando e configurando MySQL...${NC}"
    apt install -y mysql-server

    # Configuração otimizada do MySQL
    cat > /etc/mysql/mysql.conf.d/mysqld.cnf << EOL
[mysqld]
# Configurações básicas
user            = mysql
pid-file        = /var/run/mysqld/mysqld.pid
socket          = /var/run/mysqld/mysqld.sock
port            = 3306
basedir         = /usr
datadir         = /var/lib/mysql
tmpdir          = /tmp
bind-address    = 127.0.0.1

# Otimizações para baixa memória
performance_schema = off
skip-name-resolve
max_connections = 10
key_buffer_size = 8M
innodb_buffer_pool_size = 32M
innodb_log_buffer_size = 1M
query_cache_size = 4M
tmp_table_size = 4M
max_heap_table_size = 4M
thread_cache_size = 4
sort_buffer_size = 256K
read_buffer_size = 256K
read_rnd_buffer_size = 256K
join_buffer_size = 256K
net_buffer_length = 2K

# InnoDB específico
innodb_file_per_table = 1
innodb_flush_method = O_DIRECT
innodb_flush_log_at_trx_commit = 0
EOL

    systemctl restart mysql
    systemctl enable mysql
}

# Instalar Node.js
setup_nodejs() {
    echo -e "${YELLOW}Instalando Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    npm install -g pm2
}

# Instalar Nginx
setup_nginx() {
    echo -e "${YELLOW}Instalando Nginx...${NC}"
    apt install -y nginx
    systemctl enable nginx
}

# Configurar banco de dados
setup_database() {
    local db_pass=$(openssl rand -base64 12)
    echo -e "${YELLOW}Configurando banco de dados...${NC}"
    
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$db_pass';"
    mysql -e "CREATE DATABASE IF NOT EXISTS contacerta;"
    mysql -e "FLUSH PRIVILEGES;"
    
    echo "DB_PASS=$db_pass" > /tmp/db_credentials
}

# Configurar aplicação
setup_application() {
    echo -e "${YELLOW}Configurando aplicação...${NC}"
    local db_pass=$(cat /tmp/db_credentials | cut -d= -f2)
    local jwt_secret=$(openssl rand -base64 32)
    
    cd /var/www/ContaCerta/backend
    
    # Configurar variáveis de ambiente
    cat > .env << EOL
NODE_ENV=production
DB_HOST=localhost
DB_USER=root
DB_PASS=$db_pass
DB_NAME=contacerta
JWT_SECRET=$jwt_secret
PORT=3001
EOL

    # Instalar dependências e executar migrações
    npm install
    npx sequelize-cli db:migrate
}

# Configurar Nginx
setup_nginx_config() {
    cat > /etc/nginx/sites-available/contacerta << EOL
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/ContaCerta/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

    ln -sf /etc/nginx/sites-available/contacerta /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
}

# Função principal de instalação
main() {
    clean_system
    setup_swap
    setup_mysql
    setup_nodejs
    setup_nginx
    
    # Clonar repositório
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/rayhenrique/ContaCerta.git
    
    setup_database
    setup_application
    setup_nginx_config
    
    # Iniciar aplicação
    cd /var/www/ContaCerta/backend
    pm2 start npm --name "contacerta-api" -- start --max-memory-restart 150M
    pm2 save
    
    # Limpar
    rm -f /tmp/db_credentials
    
    echo -e "${GREEN}Instalação concluída!${NC}"
    echo -e "Acesse: http://seu_ip"
}

# Iniciar instalação
main
