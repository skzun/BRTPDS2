const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db/connection');
const { sendPasswordResetEmail, sendActivationEmail } = require('../services/mailer');

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

const googleOAuthClient = new OAuth2Client();
const { issueSession, digest, rateLimit } = require('../services/security');
router.use((req, res, next) => {
  const limits = { name: 120, email: 150, phone: 30, password: 256, currentPassword: 256, nextPassword: 256, newPassword: 256, code: 64, idToken: 12000 };
  for (const [field, max] of Object.entries(limits)) {
    if (req.body?.[field] !== undefined && (typeof req.body[field] !== 'string' || req.body[field].length > max)) {
      return res.status(400).json({ error: `O campo ${field} é inválido.` });
    }
  }
  next();
});
// Limites curtos para desenvolvimento e uso normal, sem deixar tentativas ilimitadas.
router.use(['/login', '/google', '/change-password'], rateLimit(10, 120));
router.use(['/forgot-password', '/resend-activation'], rateLimit(3, 300));
router.use(['/reset-password', '/verify-email'], rateLimit(5, 300));

function getGoogleClientIds() {
  return (process.env.GOOGLE_OAUTH_CLIENT_IDS || '')
    .split(',')
    .map((clientId) => clientId.trim())
    .filter(Boolean);
}

// POST /api/auth/login - Autenticação com PostgreSQL
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1;', [cleanEmail]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    const user = userRes.rows[0];
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    if (!user.email_verified) return res.status(403).json({ error: 'Ative sua conta com o código enviado por e-mail.', code: 'EMAIL_NOT_VERIFIED' });
    return res.json({
      token: await issueSession(user.id),
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      systemRole: user.system_role,
      theme: user.theme,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro ao autenticar usuário.' });
  }
});

// POST /api/auth/register - Cadastro de novo usuário
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = (password || '').trim();

  if (!name || !cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1;', [cleanEmail]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    if (cleanPassword.length < 8 || typeof name !== 'string' || !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.' });
    }
    const code = crypto.randomInt(100000, 1000000).toString();
    const mail = await sendActivationEmail(cleanEmail, code);
    if (!mail.success) return res.status(503).json({ error: 'O envio do e-mail de ativação falhou. A conta não foi criada; tente novamente.' });
    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    await db.query(`INSERT INTO users (name, email, phone, password_hash, system_role, theme, email_verified, activation_hash, activation_expires)
      VALUES ($1, $2, $3, $4, 'USER', 'LIGHT', FALSE, $5, NOW() + INTERVAL '15 minutes')`,
      [name.trim(), cleanEmail, phone?.trim() || null, passwordHash, digest(code)]);
    return res.status(201).json({ requiresActivation: true, email: cleanEmail });
  } catch (err) {
    console.error('Erro no registro:', err);
    return res.status(500).json({ error: 'Erro ao registrar usuário no PostgreSQL.' });
  }
});

// POST /api/auth/google - Login ou cadastro com um ID token validado pelo Google
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  const clientIds = getGoogleClientIds();

  if (!idToken) {
    return res.status(400).json({ error: 'O token de identidade do Google é obrigatório.' });
  }
  if (clientIds.length === 0) {
    return res.status(503).json({ error: 'O login com Google ainda não foi configurado no servidor.' });
  }

  try {
    const ticket = await googleOAuthClient.verifyIdToken({ idToken, audience: clientIds });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const isEmailVerified = payload?.email_verified === true || payload?.email_verified === 'true';

    if (!payload?.sub || !email || !isEmailVerified) {
      return res.status(401).json({ error: 'A conta Google não forneceu um e-mail verificado.' });
    }

    const existingRes = await db.query(
      'SELECT id, name, email, phone, system_role as "systemRole", theme, google_id FROM users WHERE LOWER(email) = $1;',
      [email]
    );

    if (existingRes.rowCount > 0) {
      const existingUser = existingRes.rows[0];
      if (existingUser.google_id && existingUser.google_id !== payload.sub) {
        return res.status(409).json({ error: 'Este e-mail já está associado a outra conta Google.' });
      }

      const linkedUser = await db.query(`
        UPDATE users
        SET google_id = COALESCE(google_id, $1), email_verified = TRUE, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, email, phone, system_role as "systemRole", theme;
      `, [payload.sub, existingUser.id]);
      return res.json({ ...linkedUser.rows[0], token: await issueSession(linkedUser.rows[0].id), isNewUser: false });
    }

    const passwordHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
    const displayName = String(payload.name || email.split('@')[0]).trim().slice(0, 120);
    const createdUser = await db.query(`
      INSERT INTO users (name, email, password_hash, google_id, system_role, theme, email_verified)
      VALUES ($1, $2, $3, $4, 'USER', 'LIGHT', TRUE)
      RETURNING id, name, email, phone, system_role as "systemRole", theme;
    `, [displayName, email, passwordHash, payload.sub]);

    return res.status(201).json({ ...createdUser.rows[0], token: await issueSession(createdUser.rows[0].id), isNewUser: true });
  } catch (err) {
    console.error('Erro no login Google:', err.message);
    return res.status(401).json({ error: 'Não foi possível validar a identidade da conta Google.' });
  }
});

