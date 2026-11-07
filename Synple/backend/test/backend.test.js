const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/db/connection');
const { Pool } = require('pg');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const originalPool = db.pool;
const schema = 'backend_test_' + randomUUID().replaceAll('-', '');
let pool;
test.before(async () => {
  await originalPool.query(`CREATE SCHEMA "${schema}"`);
  pool = new Pool({ ...originalPool.options, password: originalPool.options.password, options: `-c search_path=${schema}` });
  await pool.query(fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf8'));
  db.pool = pool; db.query = (...args) => pool.query(...args);
  for (const [name,email,role] of [['Admin','admin@synple.com','SYSTEM_ADMIN'],['Marina','marina@synple.com','USER'],['João','joao@synple.com','USER']]) {
    await pool.query('INSERT INTO users (name,email,password_hash,system_role) VALUES ($1,$2,$3,$4)',[name,email,'isolated-test-hash',role]);
  }
});

test('conecta com sucesso ao PostgreSQL Banco_synple', async () => {
  const res = await db.query('SELECT current_database(), version();');
  assert.equal(res.rows[0].current_database, process.env.DB_NAME || 'Banco_synple');
  assert.ok(res.rows[0].version.includes('PostgreSQL'));
});

test('verifica existência das tabelas oficiais, incluindo reuniões e atas do incremento 2', async () => {
  const res = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1
    ORDER BY table_name;
  `, [schema]);
  const tableNames = res.rows.map(r => r.table_name);
  const expectedTables = [
    'access_requests',
    'commission_members',
    'commissions',
    'meetings',
    'meeting_invitations',
    'meeting_attendance',
    'meeting_minutes',
    'meeting_minutes_approvals',
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

test('verifica suporte e fluxo de recuperação de senha (reset_token)', async () => {
  const email = 'temp.recovery@synple.com';
  const insert = await db.query(`
    INSERT INTO users (name, email, password_hash, system_role, reset_token, reset_token_expires)
    VALUES ('Temp Recovery', $1, 'oldhash', 'USER', '654321', NOW() + INTERVAL '15 minutes')
    RETURNING id, reset_token, reset_token_expires;
  `, [email]);

  assert.equal(insert.rows[0].reset_token, '654321');
  assert.ok(insert.rows[0].reset_token_expires);

  // Limpa o usuário de teste
  await db.query('DELETE FROM users WHERE email = $1;', [email]);
});

test.after(async () => {
  if (pool) await pool.end();
  await originalPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await originalPool.end();
});
