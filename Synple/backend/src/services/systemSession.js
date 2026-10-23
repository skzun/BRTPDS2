const crypto = require('crypto');
// Sessões do painel expiram em 8 horas e são invalidadas ao reiniciar a API.
const secret = crypto.randomBytes(32);
function createSystemSession(user) {
  if ((user.systemRole || user.system_role) !== 'SYSTEM_ADMIN') return undefined;
  const payload = Buffer.from(JSON.stringify({ id: user.id, expires: Date.now() + 8 * 3600000 })).toString('base64url');
  return `${payload}.${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
}
function readSystemSession(token = '') {
  const [payload, signature] = token.split('.');
  if (!payload || !/^[a-f0-9]{64}$/.test(signature || '')) return null;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return session.expires > Date.now() ? session : null;
  } catch { return null; }
}
module.exports = { createSystemSession, readSystemSession };
