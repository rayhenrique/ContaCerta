#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para solicitar input do usuário
get_input() {
    local prompt=$1
    local default=$2
    local value=""
    
    echo -ne "${YELLOW}$prompt ${NC}[$default]: "
    read value
    echo "${value:-$default}"
}

# Função para solicitar senha
get_password() {
    local prompt=$1
    local password=""
    
    echo -ne "${YELLOW}$prompt ${NC}"
    read -s password
    echo
    echo "$password"
}

clear
echo -e "${GREEN}=== ContaCerta - Assistente de Instalação ===${NC}\n"

# Solicitar configurações
echo -e "${GREEN}Configuração do Ambiente${NC}"
echo -e "------------------------"
DOMAIN=$(get_input "Digite o domínio do site" "localhost")
NODE_ENV=$(get_input "Ambiente (production/development)" "production")

echo -e "\n${GREEN}Configuração do MySQL${NC}"
echo -e "------------------------"
MYSQL_ROOT_PASSWORD=$(get_password "Digite a senha do root do MySQL: ")
MYSQL_DATABASE=$(get_input "Nome do banco de dados" "contacerta")
MYSQL_USER=$(get_input "Usuário do banco de dados" "contacerta")
MYSQL_PASSWORD=$(get_password "Senha do usuário do banco de dados: ")

echo -e "\n${GREEN}Configuração da Aplicação${NC}"
echo -e "------------------------"
APP_DIR=$(get_input "Diretório de instalação" "/var/www/ContaCerta")
JWT_SECRET=$(get_password "Chave secreta para JWT: ")

# Confirmar configurações
echo -e "\n${GREEN}Revise as configurações:${NC}"
echo -e "------------------------"
echo -e "Domínio: $DOMAIN"
echo -e "Ambiente: $NODE_ENV"
echo -e "Banco de Dados: $MYSQL_DATABASE"
echo -e "Usuário BD: $MYSQL_USER"
echo -e "Diretório: $APP_DIR"

echo -ne "\n${YELLOW}As configurações estão corretas? (S/n): ${NC}"
read confirm
if [[ $confirm =~ ^[Nn] ]]; then
    echo -e "${RED}Instalação cancelada pelo usuário${NC}"
    exit 1
fi

echo -e "\n${GREEN}Iniciando instalação...${NC}"

# Atualizar sistema
echo -e "\n${YELLOW}Atualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y

# Instalar dependências
echo -e "\n${YELLOW}Instalando dependências...${NC}"
sudo apt install -y curl git nginx software-properties-common

# Instalar Node.js
echo -e "\n${YELLOW}Instalando Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
echo -e "\n${YELLOW}Instalando PM2...${NC}"
sudo npm install -g pm2

# Instalar MySQL
echo -e "\n${YELLOW}Instalando MySQL...${NC}"
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar MySQL
echo -e "\n${YELLOW}Configurando MySQL...${NC}"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;"
sudo mysql -e "CREATE USER IF NOT EXISTS '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Clonar repositório
echo -e "\n${YELLOW}Clonando repositório...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
git clone https://github.com/rayhenrique/ContaCerta.git $APP_DIR

# Configurar backend
echo -e "\n${YELLOW}Configurando backend...${NC}"
cd $APP_DIR/backend
npm install

# Criar arquivo .env
cat > .env << EOL
NODE_ENV=$NODE_ENV
DB_HOST=localhost
DB_USER=$MYSQL_USER
DB_PASS=$MYSQL_PASSWORD
DB_NAME=$MYSQL_DATABASE
JWT_SECRET=$JWT_SECRET
PORT=3001
EOL

# Executar migrações
echo -e "\n${YELLOW}Executando migrações do banco de dados...${NC}"
npx sequelize-cli db:migrate

# Configurar frontend
echo -e "\n${YELLOW}Configurando frontend...${NC}"
cd $APP_DIR/frontend
npm install

# Criar arquivo .env
cat > .env << EOL
REACT_APP_API_URL=http://$DOMAIN/api
EOL

# Build do frontend
npm run build

# Configurar Nginx
echo -e "\n${YELLOW}Configurando Nginx...${NC}"
sudo tee /etc/nginx/sites-available/contacerta << EOL
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
}
EOL

# Ativar site e reiniciar Nginx
sudo ln -sf /etc/nginx/sites-available/contacerta /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Iniciar aplicação com PM2
echo -e "\n${YELLOW}Iniciando aplicação...${NC}"
cd $APP_DIR/backend
pm2 start src/server.js --name contacerta-backend
pm2 save
pm2 startup

echo -e "\n${GREEN}Instalação concluída com sucesso!${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo "1. Configure SSL com: sudo certbot --nginx -d $DOMAIN"
echo "2. Verifique se a aplicação está rodando em: http://$DOMAIN"
echo "3. Faça login com as credenciais padrão e altere a senha"
echo "4. Configure o firewall se necessário"

# Perguntar se deseja instalar SSL
echo -ne "\n${YELLOW}Deseja instalar SSL agora? (S/n): ${NC}"
read install_ssl
if [[ ! $install_ssl =~ ^[Nn] ]]; then
    echo -e "\n${YELLOW}Instalando Certbot e configurando SSL...${NC}"
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $DOMAIN
fi
