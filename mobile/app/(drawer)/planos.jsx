import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { confirm } from '../../src/confirm';
import { createPlano, deletePlano, getModalidades, getPlanos, updatePlano } from '../../src/api';
import { colors, radius } from '../../src/theme';
import CrudModal from '../../src/components/CrudModal';
import StripedTable from '../../src/components/StripedTable';
import { SelectField, TextAreaField, TextField } from '../../src/components/FormFields';

// Recriação de front/planoFront/plano.html + plano.css + plano-crud.js.

function formatarParaPtBr(valorNum) {
  const num = Number(valorNum) || 0;
  return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?=,))/g, '.');
}

function parseValorBr(str) {
  if (!str) return NaN;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

// Máscara de moeda: trata a entrada como centavos, limitando a 3 dígitos
// inteiros + 2 decimais (igual ao inputValor de plano-crud.js, máx 999,99).
function maskMoeda(value) {
  let digits = value.replace(/\D/g, '').slice(0, 5);
  if (!digits) return '';
  digits = digits.padStart(3, '0');
  const intPart = digits.slice(0, -2).replace(/^0+(?=\d)/, '');
  const centPart = digits.slice(-2);
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intFormatted},${centPart}`;
}

const FORM_VAZIO = { modalidadeId: '', valorStr: '', descricao: '' };

export default function PlanosScreen() {
  const styles = makeStyles();
  const [planos, setPlanos] = useState([]);
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
      const [planosData, modalidadesData] = await Promise.all([getPlanos(), getModalidades()]);
      setPlanos(planosData || []);
      setModalidades(modalidadesData || []);
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao carregar planos');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const modalidadesMap = Object.fromEntries(modalidades.map((m) => [m.id, m.nome]));

  const planosFiltrados = planos.filter((p) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    const nomeModalidade = modalidadesMap[p.modalidade_id] || '';
    return (p.descricao || '').toLowerCase().includes(termo) || nomeModalidade.toLowerCase().includes(termo);
  });

  function abrirNovo() {
    setEditId(null);
    setForm(FORM_VAZIO);
    setErros({});
    setModalVisible(true);
  }

  function abrirEdicao(plano) {
    setEditId(plano.id);
    setForm({
      modalidadeId: String(plano.modalidade_id ?? ''),
      valorStr: formatarParaPtBr(plano.preco),
      descricao: plano.descricao || '',
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
    if (!form.descricao.trim()) novosErros.descricao = true;
    const valor = parseValorBr(form.valorStr);
    if (!form.valorStr || isNaN(valor) || valor <= 0) novosErros.valorStr = true;
    if (!form.modalidadeId) novosErros.modalidadeId = true;

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados = {
      descricao: form.descricao.trim(),
      preco: valor,
      modalidade_id: Number(form.modalidadeId),
    };

    setSalvando(true);
    try {
      if (editId) {
        await updatePlano(editId, dados);
      } else {
        await createPlano(dados);
      }
      setModalVisible(false);
      await carregar();
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao salvar plano');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(plano) {
    confirm(
      'Excluir plano',
      `Tem certeza que deseja excluir o plano de "${modalidadesMap[plano.modalidade_id] || 'modalidade'}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlano(plano.id);
              await carregar();
            } catch (erro) {
              confirm('Erro', erro.message || 'Erro ao excluir plano');
            }
          },
        },
      ]
    );
  }

  const colunas = [
    { key: 'modalidade', label: 'MODALIDADE', width: 160, render: (p) => modalidadesMap[p.modalidade_id] || '-' },
    { key: 'preco', label: 'VALOR (R$)', width: 110, render: (p) => formatarParaPtBr(p.preco) },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Text style={styles.heading}>Planos</Text>
        <TextInput
          style={styles.busca}
          placeholder="Buscar Plano..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        <Pressable style={styles.btnNovo} onPress={abrirNovo}>
          <Text style={styles.btnNovoTexto}>+ Novo Plano</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Planos Cadastrados</Text>
        {carregando ? (
          <Text style={styles.empty}>Carregando...</Text>
        ) : (
          <StripedTable
            columns={colunas}
            data={planosFiltrados}
            keyExtractor={(p) => String(p.id)}
            onEdit={abrirEdicao}
            onDelete={confirmarExclusao}
          />
        )}
      </View>

      <CrudModal
        visible={modalVisible}
        title={editId ? 'Editar Plano' : 'Novo Plano'}
        onClose={fecharModal}
        onSalvar={salvar}
        salvando={salvando}
      >
        <SelectField
          label="Modalidade"
          value={form.modalidadeId}
          onChange={(v) => setForm((f) => ({ ...f, modalidadeId: v }))}
          options={modalidades.map((m) => ({ value: String(m.id), label: m.nome }))}
          erro={erros.modalidadeId}
          placeholder="Nenhuma modalidade cadastrada"
        />
        <TextField
          label="Valor (R$)"
          placeholder="Ex: 99,90"
          value={form.valorStr}
          onChangeText={(v) => setForm((f) => ({ ...f, valorStr: maskMoeda(v) }))}
          keyboardType="number-pad"
          erro={erros.valorStr}
        />
        <TextAreaField
          label="Descrição"
          placeholder="Descreva o plano..."
          value={form.descricao}
          onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))}
          erro={erros.descricao}
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  btnNovoTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
