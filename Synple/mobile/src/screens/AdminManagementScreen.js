import { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBadge } from '../components/FormControls';
import { ThemeContext } from '../styles/theme';

export function AdminManagementScreen({
  organizations,
  users,
  activeUserId,
  onChangeOrganizationStatus,
  onRemoveOrganization,
  onRemoveUser,
}) {
  const { styles } = useContext(ThemeContext);

  return (
    <>
      {/* 1. Gestão de Organizações */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Organizações</Text>
        <Text style={styles.hint}>Aprovar, recusar ou remover organizações do aplicativo.</Text>
        {organizations.map((organization) => {
          const ceo = users.find((user) => user.id === organization.ownerId);
          return (
            <View key={organization.id} style={styles.member}>
              <View>
                <Text style={styles.memberName}>{organization.name}</Text>
                <Text style={styles.muted}>{organization.document}</Text>
                <Text style={styles.muted}>Administrador: {ceo?.name || 'Não identificado'}</Text>
                <StatusBadge status={organization.status} />
              </View>
              <View>
                <View style={styles.actionRow}>
                  {organization.status === 'PENDING' && (
                    <>
                      <Pressable
                        style={styles.approveButton}
                        onPress={() => onChangeOrganizationStatus(organization.id, 'APPROVED')}
                      >
                        <Text style={styles.actionText}>Aprovar</Text>
                      </Pressable>
                      <Pressable
                        style={styles.rejectButton}
                        onPress={() => onChangeOrganizationStatus(organization.id, 'REJECTED')}
                      >
                        <Text style={styles.rejectText}>Recusar</Text>
                      </Pressable>
                    </>
                  )}
                </View>
                <Pressable
                  style={styles.outlineButton}
                  onPress={() => onRemoveOrganization(organization.id)}
                >
                  <Text style={styles.outlineText}>Remover</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {/* 2. Gestão de Usuários */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Usuários</Text>
        <Text style={styles.hint}>
          Gerencie as contas cadastradas. A conta administrativa ativa é protegida contra remoção.
        </Text>
        {users.map((user) => {
          const isUserOrgAdmin = organizations.some(
            (organization) => organization.ownerId === user.id && organization.status === 'APPROVED'
          );
          const roleLabel =
            user.systemRole === 'SYSTEM_ADMIN'
              ? 'Administrador do sistema'
              : isUserOrgAdmin
              ? 'Administrador da organização'
              : 'Usuário';

          return (
            <View key={user.id} style={styles.member}>
              <View>
                <Text style={styles.memberName}>{user.name}</Text>
                <Text style={styles.muted}>{user.email}</Text>
                <Text style={styles.muted}>{roleLabel}</Text>
              </View>
              {user.id !== activeUserId && user.systemRole !== 'SYSTEM_ADMIN' && (
                <Pressable
                  style={styles.outlineButton}
                  onPress={() => onRemoveUser(user.id)}
                >
                  <Text style={styles.outlineText}>Remover</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </>
  );
}
