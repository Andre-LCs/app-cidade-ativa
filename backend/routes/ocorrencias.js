const express = require('express');
const pool = require('../db/pool');
const autenticar = require('../auth');

const router = express.Router();

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

// GET /ocorrencias
// Lista as ocorrências, da mais recente para a mais antiga.
// ?minhas=true retorna só as do usuário autenticado.
router.get('/', autenticar, async (req, res) => {
  const apenasMinhas = req.query.minhas === 'true';

  const valores = [];
  let filtro = '';

  if (apenasMinhas) {
    valores.push(req.usuarioId);
    filtro = 'WHERE o.usuario_id = $1';
  }

  try {
    const result = await pool.query(
      `SELECT o.id, o.usuario_id, o.categoria_id, c.nome AS categoria_nome,
              o.titulo, o.descricao, o.foto_url,
              ST_Y(o.localizacao::geometry) AS latitude,
              ST_X(o.localizacao::geometry) AS longitude,
              o.status, o.criado_em
       FROM ocorrencias o
       JOIN categorias c ON c.id = o.categoria_id
       ${filtro}
       ORDER BY o.criado_em DESC, o.id DESC`,
      valores
    );

    return res.status(200).json(result.rows);
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

module.exports = router;