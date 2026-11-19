-- Adiciona o status CANCELADA (cancelamento da ocorrência pelo próprio autor).
-- Rodar uma vez no banco (Neon > SQL Editor).

ALTER TABLE ocorrencias DROP CONSTRAINT IF EXISTS ocorrencias_status_check;

ALTER TABLE ocorrencias
    ADD CONSTRAINT ocorrencias_status_check
    CHECK (
        status IN (
            'ABERTA',
            'EM_VALIDACAO',
            'VALIDADA',
            'ENVIADA_PREFEITURA',
            'EM_ATENDIMENTO',
            'RESOLVIDA',
            'EXPIRADA',
            'DUPLICADA',
            'CANCELADA'
        )
    );
