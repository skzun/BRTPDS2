const express = require('express');
const router = express.Router();
const db = require('../db/connection');

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

// GET /api/organizations - Listagem
router.get('/', async (req, res) => {
  try {
    const orgsRes = await db.query('SELECT id, name, document, owner_id as "ownerId", status, created_at as "createdAt" FROM organizations ORDER BY created_at;');
    return res.json(orgsRes.rows.filter(o => !req.auth || req.auth.systemRole === 'SYSTEM_ADMIN' || o.ownerId === req.auth.id || o.status === 'APPROVED'));
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar organizações.' });
  }
});

// POST /api/organizations - Cadastro
router.post('/', async (req, res) => {
  const { name, document, ownerId, status } = req.body;

  if (!name || !document || !ownerId) {
    return res.status(400).json({ error: 'Nome, documento e proprietário são obrigatórios.' });
  }

  try {
    const resolvedOwnerId = await resolveUserId(ownerId);
    if (!resolvedOwnerId) {
      return res.status(400).json({ error: 'Proprietário não encontrado no PostgreSQL.' });
    }

    const duplicate = await db.query("SELECT 1 FROM organizations WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) OR regexp_replace(document, '[^0-9]', '', 'g') = $2", [name, document.replace(/\D/g, '')]);
    if (duplicate.rowCount) return res.status(409).json({ error: 'Nome ou CNPJ já cadastrado.' });
    if (document.replace(/\D/g, '').length !== 14) return res.status(400).json({ error: 'Informe um CNPJ com 14 dígitos.' });
    const orgStatus = status || 'PENDING';
    const insertRes = await db.query(`
      INSERT INTO organizations (name, document, owner_id, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (document) DO NOTHING
      RETURNING id, name, document, owner_id as "ownerId", status;
    `, [name.trim(), document.replace(/\D/g, ''), resolvedOwnerId, orgStatus]);

    if (insertRes.rowCount === 0) {
      return res.status(409).json({ error: 'Já existe uma organização com este CNPJ.' });
    }

    return res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error('Erro ao criar organização:', err);
    return res.status(500).json({ error: err.message.includes('unique') ? 'CNPJ já cadastrado.' : 'Erro ao salvar organização.' });
  }
});

// POST /api/organizations/:id/access-requests - Solicitação de entrada
router.post('/:id/access-requests', async (req, res) => {
  const { id: orgParam } = req.params;
  const { userId: userParam } = req.body;

  if (!orgParam || !userParam) {
    return res.status(400).json({ error: 'ID da organização e do usuário são obrigatórios.' });
  }

  try {
    const organizationId = await resolveOrganizationId(orgParam);
    const userId = await resolveUserId(userParam);

    if (!organizationId || !userId) {
      return res.status(400).json({ error: 'Organização ou usuário não encontrado no PostgreSQL.' });
    }

    const existing = await db.query(
      'SELECT id, organization_id as "organizationId", user_id as "userId", status, organization_role as "organizationRole" FROM access_requests WHERE organization_id = $1 AND user_id = $2;',
      [organizationId, userId]
    );

    if (existing.rowCount > 0) {
      return res.json(existing.rows[0]);
    }

    const insertRes = await db.query(`
      INSERT INTO access_requests (organization_id, user_id, status, organization_role)
      VALUES ($1, $2, 'PENDING', 'MEMBER')
      RETURNING id, organization_id as "organizationId", user_id as "userId", status, organization_role as "organizationRole";
    `, [organizationId, userId]);

    return res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error('Erro ao registrar solicitação de acesso:', err);
    return res.status(500).json({ error: 'Erro ao salvar solicitação no banco.' });
  }
});

router.post('/:id/invitations', async (req, res, next) => {
  try {
    const target = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND email_verified = TRUE', [String(req.body.email || '').trim()]);
    if (!target.rowCount) return res.status(404).json({ error: 'Conta ativa não encontrada para esse e-mail.' });
    if (target.rows[0].id === req.auth.id) return res.status(400).json({ error: 'Você já é o proprietário.' });
    const result = await db.query(`INSERT INTO access_requests (organization_id, user_id, status, organization_role, invited_by, invitation_accepted)
      VALUES ($1, $2, 'PENDING', 'MEMBER', $3, FALSE) ON CONFLICT (organization_id, user_id) DO NOTHING
      RETURNING id, organization_id AS "organizationId", user_id AS "userId", status, organization_role AS "organizationRole", invited_by AS "invitedBy", invitation_accepted AS "invitationAccepted"`,
      [req.params.id, target.rows[0].id, req.auth.id]);
    if (!result.rowCount) return res.status(409).json({ error: 'Essa pessoa já possui vínculo ou convite.' });
    res.status(201).json(result.rows[0]);
  } catch(error) { next(error); }
});
router.patch('/:id/invitations/:requestId', async (req, res, next) => {
  try {
    if (!['ACCEPTED', 'DECLINED'].includes(req.body.decision)) return res.status(400).json({ error: 'Resposta inválida.' });
    const result = await db.query(`UPDATE access_requests SET status = $1, invitation_accepted = $2, updated_at = NOW()
      WHERE id::text = $3 AND organization_id::text = $4 AND user_id = $5 AND invited_by IS NOT NULL AND status = 'PENDING'
      RETURNING id`, [req.body.decision === 'ACCEPTED' ? 'APPROVED' : 'REJECTED', req.body.decision === 'ACCEPTED', req.params.requestId, req.params.id, req.auth.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Convite não encontrado.' });
    res.json({ success: true });
  } catch(error) { next(error); }
});
// DELETE /api/organizations/:id - Excluir organização
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const orgId = await resolveOrganizationId(id);
    if (!orgId) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }

    const deleteRes = await db.query('DELETE FROM organizations WHERE id = $1 RETURNING id, name;', [orgId]);
    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }
    return res.json({ success: true, deleted: deleteRes.rows[0] });
  } catch (err) {
    console.error('Erro ao excluir organização:', err);
    return res.status(500).json({ error: 'Erro ao excluir organização no banco.' });
  }
});

