import { fetchSystemInfo } from '../services/api';
import { useContext, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../components/ActionPressable';
import { SUBSYSTEM_LABELS } from '../constants/status';
import { ThemeContext } from '../styles/theme';

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatUptime(seconds) {
  const total = Math.floor(Number(seconds) || 0);
  const days = Math.floor(total / 86400), hours = Math.floor((total % 86400) / 3600), minutes = Math.floor((total % 3600) / 60);
  return `${days ? `${days} d ` : ''}${hours} h ${minutes} min`;
}

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
  const [pending, setPending] = useState('');
  const loadDetails = () => fetchSystemInfo().then((d) => { setDetails(d); setError(''); }).catch((e) => setError(e.message));
  useEffect(() => { let active = true; fetchSystemInfo().then(d => active && setDetails(d)).catch(e => active && setError(e.message)); return () => { active = false; }; }, []);
  // Bloqueia os botões até o servidor responder.
  async function run(id, action) {
    if (pending) return;
    setPending(id);
    try { await action(); await loadDetails(); } finally { setPending(''); }
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status do sistema</Text>
        {error ? <Text style={styles.hint}>{error}</Text> : null}
        {details && <View>
          <Text style={styles.memberName}>{details.name || 'Synple API'} · versão {details.version}</Text>
          <Text style={styles.hint}>Servidor iniciado em {new Date(details.startedAt).toLocaleString('pt-BR')}</Text>
          <Text style={styles.hint}>Tempo online: {formatUptime(details.uptime)}</Text>
          {details.process && <Text style={styles.hint}>Processo {details.process.pid} · {details.process.runningIn} · {details.process.platform}/{details.process.arch} · Node {details.nodeVersion} · porta {details.process.port}</Text>}
          {details.host && <Text style={styles.hint}>Host: {details.host.hostname} · memória livre {formatBytes(details.host.freeMemoryBytes)} de {formatBytes(details.host.totalMemoryBytes)}</Text>}
          {details.memory && <Text style={styles.hint}>Memória da API: {formatBytes(details.memory.rssBytes)} (heap {formatBytes(details.memory.heapUsedBytes)})</Text>}
          {details.connections && <Text style={styles.hint}>Conexões: {details.connections.activeSessions} sessões ativas · {details.connections.databaseConnections ?? '—'} no banco · pool {details.connections.poolTotal ?? '—'} ({details.connections.poolIdle ?? '—'} livres)</Text>}
          {details.uploads && <Text style={styles.hint}>Uploads: {details.uploads.count} arquivos · {formatBytes(details.uploads.totalBytes)}</Text>}
          <Text style={styles.hint}>Banco {details.database.name || ''}: {details.database.status} · resposta {details.database.latencyMs} ms</Text>
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
              style={[styles.smallButton, !!pending && styles.disabledButton]}
              disabled={!!pending}
              onPress={() => run(subsystem.id, () => onRestartSubsystem(subsystem.id))}
            >
              <Text style={styles.smallButtonText}>{pending === subsystem.id ? 'Aguarde…' : 'Verificar'}</Text>
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
        <Pressable style={[styles.primaryButton, !!pending && styles.disabledButton]} disabled={!!pending} onPress={() => run('all', onInitializeSystem)}>
          <Text style={styles.primaryButtonText}>{pending === 'all' ? 'Consultando…' : 'Consultar disponibilidade real'}</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={onResetDemo}>
          <Text style={styles.outlineText}>Limpar cache e sair</Text>
        </Pressable>
      </View>
    </>
  );
}
