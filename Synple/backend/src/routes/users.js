const express = require('express');
const db = require('../db/connection');

function createUsersRouter(db) {
  const router = express.Router();

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
    let client;
    try {
      client = await db.pool.connect();
      await client.query('BEGIN');
      const target = await client.query('SELECT id FROM users WHERE id::text = $1 OR LOWER(email) = LOWER($1)', [id]);
      if (!target.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuário não encontrado no banco de dados.' });
      }
      const targetId = target.rows[0].id;
      // A ordem reunião -> usuário é a mesma usada ao enviar a ata para aprovação.
      await client.query(`SELECT m.id FROM meetings m WHERE
        m.created_by = $1
        OR EXISTS (SELECT 1 FROM commissions c JOIN organizations o ON o.id = c.organization_id WHERE c.id = m.commission_id AND o.owner_id = $1)
        OR EXISTS (SELECT 1 FROM meeting_invitations i WHERE i.meeting_id = m.id AND i.user_id = $1)
        OR EXISTS (SELECT 1 FROM meeting_attendance a WHERE a.meeting_id = m.id AND a.user_id = $1)
        OR EXISTS (SELECT 1 FROM meeting_minutes mm WHERE mm.meeting_id = m.id AND ($1 = ANY(mm.required_approver_ids) OR mm.created_by = $1 OR mm.updated_by = $1))
        ORDER BY m.id FOR UPDATE OF m`, [targetId]);
      const lockedUser = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [targetId]);
      if (!lockedUser.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuário não encontrado no banco de dados.' });
      }
      const snapshot = await client.query(`SELECT 1 FROM meeting_minutes
        WHERE status IN ('IN_REVIEW', 'APPROVED') AND $1 = ANY(required_approver_ids) LIMIT 1`, [targetId]);
      if (snapshot.rowCount) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Este usuário participa da aprovação de uma ata em revisão ou aprovada. A conta deve ser preservada para manter a presença e as decisões registradas.' });
      }
      const deleteRes = await client.query(
        'DELETE FROM users WHERE id::text = $1 OR LOWER(email) = LOWER($1) RETURNING id, name, email;',
        [id]
      );

      if (deleteRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuário não encontrado no banco de dados.' });
      }
      await client.query('COMMIT');
      return res.json({ success: true, deleted: deleteRes.rows[0] });
    } catch (err) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      if (err.code === '23503') return res.status(409).json({ error: 'Este usuário é responsável por reuniões ou atas e precisa ser preservado no histórico.' });
      console.error('Erro ao excluir usuário:', err.message);
      return res.status(500).json({ error: 'Falha ao excluir usuário no PostgreSQL.' });
    } finally { client?.release(); }
  });

  return router;
}

module.exports = createUsersRouter(db);
module.exports.createUsersRouter = createUsersRouter;
