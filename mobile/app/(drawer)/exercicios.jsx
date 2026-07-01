import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { confirm } from '../../src/confirm';
import { Ionicons } from '@expo/vector-icons';
import { createExercicio, deleteExercicio, getExercicios, getModalidades, updateExercicio } from '../../src/api';
import { colors, radius } from '../../src/theme';
import CrudModal from '../../src/components/CrudModal';
import { SelectField, TextAreaField, TextField } from '../../src/components/FormFields';

const FORM_VAZIO = { nome: '', descricao: '', modalidadeId: '' };

export default function ExerciciosScreen() {
  const styles = makeStyles();
  const [exercicios, setExercicios] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [exerciciosData, modalidadesData] = await Promise.all([getExercicios(), getModalidades()]);
      setExercicios(exerciciosData || []);
      setModalidades(modalidadesData || []);
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao carregar exercícios');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const modalidadesMap = Object.fromEntries(modalidades.map((m) => [m.id, m.nome]));

  const exerciciosFiltrados = exercicios.filter((e) => {
    const termo = busca.trim().toLowerCase();
    const nomeOk = !termo || (e.nome || '').toLowerCase().includes(termo) || (e.descricao || '').toLowerCase().includes(termo);
    const modOk = !filtroModalidade || String(e.modalidade_id || '') === String(filtroModalidade);
    return nomeOk && modOk;
  });

  const filtroModalidadeOpcoes = [
    { value: '', label: 'Todas' },
    ...modalidades.map((m) => ({ value: String(m.id), label: m.nome })),
  ];

  function abrirNovo() {
    setEditId(null);
    setForm(FORM_VAZIO);
    setErros({});
    setModalVisible(true);
  }

  function abrirEdicao(exercicio) {
    setEditId(exercicio.id);
    setForm({
      nome: exercicio.nome || '',
      descricao: exercicio.descricao || '',
      modalidadeId: exercicio.modalidade_id ? String(exercicio.modalidade_id) : '',
    });
    setErros({});
    setModalVisible(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalVisible(false);
  }

  async function salvar() {
    const novosErros = {};
    if (!form.nome.trim()) novosErros.nome = true;
    if (!form.modalidadeId) novosErros.modalidadeId = true;
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      modalidade_id: Number(form.modalidadeId),
    };

    setSalvando(true);
    try {
      if (editId) {
        await updateExercicio(editId, dados);
      } else {
        await createExercicio(dados);
      }
      setModalVisible(false);
      await carregar();
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao salvar exercício');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(exercicio) {
    confirm('Excluir exercício', `Tem certeza que deseja excluir "${exercicio.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExercicio(exercicio.id);
            await carregar();
          } catch (erro) {
            confirm('Erro', erro.message || 'Erro ao excluir exercício');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Text style={styles.heading}>Exercícios</Text>
        <TextInput
          style={styles.busca}
          placeholder="Buscar exercício..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        <View style={styles.filtroRow}>
          {filtroModalidadeOpcoes.map((opt) => {
            const ativo = filtroModalidade === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setFiltroModalidade(opt.value)}
                style={[styles.filtroChip, ativo && styles.filtroChipAtivo]}
              >
                <Text style={[styles.filtroChipTexto, ativo && styles.filtroChipTextoAtivo]} numberOfLines={1}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.btnNovo} onPress={abrirNovo}>
          <Text style={styles.btnNovoTexto}>+ Novo Exercício</Text>
        </Pressable>
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : exerciciosFiltrados.length === 0 ? (
        <Text style={styles.empty}>Nenhum exercício encontrado.</Text>
      ) : (
        <View style={styles.lista}>
          {exerciciosFiltrados.map((exercicio) => (
            <View key={exercicio.id} style={styles.card}>
              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtn} onPress={() => abrirEdicao(exercicio)}>
                  <Ionicons name="pencil" size={18} color={colors.blue600} />
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => confirmarExclusao(exercicio)}>
                  <Ionicons name="trash" size={18} color={colors.deleteBtn} />
                </Pressable>
              </View>
              <Text style={styles.cardTitle}>{exercicio.nome}</Text>
              {exercicio.descricao ? <Text style={styles.cardDesc}>{exercicio.descricao}</Text> : null}
              <Text style={styles.cardModalidade}>
                Modalidade: {modalidadesMap[exercicio.modalidade_id] || '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <CrudModal
        visible={modalVisible}
        title={editId ? 'Editar Exercício' : 'Novo Exercício'}
        onClose={fecharModal}
        onSalvar={salvar}
        salvando={salvando}
      >
        <TextField
          label="Nome"
          placeholder="Nome do exercício"
          value={form.nome}
          onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))}
          erro={erros.nome}
        />
        <TextAreaField
          label="Descrição"
          placeholder="Descreva o exercício..."
          value={form.descricao}
          onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))}
        />
        <SelectField
          label="Modalidade"
          value={form.modalidadeId}
          onChange={(v) => setForm((f) => ({ ...f, modalidadeId: v }))}
          options={modalidades.map((m) => ({ value: String(m.id), label: m.nome }))}
          placeholder="Nenhuma modalidade cadastrada"
          erro={erros.modalidadeId}
        />
      </CrudModal>
    </ScrollView>
  );
}

const makeStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    padding: 24,
  },
  top: {
    marginBottom: 16,
    gap: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textDark,
  },
  busca: {
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: colors.cardBg,
    color: colors.textDark,
  },
  filtroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filtroChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cardBg,
  },
  filtroChipAtivo: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
  },
  filtroChipTexto: {
    color: colors.textDark,
    fontWeight: '600',
    fontSize: 13,
  },
  filtroChipTextoAtivo: {
    color: '#fff',
  },
  btnNovo: {
    backgroundColor: colors.blue600,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  btnNovoTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  loading: {
    marginTop: 24,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 16,
    fontStyle: 'italic',
  },
  lista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 10,
  },
  card: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 260,
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: 20,
    paddingTop: 50,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  cardActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 8,
    marginBottom: 8,
  },
  cardDesc: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  cardModalidade: {
    color: colors.blue600,
    fontSize: 13,
    fontWeight: '600',
  },
});
