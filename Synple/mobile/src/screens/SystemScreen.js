import { useContext, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../components/ActionPressable';
import { SUBSYSTEM_LABELS } from '../constants/status';
import { ThemeContext } from '../styles/theme';
import { fetchSystemInformation, getApiBaseUrl } from '../services/api';

function bytes(value) {
  if (!Number.isFinite(Number(value))) return 'Indisponível';
  return `${(Number(value) / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}
function duration(seconds) {
  const s = Math.floor(seconds || 0);
  return `${Math.floor(s / 86400)}d ${Math.floor(s % 86400 / 3600)}h ${Math.floor(s % 3600 / 60)}min ${s % 60}s`;
}

export function SystemScreen({
  systemToken,
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
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refreshRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let pending = false;
    let controller;
    async function refresh() {
      if (pending) return;
      pending = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      setLoading(true);
      try {
        const result = await fetchSystemInformation(systemToken, controller.signal);
        if (mounted) { setInfo(result); setError(''); }
      } catch (err) {
        if (mounted) setError(err.name === 'AbortError' ? 'O servidor demorou para responder. Tente atualizar.' : err.message);
      } finally {
        clearTimeout(timeout);
        pending = false;
        if (mounted) setLoading(false);
      }
    }
    refreshRef.current = refresh;
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => { mounted = false; clearInterval(timer); controller?.abort(); refreshRef.current = null; };
  }, [systemToken]);

  function details(title, entries) {
    return <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {entries.map(([label, value]) => <View key={label} style={{ marginBottom: 10 }}>
        <Text style={styles.muted}>{label}</Text>
        <Text selectable style={styles.memberName}>{String(value ?? 'Indisponível')}</Text>
      </View>)}
    </View>;
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações do servidor</Text>
        <Text style={styles.hint}>Atualização a cada 15 segundos. Os dados são do servidor da API, não do celular.</Text>
        {info && <Text style={styles.muted}>Coletado em {new Date(info.timestamp).toLocaleString('pt-BR')}</Text>}
        {!!error && <Text accessibilityRole="alert" style={styles.hint}>{error}{info ? ' Os dados abaixo são da última consulta bem-sucedida.' : ''}</Text>}
        <Pressable style={styles.outlineButton} disabled={loading} onPress={() => refreshRef.current?.()}>
          <Text style={styles.outlineText}>{loading ? 'Atualizando…' : 'Atualizar informações'}</Text>
        </Pressable>
      </View>
      {info && <>
        {details('Identificação e execução', [
          ['Nome', info.name], ['Versão da API', info.version], ['ID do processo (PID)', info.pid],
          ['Onde está rodando', info.environment], ['Sistema operacional', info.platform],
          ['Node.js', info.runtime], ['Endereço acessado pelo app', getApiBaseUrl()],
          ['Interface / porta no servidor', info.listening], ['Nome do host', info.hostname],
          ['Tempo online na coleta', duration(info.uptimeSeconds)], ['Iniciado em', new Date(info.startedAt).toLocaleString('pt-BR')],
        ])}
        {details('Memória local do servidor', [
          ['Memória total do ambiente', bytes(info.memory.totalBytes)], ['Memória livre do ambiente', bytes(info.memory.freeBytes)],
          ['Memória usada pelo processo (RSS)', bytes(info.memory.processBytes)], ['Heap utilizado', bytes(info.memory.heapUsedBytes)],
        ])}
        {details('Conexões ativas', [
          ['Conexões TCP abertas (inclui keep-alive)', info.connections.tcp],
          ['Requisições HTTP em andamento (inclui esta consulta)', info.connections.requests],
          ['Conexões no pool da API', info.connections.dbTotal], ['Conexões ociosas no pool', info.connections.dbIdle],
          ['Pedidos aguardando conexão com o banco', info.connections.dbWaiting],
        ])}
        {details('Uploads', [['Serviço de arquivos', info.uploads.description]])}
        {details('Banco de dados', [
          ['Situação', info.database.status], ['Nome', info.database.name], ['PostgreSQL', info.database.version],
          ['Tamanho', bytes(info.database.bytes)], ['Latência da consulta', info.database.latencyMs == null ? null : `${info.database.latencyMs} ms`],
          ['Conexões com este banco', info.database.connections], ['Consultas ativas (inclui monitoramento)', info.database.active_queries],
          ...(info.database.error ? [['Detalhes', info.database.error]] : []),
        ])}
      </>}
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
