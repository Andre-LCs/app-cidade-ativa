const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

const router = express.Router();

router.post('/', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      erro: 'nome, email e senha são obrigatórios'
    });
  }

  try {
    const senha_hash = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, criado_em, atualizado_em`,
      [nome, email, senha_hash]
    );

    return res.status(201).json(result.rows[0]);
  } catch (erro) {
    console.error(erro);

    if (erro.code === '23505') {
      return res.status(400).json({
        erro: 'email já cadastrado'
      });
    }

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

module.exports = router;