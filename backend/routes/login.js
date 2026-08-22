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


const handleLogin = async () => {
    // Validação básica antes de enviar
    if (!email || !password) {
      Alert.alert('Atenção', 'E-mail e senha são obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {

      const apiUrl = 'http://localhost:3000/login';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Mudança aqui: mapeando "password" para "senha" como o backend pede
        body: JSON.stringify({ email: email, senha: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // HTTP 200 - Login com sucesso!
        console.log('Token JWT recebido:', data.token);
        console.log('Dados do usuário:', data.usuario);
        
        Alert.alert('Sucesso', `Bem-vindo(a), ${data.usuario.nome}!`);
        
        // TODO: Salvar o token no dispositivo e navegar para a Home

      } else {
        // HTTP 400 ou 401 - Erro tratado pelo backend
        // Mudança aqui: lendo "data.erro" em vez de "data.message"
        Alert.alert('Falha no Login', data.erro);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua internet ou se o backend está rodando no IP correto.');
    } finally {
      setIsLoading(false);
    }
  };