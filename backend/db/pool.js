const { Pool, types } = require('pg');

// BIGINT (tipo 20) volta como texto por padrão; converte para número, como o API.md documenta.
types.setTypeParser(20, (valor) => parseInt(valor, 10));

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: true
});

module.exports = pool;