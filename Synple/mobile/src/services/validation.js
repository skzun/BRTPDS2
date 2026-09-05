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

function validateLogin({ email = '', password = '' }) {
  if (!EMAIL_PATTERN.test(normalizeEmail(email)) || !password) return 'Informe um e-mail válido e uma senha.';
  return null;
}

function validateRegistration({ name = '', email = '', password = '', confirmPassword = '' }) {
  const userError = validateUser({ name, email });
  if (userError) return userError;
  if (password.length < 6 || password !== confirmPassword) return 'A senha deve ter ao menos 6 caracteres e coincidir com a confirmação.';
  return null;
}

module.exports = { normalizeEmail, validateLogin, validateOrganization, validatePassword, validateRegistration, validateUser };
