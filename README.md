## Cidade Ativa

Aplicativo de denúncia e mapeamento de problemas urbanos, como buracos, iluminação, lixo, mato alto, entre outros.

A ideia inicial é permitir que qualquer pessoa registre problemas da cidade por meio de uma foto e da localização do ocorrido.

Esses registros poderão aparecer em um mapa, criando uma visão mais clara dos problemas urbanos e permitindo que outras pessoas acompanhem e apoiem as ocorrências.

## Integrantes

- André Lucas Aquino Carneiro e Silva
- Felipe Rogério Pereira Soares
- Gabriely Rocha Nascimento
- Isabela Alecrim de França
- Jadson Lopes Fonseca
- Karla Léa Nascimento Querre
- Matheus Fernandes Cardoso da Conceição
- Rafael Ferreira Tassinari
- Ruan Evangelista Gomes
- Thalita Kamille Soares Veras
- Tuliane Lima Carneiro

## Ideia inicial do projeto

O usuário poderá registrar um problema urbano informando uma foto e a localização do ocorrido.

As ocorrências poderão ser exibidas em um mapa público para que outros usuários consigam visualizar os problemas existentes em determinada região.

Também está prevista a possibilidade de acompanhar o andamento das ocorrências por meio de diferentes status, como:

- Enviado;
- Em análise;
- Resolvido.

Outros usuários poderão apoiar ou interagir com as ocorrências, aumentando sua visibilidade.

## Funcionalidades inicialmente previstas

- Cadastro e login de usuários;
- Registro de problemas urbanos;
- Utilizar a localização do celular;
- Registro de fotos das ocorrências;
- Visualização das ocorrências em um mapa;
- Acompanhamento do status das ocorrências;
- Apoiar ou validar ocorrências registradas por outros usuários;
- Informar se determinado problema ainda existe ou foi resolvido.
- Armazenamento externo de imagens;

## Possibilidades

Além das funcionalidades iniciais, algumas ideias estão sendo avaliadas para versões futuras do projeto:

- Identificação de possíveis ocorrências duplicadas;
- Diferenciação entre problemas permanentes e temporários;
- Sistema de prioridade baseado em confirmações, gravidade e tempo sem solução;
- Histórico das alterações das ocorrências;
- Usuários da população e usuários de prefeituras;
- Gamificação por meio de pontos ou XP;
- Autenticação por meio do gov.br;
- Painel para acompanhamento de ocorrências por órgãos públicos.


## Arquitetura

A arquitetura inicial está sendo estruturada utilizando uma aplicação mobile, uma API de back-end e um banco de dados PostgreSQL.

Front-end

A aplicação mobile será desenvolvida utilizando React Native.

O front-end ficará responsável pelas telas e interações com o usuário, incluindo:

Cadastro;
Login;
Mapa;
Registro de ocorrências;
Câmera;
Localização;
Visualização das ocorrências;
Acompanhamento dos problemas.

### Back-end

Foi criada uma estrutura inicial utilizando:

- Node.js;
- Express;

Será responsável pela API REST e pelas regras do sistema.

Entre as funções previstas estão o cadastro e login dos usuários, validação das ocorrências, verificação da localização, detectar ocorrências duplicadas, controle do sistema de XP e definição de quando uma ocorrência deve gerar um alerta para o orgão público.

A estrutura inicial do back-end já possui uma API básica e uma rota de verificação:

```
GET /health
```

### Banco de dados

Foi criado um banco PostgreSQL para o projeto, hospedado no Neon.

A estrutura inicial possui a tabela `usuarios`, contendo:

- `id`: identificador do usuário;
- `nome`: nome do usuário;
- `email`: endereço de e-mail;
- `senha_hash`: senha armazenada de forma protegida;
- `criado_em`: data e hora de criação do cadastro.

O esquema inicial está disponível em:

```
backend/db/schema.sql
```

A estrutura planejada para o sistema de ocorrências inclui:

usuarios
categorias
ocorrencias
imagens
validacoes_ocorrencia
historico_ocorrencia

Funcionalidades relacionadas a dados geográficos e outras tecnologias de banco ainda serão definidas conforme as necessidades do projeto.

Uma das ideias é utilizar PostgreSQL com PostGIS para trabalhar com os dados geográficos.

Isso facilita consultas como verificar se existe algum registro de um problema dentro de determinado raio, o que também poderá ajudar na identificação de ocorrências duplicadas.


### Mapas e serviços externos

A solução de mapas e os demais serviços externos ainda estão em avaliação.

Entre as possibilidades estão soluções baseadas em:

- Google Maps api;
- Leaflet + OpenStreetMap;
- S3 como serviço de armazenamento externo de imagens ;
- Firebase notificações;
- **gov.br** autenticação. dos usuários.

## Estrutura atual do projeto

A estrutura inicial está organizada da seguinte forma:

```
app-cidade-ativa/
├── .gitignore
├── README.md
├── API.md
├── backend/
│   ├── db/
│   │   └── schema.sql
│   ├── index.js
│   ├── auth.js
│   ├── package.json
│   └── package-lock.json
└── frontend/
```

A pasta `frontend` ainda está vazia e será utilizada durante o desenvolvimento do aplicativo mobile.

## Como rodar o back-end

### Pré-requisitos

- Node.js instalado;
- acesso ao banco PostgreSQL do projeto.

### 1. Clonar o projeto

```
git clone https://github.com/Andre-LCs/app-cidade-ativa.git
cd app-cidade-ativa
```

### 2. Instalar as dependências

Entre na pasta do back-end:

```
cd backend
```

Depois:

```
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` dentro da pasta `backend`:

```
DATABASE_URL=CONNECTION_STRING_DO_NEON
PORT=3000
JWT_SECRET=SUA_CHAVE_SECRETA
```

A `DATABASE_URL` contém as informações de acesso ao banco e **não deve ser publicada no GitHub**.

A `JWT_SECRET` também é uma informação privada e **não deve ser publicada**.

O arquivo `.env` já está incluído no `.gitignore`.

### 4. Executar o back-end

```
node index.js
```

Se estiver tudo correto, será exibido:

```
Servidor rodando na porta 3000
```

Depois acesse:

```
http://localhost:3000/health
```

O resultado esperado é:

```
{
  "status":"ok"
}
```

## Próximo objetivo

A primeira etapa de desenvolvimento será implementar o fluxo básico de usuários:

```
Cadastro
   ↓
Login
   ↓
Autenticação
   ↓
Usuário autenticado

```
---