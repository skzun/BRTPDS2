const express = require('express');
const router = express.Router();
const db = require('../db/connection');

async function resolveUserId(identifier) {
  if (!identifier) return null;
  const aliases = { 'user-admin': 'marina@synple.com', 'user-visitante': 'joao@synple.com', 'user-system-admin': 'admin@synple.com' };
  const result = await db.query('SELECT id FROM users WHERE id::text = $1 OR LOWER(email) = LOWER($2) LIMIT 1', [identifier, aliases[identifier] || identifier]);
  return result.rows[0]?.id || null;
}

router.post('/', async (req, res) => {
  const { commissionId, createdBy, title, startsAt, endsAt, agenda, inviteeIds = [] } = req.body;
  if (!commissionId || !createdBy || !title?.trim() || !agenda?.trim() || !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) {
    return res.status(400).json({ error: 'Informe título, pauta e horários válidos para a reunião.' });
  }
  const client = await db.connect();
  try {
    const userId = await resolveUserId(createdBy);
    if (!userId) return res.status(400).json({ error: 'Responsável pela reunião não encontrado.' });
    await client.query('BEGIN');
    const permission = await client.query(`
      SELECT c.id, c.organization_id AS "organizationId"
      FROM commissions c JOIN organizations o ON o.id = c.organization_id
      WHERE c.id::text = $1 AND (o.owner_id = $2 OR EXISTS (
        SELECT 1 FROM commission_members cm WHERE cm.commission_id = c.id AND cm.user_id = $2 AND cm.role = 'COORDINATOR'
      )) FOR UPDATE OF c`, [commissionId, userId]);
    if (!permission.rowCount) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Somente o presidente da comissão ou o proprietário da organização pode agendar reuniões.' });
    }
    const meetingResult = await client.query(`
      INSERT INTO meetings (commission_id, title, starts_at, ends_at, agenda, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, commission_id as "commissionId", title, starts_at as "startsAt", ends_at as "endsAt", agenda, created_by as "createdBy"`,
    [permission.rows[0].id, title.trim(), startsAt, endsAt, agenda.trim(), userId]);
    const meeting = meetingResult.rows[0];
    const invitees = new Set(Array.isArray(inviteeIds) ? inviteeIds : []);
    invitees.add(createdBy);
    for (const invitee of invitees) {
      const resolvedInvitee = await resolveUserId(invitee);
      if (!resolvedInvitee) continue;
      const eligible = await client.query(`
        SELECT 1 FROM organizations o WHERE o.id = $1 AND o.owner_id = $2
        UNION SELECT 1 FROM access_requests ar WHERE ar.organization_id = $1 AND ar.user_id = $2 AND ar.status = 'APPROVED'
        UNION SELECT 1 FROM commission_members cm WHERE cm.commission_id = $3 AND cm.user_id = $2`,
      [permission.rows[0].organizationId, resolvedInvitee, commissionId]);
      if (!eligible.rowCount) continue;
      await client.query("INSERT INTO meeting_invitations (meeting_id, user_id, status, responded_at) VALUES ($1, $2, CASE WHEN $2 = $3 THEN 'ACCEPTED' ELSE 'INVITED' END, CASE WHEN $2 = $3 THEN NOW() ELSE NULL END) ON CONFLICT (meeting_id, user_id) DO NOTHING", [meeting.id, resolvedInvitee, userId]);
    }
    await client.query('COMMIT');
    return res.status(201).json(meeting);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao agendar reunião:', err);
    return res.status(500).json({ error: 'Não foi possível agendar a reunião.' });
  } finally {
    client.release();
  }
});

router.patch('/:meetingId/invitation', async (req, res) => {
  const { userId: userIdentifier, status } = req.body;
  if (!['ACCEPTED', 'DECLINED'].includes(status)) return res.status(400).json({ error: 'Resposta ao convite inválida.' });
  try {
    const userId = await resolveUserId(userIdentifier);
    const result = await db.query(`UPDATE meeting_invitations SET status = $1, responded_at = NOW()
      WHERE meeting_id::text = $2 AND user_id = $3 AND status IN ('INVITED', 'ACCEPTED', 'DECLINED')
      RETURNING id, meeting_id as "meetingId", user_id as "userId", status, responded_at as "respondedAt"`, [status, req.params.meetingId, userId]);
    if (!result.rowCount) return res.status(404).json({ error: 'Convite não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Não foi possível responder ao convite.' });
  }
});

router.patch('/:meetingId/attendance', async (req, res) => {
  const { userId: userIdentifier, action } = req.body;
  if (!['ENTER', 'EXIT'].includes(action)) return res.status(400).json({ error: 'Ação de presença inválida.' });
  try {
    const userId = await resolveUserId(userIdentifier);
    if (!userId) return res.status(400).json({ error: 'Participante não encontrado.' });
    const invited = await db.query("SELECT 1 FROM meeting_invitations WHERE meeting_id::text = $1 AND user_id = $2 AND status = 'ACCEPTED'", [req.params.meetingId, userId]);
    if (!invited.rowCount) return res.status(403).json({ error: 'Aceite o convite antes de registrar presença.' });
    const result = action === 'ENTER'
      ? await db.query(`INSERT INTO meeting_attendance (meeting_id, user_id, entered_at) VALUES ($1, $2, NOW())
          ON CONFLICT (meeting_id, user_id) DO UPDATE SET entered_at = COALESCE(meeting_attendance.entered_at, NOW())
          RETURNING id, meeting_id as "meetingId", user_id as "userId", entered_at as "enteredAt", left_at as "leftAt"`, [req.params.meetingId, userId])
      : await db.query(`UPDATE meeting_attendance SET left_at = NOW() WHERE meeting_id::text = $1 AND user_id = $2 AND entered_at IS NOT NULL AND left_at IS NULL
          RETURNING id, meeting_id as "meetingId", user_id as "userId", entered_at as "enteredAt", left_at as "leftAt"`, [req.params.meetingId, userId]);
    if (!result.rowCount) return res.status(409).json({ error: action === 'EXIT' ? 'Registre a entrada antes da saída.' : 'Presença não atualizada.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Não foi possível registrar a presença.' });
  }
});

module.exports = router;
