const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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

// DELETE /usuario/me
// Exclui a conta do usuário autenticado (exige a senha). É uma anonimização:
// nome, e-mail e senha são apagados e a conta deixa de existir para login, mas
// as ocorrências e os votos continuam na base, sem autor identificável.
router.delete('/me', autenticar, async (req, res) => {
  const { senha } = req.body || {};

  if (!senha || typeof senha !== 'string') {
    return res.status(400).json({ erro: 'senha é obrigatória' });
  }

  try {
    const result = await pool.query(
      'SELECT senha_hash FROM usuarios WHERE id = $1',
      [req.usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'não autorizado' });
    }

    const senhaCorreta = await bcrypt.compare(senha, result.rows[0].senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'senha incorreta' });
    }

    // senha aleatória e impossível de adivinhar: a conta nunca mais entra
    const hashInutilizavel = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const cliente = await pool.connect();

    try {
      await cliente.query('BEGIN');
      await cliente.query(
        `UPDATE usuarios
         SET nome = 'Usuário removido',
             email = 'removido-' || id || '@cidadeativa.invalid',
             senha_hash = $1,
             excluido_em = CURRENT_TIMESTAMP,
             senha_alterada_em = CURRENT_TIMESTAMP,
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [hashInutilizavel, req.usuarioId]
      );
      await cliente.query('DELETE FROM redefinicoes_senha WHERE usuario_id = $1', [req.usuarioId]);
      await cliente.query('COMMIT');
    } catch (erroTransacao) {
      await cliente.query('ROLLBACK');
      throw erroTransacao;
    } finally {
      cliente.release();
    }

    return res.status(200).json({ mensagem: 'conta excluída com sucesso' });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({ erro: 'erro interno do servidor' });
  }
});

module.exports = router;