// PATCH /api/organizations/:id/status - Alterar status da organização (APPROVED, PENDING, REJECTED)
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['APPROVED', 'PENDING', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Situação inválida.' });
  try {
    const orgId = await resolveOrganizationId(id);
    if (!orgId) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }

    const updateRes = await db.query(
      'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, status;',
      [status, orgId]
    );
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Organização não encontrada.' });
    }
    return res.json(updateRes.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar status da organização.' });
  }
});

// PATCH /api/organizations/:id/owner - Transfere a propriedade para um membro aprovado.
router.patch('/:id/owner', async (req, res) => {
  const { id } = req.params;
  const { currentOwnerId, newOwnerId } = req.body;
  let client;
  try {
    client = await db.pool.connect();
    const organizationId = await resolveOrganizationId(id);
    const currentOwner = await resolveUserId(currentOwnerId);
    const newOwner = await resolveUserId(newOwnerId);
    if (!organizationId || !currentOwner || !newOwner || currentOwner === newOwner) {
      return res.status(400).json({ error: 'Organização e participantes válidos são obrigatórios.' });
    }
    await client.query('BEGIN');
    const org = await client.query('SELECT id FROM organizations WHERE id = $1 AND owner_id = $2 FOR UPDATE', [organizationId, currentOwner]);
    if (!org.rowCount) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Somente o proprietário atual pode transferir a organização.' });
    }
    const member = await client.query("SELECT id FROM access_requests WHERE organization_id = $1 AND user_id = $2 AND status = 'APPROVED' FOR UPDATE", [organizationId, newOwner]);
    if (!member.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'O novo proprietário precisa ser membro aprovado da organização.' });
    }
    await client.query("INSERT INTO access_requests (organization_id, user_id, status, organization_role) VALUES ($1, $2, 'APPROVED', 'MEMBER') ON CONFLICT (organization_id, user_id) DO UPDATE SET status = 'APPROVED', organization_role = 'MEMBER', updated_at = NOW()", [organizationId, currentOwner]);
    const updated = await client.query('UPDATE organizations SET owner_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, document, owner_id as "ownerId", status', [newOwner, organizationId]);
    await client.query('COMMIT');
    return res.json(updated.rows[0]);
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Erro ao transferir organização:', err);
    return res.status(500).json({ error: 'Erro ao transferir a propriedade da organização.' });
  } finally {
    client?.release();
  }
});

// PATCH /api/organizations/:id - Atualizar dados básicos da organização.
router.patch('/:id', async (req, res) => {
  const { name, document, ownerId } = req.body;
  try {
    const organizationId = await resolveOrganizationId(req.params.id);
    const resolvedOwnerId = await resolveUserId(ownerId);
    if (!organizationId || !resolvedOwnerId || !name?.trim() || !document?.trim()) {
      return res.status(400).json({ error: 'Nome, CNPJ e proprietário são obrigatórios.' });
    }
    const result = await db.query('UPDATE organizations SET name = $1, document = $2, updated_at = NOW() WHERE id = $3 AND owner_id = $4 RETURNING id, name, document, owner_id as "ownerId", status', [name.trim(), document.replace(/\D/g, ''), organizationId, resolvedOwnerId]);
    if (!result.rowCount) return res.status(403).json({ error: 'Somente o proprietário pode alterar a organização.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar organização. Verifique se o CNPJ já está cadastrado.' });
  }
});

// PATCH /api/organizations/access-requests/:requestId - Atualizar status de solicitação de acesso
router.patch('/access-requests/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { status, role } = req.body;
  if (status && !['APPROVED', 'PENDING', 'REJECTED', 'REVOKED'].includes(status)) return res.status(400).json({ error: 'Situação inválida.' });
  if (role && !['MEMBER', 'COORDINATOR'].includes(role)) return res.status(400).json({ error: 'Cargo inválido.' });
  try {
    if (status === 'REVOKED') {
      const coordinated = await db.query(`SELECT 1 FROM commission_members cm JOIN commissions c ON c.id = cm.commission_id
        JOIN access_requests r ON r.organization_id = c.organization_id AND r.user_id = cm.user_id
        WHERE r.id::text = $1 AND cm.role = 'COORDINATOR'`, [requestId]);
      if (coordinated.rowCount) return res.status(409).json({ error: 'Transfira a coordenação das comissões antes de remover o membro.' });
    }
    const pendingInvitation = await db.query('SELECT id FROM access_requests WHERE id::text = $1 AND invited_by IS NOT NULL AND invitation_accepted = FALSE', [requestId]);
    if (pendingInvitation.rowCount) return res.status(409).json({ error: 'O destinatário precisa responder ao convite.' });
    const updateRes = await db.query(
      'UPDATE access_requests SET status = COALESCE($1, status), organization_role = COALESCE($2, organization_role), updated_at = NOW() WHERE id::text = $3 RETURNING id, status, organization_role as "organizationRole";',
      [status || null, role || null, requestId]
    );
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }
    return res.json(updateRes.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar solicitação de acesso.' });
  }
});

module.exports = router;
