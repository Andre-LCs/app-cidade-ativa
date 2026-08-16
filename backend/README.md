# Cidade Ativa — Back-end

API responsável pela comunicação entre o aplicativo mobile e o banco de dados do projeto Cidade Ativa.

O back-end utiliza Node.js e Express e será responsável pelas regras do sistema, autenticação dos usuários, gerenciamento das ocorrências e comunicação com o PostgreSQL.

## Tecnologias

* Node.js
* Express
* PostgreSQL
* `pg`
* dotenv
* CORS
* bcrypt
* jsonwebtoken

## Como configurar o projeto

A estrutura inicial do backend já está no GitHub. Quem for trabalhar no backend não precisa configurar um PostgreSQL local. O projeto usa o PostgreSQL hospedado no Neon, então todos vão trabalhar sobre o mesmo banco.

### 1. Clonar o projeto

```
git clone https://github.com/Andre-LCs/app-cidade-ativa.git
cd app-cidade-ativa

```

Entre na pasta do backend:

```
cd backend

```

### 2. Instalar as dependências

Na pasta `backend`:

```
npm install

```

Isso instala as dependências definidas no `package.json`.

### 3. Configurar o `.env`

Cada pessoa que for executar o backend deve criar seu próprio arquivo:

```
backend/.env

```

O arquivo `.env` **não está no GitHub**

Podem copiar a estrutura de:

```

backend/.env.example

```

que serve como modelo.

Copie o `.env.example` para `.env` e preencha as variáveis com os valores fornecidos para o projeto:

```env
DATABASE_URL=
PORT=3000
JWT_SECRET=
```

A `DATABASE_URL` contém os dados de acesso ao PostgreSQL do projeto.

O `JWT_SECRET` é utilizado para gerar e validar os tokens JWT.

Não commitar o **.env.**

### 4. Banco de dados

O banco PostgreSQL já está criado no Neon.

A estrutura inicial está em:

```
backend/db/schema.sql
```

A tabela `usuarios` já foi criada no banco.

Portanto, **não é necessário criar outro banco ou outra tabela localmente**.

Alterações na estrutura do banco devem ser registradas no:

```text
backend/db/schema.sql
```

e aplicadas ao banco do projeto quando necessário.

## Executando o backend

Para iniciar o servidor:

```
node index.js
```

Se estiver tudo correto, será exibido:

```
Servidor rodando na porta 3000
```

A API possui uma rota inicial para verificar se o servidor está funcionando:

```
GET /health
```

Acesse:

```
http://localhost:3000/health
```

Resultado esperado:

```json
{
  "status": "ok"
}
```

## Autenticação

O projeto utiliza JWT para autenticação.

O arquivo:

```
backend/auth.js
```

contém o middleware utilizado para verificar tokens JWT nas rotas protegidas.

As rotas que exigirem autenticação deverão utilizar esse middleware.

O token deverá identificar o usuário autenticado para que o backend consiga realizar operações relacionadas à sua conta.

## API

Antes de implementar uma rota, consulte o:

```
API.md
```

Esse arquivo define o contrato da API, incluindo:

* método HTTP;
* endereço da rota;
* dados recebidos;
* autenticação;
* formato das respostas;
* possíveis erros.

O front-end também utilizará esse contrato para realizar as requisições.

## Primeira entrega

Para a primeira entrega, o foco do backend será colocar o seguinte fluxo para funcionar:

```
Cadastro
   ↓
Login
   ↓
Autenticação
   ↓
Editar perfil
   ↓
Dados atualizados no PostgreSQL
```

### Cadastro

Implementar:

```
POST /cadastro
```

A rota deverá:

1. receber nome, e-mail e senha;
2. validar os dados;
3. verificar se o e-mail já está cadastrado;
4. utilizar `bcrypt` para gerar o `senha_hash`;
5. inserir o usuário no PostgreSQL;
6. retornar a resposta definida no `API.md`.

A senha **nunca deve ser armazenada diretamente no banco**.

### Login

Implementar:

```
POST /login
```

A rota deverá:

1. receber e-mail e senha;
2. procurar o usuário no PostgreSQL;
3. comparar a senha recebida com `senha_hash` utilizando `bcrypt`;
4. gerar um JWT utilizando `jsonwebtoken`;
5. retornar a resposta definida no `API.md`.

O token deverá conter o identificador do usuário para permitir que as rotas protegidas saibam qual usuário está realizando a operação.

### Edição de perfil

Implementar a rota definida no `API.md` para edição dos dados do usuário.

A rota deverá:

1. verificar o JWT;
2. identificar o usuário autenticado;
3. receber os dados permitidos para alteração;
4. atualizar o registro correspondente no PostgreSQL;
5. retornar a resposta definida no `API.md`.

## Organização do desenvolvimento

Cada integrante deve trabalhar em uma branch própria.

Exemplo para cadastro:

```bash
git checkout main
git pull
git checkout -b feature/cadastro
```

Exemplo para login:

```bash
git checkout main
git pull
git checkout -b feature/login
```

Depois de finalizar a tarefa:

```bash
git add .
git commit -m "Implementa cadastro"
git push -u origin feature/cadastro
```

ou:

```bash
git add .
git commit -m "Implementa login"
git push -u origin feature/login
```

Depois, abrir um Pull Request para `main`.

Antes de começar uma nova tarefa, atualize sua branch com a versão mais recente da `main`.

## Estrutura atual

```text
backend/
├── db/
│   └── schema.sql
├── .env.example
├── auth.js
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

Novos arquivos e pastas podem ser criados conforme a implementação das funcionalidades.
