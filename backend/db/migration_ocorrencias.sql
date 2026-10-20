
-- 1. Habilita a extensão geográfica do PostgreSQL
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Cria a tabela de categorias
CREATE TABLE categorias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    tempo_expiracao INTERVAL
);

-- 3. Cria a tabela de ocorrências
CREATE TABLE ocorrencias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    categoria_id BIGINT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    foto_url TEXT,
    localizacao GEOGRAPHY(POINT, 4326) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'ABERTA'
        CHECK (
            status IN (
                'ABERTA',
                'EM_VALIDACAO',
                'VALIDADA',
                'ENVIADA_PREFEITURA',
                'EM_ATENDIMENTO',
                'RESOLVIDA',
                'EXPIRADA',
                'DUPLICADA'
            )
        ),
    CONSTRAINT fk_ocorrencias_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_ocorrencias_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- 4. Cria índice para acelerar consultas geográficas
CREATE INDEX idx_ocorrencias_localizacao
    ON ocorrencias USING GIST (localizacao);

-- 5. Cadastra as categorias iniciais
INSERT INTO categorias (nome, descricao, tempo_expiracao) VALUES
(
    'Buraco na via',
    'Buracos e danos no asfalto/pavimento',
    NULL
),
(
    'Iluminação pública',
    'Lâmpadas apagadas ou postes danificados',
    NULL
),
(
    'Lixo/Entulho',
    'Acúmulo de lixo ou entulho em via pública',
    NULL
),
(
    'Calçada danificada',
    'Calçadas quebradas ou com obstáculos',
    NULL
),
(
    'Veículo em local proibido',
    'Carro estacionado irregularmente',
    INTERVAL '4 hours'
);