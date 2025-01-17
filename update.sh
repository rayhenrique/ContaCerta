#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações padrão
APP_DIR="/root/ContaCerta"
BACKUP_DIR="/root/backups"
MYSQL_USER="root"
MYSQL_DATABASE="contacerta"

# Arquivo de configuração segura para senha
MYSQL_PASSWORD_FILE="/root/.mysql_password"

# Verificar arquivo de senha
if [ ! -f "$MYSQL_PASSWORD_FILE" ]; then
    echo -e "${RED}Erro: Arquivo de senha MySQL não encontrado em $MYSQL_PASSWORD_FILE${NC}"
    exit 1
fi

# Carregar senha do MySQL
MYSQL_PASSWORD=$(cat "$MYSQL_PASSWORD_FILE")

# Data para o backup
DATE=$(date +%Y%m%d_%H%M%S)

# Função de backup
backup() {
    echo -e "${YELLOW}Criando backup...${NC}"
    
    # Criar diretório de backup se não existir
    mkdir -p $BACKUP_DIR

    # Backup do código
    tar -czf $BACKUP_DIR/contacerta_code_$DATE.tar.gz $APP_DIR

    # Backup do banco de dados
    mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/contacerta_db_$DATE.sql

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Backup criado com sucesso em:${NC}"
        echo "Código: $BACKUP_DIR/contacerta_code_$DATE.tar.gz"
        echo "Banco de Dados: $BACKUP_DIR/contacerta_db_$DATE.sql"
        return 0
    else
        echo -e "${RED}Erro ao criar backup${NC}"
        return 1
    fi
}

# Função de atualização
update_system() {
    # Criar backup antes de atualizar
    echo -e "\n${YELLOW}Criando backup antes da atualização...${NC}"
    backup

    if [ $? -ne 0 ]; then
        echo -e "${RED}Falha ao criar backup. Atualização cancelada.${NC}"
        return 1
    fi

    # Atualizar
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
            return 0
        else
            echo -e "\n${RED}Erro nas migrações. Iniciando rollback...${NC}"
            # Reverter migrações
            npx sequelize-cli db:migrate:undo:all
            return 1
        fi
    else
        echo -e "\n${RED}Erro ao atualizar código. Mantendo versão atual.${NC}"
        return 1
    fi
}

# Modo de execução
if [ "$1" == "auto" ]; then
    # Modo automático
    update_system
else
    # Menu interativo
    clear
    echo -e "${GREEN}=== ContaCerta - Assistente de Atualização ===${NC}\n"

    while true; do
        echo -e "\n${GREEN}=== Menu Principal ===${NC}"
        echo "1. Atualizar sistema (com backup automático)"
        echo "2. Criar backup manual"
        echo "3. Sair"
        
        echo -ne "\n${YELLOW}Escolha uma opção (1-3): ${NC}"
        read option

        case $option in
            1)
                update_system
                ;;
            2)
                backup
                ;;
            3)
                echo -e "\n${GREEN}Saindo...${NC}"
                exit 0
                ;;
            *)
                echo -e "\n${RED}Opção inválida${NC}"
                ;;
        esac
    done
fi