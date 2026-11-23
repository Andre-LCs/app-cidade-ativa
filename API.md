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

**Campos de validação:** `minha` (true se a ocorrência é do usuário autenticado), `confirmacoes` (votos "ainda está lá"), `votos_resolvida` (votos "já foi resolvido") e `meu_voto` (`AINDA_EXISTE`, `RESOLVIDA` ou `null`). `limite_validacao` é o número de confirmações necessário para a ocorrência ficar validada (o app usa para a barra de progresso). Ocorrências com prazo de expiração (ex.: veículo em local proibido) passam a `EXPIRADA` ao serem listadas, se ficarem sem atividade além do prazo.

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
    "criado_em": "2026-10-20T22:54:15.000Z",
    "minha": false,
    "confirmacoes": 0,
    "votos_resolvida": 0,
    "meu_voto": null
  }
]
```

**Retorna 401 (sem token ou token inválido):**
```json
{ "erro": "não autorizado" }
```

---

## GET /ocorrencias/proximas

Requer token. Parâmetros: `categoria_id`, `latitude`, `longitude`. Devolve até 3 ocorrências **em andamento**
(abertas, em validação, validadas, enviadas ou em atendimento) da **mesma categoria** a até 50 m do ponto,
da mais próxima para a mais distante, com `id`, `titulo`, `categoria_nome`, `status`, `minha`, `distancia_m`,
`confirmacoes` e `meu_voto`. O app usa isso antes de registrar para avisar sobre uma possível duplicada
e oferecer "confirmar a existente" no lugar de criar outra.

## GET /ocorrencias/publicas

Listagem **sem autenticação**, usada pelo modo "explorar o mapa sem conta" (somente leitura).
Traz os mesmos campos de `GET /ocorrencias`, mas `foto_url` é sempre `null`, `minha` é `false`,
`meu_voto` é `null` e não há dados do autor. Ocorrências canceladas não aparecem.

`GET /ocorrencias/versao` também é público (devolve só um identificador de mudança, sem dados).

## GET /ocorrencias/versao

Resposta leve para o app saber se algo mudou sem baixar a lista inteira (usada a cada ~20 s com a tela aberta).

**Header obrigatório:** `Authorization: Bearer <token>`

**Retorna 200:**
```json
{ "versao": "12|1763750400.123456" }
```
O valor muda quando uma ocorrência é criada, votada, cancelada ou muda de status. O app só recarrega `GET /ocorrencias` quando ele muda.

---

## POST /ocorrencias/:id/confirmacoes

Registra o voto do usuário autenticado em uma ocorrência (um voto por usuário; votar de novo troca o voto).

**Header obrigatório:** `Authorization: Bearer <token>`

**Recebe (JSON):**
```json
{ "tipo": "AINDA_EXISTE" }
```
`tipo` aceita `AINDA_EXISTE` ou `RESOLVIDA`.

**Retorna 200 (sucesso):**
```json
{ "id": 1, "status": "EM_VALIDACAO", "confirmacoes": 1, "votos_resolvida": 0, "meu_voto": "AINDA_EXISTE" }
```

Regras de status (limites no back-end: 3 confirmações e 2 votos de resolvida):
- 1 a 2 confirmações: `EM_VALIDACAO`; 3 ou mais: `VALIDADA`; sem confirmações: `ABERTA`.
- 2 votos `RESOLVIDA`, ou o voto `RESOLVIDA` do autor: `RESOLVIDA`.

**Erros:** 400 (id ou tipo inválido), 403 (autor votando `AINDA_EXISTE` na própria ocorrência), 404 (não existe ou cancelada), 409 (ocorrência já resolvida, expirada ou duplicada).

---

## DELETE /ocorrencias/:id

Cancela uma ocorrência do próprio usuário. O registro não é apagado: o status passa a `CANCELADA` e a ocorrência deixa de aparecer em `GET /ocorrencias` (lista e mapa).

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Retorna 200 (sucesso):**
```json
{ "id": 1, "status": "CANCELADA" }
```

**Retorna 400 (id inválido):**
```json
{ "erro": "id inválido" }
```

**Retorna 403 (ocorrência de outro usuário):**
```json
{ "erro": "você só pode cancelar as suas próprias ocorrências" }
```

**Retorna 404 (não existe ou já cancelada):**
```json
{ "erro": "ocorrência não encontrada" }
```

**Retorna 409 (já passou de "Aberta"):**
```json
{ "erro": "só é possível cancelar ocorrências que ainda estão abertas" }
```

Regra: o autor só cancela enquanto o status for `ABERTA` e a ocorrência não tiver recebido nenhum voto (409 caso contrário). Depois disso (validação, envio ao órgão, etc.) a ocorrência deixa de ser só dele.

---

## Padrão de erros

Toda resposta de erro segue o mesmo formato:
```json
{ "erro": "mensagem descrevendo o problema" }
```

## Códigos HTTP usados
| Código | Significado |
|---|---|
| 200 | Sucesso (login, consulta, listagem, atualização, cancelamento) |
| 201 | Sucesso (criação de recurso — cadastro e ocorrência) |
| 400 | Erro do cliente (dado inválido/faltando) |
| 403 | Sem permissão (ex.: cancelar ocorrência de outro usuário) |
| 404 | Recurso não encontrado |
| 409 | Conflito de estado (ex.: cancelar ocorrência que já não está aberta) |
| 401 | Não autenticado (token ausente/inválido, ou credenciais erradas) |
| 500 | Erro interno do servidor |

## Recuperação de senha

Fluxo em duas etapas, por código de 6 dígitos enviado por e-mail (válido por 15 minutos).

### POST /recuperar-senha

Corpo: `{ "email": "usuario@email.com" }`

Sempre responde `200` com a mesma mensagem, exista o e-mail ou não (para não revelar quem tem conta). Se o e-mail existir, um código é enviado. Um novo pedido só gera outro código após 60 segundos; o código anterior deixa de valer.

- `400`: `email` ausente.

### POST /redefinir-senha

Corpo: `{ "email": "usuario@email.com", "codigo": "123456", "nova_senha": "minhasenha" }`

- `200`: `{ "mensagem": "senha alterada com sucesso" }`
- `400`: campos ausentes, senha com menos de 6 caracteres, código inválido ou expirado, ou mais de 5 tentativas erradas (é preciso pedir novo código).

O envio de e-mail usa HTTPS (o plano gratuito do Render bloqueia SMTP). Variáveis de ambiente do back-end: `EMAIL_WEBHOOK_URL` e `EMAIL_WEBHOOK_SEGREDO` (relay em Google Apps Script que envia pelo Gmail; código em `docs/apps-script-email.gs`).

## Exclusão de conta

### DELETE /usuario/me
Exclui a conta do usuário autenticado (anonimização). Header `Authorization: Bearer <token>`.

Body: `{ "senha": "..." }`

- 200: `{ "mensagem": "conta excluída com sucesso" }`
- 400: senha não informada
- 401: senha incorreta ou token inválido

Nome, e-mail e senha são substituídos (a conta não consegue mais entrar) e os códigos de recuperação são apagados. As ocorrências e os votos permanecem, sem autor identificável.

### Tokens e troca de senha
Ao redefinir a senha (ou excluir a conta), os tokens emitidos antes passam a ser rejeitados (401) em todos os aparelhos. `/redefinir-senha` também recusa uma nova senha igual à atual (400).
