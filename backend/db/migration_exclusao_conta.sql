-- Exclusão de conta (anonimização) e invalidação de tokens após troca de senha.
-- Rodar uma vez no banco (Neon > SQL Editor). Pode rodar de novo sem problema.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_alterada_em TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ;
