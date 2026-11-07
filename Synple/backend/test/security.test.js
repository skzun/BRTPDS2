const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const db = require('../src/db/connection');
const originalPool = db.pool;
const { migrateSchema } = require('../src/db/migrate');
const mailer = require('../src/services/mailer');
let activationCode, failActivation = false;
mailer.sendActivationEmail = async (email, code) => { activationCode = code; return { success: !failActivation }; };
mailer.sendPasswordResetEmail = async () => ({ success: true });
const app = require('../src/server');
const { digest } = require('../src/services/security');
const schema = `security_test_${randomUUID().replace(/-/g, '')}`;
let pool, server, base, userId, otherId, token;

async function request(method, route, body, session = token) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  await originalPool.query(`CREATE SCHEMA "${schema}"`);
  pool = new Pool({ ...originalPool.options, password: originalPool.options.password, options: `-c search_path=${schema}` });
  await migrateSchema(pool);
  db.pool = pool; db.query = (...args) => pool.query(...args);
  const hash = await bcrypt.hash('SenhaReal@123', 10);
  for (const email of ['own@example.test', 'other@example.test']) {
    const result = await pool.query("INSERT INTO users (name, email, password_hash, email_verified) VALUES ('Teste', $1, $2, TRUE) RETURNING id", [email, hash]);
    if (email.startsWith('own')) userId = result.rows[0].id; else otherId = result.rows[0].id;
  }
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (pool) await pool.end();
  await originalPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await originalPool.end();
});

