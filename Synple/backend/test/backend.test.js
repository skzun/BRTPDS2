const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/db/connection');

test('conecta com sucesso ao PostgreSQL Banco_synple', async () => {
  const res = await db.query('SELECT current_database(), version();');
  assert.equal(res.rows[0].current_database, process.env.DB_NAME || 'Banco_synple');
  assert.ok(res.rows[0].version.includes('PostgreSQL'));
});

test('verifica existência de todas as 6 tabelas oficiais do DER', async () => {
  const res = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  const tableNames = res.rows.map(r => r.table_name);
  const expectedTables = [
    'access_requests',
    'commission_members',
    'commissions',
    'organizations',
    'system_subsystems',
    'users'
  ];

  for (const expected of expectedTables) {
    assert.ok(tableNames.includes(expected), `Tabela ${expected} deve existir`);
  }
});

test('verifica os 3 usuários de teste pré-configurados no banco', async () => {
  const res = await db.query('SELECT email, system_role FROM users ORDER BY email;');
  const emails = res.rows.map(r => r.email);

  assert.ok(emails.includes('admin@synple.com'), 'Admin deve existir');
  assert.ok(emails.includes('marina@synple.com'), 'Marina deve existir');
  assert.ok(emails.includes('joao@synple.com'), 'João deve existir');

  const admin = res.rows.find(r => r.email === 'admin@synple.com');
  assert.equal(admin.system_role, 'SYSTEM_ADMIN');
});

test('exclui usuário do PostgreSQL com sucesso por id ou email', async () => {
  const insert = await db.query(`
    INSERT INTO users (name, email, password_hash, system_role)
    VALUES ('Temp Del Test', 'temp.del@synple.com', 'hash', 'USER')
    RETURNING id, email;
  `);
  const userId = insert.rows[0].id;

  const del = await db.query('DELETE FROM users WHERE id = $1 RETURNING id;', [userId]);
  assert.equal(del.rowCount, 1);

  const check = await db.query('SELECT id FROM users WHERE id = $1;', [userId]);
  assert.equal(check.rowCount, 0);
});

test.after(async () => {
  await db.pool.end();
});
