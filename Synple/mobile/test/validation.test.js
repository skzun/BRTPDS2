const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeEmail,
  validateCommission,
  validateLogin,
  validateRegistration,
  validateOrganization,
  validatePassword,
  validatePhone,
  validateUser,
} = require('../src/services/validation');
const { formatCNPJ, formatPhone } = require('../src/services/formatters');

test('normaliza e valida e-mails', () => {
  assert.equal(normalizeEmail('  ANA@EXAMPLE.COM '), 'ana@example.com');
  assert.equal(validateUser({ name: 'Ana', email: 'ana@example.com' }), null);
  assert.ok(validateUser({ name: 'Ana', email: 'sem-email' }));
});

test('exige e-mail e senha no login', () => {
  assert.equal(validateLogin({ email: 'ana@example.com', password: 'senha' }), null);
  assert.ok(validateLogin({ email: 'ana@example.com', password: '' }));
  assert.ok(validateLogin({ email: 'invalido', password: 'senha' }));
});

test('valida os dados necessários para cadastro', () => {
  assert.equal(validateRegistration({ name: 'Ana', email: 'ana@example.com', password: 'senha1', confirmPassword: 'senha1' }), null);
  assert.ok(validateRegistration({ name: '', email: 'ana@example.com', password: 'senha1', confirmPassword: 'senha1' }));
  assert.ok(validateRegistration({ name: 'Ana', email: 'ana@example.com', password: '12345', confirmPassword: '12345' }));
  assert.ok(validateRegistration({ name: 'Ana', email: 'ana@example.com', password: 'senha1', confirmPassword: 'senha2' }));
});

test('exige nome e CNPJ para organização', () => {
  assert.equal(validateOrganization({ name: 'Aurora', document: '12.345.678/0001-90' }), null);
  assert.ok(validateOrganization({ name: 'Aurora', document: '' }));
});

test('exige nome para comissão ou grupo de trabalho', () => {
  assert.equal(validateCommission({ name: 'Comissão de Eventos' }), null);
  assert.ok(validateCommission({ name: '' }));
  assert.ok(validateCommission({ name: '   ' }));
});

test('exige senha atual, mínimo de seis caracteres e confirmação', () => {
  assert.equal(validatePassword({ current: 'atual', next: 'nova12', confirm: 'nova12' }), null);
  assert.ok(validatePassword({ current: '', next: 'nova12', confirm: 'nova12' }));
  assert.ok(validatePassword({ current: 'atual', next: '12345', confirm: '12345' }));
  assert.ok(validatePassword({ current: 'atual', next: 'nova12', confirm: 'outra12' }));
});

test('formata telefone corretamente', () => {
  assert.equal(formatPhone(''), '');
  assert.equal(formatPhone('11'), '(11');
  assert.equal(formatPhone('119999'), '(11) 9999');
  assert.equal(formatPhone('1133334444'), '(11) 3333-4444');
  assert.equal(formatPhone('11987654321'), '(11) 98765-4321');
});

test('formata CNPJ corretamente', () => {
  assert.equal(formatCNPJ(''), '');
  assert.equal(formatCNPJ('12'), '12');
  assert.equal(formatCNPJ('12345'), '12.345');
  assert.equal(formatCNPJ('12345678'), '12.345.678');
  assert.equal(formatCNPJ('123456780001'), '12.345.678/0001');
  assert.equal(formatCNPJ('12345678000195'), '12.345.678/0001-95');
});

test('valida telefone celular e fixo', () => {
  assert.equal(validatePhone('(11) 98765-4321'), null);
  assert.equal(validatePhone('(11) 3333-4444'), null);
  assert.equal(validatePhone(''), null); // opcional
  assert.ok(validatePhone('123')); // curto demais
  assert.ok(validatePhone('11999999999999')); // longo demais
});

test('valida quantidade de dígitos do CNPJ', () => {
  assert.equal(validateOrganization({ name: 'Empresa', document: '12.345.678/0001-90' }), null);
  assert.ok(validateOrganization({ name: 'Empresa', document: '123' }));
  assert.ok(validateOrganization({ name: 'Empresa', document: '12.345.678/0001' }));
});

