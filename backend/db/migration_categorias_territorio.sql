-- Novas categorias pensadas para bairros, chácaras e áreas de expansão (DF e Entorno).
-- Rodar uma vez no banco (Neon > SQL Editor). Pode rodar de novo: não duplica.

INSERT INTO categorias (nome, descricao, tempo_expiracao) VALUES
(
    'Rua de terra ou erosão',
    'Rua sem asfalto, buracos de erosão, valetas e pontos de alagamento',
    NULL
),
(
    'Mato alto ou terreno baldio',
    'Mato alto, terreno abandonado ou foco de sujeira em lote vazio',
    NULL
)
ON CONFLICT (nome) DO NOTHING;
