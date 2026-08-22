# Cidade Ativa

Aplicativo de denúncia e mapeamento de problemas urbanos, como buracos, iluminação, lixo, mato alto, entre outros.

A ideia é permitir que qualquer pessoa registre problemas da cidade por meio de uma foto e da localização do ocorrido.

Esses registros poderão aparecer em um mapa, criando uma visão mais clara dos problemas urbanos e permitindo que outros usuários acompanhem e apoiem as ocorrências.

## Integrantes

* André Lucas Aquino Carneiro e Silva
* Felipe Rogério Pereira Soares
* Gabriely Rocha Nascimento
* Isabela Alecrim de França
* Jadson Lopes Fonseca
* Karla Léa Nascimento Querre
* Matheus Fernandes Cardoso da Conceição
* Rafael Ferreira Tassinari
* Ruan Evangelista Gomes
* Thalita Kamille Soares Veras
* Tuliane Lima Carneiro

## Ideia do projeto

O usuário poderá registrar um problema urbano informando uma foto e a localização do ocorrido.

As ocorrências poderão ser exibidas em um mapa público para que outros usuários consigam visualizar os problemas existentes em determinada região.

Também está prevista a possibilidade de acompanhar o andamento das ocorrências por meio de diferentes status, como:

* Enviado;
* Em análise;
* Resolvido.

Outros usuários poderão apoiar ou interagir com as ocorrências, aumentando sua visibilidade.

## Funcionalidades previstas

* Cadastro e login de usuários;
* Edição de perfil;
* Registro de problemas urbanos;
* Utilização da localização do celular;
* Registro de fotos das ocorrências;
* Visualização das ocorrências em um mapa;
* Acompanhamento do status das ocorrências;
* Apoio ou validação de ocorrências registradas por outros usuários;
* Identificação de possíveis ocorrências duplicadas;
* Armazenamento externo de imagens.

## Possibilidades futuras

Além das funcionalidades iniciais, algumas ideias estão sendo avaliadas para versões futuras do projeto:

* Diferenciação entre problemas permanentes e temporários;
* Sistema de prioridade baseado em confirmações, gravidade e tempo sem solução;
* Histórico das alterações das ocorrências;
* Usuários da população e usuários de prefeituras;
* Gamificação por meio de pontos ou XP;
* Autenticação por meio do gov.br;
* Painel para acompanhamento de ocorrências por órgãos públicos.

## Arquitetura

A arquitetura do projeto é composta por uma aplicação mobile, uma API de back-end e um banco de dados PostgreSQL.

```text
Aplicativo Mobile
       ↓
   API REST
       ↓
 PostgreSQL
       ↓
     Neon
```

### Front-end

Aplicação mobile desenvolvida com:

* React Native;
* Expo;
* Expo Router;
* TypeScript;
* Expo Secure Store.

O front-end é responsável pelas telas, navegação, interação com o usuário e comunicação com a API.

Entre as funcionalidades previstas estão:

* Cadastro;
* Login;
* Edição de perfil;
* Mapa;
* Registro de ocorrências;
* Câmera;
* Localização;
* Visualização e acompanhamento das ocorrências.

As instruções específicas do front-end estão em:

```text
frontend/README.md
```

### Back-end

API REST responsável pelas regras do sistema e pela comunicação entre o aplicativo e o banco de dados.

Tecnologias utilizadas:

* Node.js;
* Express;
* PostgreSQL (`pg`);
* dotenv;
* CORS;
* bcrypt;
* jsonwebtoken;
* Docker.

O back-end é responsável por funcionalidades como:

* Cadastro de usuários;
* Login e autenticação com JWT;
* Consulta do usuário autenticado;
* Edição de usuários;
* Registro e gerenciamento de ocorrências;
* Validação de dados;
* Regras relacionadas às ocorrências.

O backend pode ser executado diretamente com Node.js ou utilizando Docker Compose.

As instruções específicas estão em:

```text
backend/README.md
```

### Banco de dados

O projeto utiliza PostgreSQL hospedado no Neon.

A estrutura inicial possui a tabela `usuarios`, contendo:

* `id`: identificador do usuário;
* `nome`: nome do usuário;
* `email`: endereço de e-mail;
* `senha_hash`: senha armazenada de forma protegida;
* `criado_em`: data e hora de criação do cadastro;
* `atualizado_em`: data e hora da última atualização.

O esquema está disponível em:

```text
backend/db/schema.sql
```

A estrutura planejada para o sistema de ocorrências inclui:

```text
usuarios
categorias
ocorrencias
imagens
validacoes_ocorrencia
historico_ocorrencia
```

