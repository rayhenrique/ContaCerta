# ContaCerta - Sistema de Gestão Financeira

O ContaCerta é um sistema de gestão financeira desenvolvido com React (frontend) e Node.js/Express (backend), utilizando MySQL como banco de dados.

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

1. **Atualizar o Sistema**
```bash
sudo apt update
sudo apt upgrade -y
```

2. **Instalar Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Instalar MySQL**
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Criar banco e usuário
sudo mysql
CREATE DATABASE contacerta;
CREATE USER 'contacerta'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON contacerta.* TO 'contacerta'@'localhost';
FLUSH PRIVILEGES;
exit;
```

4. **Instalar Nginx**
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

5. **Instalar PM2**
```bash
sudo npm install -g pm2
```

6. **Clonar e Configurar o Projeto**
```bash
cd /var/www
sudo git clone https://github.com/rayhenrique/ContaCerta.git
cd ContaCerta

# Configurar Backend
cd backend
sudo npm install
sudo cp .env.example .env
sudo nano .env  # Configure as variáveis de ambiente

# Configurar Frontend
cd ../frontend
sudo npm install
sudo cp .env.example .env
sudo nano .env  # Configure a URL da API
npm run build
```

7. **Configurar Nginx**
```bash
sudo nano /etc/nginx/sites-available/contacerta

# Adicione a configuração:
server {
    listen 80;
    server_name seu_dominio.com;

    # Frontend
    location / {
        root /var/www/ContaCerta/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar o site
sudo ln -s /etc/nginx/sites-available/contacerta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Iniciar a Aplicação com PM2**
```bash
cd /var/www/ContaCerta/backend
pm2 start src/server.js --name contacerta-backend

# Salvar configuração do PM2
pm2 save
pm2 startup
```

9. **Configurar SSL (Opcional mas Recomendado)**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu_dominio.com
```

## Estrutura do Projeto
```
ContaCerta/
├── backend/         # API Node.js/Express
├── frontend/        # Aplicação React
├── docs/           # Documentação adicional
└── README.md
```

## Funcionalidades Principais
- Autenticação de usuários
- Gestão de categorias
- Controle de receitas e despesas
- Relatórios financeiros
- Perfis de usuário (admin/operador)

## Suporte

Para suporte, entre em contato através do email: rayhenrique@gmail.com

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
