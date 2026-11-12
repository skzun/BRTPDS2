import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardScrollView as ScrollView } from './src/components/KeyboardScrollView';

import { INITIAL_DATA } from './src/constants/data';
import { useSynpleData, EMPTY_DATA } from './src/hooks/useSynpleData';
import { saveData } from './src/services/storage';
import { restoreSession, clearSession, confirmBiometric } from './src/services/session';
import { formatCNPJ, formatPhone } from './src/services/formatters';
import { getAccessibleMeetingCommissions } from './src/services/meetings';
import { normalizeEmail, validateCommission, validateLogin, validateOrganization, validatePassword, validatePhone, validateRegistration, validateUser } from './src/services/validation';
import {
  changePasswordWithApi,
  createCommissionWithApi,
  addCommissionMemberWithApi,
  updateCommissionMemberRoleWithApi,
  removeCommissionMemberWithApi,
  createOrganizationWithApi,
  deleteOrganizationWithApi,
  deleteUserWithApi,
  getApiBaseUrl,
  loginWithGoogleApi,
  loginWithApi,
  authRequest,
  fetchSystemInfo,
  commissionRequest,
  organizationInvitation,
  registerWithApi,
  requestAccessWithApi,
  requestPasswordResetWithApi,
  resetPasswordWithApi,
  updateAccessRequestStatusWithApi,
  updateOrganizationStatusWithApi,
  transferOrganizationOwnershipWithApi,
  updateOrganizationWithApi,
  scheduleMeetingWithApi,
  respondToMeetingInvitationWithApi,
  recordMeetingAttendanceWithApi,
  fetchMeetingAttendanceWithApi,
  saveMeetingMinutesWithApi,
  submitMeetingMinutesWithApi,
  approveMeetingMinutesWithApi,
  createMeetingVoteWithApi,
  castMeetingVoteWithApi,
  closeMeetingVoteWithApi,
  updateUserWithApi,
} from './src/services/api';
import { getThemeStyles, ThemeContext } from './src/styles/theme';

// Componentes modulares
import { AppHeader } from './src/components/AppHeader';
import { Pressable } from './src/components/ActionPressable';
import { NavigationTabs } from './src/components/NavigationTabs';

// Telas modulares
import { LoginScreen } from './src/screens/LoginScreen';
import { OrganizationsScreen } from './src/screens/OrganizationsScreen';
import { MyOrganizationScreen } from './src/screens/MyOrganizationScreen';
import { CommissionsScreen } from './src/screens/CommissionsScreen';
import { AdminManagementScreen } from './src/screens/AdminManagementScreen';
import { SystemScreen } from './src/screens/SystemScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MeetingsScreen } from './src/screens/MeetingsScreen';
import { MeetingParticipationScreen } from './src/screens/MeetingParticipationScreen';
import { ManualScreen } from './src/screens/ManualScreen';

const createId = (prefix) => `${prefix}-${Date.now()}`;