test('API rejeita acesso anônimo e não aceita senha de demonstração para outra conta', async () => {
  assert.equal((await request('POST', '/auth/login', { email: 123, password: {} }, null)).status, 400);
  assert.equal((await request('GET', '/sync', undefined, null)).status, 401);
  assert.equal((await request('POST', '/auth/login', { email: 'own@example.test', password: 'Admin@123' }, null)).status, 401);
  const login = await request('POST', '/auth/login', { email: 'own@example.test', password: 'SenhaReal@123' }, null);
  assert.equal(login.status, 200); token = login.data.token;
  assert.match(token, /^[a-f0-9]{64}$/);
  const stored = await pool.query('SELECT token_hash FROM auth_sessions');
  assert.equal(stored.rows[0].token_hash, digest(token));
  assert.notEqual(stored.rows[0].token_hash, token);
});
test('identidade do cliente não permite editar outro usuário ou consultar administração', async () => {
  assert.equal((await request('PUT', `/users/${otherId}`, { name: 'Invasor', actorId: otherId })).status, 403);
  assert.equal((await request('GET', '/system')).status, 403);
  assert.equal((await request('PUT', `/users/${userId}`, { name: 'Nome atualizado' })).status, 200);
});
test('cadastro exige ativação, código é consumido e senha não vai na resposta', async () => {
  const registration = await request('POST', '/auth/register', { name: 'Nova conta', email: 'new@example.test', password: 'NovaSenha@123' }, null);
  assert.equal(registration.status, 201); assert.equal(registration.data.requiresActivation, true);
  assert.equal(registration.data.token, undefined);
  assert.equal((await request('POST', '/auth/login', { email: 'new@example.test', password: 'NovaSenha@123' }, null)).status, 403);
  assert.equal((await request('POST', '/auth/verify-email', { email: 'new@example.test', code: activationCode }, null)).status, 200);
  assert.equal((await request('POST', '/auth/verify-email', { email: 'new@example.test', code: activationCode }, null)).status, 400);
  assert.equal((await request('POST', '/auth/login', { email: 'new@example.test', password: 'NovaSenha@123' }, null)).status, 200);
});
test('sincronização não revela contas de outras organizações e mantém a data de inicialização', async () => {
  const first = await request('GET', '/sync'); const second = await request('GET', '/sync');
  assert.equal(first.status, 200);
  assert.deepEqual(first.data.users.map(u => u.id), [userId]);
  assert.equal(first.data.system.initializedAt, second.data.system.initializedAt);
  assert.equal(first.data.users[0].password, undefined);
});
test('transferência usa transação real e só permite membro aprovado', async () => {
  const organization = await request('POST', '/organizations', { name: 'Organização de teste', document: '12.345.678/0001-90', ownerId: otherId, status: 'APPROVED' });
  assert.equal(organization.status, 201); assert.equal(organization.data.ownerId, userId); assert.equal(organization.data.status, 'PENDING');
  const id = organization.data.id;
  assert.equal((await request('POST', '/organizations', { name: 'Outro nome', document: '12345678000190' })).status, 409);
  assert.equal((await request('POST', '/organizations', { name: ' ORGANIZAÇÃO DE TESTE ', document: '98765432000110' })).status, 409);
  assert.equal((await request('PATCH', `/organizations/${id}/owner`, { newOwnerId: otherId })).status, 400);
  await pool.query("INSERT INTO access_requests (organization_id, user_id, status) VALUES ($1, $2, 'APPROVED')", [id, otherId]);
  assert.equal((await request('PATCH', `/organizations/${id}/owner`, { currentOwnerId: otherId, newOwnerId: otherId })).status, 200);
});
test('criação de comissão é atômica e atribui um único coordenador', async () => {
  const org = await request('POST', '/organizations', { name: 'Comissões', document: '99888777000166' });
  await pool.query("UPDATE organizations SET status = 'APPROVED' WHERE id = $1", [org.data.id]);
  const invalid = await request('POST', '/commissions', { organizationId: org.data.id, name: 'Inválida', memberIds: [randomUUID()] });
  assert.equal(invalid.status, 400);
  assert.equal((await pool.query("SELECT 1 FROM commissions WHERE name = 'Inválida'")).rowCount, 0);
  const valid = await request('POST', '/commissions', { organizationId: org.data.id, name: 'Válida' });
  assert.equal(valid.status, 201);
  const members = await pool.query('SELECT user_id, role FROM commission_members WHERE commission_id = $1', [valid.data.id]);
  assert.deepEqual(members.rows, [{ user_id: userId, role: 'COORDINATOR' }]);
});
test('falha de SMTP não cria conta, código expirado e sessão expirada são recusados', async () => {
  failActivation = true;
  assert.equal((await request('POST', '/auth/register', { name: 'Sem SMTP', email: 'smtp@example.test', password: 'SenhaReal@123' }, null)).status, 503);
  assert.equal((await pool.query("SELECT 1 FROM users WHERE email = 'smtp@example.test'")).rowCount, 0);
  failActivation = false;
  await pool.query("UPDATE users SET activation_hash = $1, activation_expires = NOW() - INTERVAL '1 minute' WHERE id = $2", [digest('123456'), otherId]);
  assert.equal((await request('POST', '/auth/verify-email', { email: 'other@example.test', code: '123456' }, null)).status, 400);
  const expired = 'a'.repeat(64);
  await pool.query("INSERT INTO auth_sessions VALUES ($1, $2, NOW() - INTERVAL '1 second')", [digest(expired), userId]);
  assert.equal((await request('GET', '/auth/me', undefined, expired)).status, 401);
});
test('somente destinatário aceita convite e ticket de PDF não autentica outra rota', async () => {
  const org = await request('POST', '/organizations', { name: 'Convites', document: '11222333000144' });
  assert.equal(org.status, 201);
  const invitation = await request('POST', `/organizations/${org.data.id}/invitations`, { email: 'other@example.test' });
  assert.equal(invitation.status, 201);
  assert.equal((await request('PATCH', `/organizations/access-requests/${invitation.data.id}`, { status: 'APPROVED' })).status, 409);
  assert.equal((await request('PATCH', `/organizations/${org.data.id}/invitations/${invitation.data.id}`, { decision: 'ACCEPTED' })).status, 404);
  const other = await request('POST', '/auth/login', { email: 'other@example.test', password: 'SenhaReal@123' }, null);
  assert.equal((await request('PATCH', `/organizations/${org.data.id}/invitations/${invitation.data.id}`, { decision: 'ACCEPTED' }, other.data.token)).status, 200);
  const path = `/meetings/${randomUUID()}/minutes/pdf`;
  const ticket = await request('POST', '/auth/download-ticket', { path });
  assert.equal(ticket.status, 200);
  assert.equal((await request('GET', `/sync?download=${ticket.data.ticket}`, undefined, null)).status, 401);
  assert.equal((await request('GET', `${path}?download=${ticket.data.ticket}&version=1&userId=${otherId}`, undefined, null)).status, 404);
  assert.equal((await request('GET', `/meetings/${randomUUID()}/minutes/pdf?download=${ticket.data.ticket}`, undefined, null)).status, 401);
});
test('recuperação limita tentativas e logout revoga a sessão', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await request('POST', '/auth/reset-password', { email: 'unknown@example.test', code: '123456', newPassword: 'Segura@123' }, null)).status, 400);
  assert.equal((await request('POST', '/auth/reset-password', { email: 'unknown@example.test', code: '123456', newPassword: 'Segura@123' }, null)).status, 429);
  assert.equal((await request('POST', '/auth/logout')).status, 200);
  assert.equal((await request('GET', '/auth/me')).status, 401);
});

