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
    local confirm_password=""
    
    while true; do
        echo -ne "${YELLOW}$prompt ${NC}"
        read -s password
        echo
        
        echo -ne "${YELLOW}Confirme a senha: ${NC}"
        read -s confirm_password
        echo
        
        if [ "$password" = "$confirm_password" ]; then
            echo "$password"
            break
        else
            echo -e "${RED}As senhas não coincidem. Tente novamente.${NC}\n"
        fi
    done
}

# Função para gerar JWT secret
generate_jwt_secret() {
    openssl rand -base64 32
}

clear
echo -e "${GREEN}=== ContaCerta - Assistente de Instalação ===${NC}\n"

# Atualizar sistema
echo -e "${YELLOW}Atualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y

# Instalar dependências básicas
echo -e "\n${YELLOW}Instalando dependências básicas...${NC}"
sudo apt install -y curl wget git software-properties-common

# Instalar Node.js 18.x
echo -e "\n${YELLOW}Instalando Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version

# Instalar MySQL 8.0
echo -e "\n${YELLOW}Instalando MySQL 8.0...${NC}"
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
mysql --version

# Instalar Nginx
echo -e "\n${YELLOW}Instalando Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
nginx -v

# Instalar PM2
echo -e "\n${YELLOW}Instalando PM2...${NC}"
sudo npm install -g pm2
pm2 --version

echo -e "\n${GREEN}Instalação básica concluída. Iniciando configuração...${NC}\n"

# Solicitar configurações
echo -e "${GREEN}Configuração do Ambiente${NC}"
echo -e "------------------------"
echo -e "${YELLOW}Exemplo de domínio: meusite.com.br (sem http:// ou www)${NC}"
DOMAIN=$(get_input "Digite o domínio do site" "localhost")
NODE_ENV=$(get_input "Ambiente (production/development)" "production")

echo -e "\n${GREEN}Configuração do MySQL${NC}"
echo -e "------------------------"
echo -e "${YELLOW}Digite a senha para o usuário root do MySQL${NC}"
MYSQL_ROOT_PASSWORD=$(get_password "Senha do root: ")

# Configurar MySQL com senha root
echo -e "\n${YELLOW}Configurando MySQL...${NC}"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';"

MYSQL_DATABASE=$(get_input "Nome do banco de dados" "contacerta")
MYSQL_USER=$(get_input "Usuário do banco de dados" "root")

if [ "$MYSQL_USER" != "root" ]; then
    echo -e "\n${YELLOW}Digite a senha para o usuário $MYSQL_USER${NC}"
    MYSQL_PASSWORD=$(get_password "Senha do usuário: ")
    sudo mysql -u root -p$MYSQL_ROOT_PASSWORD -e "CREATE USER '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';"
    sudo mysql -u root -p$MYSQL_ROOT_PASSWORD -e "GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'localhost';"
else
    MYSQL_PASSWORD=$MYSQL_ROOT_PASSWORD
fi

sudo mysql -u root -p$MYSQL_ROOT_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;"
sudo mysql -u root -p$MYSQL_ROOT_PASSWORD -e "FLUSH PRIVILEGES;"

echo -e "\n${GREEN}Configuração da Aplicação${NC}"
echo -e "------------------------"
APP_DIR="/var/www/ContaCerta"
echo -e "${YELLOW}Diretório de instalação: $APP_DIR${NC}"

# Gerar JWT Secret
JWT_SECRET=$(generate_jwt_secret)
echo -e "${YELLOW}Chave JWT gerada automaticamente${NC}"

# Mostrar resumo
echo -e "\n${GREEN}Resumo da Instalação:${NC}"
echo -e "------------------------"
echo "Domínio: $DOMAIN"
echo "Ambiente: $NODE_ENV"
echo "Diretório: $APP_DIR"
echo "Banco de Dados: $MYSQL_DATABASE"
echo "Usuário BD: $MYSQL_USER"

echo -ne "\n${YELLOW}As configurações estão corretas? (S/n): ${NC}"
read confirm
if [[ $confirm =~ ^[Nn] ]]; then
    echo -e "${RED}Instalação cancelada pelo usuário${NC}"
    exit 1
fi

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

    root $APP_DIR/frontend/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
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

# Perguntar se deseja instalar SSL
echo -e "\n${YELLOW}Deseja instalar SSL (https://) agora? (S/n): ${NC}"
read install_ssl
if [[ ! $install_ssl =~ ^[Nn] ]]; then
    echo -e "\n${YELLOW}Instalando Certbot e configurando SSL...${NC}"
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $DOMAIN
fi

# Mostrar informações finais
echo -e "\n${GREEN}=== Informações Importantes ===${NC}"
echo -e "Guarde estas informações em local seguro:"
echo -e "\n${YELLOW}Diretórios:${NC}"
echo "Aplicação: $APP_DIR"
echo "Frontend: $APP_DIR/frontend"
echo "Backend: $APP_DIR/backend"

echo -e "\n${YELLOW}Próximos passos:${NC}"
echo "1. Configure seu domínio DNS para apontar para este servidor"
echo "2. Acesse o sistema em: http://$DOMAIN"
echo "3. Faça login com as credenciais padrão e altere a senha"
echo "4. Configure o firewall se necessário"

# Salvar informações em arquivo
echo -e "\n${YELLOW}Salvando informações de instalação...${NC}"
INSTALL_INFO="$APP_DIR/install_info.txt"
cat > $INSTALL_INFO << EOL
=== ContaCerta - Informações de Instalação ===
Data: $(date)

Ambiente: $NODE_ENV
Domínio: $DOMAIN
Diretório: $APP_DIR

MySQL:
- Database: $MYSQL_DATABASE
- Root User: root
EOL

if [ "$MYSQL_USER" != "root" ]; then
    cat >> $INSTALL_INFO << EOL
- App User: $MYSQL_USER
EOL
fi

cat >> $INSTALL_INFO << EOL

JWT Secret: $JWT_SECRET

Mantenha este arquivo em local seguro!
EOL

chmod 600 $INSTALL_INFO
echo -e "Informações salvas em: $INSTALL_INFO"
