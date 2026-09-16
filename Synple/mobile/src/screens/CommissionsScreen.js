import { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Choice, Field } from '../components/FormControls';
import { COMMISSION_TYPES } from '../constants/status';
import { ThemeContext } from '../styles/theme';

export function CommissionsScreen({
  approvedOwnedOrganizations,
  selectedOrganizationId,
  setSelectedOrganizationId,
  selectedOrganization,
  commissionForm,
  setCommissionForm,
  onCreateCommission,
  editingCommissionId,
  setEditingCommissionId,
  editCommissionForm,
  setEditCommissionForm,
  onSaveEditCommission,
  onCancelEditCommission,
  organizationCommissions,
  selectedCommissionId,
  setSelectedCommissionId,
  onStartEditCommission,
  onToggleCommissionStatus,
  onDeleteCommission,
  selectedCommission,
  commissionTeam,
  onToggleCommissionMemberRole,
  onRemoveCommissionMember,
  availableOrgMembers,
  onAddCommissionMember,
  data,
}) {
  const { styles } = useContext(ThemeContext);

  return (
    <>
      {/* Seletor de organização se tiver mais de uma */}
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
        <Pressable style={styles.primaryButton} onPress={onCreateCommission}>
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
            <Pressable style={styles.approveButton} onPress={onSaveEditCommission}>
              <Text style={styles.actionText}>Salvar</Text>
            </Pressable>
            <Pressable style={styles.rejectButton} onPress={onCancelEditCommission}>
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
                onPress={() => onStartEditCommission(commission)}
              >
                <Text style={styles.secondaryButtonText}>Editar</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => onToggleCommissionStatus(commission.id)}
              >
                <Text style={styles.secondaryButtonText}>
                  {commission.status === 'INACTIVE' ? 'Ativar' : 'Desativar'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.outlineButton}
                onPress={() => onDeleteCommission(commission.id)}
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
                  onPress={() => onToggleCommissionMemberRole(member.id)}
                >
                  <Text style={styles.smallButtonText}>
                    {member.commissionRole === 'COORDINATOR' ? 'Tornar membro' : 'Tornar coord.'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => onRemoveCommissionMember(member.id)}>
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
                  onPress={() => onAddCommissionMember(user.id)}
                >
                  <Text style={styles.actionText}>+ Adicionar</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}
    </>
  );
}
