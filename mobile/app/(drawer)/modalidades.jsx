import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/AuthContext';
import {
  cancelarInscricao,
  createModalidade,
  deleteModalidade,
  getAlunoModalidades,
  getAlunoPlano,
  getModalidades,
  inscreverAluno,
  updateModalidade,
} from '../../src/api';
import { colors, radius } from '../../src/theme';
import CrudModal from '../../src/components/CrudModal';
import { TextAreaField, TextField } from '../../src/components/FormFields';

// Recriação de front/modalidadesFront/modalidades.html + .css + .js.
// O arquivo original tem duas visões na mesma página: admin (CRUD) e aluno
// (Inscrever-se/Cancelar), escolhidas via query string ?alunoId=. Aqui a
// visão é escolhida por session.tipo, igual ao padrão de meus-planos.jsx.

const FORM_VAZIO = { nome: '', descricao: '' };

export default function ModalidadesScreen() {
  const { session } = useAuth();
  const isAluno = session && session.tipo === 'aluno';
  const alunoId = session?.id;

  const [modalidades, setModalidades] = useState([]);
  const [inscricoesIds, setInscricoesIds] = useState(new Set());
  const [plano, setPlano] = useState(null);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      if (isAluno && alunoId) {
        const [modalidadesData, inscricoesData, planoData] = await Promise.all([
          getModalidades(),
          getAlunoModalidades(alunoId),
          getAlunoPlano(alunoId).catch(() => null),
        ]);
        setModalidades(modalidadesData || []);
        setInscricoesIds(new Set((inscricoesData || []).map((m) => m.id)));
        setPlano(planoData);
      } else {
        const modalidadesData = await getModalidades();
        setModalidades(modalidadesData || []);
      }
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Erro ao carregar modalidades');
    } finally {
      setCarregando(false);
    }
  }, [isAluno, alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const modalidadesFiltradas = modalidades.filter((m) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (m.nome || '').toLowerCase().includes(termo) || (m.descricao || '').toLowerCase().includes(termo);
  });

  const vagasRestantes = plano && plano.limite != null ? Math.max(0, Number(plano.limite) - inscricoesIds.size) : null;

  async function inscrever(modalidade) {
    setAcaoEmAndamento(modalidade.id);
    try {
      await inscreverAluno(alunoId, modalidade.id);
      const ins = await getAlunoModalidades(alunoId);
      setInscricoesIds(new Set((ins || []).map((m) => m.id)));
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Erro ao inscrever-se');
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  function confirmarCancelar(modalidade) {
    Alert.alert('Cancelar inscrição', `Confirma o cancelamento da inscrição em "${modalidade.nome}"?`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar Inscrição', style: 'destructive', onPress: () => cancelar(modalidade) },
    ]);
  }

  async function cancelar(modalidade) {
    setAcaoEmAndamento(modalidade.id);
    try {
      await cancelarInscricao(alunoId, modalidade.id);
      const ins = await getAlunoModalidades(alunoId);
      setInscricoesIds(new Set((ins || []).map((m) => m.id)));
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Erro ao cancelar inscrição');
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  function abrirNovo() {
    setEditId(null);
    setForm(FORM_VAZIO);
    setErros({});
    setModalVisible(true);
  }

  function abrirEdicao(modalidade) {
    setEditId(modalidade.id);
    setForm({ nome: modalidade.nome || '', descricao: modalidade.descricao || '' });
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
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados = { nome: form.nome.trim(), descricao: form.descricao.trim() };

    setSalvando(true);
    try {
      if (editId) {
        await updateModalidade(editId, dados);
      } else {
        await createModalidade(dados);
      }
      setModalVisible(false);
      await carregar();
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Erro ao salvar modalidade');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(modalidade) {
    Alert.alert('Excluir modalidade', `Tem certeza que deseja excluir "${modalidade.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteModalidade(modalidade.id);
            await carregar();
          } catch (erro) {
            Alert.alert('Erro', erro.message || 'Erro ao excluir modalidade');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Text style={styles.heading}>Modalidades</Text>
        <TextInput
          style={styles.busca}
          placeholder="Buscar modalidade..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        {!isAluno && (
          <Pressable style={styles.btnNovo} onPress={abrirNovo}>
            <Text style={styles.btnNovoTexto}>+ Nova Modalidade</Text>
          </Pressable>
        )}
      </View>

      {isAluno && !carregando && (
        <Text style={styles.planInfo}>
          Plano: {plano ? plano.descricao || '—' : 'Nenhum'}
          {vagasRestantes != null ? ` — Vagas restantes: ${vagasRestantes}` : ''}
        </Text>
      )}

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : modalidadesFiltradas.length === 0 ? (
        <Text style={styles.empty}>Nenhuma modalidade encontrada.</Text>
      ) : (
        <View style={styles.lista}>
          {modalidadesFiltradas.map((modalidade) => {
            if (isAluno) {
              const inscrito = inscricoesIds.has(modalidade.id);
              const emAndamento = acaoEmAndamento === modalidade.id;
              return (
                <View key={modalidade.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{modalidade.nome}</Text>
                  {modalidade.descricao ? <Text style={styles.cardDesc}>{modalidade.descricao}</Text> : null}
                  <Pressable
                    style={[
                      styles.btn,
                      inscrito ? styles.btnCancelar : styles.btnInscrever,
                      emAndamento && styles.btnDesabilitado,
                    ]}
                    onPress={() => (inscrito ? confirmarCancelar(modalidade) : inscrever(modalidade))}
                    disabled={emAndamento}
                  >
                    {emAndamento ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.btnTexto}>{inscrito ? 'Cancelar' : 'Inscrever-se'}</Text>
                    )}
                  </Pressable>
                </View>
              );
            }
            return (
              <View key={modalidade.id} style={styles.card}>
                <Pressable style={styles.editBtn} onPress={() => abrirEdicao(modalidade)}>
                  <Ionicons name="pencil" size={18} color={colors.blue600} />
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => confirmarExclusao(modalidade)}>
                  <Ionicons name="trash" size={18} color={colors.deleteBtn} />
                </Pressable>
                <Text style={styles.cardTitle}>{modalidade.nome}</Text>
                {modalidade.descricao ? <Text style={styles.cardDesc}>{modalidade.descricao}</Text> : null}
              </View>
            );
          })}
        </View>
      )}

      {!isAluno && (
        <CrudModal
          visible={modalVisible}
          title={editId ? 'Editar Modalidade' : 'Nova Modalidade'}
          onClose={fecharModal}
          onSalvar={salvar}
          salvando={salvando}
        >
          <TextField
            label="Nome"
            placeholder="Nome da modalidade"
            value={form.nome}
            onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))}
            erro={erros.nome}
          />
          <TextAreaField
            label="Descrição"
            placeholder="Descreva a modalidade..."
            value={form.descricao}
            onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))}
          />
        </CrudModal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    borderColor: '#ddd',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#333',
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
  planInfo: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
    fontStyle: 'italic',
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
    backgroundColor: '#fff',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  cardDesc: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  editBtn: {
    position: 'absolute',
    top: 15,
    right: 45,
    padding: 6,
  },
  deleteBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 6,
  },
  btn: {
    alignSelf: 'flex-start',
    minWidth: 130,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnInscrever: {
    backgroundColor: colors.assinarBtn,
  },
  btnCancelar: {
    backgroundColor: colors.deleteBtn,
  },
  btnDesabilitado: {
    opacity: 0.7,
  },
  btnTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
