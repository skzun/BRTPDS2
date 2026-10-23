const express = require('express');
const db = require('../db/connection');
const { generateMeetingMinutesPdf } = require('../services/meetingMinutesPdf');

const aliases = { 'user-admin': 'marina@synple.com', 'user-visitante': 'joao@synple.com', 'user-system-admin': 'admin@synple.com' };
const meetingColumns = 'id, commission_id AS "commissionId", title, starts_at AS "startsAt", ends_at AS "endsAt", agenda, created_by AS "createdBy"';
const minutesColumns = `id, meeting_id AS "meetingId", content, status, version,
  required_approver_ids AS "requiredApproverIds", created_by AS "createdBy", updated_by AS "updatedBy",
  submitted_at AS "submittedAt", approved_at AS "approvedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;
const approvalColumns = `id, minutes_id AS "minutesId", meeting_id AS "meetingId", user_id AS "userId",
  version, decision, comment, decided_at AS "decidedAt"`;
const attendanceColumns = 'id, meeting_id AS "meetingId", user_id AS "userId", entered_at AS "enteredAt", left_at AS "leftAt"';
const reply = (data, status = 200) => ({ data, status });

function parseTimestamp(value) {
  if (typeof value !== 'string') return NaN;
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/);
  if (!parts) return NaN;
  const [year, month, day, hour, minute, second] = parts.slice(1).map(part => Number(part || 0));
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || hour > 23 || minute > 59 || second > 59) return NaN;
  return Date.parse(value);
}

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function resolveUserId(client, identifier) {
  if (typeof identifier !== 'string' || !identifier.trim()) return null;
  const result = await client.query('SELECT id FROM users WHERE id::text = $1 OR LOWER(email) = LOWER($2) LIMIT 1', [identifier, aliases[identifier] || identifier]);
  return result.rows[0]?.id || null;
}

async function getMeeting(client, meetingId, userId) {
  const result = await client.query(`SELECT m.id, m.commission_id AS "commissionId",
      (o.owner_id = $2 OR EXISTS (SELECT 1 FROM commission_members cm
        WHERE cm.commission_id = m.commission_id AND cm.user_id = $2 AND cm.role = 'COORDINATOR')) AS "canManage"
    FROM meetings m JOIN commissions c ON c.id = m.commission_id
    JOIN organizations o ON o.id = c.organization_id WHERE m.id::text = $1 FOR UPDATE OF m`, [meetingId, userId]);
  if (!result.rowCount) throw new RequestError(404, 'Reunião não encontrada.');
  return result.rows[0];
}

function requireManager(meeting) {
  if (!meeting.canManage) throw new RequestError(403, 'Somente o presidente da comissão ou o proprietário da organização pode gerenciar a ata.');
}

function createMeetingsRouter(database, { renderMinutesPdf = generateMeetingMinutesPdf } = {}) {
  const router = express.Router();
  // Um mesmo lock serializa presença, submissão e votos para preservar o universo de aprovadores.
  const transaction = (handler, fallback) => async (req, res) => {
    let client;
    try {
      client = await database.pool.connect();
      await client.query('BEGIN');
      const result = await handler(req, client);
      await client.query('COMMIT');
      res.status(result.status).json(result.data);
    } catch (err) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      if (!err.status) console.error(fallback, err.message);
      res.status(err.status || 500).json({ error: err.status ? err.message : fallback });
    } finally { client?.release(); }
  };

  router.post('/', transaction(async (req, client) => {
    const { commissionId, createdBy, title, startsAt, endsAt, agenda, inviteeIds = [] } = req.body;
    const start = parseTimestamp(startsAt);
    const end = parseTimestamp(endsAt);
    if (typeof commissionId !== 'string' || typeof title !== 'string' || !title.trim() || title.trim().length > 160 ||
        typeof agenda !== 'string' || !agenda.trim() || !Number.isFinite(start) || !Number.isFinite(end) || end <= start ||
        !Array.isArray(inviteeIds) || inviteeIds.some(id => typeof id !== 'string')) {
      throw new RequestError(400, 'Informe título (até 160 caracteres), pauta, convidados e horários válidos para a reunião.');
    }
    const userId = await resolveUserId(client, createdBy);
    if (!userId) throw new RequestError(400, 'Responsável pela reunião não encontrado.');
    const permission = await client.query(`SELECT c.id FROM commissions c JOIN organizations o ON o.id = c.organization_id
      WHERE c.id::text = $1 AND (o.owner_id = $2 OR EXISTS (SELECT 1 FROM commission_members cm
        WHERE cm.commission_id = c.id AND cm.user_id = $2 AND cm.role = 'COORDINATOR')) FOR UPDATE OF c`, [commissionId, userId]);
    if (!permission.rowCount) throw new RequestError(403, 'Somente o presidente da comissão ou o proprietário da organização pode agendar reuniões.');
    const invitees = new Set([userId]);
    for (const identifier of inviteeIds) {
      const invitee = await resolveUserId(client, identifier);
      if (!invitee) throw new RequestError(400, 'Um dos convidados não foi encontrado.');
      if (invitee !== userId) {
        const member = await client.query('SELECT 1 FROM commission_members WHERE commission_id = $1 AND user_id = $2', [permission.rows[0].id, invitee]);
        if (!member.rowCount) throw new RequestError(400, 'Convide somente integrantes desta comissão.');
      }
      invitees.add(invitee);
    }
    const result = await client.query(`INSERT INTO meetings (commission_id, title, starts_at, ends_at, agenda, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${meetingColumns}`,
    [permission.rows[0].id, title.trim(), new Date(start).toISOString(), new Date(end).toISOString(), agenda.trim(), userId]);
    for (const invitee of invitees) {
      await client.query(`INSERT INTO meeting_invitations (meeting_id, user_id, status, responded_at)
        VALUES ($1, $2::uuid, CASE WHEN $2::uuid = $3::uuid THEN 'ACCEPTED' ELSE 'INVITED' END, CASE WHEN $2::uuid = $3::uuid THEN NOW() ELSE NULL END)`, [result.rows[0].id, invitee, userId]);
    }
    return reply(result.rows[0], 201);
  }, 'Não foi possível agendar a reunião.'));

  router.patch('/:meetingId/invitation', transaction(async (req, client) => {
    const { userId: identifier, status } = req.body;
    if (!['ACCEPTED', 'DECLINED'].includes(status)) throw new RequestError(400, 'Resposta ao convite inválida.');
    const userId = await resolveUserId(client, identifier);
    if (!userId) throw new RequestError(400, 'Participante não encontrado.');
    await getMeeting(client, req.params.meetingId, userId);
    if (status === 'DECLINED') {
      const attendance = await client.query('SELECT 1 FROM meeting_attendance WHERE meeting_id::text = $1 AND user_id = $2 AND entered_at IS NOT NULL', [req.params.meetingId, userId]);
      if (attendance.rowCount) throw new RequestError(409, 'A presença já foi registrada; o convite não pode mais ser recusado.');
    }
    const result = await client.query(`UPDATE meeting_invitations SET status = $1, responded_at = NOW()
      WHERE meeting_id::text = $2 AND user_id = $3
      RETURNING id, meeting_id AS "meetingId", user_id AS "userId", status, responded_at AS "respondedAt"`, [status, req.params.meetingId, userId]);
    if (!result.rowCount) throw new RequestError(404, 'Convite não encontrado.');
    return reply(result.rows[0]);
  }, 'Não foi possível responder ao convite.'));

  router.patch('/:meetingId/attendance', transaction(async (req, client) => {
    const { userId: identifier, action } = req.body;
    if (!['ENTER', 'EXIT'].includes(action)) throw new RequestError(400, 'Ação de presença inválida.');
    const userId = await resolveUserId(client, identifier);
    if (!userId) throw new RequestError(400, 'Participante não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    const invited = await client.query("SELECT 1 FROM meeting_invitations WHERE meeting_id = $1 AND user_id = $2 AND status = 'ACCEPTED'", [meeting.id, userId]);
    if (!invited.rowCount) throw new RequestError(403, 'Aceite o convite antes de registrar presença.');
    const existing = await client.query(`SELECT ${attendanceColumns} FROM meeting_attendance WHERE meeting_id = $1 AND user_id = $2`, [meeting.id, userId]);
    if (action === 'ENTER' && existing.rows[0]?.enteredAt && !existing.rows[0]?.leftAt) return reply(existing.rows[0]);
    if (action === 'ENTER') {
      const minutes = await client.query("SELECT 1 FROM meeting_minutes WHERE meeting_id = $1 AND status IN ('IN_REVIEW', 'APPROVED')", [meeting.id]);
      if (minutes.rowCount) throw new RequestError(409, 'A lista de presentes está fechada para aprovação da ata.');
      if (existing.rows[0]?.leftAt) throw new RequestError(409, 'A entrada e a saída desta reunião já foram registradas.');
    }
    const result = action === 'ENTER'
      ? await client.query(`INSERT INTO meeting_attendance (meeting_id, user_id, entered_at) VALUES ($1, $2, NOW()) RETURNING ${attendanceColumns}`, [meeting.id, userId])
      : await client.query(`UPDATE meeting_attendance SET left_at = NOW() WHERE meeting_id = $1 AND user_id = $2 AND entered_at IS NOT NULL AND left_at IS NULL RETURNING ${attendanceColumns}`, [meeting.id, userId]);
    if (!result.rowCount) throw new RequestError(409, 'Registre a entrada antes da saída; a saída só pode ser registrada uma vez.');
    return reply(result.rows[0]);
  }, 'Não foi possível registrar a presença.'));

  router.get('/:meetingId/attendance', transaction(async (req, client) => {
    const userId = await resolveUserId(client, req.query.userId);
    if (!userId) throw new RequestError(400, 'Participante não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    const invitation = await client.query('SELECT 1 FROM meeting_invitations WHERE meeting_id = $1 AND user_id = $2', [meeting.id, userId]);
    if (!meeting.canManage && !invitation.rowCount) throw new RequestError(403, 'A lista de presença está disponível aos convidados e ao presidente da comissão.');
    const result = await client.query(`SELECT a.id, i.meeting_id AS "meetingId", i.user_id AS "userId", u.name, u.email,
        i.status AS "invitationStatus", a.entered_at AS "enteredAt", a.left_at AS "leftAt"
      FROM meeting_invitations i JOIN users u ON u.id = i.user_id
      LEFT JOIN meeting_attendance a ON a.meeting_id = i.meeting_id AND a.user_id = i.user_id
      WHERE i.meeting_id = $1 ORDER BY u.name, u.id`, [meeting.id]);
    return reply(result.rows);
  }, 'Não foi possível consultar a lista de presença.'));

  // O HEAD faz a mesma validação de acesso e versão, sem gerar um documento.
  // O lock é liberado antes da renderização: o PDF recebe somente o snapshot lido.
  const minutesPdf = async (req, res) => {
    let client;
    res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    try {
      const version = typeof req.query.version === 'string' && /^[1-9]\d*$/.test(req.query.version)
        ? Number(req.query.version) : NaN;
      if (!Number.isSafeInteger(version) || version > 2147483647) {
        throw new RequestError(400, 'Informe a versão atual da ata para gerar o PDF.');
      }
      const timeZone = req.query.timeZone === undefined ? 'America/Sao_Paulo' : req.query.timeZone;
      try {
        if (typeof timeZone !== 'string' || !timeZone || timeZone.length > 100 || /^[+-]/.test(timeZone)) throw new Error('invalid');
        new Intl.DateTimeFormat('pt-BR', { timeZone }).format();
      } catch { throw new RequestError(400, 'Informe um fuso horário IANA válido.'); }
      client = await database.pool.connect();
      await client.query('BEGIN');
      const userId = await resolveUserId(client, req.query.userId);
      if (!userId) throw new RequestError(400, 'Participante não encontrado.');
      const meeting = await getMeeting(client, req.params.meetingId, userId);
      const invitation = await client.query('SELECT 1 FROM meeting_invitations WHERE meeting_id = $1 AND user_id = $2', [meeting.id, userId]);
      if (!meeting.canManage && !invitation.rowCount) throw new RequestError(403, 'A ata está disponível aos convidados e ao presidente da comissão.');
      const current = await client.query(`SELECT ${minutesColumns} FROM meeting_minutes WHERE meeting_id = $1`, [meeting.id]);
      if (!current.rowCount) throw new RequestError(404, 'Salve a ata antes de gerar o PDF.');
      const minutes = current.rows[0];
      if (minutes.version !== version) throw new RequestError(409, 'A ata foi atualizada. Atualize a reunião antes de gerar o PDF.');
      let snapshot;
      if (req.method !== 'HEAD') {
        const details = await client.query(`SELECT m.id, m.title, m.agenda, m.starts_at AS "startsAt", m.ends_at AS "endsAt",
            c.name AS "commissionName", o.name AS "organizationName", author.name AS "authorName", editor.name AS "editorName"
          FROM meetings m JOIN commissions c ON c.id = m.commission_id JOIN organizations o ON o.id = c.organization_id
          JOIN users author ON author.id = $2 JOIN users editor ON editor.id = $3 WHERE m.id = $1`, [meeting.id, minutes.createdBy, minutes.updatedBy]);
        const attendance = await client.query(`SELECT a.user_id AS "userId", u.name, a.entered_at AS "enteredAt", a.left_at AS "leftAt"
          FROM meeting_attendance a JOIN users u ON u.id = a.user_id
          WHERE a.meeting_id = $1 AND a.entered_at IS NOT NULL ORDER BY u.name, u.id`, [meeting.id]);
        const approvals = await client.query(`SELECT required.user_id AS "userId", COALESCE(u.name, 'Participante indisponível') AS name,
            a.decision, a.comment, a.decided_at AS "decidedAt"
          FROM unnest($1::uuid[]) AS required(user_id) LEFT JOIN users u ON u.id = required.user_id
          LEFT JOIN meeting_minutes_approvals a ON a.user_id = required.user_id AND a.minutes_id = $2 AND a.version = $3
          ORDER BY u.name, required.user_id`, [minutes.requiredApproverIds, minutes.id, minutes.version]);
        snapshot = { meeting: details.rows[0], minutes, attendance: attendance.rows, approvals: approvals.rows, timeZone, generatedAt: new Date() };
      }
      await client.query('COMMIT');
      client.release();
      client = null;
      const headers = {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ata-${meeting.id}-v${minutes.version}.pdf"`,
        'X-Minutes-Version': String(minutes.version),
        'X-Minutes-Status': minutes.status,
      };
      if (req.method === 'HEAD') return res.status(200).set(headers).end();
      const buffer = await renderMinutesPdf(snapshot);
      res.status(200).set(headers).send(buffer);
    } catch (err) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      if (!err.status) console.error('Não foi possível gerar o PDF da ata.', err.message);
      const status = err.status || 500;
      const errorCodes = { 400: 'INVALID_REQUEST', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'STALE_VERSION' };
      res.status(status).set('X-Pdf-Error', errorCodes[status] || 'GENERATION_FAILED')
        .json({ error: err.status ? err.message : 'Não foi possível gerar o PDF da ata.' });
    } finally { client?.release(); }
  };
  router.head('/:meetingId/minutes/pdf', minutesPdf);
  router.get('/:meetingId/minutes/pdf', minutesPdf);

  router.post('/:meetingId/minutes', transaction(async (req, client) => {
    const { userId: identifier, content } = req.body;
    if (typeof content !== 'string' || !content.trim() || content.length > 50000) throw new RequestError(400, 'Preencha o conteúdo da ata (até 50.000 caracteres).');
    const userId = await resolveUserId(client, identifier);
    if (!userId) throw new RequestError(400, 'Responsável pela ata não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    requireManager(meeting);
    const existing = await client.query(`SELECT ${minutesColumns} FROM meeting_minutes WHERE meeting_id = $1`, [meeting.id]);
    const current = existing.rows[0];
    if (current?.status === 'APPROVED') throw new RequestError(409, 'A ata aprovada não pode ser alterada.');
    if (current?.status === 'DRAFT' && current.content === content.trim()) return reply(current);
    const result = await client.query(`INSERT INTO meeting_minutes (meeting_id, content, created_by, updated_by)
      VALUES ($1, $2, $3, $3) ON CONFLICT (meeting_id) DO UPDATE SET content = EXCLUDED.content,
      status = 'DRAFT', version = meeting_minutes.version + 1, required_approver_ids = '{}', updated_by = EXCLUDED.updated_by,
      submitted_at = NULL, approved_at = NULL, updated_at = NOW() RETURNING ${minutesColumns}`, [meeting.id, content.trim(), userId]);
    await client.query('DELETE FROM meeting_minutes_approvals WHERE minutes_id = $1', [result.rows[0].id]);
    return reply(result.rows[0], current ? 200 : 201);
  }, 'Não foi possível salvar a ata.'));

  router.post('/:meetingId/minutes/submit', transaction(async (req, client) => {
    const userId = await resolveUserId(client, req.body.userId);
    if (!userId) throw new RequestError(400, 'Responsável pela ata não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    requireManager(meeting);
    const current = await client.query('SELECT id, status FROM meeting_minutes WHERE meeting_id = $1', [meeting.id]);
    if (!current.rowCount) throw new RequestError(404, 'Salve a ata antes de enviá-la para aprovação.');
    if (current.rows[0].status !== 'DRAFT') throw new RequestError(409, 'Somente um rascunho pode ser enviado. Corrija e salve a ata rejeitada antes de reenviar.');
    const participants = await client.query('SELECT user_id FROM meeting_attendance WHERE meeting_id = $1 AND entered_at IS NOT NULL ORDER BY user_id', [meeting.id]);
    if (!participants.rowCount) throw new RequestError(409, 'Registre a presença de pelo menos um participante antes de enviar a ata.');
    // Evita congelar um UUID cujo usuário está sendo excluído em outra transação.
    const participantIds = participants.rows.map(row => row.user_id);
    const voters = await client.query('SELECT id FROM users WHERE id = ANY($1::uuid[]) ORDER BY id FOR KEY SHARE', [participantIds]);
    if (voters.rowCount !== participantIds.length) throw new RequestError(409, 'A lista de presentes mudou. Atualize a reunião antes de enviar a ata.');
    const result = await client.query(`UPDATE meeting_minutes SET status = 'IN_REVIEW', required_approver_ids = $2,
      submitted_at = NOW(), updated_at = NOW(), updated_by = $3 WHERE meeting_id = $1 RETURNING ${minutesColumns}`, [meeting.id, participantIds, userId]);
    return reply(result.rows[0]);
  }, 'Não foi possível enviar a ata para aprovação.'));

  router.patch('/:meetingId/minutes/approval', transaction(async (req, client) => {
    const { userId: identifier, decision, comment = '', version } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(decision) || typeof comment !== 'string' || comment.length > 2000) throw new RequestError(400, 'Informe uma decisão válida e um comentário de até 2.000 caracteres.');
    if (!Number.isInteger(version) || version < 1) throw new RequestError(400, 'Informe a versão da ata que está sendo aprovada.');
    const userId = await resolveUserId(client, identifier);
    if (!userId) throw new RequestError(400, 'Participante não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    const current = await client.query(`SELECT ${minutesColumns} FROM meeting_minutes WHERE meeting_id = $1`, [meeting.id]);
    if (!current.rowCount) throw new RequestError(404, 'Ata não encontrada.');
    const minutes = current.rows[0];
    if (minutes.version !== version) throw new RequestError(409, 'A ata foi atualizada. Leia a versão atual antes de votar.');
    if (minutes.status !== 'IN_REVIEW') throw new RequestError(409, 'A ata não está aguardando aprovação.');
    if (!minutes.requiredApproverIds.includes(userId)) throw new RequestError(403, 'Somente quem registrou entrada antes do envio pode aprovar ou rejeitar esta versão.');
    const approval = await client.query(`INSERT INTO meeting_minutes_approvals (minutes_id, meeting_id, user_id, version, decision, comment)
      VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (minutes_id, user_id) DO UPDATE SET
      version = EXCLUDED.version, decision = EXCLUDED.decision, comment = EXCLUDED.comment, decided_at = NOW()
      RETURNING ${approvalColumns}`, [minutes.id, meeting.id, userId, minutes.version, decision, comment.trim()]);
    const approved = await client.query("SELECT COUNT(*)::int AS count FROM meeting_minutes_approvals WHERE minutes_id = $1 AND version = $2 AND decision = 'APPROVED' AND user_id = ANY($3::uuid[])", [minutes.id, minutes.version, minutes.requiredApproverIds]);
    const status = decision === 'REJECTED' ? 'REJECTED' : approved.rows[0].count === minutes.requiredApproverIds.length ? 'APPROVED' : 'IN_REVIEW';
    const result = await client.query(`UPDATE meeting_minutes SET status = $2::varchar,
      approved_at = CASE WHEN $2::varchar = 'APPROVED' THEN NOW() ELSE NULL END, updated_at = NOW()
      WHERE id = $1 RETURNING ${minutesColumns}`, [minutes.id, status]);
    return reply({ minutes: result.rows[0], approval: approval.rows[0] });
  }, 'Não foi possível registrar a aprovação da ata.'));

  return router;
}

module.exports = createMeetingsRouter(db);
module.exports.createMeetingsRouter = createMeetingsRouter;
