const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const { Pool } = require('pg');
const db = require('../src/db/connection');
const { createMeetingsRouter } = require('../src/routes/meetings');
const { createSyncRouter } = require('../src/routes/sync');
const { createCommissionsRouter } = require('../src/routes/commissions');
const { createUsersRouter } = require('../src/routes/users');
const { generateMeetingMinutesPdf } = require('../src/services/meetingMinutesPdf');

// O esquema exclusivo impede que os testes alterem contas, senhas ou reuniões reais.
describe('Incremento 2: reuniões, presença e aprovação de atas', { concurrency: false }, () => {
  const schema = `test_meetings_${randomUUID().replaceAll('-', '')}`;
  let pool;
  let server;
  let base;
  let ids;
  let pdfRenderCalls;
  let pdfRenderFailure;
  let clock = new Date('2026-10-22T12:00:00Z');

  async function request(method, route, body) {
    const response = await fetch(`${base}${route}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  }

  const meetingBody = (extra = {}) => ({
    commissionId: ids.commission, createdBy: ids.chair,
    title: ' Reunião de planejamento ', agenda: ' Pauta da reunião ',
    startsAt: '2026-10-22T10:00:00-03:00', endsAt: '2026-10-22T11:00:00-03:00',
    inviteeIds: [ids.member, ids.late], ...extra,
  });
  async function createMeeting(extra) {
    clock = new Date('2026-10-22T12:00:00Z');
    const result = await request('POST', '/', meetingBody(extra));
    clock = new Date('2026-10-22T13:30:00Z');
    assert.equal(result.status, 201, JSON.stringify(result.data));
    return result.data.id;
  }
  const document = (id, userId = ids.chair, version = 1, extra = '', method = 'GET') => fetch(`${base}/${id}/minutes/pdf?userId=${userId}&version=${version}${extra}`, { method });
  const invite = (id, userId, status = 'ACCEPTED') => request('PATCH', `/${id}/invitation`, { userId, status });
  const attend = (id, userId, action = 'ENTER') => request('PATCH', `/${id}/attendance`, { userId, action });
  const save = (id, content = 'Foi discutido e aprovado o plano de trabalho.', userId = ids.chair) => request('POST', `/${id}/minutes`, { userId, content });
  const submit = (id, userId = ids.chair) => request('POST', `/${id}/minutes/submit`, { userId });
  const vote = (id, userId, decision = 'APPROVED', version = 1) => request('PATCH', `/${id}/minutes/approval`, { userId, decision, version, comment: decision === 'REJECTED' ? 'Corrigir o encaminhamento.' : '' });

  before(async () => {
    await db.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({ ...db.pool.options, password: db.pool.options.password,
      connectionString: db.pool.options.connectionString, options: `-c search_path=${schema}`, max: 4 });
    const ddl = await readFile(path.join(__dirname, '../src/db/schema.sql'), 'utf8');
    await pool.query(ddl);
    const app = express();
    app.use(express.json());
    app.use('/meetings', createMeetingsRouter({ pool }, { now: () => clock, renderMinutesPdf: async snapshot => {
      pdfRenderCalls++;
      if (pdfRenderFailure) throw new Error('Falha de renderização isolada');
      // Se a rota ainda segurasse o lock durante a geração, esta consulta falharia.
      const probe = await pool.connect();
      try {
        await probe.query('BEGIN');
        await probe.query('SELECT id FROM meetings WHERE id = $1 FOR UPDATE NOWAIT', [snapshot.meeting.id]);
        await probe.query('ROLLBACK');
      } finally { probe.release(); }
      return generateMeetingMinutesPdf(snapshot);
    } }));
    app.use('/sync', createSyncRouter(pool));
    app.use('/commissions', createCommissionsRouter({ pool, query: (...args) => pool.query(...args) }));
    app.use('/users', createUsersRouter({ pool, query: (...args) => pool.query(...args) }));
    server = await new Promise(resolve => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    base = `http://127.0.0.1:${server.address().port}/meetings`;
  });

  beforeEach(async () => {
    clock = new Date('2026-10-22T12:00:00Z');
    pdfRenderCalls = 0;
    pdfRenderFailure = false;
    await pool.query(`TRUNCATE TABLE "${schema}".users CASCADE`);
    ids = {};
    for (const role of ['owner', 'chair', 'member', 'late', 'outsider', 'noaccess']) {
      const result = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id', [role, `${role}@example.invalid`, 'isolated-test-hash']);
      ids[role] = result.rows[0].id;
    }
    const org = await pool.query("INSERT INTO organizations (name, document, owner_id, status) VALUES ('Teste isolado', 'test-document', $1, 'ACTIVE') RETURNING id", [ids.owner]);
    ids.organization = org.rows[0].id;
    const commission = await pool.query("INSERT INTO commissions (organization_id, name) VALUES ($1, 'Comissão de teste') RETURNING id", [ids.organization]);
    ids.commission = commission.rows[0].id;
    for (const role of ['chair', 'member', 'late']) {
      await pool.query('INSERT INTO commission_members (commission_id, user_id, role) VALUES ($1, $2, $3)', [ids.commission, ids[role], role === 'chair' ? 'COORDINATOR' : 'MEMBER']);
    }
    // Um membro da organização que não integra a comissão não pode ser convidado.
    await pool.query("INSERT INTO access_requests (organization_id, user_id, status) VALUES ($1, $2, 'APPROVED')", [ids.organization, ids.outsider]);
  });

  after(async () => {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (pool) await pool.end();
    await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await db.pool.end();
  });

  test('agenda transacionalmente, normaliza campos e deduplica convidados', async () => {
    const id = await createMeeting({ inviteeIds: [ids.member, 'member@example.invalid', ids.chair] });
    const stored = await pool.query('SELECT title, agenda, starts_at FROM meetings WHERE id = $1', [id]);
    assert.equal(stored.rows[0].title, 'Reunião de planejamento');
    assert.equal(stored.rows[0].agenda, 'Pauta da reunião');
    assert.equal(stored.rows[0].starts_at.toISOString(), '2026-10-22T13:00:00.000Z');
    const invitations = await pool.query('SELECT user_id, status FROM meeting_invitations WHERE meeting_id = $1', [id]);
    assert.equal(invitations.rowCount, 2);
    assert.equal(invitations.rows.find(row => row.user_id === ids.chair).status, 'ACCEPTED');
    assert.equal(invitations.rows.find(row => row.user_id === ids.member).status, 'INVITED');
    assert.equal((await createMeeting({ createdBy: ids.owner })).length, 36);
  });

  test('rejeita horários inválidos, não gestores e convidados de fora sem criar reunião parcial', async () => {
    for (const change of [
      { startsAt: 'data-inválida' }, { startsAt: '2026-02-31T10:00:00Z' },
      { startsAt: '2026-10-22T23:00:00Z', endsAt: '2026-10-22T11:00:00Z' },
      { title: ' ' }, { agenda: null }, { inviteeIds: null }, { inviteeIds: [ids.outsider] },
    ]) assert.equal((await request('POST', '/', meetingBody(change))).status, 400);
    assert.equal((await request('POST', '/', meetingBody({ createdBy: ids.member }))).status, 403);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM meetings')).rows[0].count, 0);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM meeting_invitations')).rows[0].count, 0);
  });

  test('aceita/recusa convite e registra entrada e saída somente na ordem correta', async () => {
    const id = await createMeeting();
    assert.equal((await attend(id, ids.member)).status, 403);
    assert.equal((await invite(id, ids.member, 'DECLINED')).status, 200);
    assert.equal((await attend(id, ids.member)).status, 403);
    assert.equal((await invite(id, ids.member)).status, 200);
    assert.equal((await attend(id, ids.member, 'EXIT')).status, 409);
    const entered = await attend(id, ids.member);
    assert.equal(entered.status, 200);
    assert.equal((await attend(id, ids.member)).data.enteredAt, entered.data.enteredAt);
    assert.equal((await invite(id, ids.member, 'DECLINED')).status, 409);
    const exited = await attend(id, ids.member, 'EXIT');
    assert.equal(exited.status, 200);
    assert.ok(Date.parse(exited.data.leftAt) >= Date.parse(entered.data.enteredAt));
    assert.equal((await attend(id, ids.member, 'EXIT')).status, 409);
    assert.equal((await attend(id, ids.member)).status, 409);
    const list = await request('GET', `/${id}/attendance?userId=${ids.chair}`);
    assert.equal(list.status, 200);
    assert.equal(list.data.length, 3);
    assert.ok(list.data.find(row => row.userId === ids.member).leftAt);
    assert.equal((await request('GET', `/${id}/attendance?userId=${ids.outsider}`)).status, 403);
  });

  test('exige gestor para a ata e ao menos um presente antes do envio', async () => {
    const id = await createMeeting();
    assert.equal((await save(id, 'Ata', ids.member)).status, 403);
    assert.equal((await save(id, ' ')).status, 400);
    assert.equal((await submit(id)).status, 404);
    const draft = await save(id);
    assert.equal(draft.status, 201);
    assert.equal(draft.data.status, 'DRAFT');
    assert.equal(draft.data.version, 1);
    assert.equal((await submit(id)).status, 409);
    assert.equal((await save(id)).data.version, 1, 'Salvar rascunho idêntico é idempotente');
    await attend(id, ids.chair);
    assert.equal((await submit(id, ids.member)).status, 403);
    const review = await submit(id);
    assert.equal(review.status, 200);
    assert.deepEqual(review.data.requiredApproverIds, [ids.chair]);
    assert.equal((await submit(id)).status, 409);
    assert.equal((await vote(id, ids.member)).status, 403);
  });

  test('congela presentes no envio e exige unanimidade, incluindo o presidente', async () => {
    const id = await createMeeting();
    await invite(id, ids.member);
    await invite(id, ids.late);
    await attend(id, ids.chair);
    await attend(id, ids.member);
    await save(id);
    const review = await submit(id);
    assert.deepEqual(review.data.requiredApproverIds.sort(), [ids.chair, ids.member].sort());
    assert.equal((await attend(id, ids.late)).status, 409);
    assert.equal((await attend(id, ids.member, 'EXIT')).status, 200, 'Pode sair durante a revisão');
    const first = await vote(id, ids.member);
    assert.equal(first.data.minutes.status, 'IN_REVIEW');
    const final = await vote(id, ids.chair);
    assert.equal(final.data.minutes.status, 'APPROVED');
    assert.ok(final.data.minutes.approvedAt);
    assert.equal((await save(id, 'Alteração posterior')).status, 409);
    assert.equal((await vote(id, ids.chair, 'REJECTED')).status, 409);
    assert.equal((await attend(id, ids.late)).status, 409);
    assert.equal((await attend(id, ids.chair, 'EXIT')).status, 200);
    const synchronized = await fetch(base.replace('/meetings', '/sync')).then(response => response.json());
    assert.equal(synchronized.meetingMinutes[0].status, 'APPROVED');
    assert.equal(synchronized.meetingMinutesApprovals.length, 2);
    assert.equal(synchronized.meetingInvitations.length, 3);
    assert.equal(synchronized.meetingAttendance.length, 2);
  });

  test('rejeição exige nova versão e invalida todos os votos antigos', async () => {
    const id = await createMeeting();
    await invite(id, ids.member);
    await attend(id, ids.chair);
    await attend(id, ids.member);
    await save(id);
    await submit(id);
    await vote(id, ids.chair);
    const rejection = await vote(id, ids.member, 'REJECTED');
    assert.equal(rejection.data.minutes.status, 'REJECTED');
    assert.equal(rejection.data.approval.comment, 'Corrigir o encaminhamento.');
    assert.equal((await submit(id)).status, 409);
    const corrected = await save(id, 'Ata corrigida com novo encaminhamento.');
    assert.equal(corrected.data.version, 2);
    assert.equal(corrected.data.status, 'DRAFT');
    assert.deepEqual(corrected.data.requiredApproverIds, []);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM meeting_minutes_approvals')).rows[0].count, 0);
    await submit(id);
    assert.equal((await vote(id, ids.chair, 'APPROVED', 1)).status, 409, 'Voto de tela antiga não aprova uma revisão nova');
    assert.equal((await vote(id, ids.member, 'APPROVED', 2)).data.minutes.status, 'IN_REVIEW');
    const approved = await vote(id, ids.chair, 'APPROVED', 2);
    assert.equal(approved.data.minutes.status, 'APPROVED');
    assert.equal(approved.data.approval.version, 2);
  });

  test('votos concorrentes são serializados e não aprovam antes da unanimidade', async () => {
    const id = await createMeeting();
    await invite(id, ids.member);
    await attend(id, ids.chair);
    await attend(id, ids.member);
    await save(id);
    await submit(id);
    const results = await Promise.all([vote(id, ids.chair), vote(id, ids.member)]);
    assert.deepEqual(results.map(result => result.status), [200, 200]);
    assert.deepEqual(results.map(result => result.data.minutes.status).sort(), ['APPROVED', 'IN_REVIEW']);
    const stored = await pool.query('SELECT status FROM meeting_minutes WHERE meeting_id = $1', [id]);
    assert.equal(stored.rows[0].status, 'APPROVED');
  });

  test('correção durante revisão invalida votos e exige leitura da nova versão', async () => {
    const id = await createMeeting();
    await invite(id, ids.member);
    await attend(id, ids.chair);
    await attend(id, ids.member);
    await save(id);
    await submit(id);
    assert.equal((await vote(id, ids.member)).data.minutes.status, 'IN_REVIEW');
    const correction = await save(id, 'Conteúdo corrigido antes da aprovação final.');
    assert.equal(correction.data.status, 'DRAFT');
    assert.equal(correction.data.version, 2);
    assert.deepEqual(correction.data.requiredApproverIds, []);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM meeting_minutes_approvals')).rows[0].count, 0);
    await submit(id);
    assert.equal((await vote(id, ids.chair)).status, 409);
    assert.equal((await vote(id, ids.chair, 'APPROVED', 2)).data.minutes.status, 'IN_REVIEW');
    assert.equal((await vote(id, ids.member, 'APPROVED', 2)).data.minutes.status, 'APPROVED');
  });

  test('persiste inclusão, presidência e remoção de integrantes e reflete a permissão ao agendar', async () => {
    const memberRoute = `/../commissions/${ids.commission}/members`;
    const added = await request('POST', memberRoute, { actorId: ids.owner, userId: ids.outsider, role: 'MEMBER' });
    assert.equal(added.status, 201, JSON.stringify(added.data));
    assert.deepEqual(added.data, { commissionId: ids.commission, userId: ids.outsider, role: 'MEMBER' });
    await createMeeting({ inviteeIds: [ids.outsider] });
    clock = new Date('2026-10-22T12:00:00Z');
    assert.equal((await request('POST', '/', meetingBody({ createdBy: ids.outsider }))).status, 403);
    const promoted = await request('PATCH', `${memberRoute}/${ids.outsider}`, { actorId: ids.owner, role: 'COORDINATOR' });
    assert.equal(promoted.status, 200);
    assert.equal(promoted.data.role, 'COORDINATOR');
    await createMeeting({ createdBy: ids.outsider });
    let synchronized = await fetch(base.replace('/meetings', '/sync')).then(response => response.json());
    assert.equal(synchronized.commissionMembers.find(row => row.userId === ids.outsider).role, 'COORDINATOR');
    assert.equal((await request('PATCH', `${memberRoute}/${ids.outsider}`, { actorId: ids.owner, role: 'MEMBER' })).status, 409);
    assert.equal((await request('DELETE', `${memberRoute}/${ids.outsider}`, { actorId: ids.owner })).status, 409);
    assert.equal((await request('POST', memberRoute, { actorId: ids.owner, userId: ids.owner, role: 'COORDINATOR' })).status, 201);
    assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM commission_members WHERE role = 'COORDINATOR'")).rows[0].count, 1);
    clock = new Date('2026-10-22T12:00:00Z');
    assert.equal((await request('POST', '/', meetingBody({ createdBy: ids.outsider }))).status, 403);
    const removed = await request('DELETE', `${memberRoute}/${ids.outsider}`, { actorId: ids.owner });
    assert.equal(removed.status, 200);
    assert.deepEqual(removed.data, { success: true });
    synchronized = await fetch(base.replace('/meetings', '/sync')).then(response => response.json());
    assert.equal(synchronized.commissionMembers.some(row => row.userId === ids.outsider), false);
    assert.equal((await request('POST', '/', meetingBody({ createdBy: ids.owner, inviteeIds: [ids.outsider] }))).status, 400);
  });

  test('gestão de integrantes exige proprietário e acesso aprovado à organização', async () => {
    const route = `/../commissions/${ids.commission}/members`;
    assert.equal((await request('POST', route, { actorId: ids.chair, userId: ids.outsider, role: 'MEMBER' })).status, 403);
    assert.equal((await request('POST', route, { actorId: ids.owner, userId: ids.noaccess, role: 'MEMBER' })).status, 400);
    assert.equal((await request('POST', route, { actorId: ids.owner, userId: ids.outsider, role: 'ADMIN' })).status, 400);
    assert.equal((await request('POST', route, { actorId: ids.owner, userId: ids.owner, role: 'COORDINATOR' })).status, 201);
    assert.equal((await request('POST', route, { actorId: ids.owner, userId: ids.owner, role: 'MEMBER' })).status, 409);
    assert.equal((await request('DELETE', `${route}/${ids.chair}`, { actorId: ids.member })).status, 403);
    assert.equal((await request('DELETE', `${route}/${ids.noaccess}`, { actorId: ids.owner })).status, 404);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM commission_members')).rows[0].count, 4);
  });

  test('preserva usuários, presenças e decisões das atas em revisão e aprovadas', async () => {
    const id = await createMeeting();
    await invite(id, ids.member);
    await attend(id, ids.chair);
    await attend(id, ids.member);
    await save(id);
    await submit(id);
    const deletionRoute = `/../users/${ids.member}`;
    assert.equal((await request('DELETE', deletionRoute)).status, 409);
    assert.equal((await pool.query('SELECT 1 FROM users WHERE id = $1', [ids.member])).rowCount, 1);
    assert.equal((await pool.query('SELECT 1 FROM meeting_attendance WHERE meeting_id = $1', [id])).rowCount, 2);
    await vote(id, ids.chair);
    assert.equal((await vote(id, ids.member)).data.minutes.status, 'APPROVED');
    assert.equal((await request('DELETE', deletionRoute)).status, 409);
    assert.equal((await pool.query('SELECT 1 FROM meeting_minutes_approvals WHERE meeting_id = $1', [id])).rowCount, 2);
    const preserved = await pool.query('SELECT required_approver_ids FROM meeting_minutes WHERE meeting_id = $1', [id]);
    assert.deepEqual(preserved.rows[0].required_approver_ids.sort(), [ids.chair, ids.member].sort());
  });

  test('a exclusão anterior à revisão não deixa aprovadores inexistentes no envio concorrente', async () => {
    const id = await createMeeting();
    await invite(id, ids.member);
    await attend(id, ids.member);
    await save(id);
    const [submission, deletion] = await Promise.all([submit(id), request('DELETE', `/../users/${ids.member}`)]);
    assert.ok([200, 409].includes(submission.status), JSON.stringify(submission));
    assert.ok([200, 409].includes(deletion.status), JSON.stringify(deletion));
    assert.notDeepEqual([submission.status, deletion.status], [200, 200]);
    const minutes = (await pool.query('SELECT status, required_approver_ids FROM meeting_minutes WHERE meeting_id = $1', [id])).rows[0];
    if (minutes.status === 'IN_REVIEW') {
      assert.deepEqual(minutes.required_approver_ids, [ids.member]);
      assert.equal((await pool.query('SELECT 1 FROM users WHERE id = $1', [ids.member])).rowCount, 1);
    } else {
      assert.equal(minutes.status, 'DRAFT');
      assert.deepEqual(minutes.required_approver_ids, []);
      assert.equal((await pool.query('SELECT 1 FROM users WHERE id = $1', [ids.member])).rowCount, 0);
    }
  });

  test('exporta a versão salva em PDF e HEAD valida sem gerar o documento', async () => {
    const id = await createMeeting();
    let response = await document(id, ids.chair, 1, '', 'HEAD');
    assert.equal(response.status, 404, 'Uma ata precisa ser salva antes da exportação');
    assert.equal((await response.arrayBuffer()).byteLength, 0);
    await save(id, 'Ata com ação, inclusão e deliberações de João e Érica.');
    response = await document(id, ids.chair, 1, '', 'HEAD');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.equal(response.headers.get('x-minutes-version'), '1');
    assert.equal(response.headers.get('x-minutes-status'), 'DRAFT');
    assert.equal((await response.arrayBuffer()).byteLength, 0);
    assert.equal(pdfRenderCalls, 0, 'HEAD não chama o gerador');
    response = await document(id);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.equal(response.headers.get('content-disposition'), `attachment; filename="ata-${id}-v1.pdf"`);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    const pdf = Buffer.from(await response.arrayBuffer());
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.equal(pdfRenderCalls, 1);
  });

  test('PDF limita acesso ao gestor atual e a convidados históricos de qualquer status', async () => {
    const id = await createMeeting();
    await save(id);
    const preflight = userId => document(id, userId, 1, '', 'HEAD');
    assert.equal((await preflight(ids.owner)).status, 200, 'O proprietário também gerencia a comissão');
    assert.equal((await preflight(ids.member)).status, 200, 'Convite pendente mantém acesso');
    await invite(id, ids.member, 'DECLINED');
    await pool.query('DELETE FROM commission_members WHERE commission_id = $1 AND user_id = $2', [ids.commission, ids.member]);
    assert.equal((await preflight(ids.member)).status, 200, 'Um convidado histórico conserva o acesso à reunião');
    const denied = await preflight(ids.outsider);
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('x-pdf-error'), 'FORBIDDEN');
    assert.equal((await denied.arrayBuffer()).byteLength, 0);
    assert.equal((await document(randomUUID(), ids.owner, 1, '', 'HEAD')).status, 404);
    assert.equal(pdfRenderCalls, 0);
  });

  test('PDF exige versão atual e fuso IANA válido', async () => {
    const id = await createMeeting();
    await save(id);
    for (const query of [
      `userId=${ids.chair}`, `userId=${ids.chair}&version=0`, `userId=${ids.chair}&version=1.2`,
      `userId=${ids.chair}&version=1&version=2`, `userId=${ids.chair}&version=1&timeZone=Fuso/Inexistente`,
      `userId=${ids.chair}&version=1&timeZone=%2B03:00`,
    ]) assert.equal((await fetch(`${base}/${id}/minutes/pdf?${query}`, { method: 'HEAD' })).status, 400);
    assert.equal((await document(id, ids.chair, 1, '&timeZone=UTC', 'HEAD')).status, 200);
    assert.equal((await document(id, ids.chair, 1, '&timeZone=America%2FSao_Paulo', 'HEAD')).status, 200);
    await save(id, 'Segunda versão da ata.');
    const stale = await document(id);
    assert.equal(stale.status, 409);
    assert.equal(stale.headers.get('x-pdf-error'), 'STALE_VERSION');
    assert.match((await stale.json()).error, /atualizad/);
    assert.equal((await document(id, ids.chair, 2, '', 'HEAD')).status, 200);
    assert.equal(pdfRenderCalls, 0);
  });

  test('PDF permite rascunho, revisão, rejeição e aprovação com seu status real', async () => {
    const id = await createMeeting();
    await save(id);
    await attend(id, ids.chair);
    assert.equal((await document(id, ids.chair, 1, '', 'HEAD')).headers.get('x-minutes-status'), 'DRAFT');
    await submit(id);
    assert.equal((await document(id, ids.chair, 1, '', 'HEAD')).headers.get('x-minutes-status'), 'IN_REVIEW');
    await vote(id, ids.chair, 'REJECTED');
    assert.equal((await document(id, ids.chair, 1, '', 'HEAD')).headers.get('x-minutes-status'), 'REJECTED');
    await save(id, 'Registro corrigido.');
    await submit(id);
    await vote(id, ids.chair, 'APPROVED', 2);
    assert.equal((await document(id, ids.chair, 2, '', 'HEAD')).headers.get('x-minutes-status'), 'APPROVED');
  });

  test('uma falha de geração retorna JSON sem enviar um PDF parcial', async () => {
    const id = await createMeeting();
    await save(id);
    pdfRenderFailure = true;
    const response = await document(id);
    assert.equal(response.status, 500);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.equal(response.headers.get('x-pdf-error'), 'GENERATION_FAILED');
    assert.equal(response.headers.get('content-disposition'), null);
    assert.match((await response.json()).error, /Não foi possível gerar/);
    assert.equal(pdfRenderCalls, 1);
  });

  test('bloqueia passado, convite/entrada tardios e saída antecipada no relógio do servidor', async () => {
    const invalid = await request('POST', '/', meetingBody({startsAt:'2001-01-01T10:00:00Z', endsAt:'2001-01-01T11:00:00Z', title:'', agenda:''}));
    assert.equal(invalid.status,400); assert.ok(invalid.data.fields.startsAt); assert.ok(invalid.data.fields.title); assert.ok(invalid.data.fields.agenda);
    const id = await createMeeting();
    clock = new Date('2026-10-22T12:30:00Z');
    assert.equal((await attend(id,ids.chair)).status,409);
    assert.equal((await attend(id,ids.chair,'EXIT')).status,409);
    clock = new Date('2026-10-22T14:00:00Z');
    assert.equal((await invite(id,ids.member)).status,409);
    assert.equal((await invite(id,ids.member,'DECLINED')).status,409);
    assert.equal((await attend(id,ids.chair)).status,409);
  });

  test('edita reunião futura com detalhes e redefine convites; bloqueia não gestor ou reunião iniciada', async () => {
    const id = await createMeeting();
    clock = new Date('2026-10-22T12:30:00Z');
    const payload = { ...meetingBody(), userId:ids.chair, allDay:true, startsAt:'2026-10-24T03:00:00Z',endsAt:'2026-10-25T03:00:00Z',location:'Sala 1',details:'Trazer proposta' };
    assert.equal((await request('PATCH',`/${id}`,{...payload,userId:ids.member})).status,403);
    const changed=await request('PATCH',`/${id}`,payload);
    assert.equal(changed.status,200,JSON.stringify(changed.data)); assert.equal(changed.data.allDay,true); assert.equal(changed.data.location,'Sala 1');
    clock = new Date('2026-10-24T03:00:00Z');
    assert.equal((await request('PATCH',`/${id}`,payload)).status,409);
  });

  test('presidente registra presença de convidado aceito sem permitir falsificação por membro', async () => {
    const id=await createMeeting(); await invite(id,ids.member);
    assert.equal((await request('PATCH',`/${id}/attendance/${ids.member}`,{userId:ids.late,action:'ENTER'})).status,403);
    const entered=await request('PATCH',`/${id}/attendance/${ids.member}`,{userId:ids.chair,action:'ENTER'});
    assert.equal(entered.status,200,JSON.stringify(entered.data)); assert.equal(entered.data.userId,ids.member); assert.equal(entered.data.recordedBy,ids.chair); assert.equal(entered.data.method,'CHAIR');
    assert.equal((await request('PATCH',`/${id}/attendance/${ids.member}`,{userId:ids.chair,action:'EXIT'})).status,200);
  });

  test('código de presença exige gestor, convite e validade; armazena apenas hash', async () => {
    const id=await createMeeting(); await invite(id,ids.member);
    assert.equal((await request('POST',`/${id}/attendance-code`,{userId:ids.member})).status,403);
    const generated=await request('POST',`/${id}/attendance-code`,{userId:ids.chair});
    assert.equal(generated.status,200); assert.match(generated.data.code,/^\d{6}$/);
    assert.notEqual((await pool.query('SELECT code_hash FROM meeting_attendance_codes')).rows[0].code_hash,generated.data.code);
    assert.equal((await request('PATCH',`/${id}/attendance`,{userId:ids.member,action:'ENTER',code:'wrong'})).status,403);
    assert.equal((await request('PATCH',`/${id}/attendance`,{userId:ids.member,action:'ENTER',code:generated.data.code})).status,200);
    clock=new Date('2026-10-22T13:41:00Z');
    assert.equal((await request('PATCH',`/${id}/attendance`,{userId:ids.member,action:'EXIT',code:generated.data.code})).status,403);
  });

  test('anexos são limitados e privados; lista de presença é PDF mesmo sem ata', async () => {
    const id=await createMeeting();
    const payload={userId:ids.chair,name:'pauta.txt',mimeType:'text/plain',base64:Buffer.from('Discussão e ação').toString('base64')};
    assert.equal((await request('POST',`/${id}/attachments`,{...payload,userId:ids.member})).status,403);
    assert.equal((await request('POST',`/${id}/attachments`,{...payload,name:'../arquivo.txt'})).status,400);
    assert.equal((await request('POST',`/${id}/attachments`,{...payload,mimeType:'application/pdf'})).status,400);
    const file=await request('POST',`/${id}/attachments`,payload); assert.equal(file.status,201,JSON.stringify(file.data));
    assert.equal((await request('GET',`/${id}/attachments?userId=${ids.member}`)).data.length,1);
    assert.equal((await request('GET',`/${id}/attachments?userId=${ids.noaccess}`)).status,403);
    const download=await fetch(`${base}/${id}/attachments/${file.data.id}?userId=${ids.member}`);
    assert.equal(download.status,200); assert.equal(await download.text(),'Discussão e ação');
    const pdf=await fetch(`${base}/${id}/attendance/pdf?userId=${ids.member}`);
    assert.equal(pdf.status,200); assert.equal(pdf.headers.get('content-type'),'application/pdf'); assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
    assert.equal((await fetch(`${base}/${id}/attendance/pdf?userId=${ids.noaccess}`)).status,403);
  });

  test('votação independente aceita um voto por presente, troca opção e bloqueia encerrada', async () => {
    const id=await createMeeting(); await invite(id,ids.member); await attend(id,ids.chair);
    assert.equal((await request('POST',`/${id}/votes`,{userId:ids.member,question:'A?',options:['Sim','Não']})).status,403);
    assert.equal((await request('POST',`/${id}/votes`,{userId:ids.chair,question:'A?',options:['Sim',' sim ']})).status,400);
    const opened=await request('POST',`/${id}/votes`,{userId:ids.chair,question:'A?',options:['Sim','Não']}); assert.equal(opened.status,201);
    const path=`/${id}/votes/${opened.data.id}`;
    assert.equal((await request('POST',path+'/ballot',{userId:ids.member,optionId:opened.data.options[0].id})).status,403);
    await attend(id,ids.member);
    for(const option of opened.data.options) assert.equal((await request('POST',path+'/ballot',{userId:ids.member,optionId:option.id})).status,200);
    assert.equal((await pool.query('SELECT * FROM meeting_vote_ballots')).rowCount,1);
    assert.equal((await request('PATCH',path+'/close',{userId:ids.member})).status,403);
    assert.equal((await request('PATCH',path+'/close',{userId:ids.chair})).status,200);
    assert.equal((await request('POST',path+'/ballot',{userId:ids.member,optionId:opened.data.options[0].id})).status,409);
  });
});
