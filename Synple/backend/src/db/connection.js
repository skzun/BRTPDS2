const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const isRemoteDb = process.env.DB_SSL === 'false'
  ? false
  : Boolean(
      process.env.DB_SSL === 'true' ||
      (process.env.DB_HOST && !['localhost', '127.0.0.1', 'postgres'].includes(process.env.DB_HOST))
    );

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'Banco_synple',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '123',
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL] Erro inesperado no pool de conexões:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
