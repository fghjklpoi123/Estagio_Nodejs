import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { confirm } from '../../src/confirm';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/AuthContext';
import { createAula, deleteAula, getAlunos, getAula, getAulas, getExercicios, getAlunoModalidades, updateAula } from '../../src/api';
import { colors, radius } from '../../src/theme';
import { maskData } from '../../src/masks';

export default function FichasScreen() {
  const { session } = useAuth();

  const [fichas, setFichas] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Dados para os selects em cascata
  const [alunos, setAlunos] = useState([]);
  const [modalidadesAluno, setModalidadesAluno] = useState([]);
  const [exerciciosModalidade, setExerciciosModalidade] = useState([]);

  // Campos do form
  const [alunoId, setAlunoId] = useState('');
  const [modalidadeId, setModalidadeId] = useState('');
  const [dataAula, setDataAula] = useState('');
  const [observacao, setObservacao] = useState('');
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
  const [erros, setErros] = useState({});

  // Detalhe (visualizar ficha)
  const [detalhe, setDetalhe] = useState(null);
  const [detalheVisible, setDetalheVisible] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [fichasData, alunosData] = await Promise.all([getAulas(), getAlunos()]);
      setFichas(fichasData || []);
      setAlunos(alunosData || []);
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao carregar fichas');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Quando muda o aluno, busca as modalidades dele
  useEffect(() => {
    if (!alunoId) { setModalidadesAluno([]); setModalidadeId(''); return; }
    getAlunoModalidades(alunoId)
      .then((mods) => { setModalidadesAluno(mods || []); setModalidadeId(''); })
      .catch(() => setModalidadesAluno([]));
  }, [alunoId]);

  // Quando muda a modalidade, busca os exercícios dela
  useEffect(() => {
    if (!modalidadeId) { setExerciciosModalidade([]); return; }
    getExercicios(modalidadeId)
      .then((exs) => setExerciciosModalidade(exs || []))
      .catch(() => setExerciciosModalidade([]));
  }, [modalidadeId]);

  const fichasFiltradas = fichas.filter((f) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (f.aluno_nome || '').toLowerCase().includes(termo)
      || (f.modalidade_nome || '').toLowerCase().includes(termo)
      || (f.professor_nome || '').toLowerCase().includes(termo);
  });

  function limparForm() {
    setAlunoId('');
    setModalidadeId('');
    setDataAula('');
    setObservacao('');
    setExerciciosSelecionados([]);
    setErros({});
    setModalidadesAluno([]);
    setExerciciosModalidade([]);
  }

  function abrirNovo() {
    setEditId(null);
    limparForm();
    setModalVisible(true);
  }

  async function abrirEdicao(ficha) {
    setEditId(ficha.id);
    limparForm();
    setModalVisible(true);
    try {
      const detalhes = await getAula(ficha.id);
      setAlunoId(String(detalhes.aluno_id));
      setDataAula(detalhes.data_aula ? String(detalhes.data_aula).slice(0, 10) : '');
      setObservacao(detalhes.observacao || '');

      const mods = await getAlunoModalidades(detalhes.aluno_id);
      setModalidadesAluno(mods || []);
      setModalidadeId(String(detalhes.modalidade_id));

      const exs = await getExercicios(detalhes.modalidade_id);
      setExerciciosModalidade(exs || []);

      setExerciciosSelecionados(
        (detalhes.exercicios || []).map((e) => ({
          exercicio_id: e.exercicio_id,
          series: e.series != null ? String(e.series) : '',
          repeticoes: e.repeticoes || '',
          carga: e.carga || '',
          duracao_min: e.duracao_min != null ? String(e.duracao_min) : '',
          observacao: e.observacao || '',
        }))
      );
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao carregar ficha');
      setModalVisible(false);
    }
  }

  async function verDetalhe(ficha) {
    try {
      const detalhes = await getAula(ficha.id);
      setDetalhe(detalhes);
      setDetalheVisible(true);
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao carregar detalhes');
    }
  }

  function toggleExercicio(exercicioId) {
    setExerciciosSelecionados((prev) => {
      const existe = prev.find((e) => e.exercicio_id === exercicioId);
      if (existe) return prev.filter((e) => e.exercicio_id !== exercicioId);
      return [...prev, { exercicio_id: exercicioId, series: '', repeticoes: '', carga: '', duracao_min: '', observacao: '' }];
    });
  }

  function atualizarCampoExercicio(exercicioId, campo, valor) {
    setExerciciosSelecionados((prev) =>
      prev.map((e) => (e.exercicio_id === exercicioId ? { ...e, [campo]: valor } : e))
    );
  }

  function fecharModal() {
    if (salvando) return;
    setModalVisible(false);
  }

  async function salvar() {
    const novosErros = {};
    if (!alunoId) novosErros.alunoId = true;
    if (!modalidadeId) novosErros.modalidadeId = true;
    if (!dataAula) novosErros.dataAula = true;
    if (exerciciosSelecionados.length === 0) novosErros.exercicios = true;
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados = {
      aluno_id: Number(alunoId),
      modalidade_id: Number(modalidadeId),
      data_aula: dataAula,
      observacao,
      exercicios: exerciciosSelecionados.map((e) => ({
        exercicio_id: e.exercicio_id,
        series: e.series ? Number(e.series) : null,
        repeticoes: e.repeticoes || null,
        carga: e.carga || null,
        duracao_min: e.duracao_min ? Number(e.duracao_min) : null,
        observacao: e.observacao || null,
      })),
    };

    setSalvando(true);
    try {
      if (editId) {
        await updateAula(editId, dados);
      } else {
        await createAula(dados);
      }
      setModalVisible(false);
      await carregar();
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao salvar ficha');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(ficha) {
    confirm('Excluir ficha', `Excluir ficha de ${ficha.aluno_nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try { await deleteAula(ficha.id); await carregar(); }
          catch (erro) { confirm('Erro', erro.message || 'Erro ao excluir'); }
        },
      },
    ]);
  }

  function formatarData(d) {
    if (!d) return '—';
    return String(d).slice(0, 10).split('-').reverse().join('/');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Text style={styles.heading}>Fichas de Treino</Text>
        <TextInput style={styles.busca} placeholder="Buscar por aluno, modalidade..." placeholderTextColor="#999" value={busca} onChangeText={setBusca} />
        <Pressable style={styles.btnNovo} onPress={abrirNovo}>
          <Text style={styles.btnNovoTexto}>+ Nova Ficha</Text>
        </Pressable>
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : fichasFiltradas.length === 0 ? (
        <Text style={styles.empty}>Nenhuma ficha de treino encontrada.</Text>
      ) : (
        <View style={styles.lista}>
          {fichasFiltradas.map((ficha) => (
            <Pressable key={ficha.id} style={styles.card} onPress={() => verDetalhe(ficha)}>
              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtn} onPress={() => abrirEdicao(ficha)}>
                  <Ionicons name="pencil" size={18} color={colors.blue600} />
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => confirmarExclusao(ficha)}>
                  <Ionicons name="trash" size={18} color={colors.deleteBtn} />
                </Pressable>
              </View>
              <Text style={styles.cardTitle}>{ficha.aluno_nome}</Text>
              <Text style={styles.cardSpan}>Modalidade: {ficha.modalidade_nome}</Text>
              <Text style={styles.cardSpan}>Professor: {ficha.professor_nome}</Text>
              <Text style={styles.cardSpan}>Data: {formatarData(ficha.data_aula)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ---- MODAL CRIAR/EDITAR ---- */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={fecharModal}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editId ? 'Editar Ficha' : 'Nova Ficha de Treino'}</Text>

              {/* Aluno */}
              <Text style={[styles.label, erros.alunoId && styles.labelErro]}>Aluno</Text>
              <View style={styles.chipRow}>
                {alunos.map((a) => {
                  const ativo = String(a.id) === alunoId;
                  return (
                    <Pressable key={a.id} onPress={() => setAlunoId(String(a.id))} style={[styles.chip, ativo && styles.chipAtivo, erros.alunoId && styles.chipErro]}>
                      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]} numberOfLines={1}>{a.nome}</Text>
                    </Pressable>
                  );
                })}
                {alunos.length === 0 && <Text style={styles.chipVazio}>Nenhum aluno cadastrado</Text>}
              </View>

              {/* Modalidade (filtrada pelo aluno) */}
              <Text style={[styles.label, erros.modalidadeId && styles.labelErro]}>Modalidade do aluno</Text>
              <View style={styles.chipRow}>
                {modalidadesAluno.map((m) => {
                  const ativo = String(m.id) === modalidadeId;
                  return (
                    <Pressable key={m.id} onPress={() => setModalidadeId(String(m.id))} style={[styles.chip, ativo && styles.chipAtivo, erros.modalidadeId && styles.chipErro]}>
                      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]} numberOfLines={1}>{m.nome}</Text>
                    </Pressable>
                  );
                })}
                {alunoId && modalidadesAluno.length === 0 && <Text style={styles.chipVazio}>Aluno não inscrito em nenhuma modalidade</Text>}
                {!alunoId && <Text style={styles.chipVazio}>Selecione um aluno primeiro</Text>}
              </View>

              {/* Data */}
              <Text style={[styles.label, erros.dataAula && styles.labelErro]}>Data da aula</Text>
              <TextInput
                style={[styles.input, erros.dataAula && styles.inputErro]}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#9aa6b5"
                value={dataAula}
                onChangeText={(v) => setDataAula(maskData(v))}
                keyboardType="number-pad"
                maxLength={10}
              />

              {/* Observação geral */}
              <Text style={styles.label}>Observação geral</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Observações sobre a ficha..."
                placeholderTextColor="#9aa6b5"
                value={observacao}
                onChangeText={setObservacao}
                multiline
                textAlignVertical="top"
              />

              {/* Exercícios (filtrados pela modalidade) */}
              <Text style={[styles.label, erros.exercicios && styles.labelErro]}>
                Exercícios {exerciciosSelecionados.length > 0 ? `(${exerciciosSelecionados.length})` : ''}
              </Text>
              {!modalidadeId ? (
                <Text style={styles.chipVazio}>Selecione uma modalidade para ver os exercícios</Text>
              ) : exerciciosModalidade.length === 0 ? (
                <Text style={styles.chipVazio}>Nenhum exercício cadastrado nesta modalidade</Text>
              ) : (
                exerciciosModalidade.map((ex) => {
                  const sel = exerciciosSelecionados.find((e) => e.exercicio_id === ex.id);
                  return (
                    <View key={ex.id} style={styles.exercicioItem}>
                      <Pressable style={styles.exercicioHeader} onPress={() => toggleExercicio(ex.id)}>
                        <Ionicons name={sel ? 'checkbox' : 'square-outline'} size={22} color={sel ? colors.blue600 : '#aaa'} />
                        <Text style={[styles.exercicioNome, sel && styles.exercicioNomeSel]}>{ex.nome}</Text>
                      </Pressable>
                      {sel && (
                        <View style={styles.exercicioCampos}>
                          <View style={styles.campoRow}>
                            <View style={styles.campoItem}>
                              <Text style={styles.campoLabel}>Séries</Text>
                              <TextInput style={styles.campoInput} value={sel.series} onChangeText={(v) => atualizarCampoExercicio(ex.id, 'series', v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="—" placeholderTextColor="#bbb" />
                            </View>
                            <View style={styles.campoItem}>
                              <Text style={styles.campoLabel}>Repetições</Text>
                              <TextInput style={styles.campoInput} value={sel.repeticoes} onChangeText={(v) => atualizarCampoExercicio(ex.id, 'repeticoes', v)} placeholder="12 ou 50m" placeholderTextColor="#bbb" />
                            </View>
                          </View>
                          <View style={styles.campoRow}>
                            <View style={styles.campoItem}>
                              <Text style={styles.campoLabel}>Carga</Text>
                              <TextInput style={styles.campoInput} value={sel.carga} onChangeText={(v) => atualizarCampoExercicio(ex.id, 'carga', v)} placeholder="40kg" placeholderTextColor="#bbb" />
                            </View>
                            <View style={styles.campoItem}>
                              <Text style={styles.campoLabel}>Duração (min)</Text>
                              <TextInput style={styles.campoInput} value={sel.duracao_min} onChangeText={(v) => atualizarCampoExercicio(ex.id, 'duracao_min', v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="—" placeholderTextColor="#bbb" />
                            </View>
                          </View>
                          <Text style={styles.campoLabel}>Obs. do exercício</Text>
                          <TextInput style={[styles.campoInput, { marginBottom: 4 }]} value={sel.observacao} onChangeText={(v) => atualizarCampoExercicio(ex.id, 'observacao', v)} placeholder="Rally diagonal..." placeholderTextColor="#bbb" />
                        </View>
                      )}
                    </View>
                  );
                })
              )}

              {/* Ações */}
              <View style={styles.modalActions}>
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={salvar} disabled={salvando}>
                  <Text style={styles.btnPrimaryTexto}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnSecondary]} onPress={fecharModal} disabled={salvando}>
                  <Text style={styles.btnSecondaryTexto}>Cancelar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---- MODAL DETALHE ---- */}
      <Modal visible={detalheVisible} transparent animationType="fade" onRequestClose={() => setDetalheVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {detalhe && (
                <>
                  <Text style={styles.modalTitle}>Ficha de Treino</Text>
                  <Text style={styles.detalheLabel}>Aluno: <Text style={styles.detalheValor}>{detalhe.aluno_nome}</Text></Text>
                  <Text style={styles.detalheLabel}>Modalidade: <Text style={styles.detalheValor}>{detalhe.modalidade_nome}</Text></Text>
                  <Text style={styles.detalheLabel}>Professor: <Text style={styles.detalheValor}>{detalhe.professor_nome}</Text></Text>
                  <Text style={styles.detalheLabel}>Data: <Text style={styles.detalheValor}>{formatarData(detalhe.data_aula)}</Text></Text>
                  {detalhe.observacao ? <Text style={styles.detalheObs}>{detalhe.observacao}</Text> : null}

                  <Text style={[styles.label, { marginTop: 16 }]}>Exercícios ({(detalhe.exercicios || []).length})</Text>
                  {(detalhe.exercicios || []).map((ex, i) => (
                    <View key={ex.id || i} style={styles.detalheExercicio}>
                      <Text style={styles.detalheExNome}>{ex.exercicio_nome}</Text>
                      <View style={styles.detalheExCampos}>
                        {ex.series != null && <Text style={styles.detalheExCampo}>{ex.series} séries</Text>}
                        {ex.repeticoes && <Text style={styles.detalheExCampo}>{ex.repeticoes} reps</Text>}
                        {ex.carga && <Text style={styles.detalheExCampo}>{ex.carga}</Text>}
                        {ex.duracao_min != null && <Text style={styles.detalheExCampo}>{ex.duracao_min} min</Text>}
                      </View>
                      {ex.observacao ? <Text style={styles.detalheExObs}>{ex.observacao}</Text> : null}
                    </View>
                  ))}
                </>
              )}
              <Pressable style={[styles.btn, styles.btnSecondary, { marginTop: 16 }]} onPress={() => setDetalheVisible(false)}>
                <Text style={styles.btnSecondaryTexto}>Fechar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 24 },
  top: { marginBottom: 16, gap: 10 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.textDark },
  busca: { borderWidth: 2, borderColor: '#ddd', borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15, backgroundColor: '#fff', color: '#333' },
  btnNovo: { backgroundColor: colors.blue600, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', alignSelf: 'flex-start' },
  btnNovoTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  loading: { marginTop: 24 },
  empty: { color: colors.muted, fontSize: 13, marginTop: 16, fontStyle: 'italic' },

  lista: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 10 },
  card: { flexGrow: 1, flexBasis: 260, minWidth: 260, backgroundColor: '#fff', borderRadius: radius.lg, padding: 20, paddingTop: 50, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
  cardActions: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginTop: 8, marginBottom: 8 },
  cardSpan: { color: colors.muted, fontSize: 13, marginBottom: 4 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 540, maxHeight: '90%', backgroundColor: '#fff', borderRadius: radius.lg, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginBottom: 12 },
  modalActions: { gap: 10, marginTop: 20 },

  label: { fontWeight: '600', color: '#333', fontSize: 14, marginTop: 12, marginBottom: 6 },
  labelErro: { color: colors.deleteBtn, fontWeight: '700' },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: '#fff', fontSize: 14, color: colors.textDark },
  inputErro: { borderColor: colors.deleteBtn, backgroundColor: '#fff5f5' },
  textarea: { minHeight: 60, maxHeight: 150 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: '#fff' },
  chipAtivo: { backgroundColor: colors.blue600, borderColor: colors.blue600 },
  chipErro: { borderColor: colors.deleteBtn },
  chipTexto: { color: colors.textDark, fontSize: 13, fontWeight: '600' },
  chipTextoAtivo: { color: '#fff' },
  chipVazio: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },

  exercicioItem: { backgroundColor: '#f9fafb', borderRadius: radius.sm, borderWidth: 1, borderColor: '#eee', marginBottom: 10, overflow: 'hidden' },
  exercicioHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  exercicioNome: { fontSize: 14, color: '#333', flexShrink: 1 },
  exercicioNomeSel: { fontWeight: '700', color: colors.blue600 },
  exercicioCampos: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  campoRow: { flexDirection: 'row', gap: 10 },
  campoItem: { flex: 1 },
  campoLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginBottom: 3 },
  campoInput: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', fontSize: 13, color: '#333' },

  btn: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: radius.sm, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.blue600 },
  btnPrimaryTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { backgroundColor: colors.btnSecondaryBg },
  btnSecondaryTexto: { color: colors.btnSecondaryTexto, fontWeight: '700', fontSize: 14 },

  detalheLabel: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  detalheValor: { fontWeight: '700', color: colors.textDark },
  detalheObs: { fontSize: 13, color: '#555', fontStyle: 'italic', marginTop: 8, marginBottom: 4 },
  detalheExercicio: { backgroundColor: '#f9fafb', borderRadius: radius.sm, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  detalheExNome: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 4 },
  detalheExCampos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detalheExCampo: { fontSize: 13, color: colors.blue600, fontWeight: '600' },
  detalheExObs: { fontSize: 12, color: '#777', fontStyle: 'italic', marginTop: 4 },
});
