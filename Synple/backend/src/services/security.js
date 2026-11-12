const crypto = require('crypto');
const db = require('../db/connection');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const startedAt = new Date(Date.now() - process.uptime() * 1000).toISOString();

async function issueSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.query("INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')", [digest(token), userId]);
  return token;
}

async function authenticate(req, res, next) {
  try {
    if (['GET', 'HEAD'].includes(req.method) && /^\/meetings\/[a-f0-9-]+\/(?:(?:minutes|attendance)\/pdf|attachments\/[a-f0-9-]+)$/i.test(req.path) && typeof req.query.download === 'string') {
      const ticket = await db.query(`SELECT u.id, u.system_role AS "systemRole", u.email FROM download_tickets t
        JOIN auth_sessions s ON s.token_hash = t.session_hash JOIN users u ON u.id = s.user_id
        WHERE t.token_hash = $1 AND t.path = $2 AND t.expires_at > NOW() AND s.expires_at > NOW()`, [digest(req.query.download), req.path]);
      if (!ticket.rowCount) return res.status(401).json({ error: 'Link expirado. Gere o PDF novamente.' });
      req.auth = ticket.rows[0];
      return next();
    }
    const token = (req.headers.authorization || '').match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'Entre novamente para continuar.' });
    const result = await db.query(`SELECT u.id, u.system_role AS "systemRole", u.email FROM auth_sessions s
      JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW()`, [digest(token)]);
    if (!result.rowCount) return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
    req.auth = result.rows[0];
    req.sessionHash = digest(token);
    next();
  } catch (error) { next(error); }
}

// Limites persistentes por IP E conta, compartilhados entre processos da API.
function rateLimit(limit, seconds, database = db) {
  return async (req, res, next) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const route = req.baseUrl + req.path;
      const keys = [`${route}:ip:${req.ip}`, ...(email ? [`${route}:email:${email}`] : [])];
      for (const key of keys) {
        const result = await database.query(`INSERT INTO auth_rate_limits (key, attempts, expires_at)
          VALUES ($1, 1, NOW() + $2 * INTERVAL '1 second') ON CONFLICT (key) DO UPDATE
          SET attempts = CASE WHEN auth_rate_limits.expires_at <= NOW() THEN 1 ELSE auth_rate_limits.attempts + 1 END,
          expires_at = CASE
            WHEN auth_rate_limits.expires_at <= NOW() OR auth_rate_limits.expires_at > NOW() + $2 * INTERVAL '1 second'
              THEN EXCLUDED.expires_at
            ELSE auth_rate_limits.expires_at
          END
          RETURNING attempts`, [digest(key), seconds]);
        if (result.rows[0].attempts > limit) {
          res.set('Retry-After', String(seconds));
          return res.status(429).json({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
        }
      }
      next();
    } catch (error) { next(error); }
  };
}

function bindActor(req, res, next) {
  req.body ||= {};
  for (const field of ['actorId', 'createdBy', 'currentOwnerId']) req.body[field] = req.auth.id;
  if (req.path.startsWith('/meetings') || req.path.startsWith('/auth')) {
    req.body.userId = req.auth.id;
    req.query.userId = req.auth.id;
  }
  next();
}

const adminOnly = (req, res, next) => req.auth.systemRole === 'SYSTEM_ADMIN'
  ? next() : res.status(403).json({ error: 'Operação exclusiva do administrador do sistema.' });

// Retira dados de outras organizações, inclusive das coleções históricas de atas.
function scopeSnapshot(data, actor) {
  if (actor.systemRole === 'SYSTEM_ADMIN') return data;
  const own = data.organizations.filter(o => o.ownerId === actor.id);
  const orgIds = new Set([...own.map(o => o.id), ...data.accessRequests.filter(r => r.userId === actor.id && r.status === 'APPROVED').map(r => r.organizationId)]);
  const historicalMeetings = new Set(data.meetingInvitations.filter(i => i.userId === actor.id).map(i => i.meetingId));
  const commissionIds = new Set(data.commissions.filter(c => orgIds.has(c.organizationId)).map(c => c.id));
  for (const m of data.meetings) if (historicalMeetings.has(m.id)) commissionIds.add(m.commissionId);
  const managing = new Set(data.commissionMembers.filter(m => m.userId === actor.id && m.role === 'COORDINATOR').map(m => m.commissionId));
  const meetingIds = new Set(data.meetings.filter(m => historicalMeetings.has(m.id) || managing.has(m.commissionId) || own.some(o => data.commissions.some(c => c.id === m.commissionId && c.organizationId === o.id))).map(m => m.id));
  data.accessRequests = data.accessRequests.filter(r => r.userId === actor.id || own.some(o => o.id === r.organizationId));
  data.commissions = data.commissions.filter(c => commissionIds.has(c.id));
  data.commissionMembers = data.commissionMembers.filter(m => commissionIds.has(m.commissionId));
  for (const key of ['meetings', 'meetingInvitations', 'meetingAttendance', 'meetingMinutes', 'meetingMinutesApprovals',
    'meetingVotes', 'meetingVoteOptions', 'meetingVoteTallies', 'meetingVoteOwnBallots']) {
    data[key] = data[key].filter(item => meetingIds.has(key === 'meetings' ? item.id : item.meetingId));
  }
  const userIds = new Set([actor.id, ...data.accessRequests.map(r => r.userId), ...data.commissionMembers.map(m => m.userId), ...data.meetingInvitations.map(i => i.userId)]);
  data.users = data.users.filter(u => userIds.has(u.id));
  // Diretório de organizações para solicitar acesso: somente dados públicos básicos.
  data.organizations = data.organizations.filter(o => orgIds.has(o.id) || o.status === 'APPROVED');
  return data;
}

module.exports = { digest, issueSession, authenticate, bindActor, adminOnly, rateLimit, scopeSnapshot, startedAt };
