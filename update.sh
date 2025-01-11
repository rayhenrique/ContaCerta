#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
APP_DIR="/var/www/ContaCerta"
BACKUP_DIR="/var/www/backups"
MYSQL_USER="contacerta"
MYSQL_PASSWORD="sua_senha_db"
MYSQL_DATABASE="contacerta"
DATE=$(date +%Y%m%d_%H%M%S)

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

# Verificar se é uma restauração
if [ "$1" = "restore" ]; then
    if [ -z "$2" ] || [ -z "$3" ]; then
        echo -e "${RED}Erro: Forneça os arquivos de backup do código e do banco de dados${NC}"
        echo "Uso: $0 restore backup_code.tar.gz backup_db.sql"
        exit 1
    fi
    restore $2 $3
    exit 0
fi

# Criar backup antes de atualizar
backup

# Tentar atualizar
echo -e "${YELLOW}Iniciando atualização...${NC}"
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

        echo -e "${GREEN}Atualização concluída com sucesso!${NC}"
    else
        echo -e "${RED}Erro nas migrações. Iniciando rollback...${NC}"
        # Reverter migrações
        npx sequelize-cli db:migrate:undo:all
        
        # Restaurar último backup
        LAST_CODE_BACKUP=$(ls -t $BACKUP_DIR/contacerta_code_*.tar.gz | head -n1)
        LAST_DB_BACKUP=$(ls -t $BACKUP_DIR/contacerta_db_*.sql | head -n1)
        restore $LAST_CODE_BACKUP $LAST_DB_BACKUP
    fi
else
    echo -e "${RED}Erro ao atualizar código. Mantendo versão atual.${NC}"
fi
