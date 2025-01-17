#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to validate domain
validate_domain() {
    local domain=$1
    if [[ $domain =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate IP address
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate email
validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to install SSL certificate
install_ssl_certificate() {
    local domain=$1
    local email=$2

    echo -e "\n${YELLOW}Configurando Certificado SSL para $domain${NC}"

    # Check if Certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo -e "${YELLOW}Instalando Certbot...${NC}"
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi

    # Obtain SSL certificate
    echo -e "${GREEN}Obtendo certificado SSL com Certbot...${NC}"
    sudo certbot certonly --nginx -d "$domain" -d "www.$domain" --non-interactive --agree-tos -m "$email"

    # Configure Nginx for SSL
    if [ -f "/etc/nginx/sites-available/contacerta" ]; then
        sudo sed -i 's/listen 80;/listen 443 ssl;/' /etc/nginx/sites-available/contacerta
        sudo sed -i "/listen 443 ssl;/a \    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;" /etc/nginx/sites-available/contacerta
        sudo sed -i "/ssl_certificate.*/a \    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;" /etc/nginx/sites-available/contacerta

        # Add HTTP to HTTPS redirect
        sudo tee -a /etc/nginx/sites-available/contacerta << EOF

server {
    listen 80;
    server_name $domain www.$domain;
    return 301 https://\$server_name\$request_uri;
}
EOF

        sudo nginx -t && sudo systemctl restart nginx
        echo -e "${GREEN}Configuração SSL concluída com sucesso!${NC}"
    else
        echo -e "${RED}Arquivo de configuração do Nginx não encontrado. Configuração SSL manual será necessária.${NC}"
    fi
}

# Clear screen
clear

echo -e "${YELLOW}===== ContaCerta - Instalação Automática =====${NC}"
echo -e "${GREEN}Bem-vindo ao assistente de instalação do ContaCerta!${NC}"
echo ""

# Prompt for Server Address
while true; do
    echo "Escolha o tipo de endereço do servidor:"
    echo "1. Domínio"
    echo "2. Endereço IP"
    read -p "Selecione uma opção (1/2): " ADDRESS_TYPE

    case $ADDRESS_TYPE in
        1)
            read -p "Digite o domínio para o projeto (ex: contacerta.com.br): " SERVER_ADDRESS
            if validate_domain "$SERVER_ADDRESS"; then
                break
            else
                echo -e "${RED}Domínio inválido. Por favor, insira um domínio válido.${NC}"
            fi
            ;;
        2)
            read -p "Digite o endereço IP do servidor: " SERVER_ADDRESS
            if validate_ip "$SERVER_ADDRESS"; then
                break
            else
                echo -e "${RED}Endereço IP inválido. Por favor, insira um endereço IP válido.${NC}"
            fi
            ;;
        *)
            echo -e "${RED}Opção inválida. Escolha 1 ou 2.${NC}"
    esac
done

read -p "Digite o URL do repositório Git (ou deixe em branco para usar o padrão): " GIT_REPO
GIT_REPO=${GIT_REPO:-https://github.com/rayhenrique/ContaCerta.git}

read -p "Digite seu email de administrador: " ADMIN_EMAIL
while ! validate_email "$ADMIN_EMAIL"; do
    echo -e "${RED}Email inválido. Por favor, insira um email válido.${NC}"
    read -p "Digite seu email de administrador: " ADMIN_EMAIL
done

# SSL Configuration
if [[ "$ADDRESS_TYPE" -eq 1 ]]; then
    read -p "Deseja configurar certificado SSL para o domínio? (s/n): " SSL_CONFIG
    SSL_CONFIG=${SSL_CONFIG:-n}
fi

# Database Configuration
while true; do
    read -p "Digite o nome de usuário do MySQL (padrão: root): " MYSQL_USER
    MYSQL_USER=${MYSQL_USER:-root}

    read -sp "Digite a senha do MySQL: " MYSQL_PASSWORD
    echo ""

    read -p "Digite o nome do banco de dados (padrão: contacerta): " DB_NAME
    DB_NAME=${DB_NAME:-contacerta}

    # Optional: Validate MySQL connection
    if mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e ";" 2>/dev/null; then
        break
    else
        echo -e "${RED}Falha na conexão MySQL. Verifique suas credenciais.${NC}"
    fi
done

# Server Configuration
read -p "Deseja configurar um servidor de produção? (s/n): " PRODUCTION_SERVER
PRODUCTION_SERVER=${PRODUCTION_SERVER:-n}

if [[ "$PRODUCTION_SERVER" =~ ^[Ss]$ ]]; then
    read -p "Digite o usuário SSH para deploy: " SSH_USER
fi

# Confirm Installation
echo -e "\n${YELLOW}Resumo da Instalação:${NC}"
echo "Endereço do Servidor: $SERVER_ADDRESS"
echo "Repositório Git: $GIT_REPO"
echo "Email Admin: $ADMIN_EMAIL"
echo "Usuário MySQL: $MYSQL_USER"
echo "Nome do Banco de Dados: $DB_NAME"

read -p "Confirma estas informações? (s/n): " CONFIRM

if [[ "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo -e "\n${GREEN}Iniciando instalação...${NC}"

    # Clone Repository
    git clone "$GIT_REPO" .
    # Usando "." para clonar no diretório atual, em vez de criar uma subpasta

    # Backend Setup
    cd backend
    npm install
    cp .env.example .env

    # Update .env file with collected information
    sed -i "s/DB_USER=.*/DB_USER=$MYSQL_USER/" .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$MYSQL_PASSWORD/" .env
    sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
    sed -i "s/ADMIN_EMAIL=.*/ADMIN_EMAIL=$ADMIN_EMAIL/" .env
    sed -i "s/SERVER_ADDRESS=.*/SERVER_ADDRESS=$SERVER_ADDRESS/" .env

    # Database Setup
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
    npm run migrate
    npm run seed

    # Create Admin User (if not already exists)
    echo -e "\n${YELLOW}Criando usuário administrador...${NC}"
    node src/scripts/createAdmin.js || {
        echo -e "${RED}Falha ao criar usuário administrador.${NC}"
        exit 1
    }

    # Frontend Setup
    cd ../frontend
    npm install

    # Production Configuration (Optional)
    if [[ "$PRODUCTION_SERVER" =~ ^[Ss]$ ]]; then
        # Nginx configuration, PM2 setup, etc.
        echo "Configurações de produção serão implementadas"

        # SSL Configuration for Domain
        if [[ "$ADDRESS_TYPE" -eq 1 ]] && [[ "$SSL_CONFIG" =~ ^[Ss]$ ]]; then
            install_ssl_certificate "$SERVER_ADDRESS" "$ADMIN_EMAIL"
        fi
    fi

    echo -e "\n${GREEN}Instalação concluída com sucesso!${NC}"
    echo "Para iniciar o projeto:"
    echo "- Backend: npm run start (na pasta backend)"
    echo "- Frontend: npm run start (na pasta frontend)"

else
    echo -e "\n${RED}Instalação cancelada.${NC}"
fi
