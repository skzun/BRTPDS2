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
      if (!req.auth || req.auth.systemRole === 'SYSTEM_ADMIN') return res.json(commsRes.rows);
      const allowed = await db.query(`SELECT c.id FROM commissions c JOIN organizations o ON o.id = c.organization_id WHERE o.owner_id = $1
        OR EXISTS (SELECT 1 FROM access_requests r WHERE r.organization_id = o.id AND r.user_id = $1 AND r.status = 'APPROVED')
        OR EXISTS (SELECT 1 FROM meetings m JOIN meeting_invitations i ON i.meeting_id = m.id WHERE m.commission_id = c.id AND i.user_id = $1)`, [req.auth.id]);
      return res.json(commsRes.rows.filter(c => allowed.rows.some(a => a.id === c.id)));
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

    let client;
    try {
      client = await db.pool.connect();
      await client.query('BEGIN');
      const organizationId = await resolveOrganizationId(orgParam);
      if (!organizationId) {
        throw Object.assign(new Error('Organização não encontrada no PostgreSQL.'), { status: 400 });
      }
      if (req.auth) {
        const ownership = await client.query('SELECT id FROM organizations WHERE id = $1 AND owner_id = $2 FOR UPDATE', [organizationId, req.auth.id]);
        if (!ownership.rowCount) throw Object.assign(new Error('Somente o proprietário pode criar uma comissão.'), { status: 403 });
      }

      const insertRes = await client.query(`
        INSERT INTO commissions (organization_id, name, type, description, status)
        VALUES ($1, $2, $3, $4, 'ACTIVE')
        RETURNING id, organization_id as "organizationId", name, type, description, status;
      `, [organizationId, name.trim(), type || 'Comissão', description || null]);

      const newCommission = insertRes.rows[0];

      const selectedMembers = Array.isArray(memberIds) && memberIds.length ? memberIds : [req.auth?.id || req.body.actorId];
      if (!selectedMembers[0]) throw new Error('Coordenador obrigatório.');
      if (Array.isArray(selectedMembers)) {
        for (const [index, uid] of selectedMembers.entries()) {
          const resolvedUid = await resolveUserId(uid);
          if (!resolvedUid) throw Object.assign(new Error('Integrante não encontrado.'), { status: 400 });
          const eligible = await client.query(`SELECT 1 FROM organizations o WHERE o.id = $1 AND
            (o.owner_id = $2 OR EXISTS (SELECT 1 FROM access_requests r WHERE r.organization_id = o.id AND r.user_id = $2 AND r.status = 'APPROVED'))`, [organizationId, resolvedUid]);
          if (!eligible.rowCount) throw Object.assign(new Error('Os integrantes precisam ter acesso aprovado à organização.'), { status: 400 });
          if (resolvedUid) {
            await client.query(`
              INSERT INTO commission_members (commission_id, user_id, role)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING;
            `, [newCommission.id, resolvedUid, index === 0 ? 'COORDINATOR' : 'MEMBER']);
          }
        }
      }

      await client.query('COMMIT');
      return res.status(201).json(newCommission);
    } catch (err) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('Erro ao criar comissão:', err);
      return res.status(err.status || 500).json({ error: err.status ? err.message : 'Erro ao salvar comissão no PostgreSQL.' });
    } finally { client?.release(); }
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
      const currentCoordinator = await client.query("SELECT user_id FROM commission_members WHERE commission_id = $1 AND role = 'COORDINATOR'", [commission.rows[0].id]);
      if (currentCoordinator.rows[0]?.user_id === target && (req.method === 'DELETE' || role === 'MEMBER')) {
        const error = new Error('Escolha outro coordenador antes de remover ou rebaixar o atual.'); error.status = 409; throw error;
      }
      if (role === 'COORDINATOR') await client.query("UPDATE commission_members SET role = 'MEMBER' WHERE commission_id = $1 AND role = 'COORDINATOR' AND user_id <> $2", [commission.rows[0].id, target]);
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

  router.patch('/:commissionId', async (req, res, next) => {
    try {
      const { name, type, description, status } = req.body;
      if (typeof name !== 'string' || !name.trim() || (status && !['ACTIVE', 'INACTIVE'].includes(status))) return res.status(400).json({ error: 'Nome e situação válidos são obrigatórios.' });
      const result = await db.query('UPDATE commissions SET name = $1, type = $2, description = $3, status = COALESCE($4, status), updated_at = NOW() WHERE id::text = $5 RETURNING id', [name.trim(), type || 'Comissão', description || null, status, req.params.commissionId]);
      if (!result.rowCount) return res.status(404).json({ error: 'Comissão não encontrada.' });
      res.json({ success: true });
    } catch(error) { next(error); }
  });
  router.delete('/:commissionId', async (req, res, next) => {
    try {
      const result = await db.query('DELETE FROM commissions WHERE id::text = $1 AND NOT EXISTS (SELECT 1 FROM meetings WHERE commission_id = commissions.id) RETURNING id', [req.params.commissionId]);
      if (!result.rowCount) return res.status(409).json({ error: 'Comissão com reuniões históricas não pode ser excluída. Marque-a como inativa.' });
      res.json({ success: true });
    } catch(error) { next(error); }
  });
  return router;
}

module.exports = createCommissionsRouter(db);
module.exports.createCommissionsRouter = createCommissionsRouter;
