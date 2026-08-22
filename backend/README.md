# Cidade Ativa — Back-end

API responsável pela comunicação entre o aplicativo mobile e o banco de dados do projeto **Cidade Ativa**.

O back-end utiliza **Node.js** e **Express** e é responsável pelas regras do sistema, autenticação dos usuários, gerenciamento dos dados e comunicação com o PostgreSQL.

## Tecnologias

* Node.js
* Express
* PostgreSQL
* `pg`
* dotenv
* CORS
* bcrypt
* jsonwebtoken
* Docker
* Docker Compose

## Banco de dados

O projeto utiliza PostgreSQL hospedado no **Neon**.

Não é necessário configurar um PostgreSQL local para executar o back-end.

A estrutura do banco está registrada em:

```text
backend/db/schema.sql
```

A tabela `usuarios` possui atualmente os seguintes campos:

```text
id
nome
email
senha_hash
criado_em
atualizado_em
```

Alterações na estrutura do banco devem ser registradas no `schema.sql` e aplicadas ao banco do projeto quando necessário.

## Como configurar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/Andre-LCs/app-cidade-ativa.git
cd app-cidade-ativa/backend
```

### 2. Configurar o `.env`

Cada integrante deve criar seu próprio arquivo:

```text
backend/.env
```

O arquivo `.env` **não deve ser enviado para o GitHub**.

Utilize o `.env.example` como referência:

```env
DATABASE_URL=
PORT=3000
JWT_SECRET=
```

A `DATABASE_URL` contém os dados de acesso ao PostgreSQL do projeto.

O `JWT_SECRET` é utilizado para gerar e validar os tokens JWT.

### 3. Instalar as dependências

Caso o projeto seja executado diretamente pelo Node.js:

```bash
npm install
```

## Executando com Docker

O back-end possui configuração para execução utilizando **Docker** e **Docker Compose**.

O Docker é utilizado para padronizar o ambiente de execução do servidor Node.js.

O PostgreSQL **não é executado dentro do Docker**. O container do back-end continua se conectando ao PostgreSQL hospedado no Neon.

Para iniciar o back-end:

```bash
docker compose up --build
```

O servidor será iniciado na porta `3000`.

Depois que a imagem já tiver sido construída, não é necessário utilizar `--build` novamente, a menos que ocorram alterações no `Dockerfile` ou nas dependências:

```bash
docker compose up
```

Para parar o container:

```bash
docker compose down
```

## Verificando o funcionamento

Com o back-end em execução, acesse:

```text
http://localhost:3000/health
```

Ou utilize:

```bash
curl http://localhost:3000/health
```

Resultado esperado:

```json
{
  "status": "ok"
}
```

## Executando sem Docker

Também é possível executar o back-end diretamente pelo Node.js.

Na pasta `backend`:

```bash
npm install
node index.js
```

Resultado esperado:

```text
Servidor rodando na porta 3000
```

## Autenticação

O projeto utiliza **JWT (JSON Web Token)** para autenticação.

O arquivo:

```text
backend/auth.js
```

contém o middleware responsável por verificar os tokens enviados nas rotas protegidas.

As rotas autenticadas utilizam o header:

```text
Authorization: Bearer <token>
```

O token identifica o usuário autenticado e permite que o back-end saiba qual usuário está realizando a operação.

## API

O contrato oficial da API está documentado no arquivo:

```text
API.md
```

Esse arquivo define:

* métodos HTTP;
* endereços das rotas;
* dados recebidos;
* autenticação;
* formatos das respostas;
* códigos HTTP;
* possíveis erros.

As quatro rotas da primeira entrega já estão implementadas:

```text
POST /cadastro
POST /login
GET /usuario/me
PUT /usuario/me
```

## Primeira entrega

O fluxo implementado no back-end é:

```text
Cadastro
   ↓
Login
   ↓
Autenticação JWT
   ↓
Consulta do perfil
   ↓
Edição do perfil
   ↓
Dados atualizados no PostgreSQL
```

### Cadastro

**POST `/cadastro`**

Responsável por criar um novo usuário.

O back-end:

* recebe nome, e-mail e senha;
* valida os dados;
* verifica se o e-mail já está cadastrado;
* utiliza `bcrypt` para gerar o `senha_hash`;
* armazena o usuário no PostgreSQL;
* retorna os dados permitidos pelo contrato da API.

A senha nunca é armazenada em texto puro e nunca é retornada pela API.

### Login

**POST `/login`**

Responsável por autenticar o usuário.

O back-end:

* recebe e-mail e senha;
* procura o usuário no PostgreSQL;
* compara a senha recebida com o `senha_hash` utilizando `bcrypt`;
* gera um JWT utilizando `jsonwebtoken`;
* retorna o token e os dados básicos do usuário.

### Consulta do usuário

**GET `/usuario/me`**

Rota protegida pelo JWT.

O back-end:

* verifica o token;
* identifica o usuário autenticado;
* busca os dados no PostgreSQL;
* retorna os dados do usuário.

### Atualização do usuário

**PUT `/usuario/me`**

Rota protegida pelo JWT.

Permite atualizar os dados permitidos do usuário, como nome e e-mail.

O back-end identifica o usuário através do JWT e atualiza o registro correspondente no PostgreSQL.

## Estrutura atual

```text
backend/
├── db/
│   ├── pool.js
│   └── schema.sql
├── routes/
│   ├── cadastro.js
│   ├── login.js
│   └── usuario.js
├── .dockerignore
├── .env.example
├── auth.js
├── Dockerfile
├── docker-compose.yml
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

## Organização do desenvolvimento

Cada integrante deve trabalhar em uma branch própria.

Para iniciar uma nova tarefa:

```bash
git checkout main
git pull origin main
git checkout -b feature/nome-da-tarefa
```

Depois de finalizar:

```bash
git add .
git commit -m "Descrição da alteração"
git push -u origin feature/nome-da-tarefa
```

Depois, abrir um **Pull Request** para `main`.

Antes de iniciar uma nova tarefa, atualizar a branch com a versão mais recente da `main`.

## Segurança

Informações sensíveis não devem ser commitadas no repositório.

O arquivo `.env` é ignorado pelo Git e pelo Docker através do `.gitignore` e `.dockerignore`.

Nunca colocar no código-fonte:

* senha do banco;
* `DATABASE_URL`;
* `JWT_SECRET`;
* outras credenciais ou tokens.
