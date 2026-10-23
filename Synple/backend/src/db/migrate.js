const fs = require('fs');
const path = require('path');
const db = require('./connection');

// Atualiza tabelas/índices existentes sem executar seeds ou redefinir senhas.
async function migrateSchema(pool = db.pool) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('synple_schema_migration'))");
    await client.query(schema);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateSchema()
    .then(() => console.log('[Banco] Schema atualizado; dados e senhas preservados.'))
    .catch((error) => {
      console.error('[Banco] Não foi possível atualizar o schema:', error.message);
      process.exitCode = 1;
    })
    .finally(() => db.pool.end());
}

module.exports = { migrateSchema };
