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
import { normalizeEmail, validateOrganization, validatePassword, validateUser } from './src/services/validation';
import { styles } from './src/styles/theme';

const createId = (prefix) => `${prefix}-${Date.now()}`;

export default function App() {
  const { data, isReady, setData, storageError } = useSynpleData();
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState('organizations');
  const [role, setRole] = useState('SYSTEM_ADMIN');
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
    setData((current) => ({
      ...current,
      organizations: [...current.organizations, { id: createId('org'), name, document, ownerId: activeUserId, status: 'PENDING' }],
    }));
    setOrganizationForm({ name: '', document: '' });
    Alert.alert('Solicitação enviada', 'A organização aguarda autorização do administrador do sistema.');
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
    setActiveUserId(user.id);
    setUserForm({ name: '', email: '' });
    Alert.alert('Cadastro concluído', 'Agora você pode solicitar acesso a uma organização aprovada.');
  }

  function requestAccess() {
    if (!selectedOrganization || selectedOrganization.status !== 'APPROVED') return;
    const existingRequest = data.accessRequests.find((request) => (
      request.organizationId === selectedOrganization.id && request.userId === activeUserId && request.status !== 'REJECTED'
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
    setData((current) => ({
      ...current,
      accessRequests: current.accessRequests.map((request) => (
        request.id === requestId ? { ...request, status } : request
      )),
    }));
  }

  function createCommission() {
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
    Alert.alert('Excluir comissão', 'A equipe vinculada também será removida.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => {
      setData((current) => ({ ...current, commissions: current.commissions.filter((commission) => commission.id !== commissionId), commissionMembers: current.commissionMembers.filter((member) => member.commissionId !== commissionId) }));
      setSelectedCommissionId('');
    } }]);
  }

  function addCommissionMember(userId) {
    if (!selectedCommission || data.commissionMembers.some((member) => member.commissionId === selectedCommission.id && member.userId === userId)) return;
    setData((current) => ({ ...current, commissionMembers: [...current.commissionMembers, { commissionId: selectedCommission.id, userId }] }));
  }

  function removeCommissionMember(userId) {
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

  const pendingRequests = data.accessRequests.filter((request) => request.organizationId === selectedOrganizationId && request.status === 'PENDING');
  const commissionTeam = data.commissionMembers.filter((member) => member.commissionId === selectedCommissionId).map((member) => data.users.find((user) => user.id === member.userId)).filter(Boolean);

  if (!isReady || showSplash) {
    return <SafeAreaView style={styles.loading}><Image source={require('./assets/synple-splash.png')} style={styles.splashLogo} resizeMode="contain" /><Text style={styles.loadingText}>Synple</Text><Text style={styles.loadingCaption}>Organize. Conecte. Simplifique.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.safeArea, activeUser?.theme === 'DARK' && styles.darkSurface]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerIdentity}><Image source={require('./assets/synple-splash.png')} style={styles.headerLogo} resizeMode="contain" /><View><Text style={styles.brand}>Synple</Text><Text style={styles.subtitle}>Gestão de organizações</Text></View></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{activeUser?.name?.charAt(0) || 'S'}</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Visão de demonstração</Text>
        <View style={styles.roleRow}>
          <Choice label="Sistema" active={role === 'SYSTEM_ADMIN'} onPress={() => setRole('SYSTEM_ADMIN')} />
          <Choice label="Organização" active={role === 'ORG_ADMIN'} onPress={() => setRole('ORG_ADMIN')} />
          <Choice label="Usuário" active={role === 'USER'} onPress={() => setRole('USER')} />
        </View>

        <View style={styles.navigation}>
          <Choice label="Organizações" active={screen === 'organizations'} onPress={() => setScreen('organizations')} />
          <Choice label="Usuários" active={screen === 'users'} onPress={() => setScreen('users')} />
          <Choice label="Acessos" active={screen === 'access'} onPress={() => setScreen('access')} />
          <Choice label="Comissões" active={screen === 'commissions'} onPress={() => setScreen('commissions')} />
          <Choice label="Perfil" active={screen === 'profile'} onPress={openProfile} />
          <Choice label="Sistema" active={screen === 'system'} onPress={() => setScreen('system')} />
        </View>

        {screen === 'organizations' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cadastrar organização</Text>
              <Text style={styles.hint}>O cadastro fica pendente até a análise do administrador do sistema.</Text>
              <Field label="Nome da organização" value={organizationForm.name} onChangeText={(name) => setOrganizationForm({ ...organizationForm, name })} placeholder="Ex.: Empresa Synple" />
              <Field label="CNPJ" value={organizationForm.document} onChangeText={(document) => setOrganizationForm({ ...organizationForm, document })} placeholder="00.000.000/0000-00" keyboardType="numeric" />
              <Pressable style={styles.primaryButton} onPress={createOrganization}><Text style={styles.primaryButtonText}>Enviar cadastro</Text></Pressable>
            </View>

            <Text style={styles.sectionTitle}>{role === 'SYSTEM_ADMIN' ? 'Gerenciamento de organizações' : 'Organizações cadastradas'}</Text>
            {data.organizations.map((organization) => (
              <View key={organization.id} style={styles.card}>
                <View style={styles.cardHeader}><View><Text style={styles.cardTitle}>{organization.name}</Text><Text style={styles.muted}>{organization.document}</Text></View><StatusBadge status={organization.status} /></View>
                {role === 'SYSTEM_ADMIN' && organization.status === 'PENDING' && <View style={styles.actionRow}><Pressable style={styles.approveButton} onPress={() => changeOrganizationStatus(organization.id, 'APPROVED')}><Text style={styles.actionText}>Autorizar</Text></Pressable><Pressable style={styles.rejectButton} onPress={() => changeOrganizationStatus(organization.id, 'REJECTED')}><Text style={styles.rejectText}>Rejeitar</Text></Pressable></View>}
                {role === 'SYSTEM_ADMIN' && organization.status === 'APPROVED' && <Pressable style={styles.outlineButton} onPress={() => changeOrganizationStatus(organization.id, 'REVOKED')}><Text style={styles.outlineText}>Revogar autorização</Text></Pressable>}
              </View>
            ))}
          </>
        )}

        {screen === 'users' && (
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Solicitar acesso</Text>
              <Text style={styles.hint}>Usuário selecionado: {activeUser?.name}</Text>
              <Text style={styles.label}>Organização aprovada</Text>
              <View style={styles.userChoices}>{approvedOrganizations.map((organization) => <Choice key={organization.id} label={organization.name} active={selectedOrganizationId === organization.id} onPress={() => setSelectedOrganizationId(organization.id)} />)}</View>
              <Pressable style={styles.primaryButton} onPress={requestAccess}><Text style={styles.primaryButtonText}>Solicitar acesso</Text></Pressable>
            </View>

            {role === 'ORG_ADMIN' && <>
              <Text style={styles.sectionTitle}>Solicitações pendentes</Text>
              {pendingRequests.length === 0 && <Text style={styles.empty}>Não há solicitações pendentes nesta organização.</Text>}
              {pendingRequests.map((request) => {
                const user = data.users.find((item) => item.id === request.userId);
                return <View key={request.id} style={styles.card}><Text style={styles.cardTitle}>{user?.name}</Text><Text style={styles.muted}>{user?.email}</Text><View style={styles.actionRow}><Pressable style={styles.approveButton} onPress={() => changeAccessStatus(request.id, 'APPROVED')}><Text style={styles.actionText}>Aprovar</Text></Pressable><Pressable style={styles.rejectButton} onPress={() => changeAccessStatus(request.id, 'REJECTED')}><Text style={styles.rejectText}>Rejeitar</Text></Pressable></View></View>;
              })}
              <Text style={styles.sectionTitle}>Usuários da organização</Text>
            </>}

            {data.accessRequests.filter((request) => request.organizationId === selectedOrganizationId && request.status === 'APPROVED').map((request) => {
              const user = data.users.find((item) => item.id === request.userId);
              return <View key={request.id} style={styles.member}><View><Text style={styles.memberName}>{user?.name}</Text><Text style={styles.muted}>{user?.email}</Text></View><StatusBadge status="APPROVED" /></View>;
            })}
          </>
        )}

        {screen === 'commissions' && (
          <>
            {role === 'ORG_ADMIN' && <View style={styles.card}>
              <Text style={styles.cardTitle}>Nova comissão</Text>
              <Text style={styles.hint}>Comissões são grupos de trabalho vinculados a uma organização.</Text>
              <Text style={styles.label}>Organização</Text>
              <View style={styles.userChoices}>{approvedOrganizations.map((organization) => <Choice key={organization.id} label={organization.name} active={selectedOrganizationId === organization.id} onPress={() => setSelectedOrganizationId(organization.id)} />)}</View>
              <Field label="Nome da comissão" value={commissionForm.name} onChangeText={(name) => setCommissionForm({ ...commissionForm, name })} placeholder="Ex.: Comissão de Eventos" />
              <Field label="Descrição" value={commissionForm.description} onChangeText={(description) => setCommissionForm({ ...commissionForm, description })} placeholder="Objetivo do grupo de trabalho" />
              <Pressable style={styles.primaryButton} onPress={createCommission}><Text style={styles.primaryButtonText}>Cadastrar comissão</Text></Pressable>
            </View>}
            <Text style={styles.sectionTitle}>Comissões da organização</Text>
            {organizationCommissions.length === 0 && <Text style={styles.empty}>Ainda não há comissões cadastradas.</Text>}
            {organizationCommissions.map((commission) => <Pressable key={commission.id} onPress={() => setSelectedCommissionId(commission.id)} style={[styles.card, selectedCommissionId === commission.id && styles.selectedCard]}><View style={styles.cardHeader}><View><Text style={styles.cardTitle}>{commission.name}</Text><Text style={styles.muted}>{commission.description || 'Sem descrição'}</Text></View><Text style={styles.activeTag}>Ativa</Text></View>{role === 'ORG_ADMIN' && <Pressable style={styles.outlineButton} onPress={() => deleteCommission(commission.id)}><Text style={styles.outlineText}>Excluir comissão</Text></Pressable>}</Pressable>)}
            {role === 'ORG_ADMIN' && selectedCommission && <View style={styles.card}><Text style={styles.cardTitle}>Equipe: {selectedCommission.name}</Text><Text style={styles.hint}>Toque em um membro da organização para incluí-lo na comissão.</Text><View style={styles.userChoices}>{organizationMembers.map((user) => <Choice key={user.id} label={user.name} active={commissionTeam.some((member) => member.id === user.id)} onPress={() => addCommissionMember(user.id)} />)}</View><Text style={styles.label}>Membros atuais</Text>{commissionTeam.map((user) => <View key={user.id} style={styles.member}><View><Text style={styles.memberName}>{user.name}</Text><Text style={styles.muted}>{user.email}</Text></View><Pressable onPress={() => removeCommissionMember(user.id)}><Text style={styles.removeText}>Remover</Text></Pressable></View>)}</View>}
          </>
        )}

        {screen === 'profile' && (
          <>
            <View style={styles.card}><Text style={styles.cardTitle}>Dados pessoais</Text><Field label="Nome" value={profileForm.name} onChangeText={(name) => setProfileForm({ ...profileForm, name })} placeholder="Seu nome" /><Field label="E-mail" value={profileForm.email} onChangeText={(email) => setProfileForm({ ...profileForm, email })} placeholder="voce@email.com" keyboardType="email-address" /><Field label="Telefone" value={profileForm.phone} onChangeText={(phone) => setProfileForm({ ...profileForm, phone })} placeholder="(00) 00000-0000" keyboardType="phone-pad" /><Pressable style={styles.primaryButton} onPress={updateProfile}><Text style={styles.primaryButtonText}>Salvar dados</Text></Pressable></View>
            <View style={styles.card}><Text style={styles.cardTitle}>Trocar senha</Text><Field label="Senha atual" value={passwordForm.current} onChangeText={(current) => setPasswordForm({ ...passwordForm, current })} placeholder="Senha atual" secureTextEntry /><Field label="Nova senha" value={passwordForm.next} onChangeText={(next) => setPasswordForm({ ...passwordForm, next })} placeholder="Mínimo de 6 caracteres" secureTextEntry /><Field label="Confirmar nova senha" value={passwordForm.confirm} onChangeText={(confirm) => setPasswordForm({ ...passwordForm, confirm })} placeholder="Repita a nova senha" secureTextEntry /><Pressable style={styles.primaryButton} onPress={updatePassword}><Text style={styles.primaryButtonText}>Atualizar senha</Text></Pressable><Pressable style={styles.resetButton} onPress={recoverAccount}><Text style={styles.resetText}>Recuperar conta por e-mail</Text></Pressable></View>
            <View style={styles.card}><Text style={styles.cardTitle}>Tema preferido</Text><View style={styles.userChoices}><Choice label="Claro" active={(activeUser?.theme || 'LIGHT') === 'LIGHT'} onPress={() => setTheme('LIGHT')} /><Choice label="Escuro" active={activeUser?.theme === 'DARK'} onPress={() => setTheme('DARK')} /></View></View>
          </>
        )}

        {screen === 'system' && (
          <>
            <View style={styles.card}><Text style={styles.cardTitle}>Status do sistema</Text><Text style={styles.hint}>{data.system.initialized ? `Inicializado em ${new Date(data.system.initializedAt).toLocaleString('pt-BR')}` : 'Aguardando setup inicial.'}</Text>{data.system.subsystems.map((subsystem) => <View key={subsystem.id} style={styles.member}><View><Text style={styles.memberName}>{subsystem.name}</Text><Text style={styles.muted}>{SUBSYSTEM_LABELS[subsystem.status]}</Text></View>{role === 'SYSTEM_ADMIN' && <Pressable style={styles.smallButton} onPress={() => restartSubsystem(subsystem.id)}><Text style={styles.smallButtonText}>Reiniciar</Text></Pressable>}</View>)}</View>
            <View style={styles.card}><Text style={styles.cardTitle}>Relatório resumido</Text><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.users.length}</Text><Text style={styles.muted}>usuários</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.organizations.length}</Text><Text style={styles.muted}>organizações</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.commissions.length}</Text><Text style={styles.muted}>comissões</Text></View><View style={styles.reportRow}><Text style={styles.reportNumber}>{data.accessRequests.filter((request) => request.status === 'PENDING').length}</Text><Text style={styles.muted}>acessos pendentes</Text></View></View>
            {role === 'SYSTEM_ADMIN' && <View style={styles.card}><Text style={styles.cardTitle}>Operações administrativas</Text><Pressable style={styles.primaryButton} onPress={initializeSystem}><Text style={styles.primaryButtonText}>Executar setup inicial</Text></Pressable><Pressable style={styles.outlineButton} onPress={resetDemo}><Text style={styles.outlineText}>Resetar sistema e dados locais</Text></Pressable></View>}
          </>
        )}

        <Pressable style={styles.resetButton} onPress={resetDemo}><Text style={styles.resetText}>Restaurar dados de demonstração</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
