const express = require('express');
const pool = require('../db/pool');
const autenticar = require('../auth');

const router = express.Router();

// GET /categorias
// Lista as categorias de ocorrência (usada no seletor da tela "Nova Ocorrência").
router.get('/', autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, descricao
       FROM categorias
       ORDER BY id`
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