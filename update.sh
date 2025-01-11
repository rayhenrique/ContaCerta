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

# Função para listar backups
list_backups() {
    local backup_dir=$1
    local type=$2
    
    echo -e "\n${GREEN}Backups $type disponíveis:${NC}"
    local count=1
    
    if [ "$type" == "código" ]; then
        for backup in $backup_dir/contacerta_code_*.tar.gz; do
            if [ -f "$backup" ]; then
                echo "$count) $(basename $backup) ($(date -r $backup '+%d/%m/%Y %H:%M:%S'))"
                count=$((count + 1))
            fi
        done
    else
        for backup in $backup_dir/contacerta_db_*.sql; do
            if [ -f "$backup" ]; then
                echo "$count) $(basename $backup) ($(date -r $backup '+%d/%m/%Y %H:%M:%S'))"
                count=$((count + 1))
            fi
        done
    fi
    
    if [ $count -eq 1 ]; then
        echo "Nenhum backup encontrado"
        return 1
    fi
    return 0
}

# Função para selecionar backup
select_backup() {
    local backup_dir=$1
    local type=$2
    local pattern=$3
    
    local backups=()
    while IFS= read -r -d $'\0' file; do
        backups+=("$file")
    done < <(find "$backup_dir" -name "$pattern" -print0 | sort -z -r)
    
    if [ ${#backups[@]} -eq 0 ]; then
        return 1
    fi
    
    echo -e "\n${GREEN}Backups $type disponíveis:${NC}"
    for i in "${!backups[@]}"; do
        echo "$((i+1))) $(basename "${backups[$i]}") ($(date -r "${backups[$i]}" '+%d/%m/%Y %H:%M:%S'))"
    done
    
    while true; do
        echo -ne "\n${YELLOW}Selecione o número do backup ou 0 para cancelar: ${NC}"
        read choice
        
        if [ "$choice" = "0" ]; then
            return 1
        fi
        
        if [ "$choice" -ge 1 ] && [ "$choice" -le "${#backups[@]}" ]; then
            echo "${backups[$((choice-1))]}"
            return 0
        fi
        
        echo -e "${RED}Opção inválida${NC}"
    done
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

# Função para restaurar
restore() {
    local BACKUP_CODE=$1
    local BACKUP_DB=$2

    echo -e "${YELLOW}Restaurando backup...${NC}"

    # Restaurar código
    echo -e "\n${YELLOW}Restaurando código...${NC}"
    cd $APP_DIR
    tar -xzf $BACKUP_CODE -C /

    if [ $? -ne 0 ]; then
        echo -e "${RED}Erro ao restaurar código${NC}"
        return 1
    fi

    # Restaurar banco de dados
    echo -e "\n${YELLOW}Restaurando banco de dados...${NC}"
    mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < $BACKUP_DB

    if [ $? -ne 0 ]; then
        echo -e "${RED}Erro ao restaurar banco de dados${NC}"
        return 1
    fi

    # Reconstruir e reiniciar
    echo -e "\n${YELLOW}Reconstruindo aplicação...${NC}"
    
    # Frontend
    cd $APP_DIR/frontend
    npm install
    npm run build

    # Backend
    cd $APP_DIR/backend
    npm install
    pm2 restart contacerta-backend

    echo -e "${GREEN}Restauração concluída com sucesso!${NC}"
    return 0
}

clear
echo -e "${GREEN}=== ContaCerta - Assistente de Atualização ===${NC}\n"

# Solicitar configurações
echo -e "${GREEN}Configuração do Ambiente${NC}"
echo -e "------------------------"
APP_DIR=$(get_input "Diretório da aplicação" "/var/www/ContaCerta")
BACKUP_DIR=$(get_input "Diretório para backups" "/var/www/backups")

echo -e "\n${GREEN}Configuração do MySQL${NC}"
echo -e "------------------------"
MYSQL_USER=$(get_input "Usuário do banco de dados" "root")
MYSQL_PASSWORD=$(get_password "Senha do banco de dados: ")
MYSQL_DATABASE=$(get_input "Nome do banco de dados" "contacerta")

# Data para o backup
DATE=$(date +%Y%m%d_%H%M%S)

# Menu principal
while true; do
    echo -e "\n${GREEN}=== Menu Principal ===${NC}"
    echo "1. Atualizar sistema (com backup automático)"
    echo "2. Criar backup"
    echo "3. Restaurar backup"
    echo "4. Sair"
    
    echo -ne "\n${YELLOW}Escolha uma opção (1-4): ${NC}"
    read option

    case $option in
        1)
            # Criar backup antes de atualizar
            echo -e "\n${YELLOW}Criando backup antes da atualização...${NC}"
            backup

            if [ $? -ne 0 ]; then
                echo -e "${RED}Falha ao criar backup. Atualização cancelada.${NC}"
                continue
            fi

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
            ;;
        3)
            echo -e "\n${GREEN}=== Restauração de Backup ===${NC}"
            
            # Selecionar backup do código
            BACKUP_CODE=$(select_backup "$BACKUP_DIR" "código" "contacerta_code_*.tar.gz")
            if [ $? -ne 0 ]; then
                echo -e "${RED}Seleção de backup de código cancelada${NC}"
                continue
            fi

            # Selecionar backup do banco de dados
            BACKUP_DB=$(select_backup "$BACKUP_DIR" "banco de dados" "contacerta_db_*.sql")
            if [ $? -ne 0 ]; then
                echo -e "${RED}Seleção de backup de banco de dados cancelada${NC}"
                continue
            fi

            echo -e "\n${YELLOW}Você selecionou:${NC}"
            echo "Código: $(basename $BACKUP_CODE)"
            echo "Banco de Dados: $(basename $BACKUP_DB)"
            
            echo -ne "\n${YELLOW}Confirma a restauração? (S/n): ${NC}"
            read confirm
            if [[ $confirm =~ ^[Nn] ]]; then
                echo -e "${RED}Restauração cancelada pelo usuário${NC}"
                continue
            fi

            restore "$BACKUP_CODE" "$BACKUP_DB"
            ;;
        4)
            echo -e "\n${GREEN}Saindo...${NC}"
            exit 0
            ;;
        *)
            echo -e "\n${RED}Opção inválida${NC}"
            ;;
    esac
done
