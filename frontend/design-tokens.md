# Design Tokens — Cidade Ativa

Referência de cores, tipografia e espaçamento usada nos mockups (Figma) para manter a consistência visual quando as telas forem implementadas em React Native.

O Figma continua sendo a referência visual principal. Este arquivo serve como guia dos valores utilizados nos mockups.

## Cores

| Nome | Hex | Uso |
|---|---|---|
| Azul escuro | `#0C447C` | Títulos, nome da marca, texto de destaque |
| Azul médio | `#185FA5` | Botões primários (Entrar, Cadastrar, Salvar), elementos de ação |
| Azul claro | `#E6F1FB` | Fundos suaves, círculos de ícone, estados hover leves |
| Verde | `#3B6D11` | Links, ações secundárias ("Cadastre-se", "Entrar") |
| Texto secundário (cinza) | `#5F5E5A` | Labels de campo, subtítulos, texto de apoio |
| Borda (cinza claro) | `#D3D1C7` | Borda dos campos de input no estado normal |
| Fundo geral | `#FFFFFF` | Fundo das telas |
| Erro (vermelho) | `#E24B4A` | Borda de campo com erro, mensagens de validação |

## Tipografia

- Fonte recomendada: **Inter**
- Título de tela: 24–26px, bold
- Nome da marca (CIDADE ATIVA): 13–14px, bold, letter-spacing leve
- Subtítulo: 13px, regular, cor de texto secundário
- Label de campo: 13px, medium
- Texto de botão: 15px, bold

## Espaçamento

- Padding lateral das telas: 24px
- Altura dos campos de input: 48px, borda arredondada 12px
- Altura dos botões: 52px, borda arredondada 14px
- Espaço entre campos: 28px
- Grid geral: múltiplos de 8px

## Estados dos campos

Os estados devem seguir o Figma como referência visual:

- **Normal:** borda `#D3D1C7`, espessura 1.2px
- **Focado:** borda `#185FA5`, espessura 2px
- **Erro:** borda `#E24B4A`, espessura 2px, com mensagem de erro abaixo do campo