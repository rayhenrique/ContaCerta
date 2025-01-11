# ContaCerta - Documentação Técnica

## Visão Geral
ContaCerta é uma aplicação de gestão financeira desenvolvida com React no frontend e Node.js/Express no backend, utilizando MySQL como banco de dados.

## Arquitetura

### Frontend (React/TypeScript)
- **Estrutura de Diretórios**:
  - `/src/pages`: Componentes de página
  - `/src/components`: Componentes reutilizáveis
  - `/src/contexts`: Contextos React (AuthContext)
  - `/src/services`: Serviços de API
  - `/src/theme`: Configuração do tema Material-UI

### Backend (Node.js/Express)
- **Estrutura de Diretórios**:
  - `/src/controllers`: Controladores da aplicação
  - `/src/models`: Modelos Sequelize
  - `/src/database`: Migrações e configurações
  - `/src/routes`: Rotas da API
  - `/src/middleware`: Middlewares (autenticação, etc.)

## Modelos de Dados

### User
- `id`: INT (PK)
- `name`: STRING
- `email`: STRING (unique)
- `password`: STRING (hashed)
- `accessLevel`: ENUM('admin', 'operator')

### Revenue
- `id`: INT (PK)
- `description`: STRING
- `value`: DECIMAL
- `date`: DATE
- `status`: STRING ('pending', 'confirmed', 'cancelled')
- `observation`: TEXT
- `userId`: INT (FK)

### Expense
- `id`: INT (PK)
- `description`: STRING
- `value`: DECIMAL
- `date`: DATE
- `type`: STRING ('fixed', 'variable')
- `observation`: TEXT
- `userId`: INT (FK)

## Componentes

### Dashboard
- **Cards de Resumo**:
  - Receitas: Total de receitas do mês atual
  - Despesas: Total de despesas do mês atual
  - Saldo: Diferença entre receitas e despesas
  - Projeção Mensal: Previsão baseada em receitas e despesas futuras
- **Formatação**:
  - Valores monetários no padrão brasileiro (R$ X.XXX,XX)
  - Legendas explicativas em cada card
  - Layout responsivo com grid system
  - Gradientes personalizados para cada card

## APIs

### Autenticação
- `POST /auth/login`: Login do usuário
  - Body: `{ email, password }`
  - Response: `{ user, token }`

### Receitas
- `GET /revenues`: Lista receitas
- `POST /revenues`: Cria receita
- `PUT /revenues/:id`: Atualiza receita
- `DELETE /revenues/:id`: Remove receita

### Despesas
- `GET /expenses`: Lista despesas
- `POST /expenses`: Cria despesa
- `PUT /expenses/:id`: Atualiza despesa
- `DELETE /expenses/:id`: Remove despesa

### Dashboard
- `GET /dashboard/projection`: Retorna projeção mensal
  - Considera receitas confirmadas
  - Soma despesas fixas
  - Calcula média de despesas variáveis
  - Aplica margem de segurança de 10%

## Segurança
- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Validação de dados em todas as rotas
- Proteção contra XSS e CSRF
- Controle de acesso baseado em roles

## Dependências Principais

### Frontend
- `@mui/material`: UI components
- `axios`: Cliente HTTP
- `react-router-dom`: Roteamento
- `react-number-format`: Formatação de números

### Backend
- `express`: Framework web
- `sequelize`: ORM
- `bcryptjs`: Criptografia
- `jsonwebtoken`: Autenticação
- `mysql2`: Driver MySQL

## Configuração do Ambiente

### Requisitos
- Node.js >= 14
- MySQL >= 8
- npm ou yarn

### Variáveis de Ambiente
```env
# Backend
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=contacerta
JWT_SECRET=your_jwt_secret

# Frontend
REACT_APP_API_URL=http://localhost:3001
```

## Scripts Disponíveis
```bash
# Frontend
npm start     # Inicia servidor de desenvolvimento
npm build     # Gera build de produção
npm test      # Executa testes

# Backend
npm start     # Inicia servidor
npm migrate   # Executa migrações
npm seed      # Executa seeders
