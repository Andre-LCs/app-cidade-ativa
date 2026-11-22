const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../db/pool');
const { enviarEmail } = require('../email');

const router = express.Router();

const VALIDADE_MINUTOS = 15;
const INTERVALO_REENVIO_SEGUNDOS = 60;
const MAX_TENTATIVAS = 5;
const SENHA_MINIMA = 6;

const MENSAGEM_PADRAO =
  'se o e-mail estiver cadastrado, você receberá um código para redefinir a senha';

// POST /recuperar-senha
// Gera um código de 6 dígitos, guarda só o hash e envia por e-mail.
// A resposta é sempre a mesma, exista o e-mail ou não (não revela quem tem conta).
router.post('/recuperar-senha', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ erro: 'email é obrigatório' });
  }

  try {
    const usuario = await pool.query(
      'SELECT id, nome, email FROM usuarios WHERE lower(email) = lower($1)',
      [email.trim()]
    );

    if (usuario.rows.length > 0) {
      const { id, nome, email: emailCadastrado } = usuario.rows[0];

      // evita disparar vários e-mails em sequência
      const recente = await pool.query(
        `SELECT 1 FROM redefinicoes_senha
         WHERE usuario_id = $1
           AND criado_em > CURRENT_TIMESTAMP - ($2 * INTERVAL '1 second')`,
        [id, INTERVALO_REENVIO_SEGUNDOS]
      );

      if (recente.rows.length === 0) {
        const codigo = String(crypto.randomInt(100000, 1000000));
        const codigoHash = await bcrypt.hash(codigo, 10);

        // invalida códigos anteriores ainda abertos e grava o novo
        await pool.query(
          'UPDATE redefinicoes_senha SET usado = TRUE WHERE usuario_id = $1 AND usado = FALSE',
          [id]
        );
        await pool.query(
          `INSERT INTO redefinicoes_senha (usuario_id, codigo_hash, expira_em)
           VALUES ($1, $2, CURRENT_TIMESTAMP + ($3 * INTERVAL '1 minute'))`,
          [id, codigoHash, VALIDADE_MINUTOS]
        );

        try {
          await enviarEmail({
            para: emailCadastrado,
            assunto: 'Cidade Ativa: código para redefinir sua senha',
            html:
              `<div style="font-family:Arial,sans-serif;max-width:480px">` +
              `<h2 style="color:#1F3F77">Cidade Ativa</h2>` +
              `<p>Olá, ${escapar(nome)}!</p>` +
              `<p>Use o código abaixo para redefinir sua senha. Ele vale por ${VALIDADE_MINUTOS} minutos.</p>` +
              `<p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#1F3F77">${codigo}</p>` +
              `<p style="color:#64748B">Se você não pediu isso, ignore este e-mail: sua senha continua a mesma.</p>` +
              `</div>`
          });
        } catch (erroEnvio) {
          // não mostra ao usuário (para não revelar se o e-mail existe); fica no log do servidor
          console.error('Falha ao enviar e-mail de recuperação:', erroEnvio.message);
        }
      }
    }

    return res.status(200).json({ mensagem: MENSAGEM_PADRAO });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'erro interno do servidor' });
  }
});

// POST /redefinir-senha
// Confere o código (validade e no máximo 5 tentativas) e grava a nova senha.
router.post('/redefinir-senha', async (req, res) => {
  const { email, codigo, nova_senha } = req.body;

  if (!email || !codigo || !nova_senha) {
    return res.status(400).json({ erro: 'email, codigo e nova_senha são obrigatórios' });
  }

  if (String(nova_senha).length < SENHA_MINIMA) {
    return res.status(400).json({ erro: `a senha deve ter pelo menos ${SENHA_MINIMA} caracteres` });
  }

  const erroCodigo = { erro: 'código inválido ou expirado' };

  try {
    const usuario = await pool.query(
      'SELECT id, senha_hash FROM usuarios WHERE lower(email) = lower($1)',
      [String(email).trim()]
    );

    if (usuario.rows.length === 0) {
      return res.status(400).json(erroCodigo);
    }

    const usuarioId = usuario.rows[0].id;
    const senhaHashAtual = usuario.rows[0].senha_hash;

    const pedido = await pool.query(
      `SELECT id, codigo_hash, tentativas
       FROM redefinicoes_senha
       WHERE usuario_id = $1 AND usado = FALSE AND expira_em > CURRENT_TIMESTAMP
       ORDER BY criado_em DESC
       LIMIT 1`,
      [usuarioId]
    );

    if (pedido.rows.length === 0) {
      return res.status(400).json(erroCodigo);
    }

    const { id: pedidoId, codigo_hash, tentativas } = pedido.rows[0];

    if (tentativas >= MAX_TENTATIVAS) {
      await pool.query('UPDATE redefinicoes_senha SET usado = TRUE WHERE id = $1', [pedidoId]);
      return res.status(400).json({ erro: 'muitas tentativas, peça um novo código' });
    }

    const codigoCorreto = await bcrypt.compare(String(codigo).trim(), codigo_hash);

    if (!codigoCorreto) {
      await pool.query(
        'UPDATE redefinicoes_senha SET tentativas = tentativas + 1 WHERE id = $1',
        [pedidoId]
      );
      return res.status(400).json(erroCodigo);
    }

    // a nova senha não pode ser igual à atual (o código continua válido para outra tentativa)
    if (await bcrypt.compare(String(nova_senha), senhaHashAtual)) {
      return res.status(400).json({ erro: 'a nova senha deve ser diferente da atual' });
    }

    const senhaHash = await bcrypt.hash(String(nova_senha), 10);
    const cliente = await pool.connect();

    try {
      await cliente.query('BEGIN');
      await cliente.query(
        'UPDATE usuarios SET senha_hash = $1, senha_alterada_em = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2',
        [senhaHash, usuarioId]
      );
      await cliente.query(
        'UPDATE redefinicoes_senha SET usado = TRUE WHERE usuario_id = $1 AND usado = FALSE',
        [usuarioId]
      );
      await cliente.query('COMMIT');
    } catch (erroTransacao) {
      await cliente.query('ROLLBACK');
      throw erroTransacao;
    } finally {
      cliente.release();
    }

    return res.status(200).json({ mensagem: 'senha alterada com sucesso' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'erro interno do servidor' });
  }
});

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

module.exports = router;