// POST /api/auth/change-password - Troca de senha segura
router.post('/change-password', async (req, res) => {
  const { currentPassword, nextPassword } = req.body;
  const userId = req.auth.id;
  if (typeof currentPassword !== 'string' || typeof nextPassword !== 'string' || nextPassword.length < 8) return res.status(400).json({ error: 'Informe a senha atual e uma nova senha com pelo menos 8 caracteres.' });

  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1;', [userId]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const user = userRes.rows[0];
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Senha atual informada está incorreta.' });
    }

    const newHash = bcrypt.hashSync(nextPassword, 10);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;', [newHash, userId]);

    await db.query('DELETE FROM auth_sessions WHERE user_id = $1', [userId]);
    return res.json({ success: true, message: 'Senha alterada com sucesso no PostgreSQL.' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    return res.status(500).json({ error: 'Erro ao trocar senha no banco de dados.' });
  }
});

// POST /api/auth/forgot-password - Envia código de redefinição ao e-mail cadastrado
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = normalizeEmail(email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'O e-mail é obrigatório.' });
  }

  const isGmail = process.env.SMTP_SERVICE === 'gmail' ||
    (process.env.SMTP_USER || '').toLowerCase().endsWith('@gmail.com') ||
    (process.env.SMTP_HOST || '').toLowerCase().includes('gmail');
  const mailIsConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && (isGmail || process.env.SMTP_HOST));
  if (!mailIsConfigured) {
    return res.status(503).json({ error: 'O envio de e-mail ainda não foi configurado no servidor.' });
  }

  try {
    const userRes = await db.query('SELECT id, name, email FROM users WHERE LOWER(email) = $1;', [cleanEmail]);
    if (userRes.rowCount === 0) {
      return res.json({ success: true, message: 'Se houver uma conta para este e-mail, enviaremos um código de recuperação.' });
    }

    const user = userRes.rows[0];

    // Gera código numérico aleatório de 6 dígitos
    const code = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');

    // Salva apenas o hash do código; o código em texto simples só vai por e-mail.
    await db.query(`
      UPDATE users 
      SET reset_token = $1, 
          reset_token_expires = NOW() + INTERVAL '15 minutes', 
          updated_at = NOW() 
      WHERE id = $2;
    `, [tokenHash, user.id]);

    const mailResult = await sendPasswordResetEmail(user.email, code);
    if (!mailResult.success) {
      await db.query(`
        UPDATE users SET reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
        WHERE id = $1 AND reset_token = $2;
      `, [user.id, tokenHash]);
      return res.status(502).json({ error: 'Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.' });
    }

    return res.json({
      success: true,
      message: 'Se houver uma conta para este e-mail, enviaremos um código de recuperação.',
    });
  } catch (err) {
    console.error('Erro em forgot-password:', err);
    return res.status(500).json({ error: 'Erro ao processar solicitação de recuperação de senha.' });
  }
});

