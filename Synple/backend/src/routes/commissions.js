const express = require('express');
const db = require('../db/connection');

function createCommissionsRouter(db) {
  const router = express.Router();

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async function resolveUserId(userIdentifier) {
    if (!userIdentifier) return null;
    if (uuidRegex.test(userIdentifier)) return userIdentifier;
    const aliasMap = {
      'user-system-admin': 'admin@synple.com',
      'user-admin': 'marina@synple.com',
      'user-visitante': 'joao@synple.com',
    };
    const emailOrId = aliasMap[userIdentifier] || userIdentifier;
    const res = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR id::text = $1 LIMIT 1', [emailOrId]);
    return res.rows[0]?.id || null;
  }

  async function resolveOrganizationId(orgIdentifier) {
    if (!orgIdentifier) return null;
    if (uuidRegex.test(orgIdentifier)) return orgIdentifier;
    const aliasMap = {
      'org-aurora': '12.345.678/0001-90',
      'org-horizonte': '98.765.432/0001-10',
    };
    const docOrId = aliasMap[orgIdentifier] || orgIdentifier;
    const res = await db.query('SELECT id FROM organizations WHERE document = $1 OR id::text = $1 LIMIT 1', [docOrId]);
    return res.rows[0]?.id || null;
  }

  // GET /api/commissions - Listagem
  router.get('/', async (req, res) => {
    try {
      const commsRes = await db.query('SELECT id, organization_id as "organizationId", name, type, description, status, created_at as "createdAt" FROM commissions ORDER BY created_at;');
      return res.json(commsRes.rows);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao listar comissões.' });
    }
  });

  // POST /api/commissions - Criar comissão com membros
  router.post('/', async (req, res) => {
    const { organizationId: orgParam, name, type, description, memberIds } = req.body;

    if (!orgParam || !name) {
      return res.status(400).json({ error: 'Organização e nome da comissão são obrigatórios.' });
    }

    try {
      const organizationId = await resolveOrganizationId(orgParam);
      if (!organizationId) {
        return res.status(400).json({ error: 'Organização não encontrada no PostgreSQL.' });
      }

      const insertRes = await db.query(`
        INSERT INTO commissions (organization_id, name, type, description, status)
        VALUES ($1, $2, $3, $4, 'ACTIVE')
        RETURNING id, organization_id as "organizationId", name, type, description, status;
      `, [organizationId, name.trim(), type || 'Comissão', description || null]);

      const newCommission = insertRes.rows[0];

      if (Array.isArray(memberIds)) {
        for (const [index, uid] of memberIds.entries()) {
          const resolvedUid = await resolveUserId(uid);
          if (resolvedUid) {
            await db.query(`
              INSERT INTO commission_members (commission_id, user_id, role)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING;
            `, [newCommission.id, resolvedUid, index === 0 ? 'COORDINATOR' : 'MEMBER']);
          }
        }
      }

      return res.status(201).json(newCommission);
    } catch (err) {
      console.error('Erro ao criar comissão:', err);
      return res.status(500).json({ error: 'Erro ao salvar comissão no PostgreSQL.' });
    }
  });

  const memberTransaction = handler => async (req, res) => {
    let client;
    try {
      client = await db.pool.connect();
      await client.query('BEGIN');
      const { actorId, role } = req.body;
      if (req.method !== 'DELETE' && !['MEMBER', 'COORDINATOR'].includes(role)) {
        const error = new Error('O papel deve ser MEMBER ou COORDINATOR.'); error.status = 400; throw error;
      }
      const actor = await resolveMemberUser(client, actorId);
      const commission = await client.query(`SELECT c.id, c.organization_id AS "organizationId", o.owner_id AS "ownerId"
        FROM commissions c JOIN organizations o ON o.id = c.organization_id
        WHERE c.id::text = $1 FOR UPDATE OF c`, [req.params.commissionId]);
      if (!commission.rowCount) { const error = new Error('Comissão não encontrada.'); error.status = 404; throw error; }
      if (!actor || commission.rows[0].ownerId !== actor) {
        const error = new Error('Somente o proprietário da organização pode gerenciar os membros da comissão.'); error.status = 403; throw error;
      }
      const target = await resolveMemberUser(client, req.params.userId || req.body.userId);
      if (!target) { const error = new Error('Usuário não encontrado.'); error.status = 400; throw error; }
      if (req.method !== 'DELETE') {
        const eligible = target === commission.rows[0].ownerId || (await client.query(`SELECT 1 FROM access_requests
          WHERE organization_id = $1 AND user_id = $2 AND status = 'APPROVED'`, [commission.rows[0].organizationId, target])).rowCount > 0;
        if (!eligible) { const error = new Error('O usuário deve ter acesso aprovado à organização.'); error.status = 400; throw error; }
      }
      const result = await handler(client, commission.rows[0].id, target, role);
      await client.query('COMMIT');
      res.status(result.status || 200).json(result.data);
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      if (!error.status) console.error('Erro ao atualizar integrantes da comissão:', error.message);
      res.status(error.status || 500).json({ error: error.status ? error.message : 'Não foi possível atualizar os integrantes da comissão.' });
    } finally { client?.release(); }
  };

  async function resolveMemberUser(client, identifier) {
    if (typeof identifier !== 'string' || !identifier.trim()) return null;
    const aliases = { 'user-system-admin': 'admin@synple.com', 'user-admin': 'marina@synple.com', 'user-visitante': 'joao@synple.com' };
    const result = await client.query('SELECT id FROM users WHERE id::text = $1 OR LOWER(email) = LOWER($2) LIMIT 1', [identifier, aliases[identifier] || identifier]);
    return result.rows[0]?.id || null;
  }

  router.post('/:commissionId/members', memberTransaction(async (client, commissionId, userId, role) => {
    const result = await client.query(`INSERT INTO commission_members (commission_id, user_id, role) VALUES ($1, $2, $3)
      ON CONFLICT (commission_id, user_id) DO NOTHING RETURNING commission_id AS "commissionId", user_id AS "userId", role`, [commissionId, userId, role]);
    if (!result.rowCount) { const error = new Error('O usuário já integra esta comissão.'); error.status = 409; throw error; }
    return { status: 201, data: result.rows[0] };
  }));

  router.patch('/:commissionId/members/:userId', memberTransaction(async (client, commissionId, userId, role) => {
    const result = await client.query(`UPDATE commission_members SET role = $3 WHERE commission_id = $1 AND user_id = $2
      RETURNING commission_id AS "commissionId", user_id AS "userId", role`, [commissionId, userId, role]);
    if (!result.rowCount) { const error = new Error('Integrante não encontrado nesta comissão.'); error.status = 404; throw error; }
    return { data: result.rows[0] };
  }));

  router.delete('/:commissionId/members/:userId', memberTransaction(async (client, commissionId, userId) => {
    const result = await client.query('DELETE FROM commission_members WHERE commission_id = $1 AND user_id = $2 RETURNING user_id', [commissionId, userId]);
    if (!result.rowCount) { const error = new Error('Integrante não encontrado nesta comissão.'); error.status = 404; throw error; }
    return { data: { success: true } };
  }));

  return router;
}

module.exports = createCommissionsRouter(db);
module.exports.createCommissionsRouter = createCommissionsRouter;
