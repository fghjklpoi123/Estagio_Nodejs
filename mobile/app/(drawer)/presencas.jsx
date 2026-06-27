import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listarCheckins, totalCheckinsHoje } from '../../src/api';
import { maskData } from '../../src/masks';
import { colors, radius } from '../../src/theme';

function formatarDataHora(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const dia = String(dt.getDate()).padStart(2, '0');
  const mes = String(dt.getMonth() + 1).padStart(2, '0');
  const ano = dt.getFullYear();
  const hora = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} às ${hora}:${min}`;
}

export default function PresencasScreen() {
  const [checkins, setCheckins] = useState([]);
  const [totalHoje, setTotalHoje] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const filtros = {};
      if (filtroData && filtroData.length === 10) filtros.data = filtroData;

      const [checkinsData, hojeData] = await Promise.all([
        listarCheckins(filtros),
        totalCheckinsHoje(),
      ]);
      setCheckins(checkinsData || []);
      setTotalHoje(hojeData?.total || 0);
    } catch {
      setCheckins([]);
    } finally {
      setCarregando(false);
    }
  }, [filtroData]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const checkinsFiltrados = checkins.filter((c) => {
    if (!busca.trim()) return true;
    return (c.aluno_nome || '').toLowerCase().includes(busca.trim().toLowerCase());
  });

  function limparFiltro() {
    setFiltroData('');
    setBusca('');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Presenças</Text>

      {/* Card resumo */}
      <View style={styles.resumoRow}>
        <View style={styles.resumoCard}>
          <Ionicons name="people-outline" size={28} color={colors.blue600} />
          <Text style={styles.resumoNumero}>{totalHoje}</Text>
          <Text style={styles.resumoLabel}>check-ins hoje</Text>
        </View>
        <View style={styles.resumoCard}>
          <Ionicons name="list-outline" size={28} color={colors.planoPreco} />
          <Text style={styles.resumoNumero}>{checkinsFiltrados.length}</Text>
          <Text style={styles.resumoLabel}>registros exibidos</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        <TextInput
          style={styles.busca}
          placeholder="Buscar por aluno..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        <View style={styles.filtroDataRow}>
          <TextInput
            style={[styles.busca, styles.filtroDataInput]}
            placeholder="Filtrar data (AAAA-MM-DD)"
            placeholderTextColor="#999"
            value={filtroData}
            onChangeText={(v) => setFiltroData(maskData(v))}
            keyboardType="number-pad"
            maxLength={10}
          />
          {(filtroData || busca) ? (
            <Pressable style={styles.limparBtn} onPress={limparFiltro}>
              <Ionicons name="close-circle" size={22} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Lista */}
      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : checkinsFiltrados.length === 0 ? (
        <Text style={styles.empty}>Nenhum check-in encontrado.</Text>
      ) : (
        checkinsFiltrados.map((c) => (
          <View key={c.id} style={styles.checkinItem}>
            <View style={styles.checkinIcone}>
              <Ionicons name="checkmark-circle" size={22} color={colors.planoPreco} />
            </View>
            <View style={styles.checkinTextos}>
              <Text style={styles.checkinNome}>{c.aluno_nome}</Text>
              <Text style={styles.checkinData}>{formatarDataHora(c.data_hora)}</Text>
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
  heading: { fontSize: 28, fontWeight: '700', color: colors.textDark, marginBottom: 20 },

  resumoRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  resumoCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.lg, padding: 20, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 1,
  },
  resumoNumero: { fontSize: 32, fontWeight: '700', color: colors.textDark },
  resumoLabel: { fontSize: 12, color: colors.muted, textAlign: 'center' },

  filtros: { gap: 10, marginBottom: 20 },
  busca: {
    borderWidth: 2, borderColor: '#ddd', borderRadius: radius.sm,
    paddingVertical: 10, paddingHorizontal: 14, fontSize: 15, backgroundColor: '#fff', color: '#333',
  },
  filtroDataRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filtroDataInput: { flex: 1 },
  limparBtn: { padding: 6 },

  loading: { marginTop: 16 },
  empty: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },

  checkinItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: radius.sm, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#eee',
  },
  checkinIcone: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  checkinTextos: { flex: 1 },
  checkinNome: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  checkinData: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
