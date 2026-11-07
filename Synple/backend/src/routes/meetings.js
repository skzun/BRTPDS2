const express = require('express');
const db = require('../db/connection');
const crypto = require('node:crypto');
const { generateAttendancePdf } = require('../services/attendancePdf');
const { generateMeetingMinutesPdf } = require('../services/meetingMinutesPdf');

const aliases = { 'user-admin': 'marina@synple.com', 'user-visitante': 'joao@synple.com', 'user-system-admin': 'admin@synple.com' };
const meetingColumns = 'id, commission_id AS "commissionId", title, starts_at AS "startsAt", ends_at AS "endsAt", agenda, all_day AS "allDay", location, details, created_by AS "createdBy"';
const minutesColumns = `id, meeting_id AS "meetingId", content, status, version,
  required_approver_ids AS "requiredApproverIds", created_by AS "createdBy", updated_by AS "updatedBy",
  submitted_at AS "submittedAt", approved_at AS "approvedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;
const approvalColumns = `id, minutes_id AS "minutesId", meeting_id AS "meetingId", user_id AS "userId",
  version, decision, comment, decided_at AS "decidedAt"`;
const attendanceColumns = 'id, meeting_id AS "meetingId", user_id AS "userId", entered_at AS "enteredAt", left_at AS "leftAt", recorded_by AS "recordedBy", method';
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
  const result = await client.query(`SELECT m.id, m.commission_id AS "commissionId", m.starts_at AS "startsAt", m.ends_at AS "endsAt",
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

