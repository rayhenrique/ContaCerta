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

# Função para backup
backup() {
    echo -e "${YELLOW}Criando backup...${NC}"
    
    # Criar diretório de backup se não existir
    mkdir -p $BACKUP_DIR

    # Backup do código
    tar -czf $BACKUP_DIR/contacerta_code_$DATE.tar.gz $APP_DIR

    # Backup do banco de dados
    mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/contacerta_db_$DATE.sql

    echo -e "${GREEN}Backup criado em $BACKUP_DIR${NC}"
}

# Função para restaurar
restore() {
    local BACKUP_CODE=$1
    local BACKUP_DB=$2

    echo -e "${YELLOW}Restaurando backup...${NC}"

    # Restaurar código
    cd $APP_DIR
    tar -xzf $BACKUP_CODE -C /

    # Restaurar banco de dados
    mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < $BACKUP_DB

    # Reconstruir e reiniciar
    cd $APP_DIR/frontend && npm install && npm run build
    cd $APP_DIR/backend && npm install
    pm2 restart contacerta-backend

    echo -e "${GREEN}Restauração concluída!${NC}"
}

clear
echo -e "${GREEN}=== ContaCerta - Assistente de Atualização ===${NC}\n"

# Verificar se é uma restauração
if [ "$1" = "restore" ]; then
    if [ -z "$2" ] || [ -z "$3" ]; then
        echo -e "${RED}Erro: Forneça os arquivos de backup do código e do banco de dados${NC}"
        echo "Uso: $0 restore backup_code.tar.gz backup_db.sql"
        exit 1
    fi
    
    # Solicitar configurações para restauração
    echo -e "${GREEN}Configuração para Restauração${NC}"
    echo -e "------------------------"
    APP_DIR=$(get_input "Diretório da aplicação" "/var/www/ContaCerta")
    MYSQL_USER=$(get_input "Usuário do banco de dados" "contacerta")
    MYSQL_PASSWORD=$(get_password "Senha do banco de dados: ")
    MYSQL_DATABASE=$(get_input "Nome do banco de dados" "contacerta")
    
    # Confirmar restauração
    echo -e "\n${YELLOW}Você está prestes a restaurar:${NC}"
    echo "Código: $2"
    echo "Banco de dados: $3"
    echo -ne "\nConfirma a restauração? (S/n): "
    read confirm
    if [[ $confirm =~ ^[Nn] ]]; then
        echo -e "${RED}Restauração cancelada pelo usuário${NC}"
        exit 1
    fi
    
    restore $2 $3
    exit 0
fi

# Solicitar configurações para atualização
echo -e "${GREEN}Configuração do Ambiente${NC}"
echo -e "------------------------"
APP_DIR=$(get_input "Diretório da aplicação" "/var/www/ContaCerta")
BACKUP_DIR=$(get_input "Diretório para backups" "/var/www/backups")

echo -e "\n${GREEN}Configuração do MySQL${NC}"
echo -e "------------------------"
MYSQL_USER=$(get_input "Usuário do banco de dados" "contacerta")
MYSQL_PASSWORD=$(get_password "Senha do banco de dados: ")
MYSQL_DATABASE=$(get_input "Nome do banco de dados" "contacerta")

# Data para o backup
DATE=$(date +%Y%m%d_%H%M%S)

# Mostrar resumo
echo -e "\n${GREEN}Resumo da Atualização:${NC}"
echo -e "------------------------"
echo "Diretório da Aplicação: $APP_DIR"
echo "Diretório de Backups: $BACKUP_DIR"
echo "Banco de Dados: $MYSQL_DATABASE"
echo "Usuário BD: $MYSQL_USER"

# Confirmar ação
echo -e "\n${YELLOW}O que você deseja fazer?${NC}"
echo "1. Atualizar o sistema (com backup automático)"
echo "2. Apenas criar backup"
echo "3. Cancelar"
echo -ne "\nEscolha uma opção (1-3): "
read option

case $option in
    1)
        # Criar backup antes de atualizar
        backup

        # Tentar atualizar
        echo -e "\n${YELLOW}Iniciando atualização...${NC}"
        cd $APP_DIR

        # Salvar hash atual para possível rollback
        CURRENT_HASH=$(git rev-parse HEAD)

        # Atualizar código
        if git pull origin main; then
            # Atualizar backend
            cd $APP_DIR/backend
            npm install
            
            # Executar migrações
            if npx sequelize-cli db:migrate; then
                # Atualizar frontend
                cd $APP_DIR/frontend
                npm install
                npm run build

                # Reiniciar serviços
                pm2 restart contacerta-backend
                sudo systemctl reload nginx

                echo -e "\n${GREEN}Atualização concluída com sucesso!${NC}"
                echo -e "\n${YELLOW}Backups salvos em:${NC}"
                echo "Código: $BACKUP_DIR/contacerta_code_$DATE.tar.gz"
                echo "Banco de Dados: $BACKUP_DIR/contacerta_db_$DATE.sql"
            else
                echo -e "\n${RED}Erro nas migrações. Iniciando rollback...${NC}"
                # Reverter migrações
                npx sequelize-cli db:migrate:undo:all
                
                # Restaurar último backup
                restore $BACKUP_DIR/contacerta_code_$DATE.tar.gz $BACKUP_DIR/contacerta_db_$DATE.sql
            fi
        else
            echo -e "\n${RED}Erro ao atualizar código. Mantendo versão atual.${NC}"
        fi
        ;;
    2)
        backup
        echo -e "\n${GREEN}Backup criado com sucesso!${NC}"
        echo -e "${YELLOW}Arquivos salvos em:${NC}"
        echo "Código: $BACKUP_DIR/contacerta_code_$DATE.tar.gz"
        echo "Banco de Dados: $BACKUP_DIR/contacerta_db_$DATE.sql"
        ;;
    3)
        echo -e "\n${YELLOW}Operação cancelada pelo usuário${NC}"
        exit 0
        ;;
    *)
        echo -e "\n${RED}Opção inválida${NC}"
        exit 1
        ;;
esac
