// backend/auth.js
//
// Middleware que verifica o token JWT enviado no header Authorization.
//
// Uso nas rotas protegidas:
//
// const autenticar = require('./auth');
//
// app.get('/usuario/me', autenticar, (req, res) => {
//   // req.usuarioId está disponível aqui
// });
//
// Depende da variável JWT_SECRET no .env.

const jwt = require('jsonwebtoken');
const pool = require('./db/pool');

async function autenticar(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      erro: 'não autorizado'
    });
  }

  const partes = header.split(' ');

  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({
      erro: 'não autorizado'
    });
  }

  const token = partes[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Quem implementar a rota de login deve gerar o token com:
    // jwt.sign(
    //   { usuarioId: usuario.id },
    //   process.env.JWT_SECRET,
    //   { expiresIn: '7d' }
    // )

    // Confere no banco: a conta ainda existe? A senha foi trocada depois que este
    // token foi emitido? (nesse caso o token deixa de valer em todos os aparelhos)
    const resultado = await pool.query(
      'SELECT senha_alterada_em, excluido_em FROM usuarios WHERE id = $1',
      [payload.usuarioId]
    );

    if (resultado.rows.length === 0 || resultado.rows[0].excluido_em) {
      return res.status(401).json({ erro: 'não autorizado' });
    }

    const { senha_alterada_em } = resultado.rows[0];

    if (senha_alterada_em && payload.iat < Math.floor(new Date(senha_alterada_em).getTime() / 1000)) {
      return res.status(401).json({ erro: 'não autorizado' });
    }

    req.usuarioId = payload.usuarioId;

    next();
  } catch (erro) {
    return res.status(401).json({
      erro: 'não autorizado'
    });
  }
}

module.exports = autenticar;