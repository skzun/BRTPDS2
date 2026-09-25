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
      for (const uid of memberIds) {
        const resolvedUid = await resolveUserId(uid);
        if (resolvedUid) {
          await db.query(`
            INSERT INTO commission_members (commission_id, user_id, role)
            VALUES ($1, $2, 'MEMBER')
            ON CONFLICT DO NOTHING;
          `, [newCommission.id, resolvedUid]);
        }
      }
    }

    return res.status(201).json(newCommission);
  } catch (err) {
    console.error('Erro ao criar comissão:', err);
    return res.status(500).json({ error: 'Erro ao salvar comissão no PostgreSQL.' });
  }
});

module.exports = router;
