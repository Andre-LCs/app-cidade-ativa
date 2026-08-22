# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

# Cidade Ativa — Front-end

Aplicativo mobile do projeto **Cidade Ativa**, desenvolvido com React Native, Expo e TypeScript.

O front-end é responsável pela interface do aplicativo e pelas interações com o usuário, incluindo cadastro, login, perfil, mapa, registro de ocorrências, localização, imagens e acompanhamento dos problemas urbanos.

## Tecnologias

* React Native
* Expo
* Expo Router
* TypeScript
* Expo Secure Store

## Como executar o projeto

### Pré-requisitos

* Node.js instalado;
* Git instalado;
* acesso ao repositório do projeto;
* Expo CLI/Expo disponível através do projeto.

### 1. Clonar o repositório

No terminal:

```bash
git clone https://github.com/Andre-LCs/app-cidade-ativa.git
cd app-cidade-ativa/frontend
```

### 2. Instalar as dependências

Dentro da pasta `frontend`:

```bash
npm install
```

### 3. Iniciar o projeto

Execute:

```bash
npx expo start
```

O Expo iniciará o servidor de desenvolvimento e apresentará as opções disponíveis para executar o aplicativo.

Para executar diretamente na versão web:

```bash
npm run web
```

## Estrutura do projeto

```text
frontend/

├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── cadastro.tsx
│   │   └── perfil.tsx
│   │
│   ├── components/
│   ├── services/
│   │   ├── api.ts
│   │   └── tokenStorage.ts
│   │
│   └── types/
│
├── assets/
├── .gitignore
├── app.json
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json
```

### `src/app`

Contém as telas e rotas do aplicativo.

O projeto utiliza o **Expo Router**, portanto os arquivos dessa pasta representam as rotas da aplicação.

Atualmente existem:

* `index.tsx` — tela inicial;
* `login.tsx` — tela de login;
* `cadastro.tsx` — estrutura da tela de cadastro;
* `perfil.tsx` — estrutura da tela de edição de perfil;
* `_layout.tsx` — configuração das rotas do aplicativo.

### `src/components`

Contém componentes reutilizáveis da interface.

Novos componentes podem ser criados conforme a necessidade das telas.

### `src/services`

Contém os serviços responsáveis pela comunicação com o back-end e pelo armazenamento de dados utilizados pelo aplicativo.

Atualmente existem:

```text
src/services/api.ts
src/services/tokenStorage.ts
```

O `api.ts` concentra funções relacionadas à comunicação com a API.

O `tokenStorage.ts` é utilizado para armazenar e recuperar informações de autenticação de forma segura utilizando o **Expo Secure Store**.

### `src/types`

Contém os tipos e interfaces TypeScript utilizados pelo aplicativo.

Novos tipos podem ser adicionados conforme as necessidades do desenvolvimento e o contrato da API.

## Primeira entrega

A primeira entrega tem como objetivo colocar o seguinte fluxo para funcionar:

```text
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

### Login

A tela de login já possui integração com o back-end.

O fluxo implementado é:

```text
Tela de Login
   ↓
Validação dos campos
   ↓
POST /login
   ↓
Back-end
   ↓
JWT + dados do usuário
   ↓
Armazenamento do token
```

A tela permite:

* informar e-mail;
* informar senha;
* visualizar ou ocultar a senha;
* validar campos obrigatórios;
* enviar os dados para o back-end;
* tratar credenciais inválidas;
* tratar erros de conexão;
* apresentar indicador de carregamento durante a requisição.

A requisição utilizada pelo login segue o contrato definido no `API.md`:

```json
{
  "email": "usuario@email.com",
  "senha": "123456"
}
```

Em caso de sucesso, o back-end retorna um JWT e os dados do usuário.

O token é armazenado através do `tokenStorage`, utilizando o Expo Secure Store, para que possa ser utilizado posteriormente nas rotas protegidas.

Nas próximas funcionalidades, o token deverá ser recuperado do armazenamento e enviado no header:

```text
Authorization: Bearer <token>
```

### Cadastro

A tela de cadastro deverá permitir:

* informar nome;
* informar e-mail;
* informar senha;
* validar os campos;
* enviar os dados para o back-end;
* tratar respostas de erro e sucesso.

A integração deverá seguir o contrato definido no `API.md`.

### Editar perfil

A tela de edição de perfil deverá permitir:

* visualizar os dados do usuário;
* alterar os dados permitidos;
* enviar as alterações para o back-end;
* apresentar o resultado da operação.

A integração deverá utilizar as rotas autenticadas definidas no `API.md`.

## Comunicação com o back-end

A comunicação segue inicialmente o fluxo:

```text
Tela
  ↓
