import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLogs } from '../../src/api';
import { maskData } from '../../src/masks';
import { colors, radius } from '../../src/theme';

const METODO_COR = {
  GET: '#3498db',
  POST: colors.planoPreco,
  PUT: '#f39c12',
  DELETE: colors.deleteBtn,
};

function formatarDataHora(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const dia = String(dt.getDate()).padStart(2, '0');
  const mes = String(dt.getMonth() + 1).padStart(2, '0');
  const hora = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  const seg = String(dt.getSeconds()).padStart(2, '0');
  return `${dia}/${mes} ${hora}:${min}:${seg}`;
}

function rotaResumida(rota) {
  return (rota || '').replace('/api/', '/');
}

export default function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroData, setFiltroData] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const filtros = {};
      if (filtroMetodo) filtros.metodo = filtroMetodo;
      if (filtroTipo) filtros.usuario_tipo = filtroTipo;
      if (filtroBusca.trim()) filtros.usuario_nome = filtroBusca.trim();
      if (filtroData && filtroData.length === 10) filtros.data = filtroData;
      const data = await getLogs(filtros);
      setLogs(data || []);
    } catch {
      setLogs([]);
    } finally {
      setCarregando(false);
    }
  }, [filtroMetodo, filtroTipo, filtroBusca, filtroData]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function limparFiltros() {
    setFiltroMetodo('');
    setFiltroTipo('');
    setFiltroBusca('');
    setFiltroData('');
  }

  const temFiltro = filtroMetodo || filtroTipo || filtroBusca || filtroData;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Auditoria</Text>

      {/* Filtros */}
      <View style={styles.filtros}>
        <TextInput
          style={styles.busca}
          placeholder="Buscar por usuário..."
          placeholderTextColor="#999"
          value={filtroBusca}
          onChangeText={setFiltroBusca}
        />
        <View style={styles.filtroRow}>
          <TextInput
            style={[styles.busca, { flex: 1 }]}
            placeholder="Data (AAAA-MM-DD)"
            placeholderTextColor="#999"
            value={filtroData}
            onChangeText={(v) => setFiltroData(maskData(v))}
            keyboardType="number-pad"
            maxLength={10}
          />
          {temFiltro ? (
            <Pressable style={styles.limparBtn} onPress={limparFiltros}>
              <Ionicons name="close-circle" size={22} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filtroRow}>
          {['', 'POST', 'PUT', 'DELETE', 'GET'].map((m) => {
            const ativo = filtroMetodo === m;
            return (
              <Pressable key={m} onPress={() => setFiltroMetodo(m)} style={[styles.chip, ativo && styles.chipAtivo]}>
                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{m || 'Todos'}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filtroRow}>
          {['', 'admin', 'professor', 'aluno'].map((t) => {
            const ativo = filtroTipo === t;
            return (
              <Pressable key={t} onPress={() => setFiltroTipo(t)} style={[styles.chip, ativo && styles.chipAtivo]}>
                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{t || 'Todos'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.contagem}>{logs.length} registros</Text>

      {/* Lista */}
      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : logs.length === 0 ? (
        <Text style={styles.empty}>Nenhum log encontrado.</Text>
      ) : (
        logs.map((log) => (
          <View key={log.id} style={styles.logItem}>
            <View style={styles.logTop}>
              <View style={[styles.metodoBadge, { backgroundColor: METODO_COR[log.metodo] || '#999' }]}>
                <Text style={styles.metodoTexto}>{log.metodo}</Text>
              </View>
              <Text style={styles.logStatus}>{log.status_code}</Text>
              <Text style={styles.logHora}>{formatarDataHora(log.data_hora)}</Text>
            </View>
            <Text style={styles.logRota}>{rotaResumida(log.rota)}</Text>
            <View style={styles.logBottom}>
              <Ionicons name="person-outline" size={14} color={colors.muted} />
              <Text style={styles.logUsuario}>
                {log.usuario_nome || 'Anônimo'}
                {log.usuario_tipo ? ` (${log.usuario_tipo})` : ''}
              </Text>
              {log.ip ? <Text style={styles.logIp}>{log.ip}</Text> : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.textDark, marginBottom: 16 },

  filtros: { gap: 10, marginBottom: 16 },
  busca: { borderWidth: 2, borderColor: '#ddd', borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15, backgroundColor: '#fff', color: '#333' },
  filtroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  limparBtn: { padding: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
  chipAtivo: { backgroundColor: colors.blue600, borderColor: colors.blue600 },
  chipTexto: { color: '#333', fontWeight: '600', fontSize: 12 },
  chipTextoAtivo: { color: '#fff' },

  contagem: { fontSize: 12, color: colors.muted, marginBottom: 10 },
  loading: { marginTop: 16 },
  empty: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },

  logItem: { backgroundColor: '#fff', borderRadius: radius.sm, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#eee' },
  logTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  metodoBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4 },
  metodoTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  logStatus: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  logHora: { fontSize: 11, color: colors.muted, marginLeft: 'auto' },
  logRota: { fontSize: 13, color: colors.textDark, fontFamily: 'monospace', marginBottom: 4 },
  logBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logUsuario: { fontSize: 12, color: colors.muted },
  logIp: { fontSize: 11, color: '#bbb', marginLeft: 'auto' },
});
