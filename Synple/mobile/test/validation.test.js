const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeEmail,
  validateOrganization,
  validatePassword,
  validateUser,
} = require('../src/services/validation');

test('normaliza e valida e-mails', () => {
  assert.equal(normalizeEmail('  ANA@EXAMPLE.COM '), 'ana@example.com');
  assert.equal(validateUser({ name: 'Ana', email: 'ana@example.com' }), null);
  assert.ok(validateUser({ name: 'Ana', email: 'sem-email' }));
});

test('exige nome e CNPJ para organização', () => {
  assert.equal(validateOrganization({ name: 'Aurora', document: '12.345.678/0001-90' }), null);
  assert.ok(validateOrganization({ name: 'Aurora', document: '' }));
});

test('exige senha atual, mínimo de seis caracteres e confirmação', () => {
  assert.equal(validatePassword({ current: 'atual', next: 'nova12', confirm: 'nova12' }), null);
  assert.ok(validatePassword({ current: '', next: 'nova12', confirm: 'nova12' }));
  assert.ok(validatePassword({ current: 'atual', next: '12345', confirm: '12345' }));
  assert.ok(validatePassword({ current: 'atual', next: 'nova12', confirm: 'outra12' }));
});
