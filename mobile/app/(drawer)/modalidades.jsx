import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { confirm } from '../../src/confirm';
import { Ionicons } from '@expo/vector-icons';
import { createModalidade, deleteModalidade, getModalidades, updateModalidade } from '../../src/api';
import { colors, radius } from '../../src/theme';
import CrudModal from '../../src/components/CrudModal';
import { TextAreaField, TextField } from '../../src/components/FormFields';

// Recriação de front/modalidadesFront/modalidades.html + .css + .js (visão admin).
// O original é uma página de CRUD simples: grade de cards com nome + descrição,
// botões editar/excluir, e um modal com apenas dois campos (nome e descrição).
// A busca filtra por nome OU descrição.

const FORM_VAZIO = { nome: '', descricao: '' };

export default function ModalidadesScreen() {
  const styles = makeStyles();
  const [modalidades, setModalidades] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await getModalidades();
      setModalidades(data || []);
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao carregar modalidades');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const modalidadesFiltradas = modalidades.filter((m) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (m.nome || '').toLowerCase().includes(termo) || (m.descricao || '').toLowerCase().includes(termo);
  });

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
      confirm('Erro', erro.message || 'Erro ao salvar modalidade');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(modalidade) {
    confirm('Excluir modalidade', `Tem certeza que deseja excluir "${modalidade.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteModalidade(modalidade.id);
            await carregar();
          } catch (erro) {
            confirm('Erro', erro.message || 'Erro ao excluir modalidade');
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
        <Pressable style={styles.btnNovo} onPress={abrirNovo}>
          <Text style={styles.btnNovoTexto}>+ Nova Modalidade</Text>
        </Pressable>
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : modalidadesFiltradas.length === 0 ? (
        <Text style={styles.empty}>Nenhuma modalidade encontrada.</Text>
      ) : (
        <View style={styles.lista}>
          {modalidadesFiltradas.map((modalidade) => (
            <View key={modalidade.id} style={styles.card}>
              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtn} onPress={() => abrirEdicao(modalidade)}>
                  <Ionicons name="pencil" size={18} color={colors.blue600} />
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => confirmarExclusao(modalidade)}>
                  <Ionicons name="trash" size={18} color={colors.deleteBtn} />
                </Pressable>
              </View>
              <Text style={styles.cardTitle}>{modalidade.nome}</Text>
              {modalidade.descricao ? <Text style={styles.cardDesc}>{modalidade.descricao}</Text> : null}
            </View>
          ))}
        </View>
      )}

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
});