function createMeetingsRouter(database, { renderMinutesPdf = generateMeetingMinutesPdf, now = () => new Date() } = {}) {
  const router = express.Router();
  const codeLimit = require('../services/security').rateLimit(5, 900, { query: (...args) => database.pool.query(...args) });
  router.use((req, res, next) => req.body?.code === undefined ? next() : codeLimit(req, res, next));
  const actor = req => req.auth?.id || req.body.userId;
  const requireOngoing = meeting => {
    const time = new Date(now()).getTime();
    if (time < new Date(meeting.startsAt).getTime() || time >= new Date(meeting.endsAt).getTime()) {
      throw new RequestError(409, 'A presença só pode ser registrada durante o horário da reunião.');
    }
  };
  function validateSchedule(body) {
    const errors = {};
    const start = parseTimestamp(body.startsAt), end = parseTimestamp(body.endsAt);
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 160) errors.title = 'Informe um título de até 160 caracteres.';
    if (typeof body.agenda !== 'string' || !body.agenda.trim() || body.agenda.length > 10000) errors.agenda = 'Informe a pauta (até 10.000 caracteres).';
    if (!Number.isFinite(start) || start <= new Date(now()).getTime()) errors.startsAt = 'Escolha um início futuro.';
    if (!Number.isFinite(end) || end <= start) errors.endsAt = 'O término deve ser posterior ao início.';
    for (const [key, limit] of [['location', 300], ['details', 4000]]) if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > limit)) errors[key] = `Use até ${limit} caracteres.`;
    if (body.allDay !== undefined && typeof body.allDay !== 'boolean') errors.allDay = 'Informe se a reunião é de dia todo.';
    if (body.allDay === true && Number.isFinite(start) && Number.isFinite(end) && end - start < 23 * 3600000) errors.endsAt = 'Uma reunião de dia todo deve abranger ao menos um dia de calendário.';
    if (Object.keys(errors).length) { const error = new RequestError(400, 'Confira os campos destacados.'); error.fields = errors; throw error; }
    return { start, end };
  }
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
      res.status(err.status || 500).json({ error: err.status ? err.message : fallback, ...(err.fields ? { fields: err.fields } : {}) });
    } finally { client?.release(); }
  };

  router.post('/', transaction(async (req, client) => {
    const { commissionId, createdBy, title, startsAt, endsAt, agenda, inviteeIds = [] } = req.body;
    const { start, end } = validateSchedule(req.body);
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
    await client.query('UPDATE meetings SET all_day = $2, location = $3, details = $4 WHERE id = $1', [result.rows[0].id, req.body.allDay || false, req.body.location?.trim() || '', req.body.details?.trim() || '']);
    Object.assign(result.rows[0], { allDay: req.body.allDay || false, location: req.body.location?.trim() || '', details: req.body.details?.trim() || '' });
    for (const invitee of invitees) {
      await client.query(`INSERT INTO meeting_invitations (meeting_id, user_id, status, responded_at)
        VALUES ($1, $2::uuid, CASE WHEN $2::uuid = $3::uuid THEN 'ACCEPTED' ELSE 'INVITED' END, CASE WHEN $2::uuid = $3::uuid THEN NOW() ELSE NULL END)`, [result.rows[0].id, invitee, userId]);
    }
    return reply(result.rows[0], 201);
  }, 'Não foi possível agendar a reunião.'));

  router.patch('/:meetingId', transaction(async (req, client) => {
    const userId = await resolveUserId(client, actor(req));
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    requireManager(meeting);
    if (new Date(now()) >= new Date(meeting.startsAt)) throw new RequestError(409, 'Somente reuniões ainda não iniciadas podem ser editadas.');
    const { start, end } = validateSchedule(req.body);
    const used = await client.query('SELECT 1 FROM meeting_attendance WHERE meeting_id = $1 AND entered_at IS NOT NULL', [meeting.id]);
    if (used.rowCount) throw new RequestError(409, 'Esta reunião já possui presença e não pode ser reagendada.');
    const result = await client.query(`UPDATE meetings SET title=$2, agenda=$3, starts_at=$4, ends_at=$5,
      all_day=$6, location=$7, details=$8, updated_at=NOW() WHERE id=$1 RETURNING ${meetingColumns}`,
      [meeting.id, req.body.title.trim(), req.body.agenda.trim(), new Date(start).toISOString(), new Date(end).toISOString(), req.body.allDay || false, req.body.location?.trim() || '', req.body.details?.trim() || '']);
    await client.query("UPDATE meeting_invitations SET status = CASE WHEN user_id=$2 THEN 'ACCEPTED' ELSE 'INVITED' END, responded_at = CASE WHEN user_id=$2 THEN NOW() ELSE NULL END WHERE meeting_id=$1", [meeting.id, userId]);
    return reply(result.rows[0]);
  }, 'Não foi possível editar a reunião.'));

  router.patch('/:meetingId/invitation', transaction(async (req, client) => {
    const { userId: identifier, status } = req.body;
    if (!['ACCEPTED', 'DECLINED'].includes(status)) throw new RequestError(400, 'Resposta ao convite inválida.');
    const userId = await resolveUserId(client, identifier);
    if (!userId) throw new RequestError(400, 'Participante não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    if (new Date(now()) >= new Date(meeting.endsAt)) throw new RequestError(409, 'O prazo para responder a este convite terminou.');
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

  router.patch(['/:meetingId/attendance', '/:meetingId/attendance/:participantId'], transaction(async (req, client) => {
    const { userId: identifier, action } = req.body;
    if (!['ENTER', 'EXIT'].includes(action)) throw new RequestError(400, 'Ação de presença inválida.');
    const userId = await resolveUserId(client, req.params.participantId || identifier);
    if (!userId) throw new RequestError(400, 'Participante não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    requireOngoing(meeting);
    const actorId = await resolveUserId(client, actor(req));
    if (req.params.participantId) requireManager(await getMeeting(client, meeting.id, actorId));
    if (req.body.code !== undefined) {
      const code = await client.query('SELECT 1 FROM meeting_attendance_codes WHERE meeting_id=$1 AND code_hash=$2 AND expires_at > $3', [meeting.id, crypto.createHash('sha256').update(String(req.body.code)).digest('hex'), now()]);
      if (!code.rowCount) throw new RequestError(403, 'Código de presença inválido ou expirado.');
    }
    const invited = await client.query("SELECT 1 FROM meeting_invitations WHERE meeting_id = $1 AND user_id = $2 AND status = 'ACCEPTED'", [meeting.id, userId]);
    if (!invited.rowCount) throw new RequestError(403, 'Aceite o convite antes de registrar presença.');
    const existing = await client.query(`SELECT ${attendanceColumns} FROM meeting_attendance WHERE meeting_id = $1 AND user_id = $2`, [meeting.id, userId]);
    if (action === 'ENTER' && existing.rows[0]?.enteredAt && !existing.rows[0]?.leftAt) return reply(existing.rows[0]);
    if (action === 'ENTER') {
      const minutes = await client.query("SELECT 1 FROM meeting_minutes WHERE meeting_id = $1 AND status IN ('IN_REVIEW', 'APPROVED')", [meeting.id]);
      if (minutes.rowCount) throw new RequestError(409, 'A lista de presentes está fechada para aprovação da ata.');
      if (existing.rows[0]?.leftAt) throw new RequestError(409, 'A entrada e a saída desta reunião já foram registradas.');
    }
    const method = req.params.participantId ? 'CHAIR' : req.body.code !== undefined ? 'CODE' : 'SELF';
    const result = action === 'ENTER'
      ? await client.query(`INSERT INTO meeting_attendance (meeting_id, user_id, entered_at, recorded_by, method) VALUES ($1, $2, $3, $4, $5) RETURNING ${attendanceColumns}`, [meeting.id, userId, now(), actorId, method])
      : await client.query(`UPDATE meeting_attendance SET left_at = $3, recorded_by=$4, method=$5 WHERE meeting_id = $1 AND user_id = $2 AND entered_at IS NOT NULL AND left_at IS NULL RETURNING ${attendanceColumns}`, [meeting.id, userId, now(), actorId, method]);
    if (!result.rowCount) throw new RequestError(409, 'Registre a entrada antes da saída; a saída só pode ser registrada uma vez.');
    return reply(result.rows[0]);
  }, 'Não foi possível registrar a presença.'));

  router.post('/:meetingId/attendance-code', transaction(async (req, client) => {
    const meeting = await getMeeting(client, req.params.meetingId, actor(req));
    requireManager(meeting);
    requireOngoing(meeting);
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Math.min(new Date(now()).getTime() + 600000, new Date(meeting.endsAt).getTime()));
    await client.query(`INSERT INTO meeting_attendance_codes (meeting_id,code_hash,expires_at,created_by) VALUES ($1,$2,$3,$4)
      ON CONFLICT (meeting_id) DO UPDATE SET code_hash=EXCLUDED.code_hash, expires_at=EXCLUDED.expires_at, created_by=EXCLUDED.created_by`,
      [meeting.id, crypto.createHash('sha256').update(code).digest('hex'), expiresAt, actor(req)]);
    return reply({ code, expiresAt });
  }, 'Não foi possível gerar o código de presença.'));

  async function requireMeetingAccess(client, meetingId, userId) {
    const meeting = await getMeeting(client, meetingId, userId);
    const invitation = await client.query('SELECT 1 FROM meeting_invitations WHERE meeting_id=$1 AND user_id=$2', [meeting.id, userId]);
    if (!meeting.canManage && !invitation.rowCount) throw new RequestError(403, 'Você não tem acesso a esta reunião.');
    return meeting;
  }

  router.get('/:meetingId/attendance/pdf', async (req, res) => {
    let client;
    try {
      client = await database.pool.connect();
      await client.query('BEGIN');
      const meeting = await requireMeetingAccess(client, req.params.meetingId, req.auth?.id || req.query.userId);
      const details = await client.query(`SELECT m.title, m.starts_at AS "startsAt", m.ends_at AS "endsAt", o.name AS "organizationName", c.name AS "commissionName"
        FROM meetings m JOIN commissions c ON c.id=m.commission_id JOIN organizations o ON o.id=c.organization_id WHERE m.id=$1`, [meeting.id]);
      const rows = await client.query(`SELECT u.name, i.status AS "invitationStatus", a.entered_at AS "enteredAt", a.left_at AS "leftAt"
        FROM meeting_invitations i JOIN users u ON u.id=i.user_id LEFT JOIN meeting_attendance a ON a.meeting_id=i.meeting_id AND a.user_id=i.user_id
        WHERE i.meeting_id=$1 ORDER BY u.name,u.id`, [meeting.id]);
      await client.query('COMMIT');
      client.release(); client = null;
      const buffer = await generateAttendancePdf({ meeting: details.rows[0], attendance: rows.rows });
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="presenca-${meeting.id}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }).send(buffer);
    } catch (error) { if(client) await client.query('ROLLBACK').catch(() => {}); res.status(error.status || 500).json({ error: error.status ? error.message : 'Não foi possível gerar o PDF de presença.' }); }
    finally { client?.release(); }
  });

  router.get('/:meetingId/attachments', transaction(async (req, client) => {
    const meeting = await requireMeetingAccess(client, req.params.meetingId, req.auth?.id || req.query.userId);
    const result = await client.query('SELECT id,name,mime_type AS "mimeType",octet_length(content) AS size,created_at AS "createdAt" FROM meeting_attachments WHERE meeting_id=$1 ORDER BY created_at', [meeting.id]);
    return reply(result.rows);
  }, 'Não foi possível listar os anexos.'));

  router.post('/:meetingId/attachments', transaction(async (req, client) => {
    const meeting = await getMeeting(client, req.params.meetingId, actor(req));
    requireManager(meeting);
    const { name, mimeType, base64 } = req.body;
    const types = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
    if (typeof name !== 'string' || !name.trim() || name.length > 160 || /[\x00-\x1f\\/]/.test(name) || !types.includes(mimeType) || typeof base64 !== 'string' || base64.length > 6990508 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new RequestError(400, 'Selecione PDF, PNG, JPEG ou TXT válido, com nome de até 160 caracteres.');
    const content = Buffer.from(base64, 'base64');
    if (!content.length || content.length > 5242880) throw new RequestError(400, 'O arquivo deve ter entre 1 byte e 5 MB.');
    if ((mimeType === 'application/pdf' && !content.subarray(0,5).equals(Buffer.from('%PDF-'))) || (mimeType === 'image/png' && !content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) || (mimeType === 'image/jpeg' && (content[0] !== 255 || content[1] !== 216))) throw new RequestError(400, 'O conteúdo não corresponde ao tipo de arquivo.');
    const count = await client.query('SELECT COUNT(*)::int AS count FROM meeting_attachments WHERE meeting_id=$1', [meeting.id]);
    if (count.rows[0].count >= 10) throw new RequestError(409, 'Limite de dez anexos por reunião.');
    const result = await client.query('INSERT INTO meeting_attachments (meeting_id,name,mime_type,content,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,mime_type AS "mimeType",octet_length(content) AS size', [meeting.id, name.trim(), mimeType, content, actor(req)]);
    return reply(result.rows[0], 201);
  }, 'Não foi possível anexar o arquivo.'));

  router.get('/:meetingId/attachments/:attachmentId', async (req, res) => {
    let client;
    try {
      client = await database.pool.connect();
      await client.query('BEGIN');
      const meeting = await requireMeetingAccess(client, req.params.meetingId, req.auth?.id || req.query.userId);
      const result = await client.query('SELECT name,content FROM meeting_attachments WHERE id::text=$1 AND meeting_id=$2', [req.params.attachmentId, meeting.id]);
      if (!result.rowCount) throw new RequestError(404, 'Anexo não encontrado.');
      await client.query('COMMIT');
      res.set({ 'Content-Type':'application/octet-stream', 'Content-Disposition':`attachment; filename="anexo"; filename*=UTF-8''${encodeURIComponent(result.rows[0].name)}`, 'X-Content-Type-Options':'nosniff', 'Cache-Control':'private, no-store' }).send(result.rows[0].content);
    } catch(error) { if(client) await client.query('ROLLBACK').catch(() => {}); res.status(error.status || 500).json({error:error.status ? error.message : 'Não foi possível baixar o anexo.'}); }
    finally { client?.release(); }
  });

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

  router.get('/participation/report', async (req, res) => {
    try {
      const result = await database.pool.query(`SELECT m.id AS "meetingId", m.title, m.starts_at AS "startsAt", m.ends_at AS "endsAt",
          c.id AS "commissionId", c.name AS "commissionName", o.id AS "organizationId", o.name AS "organizationName",
          a.entered_at AS "enteredAt", a.left_at AS "leftAt", mm.status AS "minutesStatus"
        FROM meeting_attendance a JOIN meetings m ON m.id = a.meeting_id
        JOIN commissions c ON c.id = m.commission_id JOIN organizations o ON o.id = c.organization_id
        LEFT JOIN meeting_minutes mm ON mm.meeting_id = m.id
        WHERE a.user_id = $1 AND a.entered_at IS NOT NULL
        ORDER BY m.starts_at DESC, m.id`, [req.auth.id]);
      return res.json({ meetings: result.rows });
    } catch (err) {
      console.error('Não foi possível gerar o relatório individual de reuniões.', err.message);
      return res.status(500).json({ error: 'Não foi possível consultar seu histórico de participação.' });
    }
  });

  const voteColumns = `id, meeting_id AS "meetingId", question, status, created_by AS "createdBy",
    created_at AS "createdAt", closed_at AS "closedAt"`;

  router.post('/:meetingId/votes', transaction(async (req, client) => {
    const { userId: identifier, question, options } = req.body;
    if (typeof question !== 'string' || !question.trim() || question.trim().length > 500 ||
        !Array.isArray(options) || options.length < 2 || options.length > 8 ||
        options.some(option => typeof option !== 'string' || !option.trim() || option.trim().length > 160) ||
        new Set(options.map(option => option.trim().toLocaleLowerCase('pt-BR'))).size !== options.length) {
      throw new RequestError(400, 'Informe uma pergunta e de duas a oito opções diferentes (até 160 caracteres cada).');
    }
    const userId = await resolveUserId(client, identifier);
    if (!userId) throw new RequestError(400, 'Responsável pela votação não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    requireManager(meeting);
    const attendees = await client.query('SELECT 1 FROM meeting_attendance WHERE meeting_id = $1 AND entered_at IS NOT NULL LIMIT 1', [meeting.id]);
    if (!attendees.rowCount) throw new RequestError(409, 'Registre a presença de pelo menos um participante antes de abrir a votação.');
    const vote = await client.query(`INSERT INTO meeting_votes (meeting_id, question, created_by)
      VALUES ($1, $2, $3) RETURNING ${voteColumns}`, [meeting.id, question.trim(), userId]);
    const createdOptions = [];
    for (const [index, label] of options.entries()) {
      const option = await client.query(`INSERT INTO meeting_vote_options (vote_id, label, position)
        VALUES ($1, $2, $3) RETURNING id, vote_id AS "voteId", label, position`, [vote.rows[0].id, label.trim(), index + 1]);
      createdOptions.push(option.rows[0]);
    }
    return reply({ ...vote.rows[0], options: createdOptions }, 201);
  }, 'Não foi possível abrir a votação.'));

  router.post('/:meetingId/votes/:voteId/ballot', transaction(async (req, client) => {
    const { userId: identifier, optionId } = req.body;
    if (typeof optionId !== 'string') throw new RequestError(400, 'Selecione uma opção para votar.');
    const userId = await resolveUserId(client, identifier);
    if (!userId) throw new RequestError(400, 'Participante não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    const vote = await client.query(`SELECT id, status FROM meeting_votes WHERE id::text = $1 AND meeting_id = $2 FOR UPDATE`, [req.params.voteId, meeting.id]);
    if (!vote.rowCount) throw new RequestError(404, 'Votação não encontrada nesta reunião.');
    if (vote.rows[0].status !== 'OPEN') throw new RequestError(409, 'Esta votação já foi encerrada.');
    const attendance = await client.query('SELECT 1 FROM meeting_attendance WHERE meeting_id = $1 AND user_id = $2 AND entered_at IS NOT NULL', [meeting.id, userId]);
    if (!attendance.rowCount) throw new RequestError(403, 'Somente participantes com entrada registrada podem votar.');
    const result = await client.query(`INSERT INTO meeting_vote_ballots (vote_id, option_id, user_id)
      SELECT v.id, o.id, $3 FROM meeting_votes v JOIN meeting_vote_options o ON o.vote_id = v.id
      WHERE v.id = $1 AND o.id::text = $2
      ON CONFLICT (vote_id, user_id) DO UPDATE SET option_id = EXCLUDED.option_id, cast_at = NOW()
      RETURNING id, vote_id AS "voteId", option_id AS "optionId", user_id AS "userId", cast_at AS "castAt"`,
    [vote.rows[0].id, optionId, userId]);
    if (!result.rowCount) throw new RequestError(400, 'A opção escolhida não pertence a esta votação.');
    return reply(result.rows[0]);
  }, 'Não foi possível registrar o voto.'));

  router.patch('/:meetingId/votes/:voteId/close', transaction(async (req, client) => {
    const { userId: identifier } = req.body;
    const userId = await resolveUserId(client, identifier);
    if (!userId) throw new RequestError(400, 'Responsável pela votação não encontrado.');
    const meeting = await getMeeting(client, req.params.meetingId, userId);
    requireManager(meeting);
    const result = await client.query(`UPDATE meeting_votes SET status = 'CLOSED', closed_at = NOW()
      WHERE id::text = $1 AND meeting_id = $2 AND status = 'OPEN' RETURNING ${voteColumns}`,
    [req.params.voteId, meeting.id]);
    if (!result.rowCount) throw new RequestError(409, 'A votação não existe ou já foi encerrada.');
    return reply(result.rows[0]);
  }, 'Não foi possível encerrar a votação.'));

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