// POST /api/auth/reset-password - Validação de código e redefinição de senha
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  const cleanEmail = normalizeEmail(email);
  const cleanCode = (code || '').trim();
  const cleanPassword = (newPassword || '').trim();

  if (!cleanEmail || !cleanCode || !cleanPassword) {
    return res.status(400).json({ error: 'E-mail, código de verificação e nova senha são obrigatórios.' });
  }

  if (cleanPassword.length < 8) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
  }

  try {
    const userRes = await db.query(`
      SELECT id, email, reset_token, reset_token_expires 
      FROM users 
      WHERE LOWER(email) = $1;
    `, [cleanEmail]);

    if (userRes.rowCount === 0) {
      return res.status(400).json({ error: 'Código incorreto ou expirado. Solicite outro código.' });
    }

    const user = userRes.rows[0];
    const tokenHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    if (!user.reset_token || user.reset_token !== tokenHash) {
      return res.status(400).json({ error: 'Código incorreto ou expirado. Solicite outro código.' });
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'O código de verificação expirou. Solicite um novo.' });
    }

    const newHash = bcrypt.hashSync(cleanPassword, 10);
    const reset = await db.query(`
      UPDATE users 
      SET password_hash = $1, 
          reset_token = NULL, 
          reset_token_expires = NULL, 
          updated_at = NOW() 
      WHERE id = $2 AND reset_token = $3 AND reset_token_expires > NOW() RETURNING id;
    `, [newHash, user.id, tokenHash]);

    if (!reset.rowCount) return res.status(400).json({ error: 'Código incorreto, expirado ou já utilizado.' });
    await db.query('DELETE FROM auth_sessions WHERE user_id = $1', [user.id]);
    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso no PostgreSQL! Você já pode fazer login.',
    });
  } catch (err) {
    console.error('Erro em reset-password:', err);
    return res.status(500).json({ error: 'Erro ao redefinir senha no banco de dados.' });
  }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const result = await db.query(`UPDATE users SET email_verified = TRUE, activation_hash = NULL, activation_expires = NULL
      WHERE LOWER(email) = $1 AND activation_hash = $2 AND activation_expires > NOW() RETURNING id`,
      [normalizeEmail(req.body.email), digest(String(req.body.code || ''))]);
    if (!result.rowCount) return res.status(400).json({ error: 'Código inválido ou expirado.' });
    res.json({ success: true });
  } catch (error) { next(error); }
});
router.post('/resend-activation', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await db.query('SELECT id FROM users WHERE LOWER(email) = $1 AND email_verified = FALSE', [email]);
    if (user.rowCount) {
      const code = crypto.randomInt(100000, 1000000).toString();
      const mail = await sendActivationEmail(email, code);
      if (!mail.success) return res.status(503).json({ error: 'Não foi possível enviar o e-mail.' });
      await db.query("UPDATE users SET activation_hash = $1, activation_expires = NOW() + INTERVAL '15 minutes' WHERE id = $2", [digest(code), user.rows[0].id]);
    }
    res.json({ success: true, message: 'Se houver cadastro pendente, enviaremos outro código.' });
  } catch (error) { next(error); }
});
router.get('/me', async (req, res, next) => {
  try { const user = await db.query('SELECT id, name, email, phone, system_role AS "systemRole", theme FROM users WHERE id = $1', [req.auth.id]); res.json(user.rows[0]); }
  catch (error) { next(error); }
});
router.post('/logout', async (req, res, next) => {
  try { await db.query('DELETE FROM auth_sessions WHERE token_hash = $1', [req.sessionHash]); res.json({ success: true }); }
  catch (error) { next(error); }
});
router.post('/download-ticket', async (req, res, next) => {
  try {
    if (typeof req.body.path !== 'string' || !/^\/meetings\/[a-f0-9-]+\/(?:(?:minutes|attendance)\/pdf|attachments\/[a-f0-9-]+)$/i.test(req.body.path)) return res.status(400).json({ error: 'Endereço de download inválido.' });
    const ticket = crypto.randomBytes(32).toString('hex');
    await db.query("DELETE FROM download_tickets WHERE expires_at < NOW()");
    await db.query("INSERT INTO download_tickets (token_hash, session_hash, path, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '60 seconds')", [digest(ticket), req.sessionHash, req.body.path]);
    res.json({ ticket });
  } catch(error) { next(error); }
});
module.exports = router;
