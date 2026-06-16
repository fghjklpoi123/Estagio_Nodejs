import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAluno, deleteAluno, getAlunoModalidades, getAlunoPlano, getAlunos, updateAluno } from '../../src/api';
import { maskCpf, maskData, maskTelefone, validarCPF } from '../../src/masks';
import { colors, radius } from '../../src/theme';
import CrudModal from '../../src/components/CrudModal';
import { SelectField, TextAreaField, TextField } from '../../src/components/FormFields';

// Recriação de front/alunosFront/alunos.html + alunos.css + alunos.js.
// Diferente de Planos, a listagem aqui é em grade de cards (.lista) com
// paginação, não uma table.striped.

const SEXO_OPCOES = [
  { value: 'F', label: 'Feminino (F)' },
  { value: 'M', label: 'Masculino (M)' },
  { value: 'O', label: 'Outro (O)' },
];

const SITUACAO_OPCOES = [
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Inativo', label: 'Inativo' },
];

const FILTRO_SITUACAO_OPCOES = [
  { value: '', label: 'Todas' },
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Inativo', label: 'Inativo' },
];

const POR_PAGINA = 6;

const FORM_VAZIO = {
  nome: '',
  email: '',
  dataNascimento: '',
  cpf: '',
  telefone: '',
  sexo: '',
  endereco: '',
  senha: '',
  situacao: 'Ativo',
  obs: '',
};

// Calcula a idade considerando se o aniversário deste ano já passou.
function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

// Card individual: busca plano + modalidades do aluno de forma assíncrona,
// igual ao enrichCards() de alunos.js (estado de carregando/erro/vazio).
function AlunoCard({ aluno, onEdit, onDelete }) {
  const [planoTexto, setPlanoTexto] = useState('Carregando plano...');

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      const [planoResult, modalidadesResult] = await Promise.allSettled([
        getAlunoPlano(aluno.id),
        getAlunoModalidades(aluno.id),
      ]);
      if (!ativo) return;

      if (planoResult.status !== 'fulfilled') {
        setPlanoTexto('Erro ao carregar plano');
        return;
      }

      const plano = planoResult.value;
      if (!plano) {
        setPlanoTexto('Plano: Nenhum');
        return;
      }

      let texto = `Plano: ${plano.descricao || plano.nome || '—'}`;
      if (plano.limite != null) {
        const limite = Number(plano.limite);
        const inscricoes = modalidadesResult.status === 'fulfilled' ? modalidadesResult.value || [] : [];
        const usadas = inscricoes.length;
        texto += ` — Vagas restantes: ${Math.max(0, limite - usadas)}`;
      }
      setPlanoTexto(texto);
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [aluno.id]);

  const idade = calcularIdade(aluno.data_nascimento);

  return (
    <View style={styles.card}>
      <Pressable style={styles.editBtn} onPress={onEdit}>
        <Ionicons name="pencil" size={18} color={colors.blue600} />
      </Pressable>
      <Pressable style={styles.deleteBtn} onPress={onDelete}>
        <Ionicons name="trash" size={18} color={colors.deleteBtn} />
      </Pressable>
      <Text style={styles.cardTitle}>{aluno.nome}</Text>
      <Text style={styles.cardSpan}>Idade: {idade != null ? `${idade} anos` : '—'}</Text>
      <Text style={styles.cardSpan}>CPF: {aluno.cpf}</Text>
      <Text style={styles.cardSpan}>Situação: {aluno.situacao}</Text>
      <Text style={styles.planInfo}>{planoTexto}</Text>
    </View>
  );
}

