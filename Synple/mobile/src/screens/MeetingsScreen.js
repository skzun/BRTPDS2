import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, Share, Text, View } from 'react-native';
import { Pressable } from '../components/ActionPressable';
import { Choice, DateTimeField, Field } from '../components/FormControls';
import { buildAttendanceText, buildMeetingPayload, canManageMeetingCommission, getAccessibleMeetingCommissions, getMeetingAttendanceRows, getMinutesVotingSummary } from '../services/meetings';
import { getApiBaseUrl } from '../services/api';
import { prepareMinutesPdf } from '../services/meetingMinutesPdf';
import { ThemeContext } from '../styles/theme';

const INVITATION_LABELS = { INVITED: 'Aguardando resposta', ACCEPTED: 'Aceito', DECLINED: 'Recusado' };
const MINUTES_LABELS = { DRAFT: 'Rascunho', IN_REVIEW: 'Em aprovação', APPROVED: 'Aprovada', REJECTED: 'Rejeitada · correção necessária' };
const EMPTY_FORM = { title: '', startsAt: '', endsAt: '', agenda: '' };

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

function notifyMinutesPdfError(message) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`PDF não gerado\n\n${message}`);
  } else Alert.alert('PDF não gerado', message);
}

async function shareMeetingText(title, message) {
  if (Platform.OS !== 'web') return Share.share({ title, message });
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') return navigator.share({ title, text: message });
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(message);
    return;
  }
  // O texto selecionável permanece na tela nos navegadores sem compartilhamento/clipboard.
}

