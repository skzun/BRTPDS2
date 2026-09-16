const express = require('express');
const router = express.Router();
const db = require('../db/connection');

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
  const { organizationId, name, type, description, memberIds } = req.body;

  try {
    const insertRes = await db.query(`
      INSERT INTO commissions (organization_id, name, type, description, status)
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      RETURNING id, organization_id as "organizationId", name, type, description, status;
    `, [organizationId, name.trim(), type || 'Comissão', description || null]);

    const newCommission = insertRes.rows[0];

    if (Array.isArray(memberIds)) {
      for (const uid of memberIds) {
        await db.query(`
          INSERT INTO commission_members (commission_id, user_id, role)
          VALUES ($1, $2, 'MEMBER')
          ON CONFLICT DO NOTHING;
        `, [newCommission.id, uid]);
      }
    }

    return res.status(201).json(newCommission);
  } catch (err) {
    console.error('Erro ao criar comissão:', err);
    return res.status(500).json({ error: 'Erro ao salvar comissão no PostgreSQL.' });
  }
});

module.exports = router;
