const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function validatePhone(phone = '') {
  if (!phone || !phone.trim()) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return 'O telefone deve conter DDD e 8 ou 9 dígitos (ex.: (11) 99999-9999).';
  }
  return null;
}

function validateOrganization({ name = '', document = '' }) {
  if (!name.trim() || !document.trim()) return 'Informe o nome e o CNPJ da organização.';
  const digits = String(document).replace(/\D/g, '');
  if (digits.length !== 14) return 'O CNPJ deve conter 14 dígitos (formato 00.000.000/0000-00).';
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

function validateRegistration({ name = '', email = '', phone = '', password = '', confirmPassword = '' }) {
  const userError = validateUser({ name, email });
  if (userError) return userError;
  if (phone) {
    const phoneError = validatePhone(phone);
    if (phoneError) return phoneError;
  }
  if (password.length < 6 || password !== confirmPassword) return 'A senha deve ter ao menos 6 caracteres e coincidir com a confirmação.';
  return null;
}

function validateCommission({ name = '' }) {
  if (!name.trim()) return 'Informe o nome da comissão ou grupo de trabalho.';
  return null;
}

module.exports = { normalizeEmail, validateCommission, validateLogin, validateOrganization, validatePassword, validatePhone, validateRegistration, validateUser };