test('relatório, voto e downloads usam sessão; ticket de presença não abre outra rota', async () => {
  const { issueSession } = require('../src/services/security');
  const ownSession = await issueSession(userId), otherSession = await issueSession(otherId);
  const org = (await pool.query("INSERT INTO organizations (name,document,owner_id,status) VALUES ('Inc3','99999999000199',$1,'APPROVED') RETURNING id",[userId])).rows[0].id;
  const commission = (await pool.query("INSERT INTO commissions (organization_id,name) VALUES ($1,'Inc3') RETURNING id",[org])).rows[0].id;
  const meeting = (await pool.query("INSERT INTO meetings (commission_id,title,agenda,starts_at,ends_at,created_by) VALUES ($1,'Presença','Pauta',NOW()-INTERVAL '1 hour',NOW()+INTERVAL '1 hour',$2) RETURNING id",[commission,userId])).rows[0].id;
  for(const id of [userId,otherId]) await pool.query("INSERT INTO meeting_invitations (meeting_id,user_id,status) VALUES ($1,$2,'ACCEPTED')",[meeting,id]);
  await pool.query('INSERT INTO meeting_attendance (meeting_id,user_id,entered_at) VALUES ($1,$2,NOW())',[meeting,userId]);
  const opened = await request('POST',`/meetings/${meeting}/votes`,{userId:otherId,question:'Qual?',options:['A','B']},ownSession);
  assert.equal(opened.status,201); assert.equal(opened.data.createdBy,userId);
  assert.equal((await request('POST',`/meetings/${meeting}/votes/${opened.data.id}/ballot`,{userId,optionId:opened.data.options[0].id},otherSession)).status,403);
  const ownReport=await request('GET','/meetings/participation/report?userId='+otherId,undefined,ownSession);
  const otherReport=await request('GET','/meetings/participation/report?userId='+userId,undefined,otherSession);
  assert.equal(ownReport.data.meetings.length,1); assert.equal(otherReport.data.meetings.length,0);
  const path=`/meetings/${meeting}/attendance/pdf`;
  const ticket=await request('POST','/auth/download-ticket',{path},ownSession);
  assert.equal(ticket.status,200);
  const pdf=await fetch(base+path+'?download='+ticket.data.ticket);
  assert.equal(pdf.status,200); assert.equal(pdf.headers.get('content-type'),'application/pdf');
  assert.equal((await request('GET',`/meetings/${meeting}/minutes/pdf?download=${ticket.data.ticket}`,undefined,null)).status,401);
});
