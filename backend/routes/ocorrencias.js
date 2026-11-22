const express = require('express');
const pool = require('../db/pool');
const autenticar = require('../auth');

const router = express.Router();

// Regras da validação pela comunidade (versão de teste). Ajuste aqui para mudar o rigor.
const LIMITE_VALIDACAO = 3; // confirmações "ainda está lá" para a ocorrência ficar VALIDADA
const LIMITE_RESOLVIDA = 2; // votos "já foi resolvido" para a ocorrência ficar RESOLVIDA

// Converte número ou texto numérico em número; qualquer outra coisa vira NaN.
function paraNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && valor.trim() !== '') return Number(valor);
  return NaN;
}

function vazio(valor) {
  return valor === undefined || valor === null || valor === '';
}

// POST /ocorrencias
// Registra uma nova ocorrência para o usuário autenticado.
router.post('/', autenticar, async (req, res) => {
  const { categoria_id, titulo, descricao, foto_url, latitude, longitude } = req.body ?? {};

  if (
    vazio(categoria_id) ||
    vazio(latitude) ||
    vazio(longitude) ||
    typeof titulo !== 'string' ||
    titulo.trim() === ''
  ) {
    return res.status(400).json({
      erro: 'categoria_id, titulo, latitude e longitude são obrigatórios'
    });
  }

  const categoriaId = paraNumero(categoria_id);
  const lat = paraNumero(latitude);
  const lon = paraNumero(longitude);

  if (!Number.isSafeInteger(categoriaId) || categoriaId <= 0) {
    return res.status(400).json({
      erro: 'categoria não encontrada'
    });
  }

  if (
    !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    !Number.isFinite(lon) || lon < -180 || lon > 180
  ) {
    return res.status(400).json({
      erro: 'latitude ou longitude inválida'
    });
  }

  // foto_url é opcional; se vier, precisa ser um link https (o app envia o link do Cloudinary).
  if (!vazio(foto_url) && (typeof foto_url !== 'string' || !foto_url.startsWith('https://'))) {
    return res.status(400).json({
      erro: 'foto_url inválida'
    });
  }

  const descricaoLimpa =
    typeof descricao === 'string' && descricao.trim() !== '' ? descricao.trim() : null;
  const fotoLimpa = vazio(foto_url) ? null : foto_url;

  try {
    // ATENÇÃO: no PostGIS a ordem é LONGITUDE primeiro, depois LATITUDE.
    const result = await pool.query(
      `INSERT INTO ocorrencias
         (usuario_id, categoria_id, titulo, descricao, foto_url, localizacao)
       VALUES
         ($1, $2, $3, $4, $5,
          ST_SetSRID(ST_MakePoint($6::double precision, $7::double precision), 4326)::geography)
       RETURNING id, usuario_id, categoria_id, titulo, descricao, foto_url,
                 ST_Y(localizacao::geometry) AS latitude,
                 ST_X(localizacao::geometry) AS longitude,
                 status, criado_em`,
      [req.usuarioId, categoriaId, titulo.trim(), descricaoLimpa, fotoLimpa, lon, lat]
    );

    return res.status(201).json(result.rows[0]);
  } catch (erro) {
    // 23503 = violação de chave estrangeira
    if (erro.code === '23503') {
      if (erro.constraint === 'fk_ocorrencias_usuario') {
        return res.status(401).json({
          erro: 'não autorizado'
        });
      }

      return res.status(400).json({
        erro: 'categoria não encontrada'
      });
    }

    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

// Expiração: ocorrências em aberto/validação cuja categoria tem prazo e que ficaram
// sem atividade (criação ou última confirmação) além do prazo passam a EXPIRADA.
async function expirarVencidas() {
  await pool.query(
    `UPDATE ocorrencias o
        SET status = 'EXPIRADA', atualizado_em = CURRENT_TIMESTAMP
       FROM categorias c
      WHERE c.id = o.categoria_id
        AND c.tempo_expiracao IS NOT NULL
        AND o.status IN ('ABERTA', 'EM_VALIDACAO')
        AND o.atualizado_em + c.tempo_expiracao < CURRENT_TIMESTAMP`
  );
}

// GET /ocorrencias/versao
// Resposta leve usada pelo app para saber se algo mudou (nova ocorrência, voto, cancelamento,
// mudança de status). O app só recarrega a lista quando este valor muda.
router.get('/versao', async (req, res) => {
  try {
    await expirarVencidas();

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total,
              EXTRACT(EPOCH FROM MAX(atualizado_em))::text AS ultima
         FROM ocorrencias`
    );
    const { total, ultima } = result.rows[0];

    return res.status(200).json({ versao: `${total}|${ultima ?? 0}` });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

// GET /ocorrencias/publicas
// Listagem aberta para o modo "explorar o mapa sem conta": só leitura, sem login.
// Não expõe foto, autor nem voto individual; traz apenas o necessário para desenhar o mapa.
router.get('/publicas', async (req, res) => {
  try {
    await expirarVencidas();

    const result = await pool.query(
      `SELECT o.id, c.nome AS categoria_nome, o.titulo, o.descricao,
              ST_Y(o.localizacao::geometry) AS latitude,
              ST_X(o.localizacao::geometry) AS longitude,
              o.status, o.criado_em,
              (SELECT COUNT(*)::int FROM confirmacoes f
                WHERE f.ocorrencia_id = o.id AND f.tipo = 'AINDA_EXISTE') AS confirmacoes,
              (SELECT COUNT(*)::int FROM confirmacoes f
                WHERE f.ocorrencia_id = o.id AND f.tipo = 'RESOLVIDA') AS votos_resolvida
       FROM ocorrencias o
       JOIN categorias c ON c.id = o.categoria_id
       WHERE o.status <> 'CANCELADA'
       ORDER BY o.criado_em DESC, o.id DESC`
    );

    return res.status(200).json(
      result.rows.map((linha) => ({
        ...linha,
        foto_url: null,
        minha: false,
        meu_voto: null,
        limite_validacao: LIMITE_VALIDACAO,
      }))
    );
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'erro interno do servidor' });
  }
});

// GET /ocorrencias
// Lista as ocorrências, da mais recente para a mais antiga.
// ?minhas=true retorna só as do usuário autenticado.
// Ocorrências canceladas pelo autor não aparecem em nenhuma listagem.
// Cada item traz as contagens de votos da comunidade e o voto do próprio usuário.
router.get('/', autenticar, async (req, res) => {
  const apenasMinhas = req.query.minhas === 'true';

  // $1 é sempre o usuário autenticado (usado em "minha" e "meu_voto")
  const valores = [req.usuarioId];
  const condicoes = ["o.status <> 'CANCELADA'"];

  if (apenasMinhas) {
    condicoes.push('o.usuario_id = $1');
  }

  try {
    await expirarVencidas();

    const result = await pool.query(
      `SELECT o.id, o.usuario_id, o.categoria_id, c.nome AS categoria_nome,
              o.titulo, o.descricao, o.foto_url,
              ST_Y(o.localizacao::geometry) AS latitude,
              ST_X(o.localizacao::geometry) AS longitude,
              o.status, o.criado_em,
              (o.usuario_id = $1) AS minha,
              (SELECT COUNT(*)::int FROM confirmacoes f
                WHERE f.ocorrencia_id = o.id AND f.tipo = 'AINDA_EXISTE') AS confirmacoes,
              (SELECT COUNT(*)::int FROM confirmacoes f
                WHERE f.ocorrencia_id = o.id AND f.tipo = 'RESOLVIDA') AS votos_resolvida,
              (SELECT f.tipo FROM confirmacoes f
                WHERE f.ocorrencia_id = o.id AND f.usuario_id = $1) AS meu_voto
       FROM ocorrencias o
       JOIN categorias c ON c.id = o.categoria_id
       WHERE ${condicoes.join(' AND ')}
       ORDER BY o.criado_em DESC, o.id DESC`,
      valores
    );

    // o app usa o limite para desenhar a barra de progresso da validação
    return res.status(200).json(
      result.rows.map((linha) => ({ ...linha, limite_validacao: LIMITE_VALIDACAO }))
    );
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

// POST /ocorrencias/:id/confirmacoes
// Registra (ou troca) o voto do usuário autenticado: AINDA_EXISTE ou RESOLVIDA.
// O status da ocorrência é recalculado a partir dos votos.
router.post('/:id/confirmacoes', autenticar, async (req, res) => {
  const id = Number(req.params.id);
  const tipo = req.body?.tipo;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'id inválido' });
  }

  if (tipo !== 'AINDA_EXISTE' && tipo !== 'RESOLVIDA') {
    return res.status(400).json({ erro: 'tipo deve ser AINDA_EXISTE ou RESOLVIDA' });
  }

  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const existente = await cliente.query(
      'SELECT usuario_id, status FROM ocorrencias WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (existente.rowCount === 0 || existente.rows[0].status === 'CANCELADA') {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ erro: 'ocorrência não encontrada' });
    }

    const { usuario_id: autorId, status: statusAtual } = existente.rows[0];
    const ehAutor = Number(autorId) === Number(req.usuarioId);

    const ACEITAM_VOTO = ['ABERTA', 'EM_VALIDACAO', 'VALIDADA', 'ENVIADA_PREFEITURA', 'EM_ATENDIMENTO'];
    if (!ACEITAM_VOTO.includes(statusAtual)) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ erro: 'esta ocorrência não aceita mais votos' });
    }

    if (tipo === 'AINDA_EXISTE' && ehAutor) {
      await cliente.query('ROLLBACK');
      return res.status(403).json({ erro: 'o autor não pode confirmar a própria ocorrência' });
    }

    await cliente.query(
      `INSERT INTO confirmacoes (ocorrencia_id, usuario_id, tipo)
       VALUES ($1, $2, $3)
       ON CONFLICT (ocorrencia_id, usuario_id)
       DO UPDATE SET tipo = EXCLUDED.tipo, criado_em = CURRENT_TIMESTAMP`,
      [id, req.usuarioId, tipo]
    );

    const contagem = await cliente.query(
      `SELECT COUNT(*) FILTER (WHERE tipo = 'AINDA_EXISTE')::int AS confirmacoes,
              COUNT(*) FILTER (WHERE tipo = 'RESOLVIDA')::int AS votos_resolvida
         FROM confirmacoes WHERE ocorrencia_id = $1`,
      [id]
    );
    const { confirmacoes, votos_resolvida } = contagem.rows[0];

    // O autor marcando "resolvida" encerra na hora; os demais precisam atingir o limite.
    const resolvida = (tipo === 'RESOLVIDA' && ehAutor) || votos_resolvida >= LIMITE_RESOLVIDA;

    let novoStatus = statusAtual;
    if (resolvida) {
      novoStatus = 'RESOLVIDA';
    } else if (['ABERTA', 'EM_VALIDACAO', 'VALIDADA'].includes(statusAtual)) {
      if (confirmacoes >= LIMITE_VALIDACAO) novoStatus = 'VALIDADA';
      else if (confirmacoes >= 1) novoStatus = 'EM_VALIDACAO';
      else novoStatus = 'ABERTA';
    }

    await cliente.query(
      'UPDATE ocorrencias SET status = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2',
      [novoStatus, id]
    );

    await cliente.query('COMMIT');

    return res.status(200).json({
      id,
      status: novoStatus,
      confirmacoes,
      votos_resolvida,
      meu_voto: tipo
    });
  } catch (erro) {
    await cliente.query('ROLLBACK').catch(() => {});
    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  } finally {
    cliente.release();
  }
});

// DELETE /ocorrencias/:id
// Cancela uma ocorrência do próprio usuário. Não apaga o registro: muda o status para
// CANCELADA (ela some das listagens, mas o histórico fica no banco).
// Só é permitido enquanto o status for ABERTA, ou seja, antes de qualquer validação.
router.delete('/:id', autenticar, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'id inválido' });
  }

  try {
    const existente = await pool.query(
      'SELECT usuario_id, status FROM ocorrencias WHERE id = $1',
      [id]
    );

    if (existente.rowCount === 0 || existente.rows[0].status === 'CANCELADA') {
      return res.status(404).json({ erro: 'ocorrência não encontrada' });
    }

    const ocorrencia = existente.rows[0];

    if (Number(ocorrencia.usuario_id) !== Number(req.usuarioId)) {
      return res.status(403).json({ erro: 'você só pode cancelar as suas próprias ocorrências' });
    }

    if (ocorrencia.status !== 'ABERTA') {
      return res.status(409).json({
        erro: 'só é possível cancelar ocorrências que ainda estão abertas'
      });
    }

    const votos = await pool.query(
      'SELECT 1 FROM confirmacoes WHERE ocorrencia_id = $1 LIMIT 1',
      [id]
    );

    if (votos.rowCount > 0) {
      return res.status(409).json({
        erro: 'só é possível cancelar ocorrências que ainda não receberam votos'
      });
    }

    await pool.query(
      "UPDATE ocorrencias SET status = 'CANCELADA', atualizado_em = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'ABERTA'",
      [id]
    );

    return res.status(200).json({ id, status: 'CANCELADA' });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

module.exports = router;