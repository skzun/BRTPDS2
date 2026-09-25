import { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Choice, Field, StatusBadge } from '../components/FormControls';
import { formatCNPJ } from '../services/formatters';
import { ThemeContext } from '../styles/theme';

export function MyOrganizationScreen({
  isSystemAdmin,
  isOrgAdmin,
  activeUserId,
  activeUser,
  organizationForm,
  setOrganizationForm,
  onCreateOrganization,
  requestableOrganizations,
  selectedOrganizationId,
  setSelectedOrganizationId,
  data,
  onRequestAccess,
  approvedOwnedOrganizations,
  organizationCommissions,
  onNavigateToCommissions,
  organizationPendingRequests,
  onChangeAccessStatus,
  selectedOrganization,
  organizationApprovedRequests,
  onUpdateOrganizationRole,
  onRemoveOrganizationMember,
  userRequests,
}) {
  const { styles } = useContext(ThemeContext);

  return (
    <>
      {/* 1. Formulário de Criação de Organização */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Criar organização</Text>
        <Text style={styles.hint}>
          Após a aprovação do administrador do sistema, você será o administrador desta organização e poderá gerenciar acessos e comissões.
        </Text>
        <Field
          label="Nome da organização"
          value={organizationForm.name}
          onChangeText={(name) => setOrganizationForm({ ...organizationForm, name })}
          placeholder="Ex.: Empresa Synple"
        />
        <Field
          label="CNPJ"
          value={organizationForm.document}
          onChangeText={(document) => setOrganizationForm({ ...organizationForm, document: formatCNPJ(document) })}
          placeholder="00.000.000/0000-00"
          keyboardType="numeric"
        />
        <Pressable style={styles.primaryButton} onPress={onCreateOrganization}>
          <Text style={styles.primaryButtonText}>Enviar cadastro</Text>
        </Pressable>
      </View>

      {/* 2. Solicitar Acesso (para quem não é Admin da organização) */}
      {!isSystemAdmin && !isOrgAdmin && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Solicitar acesso</Text>
          <Text style={styles.hint}>Usuário selecionado: {activeUser?.name}</Text>
          <Text style={styles.label}>Organização aprovada</Text>
          <View style={styles.userChoices}>
            {requestableOrganizations.map((organization) => (
              <Choice
                key={organization.id}
                label={organization.name}
                active={selectedOrganizationId === organization.id}
                onPress={() => setSelectedOrganizationId(organization.id)}
              />
            ))}
          </View>
          {requestableOrganizations.length === 0 ? (
            <Text style={styles.empty}>Não há outras organizações aprovadas para solicitar acesso.</Text>
          ) : (() => {
            const req = data.accessRequests.find(
              (r) => r.organizationId === selectedOrganizationId && r.userId === activeUserId && ['PENDING', 'APPROVED'].includes(r.status)
            );
            if (req?.status === 'APPROVED') {
              return <Text style={{ color: '#10B981', fontWeight: 'bold', marginTop: 8 }}>✓ Você já é membro aprovado desta organização.</Text>;
            }
            if (req?.status === 'PENDING') {
              return <Text style={{ color: '#F59E0B', fontWeight: 'bold', marginTop: 8 }}>⏳ Sua solicitação para esta organização está aguardando aprovação.</Text>;
            }
            return (
              <Pressable style={styles.primaryButton} onPress={() => onRequestAccess(selectedOrganizationId)}>
                <Text style={styles.primaryButtonText}>Solicitar acesso</Text>
              </Pressable>
            );
          })()}
        </View>
      )}

      {/* 3. Painel do Administrador da Organização */}
      {isOrgAdmin && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Organização administrada</Text>
            <Text style={styles.hint}>Selecione a organização para ver pedidos e membros.</Text>
            <View style={styles.userChoices}>
              {approvedOwnedOrganizations.map((organization) => (
                <Choice
                  key={organization.id}
                  label={organization.name}
                  active={selectedOrganizationId === organization.id}
                  onPress={() => setSelectedOrganizationId(organization.id)}
                />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Comissões e grupos de trabalho</Text>
                <Text style={styles.hint}>{organizationCommissions.length} comissão(ões) ou grupo(s) cadastrado(s).</Text>
              </View>
            </View>
            <Pressable style={styles.primaryButton} onPress={onNavigateToCommissions}>
              <Text style={styles.primaryButtonText}>Gerenciar comissões e equipe</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Solicitações pendentes</Text>
          {organizationPendingRequests.length === 0 && (
            <Text style={styles.empty}>Não há solicitações pendentes para esta organização.</Text>
          )}
          {organizationPendingRequests.map((request) => {
            const user = data.users.find((item) => item.id === request.userId);
            const organization = data.organizations.find((item) => item.id === request.organizationId);
            return (
              <View key={request.id} style={styles.card}>
                <Text style={styles.cardTitle}>{user?.name}</Text>
                <Text style={styles.muted}>{organization?.name}</Text>
                <Text style={styles.memberDetail}>E-mail: {user?.email || 'Não informado'}</Text>
                <Text style={styles.memberDetail}>Telefone: {user?.phone || 'Não informado'}</Text>
                <View style={styles.actionRow}>
                  <Pressable style={styles.approveButton} onPress={() => onChangeAccessStatus(request.id, 'APPROVED')}>
                    <Text style={styles.actionText}>Aprovar</Text>
                  </Pressable>
                  <Pressable style={styles.rejectButton} onPress={() => onChangeAccessStatus(request.id, 'REJECTED')}>
                    <Text style={styles.rejectText}>Recusar</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Text style={styles.sectionTitle}>Membros da organização</Text>
          {selectedOrganization && (
            <View style={styles.member}>
              <View>
                <Text style={styles.memberName}>{data.users.find((user) => user.id === selectedOrganization.ownerId)?.name}</Text>
                <Text style={styles.muted}>Administrador da organização</Text>
              </View>
              <Text style={styles.ownerTag}>Admin da org</Text>
            </View>
          )}
          {organizationApprovedRequests.length === 0 && (
            <Text style={styles.empty}>Ainda não há membros aprovados.</Text>
          )}
          {organizationApprovedRequests.map((request) => {
            const user = data.users.find((item) => item.id === request.userId);
            const organizationCommissionsForUser = data.commissionMembers
              .filter((member) => member.userId === request.userId)
              .map((member) => data.commissions.find((commission) => commission.id === member.commissionId && commission.organizationId === selectedOrganizationId))
              .filter(Boolean);

            return (
              <View key={request.id} style={styles.card}>
                <Text style={styles.cardTitle}>{user?.name}</Text>
                <Text style={styles.memberDetail}>E-mail: {user?.email || 'Não informado'}</Text>
                <Text style={styles.memberDetail}>Telefone: {user?.phone || 'Não informado'}</Text>
                <Text style={styles.label}>Cargo na organização</Text>
                <View style={styles.userChoices}>
                  <Choice
                    label="Membro"
                    active={(request.organizationRole || 'MEMBER') === 'MEMBER'}
                    onPress={() => onUpdateOrganizationRole(request.id, 'MEMBER')}
                  />
                  <Choice
                    label="Coordenador"
                    active={request.organizationRole === 'COORDINATOR'}
                    onPress={() => onUpdateOrganizationRole(request.id, 'COORDINATOR')}
                  />
                </View>
                <Text style={styles.memberDetail}>
                  Comissões: {organizationCommissionsForUser.map((commission) => commission.name).join(', ') || 'Nenhuma'}
                </Text>
                <Pressable style={styles.outlineButton} onPress={() => onRemoveOrganizationMember(request.id)}>
                  <Text style={styles.outlineText}>Remover da organização</Text>
                </Pressable>
              </View>
            );
          })}
        </>
      )}

      {/* 4. Minhas Solicitações (para usuários normais) */}
      {!isSystemAdmin && !isOrgAdmin && (
        <>
          <Text style={styles.sectionTitle}>Minhas solicitações</Text>
          {userRequests.length === 0 && <Text style={styles.empty}>Você ainda não possui solicitações.</Text>}
          {userRequests.map((request) => {
            const user = data.users.find((item) => item.id === request.userId);
            const organization = data.organizations.find((item) => item.id === request.organizationId);
            const administrator = data.users.find((item) => item.id === organization?.ownerId);
            return (
              <View key={request.id} style={styles.member}>
                <View>
                  <Text style={styles.memberName}>{organization?.name}</Text>
                  <Text style={styles.muted}>Administrador: {administrator?.name || 'Não identificado'}</Text>
                  <Text style={styles.muted}>{user?.email}</Text>
                </View>
                <StatusBadge status={request.status} />
              </View>
            );
          })}
        </>
      )}
    </>
  );
}