function MeetingCard({ data, meeting, activeUser, isManager, onRespond, onAttendance, onGenerateAttendance, onSaveMinutes, onSubmitMinutes, onApproveMinutes }) {
  const { styles } = useContext(ThemeContext);
  const minutes = (data.meetingMinutes || []).find((item) => item.meetingId === meeting.id);
  const [content, setContent] = useState(minutes?.content || '');
  const [dirty, setDirty] = useState(false);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState('');
  const [generatedRows, setGeneratedRows] = useState(null);
  const [sharePreview, setSharePreview] = useState('');
  const inFlight = useRef(false);
  const invitation = data.meetingInvitations.find((item) => item.meetingId === meeting.id && item.userId === activeUser.id);
  const attendance = data.meetingAttendance.find((item) => item.meetingId === meeting.id && item.userId === activeUser.id);
  const rows = generatedRows || getMeetingAttendanceRows(data, meeting.id);
  const present = rows.filter((item) => item.enteredAt);
  const votes = getMinutesVotingSummary(minutes, rows, data.meetingMinutesApprovals || []);
  const ownVote = votes.voters.find((item) => item.userId === activeUser.id);
  const canEdit = isManager && minutes?.status !== 'APPROVED';
  const lockedAttendance = ['IN_REVIEW', 'APPROVED'].includes(minutes?.status);

  useEffect(() => {
    if (!dirty) setContent(minutes?.content || '');
  }, [minutes?.content, minutes?.version, dirty]);

  useEffect(() => { setGeneratedRows(null); }, [data.meetingAttendance, data.meetingInvitations]);

  async function generateAttendance() {
    await perform('list', async () => {
      const updatedRows = await onGenerateAttendance(meeting.id);
      if (!updatedRows) return false;
      setGeneratedRows(updatedRows);
      const text = buildAttendanceText(meeting, updatedRows);
      setSharePreview(text);
      try { await shareMeetingText(`Lista de presença · ${meeting.title}`, text); } catch (error) {
        if (error?.name !== 'AbortError') Alert.alert('Lista gerada', 'A lista está disponível na tela para selecionar e copiar.');
      }
      return true;
    });
  }

  async function shareMinutes() {
    const text = `ATA — ${meeting.title}\nVersão ${minutes.version} · ${MINUTES_LABELS[minutes.status]}\n\n${minutes.content}\n\nAprovações: ${votes.approved} de ${votes.required}`;
    setSharePreview(text);
    try { await shareMeetingText(`Ata · ${meeting.title}`, text); } catch (error) {
      if (error?.name !== 'AbortError') Alert.alert('Ata disponível', 'O texto está disponível na tela para selecionar e copiar.');
    }
  }

  async function exportMinutesPdf() {
    if (!minutes || dirty || inFlight.current) return;
    // Abre a janela durante o toque para navegadores que bloqueiam popups assíncronos.
    const browserWindow = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.open('about:blank', '_blank') : null;
    if (Platform.OS === 'web' && !browserWindow) {
      notifyMinutesPdfError('Permita a abertura de uma nova aba para baixar o PDF.');
      return;
    }
    if (browserWindow) browserWindow.opener = null;
    await perform('pdf', async () => {
      try {
        const url = await prepareMinutesPdf({
          apiBaseUrl: getApiBaseUrl(), meetingId: meeting.id,
          userId: activeUser.id, version: minutes.version,
        });
        if (browserWindow) browserWindow.location.replace(url);
        else await Linking.openURL(url);
        return true;
      } catch (error) {
        browserWindow?.close();
        notifyMinutesPdfError(error?.message || 'Não foi possível abrir o PDF da ata. Tente novamente.');
        return false;
      }
    });
  }

  async function perform(action, callback) {
    if (inFlight.current) return false;
    inFlight.current = true;
    setPending(action);
    try {
      return await callback();
    } catch {
      Alert.alert('Operação não concluída', 'Confira sua conexão e tente novamente.');
      return false;
    } finally {
      inFlight.current = false;
      setPending('');
    }
  }

  async function saveMinutes() {
    if (!content.trim()) return Alert.alert('Ata vazia', 'Descreva os assuntos discutidos e as decisões da reunião.');
    const saved = await perform('save', () => onSaveMinutes(meeting.id, content.trim()));
    if (saved) setDirty(false);
  }

  function confirmSubmission() {
    Alert.alert('Enviar ata para aprovação', 'Todos os participantes com entrada registrada deverão aprovar esta versão, incluindo o presidente se estiver na lista. Novas entradas ficarão bloqueadas durante a aprovação.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: () => perform('submit', () => onSubmitMinutes(meeting.id)) },
    ]);
  }

  function confirmDecision(decision) {
    Alert.alert(decision === 'APPROVED' ? 'Aprovar ata' : 'Solicitar correção da ata', decision === 'APPROVED'
      ? `Confirmar a aprovação da versão ${minutes.version}?`
      : 'A ata ficará rejeitada até o presidente salvar uma correção e reenviar para todos aprovarem.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => perform('vote', async () => {
        const saved = await onApproveMinutes(meeting.id, decision, comment.trim(), minutes.version);
        if (saved) setComment('');
        return saved;
      }) },
    ]);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{meeting.title}</Text>
      <Text style={styles.memberDetail}>Início: {formatDate(meeting.startsAt)}</Text>
      <Text style={styles.memberDetail}>Término: {formatDate(meeting.endsAt)}</Text>
      <Text style={styles.label}>Pauta</Text>
      <Text style={styles.muted}>{meeting.agenda}</Text>
      {!!invitation && <Text style={styles.memberDetail}>Seu convite: {INVITATION_LABELS[invitation.status] || invitation.status}</Text>}
      {invitation && !attendance?.enteredAt && invitation.status !== 'ACCEPTED' && !lockedAttendance && (
        <View style={styles.actionRow}>
          <Pressable disabled={!!pending} style={styles.approveButton} onPress={() => perform('invite', () => onRespond(meeting.id, 'ACCEPTED'))}><Text style={styles.actionText}>Aceitar convite</Text></Pressable>
          {invitation.status !== 'DECLINED' && <Pressable disabled={!!pending} style={styles.rejectButton} onPress={() => perform('invite', () => onRespond(meeting.id, 'DECLINED'))}><Text style={styles.rejectText}>Recusar</Text></Pressable>}
        </View>
      )}
      {invitation?.status === 'ACCEPTED' && !attendance?.enteredAt && !lockedAttendance && (
        <View style={styles.actionRow}>
          <Pressable disabled={!!pending} style={styles.primaryButton} onPress={() => perform('attendance', () => onAttendance(meeting.id, 'ENTER'))}><Text style={styles.primaryButtonText}>Registrar entrada</Text></Pressable>
          <Pressable disabled={!!pending} style={styles.rejectButton} onPress={() => perform('invite', () => onRespond(meeting.id, 'DECLINED'))}><Text style={styles.rejectText}>Recusar convite</Text></Pressable>
        </View>
      )}
      {attendance?.enteredAt && !attendance.leftAt && (
        <Pressable disabled={!!pending} style={styles.secondaryButton} onPress={() => perform('attendance', () => onAttendance(meeting.id, 'EXIT'))}><Text style={styles.secondaryButtonText}>Registrar saída</Text></Pressable>
      )}
      {!!attendance?.leftAt && <Text style={styles.memberDetail}>Sua saída foi registrada em {formatDate(attendance.leftAt)}.</Text>}
      {lockedAttendance && !attendance?.enteredAt && <Text style={styles.hint}>A lista de votantes desta ata já foi definida. Novas entradas estão bloqueadas.</Text>}

      <Text style={[styles.label, { marginTop: 14 }]}>Lista de presença · {present.length} participante(s) com entrada</Text>
      {rows.length === 0 && <Text style={styles.muted}>Não há participantes registrados.</Text>}
      {rows.map((row) => (
        <View key={row.userId} style={{ marginBottom: 10 }}>
          <Text style={styles.memberDetail}>{row.name}</Text>
          <Text style={styles.muted}>Convite: {INVITATION_LABELS[row.invitationStatus] || 'Organizador'}</Text>
          <Text style={styles.muted}>{row.enteredAt ? `Entrada: ${formatDate(row.enteredAt)}` : 'Entrada: não registrada'}</Text>
          {!!row.enteredAt && <Text style={styles.muted}>{row.leftAt ? `Saída: ${formatDate(row.leftAt)}` : 'Saída: ainda presente'}</Text>}
        </View>
      ))}
      <Pressable disabled={!!pending} style={styles.secondaryButton} onPress={generateAttendance}><Text style={styles.secondaryButtonText}>{pending === 'list' ? 'Gerando…' : 'Gerar / compartilhar lista de presença'}</Text></Pressable>

      <Text style={[styles.label, { marginTop: 14 }]}>Ata da reunião{minutes ? ` · versão ${minutes.version}` : ''}</Text>
      {minutes && <Text style={styles.memberDetail}>Situação: {MINUTES_LABELS[minutes.status] || minutes.status}</Text>}
      {!minutes && !canEdit && <Text style={styles.muted}>O presidente ainda não criou a ata.</Text>}
      {canEdit ? (
        <>
          <Field label="Discussões e decisões" value={content} onChangeText={(value) => { if (!pending) { setContent(value); setDirty(true); } }} placeholder="Registre os assuntos, as decisões e os encaminhamentos." multiline maxLength={50000} />
          {['IN_REVIEW', 'REJECTED'].includes(minutes?.status) && <Text style={styles.hint}>Salvar uma correção cria uma nova versão e exige nova aprovação de todos os presentes.</Text>}
          <Pressable disabled={!!pending || !content.trim()} style={styles.secondaryButton} onPress={saveMinutes}><Text style={styles.secondaryButtonText}>{pending === 'save' ? 'Salvando…' : ['IN_REVIEW', 'REJECTED'].includes(minutes?.status) ? 'Salvar correção da ata' : 'Salvar rascunho da ata'}</Text></Pressable>
          {minutes?.status === 'DRAFT' && (
            <>
              {(dirty || present.length === 0) && <Text style={styles.hint}>{dirty ? 'Salve as alterações antes de enviar para aprovação.' : 'É necessário pelo menos um participante com entrada registrada para enviar a ata.'}</Text>}
              <Pressable disabled={!!pending || dirty || present.length === 0} style={styles.primaryButton} onPress={confirmSubmission}><Text style={styles.primaryButtonText}>{pending === 'submit' ? 'Enviando…' : 'Enviar ata para aprovação'}</Text></Pressable>
            </>
          )}
        </>
      ) : !!minutes && <Text style={styles.muted}>{minutes.content}</Text>}

      {!!minutes && (
        <>
          <Pressable disabled={!!pending || dirty} style={styles.secondaryButton} onPress={exportMinutesPdf}>
            <Text style={styles.secondaryButtonText}>{pending === 'pdf' ? 'Preparando PDF…' : 'Gerar ata em PDF'}</Text>
          </Pressable>
          <Text style={styles.hint}>{dirty
            ? 'Salve as alterações da ata antes de gerar o PDF.'
            : 'O PDF da versão salva abre no navegador para salvar ou compartilhar. A situação da aprovação aparece no documento.'}</Text>
        </>
      )}

      {!!minutes && minutes.status !== 'DRAFT' && (
        <>
          <Text style={[styles.label, { marginTop: 14 }]}>Aprovações: {votes.approved} de {votes.required}</Text>
          <Text style={styles.hint}>A ata é aprovada quando todos os participantes com entrada registrada aprovam a mesma versão.</Text>
          {votes.voters.map(({ userId, approval }) => {
            const person = data.users.find((user) => user.id === userId);
            return (
              <View key={userId} style={{ marginBottom: 8 }}>
                <Text style={styles.memberDetail}>{person?.name || person?.email || 'Participante'} · {approval?.decision === 'APPROVED' ? 'Aprovou' : approval?.decision === 'REJECTED' ? 'Rejeitou' : 'Aguardando aprovação'}</Text>
                {!!approval?.comment && <Text style={styles.muted}>Comentário: {approval.comment}</Text>}
              </View>
            );
          })}
          {minutes.status === 'IN_REVIEW' && ownVote && !ownVote.approval && (
            <>
              {dirty && <Text style={styles.hint}>Há alterações no texto. Salve a correção e envie a nova versão antes de aprovar.</Text>}
              <Field label="Comentário (opcional)" value={comment} onChangeText={(value) => { if (!pending) setComment(value); }} placeholder="Explique uma correção, se necessário." multiline maxLength={2000} />
              <View style={styles.actionRow}>
                <Pressable disabled={!!pending || dirty} style={styles.approveButton} onPress={() => confirmDecision('APPROVED')}><Text style={styles.actionText}>Aprovar ata</Text></Pressable>
                <Pressable disabled={!!pending || dirty} style={styles.rejectButton} onPress={() => confirmDecision('REJECTED')}><Text style={styles.rejectText}>Rejeitar ata</Text></Pressable>
              </View>
            </>
          )}
          {minutes.status === 'IN_REVIEW' && !ownVote && <Text style={styles.hint}>Apenas os participantes com entrada registrada no momento do envio podem aprovar esta ata.</Text>}
          {!!minutes.approvedAt && <Text style={styles.memberDetail}>Aprovada em {formatDate(minutes.approvedAt)}.</Text>}
          {minutes.status === 'APPROVED' && <Pressable disabled={!!pending} style={styles.secondaryButton} onPress={shareMinutes}><Text style={styles.secondaryButtonText}>Compartilhar ata aprovada</Text></Pressable>}
        </>
      )}
      {!!sharePreview && <><Text style={[styles.label, { marginTop: 14 }]}>Texto para compartilhar</Text><Text selectable style={styles.muted}>{sharePreview}</Text><Pressable style={styles.secondaryButton} onPress={() => setSharePreview('')}><Text style={styles.secondaryButtonText}>Fechar texto</Text></Pressable></>}
      {!!pending && <Text style={styles.hint}>{pending === 'pdf' ? 'Aguarde, preparando o PDF…' : 'Aguarde, salvando no servidor…'}</Text>}
    </View>
  );
}

