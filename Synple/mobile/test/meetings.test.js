const test = require('node:test');
const assert = require('node:assert/strict');
const { parseMeetingDate, buildMeetingPayload, getMeetingAttendanceRows, getMinutesVotingSummary, buildAttendanceText, getAccessibleMeetingCommissions, canManageMeetingCommission } = require('../src/services/meetings');

test('interpreta data brasileira no fuso local e rejeita datas inexistentes e formatos ambíguos', () => {
  const date = parseMeetingDate('29/02/2028 09:05');
  assert.equal(date.getFullYear(), 2028);
  assert.equal(date.getMonth(), 1);
  assert.equal(date.getDate(), 29);
  assert.equal(date.getHours(), 9);
  assert.equal(date.getMinutes(), 5);
  for (const invalid of ['29/02/2027 09:05', '31/04/2028 09:05', '01/13/2028 09:05', '01/12/2028 24:00', '01/12/2028 09:60', '2028-12-01 09:05', '1/12/2028 09:05']) {
    assert.equal(parseMeetingDate(invalid), null, invalid);
  }
});

test('valida período e gera horário ISO com convidados únicos', () => {
  const form = { title: ' Reunião ', agenda: ' Planejar ', startsAt: '22/10/2026 18:00', endsAt: '22/10/2026 19:00' };
  const { meeting } = buildMeetingPayload(form, 'commission-1', ['u1', 'u1', 'u2']);
  assert.equal(meeting.title, 'Reunião');
  assert.equal(meeting.agenda, 'Planejar');
  assert.deepEqual(meeting.inviteeIds, ['u1', 'u2']);
  assert.equal(new Date(meeting.startsAt).getHours(), 18);
  assert.ok(buildMeetingPayload({ ...form, endsAt: form.startsAt }, 'c').error);
  assert.ok(buildMeetingPayload({ ...form, title: ' ' }, 'c').error);
  assert.ok(buildMeetingPayload({ ...form, title: 'x'.repeat(161) }, 'c').error);
  assert.ok(buildMeetingPayload({ ...form, title: 'x'.repeat(160) }, 'c').meeting);
});

test('lista presença mantém convidados sem entrada e participantes com saída', () => {
  const rows = getMeetingAttendanceRows({
    users: [{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Bruno' }],
    meetingInvitations: [{ meetingId: 'm', userId: 'a', status: 'ACCEPTED' }, { meetingId: 'm', userId: 'b', status: 'DECLINED' }],
    meetingAttendance: [{ meetingId: 'm', userId: 'a', enteredAt: '2026-10-22T18:00:00Z', leftAt: '2026-10-22T19:00:00Z' }, { meetingId: 'other', userId: 'b', enteredAt: 'x' }],
  }, 'm');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].leftAt, '2026-10-22T19:00:00Z');
  assert.equal(rows[1].invitationStatus, 'DECLINED');
  assert.equal(rows[1].enteredAt, undefined);
});

test('unanimidade inclui presidente e quem saiu, ignora votos de versões anteriores e de ausentes', () => {
  const minutes = { id: 'min', version: 2 };
  const summary = getMinutesVotingSummary(minutes, [
    { userId: 'president', enteredAt: 'x', leftAt: 'y' }, { userId: 'member', enteredAt: 'x' }, { userId: 'absent' },
  ], [
    { minutesId: 'min', version: 1, userId: 'member', decision: 'APPROVED' },
    { minutesId: 'min', version: 2, userId: 'president', decision: 'APPROVED' },
    { minutesId: 'min', version: 2, userId: 'absent', decision: 'APPROVED' },
  ]);
  assert.equal(summary.required, 2);
  assert.equal(summary.approved, 1);
  assert.equal(summary.voters.find((item) => item.userId === 'member').approval, undefined);
});

test('usa a lista de aprovadores congelada pelo servidor na submissão', () => {
  const summary = getMinutesVotingSummary({ id: 'min', version: 3, requiredApproverIds: ['president', 'member'] }, [
    { userId: 'president', enteredAt: 'x' }, { userId: 'late', enteredAt: 'x' },
  ], [{ minutesId: 'min', version: 3, userId: 'member', decision: 'REJECTED' }]);
  assert.deepEqual(summary.voters.map((voter) => voter.userId), ['president', 'member']);
  assert.equal(summary.required, 2);
  assert.equal(summary.rejected, 1);
});

test('gera lista compartilhável com convites, entradas, saídas e ausentes', () => {
  const text = buildAttendanceText({ title: 'Planejamento', startsAt: '2026-10-22T18:00:00Z', endsAt: '2026-10-22T19:00:00Z', agenda: 'Próximas ações' }, [
    { userId: 'a', name: 'Ana', email: 'ana@example.com', invitationStatus: 'ACCEPTED', enteredAt: '2026-10-22T18:01:00Z' },
    { userId: 'b', name: 'Bruno', invitationStatus: 'DECLINED' },
  ]);
  assert.match(text, /LISTA DE PRESENÇA — Planejamento/);
  assert.match(text, /Participantes com entrada: 1/);
  assert.match(text, /Ana \(ana@example.com\)/);
  assert.match(text, /Saída: Ainda presente/);
  assert.match(text, /Bruno\nConvite: Recusado\nEntrada: Não registrada/);
});

test('integrante removido mantém acesso ao convite e voto pendente sem poder gerenciar a comissão', () => {
  const data = {
    commissions: [{ id: 'c', organizationId: 'org' }, { id: 'private', organizationId: 'org' }],
    organizations: [{ id: 'org', ownerId: 'owner' }],
    commissionMembers: [{ commissionId: 'c', userId: 'chair', role: 'COORDINATOR' }],
    meetings: [{ id: 'meeting', commissionId: 'c' }],
    meetingInvitations: [{ meetingId: 'meeting', userId: 'former-member', status: 'ACCEPTED' }],
  };
  assert.deepEqual(getAccessibleMeetingCommissions(data, 'former-member').map((item) => item.id), ['c']);
  assert.equal(canManageMeetingCommission(data, 'c', 'former-member'), false);
  assert.equal(canManageMeetingCommission(data, 'c', 'chair'), true);
  assert.equal(canManageMeetingCommission(data, 'c', 'owner'), true);
  const votes = getMinutesVotingSummary({ id: 'minutes', version: 1, requiredApproverIds: ['former-member'] }, [], []);
  assert.equal(votes.voters[0].userId, 'former-member');
  assert.equal(votes.voters[0].approval, undefined);
  assert.deepEqual(getAccessibleMeetingCommissions(data, 'outsider'), []);
});
