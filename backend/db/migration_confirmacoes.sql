-- Validação pela comunidade: votos "ainda está lá" e "já foi resolvido".
-- Rodar uma vez no banco (Neon > SQL Editor).

CREATE TABLE IF NOT EXISTS confirmacoes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ocorrencia_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('AINDA_EXISTE', 'RESOLVIDA')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_confirmacoes_ocorrencia
        FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id),
    CONSTRAINT fk_confirmacoes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    -- um voto por usuário por ocorrência (o usuário pode trocar de voto)
    CONSTRAINT uq_confirmacoes_usuario_ocorrencia UNIQUE (ocorrencia_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_confirmacoes_ocorrencia ON confirmacoes (ocorrencia_id);
