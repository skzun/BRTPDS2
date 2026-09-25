const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/sync - Sincronização completa de dados com o app mobile
router.get('/', async (req, res) => {
  try {
    const usersRes = await db.query('SELECT id, name, email, phone, system_role as "systemRole", theme FROM users ORDER BY created_at;');
    const orgsRes = await db.query('SELECT id, name, document, owner_id as "ownerId", status FROM organizations ORDER BY created_at;');
    const reqsRes = await db.query('SELECT id, organization_id as "organizationId", user_id as "userId", status, organization_role as "organizationRole" FROM access_requests ORDER BY created_at;');
    const commsRes = await db.query('SELECT id, organization_id as "organizationId", name, type, description, status FROM commissions ORDER BY created_at;');
    const membersRes = await db.query('SELECT commission_id as "commissionId", user_id as "userId", role FROM commission_members;');
    const subsRes = await db.query('SELECT id, name, status FROM system_subsystems;');

    return res.json({
      users: usersRes.rows,
      organizations: orgsRes.rows,
      accessRequests: reqsRes.rows,
      commissions: commsRes.rows,
      commissionMembers: membersRes.rows,
      system: {
        initialized: true,
        initializedAt: new Date().toISOString(),
        subsystems: subsRes.rows,
      },
    });
  } catch (err) {
    console.error('Erro no endpoint /api/sync:', err);
    return res.status(500).json({ error: 'Falha ao sincronizar dados com o PostgreSQL.' });
  }
});

module.exports = router;
