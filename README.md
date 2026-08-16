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
- Edição de perfil;
- Registro de problemas urbanos;
- Utilizar a localização do celular;
- Registro de fotos das ocorrências;
- Visualização das ocorrências em um mapa;
- Acompanhamento do status das ocorrências;
- Apoiar ou validar ocorrências registradas por outros usuários;
- Identificação de possíveis ocorrências duplicadas;
- Armazenamento externo de imagens;

## Possibilidades

Além das funcionalidades iniciais, algumas ideias estão sendo avaliadas para versões futuras do projeto:

- Diferenciação entre problemas permanentes e temporários;
- Sistema de prioridade baseado em confirmações, gravidade e tempo sem solução;
- Histórico das alterações das ocorrências;
- Usuários da população e usuários de prefeituras;
- Gamificação por meio de pontos ou XP;
- Autenticação por meio do gov.br;
- Painel para acompanhamento de ocorrências por órgãos públicos.


## Arquitetura

A arquitetura inicial está sendo estruturada utilizando uma aplicação mobile, uma API de back-end e um banco de dados PostgreSQL.

### Front-end

Aplicação mobile desenvolvida com:

- React Native;
- Expo;
- Expo Router;
- TypeScript.

O front-end é responsável pelas telas, navegação e interação com o usuário.

Entre as funcionalidades previstas estão:

- Cadastro;
- Login;
- Edição de perfil;
- Mapa;
- Registro de ocorrências;
- Câmera;
- Localização;
- Visualização e acompanhamento das ocorrências.

As instruções específicas do front-end estão em:

```
frontend/README.md
```

### Back-end

API REST responsável pelas regras do sistema e pela comunicação entre o aplicativo e o banco de dados.

Tecnologias utilizadas inicialmente:

- Node.js;
- Express;
- PostgreSQL (`pg`);
- dotenv;
- CORS;
- bcrypt;
- jsonwebtoken.

O back-end será responsável por funcionalidades como:

- Cadastro de usuários;
- Login e autenticação com JWT;
- Edição de usuários;
- Registro e gerenciamento de ocorrências;
- Validação de dados;
- Regras relacionadas às ocorrências.

As instruções específicas para desenvolvimento do back-end estão em:

```
backend/README.md
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

## API

O contrato das principais rotas da aplicação está documentado em:

```
API.md
```

Antes de implementar ou consumir uma rota, consulte esse arquivo para verificar:

- método HTTP;
- endereço da rota;
- dados enviados;
- autenticação necessária;
- formato da resposta;
- possíveis erros.

A ideia é manter o front-end e o back-end seguindo o mesmo contrato.


### Mapas e serviços externos

A solução de mapas e os demais serviços externos ainda estão em avaliação.

Entre as possibilidades estão soluções baseadas em:

- Google Maps api;
- Leaflet + OpenStreetMap;
- S3 como serviço de armazenamento externo de imagens ;
- Firebase notificações;
- **gov.br** autenticação. dos usuários.

## Primeira entrega

A primeira entrega tem como objetivo colocar o fluxo básico de usuários para funcionar:

```
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

Para isso, as equipes serão divididas entre:

### Front-end

Implementação das telas de:

- Cadastro;
- Login;
- Edição de perfil.

As telas deverão se comunicar com a API real do back-end.

### Back-end

Implementação das rotas de:

- Cadastro;
- Login com JWT;
- Edição de usuário.

### Banco de dados

Acompanhamento da estrutura da tabela de usuários e verificação das operações realizadas durante o fluxo.

### Documentação e testes

Teste do fluxo completo:

```
Cadastrar
   ↓
Logar
   ↓
Editar
   ↓
Verificar no banco
```

Além da preparação da documentação e apresentação da entrega.

## Estado atual

A estrutura inicial do projeto já está criada.

O back-end possui a estrutura básica da API, conexão com o PostgreSQL e middleware inicial para autenticação com JWT.

O front-end possui a estrutura inicial do aplicativo utilizando Expo, React Native, Expo Router e TypeScript, incluindo as telas iniciais de cadastro, login e edição de perfil.

O banco PostgreSQL já está hospedado no Neon e possui a estrutura inicial da tabela de usuários.

A próxima etapa é implementar e integrar o fluxo de cadastro, login e edição de perfil.

---