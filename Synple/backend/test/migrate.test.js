const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const db = require('../src/db/connection');
const { migrateSchema } = require('../src/db/migrate');

test('migração repetida preserva usuários e senhas sem executar dados de demonstração', async () => {
  const schemaName = `migration_test_${randomUUID().replace(/-/g, '')}`;
  await db.query(`CREATE SCHEMA "${schemaName}"`);
  const isolatedPool = new Pool({
    ...db.pool.options,
    password: db.pool.options.password,
    connectionString: db.pool.options.connectionString,
    options: `-c search_path=${schemaName}`,
  });
  try {
    await migrateSchema(isolatedPool);
    const originalHash = 'hash-que-nao-deve-ser-substituido';
    await isolatedPool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
      ['Usuário da migração', 'migration@example.test', originalHash]
    );
    await migrateSchema(isolatedPool);
    const result = await isolatedPool.query('SELECT email, password_hash FROM users');
    assert.deepEqual(result.rows, [{ email: 'migration@example.test', password_hash: originalHash }]);
    const tables = await isolatedPool.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = $1', [schemaName]
    );
    for (const tableName of ['meetings', 'meeting_invitations', 'meeting_attendance', 'meeting_minutes', 'meeting_minutes_approvals']) {
      assert.ok(tables.rows.some((row) => row.table_name === tableName), `${tableName} deve existir`);
    }
  } finally {
    await isolatedPool.end();
    await db.query(`DROP SCHEMA "${schemaName}" CASCADE`);
  }
});

test.after(() => db.pool.end());
