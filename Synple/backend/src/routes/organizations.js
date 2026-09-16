const express = require('express');
const router = express.Router();
const db = require('../db/connection');

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
  const { name, document, ownerId } = req.body;

  try {
    const insertRes = await db.query(`
      INSERT INTO organizations (name, document, owner_id, status)
      VALUES ($1, $2, $3, 'APPROVED')
      RETURNING id, name, document, owner_id as "ownerId", status;
    `, [name.trim(), document.trim(), ownerId]);

    return res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error('Erro ao criar organização:', err);
    return res.status(500).json({ error: err.message.includes('unique') ? 'CNPJ já cadastrado.' : 'Erro ao salvar organização.' });
  }
});

module.exports = router;
