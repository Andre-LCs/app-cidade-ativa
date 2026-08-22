# Design Tokens — Cidade Ativa

Paleta oficial, baseada no que já foi implementado na tela de Login. Usar os mesmos
valores em Cadastro e Editar Perfil para manter consistência visual entre as telas.

## Cores

| Nome | Hex | Uso |
|---|---|---|
| Azul principal | `#1F3F77` | Títulos, texto de marca, botões primários, borda de campo focado |
| Verde | `#32A041` | Links (Cadastre-se, Entrar, Esqueceu a senha) |
| Fundo da tela | `#F8FAFC` | Fundo geral |
| Fundo do card | `#FFFFFF` | Cartão do formulário |
| Fundo do input | `#F1F5F9` | Campos de texto (estado normal) |
| Borda | `#E2E8F0` | Borda dos campos (estado normal) |
| Texto principal | `#0F172A` | Texto de input, labels |
| Texto secundário | `#64748B` | Subtítulos, placeholders |

## Componentes já padronizados (ver `login.tsx` como referência)

- **Card do formulário**: `borderRadius: 16`, sombra leve (`shadowOpacity: 0.05`), borda `1px` `#F1F5F9`
- **Campo de input**: `borderRadius: 10`, `height: 44`, ícone à esquerda (Ionicons), borda muda de cor no foco
- **Botão primário**: `borderRadius: 10`, `height: 46`, sombra na cor do botão
- **Ícone de mostrar/ocultar senha**: `eye-outline` / `eye-off-outline` (Ionicons)

## Bibliotecas usadas

- `@expo/vector-icons` (Ionicons) — todos os ícones de campo
- `expo-secure-store` — armazenamento do token JWT após login
- `expo-router` — navegação entre telas