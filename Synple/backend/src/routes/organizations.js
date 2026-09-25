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
    return res.json(orgsRes.rows);
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

    const orgStatus = status || 'PENDING';
    const insertRes = await db.query(`
      INSERT INTO organizations (name, document, owner_id, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (document) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status
      RETURNING id, name, document, owner_id as "ownerId", status;
    `, [name.trim(), document.trim(), resolvedOwnerId, orgStatus]);

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

// PATCH /api/organizations/access-requests/:requestId - Atualizar status de solicitação de acesso
router.patch('/access-requests/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { status, role } = req.body;
  try {
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
