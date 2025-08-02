require('dotenv').config();
const pool = require('../config/db');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conectado em:', res.rows[0].now);
  } catch (err) {
    console.error('Erro ao conectar:', err);
  } finally {
    await pool.end();
  }
})();