export default function AlunosScreen() {
  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('');
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
      const data = await getAlunos();
      setAlunos(data || []);
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Erro ao carregar alunos');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPagina(1);
  }, [busca, filtroSituacao]);

  const alunosFiltrados = alunos.filter((a) => {
    const termo = busca.trim().toLowerCase();
    const nomeOk = !termo || (a.nome || '').toLowerCase().includes(termo);
    const situacaoOk = !filtroSituacao || a.situacao === filtroSituacao;
    return nomeOk && situacaoOk;
  });

  const totalPaginas = Math.max(1, Math.ceil(alunosFiltrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const alunosPagina = alunosFiltrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function abrirNovo() {
    setEditId(null);
    setForm(FORM_VAZIO);
    setErros({});
    setModalVisible(true);
  }

  function abrirEdicao(aluno) {
    setEditId(aluno.id);
    setForm({
      nome: aluno.nome || '',
      email: aluno.email || '',
      dataNascimento: aluno.data_nascimento ? String(aluno.data_nascimento).slice(0, 10) : '',
      cpf: maskCpf(aluno.cpf || ''),
      telefone: maskTelefone(aluno.telefone || ''),
      sexo: aluno.sexo || '',
      endereco: aluno.endereco || '',
      senha: aluno.senha || '',
      situacao: aluno.situacao || 'Ativo',
      obs: aluno.obs || '',
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
    if (!form.dataNascimento || isNaN(Date.parse(form.dataNascimento))) novosErros.dataNascimento = true;

    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (!cpfDigits || !validarCPF(cpfDigits)) novosErros.cpf = true;

    const telDigits = form.telefone.replace(/\D/g, '');
    if (telDigits && telDigits.length < 8) novosErros.telefone = true;

    if (!form.senha) novosErros.senha = true;

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const sexo = (form.sexo || 'O').toUpperCase();
    const dadosBase = {
      cpf: cpfDigits,
      telefone: telDigits,
      sexo,
      data_nascimento: form.dataNascimento,
      email: form.email.trim(),
      senha: form.senha,
      endereco: form.endereco.trim(),
      situacao: form.situacao || 'Ativo',
      obs: form.obs,
    };

    setSalvando(true);
    try {
      if (editId) {
        // O endpoint de update espera a chave "nome" (e ignora endereco/situacao/obs).
        await updateAluno(editId, { ...dadosBase, nome: form.nome.trim() });
      } else {
        // O endpoint de criação espera a chave "name".
        await createAluno({ ...dadosBase, name: form.nome.trim() });
      }
      setModalVisible(false);
      await carregar();
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Erro ao salvar aluno');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(aluno) {
    Alert.alert('Excluir aluno', `Tem certeza que deseja excluir o aluno "${aluno.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAluno(aluno.id);
            await carregar();
          } catch (erro) {
            Alert.alert('Erro', erro.message || 'Erro ao excluir aluno');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Text style={styles.heading}>Alunos</Text>
        <TextInput
          style={styles.busca}
          placeholder="Buscar aluno..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        <View style={styles.situacaoRow}>
          {FILTRO_SITUACAO_OPCOES.map((opt) => {
            const ativo = filtroSituacao === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setFiltroSituacao(opt.value)}
                style={[styles.filtroChip, ativo && styles.filtroChipAtivo]}
              >
                <Text style={[styles.filtroChipTexto, ativo && styles.filtroChipTextoAtivo]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.btnNovo} onPress={abrirNovo}>
          <Text style={styles.btnNovoTexto}>+ Novo Aluno</Text>
        </Pressable>
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : alunosPagina.length === 0 ? (
        <Text style={styles.empty}>Nenhum aluno encontrado.</Text>
      ) : (
        <View style={styles.lista}>
          {alunosPagina.map((aluno) => (
            <AlunoCard
              key={aluno.id}
              aluno={aluno}
              onEdit={() => abrirEdicao(aluno)}
              onDelete={() => confirmarExclusao(aluno)}
            />
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
        title={editId ? 'Editar Aluno' : 'Novo Aluno'}
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
          label="Data de Nascimento"
          placeholder="AAAA-MM-DD"
          value={form.dataNascimento}
          onChangeText={(v) => setForm((f) => ({ ...f, dataNascimento: maskData(v) }))}
          keyboardType="number-pad"
          maxLength={10}
          erro={erros.dataNascimento}
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
        />
        <TextField
          label="Endereço"
          placeholder="Rua, número, cidade"
          value={form.endereco}
          onChangeText={(v) => setForm((f) => ({ ...f, endereco: v }))}
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
        <SelectField
          label="Situação"
          value={form.situacao}
          onChange={(v) => setForm((f) => ({ ...f, situacao: v }))}
          options={SITUACAO_OPCOES}
        />
        <TextAreaField
          label="Observação"
          placeholder="Observações sobre o aluno..."
          value={form.obs}
          onChangeText={(v) => setForm((f) => ({ ...f, obs: v }))}
        />
      </CrudModal>
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
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  filtroChipAtivo: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
  },
  filtroChipTexto: {
    color: '#333',
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
    marginTop: 10,
    marginBottom: 10,
  },
  cardSpan: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 8,
  },
  planInfo: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
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
