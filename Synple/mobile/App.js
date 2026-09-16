import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { INITIAL_DATA } from './src/constants/data';
import { useSynpleData } from './src/hooks/useSynpleData';
import { formatCNPJ, formatPhone } from './src/services/formatters';
import { normalizeEmail, validateCommission, validateLogin, validateOrganization, validatePassword, validatePhone, validateRegistration, validateUser } from './src/services/validation';
import {
  deleteOrganizationWithApi,
  deleteUserWithApi,
  registerWithApi,
  requestAccessWithApi,
  updateAccessRequestStatusWithApi,
  updateOrganizationStatusWithApi,
  updateUserWithApi,
} from './src/services/api';
import { getThemeStyles, ThemeContext } from './src/styles/theme';

// Componentes modulares
import { AppHeader } from './src/components/AppHeader';
import { NavigationTabs } from './src/components/NavigationTabs';

// Telas modulares
import { LoginScreen } from './src/screens/LoginScreen';
import { OrganizationsScreen } from './src/screens/OrganizationsScreen';
import { MyOrganizationScreen } from './src/screens/MyOrganizationScreen';
import { CommissionsScreen } from './src/screens/CommissionsScreen';
import { AdminManagementScreen } from './src/screens/AdminManagementScreen';
import { SystemScreen } from './src/screens/SystemScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

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
  const { data, isReady, setData, storageError } = useSynpleData();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screen, setScreen] = useState('organizations');
  const [role, setRole] = useState('USER');
  const [activeUserId, setActiveUserId] = useState('user-visitante');
  const [organizationForm, setOrganizationForm] = useState({ name: '', document: '' });
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

  useEffect(() => {
    if (isOrgAdmin && (!selectedOrganizationId || !approvedOwnedOrganizations.some((org) => org.id === selectedOrganizationId))) {
      if (approvedOwnedOrganizations.length > 0) {
        setSelectedOrganizationId(approvedOwnedOrganizations[0].id);
      }
    }
  }, [isOrgAdmin, approvedOwnedOrganizations, selectedOrganizationId]);

  function createOrganization() {
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
    const organization = { id: createId('org'), name, document, ownerId: activeUserId, status: 'PENDING' };
    setData((current) => ({
      ...current,
      organizations: [...current.organizations, organization],
    }));
    setSelectedOrganizationId(organization.id);
    setRole('USER');
    setScreen('management');
    setOrganizationForm({ name: '', document: '' });
    Alert.alert('Cadastro enviado', 'Sua organização aguarda aprovação do administrador do sistema. Após a aprovação, você será o administrador da organização e poderá gerenciar acessos e comissões.');
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
    };

    // Salva no banco PostgreSQL diretamente se o backend estiver rodando
    try {
      const apiRes = await registerWithApi({ name: user.name, email: normalizedEmail, phone: user.phone, password });
      if (apiRes && apiRes.success && apiRes.user?.id) {
        user.id = apiRes.user.id;
        newUserId = apiRes.user.id;
      }
    } catch (err) {
      console.warn('Registro mantido localmente:', err);
    }

    setData((current) => ({ ...current, users: [...current.users, user] }));
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
    updateOrganizationStatusWithApi(organizationId, status).catch(() => {});
    setData((current) => ({
      ...current,
      organizations: current.organizations.map((organization) => (
        organization.id === organizationId ? { ...organization, status } : organization
      )),
    }));
  }

  function removeOrganization(organizationId) {
    if (!isSystemAdmin) return;
    Alert.alert('Remover organização', 'A organização, suas comissões e seus acessos serão removidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => {
        deleteOrganizationWithApi(organizationId).catch(() => {});
        setData((current) => {
          const commissionIds = current.commissions.filter((commission) => commission.organizationId === organizationId).map((commission) => commission.id);
          return {
            ...current,
            organizations: current.organizations.filter((organization) => organization.id !== organizationId),
            accessRequests: current.accessRequests.filter((request) => request.organizationId !== organizationId),
            commissions: current.commissions.filter((commission) => commission.organizationId !== organizationId),
            commissionMembers: current.commissionMembers.filter((member) => !commissionIds.includes(member.commissionId)),
          };
        });
      } },
    ]);
  }

  function removeUser(userId) {
    const user = data.users.find((item) => item.id === userId);
    if (!isSystemAdmin || !user || user.id === activeUserId || user.systemRole === 'SYSTEM_ADMIN') return;
    Alert.alert('Remover usuário', 'As organizações e acessos vinculados a esta conta também serão removidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => {
        // Exclui no PostgreSQL por ID e por e-mail para garantir compatibilidade
        if (user.id) deleteUserWithApi(user.id).catch(() => {});
        if (user.email) deleteUserWithApi(user.email).catch(() => {});

        setData((current) => {
          const organizationIds = current.organizations.filter((organization) => organization.ownerId === userId).map((organization) => organization.id);
          const commissionIds = current.commissions.filter((commission) => organizationIds.includes(commission.organizationId)).map((commission) => commission.id);
          return {
            ...current,
            users: current.users.filter((item) => item.id !== userId && item.email !== user.email),
            organizations: current.organizations.filter((organization) => organization.ownerId !== userId),
            accessRequests: current.accessRequests.filter((request) => request.userId !== userId && !organizationIds.includes(request.organizationId)),
            commissions: current.commissions.filter((commission) => !organizationIds.includes(commission.organizationId)),
            commissionMembers: current.commissionMembers.filter((member) => member.userId !== userId && !commissionIds.includes(member.commissionId)),
          };
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
    setData((current) => ({
      ...current,
      accessRequests: [...current.accessRequests, {
        id: createId('access'), organizationId: organization.id, userId: activeUserId, status: 'PENDING', organizationRole: 'MEMBER',
      }],
    }));
    requestAccessWithApi(organization.id, activeUserId).catch(() => {});
    Alert.alert('Solicitação enviada', `Sua solicitação de entrada na organização "${organization.name}" foi enviada com sucesso e aguarda aprovação.`);
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
    setData((current) => ({
      ...current,
      accessRequests: current.accessRequests.map((item) => (item.id === requestId ? { ...item, organizationRole } : item)),
    }));
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

  function createCommission() {
    if (!isOrgAdmin || selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED') return;
    const validationError = validateCommission(commissionForm);
    if (validationError) return Alert.alert('Dados obrigatórios', validationError);
    const name = commissionForm.name.trim();
    if (data.commissions.some((commission) => commission.organizationId === selectedOrganizationId && commission.name.toLowerCase() === name.toLowerCase())) {
      return Alert.alert('Nome já cadastrado', 'Já existe uma comissão ou grupo de trabalho com este nome nesta organização.');
    }
    const commission = {
      id: createId('commission'),
      organizationId: selectedOrganizationId,
      name,
      type: commissionForm.type || 'Comissão',
      description: commissionForm.description.trim(),
      status: 'ACTIVE',
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

  function addCommissionMember(userId, role = 'MEMBER') {
    if (!selectedCommission || selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED') return;
    if (data.commissionMembers.some((member) => member.commissionId === selectedCommission.id && member.userId === userId)) return;
    setData((current) => ({
      ...current,
      commissionMembers: [...current.commissionMembers, { commissionId: selectedCommission.id, userId, role }],
    }));
  }

  function removeCommissionMember(userId) {
    if (selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED' || !selectedCommission) return;
    setData((current) => ({
      ...current,
      commissionMembers: current.commissionMembers.filter((member) => !(member.commissionId === selectedCommissionId && member.userId === userId)),
    }));
  }

  function toggleCommissionMemberRole(userId) {
    if (selectedOrganization?.ownerId !== activeUserId || selectedOrganization.status !== 'APPROVED' || !selectedCommission) return;
    setData((current) => ({
      ...current,
      commissionMembers: current.commissionMembers.map((member) => {
        if (member.commissionId === selectedCommissionId && member.userId === userId) {
          const nextRole = (member.role || 'MEMBER') === 'COORDINATOR' ? 'MEMBER' : 'COORDINATOR';
          return { ...member, role: nextRole };
        }
        return member;
      }),
    }));
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
    setData((current) => ({
      ...current,
      users: current.users.map((user) => (
        user.id === activeUserId
          ? { ...user, name, email, phone: formatPhone(profileForm.phone) }
          : user
      )),
    }));
    Alert.alert('Dados atualizados', 'Suas informações pessoais foram alteradas.');
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
  }

  function recoverAccount() {
    setData((current) => ({ ...current, users: current.users.map((user) => user.id === activeUserId ? { ...user, recoveryRequestedAt: new Date().toISOString() } : user) }));
    const currentPass = activeUser?.password || 'admin';
    Alert.alert('Recuperação solicitada', `Instruções simuladas para ${activeUser?.email}. (Senha atual nesta demonstração: "${currentPass}").`);
  }

  function recoverAccountFromLogin(rawEmail) {
    const email = (rawEmail || '').trim().toLowerCase();
    if (!email) {
      Alert.alert('E-mail obrigatório', 'Informe o seu e-mail cadastrado.');
      return false;
    }
    const user = data.users.find((u) => normalizeEmail(u.email) === email || (email.includes('marina') && u.email === 'marina@synple.app') || (email.includes('admin') && u.systemRole === 'SYSTEM_ADMIN') || (email.includes('joao') && u.email === 'joao@email.com'));
    if (!user) {
      Alert.alert('E-mail não encontrado', 'Não encontramos nenhuma conta vinculada a este e-mail.');
      return false;
    }
    const token = `synple-token-${Date.now().toString(36)}`;
    setData((current) => ({
      ...current,
      users: current.users.map((u) => u.id === user.id ? { ...u, recoveryToken: token, recoveryRequestedAt: new Date().toISOString() } : u),
    }));
    Alert.alert(
      'Link de recuperação gerado',
      `Simulação de envio para ${user.email}:\n\n🔗 Link: https://synple.app/redefinir-senha?token=${token}\n\nNo aplicativo, o link foi validado. Defina sua nova senha agora.`
    );
    return true;
  }

  function resetPasswordFromLogin(rawEmail, newPassword, confirmPassword) {
    const email = (rawEmail || '').trim().toLowerCase();
    const next = (newPassword || '').trim();
    const confirm = (confirmPassword || '').trim();
    if (next.length < 6 || next !== confirm) {
      Alert.alert('Senha inválida', 'A nova senha deve ter no mínimo 6 caracteres e coincidir com a confirmação.');
      return false;
    }
    const user = data.users.find((u) => normalizeEmail(u.email) === email || (email.includes('marina') && u.email === 'marina@synple.app') || (email.includes('admin') && u.systemRole === 'SYSTEM_ADMIN') || (email.includes('joao') && u.email === 'joao@email.com'));
    if (!user) {
      Alert.alert('Conta não encontrada', 'Não foi possível localizar o usuário para redefinição.');
      return false;
    }
    setData((current) => ({
      ...current,
      users: current.users.map((u) => u.id === user.id ? { ...u, password: next, passwordUpdatedAt: new Date().toISOString() } : u),
    }));
    Alert.alert('Senha redefinida com sucesso!', 'Sua nova senha foi gravada com sucesso. Faça login para continuar.');
    return true;
  }

  function setTheme(theme) {
    setData((current) => ({ ...current, users: current.users.map((user) => user.id === activeUserId ? { ...user, theme } : user) }));
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

        <ScrollView contentContainerStyle={styles.content}>
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

          {screen === 'profile' && (
            <ProfileScreen
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              onUpdateProfile={updateProfile}
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              onUpdatePassword={updatePassword}
              onRecoverAccount={recoverAccount}
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
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

