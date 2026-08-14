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

function autenticar(req, res, next) {
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

    req.usuarioId = payload.usuarioId;

    next();
  } catch (erro) {
    return res.status(401).json({
      erro: 'não autorizado'
    });
  }
}

module.exports = autenticar;