Componente
  ↓
Service
  ↓
src/services/api.ts
  ↓
API REST
  ↓
Back-end
  ↓
PostgreSQL / Neon
```

O front-end **não acessa diretamente o banco de dados**.

Toda comunicação com o PostgreSQL é realizada através do back-end.

## Desenvolvimento com o back-end

Durante o desenvolvimento local, o back-end utiliza a porta `3000`.

A API pode ser verificada inicialmente pela rota:

```text
GET http://localhost:3000/health
```

Resultado esperado:

```json
{
  "status": "ok"
}
```

O back-end pode ser executado diretamente com Node.js ou através do Docker Compose, conforme definido no README do backend.

### Observação sobre dispositivos físicos

Quando o aplicativo for executado em um celular físico através do Expo Go, `localhost` se refere ao próprio celular, e não ao computador que está executando o back-end.

Nesse caso, o endereço da API deverá utilizar o endereço IP da máquina na rede local.

Exemplo:

```text
http://192.168.1.15:3000
```

O endereço deve ser ajustado conforme o IP da máquina que estiver executando o back-end.

## Autenticação

A autenticação utiliza JWT.

Após um login realizado com sucesso, o token recebido do back-end é armazenado localmente através do `tokenStorage`.

As próximas requisições para rotas protegidas deverão recuperar esse token e enviá-lo no header:

```text
Authorization: Bearer <token>
```

O front-end não deve gerar ou validar o JWT. Essas responsabilidades pertencem ao back-end.

## API

Antes de implementar uma nova integração, consulte o arquivo:

```text
API.md
```

Esse arquivo define o contrato da API, incluindo:

* método HTTP;
* endereço da rota;
* dados recebidos;
* autenticação;
* formato das respostas;
* possíveis erros;
* códigos HTTP.

O front-end deve seguir esse contrato ao realizar as requisições.

## Organização do desenvolvimento

Cada integrante deve trabalhar em uma branch própria.

Exemplo:

```bash
git checkout main
git pull origin main
git checkout -b feature/nova-funcionalidade
```

Depois de finalizar a tarefa:

```bash
git add .
git commit -m "Descrição da alteração"
git push -u origin feature/nova-funcionalidade
```

Depois, abrir um Pull Request para `main`.

Antes de começar uma nova tarefa, atualize sua branch com a versão mais recente da `main`.

## Estado atual

O projeto já possui:

* estrutura inicial do aplicativo;
* Expo Router configurado;
* tela inicial;
* tela de login implementada;
* validação dos campos de login;
* integração do login com `POST /login`;
* tratamento de erros de autenticação;
* armazenamento do JWT;
* armazenamento dos dados básicos do usuário;
* serviço de armazenamento seguro;
* estrutura inicial de cadastro;
* estrutura inicial de edição de perfil;
* serviço base para comunicação com o back-end;
* organização inicial de componentes;
* organização inicial dos tipos;
* design tokens definidos para a interface.

As próximas etapas são a implementação funcional do **cadastro** e da **edição de perfil**, utilizando as rotas já disponíveis no back-end.

## Design

A implementação visual das telas pode seguir os mockups desenvolvidos no Figma.

O arquivo `DESIGN-TOKENS.md` contém as principais cores, tipografia e medidas utilizadas no projeto.

## Figma:

https://www.figma.com/design/gQVnzJbtrGp8rH1HN0RVRZ/Untitled?node-id=0-1&t=cTD4YmV6RVV8kNsH-1
