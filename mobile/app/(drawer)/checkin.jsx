import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fazerCheckin, historicoCheckins, statusCheckinHoje, verificarFeriado } from '../../src/api';
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

function formatarDiaSemana(d) {
  if (!d) return '';
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[new Date(d).getDay()];
}

export default function CheckinScreen() {
  const styles = makeStyles();
  const [fezHoje, setFezHoje] = useState(false);
  const [checkinHoje, setCheckinHoje] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState(null);
  const [feriadoHoje, setFeriadoHoje] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const [hojeData, historicoData, feriadoData] = await Promise.all([
        statusCheckinHoje(),
        historicoCheckins(),
        verificarFeriado(hoje).catch(() => null),
      ]);
      setFezHoje(hojeData.fezCheckin);
      setCheckinHoje(hojeData.checkin);
      setHistorico(historicoData || []);
      setFeriadoHoje(feriadoData || { ehFeriado: false });
    } catch {
      setHistorico([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  async function handleCheckin() {
    setEnviando(true);
    try {
      await fazerCheckin();
      setStatus({ tipo: 'success', texto: 'Check-in realizado com sucesso!' });
      await carregar();
    } catch (erro) {
      const msg = erro.message || '';
      if (msg.includes('409') || msg.toLowerCase().includes('já fez')) {
        setStatus({ tipo: 'info', texto: 'Você já fez check-in hoje.' });
        setFezHoje(true);
      } else {
        setStatus({ tipo: 'error', texto: msg || 'Erro ao fazer check-in' });
      }
    } finally {
      setEnviando(false);
    }
  }

  const totalMes = historico.filter((c) => {
    const d = new Date(c.data_hora);
    const agora = new Date();
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
  }).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Check-in</Text>

      {/* Status de feriado */}
      {feriadoHoje && (
        <View style={[styles.feriadoBanner, !feriadoHoje.ehFeriado && styles.feriadoBannerOk]}>
          <Ionicons
            name={feriadoHoje.ehFeriado ? 'flag' : 'checkmark-circle'}
            size={20}
            color={feriadoHoje.ehFeriado ? '#f39c12' : colors.planoPreco}
          />
          <View style={{ flex: 1 }}>
            {feriadoHoje.ehFeriado ? (
              <>
                <Text style={styles.feriadoTitulo}>Hoje é feriado!</Text>
                <Text style={styles.feriadoNome}>{feriadoHoje.nome}</Text>
              </>
            ) : (
              <Text style={styles.feriadoOk}>Nenhum feriado hoje — bom treino!</Text>
            )}
          </View>
        </View>
      )}

      {/* Botão de check-in */}
      <View style={styles.checkinBox}>
        <Pressable
          style={[styles.checkinBtn, fezHoje && styles.checkinBtnFeito]}
          onPress={fezHoje ? undefined : handleCheckin}
          disabled={enviando || fezHoje}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Ionicons
                name={fezHoje ? 'checkmark-circle' : 'finger-print'}
                size={64}
                color="#fff"
              />
              <Text style={styles.checkinBtnTexto}>
                {fezHoje ? 'Presença confirmada!' : 'Registrar Presença'}
              </Text>
              {fezHoje && checkinHoje && (
                <Text style={styles.checkinHora}>
                  Hoje às {new Date(checkinHoje.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </>
          )}
        </Pressable>
      </View>

      {/* Status */}
      {status && (
        <View style={[styles.statusMsg, styles[`status_${status.tipo}`]]}>
          <Text style={[styles.statusTexto, styles[`statusTexto_${status.tipo}`]]}>{status.texto}</Text>
        </View>
      )}

      {/* Resumo do mês */}
      <View style={styles.resumoBox}>
        <Ionicons name="calendar-outline" size={24} color={colors.blue600} />
        <View>
          <Text style={styles.resumoNumero}>{totalMes}</Text>
          <Text style={styles.resumoLabel}>presenças este mês</Text>
        </View>
      </View>

      {/* Histórico */}
      <Text style={styles.historicoTitulo}>Histórico de presenças</Text>

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : historico.length === 0 ? (
        <Text style={styles.empty}>Nenhum check-in registrado ainda.</Text>
      ) : (
        historico.map((c) => (
          <View key={c.id} style={styles.historicoItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.planoPreco} />
            <View style={styles.historicoTextos}>
              <Text style={styles.historicoData}>{formatarDataHora(c.data_hora)}</Text>
              <Text style={styles.historicoDia}>{formatarDiaSemana(c.data_hora)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.textDark, marginBottom: 24 },

  checkinBox: { alignItems: 'center', marginBottom: 24 },
  checkinBtn: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.blue600, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.blue600, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 6,
  },
  checkinBtnFeito: { backgroundColor: colors.planoPreco },
  checkinBtnTexto: { color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 8, textAlign: 'center' },
  checkinHora: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },

  statusMsg: { borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 16 },
  status_success: { backgroundColor: colors.sucessoBg, borderWidth: 1, borderColor: colors.sucessoBorda },
  status_error: { backgroundColor: colors.erroBg, borderWidth: 1, borderColor: colors.erroBorda },
  status_info: { backgroundColor: colors.infoBg },
  statusTexto: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  statusTexto_success: { color: colors.sucessoTexto },
  statusTexto_error: { color: colors.erroTexto },
  statusTexto_info: { color: colors.infoTexto },

  resumoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: 20,
    marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 1,
  },
  resumoNumero: { fontSize: 28, fontWeight: '700', color: colors.textDark },
  resumoLabel: { fontSize: 13, color: colors.muted },

  historicoTitulo: { fontSize: 16, fontWeight: '700', color: colors.textDark, marginBottom: 12 },
  loading: { marginTop: 16 },
  empty: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },

  historicoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cardBg, borderRadius: radius.sm, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  historicoTextos: { flex: 1 },
  historicoData: { fontSize: 14, fontWeight: '600', color: colors.textDark },
  historicoDia: { fontSize: 12, color: colors.muted },

  feriadoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fef9e7', borderWidth: 1, borderColor: '#f9e79f',
    borderRadius: radius.sm, padding: 14, marginBottom: 16,
  },
  feriadoBannerOk: {
    backgroundColor: '#e8f5e9', borderColor: '#c8e6c9',
  },
  feriadoTitulo: { fontSize: 14, fontWeight: '700', color: '#b7950b' },
  feriadoNome: { fontSize: 13, color: '#7d6608' },
  feriadoOk: { fontSize: 14, fontWeight: '600', color: colors.planoPreco },
});
