const { describe, test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const db = require('../src/db/connection');
const originalPool = db.pool;
const originalQuery = db.query;
const { migrateSchema } = require('../src/db/migrate');
const app = require('../src/server');
const { issueSession } = require('../src/services/security');

// API real e sessões reais, mas todas as contas e reuniões ficam neste schema
// descartável. Não inicia o servidor de desenvolvimento nem envia e-mails.
describe('Incremento 3: integridade e privacidade das votações', { concurrency: false }, () => {
  const schema = `voting_test_${randomUUID().replaceAll('-', '')}`;
  let pool, server, base, ids, sessions, meetingId, commissionId;

  async function request(method, route, body, role = 'chair') {
    const response = await fetch(base + route, {
      method,
      headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${sessions[role]}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  }

  async function open(options = ['Sim', 'Não'], role = 'chair') {
    const result = await request('POST', `/meetings/${meetingId}/votes`, { question: 'Aprovar proposta?', options }, role);
    assert.equal(result.status, 201, JSON.stringify(result.data));
    return result.data;
  }

  const ballot = (poll, option, role = 'member', extra = {}) => request('POST',
    `/meetings/${meetingId}/votes/${poll.id}/ballot`, { optionId: option.id, ...extra }, role);
  const close = (poll, role = 'chair') => request('PATCH', `/meetings/${meetingId}/votes/${poll.id}/close`, {}, role);

  async function snapshot(role = 'member') {
    const result = await request('GET', '/sync', undefined, role);
    assert.equal(result.status, 200, JSON.stringify(result.data));
    return result.data;
  }

  function counts(data, poll) {
    return poll.options.map(option => data.meetingVoteTallies.find(t => t.voteId === poll.id && t.optionId === option.id)?.count || 0);
  }

  before(async () => {
    await originalPool.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({ ...originalPool.options, password: originalPool.options.password, options: `-c search_path=${schema}`, max: 8 });
    await migrateSchema(pool);
    db.pool = pool;
    db.query = (...args) => pool.query(...args);
    server = await new Promise(resolve => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    base = `http://127.0.0.1:${server.address().port}/api`;
  });

  beforeEach(async () => {
    await pool.query(`TRUNCATE TABLE "${schema}".users CASCADE`);
    ids = {}; sessions = {};
    for (const role of ['owner', 'chair', 'member', 'absent', 'outsider', 'admin']) {
      const user = await pool.query(`INSERT INTO users (name, email, password_hash, system_role, email_verified)
        VALUES ($1, $2, 'isolated-test-hash', $3, TRUE) RETURNING id`,
      [role, `${role}@voting.example.invalid`, role === 'admin' ? 'SYSTEM_ADMIN' : 'USER']);
      ids[role] = user.rows[0].id;
      sessions[role] = await issueSession(ids[role]);
    }
    const organization = await pool.query(`INSERT INTO organizations (name, document, owner_id, status)
      VALUES ('Votação isolada', 'voting-test', $1, 'APPROVED') RETURNING id`, [ids.owner]);
    const commission = await pool.query(`INSERT INTO commissions (organization_id, name)
      VALUES ($1, 'Comissão isolada') RETURNING id`, [organization.rows[0].id]);
    commissionId = commission.rows[0].id;
    for (const role of ['chair', 'member', 'absent']) {
      await pool.query('INSERT INTO commission_members (commission_id, user_id, role) VALUES ($1, $2, $3)',
        [commissionId, ids[role], role === 'chair' ? 'COORDINATOR' : 'MEMBER']);
    }
    const meeting = await pool.query(`INSERT INTO meetings (commission_id, title, agenda, starts_at, ends_at, created_by)
      VALUES ($1, 'Reunião de votação', 'Propostas', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour', $2) RETURNING id`, [commissionId, ids.chair]);
    meetingId = meeting.rows[0].id;
    for (const role of ['chair', 'member', 'absent']) {
      await pool.query("INSERT INTO meeting_invitations (meeting_id, user_id, status) VALUES ($1, $2, 'ACCEPTED')", [meetingId, ids[role]]);
    }
    for (const role of ['chair', 'member']) {
      await pool.query('INSERT INTO meeting_attendance (meeting_id, user_id, entered_at) VALUES ($1, $2, NOW())', [meetingId, ids[role]]);
    }
  });

  after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    db.pool = originalPool; db.query = originalQuery;
    if (pool) await pool.end();
    await originalPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await originalPool.end();
  });

  test('valida pergunta, 2–8 opções distintas e limites sem deixar registros parciais', async () => {
    const invalid = [
      { question: '' }, { question: '   ' }, { question: 'x'.repeat(501) }, { question: null },
      { options: ['Única'] }, { options: Array.from({ length: 9 }, (_, i) => String(i)) },
      { options: ['Sim', ' sim '] }, { options: ['Não', 'NÃO'] }, { options: ['A', ' '] },
      { options: ['A', 2] }, { options: ['A', 'x'.repeat(161)] }, { options: null },
    ];
    for (const change of invalid) {
      const result = await request('POST', `/meetings/${meetingId}/votes`, { question: 'Pergunta', options: ['A', 'B'], ...change });
      assert.equal(result.status, 400, JSON.stringify(change));
    }
    assert.equal((await pool.query('SELECT * FROM meeting_votes')).rowCount, 0);
    assert.equal((await pool.query('SELECT * FROM meeting_vote_options')).rowCount, 0);
    const result = await request('POST', `/meetings/${meetingId}/votes`, {
      question: ` ${'p'.repeat(500)} `,
      options: Array.from({ length: 8 }, (_, i) => ` ${String(i).repeat(160)} `),
    });
    assert.equal(result.status, 201);
    assert.equal(result.data.question.length, 500);
    assert.deepEqual(result.data.options.map(o => [o.position, o.label.length]), Array.from({ length: 8 }, (_, i) => [i + 1, 160]));
  });

  test('exige sessão, gestão para abrir/fechar e ao menos uma presença para abrir', async () => {
    const body = { question: 'Pergunta', options: ['A', 'B'], userId: ids.chair, createdBy: ids.chair };
    for (const role of [null, 'member', 'outsider', 'admin']) {
      assert.equal((await request('POST', `/meetings/${meetingId}/votes`, body, role)).status, role ? 403 : 401);
    }
    await pool.query('DELETE FROM meeting_attendance');
    assert.equal((await request('POST', `/meetings/${meetingId}/votes`, body)).status, 409);
    await pool.query('INSERT INTO meeting_attendance (meeting_id, user_id, entered_at) VALUES ($1, $2, NOW())', [meetingId, ids.member]);
    const poll = await open(['A', 'B'], 'owner');
    assert.equal(poll.createdBy, ids.owner);
    for (const role of [null, 'member', 'outsider', 'admin']) {
      assert.equal((await close(poll, role)).status, role ? 403 : 401);
    }
    assert.equal((await close(poll, 'owner')).status, 200);
  });

  test('trocar ou reenviar voto mantém contagem correta e divulga somente a própria escolha', async () => {
    const poll = await open();
    assert.equal((await ballot(poll, poll.options[0], 'member', { userId: ids.chair })).status, 200);
    assert.equal((await ballot(poll, poll.options[0], 'member')).status, 200);
    assert.equal((await ballot(poll, poll.options[1], 'chair')).status, 200);
    let data = await snapshot('member');
    assert.deepEqual(counts(data, poll), [1, 1]);
    assert.deepEqual(data.meetingVoteOwnBallots.map(b => b.userId), [ids.member]);
    assert.equal(data.meetingVoteOwnBallots[0].optionId, poll.options[0].id);
    assert.ok(data.meetingVoteTallies.every(t => !('userId' in t)));
    assert.equal((await ballot(poll, poll.options[1], 'member')).status, 200);
    data = await snapshot('member');
    assert.deepEqual(counts(data, poll), [0, 2]);
    assert.equal(data.meetingVoteOwnBallots.length, 1);
    assert.equal(data.meetingVoteOwnBallots[0].optionId, poll.options[1].id);
    assert.deepEqual((await snapshot('chair')).meetingVoteOwnBallots.map(b => b.userId), [ids.chair]);
    assert.equal((await snapshot('admin')).meetingVoteOwnBallots.length, 0);
    assert.equal((await pool.query('SELECT * FROM meeting_vote_ballots')).rowCount, 2);
    assert.equal((await pool.query('SELECT * FROM meeting_minutes')).rowCount, 0, 'Votação não cria aprovação de ata');
  });

  test('nega ausentes, identidade forjada e opção de outra votação sem alterar o voto anterior', async () => {
    const poll = await open(), other = await open(['C', 'D']);
    assert.equal((await ballot(poll, poll.options[0], null)).status, 401);
    for (const role of ['absent', 'outsider']) {
      assert.equal((await ballot(poll, poll.options[0], role, { userId: ids.member })).status, 403);
    }
    assert.equal((await ballot(poll, poll.options[0])).status, 200);
    for (const optionId of [null, 7, 'invalid', randomUUID(), other.options[0].id]) {
      assert.equal((await ballot(poll, { id: optionId })).status, 400);
    }
    assert.equal((await ballot({ id: randomUUID() }, poll.options[0])).status, 404);
    const differentMeeting = await pool.query(`INSERT INTO meetings (commission_id, title, agenda, starts_at, ends_at, created_by)
      VALUES ($1, 'Outra reunião', 'Pauta', NOW(), NOW() + INTERVAL '1 hour', $2) RETURNING id`, [commissionId, ids.chair]);
    assert.equal((await request('POST', `/meetings/${differentMeeting.rows[0].id}/votes/${poll.id}/ballot`, { optionId: poll.options[0].id }, 'member')).status, 404);
    assert.deepEqual(counts(await snapshot(), poll), [1, 0]);
  });

  test('requisições simultâneas mantêm um voto por pessoa e um único encerramento', async () => {
    const poll = await open();
    await pool.query('INSERT INTO meeting_attendance (meeting_id, user_id, entered_at) VALUES ($1, $2, NOW())', [meetingId, ids.absent]);
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => ballot(poll, poll.options[i % 2], ['member', 'chair', 'absent'][i % 3])));
    assert.ok(results.every(r => r.status === 200));
    assert.equal((await pool.query('SELECT * FROM meeting_vote_ballots')).rowCount, 3);
    assert.equal(counts(await snapshot(), poll).reduce((a, b) => a + b, 0), 3);
    const closures = await Promise.all([close(poll), close(poll, 'owner')]);
    assert.deepEqual(closures.map(r => r.status).sort(), [200, 409]);
    const before = counts(await snapshot(), poll);
    assert.equal((await ballot(poll, poll.options[0])).status, 409);
    assert.deepEqual(counts(await snapshot(), poll), before);
  });

  test('corrida entre votar e encerrar nunca aceita voto depois do encerramento', async () => {
    const poll = await open();
    const [cast, closed] = await Promise.all([ballot(poll, poll.options[0]), close(poll)]);
    assert.equal(closed.status, 200);
    assert.ok([200, 409].includes(cast.status));
    const data = await snapshot();
    assert.deepEqual(counts(data, poll), [cast.status === 200 ? 1 : 0, 0]);
    const stored = data.meetingVotes.find(v => v.id === poll.id);
    assert.equal(stored.status, 'CLOSED');
    assert.ok(stored.closedAt);
    assert.equal((await ballot(poll, poll.options[1])).status, 409);
    assert.deepEqual(counts(await snapshot(), poll), counts(data, poll));
  });

  test('resultados ficam disponíveis ao convidado histórico e ocultos a estranho', async () => {
    const poll = await open();
    await ballot(poll, poll.options[0]);
    await close(poll);
    await pool.query('DELETE FROM commission_members WHERE user_id = $1', [ids.member]);
    const member = await snapshot('member');
    assert.equal(member.meetingVotes[0].id, poll.id);
    assert.deepEqual(counts(member, poll), [1, 0]);
    const stranger = await snapshot('outsider');
    for (const key of ['meetingVotes', 'meetingVoteOptions', 'meetingVoteTallies', 'meetingVoteOwnBallots']) {
      assert.deepEqual(stranger[key], []);
    }
  });

  test('relatório lista somente reuniões frequentadas pela sessão, sem aceitar outro userId', async () => {
    const result = await request('GET', `/meetings/participation/report?userId=${ids.absent}`, undefined, 'member');
    assert.equal(result.status, 200);
    assert.equal(result.data.meetings.length, 1);
    const row = result.data.meetings[0];
    assert.equal(row.meetingId, meetingId);
    for (const key of ['organizationName', 'commissionName', 'startsAt', 'endsAt', 'enteredAt']) assert.ok(row[key], key);
    assert.equal(row.leftAt, null);
    assert.equal((await request('GET', `/meetings/participation/report?userId=${ids.member}`, undefined, 'absent')).data.meetings.length, 0);
    assert.equal((await request('GET', '/meetings/participation/report', undefined, null)).status, 401);
  });

  test('excluir votante não apaga sua participação nem altera apuração encerrada', async () => {
    const poll = await open();
    await ballot(poll, poll.options[0]);
    await close(poll);
    const result = await request('DELETE', `/users/${ids.member}`, undefined, 'admin');
    assert.equal(result.status, 409, 'Conta que sustenta votos registrados precisa ser preservada');
    assert.equal((await pool.query('SELECT id FROM users WHERE id = $1', [ids.member])).rowCount, 1);
    assert.deepEqual(counts(await snapshot('chair'), poll), [1, 0]);
    assert.equal((await request('DELETE', `/users/${ids.outsider}`, undefined, 'admin')).status, 200, 'Conta sem histórico continua removível');
  });
});
