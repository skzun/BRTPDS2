import { fetchSystemInfo } from '../services/api';
import { useContext, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../components/ActionPressable';
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
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; fetchSystemInfo().then(d => active && setDetails(d)).catch(e => active && setError(e.message)); return () => { active = false; }; }, []);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status do sistema</Text>
        {error ? <Text style={styles.hint}>{error}</Text> : null}
        {details && <View>
          <Text style={styles.hint}>Servidor iniciado em {new Date(details.startedAt).toLocaleString('pt-BR')}</Text>
          <Text style={styles.hint}>Disponível há {Math.floor(details.uptime)} segundos · API {details.version}</Text>
          <Text style={styles.hint}>Banco: {details.database.status} · resposta {details.database.latencyMs} ms</Text>
          <Text style={styles.hint}>{details.database.version}</Text>
        </View>}
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
              <Text style={styles.smallButtonText}>Verificar</Text>
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
          <Text style={styles.primaryButtonText}>Consultar disponibilidade real</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={onResetDemo}>
          <Text style={styles.outlineText}>Limpar cache e sair</Text>
        </Pressable>
      </View>
    </>
  );
}
