import { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Field, StatusBadge } from '../components/FormControls';
import { ThemeContext } from '../styles/theme';

export function OrganizationsScreen({
  searchableOrganizations,
  organizationSearch,
  setOrganizationSearch,
  activeUserId,
  accessRequests,
  onRequestAccess,
}) {
  const { styles } = useContext(ThemeContext);

  return (
    <>
      <Text style={styles.sectionTitle}>Organizações</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>Encontre organizações disponíveis para participar.</Text>
        <Field
          label="Pesquisar"
          value={organizationSearch}
          onChangeText={setOrganizationSearch}
          placeholder="Nome ou CNPJ"
        />
      </View>

      {searchableOrganizations.length === 0 && (
        <Text style={styles.empty}>Nenhuma organização encontrada.</Text>
      )}

      {searchableOrganizations.map((organization) => {
        const isOwner = organization.ownerId === activeUserId;
        const userReq = accessRequests.find(
          (r) =>
            r.organizationId === organization.id &&
            r.userId === activeUserId &&
            ['PENDING', 'APPROVED'].includes(r.status)
        );

        return (
          <View key={organization.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{organization.name}</Text>
                <Text style={styles.muted}>{organization.document}</Text>
              </View>
              <StatusBadge status={organization.status} />
            </View>

            {isOwner && <Text style={styles.ownerTag}>Você é o administrador</Text>}

            {!isOwner && userReq?.status === 'APPROVED' && (
              <Text style={{ color: '#10B981', fontWeight: 'bold', marginTop: 8 }}>
                ✓ Membro aprovado
              </Text>
            )}

            {!isOwner && userReq?.status === 'PENDING' && (
              <Text style={{ color: '#F59E0B', fontWeight: 'bold', marginTop: 8 }}>
                ⏳ Solicitação enviada (aguardando aprovação)
              </Text>
            )}

            {!isOwner && !userReq && (
              <Pressable
                style={styles.smallButton}
                onPress={() => onRequestAccess(organization.id)}
              >
                <Text style={styles.smallButtonText}>Solicitar entrada</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </>
  );
}
