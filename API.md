# Contrato da API — Cadastro, Login e Usuário

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

## Padrão de erros

Toda resposta de erro segue o mesmo formato:
```json
{ "erro": "mensagem descrevendo o problema" }
```

## Códigos HTTP usados
| Código | Significado |
|---|---|
| 200 | Sucesso (login, consulta, atualização) |
| 201 | Sucesso (criação de recurso — cadastro) |
| 400 | Erro do cliente (dado inválido/faltando) |
| 401 | Não autenticado (token ausente/inválido, ou credenciais erradas) |
| 500 | Erro interno do servidor |
