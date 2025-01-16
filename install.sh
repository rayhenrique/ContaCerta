#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações de requisitos
LOG_FILE="/var/log/contacerta_install.log"
MIN_DISK_SPACE=5  # Mínimo de 5GB de espaço em disco
MIN_RAM=2         # Mínimo de 2GB de RAM
NODE_VERSION="18.19.0"  # Versão específica do Node.js
NPM_VERSION="10.2.3"    # Versão específica do npm

# Função de log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Função de tratamento de erros
handle_error() {
    log "ERRO: $1"
    echo -e "${RED}ERRO: $1${NC}"
    exit 1
}

# Verificação de requisitos do sistema
check_system_requirements() {
    log "Verificando requisitos do sistema..."

    # Verificação de espaço em disco
    AVAILABLE_SPACE=$(df -h / | awk '/\// {print $4}' | sed 's/G//')
    if (( $(echo "$AVAILABLE_SPACE < $MIN_DISK_SPACE" | bc -l) )); then
        handle_error "Espaço em disco insuficiente. Requer pelo menos ${MIN_DISK_SPACE}GB, mas apenas ${AVAILABLE_SPACE}GB disponível."
    fi

    # Verificação de RAM
    TOTAL_RAM=$(free -g | awk '/^Mem:/ {print $2}')
    if (( TOTAL_RAM < MIN_RAM )); then
        handle_error "RAM insuficiente. Requer pelo menos ${MIN_RAM}GB, mas apenas ${TOTAL_RAM}GB disponível."
    fi

    # Verificação de compatibilidade do SO
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" != "ubuntu" ]] || [[ "$VERSION_ID" < "20.04" ]]; then
            handle_error "Sistema operacional não suportado. Requer Ubuntu 20.04 ou posterior."
        fi
    else
        handle_error "Não foi possível determinar o sistema operacional."
    fi

    log "Verificação de requisitos do sistema concluída com sucesso."
}

# Gerenciamento de versão do Node.js
install_node_version() {
    log "Instalando Node.js versão ${NODE_VERSION}"
    
    # Remover instalações existentes do Node.js
    sudo apt-get purge -y nodejs npm

    # Instalar versão específica do Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verificar versões instaladas
    INSTALLED_NODE_VERSION=$(node --version)
    INSTALLED_NPM_VERSION=$(npm --version)
    
    log "Versão do Node.js instalada: $INSTALLED_NODE_VERSION"
    log "Versão do npm instalada: $INSTALLED_NPM_VERSION"
    
    if [[ "$INSTALLED_NODE_VERSION" != "v${NODE_VERSION}" ]]; then
        log "Aviso: Versão do Node.js não corresponde exatamente à versão esperada"
    fi
}

# Bloqueio de dependências
lock_dependencies() {
    log "Bloqueando versões de dependências"
    
    # Dependências do Backend
    cd /var/www/contacerta/backend
    npm ci  # Instalação estrita de dependências
    
    # Dependências do Frontend
    cd /var/www/contacerta/frontend
    npm ci  # Instalação estrita de dependências
    
    log "Dependências instaladas com versões bloqueadas"
}

# Solicitar domínio ou usar IP
echo -e "${YELLOW}Digite o domínio onde a aplicação será instalada${NC}"
echo -e "${YELLOW}(ou deixe em branco para usar o IP do servidor)${NC}"
read -p "Domínio: " DOMAIN

# Se nenhum domínio foi fornecido, usar o IP do servidor
if [ -z "$DOMAIN" ]; then
    DOMAIN=$(curl -s ifconfig.me)
    echo -e "${YELLOW}Usando IP do servidor: $DOMAIN${NC}"
fi

echo -e "${GREEN}=== Iniciando instalação do ContaCerta ===${NC}"

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}Erro: $1${NC}"
        exit 1
    fi
}

# Função para exibir progresso
show_progress() {
    echo -e "${YELLOW}>>> $1...${NC}"
}

# Verificar requisitos do sistema
check_system_requirements

# 1. Atualização inicial do sistema
show_progress "Atualizando sistema"
sudo apt update && sudo apt upgrade -y
check_error "Falha na atualização do sistema"

# 2. Instalação de dependências básicas
show_progress "Instalando dependências básicas"
sudo apt install -y curl git build-essential nginx mysql-server
check_error "Falha na instalação das dependências"

# 3. Configuração do timezone
show_progress "Configurando timezone"
sudo timedatectl set-timezone America/Sao_Paulo
check_error "Falha na configuração do timezone"

# 4. Instalação do Node.js
show_progress "Instalando Node.js"
install_node_version
check_error "Falha na instalação do Node.js"

# 5. Configuração do MySQL
show_progress "Configurando MySQL"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '1508rcrc';"
sudo mysql -e "FLUSH PRIVILEGES;"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS contacerta;"
check_error "Falha na configuração do MySQL"

# 6. Configuração do diretório da aplicação
show_progress "Configurando diretório da aplicação"
sudo mkdir -p /var/www/contacerta
cd /var/www/contacerta
sudo git clone https://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@github.com/rayhenrique/ContaCerta.git .
check_error "Falha no clone do repositório"

# 7. Configuração de permissões
show_progress "Configurando permissões"
sudo chown -R $USER:$USER /var/www/contacerta
check_error "Falha na configuração de permissões"

# 8. Configuração do Backend
show_progress "Configurando Backend"
cd /var/www/contacerta/backend
lock_dependencies
check_error "Falha na instalação das dependências do backend"

# Criar arquivo .env
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASS=1508rcrc
DB_NAME=contacerta
JWT_SECRET=contacerta2024
NODE_ENV=production
PORT=3001
EOF

# Executar migrações
npx sequelize-cli db:migrate
check_error "Falha nas migrações do banco de dados"

# Criar usuário admin
node src/scripts/createAdmin.js
check_error "Falha na criação do usuário admin"

# 9. Configuração do Frontend
show_progress "Configurando Frontend"
cd /var/www/contacerta/frontend
lock_dependencies
check_error "Falha na instalação das dependências do frontend"

# Criar arquivo .env para o frontend
cat > .env << EOF
REACT_APP_API_URL=http://${DOMAIN}/api
EOF

# Build do frontend
npm run build
check_error "Falha no build do frontend"

# 10. Instalação e configuração do PM2
show_progress "Configurando PM2"
sudo npm install -g pm2
cd /var/www/contacerta/backend
pm2 start src/server.js --name contacerta-backend
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
check_error "Falha na configuração do PM2"

# 11. Configuração do Nginx
show_progress "Configurando Nginx"
sudo tee /etc/nginx/sites-available/contacerta << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        root /var/www/contacerta/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

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

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
EOF

sudo ln -s /etc/nginx/sites-available/contacerta /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
check_error "Falha na configuração do Nginx"

sudo systemctl restart nginx
check_error "Falha ao reiniciar Nginx"

# 12. Configuração básica de segurança
show_progress "Configurando segurança básica"
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
check_error "Falha na configuração do firewall"

sudo apt install -y fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
check_error "Falha na instalação do fail2ban"

# Finalização
echo -e "${GREEN}=== Instalação do ContaCerta concluída com sucesso! ===${NC}"
echo -e "${YELLOW}Credenciais de acesso:${NC}"
echo -e "URL: http://${DOMAIN}"
echo -e "Email: rayhenrique@gmail.com"
echo -e "Senha: 1508rcrc"
echo -e "${YELLOW}Importante: Altere a senha após o primeiro acesso${NC}"

# Exibir status dos serviços
echo -e "\n${GREEN}=== Status dos serviços ===${NC}"
pm2 status
sudo systemctl status nginx --no-pager