export default function App() {
  const { data, isReady, setData, storageError, dbStatus, syncWithRemote } = useSynpleData();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screen, setScreen] = useState('organizations');
  const [role, setRole] = useState('USER');
  const [activeUserId, setActiveUserId] = useState('user-visitante');
  const [organizationForm, setOrganizationForm] = useState({ name: '', document: '' });
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  const organizationCreationInFlightRef = useRef(false);
  const organizationStatusInFlightRef = useRef(new Set());
  const [organizationStatusPending, setOrganizationStatusPending] = useState(() => new Set());
  const commissionMemberOperationsRef = useRef(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('org-aurora');
  const [commissionForm, setCommissionForm] = useState({ name: '', type: 'Comissão', description: '' });
  const [editingCommissionId, setEditingCommissionId] = useState(null);
  const [editCommissionForm, setEditCommissionForm] = useState({ name: '', type: 'Comissão', description: '', status: 'ACTIVE' });
  const [selectedCommissionId, setSelectedCommissionId] = useState('commission-1');
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    if (storageError) Alert.alert('Aviso', storageError);
  }, [storageError]);

  useEffect(() => {
    if (!isReady) return undefined;
    const splashTimer = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(splashTimer);
  }, [isReady]);

  const activeUser = data.users.find((user) => user.id === activeUserId);
  const deviceTheme = useColorScheme();
  const isDark = isAuthenticated ? activeUser?.theme === 'DARK' : deviceTheme === 'dark';
  const styles = useMemo(() => getThemeStyles(isDark), [isDark]);
  const isSystemAdmin = role === 'SYSTEM_ADMIN';
  const ownedOrganizations = data.organizations.filter((organization) => organization.ownerId === activeUserId);
  const approvedOwnedOrganizations = ownedOrganizations.filter((organization) => organization.status === 'APPROVED');
  const isOrgAdmin = !isSystemAdmin && approvedOwnedOrganizations.length > 0;
  const isCeo = isOrgAdmin;
  const selectedOrganization = data.organizations.find((organization) => organization.id === selectedOrganizationId);
  const approvedOrganizations = useMemo(
    () => data.organizations.filter((organization) => organization.status === 'APPROVED'),
    [data.organizations],
  );
  const organizationCommissions = data.commissions.filter((commission) => commission.organizationId === selectedOrganizationId);
  const selectedCommission = data.commissions.find((commission) => commission.id === selectedCommissionId);
  const organizationMembers = data.users.filter((user) => (
    selectedOrganization?.ownerId === user.id || data.accessRequests.some((request) => request.organizationId === selectedOrganizationId && request.userId === user.id && request.status === 'APPROVED')
  ));
  const commissionMemberships = data.commissionMembers.filter((member) => member.commissionId === selectedCommissionId);
  const commissionTeam = commissionMemberships.map((membership) => {
    const user = data.users.find((u) => u.id === membership.userId);
    return user ? { ...user, commissionRole: membership.role || 'MEMBER' } : null;
  }).filter(Boolean);
  const availableOrgMembers = organizationMembers.filter((user) => !commissionMemberships.some((m) => m.userId === user.id));
  const hasMeetingsAccess = !isSystemAdmin && getAccessibleMeetingCommissions(data, activeUserId).length > 0;

  async function refreshData() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try { await syncWithRemote(); } finally { setIsRefreshing(false); }
  }

  function confirmAction(title, message, action, destructive = false) {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: destructive ? 'destructive' : 'default', onPress: action },
    ]);
  }

  useEffect(() => {
    if (isOrgAdmin && (!selectedOrganizationId || !approvedOwnedOrganizations.some((org) => org.id === selectedOrganizationId))) {
      if (approvedOwnedOrganizations.length > 0) {
        setSelectedOrganizationId(approvedOwnedOrganizations[0].id);
      }
    }
  }, [isOrgAdmin, approvedOwnedOrganizations, selectedOrganizationId]);

  async function createOrganization() {
    if (organizationCreationInFlightRef.current) return;

    const validationError = validateOrganization(organizationForm);
    if (validationError) {
      Alert.alert('Campos obrigatórios', validationError);
      return;
    }
    const name = organizationForm.name.trim();
    const document = organizationForm.document.trim();
    if (data.organizations.some((organization) => organization.document === document)) {
      Alert.alert('CNPJ já cadastrado', 'Já existe uma organização com este CNPJ.');
      return;
    }

    confirmAction('Confirmar cadastro', `Criar a organização "${name}" com o CNPJ ${document}?`, async () => {
    organizationCreationInFlightRef.current = true;
    setIsCreatingOrganization(true);

    try {
      const apiRes = await createOrganizationWithApi({ name, document, ownerId: activeUserId, status: 'PENDING' });
      if (!apiRes?.success || !apiRes.organization?.id) {
        Alert.alert('Cadastro não confirmado', apiRes?.error || 'Não foi possível confirmar o cadastro no servidor. Tente novamente.');
        return;
      }

      const organization = { ...apiRes.organization, pendingSync: false };
      setData((current) => ({
        ...current,
        organizations: current.organizations.some((item) => item.document === organization.document)
          ? current.organizations
          : [...current.organizations, organization],
      }));
      setSelectedOrganizationId(organization.id);
      setRole('USER');
      setScreen('management');
      setOrganizationForm({ name: '', document: '' });
      Alert.alert('Cadastro confirmado', 'A organização foi registrada no servidor e aguarda aprovação do administrador do sistema.');
    } catch (err) {
      console.warn('Falha ao confirmar organização no servidor:', err);
      Alert.alert('Cadastro não confirmado', 'Não foi possível confirmar o cadastro no servidor. Tente novamente.');
    } finally {
      organizationCreationInFlightRef.current = false;
      setIsCreatingOrganization(false);
    }
    });
  }

  async function finishLogin(user) {
    setData({ ...EMPTY_DATA, users: [user] });
    setActiveUserId(user.id);
    setRole(user.systemRole === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER');
    setScreen(user.systemRole === 'SYSTEM_ADMIN' ? 'admin-management' : 'organizations');
    setIsAuthenticated(true);
    await syncWithRemote();
  }
  async function login({ email, password }) {
    const error = validateLogin({ email, password });
    if (error) return Alert.alert('Dados inválidos', error);
    const result = await loginWithApi(normalizeEmail(email), password);
    if (!result.success) return Alert.alert('Não foi possível entrar', result.error);
    await finishLogin(result.user);
  }
  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    (async () => {
      if (!(await restoreSession()) || !alive) return;
      const user = await authRequest('me', null, 'GET');
      if (user.success && alive) await finishLogin(user);
      else await clearSession();
    })();
    return () => { alive = false; };
  }, [isReady]);

  async function loginWithGoogle(idToken) {
    const result = await loginWithGoogleApi(idToken);
    if (!result.success || !result.user) {
      Alert.alert('Login com Google', result.error || 'Não foi possível entrar com Google.');
      return false;
    }

    await finishLogin(result.user);
    return true;
  }
  async function registerUser(form) {
    const error = validateRegistration(form);
    if (error) return { success: false, error };
    const result = await registerWithApi({ ...form, email: normalizeEmail(form.email) });
    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  }
  async function logout() {
    await authRequest('logout');
    await clearSession();
    setPasswordForm({ current: '', next: '', confirm: '' });
    setData(EMPTY_DATA);
    setIsAuthenticated(false);
  }

  function changeOrganizationStatus(organizationId, status) {
    if (organizationStatusInFlightRef.current.has(organizationId)) return;
    confirmAction('Alterar situação', 'Confirmar a alteração da organização?', async () => {
      organizationStatusInFlightRef.current.add(organizationId);
      setOrganizationStatusPending((current) => new Set(current).add(organizationId));
      try {
        const result = await updateOrganizationStatusWithApi(organizationId, status);
        if (!result?.id) return Alert.alert('Alteração não realizada', result?.error || 'A API não confirmou a alteração.');
        setData((current) => ({
          ...current,
          organizations: current.organizations.map((organization) => organization.id === organizationId
            ? { ...organization, status: result.status }
            : organization),
        }));
        await syncWithRemote();
      } finally {
        organizationStatusInFlightRef.current.delete(organizationId);
        setOrganizationStatusPending((current) => {
          const next = new Set(current);
          next.delete(organizationId);
          return next;
        });
      }
    });
  }
  function removeOrganization(organizationId) {
    confirmAction('Excluir organização', 'Excluir a organização no servidor? Registros históricos podem impedir a exclusão.', async () => {
      const result = await deleteOrganizationWithApi(organizationId);
      if (!result.success) return Alert.alert('Organização não removida', 'A API não confirmou a exclusão.');
      await syncWithRemote();
    }, true);
  }

  function removeUser(userId) {
    const user = data.users.find((item) => item.id === userId);
    if (!isSystemAdmin || !user || user.id === activeUserId || user.systemRole === 'SYSTEM_ADMIN') return;
    Alert.alert('Remover usuário', 'O usuário e todas as suas organizações, acessos e vínculos serão removidos permanentemente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        const deletion = await deleteUserWithApi(user.id || user.email);
        if (!deletion.success) {
          Alert.alert('Usuário não removido', deletion.error || 'Não foi possível confirmar a exclusão no servidor.');
          return;
        }

        // 2. Atualiza estado e persiste imediatamente no armazenamento local para evitar ressuscitação
        setData((current) => {
          const organizationIds = current.organizations.filter((organization) => organization.ownerId === userId).map((organization) => organization.id);
          const commissionIds = current.commissions.filter((commission) => organizationIds.includes(commission.organizationId)).map((commission) => commission.id);
          const updated = {
            ...current,
            users: current.users.filter((item) => item.id !== userId && item.email !== user.email),
            organizations: current.organizations.filter((organization) => organization.ownerId !== userId),
            accessRequests: current.accessRequests.filter((request) => request.userId !== userId && !organizationIds.includes(request.organizationId)),
            commissions: current.commissions.filter((commission) => !organizationIds.includes(commission.organizationId)),
            commissionMembers: current.commissionMembers.filter((member) => member.userId !== userId && !commissionIds.includes(member.commissionId)),
          };
          saveData(updated).catch(() => {});
          return updated;
        });
      } },
    ]);
  }

  async function requestAccess(organizationId) {
    const result = await requestAccessWithApi(organizationId, activeUserId);
    if (!result?.id) return Alert.alert('Solicitação não enviada', 'Não foi possível confirmar sua solicitação no servidor.');
    await syncWithRemote();
  }
  async function changeAccessStatus(requestId, status) {
    const result = await updateAccessRequestStatusWithApi(requestId, status, 'MEMBER');
    if (!result?.id && !result?.success) return Alert.alert('Alteração não confirmada', 'Confira sua conexão e se o convite já foi aceito.');
    await syncWithRemote();
  }
  async function updateOrganizationRole(requestId, organizationRole) {
    const result = await updateAccessRequestStatusWithApi(requestId, null, organizationRole);
    if (!result?.id && !result?.success) return Alert.alert('Cargo não alterado', 'Não foi possível confirmar a alteração no servidor.');
    await syncWithRemote();
  }
  function removeOrganizationMember(requestId) {
    confirmAction('Remover membro', 'A remoção será confirmada pelo servidor. Transfira a coordenação antes de remover um coordenador.', () => changeAccessStatus(requestId, 'REVOKED'));
  }

  function transferOrganizationOwnership(userId) {
    const member = data.users.find((user) => user.id === userId);
    if (!member || !selectedOrganization || selectedOrganization.ownerId !== activeUserId) return;
    confirmAction('Transferir propriedade', `Transferir o cargo de dono de "${selectedOrganization.name}" para ${member.name}? Você permanecerá como membro.`, async () => {
      const result = await transferOrganizationOwnershipWithApi(selectedOrganization.id, activeUserId, userId);
      if (!result.success) return Alert.alert('Transferência não realizada', result.error);
      setData((current) => ({
        ...current,
        organizations: current.organizations.map((org) => org.id === selectedOrganization.id ? { ...org, ownerId: userId } : org),
        accessRequests: current.accessRequests.map((request) => request.organizationId === selectedOrganization.id && request.userId === activeUserId
          ? { ...request, status: 'APPROVED', organizationRole: 'MEMBER' } : request),
      }));
      await syncWithRemote();
      Alert.alert('Propriedade transferida', `${member.name} agora é o proprietário da organização.`);
    });
  }

  async function inviteOrganizationMember(email) {
    if (!selectedOrganization || selectedOrganization.ownerId !== activeUserId) return;
    const result = await organizationInvitation(selectedOrganization.id, { email: normalizeEmail(email) });
    if (!result.success) return Alert.alert('Convite não enviado', result.error);
    await syncWithRemote();
    Alert.alert('Convite enviado', 'O destinatário precisa aceitar o convite no aplicativo.');
  }
  async function respondOrganizationInvitation(request, decision) {
    const result = await organizationInvitation(request.organizationId, { decision }, request.id);
    if (!result.success) return Alert.alert('Resposta não confirmada', result.error);
    await syncWithRemote();
  }

  function updateOrganization(organizationId, changes) {
    const organization = data.organizations.find((item) => item.id === organizationId);
    if (!organization || organization.ownerId !== activeUserId) return;
    const name = changes.name.trim();
    const document = changes.document.trim();
    if (!name || !document) return Alert.alert('Dados obrigatórios', 'Informe o nome e o CNPJ da organização.');
    confirmAction('Confirmar alterações', `Salvar as informações da organização "${organization.name}"?`, async () => {
      const result = await updateOrganizationWithApi(organizationId, { name, document, ownerId: activeUserId });
      if (!result.success) return Alert.alert('Alteração não realizada', result.error);
      setData((current) => ({ ...current, organizations: current.organizations.map((item) => item.id === organizationId ? { ...item, ...result.organization } : item) }));
      Alert.alert('Organização atualizada', 'As informações foram salvas.');
    });
  }

  async function scheduleMeeting(meeting) {
    const result = await scheduleMeetingWithApi({ ...meeting, createdBy: activeUserId });
    if (!result.success) { Alert.alert('Reunião não agendada', result.error); return false; }
    setData((current) => ({ ...current, meetings: [...current.meetings.filter((item) => item.id !== result.meeting.id), result.meeting] }));
    await syncWithRemote();
    Alert.alert('Reunião agendada', 'Os participantes da comissão foram convidados.');
    return true;
  }

  async function respondToMeeting(meetingId, status) {
    const result = await respondToMeetingInvitationWithApi(meetingId, activeUserId, status);
    if (!result.success) { Alert.alert('Resposta não salva', result.error); return false; }
    setData((current) => ({ ...current, meetingInvitations: current.meetingInvitations.map((invite) => invite.id === result.invitation.id ? result.invitation : invite) }));
    return true;
  }

  async function recordAttendance(meetingId, action) {
    if (!(await confirmBiometric())) { Alert.alert('Presença não confirmada', 'Autorize a biometria do aparelho, use o código da reunião na aba Arquivos ou peça o registro ao presidente.'); return false; }
    const result = await recordMeetingAttendanceWithApi(meetingId, activeUserId, action);
    if (!result.success) { Alert.alert('Presença não registrada', result.error); return false; }
    setData((current) => ({
      ...current,
      meetingAttendance: current.meetingAttendance.some((item) => item.id === result.attendance.id)
        ? current.meetingAttendance.map((item) => item.id === result.attendance.id ? result.attendance : item)
        : [...current.meetingAttendance, result.attendance],
    }));
    return true;
  }

  function storeMeetingMinutes(minutes) {
    setData((current) => ({
      ...current,
      meetingMinutes: [...(current.meetingMinutes || []).filter((item) => item.meetingId !== minutes.meetingId), minutes],
    }));
  }

  async function generateMeetingAttendance(meetingId) {
    const result = await fetchMeetingAttendanceWithApi(meetingId, activeUserId);
    if (!result.success) { Alert.alert('Lista não gerada', result.error); return null; }
    return result.attendance;
  }

  async function saveMeetingMinutes(meetingId, content) {
    const result = await saveMeetingMinutesWithApi(meetingId, activeUserId, content);
    if (!result.success) { Alert.alert('Ata não salva', result.error); return false; }
    storeMeetingMinutes(result.minutes);
    return true;
  }

  async function submitMeetingMinutes(meetingId) {
    const result = await submitMeetingMinutesWithApi(meetingId, activeUserId);
    if (!result.success) { Alert.alert('Ata não enviada', result.error); return false; }
    storeMeetingMinutes(result.minutes);
    Alert.alert('Ata enviada', 'Todos os participantes com entrada registrada deverão aprovar esta versão.');
    return true;
  }

  async function approveMeetingMinutes(meetingId, decision, comment, version) {
    const result = await approveMeetingMinutesWithApi(meetingId, activeUserId, decision, comment, version);
    if (!result.success) { Alert.alert('Decisão não registrada', result.error); return false; }
    setData((current) => ({
      ...current,
      meetingMinutes: [...(current.meetingMinutes || []).filter((item) => item.meetingId !== meetingId), result.minutes],
      meetingMinutesApprovals: [...(current.meetingMinutesApprovals || []).filter((item) => item.id !== result.approval.id), result.approval],
    }));
    return true;
  }

  async function createMeetingVote(meetingId, question, options) {
    const result = await createMeetingVoteWithApi(meetingId, activeUserId, question, options);
    if (!result.success) { Alert.alert('Votação não aberta', result.error); return false; }
    await syncWithRemote();
    return true;
  }

  async function castMeetingVote(meetingId, voteId, optionId) {
    const result = await castMeetingVoteWithApi(meetingId, voteId, activeUserId, optionId);
    if (!result.success) { Alert.alert('Voto não confirmado', result.error); return false; }
    await syncWithRemote();
    return true;
  }

  async function closeMeetingVote(meetingId, voteId) {
    const result = await closeMeetingVoteWithApi(meetingId, voteId, activeUserId);
    if (!result.success) { Alert.alert('Votação não encerrada', result.error); return false; }
    await syncWithRemote();
    return true;
  }

  async function createCommission() {
    if (!isOrgAdmin || !selectedOrganization || selectedOrganization.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED') {
      return Alert.alert('Organização não disponível', 'Selecione uma organização aprovada que você administra antes de cadastrar uma comissão.');
    }
    const validationError = validateCommission(commissionForm);
    if (validationError) return Alert.alert('Dados obrigatórios', validationError);
    const name = commissionForm.name.trim();
    if (data.commissions.some((commission) => commission.organizationId === selectedOrganization.id && commission.name.toLowerCase() === name.toLowerCase())) {
      return Alert.alert('Nome já cadastrado', 'Já existe uma comissão ou grupo de trabalho com este nome nesta organização.');
    }

    const result = await createCommissionWithApi({ organizationId: selectedOrganization.id, name,
      type: commissionForm.type || 'Comissão', description: commissionForm.description.trim(), memberIds: [activeUserId] });
    if (!result.success) return Alert.alert('Comissão não criada', result.error);
    const commission = result.commission;
    await syncWithRemote();
    setSelectedCommissionId(commission.id);
    setCommissionForm({ name: '', type: 'Comissão', description: '' });
    Alert.alert('Comissão cadastrada', 'A comissão/grupo de trabalho foi criada com sucesso e você foi incluído como coordenador(a).');
  }

  function startEditCommission(commission) {
    setEditingCommissionId(commission.id);
    setEditCommissionForm({
      name: commission.name,
      type: commission.type || 'Comissão',
      description: commission.description || '',
      status: commission.status || 'ACTIVE',
    });
    setSelectedCommissionId(commission.id);
  }

  function cancelEditCommission() {
    setEditingCommissionId(null);
  }

  async function saveEditCommission() {
    const error = validateCommission(editCommissionForm);
    if (error) return Alert.alert('Dados inválidos', error);
    const result = await commissionRequest(editingCommissionId, 'PATCH', editCommissionForm);
    if (!result.success) return Alert.alert('Comissão não alterada', result.error);
    setEditingCommissionId(null); await syncWithRemote();
  }
  async function toggleCommissionStatus(commissionId) {
    const commission = data.commissions.find(c => c.id === commissionId);
    const result = await commissionRequest(commissionId, 'PATCH', { ...commission, status: commission.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    if (!result.success) return Alert.alert('Comissão não alterada', result.error);
    await syncWithRemote();
  }
  function deleteCommission(commissionId) {
    confirmAction('Excluir comissão', 'A exclusão será feita no servidor. Comissões com reuniões históricas precisam ser preservadas.', async () => {
      const result = await commissionRequest(commissionId, 'DELETE');
      if (!result.success) return Alert.alert('Comissão não removida', result.error);
      await syncWithRemote();
    }, true);
  }

  async function changeCommissionMember(userId, operation, role) {
    const commissionId = selectedCommission.id;
    const operationId = `${commissionId}:${userId}`;
    if (commissionMemberOperationsRef.current.has(operationId)) return;
    commissionMemberOperationsRef.current.add(operationId);
    try {
      const result = operation === 'ADD'
        ? await addCommissionMemberWithApi(commissionId, activeUserId, userId, role)
        : operation === 'REMOVE'
          ? await removeCommissionMemberWithApi(commissionId, activeUserId, userId)
          : await updateCommissionMemberRoleWithApi(commissionId, activeUserId, userId, role);
      if (!result.success) return Alert.alert('Equipe não alterada', result.error);
      setData((current) => ({
        ...current,
        commissionMembers: [
          ...current.commissionMembers.filter((member) => !(member.commissionId === commissionId && member.userId === userId)),
          ...(operation === 'REMOVE' ? [] : [result.member]),
        ],
      }));
      await syncWithRemote();
    } finally {
      commissionMemberOperationsRef.current.delete(operationId);
    }
  }

  function addCommissionMember(userId, role = 'MEMBER') {
    if (!selectedCommission || selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED') return;
    if (data.commissionMembers.some((member) => member.commissionId === selectedCommission.id && member.userId === userId)) return;
    return changeCommissionMember(userId, 'ADD', role);
  }

  function removeCommissionMember(userId) {
    if (selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED' || !selectedCommission) return;
    return changeCommissionMember(userId, 'REMOVE');
  }

  function toggleCommissionMemberRole(userId) {
    if (selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED' || !selectedCommission) return;
    const member = data.commissionMembers.find((item) => item.commissionId === selectedCommissionId && item.userId === userId);
    if (!member) return;
    const nextRole = (member.role || 'MEMBER') === 'COORDINATOR' ? 'MEMBER' : 'COORDINATOR';
    return changeCommissionMember(userId, 'ROLE', nextRole);
  }

  function openProfile() {
    setProfileForm({ name: activeUser?.name || '', email: activeUser?.email || '', phone: activeUser?.phone || '' });
    setScreen('profile');
  }

  async function updateProfile() {
    const error = validateUser(profileForm);
    if (error) return Alert.alert('Dados inválidos', error);
    if (normalizeEmail(profileForm.email) !== normalizeEmail(activeUser.email)) {
      return Alert.alert('E-mail de acesso', 'A alteração do e-mail requer um fluxo de verificação e não está disponível neste formulário.');
    }
    if (!(await confirmBiometric())) return Alert.alert('Confirmação necessária', 'Cadastre biometria no aparelho e autorize para alterar o perfil.');
    const result = await updateUserWithApi(activeUserId, { name: profileForm.name.trim(), phone: formatPhone(profileForm.phone) });
    if (!result.success) return Alert.alert('Alteração não realizada', 'Não foi possível confirmar a alteração no servidor.');
    await syncWithRemote();
    Alert.alert('Dados atualizados', 'As alterações foram confirmadas no servidor.');
  }
  async function updatePassword() {
    const error = validatePassword(passwordForm);
    if (error) return Alert.alert('Senha inválida', error);
    const result = await changePasswordWithApi(activeUserId, passwordForm.current, passwordForm.next);
    if (!result.success) return Alert.alert('Senha não alterada', result.error);
    await logout();
    Alert.alert('Senha alterada', 'Entre novamente com sua nova senha. As sessões anteriores foram encerradas.');
  }

  async function recoverAccountFromLogin(rawEmail) {
    const email = (rawEmail || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('E-mail obrigatório', 'Informe o seu e-mail cadastrado.');
      return false;
    }

    try {
      const apiRes = await requestPasswordResetWithApi(email);
      if (apiRes && apiRes.success) {
        const alertMsg = `Se houver uma conta vinculada a ${email}, enviaremos um código de 6 dígitos. Verifique sua caixa de entrada e spam. O código vale por 15 minutos.`;
        Alert.alert('Código enviado!', alertMsg);
        return true;
      } else {
        Alert.alert('Não foi possível enviar o e-mail', apiRes?.error || 'Confira a configuração de envio de e-mail no servidor e tente novamente.');
        return false;
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível solicitar o código de recuperação.');
      return false;
    }
  }

  async function resetPasswordFromLogin(rawEmail, code, newPassword, confirmPassword) {
    const email = (rawEmail || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();
    const next = (newPassword || '').trim();
    const confirm = (confirmPassword || '').trim();

    if (!cleanCode) {
      Alert.alert('Código obrigatório', 'Código de verificação ausente. Valide seus dados novamente.');
      return false;
    }
    if (next.length < 8 || next !== confirm) {
      Alert.alert('Senha inválida', 'A nova senha deve ter no mínimo 8 caracteres e coincidir com a confirmação.');
      return false;
    }

    try {
      const apiRes = await resetPasswordWithApi({ email, code: cleanCode, newPassword: next });
      if (apiRes && apiRes.success) {
        setData((current) => ({
          ...current,
          users: current.users.map((u) => normalizeEmail(u.email) === email ? { ...u, passwordUpdatedAt: new Date().toISOString() } : u),
        }));
        Alert.alert('Senha redefinida com sucesso!', 'Sua nova senha foi gravada no banco PostgreSQL. Faça login para continuar.');
        return true;
      } else {
        Alert.alert('Falha na redefinição', apiRes?.error || 'Código incorreto ou expirado.');
        return false;
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível redefinir a senha.');
      return false;
    }
  }

  async function setTheme(theme) {
    const result = await updateUserWithApi(activeUserId, { theme });
    if (!result.success) return Alert.alert('Tema não salvo', 'Não foi possível confirmar a preferência no servidor.');
    await syncWithRemote();
  }

  async function restartSubsystem() {
    try {
      const info = await fetchSystemInfo();
      Alert.alert('Verificação concluída', `API em operação há ${Math.floor(info.uptime)} segundos. Banco: ${info.database.status}. Para reiniciar processos, use o Docker Desktop.`);
      await syncWithRemote();
    } catch (error) { Alert.alert('Servidor indisponível', error.message); }
  }
  async function initializeSystem() { await restartSubsystem(); }
  function resetDemo() {
    Alert.alert('Limpar cache e sair', 'Remove os dados locais e encerra sua sessão. Os registros do servidor serão preservados.', [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Limpar e sair', style: 'destructive', onPress: logout },
    ]);
  }

  const userRequests = data.accessRequests.filter((request) => request.userId === activeUserId);
  const requestableOrganizations = approvedOrganizations.filter((organization) => organization.ownerId !== activeUserId);
  const organizationPendingRequests = data.accessRequests.filter((request) => request.organizationId === selectedOrganizationId && request.status === 'PENDING');
  const organizationApprovedRequests = data.accessRequests.filter((request) => request.organizationId === selectedOrganizationId && request.status === 'APPROVED');
  const searchableOrganizations = approvedOrganizations.filter((organization) => organization.name.toLowerCase().includes(organizationSearch.trim().toLowerCase()) || organization.document.includes(organizationSearch.trim()));

  if (!isReady || showSplash) {
    return <SafeAreaView style={styles.loading}><Image source={require('./assets/synple-splash.png')} style={styles.splashLogo} resizeMode="contain" /><Text style={styles.loadingText}>Synple</Text><Text style={styles.loadingCaption}>Organize. Conecte. Simplifique.</Text></SafeAreaView>;
  }

  if (!isAuthenticated) {
    return (
      <ThemeContext.Provider value={{ isDark, styles }}>
        <LoginScreen
          onLogin={login}
          onGoogleLogin={loginWithGoogle}
          onRegister={registerUser}
          onRecoverAccount={recoverAccountFromLogin}
          onResetPassword={resetPasswordFromLogin}
        />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, styles }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppHeader userName={activeUser?.name} />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <View style={styles.sessionRow}>
            <Text style={styles.sectionTitle}>
              Acesso: {isSystemAdmin ? 'Administrador do sistema' : isOrgAdmin ? 'Administrador da organização' : 'Usuário'}
            </Text>
            <Pressable onPress={logout}>
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
          </View>

          <NavigationTabs
            screen={screen}
            setScreen={setScreen}
            isSystemAdmin={isSystemAdmin}
            isOrgAdmin={isOrgAdmin}
            hasMeetingsAccess={hasMeetingsAccess}
            onOpenMeetings={() => setScreen('meetings')}
            onOpenReport={() => setScreen('meeting-report')}
            onOpenManual={() => setScreen('manual')}
            onOpenProfile={openProfile}
          />

          {screen === 'organizations' && (
            <OrganizationsScreen
              searchableOrganizations={searchableOrganizations}
              organizationSearch={organizationSearch}
              setOrganizationSearch={setOrganizationSearch}
              activeUserId={activeUserId}
              organizationStatusPending={organizationStatusPending}
              accessRequests={data.accessRequests}
              onRequestAccess={requestAccess}
              onRespondInvitation={respondOrganizationInvitation}
            />
          )}

          {isSystemAdmin && screen === 'admin-management' && (
            <AdminManagementScreen
              organizations={data.organizations}
              users={data.users}
              activeUserId={activeUserId}
              onChangeOrganizationStatus={changeOrganizationStatus}
              onRemoveOrganization={removeOrganization}
              onRemoveUser={removeUser}
            />
          )}

          {!isSystemAdmin && screen === 'management' && (
            <MyOrganizationScreen
              isSystemAdmin={isSystemAdmin}
              isOrgAdmin={isOrgAdmin}
              activeUserId={activeUserId}
              activeUser={activeUser}
              organizationForm={organizationForm}
              setOrganizationForm={setOrganizationForm}
              onCreateOrganization={createOrganization}
              isCreatingOrganization={isCreatingOrganization}
              requestableOrganizations={requestableOrganizations}
              selectedOrganizationId={selectedOrganizationId}
              setSelectedOrganizationId={setSelectedOrganizationId}
              data={data}
              onRequestAccess={requestAccess}
              approvedOwnedOrganizations={approvedOwnedOrganizations}
              organizationCommissions={organizationCommissions}
              onNavigateToCommissions={() => {
                const organization = approvedOwnedOrganizations.find((item) => item.id === selectedOrganizationId) || approvedOwnedOrganizations[0];
                if (!organization) return Alert.alert('Organização não disponível', 'A organização precisa estar aprovada para gerenciar comissões.');
                setSelectedOrganizationId(organization.id);
                setScreen('commissions');
              }}
              organizationPendingRequests={organizationPendingRequests}
              onChangeAccessStatus={changeAccessStatus}
              selectedOrganization={selectedOrganization}
              organizationApprovedRequests={organizationApprovedRequests}
              onUpdateOrganizationRole={updateOrganizationRole}
              onRemoveOrganizationMember={removeOrganizationMember}
              onTransferOrganizationOwnership={transferOrganizationOwnership}
              onInviteOrganizationMember={inviteOrganizationMember}
              onUpdateOrganization={updateOrganization}
              userRequests={userRequests}
            />
          )}

          {isOrgAdmin && screen === 'commissions' && (
            <CommissionsScreen
              approvedOwnedOrganizations={approvedOwnedOrganizations}
              selectedOrganizationId={selectedOrganizationId}
              setSelectedOrganizationId={setSelectedOrganizationId}
              selectedOrganization={selectedOrganization}
              commissionForm={commissionForm}
              setCommissionForm={setCommissionForm}
              onCreateCommission={createCommission}
              editingCommissionId={editingCommissionId}
              setEditingCommissionId={setEditingCommissionId}
              editCommissionForm={editCommissionForm}
              setEditCommissionForm={setEditCommissionForm}
              onSaveEditCommission={saveEditCommission}
              onCancelEditCommission={cancelEditCommission}
              organizationCommissions={organizationCommissions}
              selectedCommissionId={selectedCommissionId}
              setSelectedCommissionId={setSelectedCommissionId}
              onStartEditCommission={startEditCommission}
              onToggleCommissionStatus={toggleCommissionStatus}
              onDeleteCommission={deleteCommission}
              selectedCommission={selectedCommission}
              commissionTeam={commissionTeam}
              onToggleCommissionMemberRole={toggleCommissionMemberRole}
              onRemoveCommissionMember={removeCommissionMember}
              availableOrgMembers={availableOrgMembers}
              onAddCommissionMember={addCommissionMember}
              data={data}
            />
          )}

          {hasMeetingsAccess && screen === 'meetings' && (
            <MeetingsScreen
              data={data}
              activeUser={activeUser}
              meetings={data.meetings || []}
              onSchedule={scheduleMeeting}
              onRespond={respondToMeeting}
              onAttendance={recordAttendance}
              onGenerateAttendance={generateMeetingAttendance}
              onSaveMinutes={saveMeetingMinutes}
              onSubmitMinutes={submitMeetingMinutes}
              onApproveMinutes={approveMeetingMinutes}
              onCreateVote={createMeetingVote}
              onCastVote={castMeetingVote}
              onCloseVote={closeMeetingVote}
              onRefresh={refreshData}
              isRefreshing={isRefreshing}
            />
          )}

          {hasMeetingsAccess && screen === 'meeting-report' && <MeetingParticipationScreen />}
          {screen === 'manual' && <ManualScreen />}

          {screen === 'profile' && (
            <ProfileScreen
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              onUpdateProfile={updateProfile}
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              onUpdatePassword={updatePassword}
              activeUser={activeUser}
              onSetTheme={setTheme}
            />
          )}

          {isSystemAdmin && screen === 'system' && (
            <SystemScreen
              system={data.system}
              usersCount={data.users.length}
              organizationsCount={data.organizations.length}
              commissionsCount={data.commissions.length}
              pendingRequestsCount={data.accessRequests.filter((request) => request.status === 'PENDING').length}
              onRestartSubsystem={restartSubsystem}
              onInitializeSystem={initializeSystem}
              onResetDemo={resetDemo}
            />
          )}

          {isSystemAdmin && (
            <Pressable style={styles.resetButton} onPress={resetDemo}>
              <Text style={styles.resetText}>Limpar cache e sair</Text>
            </Pressable>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

