const db = require('../db/connection');
const deny = res => res.status(403).json({ error: 'Você não tem permissão para esta operação.' });

async function authorize(req, res, next) {
  try {
    const actor = req.auth;
    const admin = actor.systemRole === 'SYSTEM_ADMIN';
    const path = req.path;
    if (path.startsWith('/users')) {
      const target = decodeURIComponent(path.split('/')[2] || '');
      if (req.method === 'DELETE' ? !admin : target !== actor.id) return deny(res);
    }
    if (path.startsWith('/organizations')) {
      if (req.method === 'GET') return next();
      const parts = path.split('/').filter(Boolean);
      if (parts[2] === 'invitations' && parts[3] && req.method === 'PATCH') return next();
      if (parts.length === 1 && req.method === 'POST') {
        req.body.ownerId = actor.id; req.body.status = 'PENDING';
      } else if (parts[1] === 'access-requests') {
        const request = await db.query('SELECT r.user_id, o.owner_id FROM access_requests r JOIN organizations o ON o.id = r.organization_id WHERE r.id::text = $1', [parts[2]]);
        if (!request.rowCount) return res.status(404).json({ error: 'Solicitação não encontrada.' });
        if (request.rows[0].owner_id !== actor.id && !admin) return deny(res);
      } else if (parts[2] === 'access-requests') {
        req.body.userId = actor.id;
      } else {
        const org = await db.query('SELECT owner_id FROM organizations WHERE id::text = $1', [parts[1]]);
        if (!org.rowCount) return res.status(404).json({ error: 'Organização não encontrada.' });
        if (parts[2] === 'status') { if (!admin) return deny(res); }
        else if (org.rows[0].owner_id !== actor.id && !(admin && req.method === 'DELETE')) return deny(res);
        req.body.ownerId = actor.id;
      }
    }
    if (path.startsWith('/commissions') && req.method !== 'GET') {
      const commissionId = path.split('/')[2];
      const result = commissionId
        ? await db.query('SELECT o.owner_id FROM commissions c JOIN organizations o ON o.id = c.organization_id WHERE c.id::text = $1', [commissionId])
        : await db.query("SELECT owner_id FROM organizations WHERE id::text = $1 AND status = 'APPROVED'", [req.body.organizationId]);
      if (!result.rowCount || result.rows[0].owner_id !== actor.id) return deny(res);
    }
    next();
  } catch (error) { next(error); }
}
module.exports = { authorize };
