require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cadastroRoutes = require('./routes/cadastro');
const loginRoutes = require('./routes/login');
const usuarioRoutes = require('./routes/usuario');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/cadastro', cadastroRoutes);
app.use('/login', loginRoutes);
app.use('/usuario', usuarioRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});