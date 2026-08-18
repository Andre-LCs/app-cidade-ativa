const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      erro: 'email e senha são obrigatórios'
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: 'credenciais inválidas'
      });
    }

    const usuario = result.rows[0];

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha_hash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: 'credenciais inválidas'
      });
    }

    const token = jwt.sign(
      { usuarioId: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: 'erro interno do servidor'
    });
  }
});

module.exports = router;