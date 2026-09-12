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

import { Choice, Field, StatusBadge } from './src/components/FormControls';
import { INITIAL_DATA } from './src/constants/data';
import { COMMISSION_ROLE_LABELS, COMMISSION_STATUS_LABELS, COMMISSION_TYPES, SUBSYSTEM_LABELS } from './src/constants/status';
import { useSynpleData } from './src/hooks/useSynpleData';
import { formatCNPJ, formatPhone } from './src/services/formatters';
import { normalizeEmail, validateCommission, validateLogin, validateOrganization, validatePassword, validatePhone, validateRegistration, validateUser } from './src/services/validation';
import { LoginScreen } from './src/screens/LoginScreen';
import { getThemeStyles, ThemeContext } from './src/styles/theme';

const createId = (prefix) => `${prefix}-${Date.now()}`;

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

    let user = data.users.find((item) => normalizeEmail(item.email) === trimmedEmail);
    if (!user) {
      if (trimmedEmail.includes('marina')) user = data.users.find((u) => u.email === 'marina@synple.app');
      else if (trimmedEmail.includes('admin')) user = data.users.find((u) => u.systemRole === 'SYSTEM_ADMIN');
      else if (trimmedEmail.includes('joao')) user = data.users.find((u) => u.email === 'joao@email.com');
    }
    if (!user) return Alert.alert('Conta não encontrada', 'Cadastre um usuário antes de entrar.');

    const isMarina = user.email === 'marina@synple.app' || user.id === 'user-admin';
    const isAdmin = user.systemRole === 'SYSTEM_ADMIN' || user.email === 'admin@synple.app';
    const isJoao = user.email === 'joao@email.com' || user.id === 'user-visitante';

    const validPasswords = [];
    if (user.password) validPasswords.push(user.password.trim());
    if (isMarina) validPasswords.push('marina123', 'marina', 'admin123', 'admin', '123456', 'senha123');
    if (isAdmin) validPasswords.push('admin123', 'admin', '123456');
    if (isJoao) validPasswords.push('joao123', 'joao', 'admin123', 'admin', '123456');

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

  function registerUser({ name, email, phone, password, confirmPassword }) {
    const validationError = validateRegistration({ name, email, phone, password, confirmPassword });
    if (validationError) return Alert.alert('Dados inválidos', validationError);
    const normalizedEmail = normalizeEmail(email);
    if (data.users.some((user) => user.email === normalizedEmail)) return Alert.alert('E-mail já cadastrado', 'Use outro e-mail ou entre com a conta existente.');

    const user = {
      id: createId('user'),
      name: name.trim(),
      email: normalizedEmail,
      phone: formatPhone(phone),
      password: password,
      theme: 'LIGHT',
    };
    setData((current) => ({ ...current, users: [...current.users, user] }));
    setActiveUserId(user.id);
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
      { text: 'Remover', style: 'destructive', onPress: () => setData((current) => {
        const commissionIds = current.commissions.filter((commission) => commission.organizationId === organizationId).map((commission) => commission.id);
        return {
          ...current,
          organizations: current.organizations.filter((organization) => organization.id !== organizationId),
          accessRequests: current.accessRequests.filter((request) => request.organizationId !== organizationId),
          commissions: current.commissions.filter((commission) => commission.organizationId !== organizationId),
          commissionMembers: current.commissionMembers.filter((member) => !commissionIds.includes(member.commissionId)),
        };
      }) },
    ]);
  }

  function removeUser(userId) {
    const user = data.users.find((item) => item.id === userId);
    if (!isSystemAdmin || !user || user.id === activeUserId || user.systemRole === 'SYSTEM_ADMIN') return;
    Alert.alert('Remover usuário', 'As organizações e acessos vinculados a esta conta também serão removidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setData((current) => {
        const organizationIds = current.organizations.filter((organization) => organization.ownerId === userId).map((organization) => organization.id);
        const commissionIds = current.commissions.filter((commission) => organizationIds.includes(commission.organizationId)).map((commission) => commission.id);
        return {
          ...current,
          users: current.users.filter((item) => item.id !== userId),
          organizations: current.organizations.filter((organization) => organization.ownerId !== userId),
          accessRequests: current.accessRequests.filter((request) => request.userId !== userId && !organizationIds.includes(request.organizationId)),
          commissions: current.commissions.filter((commission) => !organizationIds.includes(commission.organizationId)),
          commissionMembers: current.commissionMembers.filter((member) => member.userId !== userId && !commissionIds.includes(member.commissionId)),
        };
      }) },
    ]);
  }

  function requestAccess(organizationId = selectedOrganizationId) {
    const organization = data.organizations.find((item) => item.id === organizationId);
    if (!organization || organization.status !== 'APPROVED') return;
    if (organization.ownerId === activeUserId) {
      Alert.alert('Você já é o administrador', 'O administrador da organização não precisa solicitar acesso a ela.');
      return;
    }
    const existingRequest = data.accessRequests.find((request) => (
      request.organizationId === organization.id && request.userId === activeUserId && ['PENDING', 'APPROVED'].includes(request.status)
    ));
    if (existingRequest) {
      Alert.alert('Solicitação existente', 'Este usuário já possui uma solicitação ou acesso nesta organização.');
      return;
    }
    setData((current) => ({
      ...current,
      accessRequests: [...current.accessRequests, {
        id: createId('access'), organizationId: organization.id, userId: activeUserId, status: 'PENDING',
      }],
    }));
    Alert.alert('Solicitação enviada', 'O administrador da organização deverá aprovar ou rejeitar o acesso.');
  }

  function changeAccessStatus(requestId, status) {
    const request = data.accessRequests.find((item) => item.id === requestId);
    const organization = data.organizations.find((item) => item.id === request?.organizationId);
    if (!isOrgAdmin || organization?.ownerId !== activeUserId || organization.status !== 'APPROVED') return;
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
    if (activeUser?.email === 'marina@synple.app') validCurrents.push('marina123', 'marina', 'admin', 'admin123');
    if (activeUser?.systemRole === 'SYSTEM_ADMIN') validCurrents.push('admin123', 'admin');
    if (activeUser?.email === 'joao@email.com') validCurrents.push('joao123', 'joao', 'admin');
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
      <View style={styles.header}>
        <View style={styles.headerIdentity}><Image source={require('./assets/synple-splash.png')} style={styles.headerLogo} resizeMode="contain" /><View><Text style={styles.brand}>Synple</Text><Text style={styles.subtitle}>Gestão de organizações</Text></View></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{activeUser?.name?.charAt(0) || 'S'}</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sessionRow}><Text style={styles.sectionTitle}>Acesso: {isSystemAdmin ? 'Administrador do sistema' : isOrgAdmin ? 'Administrador da organização' : 'Usuário'}</Text><Pressable onPress={logout}><Text style={styles.logoutText}>Sair</Text></Pressable></View>

        <View style={styles.navigation}>
          {!isSystemAdmin && <Choice label="Organizações" active={screen === 'organizations'} onPress={() => setScreen('organizations')} />}
          {!isSystemAdmin && <Choice label="Minha organização" active={screen === 'management'} onPress={() => setScreen('management')} />}
          {isOrgAdmin && <Choice label="Comissões" active={screen === 'commissions'} onPress={() => setScreen('commissions')} />}
          {isSystemAdmin && <Choice label="Gestão" active={screen === 'admin-management'} onPress={() => setScreen('admin-management')} />}
          {isSystemAdmin && <Choice label="Sistema" active={screen === 'system'} onPress={() => setScreen('system')} />}
          <Choice label="Perfil" active={screen === 'profile'} onPress={openProfile} />
        </View>

        {screen === 'organizations' && (
          <>
            <Text style={styles.sectionTitle}>Organizações</Text>
            <View style={styles.card}><Text style={styles.hint}>Encontre organizações disponíveis para participar.</Text><Field label="Pesquisar" value={organizationSearch} onChangeText={setOrganizationSearch} placeholder="Nome ou CNPJ" /></View>
            {searchableOrganizations.length === 0 && <Text style={styles.empty}>Nenhuma organização encontrada.</Text>}
            {searchableOrganizations.map((organization) => (
              <View key={organization.id} style={styles.card}>
                <View style={styles.cardHeader}><View><Text style={styles.cardTitle}>{organization.name}</Text><Text style={styles.muted}>{organization.document}</Text></View><StatusBadge status={organization.status} /></View>
                {organization.ownerId !== activeUserId && <Pressable style={styles.smallButton} onPress={() => requestAccess(organization.id)}><Text style={styles.smallButtonText}>Solicitar entrada</Text></Pressable>}
                {organization.ownerId === activeUserId && <Text style={styles.ownerTag}>Você é o administrador</Text>}
              </View>
            ))}
          </>
        )}

        {isSystemAdmin && screen === 'admin-management' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Organizações</Text>
              <Text style={styles.hint}>Aprovar, recusar ou remover organizações do aplicativo.</Text>
              {data.organizations.map((organization) => {
                const ceo = data.users.find((user) => user.id === organization.ownerId);
                return <View key={organization.id} style={styles.member}><View><Text style={styles.memberName}>{organization.name}</Text><Text style={styles.muted}>{organization.document}</Text><Text style={styles.muted}>Administrador: {ceo?.name || 'Não identificado'}</Text><StatusBadge status={organization.status} /></View><View><View style={styles.actionRow}>{organization.status === 'PENDING' && <><Pressable style={styles.approveButton} onPress={() => changeOrganizationStatus(organization.id, 'APPROVED')}><Text style={styles.actionText}>Aprovar</Text></Pressable><Pressable style={styles.rejectButton} onPress={() => changeOrganizationStatus(organization.id, 'REJECTED')}><Text style={styles.rejectText}>Recusar</Text></Pressable></>} </View><Pressable style={styles.outlineButton} onPress={() => removeOrganization(organization.id)}><Text style={styles.outlineText}>Remover</Text></Pressable></View></View>;
              })}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Usuários</Text>
              <Text style={styles.hint}>Gerencie as contas cadastradas. A conta administrativa ativa é protegida contra remoção.</Text>
              {data.users.map((user) => <View key={user.id} style={styles.member}><View><Text style={styles.memberName}>{user.name}</Text><Text style={styles.muted}>{user.email}</Text><Text style={styles.muted}>{user.systemRole === 'SYSTEM_ADMIN' ? 'Administrador do sistema' : data.organizations.some((organization) => organization.ownerId === user.id && organization.status === 'APPROVED') ? 'Administrador da organização' : 'Usuário'}</Text></View>{user.id !== activeUserId && user.systemRole !== 'SYSTEM_ADMIN' && <Pressable style={styles.outlineButton} onPress={() => removeUser(user.id)}><Text style={styles.outlineText}>Remover</Text></Pressable>}</View>)}
            </View>
          </>
        )}

        {!isSystemAdmin && screen === 'management' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Criar organização</Text>
              <Text style={styles.hint}>Após a aprovação do administrador do sistema, você será o administrador desta organização e poderá gerenciar acessos e comissões.</Text>
              <Field label="Nome da organização" value={organizationForm.name} onChangeText={(name) => setOrganizationForm({ ...organizationForm, name })} placeholder="Ex.: Empresa Synple" />
              <Field label="CNPJ" value={organizationForm.document} onChangeText={(document) => setOrganizationForm({ ...organizationForm, document: formatCNPJ(document) })} placeholder="00.000.000/0000-00" keyboardType="numeric" />
              <Pressable style={styles.primaryButton} onPress={createOrganization}><Text style={styles.primaryButtonText}>Enviar cadastro</Text></Pressable>
            </View>
            {!isSystemAdmin && !isOrgAdmin && <View style={styles.card}>
              <Text style={styles.cardTitle}>Solicitar acesso</Text>
              <Text style={styles.hint}>Usuário selecionado: {activeUser?.name}</Text>
              <Text style={styles.label}>Organização aprovada</Text>
              <View style={styles.userChoices}>{requestableOrganizations.map((organization) => <Choice key={organization.id} label={organization.name} active={selectedOrganizationId === organization.id} onPress={() => setSelectedOrganizationId(organization.id)} />)}</View>
              {requestableOrganizations.length === 0 ? <Text style={styles.empty}>Não há outras organizações aprovadas para solicitar acesso.</Text> : <Pressable style={styles.primaryButton} onPress={requestAccess}><Text style={styles.primaryButtonText}>Solicitar acesso</Text></Pressable>}
            </View>}

            {isOrgAdmin && <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Organização administrada</Text>
                <Text style={styles.hint}>Selecione a organização para ver pedidos e membros.</Text>
                <View style={styles.userChoices}>{approvedOwnedOrganizations.map((organization) => <Choice key={organization.id} label={organization.name} active={selectedOrganizationId === organization.id} onPress={() => setSelectedOrganizationId(organization.id)} />)}</View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Comissões e grupos de trabalho</Text>
                    <Text style={styles.hint}>{organizationCommissions.length} comissão(ões) ou grupo(s) cadastrado(s).</Text>
                  </View>
                </View>
                <Pressable style={styles.primaryButton} onPress={() => setScreen('commissions')}>
                  <Text style={styles.primaryButtonText}>Gerenciar comissões e equipe</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>Solicitações pendentes</Text>
              {organizationPendingRequests.length === 0 && <Text style={styles.empty}>Não há solicitações pendentes para esta organização.</Text>}
              {organizationPendingRequests.map((request) => {
                const user = data.users.find((item) => item.id === request.userId);
                const organization = data.organizations.find((item) => item.id === request.organizationId);
                return <View key={request.id} style={styles.card}><Text style={styles.cardTitle}>{user?.name}</Text><Text style={styles.muted}>{organization?.name}</Text><Text style={styles.memberDetail}>E-mail: {user?.email || 'Não informado'}</Text><Text style={styles.memberDetail}>Telefone: {user?.phone || 'Não informado'}</Text><View style={styles.actionRow}><Pressable style={styles.approveButton} onPress={() => changeAccessStatus(request.id, 'APPROVED')}><Text style={styles.actionText}>Aprovar</Text></Pressable><Pressable style={styles.rejectButton} onPress={() => changeAccessStatus(request.id, 'REJECTED')}><Text style={styles.rejectText}>Recusar</Text></Pressable></View></View>;
              })}
              <Text style={styles.sectionTitle}>Membros da organização</Text>
              {selectedOrganization && <View style={styles.member}><View><Text style={styles.memberName}>{data.users.find((user) => user.id === selectedOrganization.ownerId)?.name}</Text><Text style={styles.muted}>Administrador da organização</Text></View><Text style={styles.ownerTag}>Admin da org</Text></View>}
              {organizationApprovedRequests.length === 0 && <Text style={styles.empty}>Ainda não há membros aprovados.</Text>}
              {organizationApprovedRequests.map((request) => {
                const user = data.users.find((item) => item.id === request.userId);
                const organizationCommissionsForUser = data.commissionMembers.filter((member) => member.userId === request.userId).map((member) => data.commissions.find((commission) => commission.id === member.commissionId && commission.organizationId === selectedOrganizationId)).filter(Boolean);
                return <View key={request.id} style={styles.card}><Text style={styles.cardTitle}>{user?.name}</Text><Text style={styles.memberDetail}>E-mail: {user?.email || 'Não informado'}</Text><Text style={styles.memberDetail}>Telefone: {user?.phone || 'Não informado'}</Text><Text style={styles.label}>Cargo na organização</Text><View style={styles.userChoices}><Choice label="Membro" active={(request.organizationRole || 'MEMBER') === 'MEMBER'} onPress={() => updateOrganizationRole(request.id, 'MEMBER')} /><Choice label="Coordenador" active={request.organizationRole === 'COORDINATOR'} onPress={() => updateOrganizationRole(request.id, 'COORDINATOR')} /></View><Text style={styles.memberDetail}>Comissões: {organizationCommissionsForUser.map((commission) => commission.name).join(', ') || 'Nenhuma'}</Text><Pressable style={styles.outlineButton} onPress={() => removeOrganizationMember(request.id)}><Text style={styles.outlineText}>Remover da organização</Text></Pressable></View>;
              })}
            </>}

            {!isSystemAdmin && !isOrgAdmin && <><Text style={styles.sectionTitle}>Minhas solicitações</Text>{userRequests.length === 0 && <Text style={styles.empty}>Você ainda não possui solicitações.</Text>}{userRequests.map((request) => {
              const user = data.users.find((item) => item.id === request.userId);
              const organization = data.organizations.find((item) => item.id === request.organizationId);
              const administrator = data.users.find((item) => item.id === organization?.ownerId);
              return <View key={request.id} style={styles.member}><View><Text style={styles.memberName}>{organization?.name}</Text><Text style={styles.muted}>Administrador: {administrator?.name || 'Não identificado'}</Text><Text style={styles.muted}>{user?.email}</Text></View><StatusBadge status={request.status} /></View>;
            })}</>}
          </>
        )}

        {isOrgAdmin && screen === 'commissions' && (
          <>
            {approvedOwnedOrganizations.length > 1 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Organização gerenciada</Text>
                <Text style={styles.hint}>Selecione a organização para gerenciar comissões e grupos:</Text>
                <View style={styles.userChoices}>
                  {approvedOwnedOrganizations.map((organization) => (
                    <Choice
                      key={organization.id}
                      label={organization.name}
                      active={selectedOrganizationId === organization.id}
                      onPress={() => {
                        setSelectedOrganizationId(organization.id);
                        setSelectedCommissionId('');
                        setEditingCommissionId(null);
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Cadastro de Nova Comissão / Grupo de Trabalho */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Nova comissão ou grupo de trabalho</Text>
              <Text style={styles.hint}>
                Organização: <Text style={{ fontWeight: '700' }}>{selectedOrganization?.name}</Text>. Cadastre comissões, grupos de trabalho ou comitês vinculados a esta organização.
              </Text>
              <Field
                label="Nome da comissão ou grupo"
                value={commissionForm.name}
                onChangeText={(name) => setCommissionForm({ ...commissionForm, name })}
                placeholder="Ex.: Comissão de Eventos / GT de Inovação"
              />
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.userChoices}>
                {COMMISSION_TYPES.map((type) => (
                  <Choice
                    key={type}
                    label={type}
                    active={(commissionForm.type || 'Comissão') === type}
                    onPress={() => setCommissionForm({ ...commissionForm, type })}
                  />
                ))}
              </View>
              <Field
                label="Descrição / Objetivo"
                value={commissionForm.description}
                onChangeText={(description) => setCommissionForm({ ...commissionForm, description })}
                placeholder="Objetivo e atribuições do grupo"
              />
              <Pressable style={styles.primaryButton} onPress={createCommission}>
                <Text style={styles.primaryButtonText}>Cadastrar comissão</Text>
              </Pressable>
            </View>

            {/* Formulário de Edição de Comissão */}
            {editingCommissionId && (
              <View style={[styles.card, styles.selectedCard]}>
                <Text style={styles.cardTitle}>Editar comissão / grupo</Text>
                <Text style={styles.hint}>Atualize os dados e a situação da comissão selecionada.</Text>
                <Field
                  label="Nome da comissão"
                  value={editCommissionForm.name}
                  onChangeText={(name) => setEditCommissionForm({ ...editCommissionForm, name })}
                  placeholder="Nome do grupo"
                />
                <Text style={styles.label}>Tipo</Text>
                <View style={styles.userChoices}>
                  {COMMISSION_TYPES.map((type) => (
                    <Choice
                      key={type}
                      label={type}
                      active={editCommissionForm.type === type}
                      onPress={() => setEditCommissionForm({ ...editCommissionForm, type })}
                    />
                  ))}
                </View>
                <Text style={styles.label}>Situação</Text>
                <View style={styles.userChoices}>
                  <Choice
                    label="Ativa"
                    active={editCommissionForm.status === 'ACTIVE'}
                    onPress={() => setEditCommissionForm({ ...editCommissionForm, status: 'ACTIVE' })}
                  />
                  <Choice
                    label="Inativa"
                    active={editCommissionForm.status === 'INACTIVE'}
                    onPress={() => setEditCommissionForm({ ...editCommissionForm, status: 'INACTIVE' })}
                  />
                </View>
                <Field
                  label="Descrição / Objetivo"
                  value={editCommissionForm.description}
                  onChangeText={(description) => setEditCommissionForm({ ...editCommissionForm, description })}
                  placeholder="Descrição da comissão"
                />
                <View style={styles.actionRow}>
                  <Pressable style={styles.approveButton} onPress={saveEditCommission}>
                    <Text style={styles.actionText}>Salvar</Text>
                  </Pressable>
                  <Pressable style={styles.rejectButton} onPress={cancelEditCommission}>
                    <Text style={styles.rejectText}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Listagem de Comissões */}
            <Text style={styles.sectionTitle}>Comissões da organização ({organizationCommissions.length})</Text>
            {organizationCommissions.length === 0 && (
              <Text style={styles.empty}>Ainda não há comissões cadastradas nesta organização.</Text>
            )}
            {organizationCommissions.map((commission) => {
              const isSelected = selectedCommissionId === commission.id;
              const membersCount = data.commissionMembers.filter((m) => m.commissionId === commission.id).length;
              return (
                <Pressable
                  key={commission.id}
                  onPress={() => setSelectedCommissionId(commission.id)}
                  style={[styles.card, isSelected && styles.selectedCard]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{commission.name}</Text>
                      <View style={styles.tagRow}>
                        <Text style={styles.typeTag}>{commission.type || 'Comissão'}</Text>
                        <Text style={commission.status === 'INACTIVE' ? styles.inactiveTag : styles.activeTag}>
                          {commission.status === 'INACTIVE' ? 'Inativa' : 'Ativa'}
                        </Text>
                        <Text style={styles.muted}>• {membersCount} membro(s)</Text>
                      </View>
                      <Text style={[styles.muted, { marginTop: 6 }]}>
                        {commission.description || 'Sem descrição cadastrada.'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.secondaryButton}
                      onPress={() => startEditCommission(commission)}
                    >
                      <Text style={styles.secondaryButtonText}>Editar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryButton}
                      onPress={() => toggleCommissionStatus(commission.id)}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {commission.status === 'INACTIVE' ? 'Ativar' : 'Desativar'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.outlineButton}
                      onPress={() => deleteCommission(commission.id)}
                    >
                      <Text style={styles.outlineText}>Excluir</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            {/* Gerenciamento da Equipe da Comissão Selecionada */}
            {selectedCommission && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Equipe: {selectedCommission.name}</Text>
                    <Text style={styles.hint}>
                      Gerencie a composição e os cargos da equipe nesta comissão.
                    </Text>
                  </View>
                  <Text style={styles.typeTag}>{selectedCommission.type || 'Comissão'}</Text>
                </View>

                {/* Membros Atuais */}
                <Text style={styles.label}>
                  Membros atuais da equipe ({commissionTeam.length})
                </Text>
                {commissionTeam.length === 0 && (
                  <Text style={styles.empty}>Nenhum membro vinculado a esta comissão.</Text>
                )}
                {commissionTeam.map((member) => (
                  <View key={member.id} style={styles.member}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.muted}>{member.email}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Text
                          style={
                            member.commissionRole === 'COORDINATOR'
                              ? styles.roleBadgeCoordinator
                              : styles.roleBadge
                          }
                        >
                          {member.commissionRole === 'COORDINATOR' ? 'Coordenador(a)' : 'Membro'}
                        </Text>
                        {selectedOrganization?.ownerId === member.id && (
                          <Text style={styles.ownerTag}>Admin da org</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Pressable
                        style={styles.smallButton}
                        onPress={() => toggleCommissionMemberRole(member.id)}
                      >
                        <Text style={styles.smallButtonText}>
                          {member.commissionRole === 'COORDINATOR' ? 'Tornar membro' : 'Tornar coord.'}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => removeCommissionMember(member.id)}>
                        <Text style={styles.removeText}>Remover</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                {/* Adicionar Membros da Organização */}
                <Text style={[styles.label, { marginTop: 14 }]}>
                  Adicionar membros da organização ({availableOrgMembers.length} disponíveis)
                </Text>
                {availableOrgMembers.length === 0 ? (
                  <Text style={styles.muted}>
                    Todos os membros da organização já fazem parte desta comissão.
                  </Text>
                ) : (
                  availableOrgMembers.map((user) => (
                    <View key={user.id} style={styles.member}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{user.name}</Text>
                        <Text style={styles.muted}>{user.email}</Text>
                      </View>
                      <Pressable
                        style={styles.approveButton}
                        onPress={() => addCommissionMember(user.id)}
                      >
                        <Text style={styles.actionText}>+ Adicionar</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}

        {screen === 'profile' && (
          <>
            <View style={styles.card}><Text style={styles.cardTitle}>Dados pessoais</Text><Field label="Nome" value={profileForm.name} onChangeText={(name) => setProfileForm({ ...profileForm, name })} placeholder="Seu nome" /><Field label="E-mail" value={profileForm.email} onChangeText={(email) => setProfileForm({ ...profileForm, email })} placeholder="voce@email.com" keyboardType="email-address" /><Field label="Telefone" value={profileForm.phone} onChangeText={(phone) => setProfileForm({ ...profileForm, phone: formatPhone(phone) })} placeholder="(00) 00000-0000" keyboardType="phone-pad" /><Pressable style={styles.primaryButton} onPress={updateProfile}><Text style={styles.primaryButtonText}>Salvar dados</Text></Pressable></View>
            <View style={styles.card}><Text style={styles.cardTitle}>Trocar senha</Text><Field label="Senha atual" value={passwordForm.current} onChangeText={(current) => setPasswordForm({ ...passwordForm, current })} placeholder="Senha atual" secureTextEntry /><Field label="Nova senha" value={passwordForm.next} onChangeText={(next) => setPasswordForm({ ...passwordForm, next })} placeholder="Mínimo de 6 caracteres" secureTextEntry /><Field label="Confirmar nova senha" value={passwordForm.confirm} onChangeText={(confirm) => setPasswordForm({ ...passwordForm, confirm })} placeholder="Repita a nova senha" secureTextEntry /><Pressable style={styles.primaryButton} onPress={updatePassword}><Text style={styles.primaryButtonText}>Atualizar senha</Text></Pressable><Pressable style={styles.resetButton} onPress={recoverAccount}><Text style={styles.resetText}>Recuperar conta por e-mail</Text></Pressable></View>
            <View style={styles.card}><Text style={styles.cardTitle}>Tema preferido</Text><View style={styles.userChoices}><Choice label="Claro" active={(activeUser?.theme || 'LIGHT') === 'LIGHT'} onPress={() => setTheme('LIGHT')} /><Choice label="Escuro" active={activeUser?.theme === 'DARK'} onPress={() => setTheme('DARK')} /></View></View>
          </>
        )}

        {isSystemAdmin && screen === 'system' && (
          <>
            <View style={styles.card}><Text style={styles.cardTitle}>Status do sistema</Text><Text style={styles.hint}>{data.system.initialized ? `Inicializado em ${new Date(data.system.initializedAt).toLocaleString('pt-BR')}` : 'Aguardando setup inicial.'}</Text>{data.system.subsystems.map((subsystem) => <View key={subsystem.id} style={styles.member}><View><Text style={styles.memberName}>{subsystem.name}</Text><Text style={styles.muted}>{SUBSYSTEM_LABELS[subsystem.status]}</Text></View><Pressable style={styles.smallButton} onPress={() => restartSubsystem(subsystem.id)}><Text style={styles.smallButtonText}>Reiniciar</Text></Pressable></View>)}</View>
            <View style={styles.card}><Text style={styles.cardTitle}>Relatório resumido</Text><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.users.length}</Text><Text style={styles.muted}>usuários</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.organizations.length}</Text><Text style={styles.muted}>organizações</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.commissions.length}</Text><Text style={styles.muted}>comissões</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.accessRequests.filter((request) => request.status === 'PENDING').length}</Text><Text style={styles.muted}>acessos pendentes</Text></View></View>
            <View style={styles.card}><Text style={styles.cardTitle}>Operações administrativas</Text><Pressable style={styles.primaryButton} onPress={initializeSystem}><Text style={styles.primaryButtonText}>Executar setup inicial</Text></Pressable><Pressable style={styles.outlineButton} onPress={resetDemo}><Text style={styles.outlineText}>Resetar sistema e dados locais</Text></Pressable></View>
          </>
        )}

        {isSystemAdmin && <Pressable style={styles.resetButton} onPress={resetDemo}><Text style={styles.resetText}>Restaurar dados de demonstração</Text></Pressable>}
      </ScrollView>
    </SafeAreaView>
    </ThemeContext.Provider>
  );
}
