const express = require('express');
const router = express.Router();
const db = require('../db/connection');

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

// PUT /api/users/:id - Atualizar perfil e preferências
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, theme } = req.body;

  try {
    const updateRes = await db.query(`
      UPDATE users
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          theme = COALESCE($4, theme),
          updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, email, phone, system_role as "systemRole", theme;
    `, [name ? name.trim() : null, email ? normalizeEmail(email) : null, phone ? phone.trim() : null, theme || null, id]);

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json(updateRes.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    return res.status(500).json({ error: 'Falha ao atualizar dados no PostgreSQL.' });
  }
});

// DELETE /api/users/:id - Excluir usuário pelo Administrador do Sistema
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleteRes = await db.query(
      'DELETE FROM users WHERE id::text = $1 OR LOWER(email) = LOWER($1) RETURNING id, name, email;',
      [id]
    );

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado no banco de dados.' });
    }

    return res.json({ success: true, deleted: deleteRes.rows[0] });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    return res.status(500).json({ error: 'Falha ao excluir usuário no PostgreSQL.' });
  }
});

module.exports = router;
