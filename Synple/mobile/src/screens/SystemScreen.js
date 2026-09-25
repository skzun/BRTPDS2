import { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SUBSYSTEM_LABELS } from '../constants/status';
import { ThemeContext } from '../styles/theme';

export function SystemScreen({
  system,
  usersCount,
  organizationsCount,
  commissionsCount,
  pendingRequestsCount,
  onRestartSubsystem,
  onInitializeSystem,
  onResetDemo,
}) {
  const { styles } = useContext(ThemeContext);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status do sistema</Text>
        <Text style={styles.hint}>
          {system.initialized
            ? `Inicializado em ${new Date(system.initializedAt).toLocaleString('pt-BR')}`
            : 'Aguardando setup inicial.'}
        </Text>
        {system.subsystems.map((subsystem) => (
          <View key={subsystem.id} style={styles.member}>
            <View>
              <Text style={styles.memberName}>{subsystem.name}</Text>
              <Text style={styles.muted}>{SUBSYSTEM_LABELS[subsystem.status]}</Text>
            </View>
            <Pressable
              style={styles.smallButton}
              onPress={() => onRestartSubsystem(subsystem.id)}
            >
              <Text style={styles.smallButtonText}>Reiniciar</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Relatório resumido</Text>
        <View style={styles.reportRow}>
          <Text style={styles.reportNumber}>{usersCount}</Text>
          <Text style={styles.muted}>usuários</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportNumber}>{organizationsCount}</Text>
          <Text style={styles.muted}>organizações</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportNumber}>{commissionsCount}</Text>
          <Text style={styles.muted}>comissões</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportNumber}>{pendingRequestsCount}</Text>
          <Text style={styles.muted}>acessos pendentes</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Operações administrativas</Text>
        <Pressable style={styles.primaryButton} onPress={onInitializeSystem}>
          <Text style={styles.primaryButtonText}>Executar setup inicial</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={onResetDemo}>
          <Text style={styles.outlineText}>Resetar sistema e dados locais</Text>
        </Pressable>
      </View>
    </>
  );
}
