import { useMemo, useState, useContext } from 'react';
import { Alert, Text, View } from 'react-native';
import { Pressable } from '../components/ActionPressable';
import { Choice, Field } from '../components/FormControls';
import { ThemeContext } from '../styles/theme';

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

export function MeetingsScreen({ data, activeUser, meetings, onSchedule, onRespond, onAttendance }) {
  const { styles } = useContext(ThemeContext);
  const [selectedCommissionId, setSelectedCommissionId] = useState('');
  const [form, setForm] = useState({ title: '', startsAt: '', endsAt: '', agenda: '' });
  const commissions = useMemo(() => data.commissions.filter((commission) => (
    data.commissionMembers.some((member) => member.commissionId === commission.id && member.userId === activeUser.id)
    || data.organizations.some((org) => org.id === commission.organizationId && org.ownerId === activeUser.id)
  )), [data.commissions, data.commissionMembers, data.organizations, activeUser.id]);

  const commissionId = commissions.some((item) => item.id === selectedCommissionId)
    ? selectedCommissionId : commissions[0]?.id;
  const commission = commissions.find((item) => item.id === commissionId);
  const isManager = Boolean(commission && (
    data.organizations.some((org) => org.id === commission.organizationId && org.ownerId === activeUser.id)
    || data.commissionMembers.some((member) => member.commissionId === commission.id && member.userId === activeUser.id && member.role === 'COORDINATOR')
  ));
  const visibleMeetings = meetings.filter((meeting) => meeting.commissionId === commissionId && (
    isManager || data.meetingInvitations.some((invite) => invite.meetingId === meeting.id && invite.userId === activeUser.id)
  ));

  function submitMeeting() {
    if (!form.title.trim() || !form.agenda.trim() || !form.startsAt.trim() || !form.endsAt.trim()) {
      return Alert.alert('Campos obrigatórios', 'Informe título, pauta, início e término.');
    }
    const startsAt = new Date(form.startsAt.replace(' ', 'T'));
    const endsAt = new Date(form.endsAt.replace(' ', 'T'));
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return Alert.alert('Horário inválido', 'Confira as datas e informe o término depois do início. Use o formato AAAA-MM-DD HH:mm.');
    }
    const inviteeIds = data.commissionMembers.filter((member) => member.commissionId === commissionId).map((member) => member.userId);
    onSchedule({ commissionId, title: form.title.trim(), agenda: form.agenda.trim(), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), inviteeIds });
    setForm({ title: '', startsAt: '', endsAt: '', agenda: '' });
  }

  if (!commission) return <Text style={styles.empty}>Você ainda não participa de uma comissão com reuniões disponíveis.</Text>;

  return (
    <>
      <Text style={styles.sectionTitle}>Reuniões</Text>
      {commissions.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.label}>Comissão</Text>
          <View style={styles.userChoices}>
            {commissions.map((item) => <Choice key={item.id} label={item.name} active={commissionId === item.id} onPress={() => setSelectedCommissionId(item.id)} />)}
          </View>
        </View>
      )}

      {isManager && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agendar reunião</Text>
          <Text style={styles.hint}>Os membros da comissão receberão um convite para aceitar ou recusar.</Text>
          <Field label="Título" value={form.title} onChangeText={(title) => setForm((current) => ({ ...current, title }))} placeholder="Ex.: Planejamento mensal" />
          <Field label="Início (AAAA-MM-DD HH:mm)" value={form.startsAt} onChangeText={(startsAt) => setForm((current) => ({ ...current, startsAt }))} placeholder="2026-10-20 18:00" />
          <Field label="Término (AAAA-MM-DD HH:mm)" value={form.endsAt} onChangeText={(endsAt) => setForm((current) => ({ ...current, endsAt }))} placeholder="2026-10-20 19:30" />
          <Field label="Pauta" value={form.agenda} onChangeText={(agenda) => setForm((current) => ({ ...current, agenda }))} placeholder="Assuntos que serão discutidos" multiline />
          <Pressable style={styles.primaryButton} onPress={submitMeeting}><Text style={styles.primaryButtonText}>Agendar e convidar</Text></Pressable>
        </View>
      )}

      {visibleMeetings.length === 0 && <Text style={styles.empty}>Não há reuniões para esta comissão.</Text>}
      {visibleMeetings.map((meeting) => {
        const invitation = data.meetingInvitations.find((item) => item.meetingId === meeting.id && item.userId === activeUser.id);
        const attendance = data.meetingAttendance.find((item) => item.meetingId === meeting.id && item.userId === activeUser.id);
        const attendees = data.meetingAttendance.filter((item) => item.meetingId === meeting.id && item.enteredAt);
        return (
          <View key={meeting.id} style={styles.card}>
            <Text style={styles.cardTitle}>{meeting.title}</Text>
            <Text style={styles.memberDetail}>Início: {formatDate(meeting.startsAt)}</Text>
            <Text style={styles.memberDetail}>Término: {formatDate(meeting.endsAt)}</Text>
            <Text style={styles.label}>Pauta</Text>
            <Text style={styles.muted}>{meeting.agenda}</Text>
            {!!invitation && <Text style={styles.memberDetail}>Convite: {({ INVITED: 'Aguardando resposta', ACCEPTED: 'Aceito', DECLINED: 'Recusado' })[invitation.status]}</Text>}
            {invitation?.status === 'INVITED' && (
              <View style={styles.actionRow}>
                <Pressable style={styles.approveButton} onPress={() => onRespond(meeting.id, 'ACCEPTED')}><Text style={styles.actionText}>Aceitar convite</Text></Pressable>
                <Pressable style={styles.rejectButton} onPress={() => onRespond(meeting.id, 'DECLINED')}><Text style={styles.rejectText}>Recusar</Text></Pressable>
              </View>
            )}
            {invitation?.status === 'ACCEPTED' && !attendance?.enteredAt && (
              <Pressable style={styles.primaryButton} onPress={() => onAttendance(meeting.id, 'ENTER')}><Text style={styles.primaryButtonText}>Registrar entrada</Text></Pressable>
            )}
            {attendance?.enteredAt && !attendance.leftAt && (
              <Pressable style={styles.secondaryButton} onPress={() => onAttendance(meeting.id, 'EXIT')}><Text style={styles.secondaryButtonText}>Registrar saída</Text></Pressable>
            )}
            {isManager && (
              <>
                <Text style={[styles.label, { marginTop: 14 }]}>Lista de presença ({attendees.length})</Text>
                {attendees.length === 0 && <Text style={styles.muted}>Ainda não há entradas registradas.</Text>}
                {attendees.map((record) => {
                  const person = data.users.find((user) => user.id === record.userId);
                  return <Text key={record.id} style={styles.memberDetail}>{person?.name || person?.email || 'Participante'} · entrada {formatDate(record.enteredAt)}{record.leftAt ? ` · saída ${formatDate(record.leftAt)}` : ' · presente'}</Text>;
                })}
              </>
            )}
          </View>
        );
      })}
    </>
  );
}
