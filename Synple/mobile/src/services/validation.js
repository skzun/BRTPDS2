const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function validateOrganization({ name = '', document = '' }) {
  if (!name.trim() || !document.trim()) return 'Informe o nome e o CNPJ da organização.';
  return null;
}

function validateUser({ name = '', email = '' }) {
  if (!name.trim() || !EMAIL_PATTERN.test(normalizeEmail(email))) return 'Informe nome e um e-mail válido.';
  return null;
}

function validatePassword({ current = '', next = '', confirm = '' }) {
  if (!current || next.length < 6 || next !== confirm) {
    return 'Informe a senha atual; a nova senha deve ter ao menos 6 caracteres e coincidir com a confirmação.';
  }
  return null;
}

module.exports = { normalizeEmail, validateOrganization, validatePassword, validateUser };
