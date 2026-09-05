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
import { SUBSYSTEM_LABELS } from './src/constants/status';
import { useSynpleData } from './src/hooks/useSynpleData';
import { normalizeEmail, validateLogin, validateOrganization, validatePassword, validateRegistration, validateUser } from './src/services/validation';
import { LoginScreen } from './src/screens/LoginScreen';
import { styles } from './src/styles/theme';

const createId = (prefix) => `${prefix}-${Date.now()}`;

export default function App() {
  const { data, isReady, setData, storageError } = useSynpleData();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screen, setScreen] = useState('organizations');
  const [role, setRole] = useState('USER');
  const [activeUserId, setActiveUserId] = useState('user-visitante');
  const [organizationForm, setOrganizationForm] = useState({ name: '', document: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '' });
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('org-aurora');
  const [commissionForm, setCommissionForm] = useState({ name: '', description: '' });
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
  const isAdmin = role === 'ORG_ADMIN';
  const ownedOrganizations = data.organizations.filter((organization) => organization.ownerId === activeUserId);
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
    const organization = { id: createId('org'), name, document, ownerId: activeUserId, status: 'APPROVED' };
    setData((current) => ({
      ...current,
      organizations: [...current.organizations, organization],
    }));
    setSelectedOrganizationId(organization.id);
    setRole('ORG_ADMIN');
    setScreen('access');
    setOrganizationForm({ name: '', document: '' });
    Alert.alert('Organização criada', 'Você agora é o administrador desta organização e pode gerenciar solicitações de entrada.');
  }

  function login({ email, password, mode }) {
    const validationError = validateLogin({ email, password });
    if (validationError) return Alert.alert('Dados inválidos', validationError);

    const user = data.users.find((item) => item.email === normalizeEmail(email));
    if (!user) return Alert.alert('Conta não encontrada', 'Cadastre um usuário antes de entrar.');

    const isAdministrator = data.organizations.some((organization) => organization.ownerId === user.id);
    if (mode === 'ADMIN' && !isAdministrator) return Alert.alert('Acesso negado', 'Esta conta não possui perfil de administrador.');

    setActiveUserId(user.id);
    const firstOwnedOrganization = data.organizations.find((organization) => organization.ownerId === user.id);
    const firstRequestableOrganization = data.organizations.find((organization) => organization.status === 'APPROVED' && organization.ownerId !== user.id);
    if (mode === 'ADMIN' && firstOwnedOrganization) setSelectedOrganizationId(firstOwnedOrganization.id);
    if (mode === 'USER' && firstRequestableOrganization) setSelectedOrganizationId(firstRequestableOrganization.id);
    setRole(mode === 'ADMIN' ? 'ORG_ADMIN' : 'USER');
    setScreen('access');
    setIsAuthenticated(true);
  }

  function registerUser({ name, email, phone, password, confirmPassword }) {
    const validationError = validateRegistration({ name, email, password, confirmPassword });
    if (validationError) return Alert.alert('Dados inválidos', validationError);
    const normalizedEmail = normalizeEmail(email);
    if (data.users.some((user) => user.email === normalizedEmail)) return Alert.alert('E-mail já cadastrado', 'Use outro e-mail ou entre com a conta existente.');

    const user = { id: createId('user'), name: name.trim(), email: normalizedEmail, phone: phone.trim(), theme: 'LIGHT' };
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
    setData((current) => ({
      ...current,
      organizations: current.organizations.map((organization) => (
        organization.id === organizationId ? { ...organization, status } : organization
      )),
    }));
  }

  function createUser() {
    const validationError = validateUser(userForm);
    if (validationError) {
      Alert.alert('Dados inválidos', validationError);
      return;
    }
    const name = userForm.name.trim();
    const email = normalizeEmail(userForm.email);
    if (data.users.some((user) => user.email === email)) {
      Alert.alert('E-mail já cadastrado', 'Use outro e-mail ou selecione o usuário existente.');
      return;
    }
    const user = { id: createId('user'), name, email, phone: '', theme: 'LIGHT' };
    setData((current) => ({ ...current, users: [...current.users, user] }));
    setUserForm({ name: '', email: '' });
    Alert.alert('Cadastro concluído', 'O usuário já pode entrar e solicitar acesso a uma organização aprovada.');
  }

  function requestAccess() {
    if (!selectedOrganization || selectedOrganization.status !== 'APPROVED') return;
    if (selectedOrganization.ownerId === activeUserId) {
      Alert.alert('Você já é administrador', 'O administrador da organização não precisa solicitar acesso a ela.');
      return;
    }
    const existingRequest = data.accessRequests.find((request) => (
      request.organizationId === selectedOrganization.id && request.userId === activeUserId && ['PENDING', 'APPROVED'].includes(request.status)
    ));
    if (existingRequest) {
      Alert.alert('Solicitação existente', 'Este usuário já possui uma solicitação ou acesso nesta organização.');
      return;
    }
    setData((current) => ({
      ...current,
      accessRequests: [...current.accessRequests, {
        id: createId('access'), organizationId: selectedOrganization.id, userId: activeUserId, status: 'PENDING',
      }],
    }));
    Alert.alert('Solicitação enviada', 'O administrador da organização deverá aprovar ou rejeitar o acesso.');
  }

  function changeAccessStatus(requestId, status) {
    const request = data.accessRequests.find((item) => item.id === requestId);
    const organization = data.organizations.find((item) => item.id === request?.organizationId);
    if (!isAdmin || organization?.ownerId !== activeUserId) return;
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
    if (!isAdmin || organization?.ownerId !== activeUserId || request.status !== 'APPROVED') return;
    setData((current) => ({
      ...current,
      accessRequests: current.accessRequests.map((item) => (item.id === requestId ? { ...item, organizationRole } : item)),
    }));
  }

  function removeOrganizationMember(requestId) {
    const request = data.accessRequests.find((item) => item.id === requestId);
    const organization = data.organizations.find((item) => item.id === request?.organizationId);
    if (!isAdmin || organization?.ownerId !== activeUserId || request.status !== 'APPROVED') return;
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
    if (!isAdmin || selectedOrganization?.ownerId !== activeUserId) return;
    const name = commissionForm.name.trim();
    if (!name) return Alert.alert('Dados obrigatórios', 'Informe o nome da comissão.');
    if (data.commissions.some((commission) => commission.organizationId === selectedOrganizationId && commission.name.toLowerCase() === name.toLowerCase())) return Alert.alert('Comissão já cadastrada', 'Escolha outro nome para a comissão.');
    const commission = { id: createId('commission'), organizationId: selectedOrganizationId, name, description: commissionForm.description.trim(), status: 'ACTIVE' };
    setData((current) => ({ ...current, commissions: [...current.commissions, commission], commissionMembers: [...current.commissionMembers, { commissionId: commission.id, userId: activeUserId }] }));
    setSelectedCommissionId(commission.id);
    setCommissionForm({ name: '', description: '' });
    Alert.alert('Comissão criada', 'O administrador foi incluído na equipe.');
  }

  function deleteCommission(commissionId) {
    const commission = data.commissions.find((item) => item.id === commissionId);
    if (!commission || selectedOrganization?.ownerId !== activeUserId) return;
    Alert.alert('Excluir comissão', 'A equipe vinculada também será removida.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => {
      setData((current) => ({ ...current, commissions: current.commissions.filter((commission) => commission.id !== commissionId), commissionMembers: current.commissionMembers.filter((member) => member.commissionId !== commissionId) }));
      setSelectedCommissionId('');
    } }]);
  }

  function addCommissionMember(userId) {
    if (!selectedCommission || selectedOrganization?.ownerId !== activeUserId || data.commissionMembers.some((member) => member.commissionId === selectedCommission.id && member.userId === userId)) return;
    setData((current) => ({ ...current, commissionMembers: [...current.commissionMembers, { commissionId: selectedCommission.id, userId }] }));
  }

  function removeCommissionMember(userId) {
    if (selectedOrganization?.ownerId !== activeUserId) return;
    setData((current) => ({ ...current, commissionMembers: current.commissionMembers.filter((member) => !(member.commissionId === selectedCommissionId && member.userId === userId)) }));
  }

  function openProfile() {
    setProfileForm({ name: activeUser?.name || '', email: activeUser?.email || '', phone: activeUser?.phone || '' });
    setScreen('profile');
  }

  function updateProfile() {
    const validationError = validateUser(profileForm);
    if (validationError) return Alert.alert('Dados inválidos', validationError);
    const name = profileForm.name.trim();
    const email = normalizeEmail(profileForm.email);
    if (data.users.some((user) => user.id !== activeUserId && user.email === email)) return Alert.alert('E-mail já utilizado', 'Escolha outro e-mail.');
    setData((current) => ({ ...current, users: current.users.map((user) => user.id === activeUserId ? { ...user, name, email, phone: profileForm.phone.trim() } : user) }));
    Alert.alert('Dados atualizados', 'Suas informações pessoais foram alteradas.');
  }

  function updatePassword() {
    const validationError = validatePassword(passwordForm);
    if (validationError) return Alert.alert('Senha inválida', validationError);
    setData((current) => ({ ...current, users: current.users.map((user) => user.id === activeUserId ? { ...user, passwordUpdatedAt: new Date().toISOString() } : user) }));
    setPasswordForm({ current: '', next: '', confirm: '' });
    Alert.alert('Senha alterada', 'A alteração foi registrada nesta demonstração local.');
  }

  function recoverAccount() {
    setData((current) => ({ ...current, users: current.users.map((user) => user.id === activeUserId ? { ...user, recoveryRequestedAt: new Date().toISOString() } : user) }));
    Alert.alert('Recuperação solicitada', `As instruções serão enviadas para ${activeUser?.email} quando o backend for integrado.`);
  }

  function setTheme(theme) {
    setData((current) => ({ ...current, users: current.users.map((user) => user.id === activeUserId ? { ...user, theme } : user) }));
  }

  function restartSubsystem(subsystemId) {
    setData((current) => ({ ...current, system: { ...current.system, subsystems: current.system.subsystems.map((subsystem) => subsystem.id === subsystemId ? { ...subsystem, status: 'RESTARTING' } : subsystem) } }));
    setTimeout(() => setData((current) => ({ ...current, system: { ...current.system, subsystems: current.system.subsystems.map((subsystem) => subsystem.id === subsystemId ? { ...subsystem, status: 'ONLINE' } : subsystem) } })), 900);
  }

  function initializeSystem() {
    setData((current) => ({ ...current, system: { ...current.system, initialized: true, initializedAt: new Date().toISOString() } }));
    Alert.alert('Sistema inicializado', 'Os subsistemas estão prontos para operação.');
  }

  function resetDemo() {
    Alert.alert('Restaurar demonstração', 'Os dados cadastrados neste dispositivo serão removidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restaurar', style: 'destructive', onPress: () => setData(INITIAL_DATA) },
    ]);
  }

  const userRequests = data.accessRequests.filter((request) => request.userId === activeUserId);
  const requestableOrganizations = approvedOrganizations.filter((organization) => organization.ownerId !== activeUserId);
  const organizationPendingRequests = data.accessRequests.filter((request) => request.organizationId === selectedOrganizationId && request.status === 'PENDING');
  const organizationApprovedRequests = data.accessRequests.filter((request) => request.organizationId === selectedOrganizationId && request.status === 'APPROVED');
  const commissionTeam = data.commissionMembers.filter((member) => member.commissionId === selectedCommissionId).map((member) => data.users.find((user) => user.id === member.userId)).filter(Boolean);

  if (!isReady || showSplash) {
    return <SafeAreaView style={styles.loading}><Image source={require('./assets/synple-splash.png')} style={styles.splashLogo} resizeMode="contain" /><Text style={styles.loadingText}>Synple</Text><Text style={styles.loadingCaption}>Organize. Conecte. Simplifique.</Text></SafeAreaView>;
  }

  if (!isAuthenticated) return <LoginScreen onLogin={login} onRegister={registerUser} />;

  return (
    <SafeAreaView style={[styles.safeArea, activeUser?.theme === 'DARK' && styles.darkSurface]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerIdentity}><Image source={require('./assets/synple-splash.png')} style={styles.headerLogo} resizeMode="contain" /><View><Text style={styles.brand}>Synple</Text><Text style={styles.subtitle}>Gestão de organizações</Text></View></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{activeUser?.name?.charAt(0) || 'S'}</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sessionRow}><Text style={styles.sectionTitle}>Acesso: {isAdmin ? 'Administrador da organização' : 'Usuário'}</Text><Pressable onPress={logout}><Text style={styles.logoutText}>Sair</Text></Pressable></View>

        <View style={styles.navigation}>
          <Choice label="Organizações" active={screen === 'organizations'} onPress={() => setScreen('organizations')} />
          <Choice label="Acessos" active={screen === 'access'} onPress={() => setScreen('access')} />
          {isAdmin && <Choice label="Comissões" active={screen === 'commissions'} onPress={() => setScreen('commissions')} />}
          <Choice label="Perfil" active={screen === 'profile'} onPress={openProfile} />
        </View>

        {screen === 'organizations' && (
          <>
            {!isAdmin && <View style={styles.card}>
              <Text style={styles.cardTitle}>Cadastrar organização</Text>
              <Text style={styles.hint}>O cadastro fica pendente até a análise do administrador do sistema.</Text>
              <Field label="Nome da organização" value={organizationForm.name} onChangeText={(name) => setOrganizationForm({ ...organizationForm, name })} placeholder="Ex.: Empresa Synple" />
              <Field label="CNPJ" value={organizationForm.document} onChangeText={(document) => setOrganizationForm({ ...organizationForm, document })} placeholder="00.000.000/0000-00" keyboardType="numeric" />
              <Pressable style={styles.primaryButton} onPress={createOrganization}><Text style={styles.primaryButtonText}>Enviar cadastro</Text></Pressable>
            </View>}

            <Text style={styles.sectionTitle}>{isAdmin ? 'Minhas organizações' : 'Organizações aprovadas'}</Text>
            {data.organizations.filter((organization) => (isAdmin ? organization.ownerId === activeUserId : organization.status === 'APPROVED')).map((organization) => (
              <View key={organization.id} style={styles.card}>
                <View style={styles.cardHeader}><View><Text style={styles.cardTitle}>{organization.name}</Text><Text style={styles.muted}>{organization.document}</Text></View><StatusBadge status={organization.status} /></View>
              </View>
            ))}
          </>
        )}

        {isAdmin && screen === 'users' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cadastro de usuário</Text>
              <Text style={styles.hint}>Após o cadastro, o perfil ativo é selecionado para solicitar acesso.</Text>
              <Field label="Nome completo" value={userForm.name} onChangeText={(name) => setUserForm({ ...userForm, name })} placeholder="Seu nome" />
              <Field label="E-mail" value={userForm.email} onChangeText={(email) => setUserForm({ ...userForm, email })} placeholder="voce@email.com" keyboardType="email-address" />
              <Pressable style={styles.primaryButton} onPress={createUser}><Text style={styles.primaryButtonText}>Criar conta</Text></Pressable>
            </View>
            <Text style={styles.sectionTitle}>Usuário ativo para a demonstração</Text>
            <View style={styles.userChoices}>{data.users.map((user) => <Choice key={user.id} label={user.name} active={activeUserId === user.id} onPress={() => setActiveUserId(user.id)} />)}</View>
          </>
        )}

        {screen === 'access' && (
          <>
            {!isAdmin && <View style={styles.card}>
              <Text style={styles.cardTitle}>Solicitar acesso</Text>
              <Text style={styles.hint}>Usuário selecionado: {activeUser?.name}</Text>
              <Text style={styles.label}>Organização aprovada</Text>
              <View style={styles.userChoices}>{requestableOrganizations.map((organization) => <Choice key={organization.id} label={organization.name} active={selectedOrganizationId === organization.id} onPress={() => setSelectedOrganizationId(organization.id)} />)}</View>
              {requestableOrganizations.length === 0 ? <Text style={styles.empty}>Não há outras organizações aprovadas para solicitar acesso.</Text> : <Pressable style={styles.primaryButton} onPress={requestAccess}><Text style={styles.primaryButtonText}>Solicitar acesso</Text></Pressable>}
            </View>}

            {isAdmin && <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Organização administrada</Text>
                <Text style={styles.hint}>Selecione a organização para ver pedidos e membros.</Text>
                <View style={styles.userChoices}>{ownedOrganizations.map((organization) => <Choice key={organization.id} label={organization.name} active={selectedOrganizationId === organization.id} onPress={() => setSelectedOrganizationId(organization.id)} />)}</View>
              </View>
              <Text style={styles.sectionTitle}>Solicitações pendentes</Text>
              {organizationPendingRequests.length === 0 && <Text style={styles.empty}>Não há solicitações pendentes para esta organização.</Text>}
              {organizationPendingRequests.map((request) => {
                const user = data.users.find((item) => item.id === request.userId);
                const organization = data.organizations.find((item) => item.id === request.organizationId);
                return <View key={request.id} style={styles.card}><Text style={styles.cardTitle}>{user?.name}</Text><Text style={styles.muted}>{organization?.name}</Text><Text style={styles.memberDetail}>E-mail: {user?.email || 'Não informado'}</Text><Text style={styles.memberDetail}>Telefone: {user?.phone || 'Não informado'}</Text><View style={styles.actionRow}><Pressable style={styles.approveButton} onPress={() => changeAccessStatus(request.id, 'APPROVED')}><Text style={styles.actionText}>Aprovar</Text></Pressable><Pressable style={styles.rejectButton} onPress={() => changeAccessStatus(request.id, 'REJECTED')}><Text style={styles.rejectText}>Recusar</Text></Pressable></View></View>;
              })}
              <Text style={styles.sectionTitle}>Membros da organização</Text>
              {selectedOrganization && <View style={styles.member}><View><Text style={styles.memberName}>{data.users.find((user) => user.id === selectedOrganization.ownerId)?.name}</Text><Text style={styles.muted}>Administrador da organização</Text></View><Text style={styles.ownerTag}>Administrador</Text></View>}
              {organizationApprovedRequests.length === 0 && <Text style={styles.empty}>Ainda não há membros aprovados.</Text>}
              {organizationApprovedRequests.map((request) => {
                const user = data.users.find((item) => item.id === request.userId);
                const organizationCommissionsForUser = data.commissionMembers.filter((member) => member.userId === request.userId).map((member) => data.commissions.find((commission) => commission.id === member.commissionId && commission.organizationId === selectedOrganizationId)).filter(Boolean);
                return <View key={request.id} style={styles.card}><Text style={styles.cardTitle}>{user?.name}</Text><Text style={styles.memberDetail}>E-mail: {user?.email || 'Não informado'}</Text><Text style={styles.memberDetail}>Telefone: {user?.phone || 'Não informado'}</Text><Text style={styles.label}>Cargo na organização</Text><View style={styles.userChoices}><Choice label="Membro" active={(request.organizationRole || 'MEMBER') === 'MEMBER'} onPress={() => updateOrganizationRole(request.id, 'MEMBER')} /><Choice label="Coordenador" active={request.organizationRole === 'COORDINATOR'} onPress={() => updateOrganizationRole(request.id, 'COORDINATOR')} /></View><Text style={styles.memberDetail}>Comissões: {organizationCommissionsForUser.map((commission) => commission.name).join(', ') || 'Nenhuma'}</Text><Pressable style={styles.smallButton} onPress={() => setScreen('commissions')}><Text style={styles.smallButtonText}>Atribuir a comissões</Text></Pressable><Pressable style={styles.outlineButton} onPress={() => removeOrganizationMember(request.id)}><Text style={styles.outlineText}>Remover da organização</Text></Pressable></View>;
              })}
            </>}

            {!isAdmin && <><Text style={styles.sectionTitle}>Minhas solicitações</Text>{userRequests.length === 0 && <Text style={styles.empty}>Você ainda não possui solicitações.</Text>}{userRequests.map((request) => {
              const user = data.users.find((item) => item.id === request.userId);
              const organization = data.organizations.find((item) => item.id === request.organizationId);
              const administrator = data.users.find((item) => item.id === organization?.ownerId);
              return <View key={request.id} style={styles.member}><View><Text style={styles.memberName}>{organization?.name}</Text><Text style={styles.muted}>Administrador: {administrator?.name || 'Não identificado'}</Text><Text style={styles.muted}>{user?.email}</Text></View><StatusBadge status={request.status} /></View>;
            })}</>}
          </>
        )}

        {isAdmin && screen === 'commissions' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Nova comissão</Text>
              <Text style={styles.hint}>Comissões são grupos de trabalho vinculados a uma organização.</Text>
              <Text style={styles.label}>Organização</Text>
              <View style={styles.userChoices}>{ownedOrganizations.map((organization) => <Choice key={organization.id} label={organization.name} active={selectedOrganizationId === organization.id} onPress={() => setSelectedOrganizationId(organization.id)} />)}</View>
              <Field label="Nome da comissão" value={commissionForm.name} onChangeText={(name) => setCommissionForm({ ...commissionForm, name })} placeholder="Ex.: Comissão de Eventos" />
              <Field label="Descrição" value={commissionForm.description} onChangeText={(description) => setCommissionForm({ ...commissionForm, description })} placeholder="Objetivo do grupo de trabalho" />
              <Pressable style={styles.primaryButton} onPress={createCommission}><Text style={styles.primaryButtonText}>Cadastrar comissão</Text></Pressable>
            </View>
            <Text style={styles.sectionTitle}>Comissões da organização</Text>
            {organizationCommissions.length === 0 && <Text style={styles.empty}>Ainda não há comissões cadastradas.</Text>}
            {organizationCommissions.map((commission) => <Pressable key={commission.id} onPress={() => setSelectedCommissionId(commission.id)} style={[styles.card, selectedCommissionId === commission.id && styles.selectedCard]}><View style={styles.cardHeader}><View><Text style={styles.cardTitle}>{commission.name}</Text><Text style={styles.muted}>{commission.description || 'Sem descrição'}</Text></View><Text style={styles.activeTag}>Ativa</Text></View><Pressable style={styles.outlineButton} onPress={() => deleteCommission(commission.id)}><Text style={styles.outlineText}>Excluir comissão</Text></Pressable></Pressable>)}
            {selectedCommission && <View style={styles.card}><Text style={styles.cardTitle}>Equipe: {selectedCommission.name}</Text><Text style={styles.hint}>Toque em um membro da organização para incluí-lo na comissão.</Text><View style={styles.userChoices}>{organizationMembers.map((user) => <Choice key={user.id} label={user.name} active={commissionTeam.some((member) => member.id === user.id)} onPress={() => addCommissionMember(user.id)} />)}</View><Text style={styles.label}>Membros atuais</Text>{commissionTeam.map((user) => <View key={user.id} style={styles.member}><View><Text style={styles.memberName}>{user.name}</Text><Text style={styles.muted}>{user.email}</Text></View><Pressable onPress={() => removeCommissionMember(user.id)}><Text style={styles.removeText}>Remover</Text></Pressable></View>)}</View>}
          </>
        )}

        {screen === 'profile' && (
          <>
            <View style={styles.card}><Text style={styles.cardTitle}>Dados pessoais</Text><Field label="Nome" value={profileForm.name} onChangeText={(name) => setProfileForm({ ...profileForm, name })} placeholder="Seu nome" /><Field label="E-mail" value={profileForm.email} onChangeText={(email) => setProfileForm({ ...profileForm, email })} placeholder="voce@email.com" keyboardType="email-address" /><Field label="Telefone" value={profileForm.phone} onChangeText={(phone) => setProfileForm({ ...profileForm, phone })} placeholder="(00) 00000-0000" keyboardType="phone-pad" /><Pressable style={styles.primaryButton} onPress={updateProfile}><Text style={styles.primaryButtonText}>Salvar dados</Text></Pressable></View>
            <View style={styles.card}><Text style={styles.cardTitle}>Trocar senha</Text><Field label="Senha atual" value={passwordForm.current} onChangeText={(current) => setPasswordForm({ ...passwordForm, current })} placeholder="Senha atual" secureTextEntry /><Field label="Nova senha" value={passwordForm.next} onChangeText={(next) => setPasswordForm({ ...passwordForm, next })} placeholder="Mínimo de 6 caracteres" secureTextEntry /><Field label="Confirmar nova senha" value={passwordForm.confirm} onChangeText={(confirm) => setPasswordForm({ ...passwordForm, confirm })} placeholder="Repita a nova senha" secureTextEntry /><Pressable style={styles.primaryButton} onPress={updatePassword}><Text style={styles.primaryButtonText}>Atualizar senha</Text></Pressable><Pressable style={styles.resetButton} onPress={recoverAccount}><Text style={styles.resetText}>Recuperar conta por e-mail</Text></Pressable></View>
            <View style={styles.card}><Text style={styles.cardTitle}>Tema preferido</Text><View style={styles.userChoices}><Choice label="Claro" active={(activeUser?.theme || 'LIGHT') === 'LIGHT'} onPress={() => setTheme('LIGHT')} /><Choice label="Escuro" active={activeUser?.theme === 'DARK'} onPress={() => setTheme('DARK')} /></View></View>
          </>
        )}

        {isAdmin && screen === 'system' && (
          <>
            <View style={styles.card}><Text style={styles.cardTitle}>Status do sistema</Text><Text style={styles.hint}>{data.system.initialized ? `Inicializado em ${new Date(data.system.initializedAt).toLocaleString('pt-BR')}` : 'Aguardando setup inicial.'}</Text>{data.system.subsystems.map((subsystem) => <View key={subsystem.id} style={styles.member}><View><Text style={styles.memberName}>{subsystem.name}</Text><Text style={styles.muted}>{SUBSYSTEM_LABELS[subsystem.status]}</Text></View><Pressable style={styles.smallButton} onPress={() => restartSubsystem(subsystem.id)}><Text style={styles.smallButtonText}>Reiniciar</Text></Pressable></View>)}</View>
            <View style={styles.card}><Text style={styles.cardTitle}>Relatório resumido</Text><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.users.length}</Text><Text style={styles.muted}>usuários</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.organizations.length}</Text><Text style={styles.muted}>organizações</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.commissions.length}</Text><Text style={styles.muted}>comissões</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.accessRequests.filter((request) => request.status === 'PENDING').length}</Text><Text style={styles.muted}>acessos pendentes</Text></View></View>
            <View style={styles.card}><Text style={styles.cardTitle}>Operações administrativas</Text><Pressable style={styles.primaryButton} onPress={initializeSystem}><Text style={styles.primaryButtonText}>Executar setup inicial</Text></Pressable><Pressable style={styles.outlineButton} onPress={resetDemo}><Text style={styles.outlineText}>Resetar sistema e dados locais</Text></Pressable></View>
          </>
        )}

        {isAdmin && <Pressable style={styles.resetButton} onPress={resetDemo}><Text style={styles.resetText}>Restaurar dados de demonstração</Text></Pressable>}
      </ScrollView>
    </SafeAreaView>
  );
}
