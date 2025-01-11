# ContaCerta - Sistema de Gestão Financeira

O ContaCerta é um sistema de gestão financeira desenvolvido com React (frontend) e Node.js/Express (backend), utilizando MySQL como banco de dados. O sistema oferece uma gestão completa de receitas e despesas, com projeção mensal conservadora e controle detalhado do fluxo de caixa.

## Requisitos do Sistema

### Windows 11 (64 bits)
- Node.js 18.x ou superior
- MySQL 8.0 ou superior
- Git
- Visual Studio Code (recomendado)

### Ubuntu Server (Digital Ocean)
- Ubuntu 22.04 LTS
- Node.js 18.x
- MySQL 8.0
- Nginx
- PM2 (para gerenciamento de processos)
- Git

## Instalação Local (Windows 11)

1. **Instalar Dependências**
```bash
# Instalar Node.js
# Baixe e instale do site oficial: https://nodejs.org/

# Instalar MySQL
# Baixe e instale do site oficial: https://dev.mysql.com/downloads/installer/
```

2. **Clonar o Repositório**
```bash
git clone https://github.com/rayhenrique/ContaCerta.git
cd ContaCerta
```

3. **Configurar o Backend**
```bash
cd backend
npm install

# Criar arquivo .env
copy .env.example .env
# Edite o arquivo .env com suas configurações do MySQL
```

4. **Configurar o Frontend**
```bash
cd ../frontend
npm install

# Criar arquivo .env
copy .env.example .env
# Configure a URL da API se necessário
```

5. **Iniciar o Banco de Dados**
```bash
# No MySQL Command Line Client ou MySQL Workbench
CREATE DATABASE contacerta;
```

6. **Iniciar a Aplicação**
```bash
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm start
```

## Instalação no Ubuntu Server (Digital Ocean)

### Script de Instalação Automática

Crie um arquivo chamado `install.sh`:

```bash
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
```

### Script de Atualização com Backup

Crie um arquivo chamado `update.sh`:

```bash
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
```

### Uso dos Scripts

### Instalação Inicial

O script de instalação é interativo e guiará você através do processo:

```bash
# Fazer download do script
wget https://raw.githubusercontent.com/rayhenrique/ContaCerta/main/install.sh
chmod +x install.sh

# Executar instalação
./install.sh
```

O script solicitará as seguintes informações:

1. **Configuração do Ambiente**:
   - Domínio do site
   - Ambiente (production/development)

2. **Configuração do MySQL**:
   - Senha do root
   - Nome do banco de dados
   - Usuário do banco
   - Senha do usuário

3. **Configuração da Aplicação**:
   - Diretório de instalação
   - Chave secreta para JWT

Após confirmar as configurações, o script irá:
- Instalar todas as dependências
- Configurar o ambiente
- Instalar e configurar SSL (opcional)
- Iniciar todos os serviços

### Atualizações

O script de atualização é interativo e oferece várias opções:

```bash
# Fazer download do script
wget https://raw.githubusercontent.com/rayhenrique/ContaCerta/main/update.sh
chmod +x update.sh

# Executar atualização
./update.sh
```

O script oferece três opções:

1. **Atualizar o sistema**: Realiza backup automático e atualiza o sistema
2. **Apenas criar backup**: Cria backup do código e banco de dados
3. **Cancelar**: Sai do script sem fazer alterações

Para restaurar um backup específico:
```bash
./update.sh restore backup_code.tar.gz backup_db.sql
```

O script solicitará as seguintes informações:

1. **Configuração do Ambiente**:
   - Diretório da aplicação
   - Diretório para backups

2. **Configuração do MySQL**:
   - Usuário do banco
   - Senha do banco
   - Nome do banco de dados

Em caso de erro durante a atualização, o sistema será automaticamente restaurado para o último backup.

### Notas Importantes:
- Sempre edite as variáveis nos scripts antes de executar
- Mantenha os backups em local seguro
- Configure SSL após a instalação usando Certbot
- Ajuste as permissões de arquivos se necessário
- Monitore os logs após atualizações

## Funcionalidades Principais

### Dashboard
- Visão geral financeira em cards intuitivos
- Valores formatados no padrão brasileiro (R$ X.XXX,XX)
- Projeção mensal conservadora com margem de segurança
- Gráficos de evolução financeira
- Listagem de transações recentes
- Legendas explicativas em cada indicador

### Gestão de Receitas
- Cadastro e edição de receitas
- Status: Pendente, Confirmada, Cancelada
- Visualização em formato de grid
- Filtros e ordenação
- Campo para observações

### Gestão de Despesas
- Cadastro e edição de despesas
- Classificação: Fixa ou Variável
- Visualização em formato de grid
- Filtros e ordenação
- Campo para observações

### Segurança
- Autenticação de usuários
- Níveis de acesso (admin/operador)
- Proteção de rotas
- Tokens JWT
- Criptografia de senhas

## Estrutura do Projeto
```
ContaCerta/
├── backend/         # API Node.js/Express
│   ├── src/
│   │   ├── controllers/  # Controladores da aplicação
│   │   ├── models/      # Modelos Sequelize
│   │   ├── database/    # Migrações e configurações
│   │   ├── routes/     # Rotas da API
│   │   └── middleware/ # Middlewares
├── frontend/        # Aplicação React
│   ├── src/
│   │   ├── pages/      # Componentes de página
│   │   ├── components/ # Componentes reutilizáveis
│   │   ├── contexts/   # Contextos React
│   │   ├── services/   # Serviços de API
│   │   └── theme/      # Configuração do tema
├── docs/           # Documentação
└── README.md
```

## Documentação Adicional

- [Documentação Técnica](./docs/technical.md) - Detalhes técnicos do projeto
- Manual do Usuário - Disponível no menu do usuário na aplicação

## Suporte

Para suporte, entre em contato através do email: rayhenrique@gmail.com

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
