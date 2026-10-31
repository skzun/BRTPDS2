const test = require('node:test');
const assert = require('node:assert/strict');
const { removeCredentials } = require('../src/services/cacheSafety');
test('cache migra dados antigos sem senhas, tokens ou credenciais aninhadas', () => {
  const source = { users: [{ id: '1', password: 'antiga', password_hash: 'hash', name: 'Ana' }], token: 'sessao', extra: { clientSecret: 'segredo', ok: true } };
  assert.deepEqual(removeCredentials(source), { users: [{ id: '1', name: 'Ana' }], extra: { ok: true } });
  assert.equal(source.users[0].password, 'antiga');
});
