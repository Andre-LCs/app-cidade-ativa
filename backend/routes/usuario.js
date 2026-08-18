const express = require('express');
const pool = require('../db/pool');
const autenticar = require('../auth');

const router = express.Router();

// GET /usuario/me
// Retorna os dados do usuário autenticado.
router.get('/me', autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, email, criado_em
       FROM usuarios
       WHERE id = $1`,
      [req.usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: 'não autorizado'
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

// PUT /usuario/me
// Atualiza nome e/ou email do usuário autenticado.
router.put('/me', autenticar, async (req, res) => {
  const { nome, email } = req.body;

  if (!nome && !email) {
    return res.status(400).json({
      erro: 'informe ao menos um campo para atualizar'
    });
  }

  const campos = [];
  const valores = [];
  let indice = 1;

  if (nome) {
    campos.push(`nome = $${indice++}`);
    valores.push(nome);
  }

  if (email) {
    campos.push(`email = $${indice++}`);
    valores.push(email);
  }

  campos.push('atualizado_em = CURRENT_TIMESTAMP');

  valores.push(req.usuarioId);

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET ${campos.join(', ')}
       WHERE id = $${indice}
       RETURNING id, nome, email, atualizado_em`,
      valores
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: 'não autorizado'
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(400).json({
        erro: 'email já cadastrado'
      });
    }

    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

module.exports = router;