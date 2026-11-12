import { useCallback, useEffect, useState } from 'react';
import { Pressable } from '../components/ActionPressable';
import { Text, View } from 'react-native';
import { fetchMeetingParticipationReportWithApi } from '../services/api';
import { ThemeContext } from '../styles/theme';
import { useContext } from 'react';

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

const MINUTES_STATUS = { DRAFT: 'Rascunho', IN_REVIEW: 'Em aprovação', APPROVED: 'Aprovada', REJECTED: 'Rejeitada' };

export function MeetingParticipationScreen() {
  const { styles } = useContext(ThemeContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchMeetingParticipationReportWithApi();
    setError(result.success ? '' : result.error);
    if (result.success) setMeetings(result.meetings);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <>
      <Text style={styles.sectionTitle}>Meu relatório de participação</Text>
      <Text style={styles.hint}>Reuniões em que sua entrada foi registrada no sistema. Os horários são exibidos no fuso local do aparelho.</Text>
      <Pressable disabled={loading} style={styles.secondaryButton} onPress={refresh}>
        <Text style={styles.secondaryButtonText}>{loading ? 'Atualizando…' : 'Atualizar relatório'}</Text>
      </Pressable>
      {!!error && <Text accessibilityRole="alert" style={styles.hint}>{error}</Text>}
      {!loading && !error && meetings.length === 0 && <Text style={styles.empty}>Ainda não há reuniões com sua presença registrada.</Text>}
      {meetings.map((meeting) => (
        <View key={meeting.meetingId} style={styles.card}>
          <Text style={styles.cardTitle}>{meeting.title}</Text>
          <Text style={styles.memberDetail}>{meeting.organizationName} · {meeting.commissionName}</Text>
          <Text style={styles.memberDetail}>Início agendado: {formatDate(meeting.startsAt)}</Text>
          <Text style={styles.memberDetail}>Término agendado: {formatDate(meeting.endsAt)}</Text>
          <Text style={styles.memberDetail}>Sua entrada: {formatDate(meeting.enteredAt)}</Text>
          <Text style={styles.memberDetail}>Sua saída: {meeting.leftAt ? formatDate(meeting.leftAt) : 'não registrada'}</Text>
          {!!meeting.minutesStatus && <Text style={styles.memberDetail}>Ata: {MINUTES_STATUS[meeting.minutesStatus] || meeting.minutesStatus}</Text>}
        </View>
      ))}
    </>
  );
}
