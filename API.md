# Contrato da API — Cadastro, Login, Usuário e Ocorrências

> Os dados apresentados nos exemplos são fictícios e servem apenas para demonstrar o formato das requisições e respostas.

Base URL (desenvolvimento): `http://localhost:3000`

---

## POST /cadastro

Cria um novo usuário.

**Recebe (JSON):**
```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "senha": "minhasenha123"
}
```

**Retorna 201 (sucesso):**
```json
{
  "id": 1,
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "criado_em": "2026-08-13T10:00:00.000Z"
}
```

**Retorna 400 (email já cadastrado):**
```json
{ "erro": "email já cadastrado" }
```

**Retorna 400 (campo faltando/inválido):**
```json
{ "erro": "nome, email e senha são obrigatórios" }
```

Regras:
- `senha` nunca é retornada em nenhuma resposta.
- `senha` é armazenada como `senha_hash` (bcrypt), nunca em texto puro.
- `email` deve ser único (constraint já existe na tabela `usuarios`).

---

## POST /login

Autentica um usuário existente e retorna um token.

**Recebe (JSON):**
```json
{
  "email": "maria@email.com",
  "senha": "minhasenha123"
}
```

**Retorna 200 (sucesso):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "Maria Silva",
    "email": "maria@email.com"
  }
}
```

**Retorna 401 (credenciais inválidas):**
```json
{ "erro": "credenciais inválidas" }
```

Regras:
- Mensagem de erro é sempre genérica ("credenciais inválidas"), tanto pra email inexistente
  quanto pra senha errada — não revelar qual dos dois está errado, por segurança.
- O `token` deve ser enviado nas próximas requisições no header:
  `Authorization: Bearer <token>`

---

## GET /usuario/me

Retorna os dados do usuário autenticado.

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Retorna 200 (sucesso):**
```json
{
  "id": 1,
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "criado_em": "2026-08-13T10:00:00.000Z"
}
```

**Retorna 401 (sem token ou token inválido):**
```json
{ "erro": "não autorizado" }
```

---

## PUT /usuario/me

Atualiza dados do usuário autenticado. Campos são opcionais — manda só o que quer mudar.

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Recebe (JSON, todos os campos opcionais):**
```json
{
  "nome": "Maria S. Silva",
  "email": "novoemail@email.com"
}
```

**Retorna 200 (sucesso):**
```json
{
  "id": 1,
  "nome": "Maria S. Silva",
  "email": "novoemail@email.com",
  "atualizado_em": "2026-08-13T11:30:00.000Z"
}
```

**Retorna 400 (email já em uso por outro usuário):**
```json
{ "erro": "email já cadastrado" }
```

**Retorna 401 (sem token ou token inválido):**
```json
{ "erro": "não autorizado" }
```

---

## GET /categorias

Lista as categorias de ocorrência (usada no seletor da tela "Nova Ocorrência").

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Retorna 200 (sucesso):**
```json
[
  { "id": 1, "nome": "Buraco na via", "descricao": "Buracos e danos no asfalto/pavimento" },
  { "id": 2, "nome": "Iluminação pública", "descricao": "Lâmpadas apagadas ou postes danificados" }
]
```

**Retorna 401 (sem token ou token inválido):**
```json
{ "erro": "não autorizado" }
```

---

## POST /ocorrencias

Registra uma nova ocorrência para o usuário autenticado.

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Recebe (JSON):**
```json
{
  "categoria_id": 1,
  "titulo": "Buraco grande na via",
  "descricao": "Buraco em frente ao número 120, ocupa metade da pista",
  "foto_url": "https://res.cloudinary.com/emwfrhrc/image/upload/v1/exemplo.png",
  "latitude": -15.7801,
  "longitude": -47.9292
}
```
Campos obrigatórios: `categoria_id`, `titulo`, `latitude` e `longitude`. `descricao` e `foto_url` são opcionais.

**Retorna 201 (sucesso):**
```json
{
  "id": 1,
  "usuario_id": 2,
  "categoria_id": 1,
  "titulo": "Buraco grande na via",
  "descricao": "Buraco em frente ao número 120, ocupa metade da pista",
  "foto_url": "https://res.cloudinary.com/emwfrhrc/image/upload/v1/exemplo.png",
  "latitude": -15.7801,
  "longitude": -47.9292,
  "status": "ABERTA",
  "criado_em": "2026-10-20T22:54:15.000Z"
}
```

**Retorna 400 (campo faltando ou inválido):**
```json
{ "erro": "categoria_id, titulo, latitude e longitude são obrigatórios" }
```
```json
{ "erro": "latitude ou longitude inválida" }
```
```json
{ "erro": "categoria não encontrada" }
```
```json
{ "erro": "foto_url inválida" }
```

**Retorna 401 (sem token ou token inválido):**
```json
{ "erro": "não autorizado" }
```

Regras:
- `latitude` deve estar entre -90 e 90, e `longitude` entre -180 e 180.
- O back-end grava a posição com `ST_MakePoint(longitude, latitude)`: **longitude primeiro**, ao contrário do que falamos no dia a dia.
- A foto não passa pela API: o app envia direto ao Cloudinary e manda só o link em `foto_url`. Se enviado, o link precisa começar com `https://`.
- `titulo` e `descricao` são gravados sem espaços nas pontas.
- Toda ocorrência nova começa com `status: "ABERTA"`.

---

## GET /ocorrencias

Lista ocorrências, da mais recente para a mais antiga. Nesta etapa a lista não tem paginação.

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Parâmetro opcional (query):** `?minhas=true` retorna só as ocorrências do usuário autenticado (usado na tela "Minhas Ocorrências"). Sem o parâmetro, retorna todas.

**Retorna 200 (sucesso):**
```json
[
  {
    "id": 1,
    "usuario_id": 2,
    "categoria_id": 1,
    "categoria_nome": "Buraco na via",
    "titulo": "Buraco grande na via",
    "descricao": "Buraco em frente ao número 120, ocupa metade da pista",
    "foto_url": "https://res.cloudinary.com/emwfrhrc/image/upload/v1/exemplo.png",
    "latitude": -15.7801,
    "longitude": -47.9292,
    "status": "ABERTA",
    "criado_em": "2026-10-20T22:54:15.000Z"
  }
]
```

**Retorna 401 (sem token ou token inválido):**
```json
{ "erro": "não autorizado" }
```

---

## Padrão de erros

Toda resposta de erro segue o mesmo formato:
```json
{ "erro": "mensagem descrevendo o problema" }
```

## Códigos HTTP usados
| Código | Significado |
|---|---|
| 200 | Sucesso (login, consulta, listagem, atualização) |
| 201 | Sucesso (criação de recurso — cadastro e ocorrência) |
| 400 | Erro do cliente (dado inválido/faltando) |
| 401 | Não autenticado (token ausente/inválido, ou credenciais erradas) |
| 500 | Erro interno do servidor |