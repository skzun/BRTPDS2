// Datas digitadas são interpretadas no fuso do aparelho, sem parsing dependente da plataforma.
function parseMeetingDate(value = '') {
  const match = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, day, month, year, hours, minutes] = match.map(Number);
  if (year < 2000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59) return null;
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day
    || date.getHours() !== hours || date.getMinutes() !== minutes) return null;
  return date;
}

function buildMeetingPayload(form, commissionId, inviteeIds = [], now = new Date()) {
  const fields = {};
  if (!form.title?.trim() || form.title.trim().length > 160) fields.title = 'Informe um título de até 160 caracteres.';
  if (!form.agenda?.trim() || form.agenda.length > 10000) fields.agenda = 'Informe a pauta (até 10.000 caracteres).';
  let start = parseMeetingDate(form.startsAt), end = parseMeetingDate(form.endsAt);
  if (form.allDay && start && end) { start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0); end.setDate(end.getDate() + 1); }
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const startDay = start ? new Date(start) : null;
  if (startDay) startDay.setHours(0, 0, 0, 0);
  if (!start || startDay < today || (!form.allDay && start <= new Date(now))) {
    fields.startsAt = form.allDay ? 'Escolha hoje ou uma data futura.' : 'Escolha hoje ou um horário futuro.';
  }
  if (!end || (start && end <= start)) fields.endsAt = 'O término deve ser posterior ao início.';
  if ((form.location || '').length > 300) fields.location = 'Use até 300 caracteres.';
  if ((form.details || '').length > 4000) fields.details = 'Use até 4.000 caracteres.';
  if (Object.keys(fields).length) return { fields, error: Object.values(fields).join('\n') };
  return {
    meeting: {
      commissionId,
      title: form.title.trim(),
      agenda: form.agenda.trim(),
      allDay: !!form.allDay,
      location: (form.location || '').trim(),
      details: (form.details || '').trim(),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      inviteeIds: [...new Set(inviteeIds)],
    },
  };
}

function getMeetingAttendanceRows(data, meetingId) {
  const rows = new Map();
  (data.meetingInvitations || []).filter((item) => item.meetingId === meetingId).forEach((invite) => {
    rows.set(invite.userId, { userId: invite.userId, invitationStatus: invite.status });
  });
  (data.meetingAttendance || []).filter((item) => item.meetingId === meetingId).forEach((record) => {
    rows.set(record.userId, { ...rows.get(record.userId), ...record });
  });
  return [...rows.values()].map((row) => {
    const user = (data.users || []).find((person) => person.id === row.userId);
    return { ...row, name: user?.name || user?.email || 'Participante', email: user?.email || '' };
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function canManageMeetingCommission(data, commissionId, userId) {
  const commission = (data.commissions || []).find((item) => item.id === commissionId);
  if (!commission) return false;
  return (data.organizations || []).some((org) => org.id === commission.organizationId && org.ownerId === userId)
    || (data.commissionMembers || []).some((member) => member.commissionId === commissionId && member.userId === userId && member.role === 'COORDINATOR');
}

function getAccessibleMeetingCommissions(data, userId) {
  const invitedMeetingIds = new Set((data.meetingInvitations || []).filter((invite) => invite.userId === userId).map((invite) => invite.meetingId));
  const historicalCommissionIds = new Set((data.meetings || []).filter((meeting) => invitedMeetingIds.has(meeting.id)).map((meeting) => meeting.commissionId));
  const organizationIds = new Set((data.organizations || []).filter((organization) => organization.ownerId === userId
    || (data.accessRequests || []).some((request) => request.organizationId === organization.id && request.userId === userId && request.status === 'APPROVED'))
    .map((organization) => organization.id));
  return (data.commissions || []).filter((commission) => organizationIds.has(commission.organizationId)
    || historicalCommissionIds.has(commission.id)
    || (data.commissionMembers || []).some((member) => member.commissionId === commission.id && member.userId === userId)
    || (data.organizations || []).some((org) => org.id === commission.organizationId && org.ownerId === userId));
}

function getMinutesVotingSummary(minutes, attendees = [], approvals = []) {
  const presentIds = Array.isArray(minutes?.requiredApproverIds) && minutes.requiredApproverIds.length > 0
    ? [...new Set(minutes.requiredApproverIds)]
    : [...new Set(attendees.filter((item) => item.enteredAt).map((item) => item.userId))];
  const currentApprovals = approvals.filter((item) => item.minutesId === minutes?.id && item.version === minutes?.version);
  const voters = presentIds.map((userId) => ({
    userId,
    approval: currentApprovals.find((item) => item.userId === userId),
  }));
  return {
    voters,
    required: voters.length,
    approved: voters.filter((item) => item.approval?.decision === 'APPROVED').length,
    rejected: voters.filter((item) => item.approval?.decision === 'REJECTED').length,
  };
}

function buildAttendanceText(meeting, rows) {
  const format = (value) => value ? new Date(value).toLocaleString('pt-BR') : 'Não registrada';
  const invitationLabels = { INVITED: 'Aguardando resposta', ACCEPTED: 'Aceito', DECLINED: 'Recusado' };
  return [
    `LISTA DE PRESENÇA — ${meeting.title}`,
    `Início: ${format(meeting.startsAt)}`,
    `Término: ${format(meeting.endsAt)}`,
    `Pauta: ${meeting.agenda}`,
    `Participantes com entrada: ${rows.filter((row) => row.enteredAt).length}`,
    '',
    ...rows.map((row) => `${row.name}${row.email ? ` (${row.email})` : ''}\nConvite: ${invitationLabels[row.invitationStatus] || 'Organizador'}\nEntrada: ${format(row.enteredAt)}\nSaída: ${row.enteredAt && !row.leftAt ? 'Ainda presente' : format(row.leftAt)}\n`),
  ].join('\n');
}

module.exports = { parseMeetingDate, buildMeetingPayload, getMeetingAttendanceRows, getMinutesVotingSummary, buildAttendanceText, getAccessibleMeetingCommissions, canManageMeetingCommission };
