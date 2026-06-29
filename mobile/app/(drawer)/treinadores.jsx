import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { confirm } from '../../src/confirm';
import { Ionicons } from '@expo/vector-icons';
import { createProfessor, deleteProfessor, getModalidades, getProfessores, updateProfessor } from '../../src/api';
import { maskCpf, maskData, maskTelefone, validarCPF } from '../../src/masks';
import { colors, radius } from '../../src/theme';
import CrudModal from '../../src/components/CrudModal';
import { SelectField, TextField } from '../../src/components/FormFields';

// Recriação de front/treinadoresFront/treinadores.html + .css + .js.
// Mesmo padrão de grade de cards + paginação da tela de Alunos, mas sem o
// enriquecimento assíncrono de plano (não se aplica a treinadores).

const SEXO_OPCOES = [
  { value: 'F', label: 'Feminino (F)' },
  { value: 'M', label: 'Masculino (M)' },
  { value: 'O', label: 'Outro (O)' },
];

const POR_PAGINA = 6;

const FORM_VAZIO = {
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  sexo: '',
  dataNascimento: '',
  modalidadeId: '',
  senha: '',
};

export default function TreinadoresScreen() {
  const styles = makeStyles();
  const [treinadores, setTreinadores] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [treinadoresData, modalidadesData] = await Promise.all([getProfessores(), getModalidades()]);
      setTreinadores(treinadoresData || []);
      setModalidades(modalidadesData || []);
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao carregar treinadores');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPagina(1);
  }, [busca, filtroModalidade]);

  const modalidadesMap = Object.fromEntries(modalidades.map((m) => [m.id, m.nome]));

  const treinadoresFiltrados = treinadores.filter((t) => {
    const termo = busca.trim().toLowerCase();
    const nomeOk = !termo || (t.nome || '').toLowerCase().includes(termo);
    const modOk = !filtroModalidade || String(t.modalidade_id || '') === String(filtroModalidade);
    return nomeOk && modOk;
  });

  const totalPaginas = Math.max(1, Math.ceil(treinadoresFiltrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const treinadoresPagina = treinadoresFiltrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function abrirNovo() {
    setEditId(null);
    setForm(FORM_VAZIO);
    setErros({});
    setModalVisible(true);
  }

  function abrirEdicao(treinador) {
    setEditId(treinador.id);
    setForm({
      nome: treinador.nome || '',
      email: treinador.email || '',
      cpf: maskCpf(treinador.cpf || ''),
      telefone: maskTelefone(treinador.telefone || ''),
      sexo: treinador.sexo || '',
      dataNascimento: treinador.data_nascimento ? String(treinador.data_nascimento).slice(0, 10) : '',
      modalidadeId: treinador.modalidade_id ? String(treinador.modalidade_id) : '',
      senha: treinador.senha || '',
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
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) novosErros.email = true;

    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (!cpfDigits || !validarCPF(cpfDigits)) novosErros.cpf = true;

    const telDigits = form.telefone.replace(/\D/g, '');
    if (!telDigits || telDigits.length < 8) novosErros.telefone = true;

    if (!['M', 'F', 'O'].includes(form.sexo)) novosErros.sexo = true;
    if (!form.dataNascimento || isNaN(Date.parse(form.dataNascimento))) novosErros.dataNascimento = true;
    if (!form.senha) novosErros.senha = true;

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados = {
      name: form.nome.trim(),
      cpf: cpfDigits,
      telefone: telDigits,
      sexo: form.sexo,
      data_nascimento: form.dataNascimento,
      email: form.email.trim(),
      senha: form.senha,
      modalidade_id: form.modalidadeId ? Number(form.modalidadeId) : null,
    };

    setSalvando(true);
    try {
      if (editId) {
        await updateProfessor(editId, dados);
      } else {
        await createProfessor(dados);
      }
      setModalVisible(false);
      await carregar();
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao salvar treinador');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(treinador) {
    confirm('Excluir treinador', `Tem certeza que deseja excluir o treinador "${treinador.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProfessor(treinador.id);
            await carregar();
          } catch (erro) {
            confirm('Erro', erro.message || 'Erro ao excluir treinador');
          }
        },
      },
    ]);
  }

  const filtroModalidadeOpcoes = [
    { value: '', label: 'Todas' },
    ...modalidades.map((m) => ({ value: String(m.id), label: m.nome })),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Text style={styles.heading}>Treinadores</Text>
        <TextInput
          style={styles.busca}
          placeholder="Buscar treinador..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        <View style={styles.situacaoRow}>
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
          <Text style={styles.btnNovoTexto}>+ Novo Treinador</Text>
        </Pressable>
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : treinadoresPagina.length === 0 ? (
        <Text style={styles.empty}>Nenhum treinador encontrado.</Text>
      ) : (
        <View style={styles.lista}>
          {treinadoresPagina.map((treinador) => (
            <View key={treinador.id} style={styles.card}>
              <Pressable style={styles.editBtn} onPress={() => abrirEdicao(treinador)}>
                <Ionicons name="pencil" size={18} color={colors.blue600} />
              </Pressable>
              <Pressable style={styles.deleteBtn} onPress={() => confirmarExclusao(treinador)}>
                <Ionicons name="trash" size={18} color={colors.deleteBtn} />
              </Pressable>
              <Text style={styles.cardTitle}>{treinador.nome}</Text>
              <Text style={styles.cardSpan}>E-mail: {treinador.email || ''}</Text>
              <Text style={styles.cardSpan}>CPF: {treinador.cpf || ''}</Text>
              <Text style={styles.cardSpan}>Telefone: {treinador.telefone || ''}</Text>
              <Text style={styles.cardSpan}>Modalidade: {modalidadesMap[treinador.modalidade_id] || 'Nenhuma'}</Text>
            </View>
          ))}
        </View>
      )}

      {totalPaginas > 1 && (
        <View style={styles.paginacao}>
          {Array.from({ length: totalPaginas }).map((_, i) => {
            const numero = i + 1;
            const ativo = numero === paginaAtual;
            return (
              <Pressable
                key={numero}
                onPress={() => setPagina(numero)}
                style={[styles.pagBtn, ativo && styles.pagBtnAtivo]}
              >
                <Text style={styles.pagBtnTexto}>{numero}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <CrudModal
        visible={modalVisible}
        title={editId ? 'Editar Treinador' : 'Novo Treinador'}
        onClose={fecharModal}
        onSalvar={salvar}
        salvando={salvando}
      >
        <TextField
          label="Nome"
          placeholder="Nome completo"
          value={form.nome}
          onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))}
          autoCapitalize="words"
          erro={erros.nome}
        />
        <TextField
          label="E-mail"
          placeholder="email@exemplo.com"
          value={form.email}
          onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
          autoCapitalize="none"
          keyboardType="email-address"
          erro={erros.email}
        />
        <TextField
          label="CPF"
          placeholder="000.000.000-00"
          value={form.cpf}
          onChangeText={(v) => setForm((f) => ({ ...f, cpf: maskCpf(v) }))}
          keyboardType="number-pad"
          maxLength={14}
          erro={erros.cpf}
        />
        <TextField
          label="Telefone"
          placeholder="(00) 00000-0000"
          value={form.telefone}
          onChangeText={(v) => setForm((f) => ({ ...f, telefone: maskTelefone(v) }))}
          keyboardType="number-pad"
          maxLength={15}
          erro={erros.telefone}
        />
        <SelectField
          label="Sexo"
          value={form.sexo}
          onChange={(v) => setForm((f) => ({ ...f, sexo: v }))}
          options={SEXO_OPCOES}
          erro={erros.sexo}
        />
        <TextField
          label="Data de Nascimento"
          placeholder="AAAA-MM-DD"
          value={form.dataNascimento}
          onChangeText={(v) => setForm((f) => ({ ...f, dataNascimento: maskData(v) }))}
          keyboardType="number-pad"
          maxLength={10}
          erro={erros.dataNascimento}
        />
        <SelectField
          label="Modalidade"
          value={form.modalidadeId}
          onChange={(v) => setForm((f) => ({ ...f, modalidadeId: v }))}
          options={modalidades.map((m) => ({ value: String(m.id), label: m.nome }))}
          placeholder="Nenhuma modalidade cadastrada"
        />
        <TextField
          label="Senha"
          placeholder="••••••••"
          value={form.senha}
          onChangeText={(v) => setForm((f) => ({ ...f, senha: v }))}
          secureTextEntry
          maxLength={32}
          erro={erros.senha}
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
  situacaoRow: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 10,
    marginBottom: 10,
  },
  cardSpan: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 8,
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
  paginacao: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  pagBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: colors.blue600,
  },
  pagBtnAtivo: {
    backgroundColor: colors.blue700,
  },
  pagBtnTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
