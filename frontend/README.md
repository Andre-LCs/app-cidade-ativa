# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

# Cidade Ativa — Front-end

Aplicativo mobile do projeto **Cidade Ativa**, desenvolvido com React Native, Expo e TypeScript.

O front-end será responsável pela interface do aplicativo e pelas interações com o usuário, incluindo cadastro, login, mapa, registro de ocorrências, localização, imagens e acompanhamento dos problemas urbanos.

## Tecnologias

- React Native
- Expo
- Expo Router
- TypeScript

## Como executar o projeto

### Pré-requisitos

- Node.js instalado;
- Git instalado;
- acesso ao repositório do projeto.

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

```
frontend/
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   └── cadastro.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── auth/
│   │
│   ├── services/
│   │   └── api.ts
│   │
│   └── types/
│       ├── usuario.ts
│       └── auth.ts
│
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

- `index.tsx` — tela inicial;
- `login.tsx` — estrutura inicial da tela de login;
- `cadastro.tsx` — estrutura inicial da tela de cadastro;
- `_layout.tsx` — configuração das rotas do aplicativo.

As telas de login e cadastro ainda possuem apenas uma estrutura inicial e serão implementadas como parte da primeira entrega do front-end.

### `src/components`

Contém componentes reutilizáveis da interface.

#### `ui`

Componentes genéricos que poderão ser utilizados em diferentes telas, como:

- botões;
- campos de entrada;
- mensagens;
- indicadores de carregamento;
- outros elementos reutilizáveis.

#### `auth`

Componentes específicos relacionados à autenticação.

Por exemplo:

- formulário de login;
- formulário de cadastro;
- componentes relacionados à autenticação.

A separação permite evitar que toda a implementação fique diretamente dentro dos arquivos de tela.

### `src/services`

Contém serviços responsáveis pela comunicação com o back-end e outros serviços externos.

Atualmente existe:

```
src/services/api.ts
```

Esse arquivo possui uma função base para realizar requisições HTTP para a API.

O endereço utilizado atualmente durante o desenvolvimento local é:

```
http://localhost:3000
```

O contrato definitivo das rotas de autenticação será definido junto ao desenvolvimento do back-end.

### `src/types`

Contém tipos e interfaces TypeScript utilizados pelo aplicativo.

Foram preparados:

```
usuario.ts
auth.ts
```

Esses arquivos estão reservados para os tipos relacionados a usuários e autenticação. Os campos definitivos serão definidos de acordo com o contrato da API.

## Primeira entrega do front-end

A primeira entrega prevista é colocar o fluxo básico de autenticação para funcionar.

### Cadastro

A tela deverá permitir:

- informar nome;
- informar e-mail;
- informar senha;
- validar os campos;
- enviar os dados para o back-end;
- apresentar mensagens de erro ou sucesso;
- encaminhar o usuário para o fluxo adequado após o cadastro.

### Login

A tela deverá permitir:

- informar e-mail;
- informar senha;
- validar os campos;
- enviar os dados para o back-end;
- tratar respostas de erro;
- armazenar a autenticação recebida;
- encaminhar o usuário após o login.

### Fluxo inicial

```
Cadastro
   ↓
Usuário criado
   ↓
Login
   ↓
Usuário autenticado
```

A integração com as rotas e o formato definitivo das respostas será feita conforme o contrato definido pelo back-end.

## Comunicação com o back-end

A comunicação seguirá inicialmente o fluxo:

```
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
```

O front-end não deve acessar diretamente o banco de dados.

Toda comunicação com o PostgreSQL será realizada através do back-end.

## Desenvolvimento com o back-end

Durante o desenvolvimento local, o back-end utiliza a porta `3000`.

A API pode ser verificada inicialmente pela rota:

```
GET http://localhost:3000/health
```

Resultado esperado:

```json
{
  "status": "ok"
}
```

### Observação sobre dispositivos físicos

Quando o aplicativo for executado em um celular físico, `localhost` se refere ao próprio celular, e não ao computador que está executando o back-end.

Nesse caso, o endereço da API deverá ser configurado posteriormente para utilizar o endereço de rede da máquina que estiver executando o back-end.

## Organização do desenvolvimento

A divisão inicial das responsabilidades no front-end é:

```
app/
    Telas e rotas

components/
    Componentes reutilizáveis

services/
    Comunicação com APIs

types/
    Tipos e interfaces TypeScript
```

Novas estruturas poderão ser adicionadas conforme surgirem necessidades durante o desenvolvimento.

## Estado atual

A estrutura inicial do aplicativo já foi criada utilizando Expo, React Native, Expo Router e TypeScript.

Também já foram preparados:

- estrutura de rotas;
- tela inicial;
- estrutura inicial de login;
- estrutura inicial de cadastro;
- serviço base para comunicação com o back-end;
- organização inicial de componentes;
- organização inicial dos tipos.

A próxima etapa é a implementação funcional das telas de **login e cadastro**.