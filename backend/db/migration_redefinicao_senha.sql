-- Recuperação de senha por e-mail: guarda o código de 6 dígitos (apenas o hash), a validade
-- e o número de tentativas. Rodar uma vez no SQL Editor do Neon.
CREATE TABLE IF NOT EXISTS redefinicoes_senha (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_hash TEXT NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    tentativas INT NOT NULL DEFAULT 0,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redefinicoes_usuario
    ON redefinicoes_senha (usuario_id, criado_em DESC);