Funcionalidades relacionadas a dados geográficos e outras tecnologias de banco ainda serão definidas conforme as necessidades do projeto.

Uma das possibilidades é utilizar PostgreSQL com PostGIS para trabalhar com dados geográficos.

Isso poderá facilitar consultas como verificar se existe algum registro de um problema dentro de determinado raio, auxiliando também na identificação de possíveis ocorrências duplicadas.

## API

O contrato das principais rotas da aplicação está documentado em:

```text
API.md
```

Antes de implementar ou consumir uma rota, consulte esse arquivo para verificar:

* método HTTP;
* endereço da rota;
* dados enviados;
* autenticação necessária;
* formato da resposta;
* possíveis erros.

A ideia é manter o front-end e o back-end seguindo o mesmo contrato.

Atualmente, o contrato inclui as rotas:

```text
POST /cadastro
POST /login
GET /usuario/me
PUT /usuario/me
```

## Mapas e serviços externos

A solução de mapas e os demais serviços externos ainda estão em avaliação.

Entre as possibilidades estão:

* Google Maps API;
* Leaflet + OpenStreetMap;
* S3 ou serviço equivalente para armazenamento externo de imagens;
* Firebase para notificações;
* gov.br para autenticação dos usuários.

Essas tecnologias serão definidas conforme a implementação das funcionalidades correspondentes.

## Primeira entrega

A primeira entrega tem como objetivo colocar o fluxo básico de usuários para funcionar:

```text
Cadastro
   ↓
Login
   ↓
Autenticação
   ↓
Editar perfil
   ↓
Conferir se os dados foram salvos no banco
```

### Back-end

As rotas da primeira entrega já foram implementadas:

```text
POST /cadastro
POST /login
GET /usuario/me
PUT /usuario/me
```

O back-end utiliza bcrypt para armazenamento seguro das senhas e JWT para autenticação das rotas protegidas.

As rotas foram testadas utilizando o PostgreSQL hospedado no Neon.

O backend também possui configuração para execução através do Docker Compose.

### Front-end

A tela de login já foi implementada e integrada ao back-end.

O fluxo atual inclui:

```text
Tela de Login
      ↓
Validação dos campos
      ↓
POST /login
      ↓
JWT recebido
      ↓
Token armazenado com Secure Store
```

A tela também possui tratamento de erros e indicador de carregamento durante a autenticação.

As telas de cadastro e edição de perfil continuam em desenvolvimento.

### Banco de dados

O banco PostgreSQL já está configurado no Neon.

A tabela `usuarios` possui os campos necessários para o fluxo atual de autenticação e edição de perfil.

As operações realizadas pela API foram testadas diretamente contra o banco.

## Estado atual

O projeto já possui a estrutura inicial do front-end, back-end e banco de dados.

### Back-end

O back-end já possui:

* API REST com Express;
* conexão com PostgreSQL;
* cadastro de usuários;
* autenticação com JWT;
* login;
* consulta do usuário autenticado;
* atualização de dados do usuário;
* armazenamento de senhas utilizando bcrypt;
* middleware de autenticação;
* Dockerfile;
* Docker Compose;
* `.dockerignore`;
* conexão com o banco PostgreSQL hospedado no Neon.

### Front-end

O front-end já possui:

* estrutura com Expo e React Native;
* Expo Router;
* TypeScript;
* tela de login;
* validação dos campos de login;
* integração com `POST /login`;
* tratamento de erros de autenticação;
* armazenamento seguro do JWT;
* estrutura inicial de cadastro;
* estrutura inicial de edição de perfil;
* organização inicial de componentes e serviços.

### Banco de dados

O banco PostgreSQL está hospedado no Neon e possui a tabela `usuarios` configurada para o fluxo atual.

## Próximas etapas

As próximas etapas do desenvolvimento são:

1. Finalizar a tela de cadastro no front-end;
2. Integrar o cadastro com `POST /cadastro`;
3. Finalizar a tela de edição de perfil;
4. Integrar `GET /usuario/me` e `PUT /usuario/me`;
5. Validar o fluxo completo entre aplicativo, API e banco de dados;
6. Iniciar a implementação das funcionalidades relacionadas às ocorrências urbanas;
7. Definir a solução de mapas, localização e armazenamento de imagens.

## Documentação

Os principais documentos do projeto são:

```text
README.md
API.md
frontend/README.md
backend/README.md
backend/db/schema.sql
```

Cada documentação possui uma finalidade específica:

* `README.md` — visão geral do projeto;
* `API.md` — contrato da API;
* `frontend/README.md` — configuração e desenvolvimento do aplicativo;
* `backend/README.md` — configuração e desenvolvimento da API;
* `backend/db/schema.sql` — estrutura do banco de dados.
