#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
APP_DIR="/var/www/ContaCerta"
DOMAIN="seu_dominio.com"
MYSQL_ROOT_PASSWORD="sua_senha_root"
MYSQL_USER="contacerta"
MYSQL_PASSWORD="sua_senha_db"
MYSQL_DATABASE="contacerta"
JWT_SECRET="seu_jwt_secret"
NODE_ENV="production"

echo -e "${GREEN}Iniciando instalação do ContaCerta...${NC}"

# Atualizar sistema
echo -e "${YELLOW}Atualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
sudo apt install -y curl git nginx software-properties-common

# Instalar Node.js
echo -e "${YELLOW}Instalando Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
echo -e "${YELLOW}Instalando PM2...${NC}"
sudo npm install -g pm2

# Instalar MySQL
echo -e "${YELLOW}Instalando MySQL...${NC}"
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar MySQL
echo -e "${YELLOW}Configurando MySQL...${NC}"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;"
sudo mysql -e "CREATE USER IF NOT EXISTS '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Clonar repositório
echo -e "${YELLOW}Clonando repositório...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
git clone https://github.com/rayhenrique/ContaCerta.git $APP_DIR

# Configurar backend
echo -e "${YELLOW}Configurando backend...${NC}"
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
echo -e "${YELLOW}Executando migrações do banco de dados...${NC}"
npx sequelize-cli db:migrate

# Configurar frontend
echo -e "${YELLOW}Configurando frontend...${NC}"
cd $APP_DIR/frontend
npm install

# Criar arquivo .env
cat > .env << EOL
REACT_APP_API_URL=http://$DOMAIN/api
EOL

# Build do frontend
npm run build

# Configurar Nginx
echo -e "${YELLOW}Configurando Nginx...${NC}"
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
echo -e "${YELLOW}Iniciando aplicação...${NC}"
cd $APP_DIR/backend
pm2 start src/server.js --name contacerta-backend
pm2 save
pm2 startup

echo -e "${GREEN}Instalação concluída!${NC}"
echo -e "${YELLOW}Não esqueça de:${NC}"
echo "1. Configurar SSL com Certbot"
echo "2. Ajustar as senhas em produção"
echo "3. Verificar as configurações de firewall"
