import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { INITIAL_DATA } from './src/constants/data';
import { useSynpleData } from './src/hooks/useSynpleData';
import { saveData } from './src/services/storage';
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

const createId = (prefix) => `${prefix}-${Date.now()}`;

const DEMO_LOGIN_ALIASES = {
  'admin@synple.com': 'user-system-admin',
  'admin@synple.app': 'user-system-admin',
  'marina@synple.com': 'user-admin',
  'marina@synple.app': 'user-admin',
  'joao@synple.com': 'user-visitante',
  'joao@email.com': 'user-visitante',
};

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
  const isDark = activeUser?.theme === 'DARK';
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

  function login({ email, password, mode }) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();

    const validationError = validateLogin({ email: trimmedEmail, password: trimmedPassword });
    if (validationError) return Alert.alert('Dados inválidos', validationError);

    const demoUserId = DEMO_LOGIN_ALIASES[trimmedEmail];
    const user = data.users.find((item) => normalizeEmail(item.email) === trimmedEmail)
      || (demoUserId ? data.users.find((item) => item.id === demoUserId) : undefined);
    if (!user) return Alert.alert('Conta não encontrada', 'Cadastre um usuário antes de entrar.');

    const isMarina = user.email === 'marina@synple.app' || user.id === 'user-admin';
    const isAdmin = user.systemRole === 'SYSTEM_ADMIN' || user.email === 'admin@synple.app';
    const isJoao = user.email === 'joao@email.com' || user.id === 'user-visitante';

    const validPasswords = [];
    if (user.password) validPasswords.push(user.password.trim());
    if (isMarina) validPasswords.push('Marina@123', 'marina123', 'marina', 'admin123', 'admin', '123456', 'senha123');
    if (isAdmin) validPasswords.push('Admin@123', 'admin123', 'admin', '123456');
    if (isJoao) validPasswords.push('Joao@123', 'joao123', 'joao', 'admin123', 'admin', '123456');

    if (!validPasswords.includes(trimmedPassword)) {
      return Alert.alert('Senha incorreta', 'A senha informada não confere.');
    }

    const actualRole = user.systemRole === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER';

    setActiveUserId(user.id);
    const firstOwnedOrganization = data.organizations.find((organization) => organization.ownerId === user.id && organization.status === 'APPROVED');
    const firstRequestableOrganization = data.organizations.find((organization) => organization.status === 'APPROVED' && organization.ownerId !== user.id);
    if (actualRole === 'USER' && firstOwnedOrganization) setSelectedOrganizationId(firstOwnedOrganization.id);
    else if (actualRole === 'USER' && firstRequestableOrganization) setSelectedOrganizationId(firstRequestableOrganization.id);
    setRole(actualRole);
    setScreen(actualRole === 'SYSTEM_ADMIN' ? 'admin-management' : 'organizations');
    setIsAuthenticated(true);
  }

  async function loginWithGoogle(idToken) {
    const result = await loginWithGoogleApi(idToken);
    if (!result.success || !result.user) {
      Alert.alert('Login com Google', result.error || 'Não foi possível entrar com Google.');
      return false;
    }

    const user = result.user;
    setData((current) => ({
      ...current,
      users: current.users.some((item) => normalizeEmail(item.email) === normalizeEmail(user.email))
        ? current.users.map((item) => normalizeEmail(item.email) === normalizeEmail(user.email) ? { ...item, ...user, pendingSync: false } : item)
        : [...current.users, { ...user, pendingSync: false }],
    }));
    setActiveUserId(user.id);
    setRole(user.systemRole === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER');
    setScreen(user.systemRole === 'SYSTEM_ADMIN' ? 'admin-management' : 'organizations');
    setIsAuthenticated(true);
    return true;
  }

  async function registerUser({ name, email, phone, password, confirmPassword }) {
    const validationError = validateRegistration({ name, email, phone, password, confirmPassword });
    if (validationError) return Alert.alert('Dados inválidos', validationError);
    const normalizedEmail = normalizeEmail(email);
    if (data.users.some((user) => user.email === normalizedEmail)) return Alert.alert('E-mail já cadastrado', 'Use outro e-mail ou entre com a conta existente.');

    let newUserId = createId('user');
    const user = {
      id: newUserId,
      name: name.trim(),
      email: normalizedEmail,
      phone: formatPhone(phone),
      password: password,
      theme: 'LIGHT',
      systemRole: 'USER',
      pendingSync: true,
    };

    // Salva no banco PostgreSQL diretamente se o backend estiver rodando
    try {
      const apiRes = await registerWithApi({ name: user.name, email: normalizedEmail, phone: user.phone, password });
      if (apiRes && apiRes.success && apiRes.user?.id) {
        user.id = apiRes.user.id;
        user.pendingSync = false;
        newUserId = apiRes.user.id;
        console.log('✅ Usuário salvo com sucesso no PostgreSQL:', apiRes.user.email);
      } else {
        const errorMsg = apiRes?.error || 'Servidor indisponível';
        console.warn('⚠️ Não foi possível salvar no PostgreSQL:', errorMsg);
        Alert.alert(
          'Aviso de Conexão',
          `Não foi possível salvar diretamente no PostgreSQL (${errorMsg}). O usuário foi salvo temporariamente no celular e será sincronizado quando o servidor conectar.`
        );
      }
    } catch (err) {
      console.warn('Registro mantido localmente:', err);
    }

    setData((current) => {
      const updated = { ...current, users: [...current.users, user] };
      saveData(updated).catch(() => {});
      return updated;
    });
    setActiveUserId(newUserId);
    const firstOrg = data.organizations.find((o) => o.status === 'APPROVED');
    if (firstOrg) setSelectedOrganizationId(firstOrg.id);
    setRole('USER');
    setScreen('organizations');
    setIsAuthenticated(true);
  }

  function logout() {
    setPasswordForm({ current: '', next: '', confirm: '' });
    setIsAuthenticated(false);
  }

  function changeOrganizationStatus(organizationId, status) {
    if (!isSystemAdmin) return;
    const organization = data.organizations.find((item) => item.id === organizationId);
    if (!organization) return;
    confirmAction('Confirmar alteração', `Alterar a situação de "${organization.name}" para ${status === 'APPROVED' ? 'aprovada' : status === 'REJECTED' ? 'rejeitada' : 'pendente'}?`, () => {
    updateOrganizationStatusWithApi(organizationId, status).catch(() => {});
    setData((current) => ({
      ...current,
      organizations: current.organizations.map((organization) => (
        organization.id === organizationId ? { ...organization, status } : organization
      )),
    }));
    });
  }

  function removeOrganization(organizationId) {
    if (!isSystemAdmin) return;
    Alert.alert('Remover organização', 'A organização, suas comissões e seus acessos serão removidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => {
        deleteOrganizationWithApi(organizationId).catch(() => {});
        setData((current) => {
          const commissionIds = current.commissions.filter((commission) => commission.organizationId === organizationId).map((commission) => commission.id);
          const updated = {
            ...current,
            organizations: current.organizations.filter((organization) => organization.id !== organizationId),
            accessRequests: current.accessRequests.filter((request) => request.organizationId !== organizationId),
            commissions: current.commissions.filter((commission) => commission.organizationId !== organizationId),
            commissionMembers: current.commissionMembers.filter((member) => !commissionIds.includes(member.commissionId)),
          };
          saveData(updated).catch(() => {});
          return updated;
        });
      } },
    ]);
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

  function requestAccess(organizationId) {
    const orgId = typeof organizationId === 'string' ? organizationId : selectedOrganizationId;
    const organization = data.organizations.find((item) => item.id === orgId);
    if (!organization || organization.status !== 'APPROVED') {
      return Alert.alert('Organização indisponível', 'Selecione uma organização válida e aprovada.');
    }
    if (organization.ownerId === activeUserId) {
      return Alert.alert('Você já é o administrador', 'O administrador da organização não precisa solicitar acesso a ela.');
    }
    const existingRequest = data.accessRequests.find((request) => (
      request.organizationId === organization.id && request.userId === activeUserId && ['PENDING', 'APPROVED'].includes(request.status)
    ));
    if (existingRequest) {
      const msg = existingRequest.status === 'APPROVED'
        ? `Você já é um membro aprovado da organização "${organization.name}".`
        : `Você já possui uma solicitação de acesso pendente para a organização "${organization.name}".`;
      return Alert.alert('Solicitação existente', msg);
    }
    confirmAction('Confirmar solicitação', `Enviar pedido para participar de "${organization.name}"?`, () => {
    setData((current) => ({
      ...current,
      accessRequests: [...current.accessRequests, {
        id: createId('access'), organizationId: organization.id, userId: activeUserId, status: 'PENDING', organizationRole: 'MEMBER',
      }],
    }));
    requestAccessWithApi(organization.id, activeUserId).catch(() => {});
    Alert.alert('Solicitação enviada', `Sua solicitação de entrada na organização "${organization.name}" foi enviada com sucesso e aguarda aprovação.`);
    });
  }

  function changeAccessStatus(requestId, status) {
    const request = data.accessRequests.find((item) => item.id === requestId);
    const organization = data.organizations.find((item) => item.id === request?.organizationId);
    if (!isOrgAdmin || organization?.ownerId !== activeUserId || organization.status !== 'APPROVED') return;
    updateAccessRequestStatusWithApi(requestId, status, status === 'APPROVED' ? (request.organizationRole || 'MEMBER') : request.organizationRole).catch(() => {});
    setData((current) => ({
      ...current,
      accessRequests: current.accessRequests.map((request) => (
        request.id === requestId ? { ...request, status, organizationRole: status === 'APPROVED' ? (request.organizationRole || 'MEMBER') : request.organizationRole } : request
      )),
    }));
  }

  function updateOrganizationRole(requestId, organizationRole) {
    const request = data.accessRequests.find((item) => item.id === requestId);
    const organization = data.organizations.find((item) => item.id === request?.organizationId);
    if (!isOrgAdmin || organization?.ownerId !== activeUserId || organization.status !== 'APPROVED' || request.status !== 'APPROVED') return;
    const member = data.users.find((user) => user.id === request.userId);
    confirmAction('Confirmar alteração de cargo', `Alterar o cargo de ${member?.name || 'participante'} para ${organizationRole === 'COORDINATOR' ? 'coordenador' : 'membro'}?`, () => setData((current) => ({
      ...current,
      accessRequests: current.accessRequests.map((item) => (item.id === requestId ? { ...item, organizationRole } : item)),
    })));
  }

  function removeOrganizationMember(requestId) {
    const request = data.accessRequests.find((item) => item.id === requestId);
    const organization = data.organizations.find((item) => item.id === request?.organizationId);
    if (!isOrgAdmin || organization?.ownerId !== activeUserId || organization.status !== 'APPROVED' || request.status !== 'APPROVED') return;
    Alert.alert('Remover membro', 'A pessoa perderá acesso à organização e às comissões vinculadas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setData((current) => ({
        ...current,
        accessRequests: current.accessRequests.map((item) => (item.id === requestId ? { ...item, status: 'REVOKED' } : item)),
        commissionMembers: current.commissionMembers.filter((member) => member.userId !== request.userId || !current.commissions.some((commission) => commission.id === member.commissionId && commission.organizationId === request.organizationId)),
      })) },
    ]);
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
      Alert.alert('Propriedade transferida', `${member.name} agora é o proprietário da organização.`);
    });
  }

  function inviteOrganizationMember(email) {
    const invitedUser = data.users.find((user) => normalizeEmail(user.email) === normalizeEmail(email));
    if (!selectedOrganization || selectedOrganization.ownerId !== activeUserId) return;
    if (!invitedUser) return Alert.alert('Usuário não encontrado', 'O convite precisa usar o e-mail de uma conta já cadastrada.');
    if (invitedUser.id === activeUserId) return Alert.alert('Convite inválido', 'Você já é o proprietário da organização.');
    const existing = data.accessRequests.find((request) => request.organizationId === selectedOrganization.id && request.userId === invitedUser.id && ['PENDING', 'APPROVED'].includes(request.status));
    if (existing) return Alert.alert('Participação existente', existing.status === 'APPROVED' ? 'Esse usuário já participa da organização.' : 'Esse usuário já tem um pedido pendente.');
    confirmAction('Confirmar convite', `Convidar ${invitedUser.name} (${invitedUser.email}) para "${selectedOrganization.name}"?`, () => {
      requestAccessWithApi(selectedOrganization.id, invitedUser.id).catch(() => {});
      setData((current) => ({ ...current, accessRequests: [...current.accessRequests, {
        id: createId('invite'), organizationId: selectedOrganization.id, userId: invitedUser.id, status: 'PENDING', organizationRole: 'MEMBER', invitedBy: activeUserId,
      }] }));
      Alert.alert('Convite enviado', 'O usuário aparecerá nas solicitações pendentes para aprovação.');
    });
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

  async function createCommission() {
    if (!isOrgAdmin || selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED') return;
    const validationError = validateCommission(commissionForm);
    if (validationError) return Alert.alert('Dados obrigatórios', validationError);
    const name = commissionForm.name.trim();
    if (data.commissions.some((commission) => commission.organizationId === selectedOrganizationId && commission.name.toLowerCase() === name.toLowerCase())) {
      return Alert.alert('Nome já cadastrado', 'Já existe uma comissão ou grupo de trabalho com este nome nesta organização.');
    }

    let commissionId = createId('commission');
    let pendingSync = true;

    try {
      const apiRes = await createCommissionWithApi({
        organizationId: selectedOrganizationId,
        name,
        type: commissionForm.type || 'Comissão',
        description: commissionForm.description.trim(),
        memberIds: [activeUserId],
      });
      if (apiRes && apiRes.success && apiRes.commission?.id) {
        commissionId = apiRes.commission.id;
        pendingSync = false;
      }
    } catch (err) {
      console.warn('Comissão salva localmente para sincronização:', err);
    }

    const commission = {
      id: commissionId,
      organizationId: selectedOrganizationId,
      name,
      type: commissionForm.type || 'Comissão',
      description: commissionForm.description.trim(),
      status: 'ACTIVE',
      pendingSync,
    };
    setData((current) => ({
      ...current,
      commissions: [...current.commissions, commission],
      commissionMembers: [...current.commissionMembers, { commissionId: commission.id, userId: activeUserId, role: 'COORDINATOR' }],
    }));
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

  function saveEditCommission() {
    if (!editingCommissionId || selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED') return;
    const validationError = validateCommission(editCommissionForm);
    if (validationError) return Alert.alert('Dados obrigatórios', validationError);
    const name = editCommissionForm.name.trim();
    if (data.commissions.some((c) => c.organizationId === selectedOrganizationId && c.id !== editingCommissionId && c.name.toLowerCase() === name.toLowerCase())) {
      return Alert.alert('Nome já cadastrado', 'Já existe outra comissão ou grupo de trabalho com este nome nesta organização.');
    }
    setData((current) => ({
      ...current,
      commissions: current.commissions.map((c) => (
        c.id === editingCommissionId
          ? { ...c, name, type: editCommissionForm.type, description: editCommissionForm.description.trim(), status: editCommissionForm.status }
          : c
      )),
    }));
    setEditingCommissionId(null);
    Alert.alert('Comissão atualizada', 'As alterações da comissão foram salvas.');
  }

  function toggleCommissionStatus(commissionId) {
    const commission = data.commissions.find((item) => item.id === commissionId);
    if (!commission || selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED') return;
    const nextStatus = commission.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    setData((current) => ({
      ...current,
      commissions: current.commissions.map((item) => (item.id === commissionId ? { ...item, status: nextStatus } : item)),
    }));
  }

  function deleteCommission(commissionId) {
    const commission = data.commissions.find((item) => item.id === commissionId);
    if (!commission || selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED') return;
    Alert.alert('Excluir comissão', `Deseja realmente excluir "${commission.name}"? A equipe vinculada também será removida.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        setData((current) => ({
          ...current,
          commissions: current.commissions.filter((item) => item.id !== commissionId),
          commissionMembers: current.commissionMembers.filter((member) => member.commissionId !== commissionId),
        }));
        if (selectedCommissionId === commissionId) setSelectedCommissionId('');
        if (editingCommissionId === commissionId) setEditingCommissionId(null);
      } },
    ]);
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

  function updateProfile() {
    const validationError = validateUser(profileForm);
    if (validationError) return Alert.alert('Dados inválidos', validationError);
    if (profileForm.phone) {
      const phoneError = validatePhone(profileForm.phone);
      if (phoneError) return Alert.alert('Telefone inválido', phoneError);
    }
    const name = profileForm.name.trim();
    const email = normalizeEmail(profileForm.email);
    if (data.users.some((user) => user.id !== activeUserId && user.email === email)) return Alert.alert('E-mail já utilizado', 'Escolha outro e-mail.');

    confirmAction('Confirmar alterações', 'Salvar as alterações dos seus dados pessoais?', () => {
    updateUserWithApi(activeUserId, { name, email, phone: formatPhone(profileForm.phone) }).catch(() => {});

    setData((current) => ({
      ...current,
      users: current.users.map((user) => (
        user.id === activeUserId
          ? { ...user, name, email, phone: formatPhone(profileForm.phone) }
          : user
      )),
    }));
    Alert.alert('Dados atualizados', 'Suas informações pessoais foram alteradas.');
    });
  }

  function updatePassword() {
    const validationError = validatePassword(passwordForm);
    if (validationError) return Alert.alert('Senha inválida', validationError);
    const currentInput = (passwordForm.current || '').trim();
    const validCurrents = [activeUser?.password?.trim()].filter(Boolean);
    if (activeUser?.email?.includes('marina')) validCurrents.push('Marina@123', 'marina123', 'marina', 'admin', 'admin123');
    if (activeUser?.systemRole === 'SYSTEM_ADMIN' || activeUser?.email?.includes('admin')) validCurrents.push('Admin@123', 'admin123', 'admin');
    if (activeUser?.email?.includes('joao')) validCurrents.push('Joao@123', 'joao123', 'joao', 'admin');
    if (!validCurrents.includes(currentInput)) {
      return Alert.alert('Senha atual incorreta', 'A senha atual informada não confere.');
    }

    confirmAction('Confirmar troca de senha', 'Deseja atualizar sua senha agora?', () => {
    changePasswordWithApi(activeUserId, currentInput, passwordForm.next).catch(() => {});

    setData((current) => ({
      ...current,
      users: current.users.map((user) => (
        user.id === activeUserId
          ? { ...user, password: passwordForm.next, passwordUpdatedAt: new Date().toISOString() }
          : user
      )),
    }));
    setPasswordForm({ current: '', next: '', confirm: '' });
    Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.');
    });
  }

  async function recoverAccountFromLogin(rawEmail) {
    const email = (rawEmail || '').trim().toLowerCase();
    if (!email) {
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
    if (next.length < 6 || next !== confirm) {
      Alert.alert('Senha inválida', 'A nova senha deve ter no mínimo 6 caracteres e coincidir com a confirmação.');
      return false;
    }

    try {
      const apiRes = await resetPasswordWithApi({ email, code: cleanCode, newPassword: next });
      if (apiRes && apiRes.success) {
        setData((current) => ({
          ...current,
          users: current.users.map((u) => normalizeEmail(u.email) === email ? { ...u, password: next, passwordUpdatedAt: new Date().toISOString() } : u),
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

  function setTheme(theme) {
    if (activeUser?.theme === theme) return;
    confirmAction('Confirmar tema', `Alterar o tema do perfil para ${theme === 'DARK' ? 'escuro' : 'claro'}?`, () => {
    updateUserWithApi(activeUserId, { theme }).catch(() => {});
    setData((current) => ({ ...current, users: current.users.map((user) => user.id === activeUserId ? { ...user, theme } : user) }));
    });
  }

  function restartSubsystem(subsystemId) {
    if (!isSystemAdmin) return;
    setData((current) => ({ ...current, system: { ...current.system, subsystems: current.system.subsystems.map((subsystem) => subsystem.id === subsystemId ? { ...subsystem, status: 'RESTARTING' } : subsystem) } }));
    setTimeout(() => setData((current) => ({ ...current, system: { ...current.system, subsystems: current.system.subsystems.map((subsystem) => subsystem.id === subsystemId ? { ...subsystem, status: 'ONLINE' } : subsystem) } })), 900);
  }

  function initializeSystem() {
    if (!isSystemAdmin) return;
    setData((current) => ({ ...current, system: { ...current.system, initialized: true, initializedAt: new Date().toISOString() } }));
    Alert.alert('Sistema inicializado', 'Os subsistemas estão prontos para operação.');
  }

  function resetDemo() {
    if (!isSystemAdmin) return;
    Alert.alert('Restaurar demonstração', 'Os dados cadastrados neste dispositivo serão removidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restaurar', style: 'destructive', onPress: () => setData(INITIAL_DATA) },
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
      <ThemeContext.Provider value={{ isDark: false, styles: getThemeStyles(false) }}>
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
            onOpenProfile={openProfile}
          />

          {screen === 'organizations' && (
            <OrganizationsScreen
              searchableOrganizations={searchableOrganizations}
              organizationSearch={organizationSearch}
              setOrganizationSearch={setOrganizationSearch}
              activeUserId={activeUserId}
              accessRequests={data.accessRequests}
              onRequestAccess={requestAccess}
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
              onNavigateToCommissions={() => setScreen('commissions')}
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
              onRefresh={refreshData}
              isRefreshing={isRefreshing}
            />
          )}

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
              <Text style={styles.resetText}>Restaurar dados de demonstração</Text>
            </Pressable>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

