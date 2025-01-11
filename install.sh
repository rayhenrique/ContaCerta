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

# Função para gerar senha aleatória
generate_password() {
    openssl rand -base64 16
}

# Configurações iniciais
echo -e "${GREEN}=== ContaCerta - Assistente de Instalação ===${NC}\n"

# Solicitar apenas o domínio
echo -e "${YELLOW}Digite o domínio onde a aplicação será acessada${NC}"
echo -e "${YELLOW}(ou deixe em branco para usar o IP do servidor)${NC}"
read -p "Domínio: " DOMAIN

# Se nenhum domínio foi fornecido, usar o IP do servidor
if [ -z "$DOMAIN" ]; then
    DOMAIN=$(curl -s ifconfig.me)
    echo -e "${YELLOW}Usando IP do servidor: $DOMAIN${NC}"
fi

# Gerar senhas e configurações automaticamente
MYSQL_ROOT_PASSWORD=$(generate_password)
MYSQL_USER="contacerta"
MYSQL_PASSWORD=$(generate_password)
MYSQL_DATABASE="contacerta"
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV="production"
APP_DIR="/var/www/ContaCerta"

# Atualizar sistema
echo -e "\n${YELLOW}Atualizando sistema...${NC}"
apt update && apt upgrade -y

# Instalar dependências
echo -e "\n${YELLOW}Instalando dependências...${NC}"
apt install -y curl git nginx software-properties-common dnsutils

# Instalar Node.js
echo -e "\n${YELLOW}Instalando Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PM2
echo -e "\n${YELLOW}Instalando PM2...${NC}"
npm install -g pm2

# Configurar MySQL
echo -e "\n${YELLOW}Instalando e configurando MySQL...${NC}"
apt install -y mysql-server

# Garantir que o diretório do MySQL existe
mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld
chmod 755 /var/run/mysqld

# Configuração otimizada do MySQL
cat > /etc/mysql/mysql.conf.d/mysqld.cnf << EOL
[mysqld]
user            = mysql
pid-file        = /var/run/mysqld/mysqld.pid
socket          = /var/run/mysqld/mysqld.sock
port            = 3306
basedir         = /usr
datadir         = /var/lib/mysql
tmpdir          = /tmp
bind-address    = 127.0.0.1

# Otimizações para 1GB RAM
key_buffer_size = 128M
max_connections = 75
innodb_buffer_pool_size = 256M
innodb_log_buffer_size = 8M
query_cache_size = 32M
tmp_table_size = 32M
max_heap_table_size = 32M
thread_cache_size = 8
EOL

# Reiniciar MySQL
systemctl restart mysql
systemctl enable mysql

# Aguardar MySQL iniciar
echo -e "${YELLOW}Aguardando MySQL iniciar...${NC}"
sleep 10

# Configurar banco de dados
echo -e "\n${YELLOW}Configurando banco de dados...${NC}"
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';"
mysql -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;"
mysql -e "CREATE USER IF NOT EXISTS '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Clonar repositório
echo -e "\n${YELLOW}Clonando repositório...${NC}"
mkdir -p $APP_DIR
cd /var/www
GITHUB_TOKEN="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"
git clone https://${GITHUB_TOKEN}@github.com/rayhenrique/ContaCerta.git
chown -R www-data:www-data $APP_DIR

# Configurar backend
echo -e "\n${YELLOW}Configurando backend...${NC}"
cd $APP_DIR/backend
npm install

# Criar arquivo .env do backend
cat > .env << EOL
NODE_ENV=$NODE_ENV
DB_HOST=127.0.0.1
DB_USER=$MYSQL_USER
DB_PASS=$MYSQL_PASSWORD
DB_NAME=$MYSQL_DATABASE
JWT_SECRET=$JWT_SECRET
PORT=3001
EOL

# Executar migrações
echo -e "\n${YELLOW}Executando migrações...${NC}"
npx sequelize-cli db:migrate

# Configurar frontend
echo -e "\n${YELLOW}Configurando frontend...${NC}"
cd $APP_DIR/frontend
npm install

# Criar arquivo .env do frontend
cat > .env << EOL
REACT_APP_API_URL=http://$DOMAIN/api
EOL

# Build do frontend
npm run build

# Configurar Nginx
echo -e "\n${YELLOW}Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/contacerta << EOL
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        root $APP_DIR/frontend/build;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
EOL

ln -sf /etc/nginx/sites-available/contacerta /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Iniciar aplicação com PM2
echo -e "\n${YELLOW}Iniciando aplicação...${NC}"
cd $APP_DIR/backend
pm2 start src/server.js --name contacerta-api
pm2 save
pm2 startup | bash

# Configurar firewall
echo -e "\n${YELLOW}Configurando firewall...${NC}"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Instalar e configurar SSL
if [[ ! $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "\n${YELLOW}Instalando Certbot...${NC}"
    apt install -y certbot python3-certbot-nginx
    
    SERVER_IP=$(curl -s ifconfig.me)
    DOMAIN_IP=$(dig +short $DOMAIN)
    
    if [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
        echo -e "${GREEN}SSL configurado com sucesso!${NC}"
    else
        echo -e "${YELLOW}AVISO: O domínio $DOMAIN não está apontando para este servidor ($SERVER_IP).${NC}"
        echo -e "${YELLOW}Configure o DNS primeiro e depois execute:${NC}"
        echo "certbot --nginx -d $DOMAIN"
    fi
fi

# Salvar credenciais
echo -e "\n${YELLOW}Salvando credenciais...${NC}"
cat > /root/.contacerta_credentials << EOL
=== ContaCerta - Credenciais ===
Data da instalação: $(date)

Domínio: $DOMAIN
MySQL Root Password: $MYSQL_ROOT_PASSWORD
MySQL User: $MYSQL_USER
MySQL Password: $MYSQL_PASSWORD
Database: $MYSQL_DATABASE
JWT Secret: $JWT_SECRET
EOL

chmod 600 /root/.contacerta_credentials

echo -e "\n${GREEN}Instalação concluída com sucesso!${NC}"
echo -e "\n${YELLOW}Informações importantes:${NC}"
echo "1. As credenciais foram salvas em /root/.contacerta_credentials"
echo "2. Acesse a aplicação em: http://$DOMAIN"
echo "3. Para ver os logs: pm2 logs contacerta-api"

# Mostrar status dos serviços
echo -e "\n${YELLOW}Status dos serviços:${NC}"
systemctl status mysql --no-pager
systemctl status nginx --no-pager
pm2 status
