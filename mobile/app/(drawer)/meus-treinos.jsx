import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/AuthContext';
import { getAula, getAulas } from '../../src/api';
import { colors, radius } from '../../src/theme';

function formatarData(d) {
  if (!d) return '—';
  return String(d).slice(0, 10).split('-').reverse().join('/');
}

function agruparPorModalidade(fichas) {
  const mapa = {};
  for (const f of fichas) {
    const chave = f.modalidade_nome || 'Sem modalidade';
    if (!mapa[chave]) mapa[chave] = [];
    mapa[chave].push(f);
  }
  return Object.entries(mapa);
}

export default function MeusTreinosScreen() {
  const styles = makeStyles();
  const { session } = useAuth();
  const alunoId = session?.id;

  const [fichas, setFichas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState({});

  const [detalhe, setDetalhe] = useState(null);
  const [detalheVisible, setDetalheVisible] = useState(false);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const carregar = useCallback(async () => {
    if (!alunoId) return;
    setCarregando(true);
    try {
      const data = await getAulas({ aluno_id: alunoId });
      setFichas(data || []);
      const exp = {};
      for (const f of data || []) {
        const chave = f.modalidade_nome || 'Sem modalidade';
        if (!(chave in exp)) exp[chave] = true;
      }
      setExpandido(exp);
    } catch {
      setFichas([]);
    } finally {
      setCarregando(false);
    }
  }, [alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function toggleGrupo(chave) {
    setExpandido((prev) => ({ ...prev, [chave]: !prev[chave] }));
  }

  async function verDetalhe(ficha) {
    setCarregandoDetalhe(true);
    setDetalheVisible(true);
    try {
      const data = await getAula(ficha.id);
      setDetalhe(data);
    } catch {
      setDetalhe(null);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  const grupos = agruparPorModalidade(fichas);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Meus Treinos</Text>

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : fichas.length === 0 ? (
        <View style={styles.vazioBox}>
          <Ionicons name="barbell-outline" size={48} color="#ccc" />
          <Text style={styles.vazioTexto}>Nenhuma ficha de treino ainda.</Text>
          <Text style={styles.vazioSub}>Seu professor criará fichas para você aqui.</Text>
        </View>
      ) : (
        grupos.map(([modalidade, lista]) => (
          <View key={modalidade} style={styles.grupo}>
            <Pressable style={styles.grupoHeader} onPress={() => toggleGrupo(modalidade)}>
              <View style={styles.grupoHeaderLeft}>
                <Ionicons name="fitness-outline" size={20} color={colors.blue600} />
                <Text style={styles.grupoTitulo}>{modalidade}</Text>
              </View>
              <View style={styles.grupoBadge}>
                <Text style={styles.grupoBadgeTexto}>{lista.length}</Text>
              </View>
              <Ionicons name={expandido[modalidade] ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
            </Pressable>

            {expandido[modalidade] && lista.map((ficha) => (
              <Pressable key={ficha.id} style={styles.fichaCard} onPress={() => verDetalhe(ficha)}>
                <View style={styles.fichaTop}>
                  <Ionicons name="calendar-outline" size={16} color={colors.blue600} />
                  <Text style={styles.fichaData}>{formatarData(ficha.data_aula)}</Text>
                </View>
                <Text style={styles.fichaProfessor}>Prof. {ficha.professor_nome}</Text>
                {ficha.observacao ? <Text style={styles.fichaObs} numberOfLines={2}>{ficha.observacao}</Text> : null}
                <Text style={styles.fichaVer}>Toque para ver exercícios →</Text>
              </Pressable>
            ))}
          </View>
        ))
      )}

      {/* Modal de detalhe */}
      <Modal visible={detalheVisible} transparent animationType="fade" onRequestClose={() => setDetalheVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {carregandoDetalhe ? (
                <ActivityIndicator color={colors.blue600} style={{ marginVertical: 40 }} />
              ) : detalhe ? (
                <>
                  <Text style={styles.modalTitle}>Ficha de Treino</Text>
                  <View style={styles.detalheInfo}>
                    <Text style={styles.detalheLabel}>Modalidade: <Text style={styles.detalheValor}>{detalhe.modalidade_nome}</Text></Text>
                    <Text style={styles.detalheLabel}>Professor: <Text style={styles.detalheValor}>{detalhe.professor_nome}</Text></Text>
                    <Text style={styles.detalheLabel}>Data: <Text style={styles.detalheValor}>{formatarData(detalhe.data_aula)}</Text></Text>
                    {detalhe.observacao ? <Text style={styles.detalheObs}>{detalhe.observacao}</Text> : null}
                  </View>

                  <Text style={styles.exerciciosTitulo}>Exercícios ({(detalhe.exercicios || []).length})</Text>

                  {(detalhe.exercicios || []).map((ex, i) => (
                    <View key={ex.id || i} style={styles.exCard}>
                      <Text style={styles.exNome}>{ex.exercicio_nome}</Text>
                      <View style={styles.exCampos}>
                        {ex.series != null && (
                          <View style={styles.exTag}>
                            <Ionicons name="repeat-outline" size={14} color={colors.blue600} />
                            <Text style={styles.exTagTexto}>{ex.series} séries</Text>
                          </View>
                        )}
                        {ex.repeticoes && (
                          <View style={styles.exTag}>
                            <Ionicons name="refresh-outline" size={14} color={colors.blue600} />
                            <Text style={styles.exTagTexto}>{ex.repeticoes}</Text>
                          </View>
                        )}
                        {ex.carga && (
                          <View style={styles.exTag}>
                            <Ionicons name="barbell-outline" size={14} color={colors.blue600} />
                            <Text style={styles.exTagTexto}>{ex.carga}</Text>
                          </View>
                        )}
                        {ex.duracao_min != null && (
                          <View style={styles.exTag}>
                            <Ionicons name="time-outline" size={14} color={colors.blue600} />
                            <Text style={styles.exTagTexto}>{ex.duracao_min} min</Text>
                          </View>
                        )}
                      </View>
                      {ex.observacao ? <Text style={styles.exObs}>{ex.observacao}</Text> : null}
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.empty}>Erro ao carregar ficha.</Text>
              )}

              <Pressable style={styles.btnFechar} onPress={() => setDetalheVisible(false)}>
                <Text style={styles.btnFecharTexto}>Fechar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.textDark, marginBottom: 20 },
  loading: { marginTop: 40 },
  empty: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },

  vazioBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  vazioTexto: { fontSize: 16, fontWeight: '600', color: '#999' },
  vazioSub: { fontSize: 13, color: '#bbb', textAlign: 'center' },

  grupo: { marginBottom: 20, backgroundColor: colors.cardBg, borderRadius: radius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 1, overflow: 'hidden' },
  grupoHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: '#fafbfc', borderBottomWidth: 1, borderBottomColor: '#eee' },
  grupoHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  grupoTitulo: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  grupoBadge: { backgroundColor: colors.blue600, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6 },
  grupoBadgeTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },

  fichaCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  fichaTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  fichaData: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  fichaProfessor: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  fichaObs: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 4 },
  fichaVer: { fontSize: 12, color: colors.blue600, fontWeight: '600', marginTop: 4 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 500, maxHeight: '90%', backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark, marginBottom: 16 },

  detalheInfo: { marginBottom: 16, gap: 4 },
  detalheLabel: { fontSize: 14, color: colors.muted },
  detalheValor: { fontWeight: '700', color: colors.textDark },
  detalheObs: { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f9f9f9', borderRadius: radius.sm },

  exerciciosTitulo: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 10 },

  exCard: { backgroundColor: '#f9fafb', borderRadius: radius.sm, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.inputBorder },
  exNome: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 8 },
  exCampos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#edf2ff', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  exTagTexto: { fontSize: 13, fontWeight: '600', color: colors.blue600 },
  exObs: { fontSize: 12, color: '#777', fontStyle: 'italic', marginTop: 8 },

  btnFechar: { backgroundColor: colors.btnSecondaryBg, paddingVertical: 12, borderRadius: radius.sm, alignItems: 'center', marginTop: 16 },
  btnFecharTexto: { color: colors.btnSecondaryTexto, fontWeight: '700', fontSize: 14 },
});