export function MeetingsScreen({ data, activeUser, meetings, onSchedule, onRespond, onAttendance, onGenerateAttendance, onSaveMinutes, onSubmitMinutes, onApproveMinutes, onRefresh, isRefreshing }) {
  const { styles } = useContext(ThemeContext);
  const [selectedCommissionId, setSelectedCommissionId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [excludedInviteeIds, setExcludedInviteeIds] = useState([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const scheduleInFlight = useRef(false);
  const commissions = useMemo(() => getAccessibleMeetingCommissions(data, activeUser.id), [data.commissions, data.commissionMembers, data.organizations, data.meetings, data.meetingInvitations, activeUser.id]);
  const commissionId = commissions.some((item) => item.id === selectedCommissionId) ? selectedCommissionId : commissions[0]?.id;
  const commission = commissions.find((item) => item.id === commissionId);
  const isManager = canManageMeetingCommission(data, commissionId, activeUser.id);
  const commissionMembers = data.commissionMembers.filter((member) => member.commissionId === commissionId && member.userId !== activeUser.id);
  const visibleMeetings = meetings.filter((meeting) => meeting.commissionId === commissionId && (
    isManager || data.meetingInvitations.some((invite) => invite.meetingId === meeting.id && invite.userId === activeUser.id)
  )).sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));

  async function submitMeeting() {
    if (scheduleInFlight.current) return;
    const inviteeIds = commissionMembers.filter((member) => !excludedInviteeIds.includes(member.userId)).map((member) => member.userId);
    const payload = buildMeetingPayload(form, commissionId, inviteeIds);
    if (payload.error) return Alert.alert('Confira o agendamento', payload.error);
    scheduleInFlight.current = true;
    setIsScheduling(true);
    try {
      const saved = await onSchedule(payload.meeting);
      if (saved) { setForm(EMPTY_FORM); setExcludedInviteeIds([]); }
    } catch {
      Alert.alert('Reunião não agendada', 'Confira sua conexão e tente novamente. Os campos foram preservados.');
    } finally {
      scheduleInFlight.current = false;
      setIsScheduling(false);
    }
  }

  if (!commission) return <Text style={styles.empty}>Você ainda não participa de uma comissão com reuniões disponíveis.</Text>;

  return (
    <>
      <Text style={styles.sectionTitle}>Reuniões</Text>
      <Pressable disabled={isRefreshing || isScheduling} style={styles.secondaryButton} onPress={onRefresh}><Text style={styles.secondaryButtonText}>{isRefreshing ? 'Atualizando…' : 'Atualizar reuniões e aprovações'}</Text></Pressable>
      {commissions.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.label}>Comissão</Text>
          <View style={styles.userChoices}>
            {commissions.map((item) => <Choice key={item.id} label={item.name} active={commissionId === item.id} onPress={() => { if (!isScheduling) { setSelectedCommissionId(item.id); setExcludedInviteeIds([]); } }} />)}
          </View>
        </View>
      )}
      {isManager && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agendar reunião</Text>
          <Text style={styles.hint}>O presidente da comissão ou proprietário agenda e convida os membros. Você participa automaticamente.</Text>
          <Field label="Título" value={form.title} onChangeText={(title) => { if (!isScheduling) setForm((current) => ({ ...current, title })); }} placeholder="Ex.: Planejamento mensal" maxLength={160} />
          <DateTimeField label="Início" value={form.startsAt} onChangeText={(startsAt) => setForm((current) => ({ ...current, startsAt }))} editable={!isScheduling} />
          <DateTimeField label="Término" value={form.endsAt} onChangeText={(endsAt) => setForm((current) => ({ ...current, endsAt }))} editable={!isScheduling} />
          <Text style={styles.hint}>Use o horário local do seu aparelho.</Text>
          <Field label="Pauta" value={form.agenda} onChangeText={(agenda) => { if (!isScheduling) setForm((current) => ({ ...current, agenda })); }} placeholder="Assuntos que serão discutidos" multiline maxLength={10000} />
          <Text style={styles.label}>Membros convidados</Text>
          <Text style={styles.hint}>Toque em um membro para incluir ou retirar do convite.</Text>
          <View style={styles.userChoices}>
            {commissionMembers.map((member) => {
              const person = data.users.find((user) => user.id === member.userId);
              return <Choice key={member.userId} label={person?.name || person?.email || 'Membro'} active={!excludedInviteeIds.includes(member.userId)} onPress={() => {
                if (!isScheduling) setExcludedInviteeIds((current) => current.includes(member.userId) ? current.filter((id) => id !== member.userId) : [...current, member.userId]);
              }} />;
            })}
          </View>
          {commissionMembers.length === 0 && <Text style={styles.muted}>A comissão ainda não possui outros membros.</Text>}
          <Pressable disabled={isScheduling} style={styles.primaryButton} onPress={submitMeeting}><Text style={styles.primaryButtonText}>{isScheduling ? 'Agendando…' : 'Agendar e convidar'}</Text></Pressable>
        </View>
      )}
      {visibleMeetings.length === 0 && <Text style={styles.empty}>Não há reuniões para esta comissão.</Text>}
      {visibleMeetings.map((meeting) => <MeetingCard key={meeting.id} data={data} meeting={meeting} activeUser={activeUser} isManager={isManager} onRespond={onRespond} onAttendance={onAttendance} onGenerateAttendance={onGenerateAttendance} onSaveMinutes={onSaveMinutes} onSubmitMinutes={onSubmitMinutes} onApproveMinutes={onApproveMinutes} />)}
    </>
  );
}
