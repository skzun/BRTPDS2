const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { initDatabase } = require('../src/db/init-db');
const { Client } = require('pg');

test('demonstração automática cria dados uma vez e preserva alterações', async () => {
  const schema = `test_demo_${randomUUID().replaceAll('-', '')}`;
  const client = new Client({ host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123', database: process.env.DB_NAME || 'Banco_synple' });
  const previous = process.env.PGOPTIONS;
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET search_path TO ${schema}`);
    process.env.PGOPTIONS = `-c search_path=${schema}`;
    await initDatabase({ onlyIfEmpty: true });
    assert.equal((await client.query('SELECT count(*)::int AS n FROM users')).rows[0].n, 3);
    await client.query("UPDATE users SET password_hash = 'changed' WHERE email = 'admin@synple.com'");
    await client.query("UPDATE organizations SET status = 'PENDING'");
    await initDatabase({ onlyIfEmpty: true });
    assert.equal((await client.query('SELECT count(*)::int AS n FROM users')).rows[0].n, 3);
    assert.equal((await client.query("SELECT password_hash FROM users WHERE email = 'admin@synple.com'")).rows[0].password_hash, 'changed');
    assert.equal((await client.query("SELECT count(*)::int AS n FROM organizations WHERE status <> 'PENDING'")).rows[0].n, 0);
  } finally {
    if (previous === undefined) delete process.env.PGOPTIONS;
    else process.env.PGOPTIONS = previous;
    await client.query(`DROP SCHEMA ${schema} CASCADE`);
    await client.end();
  }
});
