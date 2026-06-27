import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { confirm } from '../../src/confirm';
import { createLancamento, deleteLancamento, getLancamentos, getResumoFinanceiro, updateLancamento } from '../../src/api';
import { maskData } from '../../src/masks';
import { colors, radius } from '../../src/theme';

const CATEGORIAS_RECEITA = ['Mensalidade', 'Taxa de matrícula', 'Outros'];
const CATEGORIAS_DESPESA = ['Salário professor', 'Material/Equipamento', 'Manutenção', 'Outros'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatarValor(v) {
  const n = Number(v) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(d) {
  if (!d) return '—';
  return String(d).slice(0, 10).split('-').reverse().join('/');
}

const FORM_VAZIO = { tipo: 'receita', categoria: '', descricao: '', valorStr: '', data: '' };

function maskMoeda(value) {
  let digits = value.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';
  digits = digits.padStart(3, '0');
  const intPart = digits.slice(0, -2).replace(/^0+(?=\d)/, '');
  const centPart = digits.slice(-2);
  return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${centPart}`;
}

function parseValorBr(str) {
  if (!str) return NaN;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

export default function FinanceiroScreen() {
  const [lancamentos, setLancamentos] = useState([]);
  const [resumo, setResumo] = useState({ total_receitas: 0, total_despesas: 0, balanco: 0 });
  const [carregando, setCarregando] = useState(true);

  const agora = new Date();
  const [filtroMes, setFiltroMes] = useState(String(agora.getMonth() + 1));
  const [filtroAno, setFiltroAno] = useState(String(agora.getFullYear()));
  const [filtroTipo, setFiltroTipo] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const filtros = {};
      if (filtroMes) filtros.mes = filtroMes;
      if (filtroAno) filtros.ano = filtroAno;
      if (filtroTipo) filtros.tipo = filtroTipo;

      const filtrosResumo = {};
      if (filtroMes) filtrosResumo.mes = filtroMes;
      if (filtroAno) filtrosResumo.ano = filtroAno;

      const [lancData, resumoData] = await Promise.all([getLancamentos(filtros), getResumoFinanceiro(filtrosResumo)]);
      setLancamentos(lancData || []);
      setResumo(resumoData || { total_receitas: 0, total_despesas: 0, balanco: 0 });
    } catch {
      setLancamentos([]);
    } finally {
      setCarregando(false);
    }
  }, [filtroMes, filtroAno, filtroTipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const categorias = form.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  function abrirNovo() {
    setEditId(null);
    setForm(FORM_VAZIO);
    setErros({});
    setModalVisible(true);
  }

  function abrirEdicao(lanc) {
    setEditId(lanc.id);
    setForm({
      tipo: lanc.tipo,
      categoria: lanc.categoria || '',
      descricao: lanc.descricao || '',
      valorStr: formatarValor(lanc.valor).replace('R$', '').trim(),
      data: lanc.data ? String(lanc.data).slice(0, 10) : '',
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
    if (!form.categoria) novosErros.categoria = true;
    const valor = parseValorBr(form.valorStr);
    if (!form.valorStr || isNaN(valor) || valor <= 0) novosErros.valorStr = true;
    if (!form.data || form.data.length < 10) novosErros.data = true;
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados = { tipo: form.tipo, categoria: form.categoria, descricao: form.descricao, valor, data: form.data };

    setSalvando(true);
    try {
      if (editId) {
        await updateLancamento(editId, dados);
      } else {
        await createLancamento(dados);
      }
      setModalVisible(false);
      await carregar();
    } catch (erro) {
      confirm('Erro', erro.message || 'Erro ao salvar lançamento');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(lanc) {
    confirm('Excluir lançamento', `Excluir "${lanc.categoria} - ${formatarValor(lanc.valor)}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try { await deleteLancamento(lanc.id); await carregar(); }
          catch (erro) { confirm('Erro', erro.message || 'Erro ao excluir'); }
        },
      },
    ]);
  }

  const anosDisponiveis = [];
  for (let a = agora.getFullYear() - 2; a <= agora.getFullYear() + 1; a++) anosDisponiveis.push(String(a));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Financeiro</Text>

      {/* Cards resumo */}
      <View style={styles.resumoRow}>
        <View style={[styles.resumoCard, styles.resumoReceita]}>
          <Ionicons name="trending-up" size={24} color="#fff" />
          <Text style={styles.resumoValor}>{formatarValor(resumo.total_receitas)}</Text>
          <Text style={styles.resumoLabel}>Receitas</Text>
        </View>
        <View style={[styles.resumoCard, styles.resumoDespesa]}>
          <Ionicons name="trending-down" size={24} color="#fff" />
          <Text style={styles.resumoValor}>{formatarValor(resumo.total_despesas)}</Text>
          <Text style={styles.resumoLabel}>Despesas</Text>
        </View>
      </View>
      <View style={[styles.balancoCard, resumo.balanco >= 0 ? styles.balancoPositivo : styles.balancoNegativo]}>
        <Ionicons name={resumo.balanco >= 0 ? 'wallet' : 'alert-circle'} size={28} color={resumo.balanco >= 0 ? colors.planoPreco : colors.deleteBtn} />
        <View>
          <Text style={[styles.balancoValor, resumo.balanco < 0 && styles.balancoValorNeg]}>{formatarValor(resumo.balanco)}</Text>
          <Text style={styles.balancoLabel}>Balanço {MESES[(filtroMes || 1) - 1]}/{filtroAno}</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        <View style={styles.filtroRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {MESES.map((m, i) => {
              const val = String(i + 1);
              const ativo = filtroMes === val;
              return (
                <Pressable key={val} onPress={() => setFiltroMes(ativo ? '' : val)} style={[styles.chip, ativo && styles.chipAtivo]}>
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{m}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View style={styles.filtroRow}>
          {anosDisponiveis.map((a) => {
            const ativo = filtroAno === a;
            return (
              <Pressable key={a} onPress={() => setFiltroAno(a)} style={[styles.chip, ativo && styles.chipAtivo]}>
                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{a}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.filtroRow}>
          {[{ v: '', l: 'Todos' }, { v: 'receita', l: 'Receitas' }, { v: 'despesa', l: 'Despesas' }].map((f) => {
            const ativo = filtroTipo === f.v;
            return (
              <Pressable key={f.v} onPress={() => setFiltroTipo(f.v)} style={[styles.chip, ativo && styles.chipAtivo]}>
                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{f.l}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.btnNovo} onPress={abrirNovo}>
        <Text style={styles.btnNovoTexto}>+ Novo Lançamento</Text>
      </Pressable>

      {/* Lista */}
      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : lancamentos.length === 0 ? (
        <Text style={styles.empty}>Nenhum lançamento neste período.</Text>
      ) : (
        lancamentos.map((lanc) => (
          <View key={lanc.id} style={styles.lancItem}>
            <View style={[styles.lancIcone, lanc.tipo === 'receita' ? styles.lancIconeReceita : styles.lancIconeDespesa]}>
              <Ionicons name={lanc.tipo === 'receita' ? 'arrow-up' : 'arrow-down'} size={18} color="#fff" />
            </View>
            <View style={styles.lancTextos}>
              <Text style={styles.lancCategoria}>{lanc.categoria}</Text>
              {lanc.descricao ? <Text style={styles.lancDesc} numberOfLines={1}>{lanc.descricao}</Text> : null}
              <Text style={styles.lancData}>{formatarData(lanc.data)}</Text>
            </View>
            <Text style={[styles.lancValor, lanc.tipo === 'receita' ? styles.lancValorReceita : styles.lancValorDespesa]}>
              {lanc.tipo === 'receita' ? '+' : '-'} {formatarValor(lanc.valor)}
            </Text>
            <View style={styles.lancAcoes}>
              <Pressable onPress={() => abrirEdicao(lanc)} style={styles.lancAcaoBtn}>
                <Ionicons name="pencil" size={16} color={colors.blue600} />
              </Pressable>
              <Pressable onPress={() => confirmarExclusao(lanc)} style={styles.lancAcaoBtn}>
                <Ionicons name="trash" size={16} color={colors.deleteBtn} />
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={fecharModal}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editId ? 'Editar Lançamento' : 'Novo Lançamento'}</Text>

              <Text style={styles.label}>Tipo</Text>
              <View style={styles.chipRow}>
                {[{ v: 'receita', l: 'Receita', icon: 'trending-up', cor: colors.planoPreco }, { v: 'despesa', l: 'Despesa', icon: 'trending-down', cor: colors.deleteBtn }].map((t) => {
                  const ativo = form.tipo === t.v;
                  return (
                    <Pressable key={t.v} onPress={() => setForm((f) => ({ ...f, tipo: t.v, categoria: '' }))} style={[styles.tipoChip, ativo && { backgroundColor: t.cor, borderColor: t.cor }]}>
                      <Ionicons name={t.icon} size={16} color={ativo ? '#fff' : '#666'} />
                      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{t.l}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, erros.categoria && styles.labelErro]}>Categoria</Text>
              <View style={styles.chipRow}>
                {categorias.map((cat) => {
                  const ativo = form.categoria === cat;
                  return (
                    <Pressable key={cat} onPress={() => setForm((f) => ({ ...f, categoria: cat }))} style={[styles.chip, ativo && styles.chipAtivo, erros.categoria && styles.chipErro]}>
                      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, erros.valorStr && styles.labelErro]}>Valor (R$)</Text>
              <TextInput
                style={[styles.input, erros.valorStr && styles.inputErro]}
                placeholder="0,00"
                placeholderTextColor="#9aa6b5"
                value={form.valorStr}
                onChangeText={(v) => setForm((f) => ({ ...f, valorStr: maskMoeda(v) }))}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Descrição do lançamento..."
                placeholderTextColor="#9aa6b5"
                value={form.descricao}
                onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))}
                multiline
                textAlignVertical="top"
              />

              <Text style={[styles.label, erros.data && styles.labelErro]}>Data</Text>
              <TextInput
                style={[styles.input, erros.data && styles.inputErro]}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#9aa6b5"
                value={form.data}
                onChangeText={(v) => setForm((f) => ({ ...f, data: maskData(v) }))}
                keyboardType="number-pad"
                maxLength={10}
              />

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.textDark, marginBottom: 20 },

  resumoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  resumoCard: { flex: 1, borderRadius: radius.lg, padding: 18, alignItems: 'center', gap: 6 },
  resumoReceita: { backgroundColor: colors.planoPreco },
  resumoDespesa: { backgroundColor: colors.deleteBtn },
  resumoValor: { color: '#fff', fontSize: 20, fontWeight: '700' },
  resumoLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },

  balancoCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 20, marginBottom: 20, borderWidth: 2 },
  balancoPositivo: { backgroundColor: '#e8f5e9', borderColor: colors.planoPreco },
  balancoNegativo: { backgroundColor: '#ffebee', borderColor: colors.deleteBtn },
  balancoValor: { fontSize: 24, fontWeight: '700', color: colors.planoPreco },
  balancoValorNeg: { color: colors.deleteBtn },
  balancoLabel: { fontSize: 12, color: colors.muted },

  filtros: { gap: 8, marginBottom: 16 },
  filtroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipScroll: { gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
  chipAtivo: { backgroundColor: colors.blue600, borderColor: colors.blue600 },
  chipErro: { borderColor: colors.deleteBtn },
  chipTexto: { color: '#333', fontWeight: '600', fontSize: 12 },
  chipTextoAtivo: { color: '#fff' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  tipoChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },

  btnNovo: { backgroundColor: colors.blue600, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16 },
  btnNovoTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },

  loading: { marginTop: 16 },
  empty: { color: colors.muted, fontSize: 13, fontStyle: 'italic', marginTop: 8 },

  lancItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: radius.sm, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  lancIcone: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lancIconeReceita: { backgroundColor: colors.planoPreco },
  lancIconeDespesa: { backgroundColor: colors.deleteBtn },
  lancTextos: { flex: 1 },
  lancCategoria: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  lancDesc: { fontSize: 12, color: colors.muted },
  lancData: { fontSize: 11, color: '#aaa', marginTop: 2 },
  lancValor: { fontSize: 14, fontWeight: '700', marginRight: 4 },
  lancValorReceita: { color: colors.planoPreco },
  lancValorDespesa: { color: colors.deleteBtn },
  lancAcoes: { gap: 2 },
  lancAcaoBtn: { padding: 4 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 500, maxHeight: '90%', backgroundColor: '#fff', borderRadius: radius.lg, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginBottom: 8 },
  modalActions: { gap: 10, marginTop: 20 },

  label: { fontWeight: '600', color: '#333', fontSize: 14, marginTop: 12, marginBottom: 6 },
  labelErro: { color: colors.deleteBtn, fontWeight: '700' },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: '#fff', fontSize: 14, color: colors.textDark },
  inputErro: { borderColor: colors.deleteBtn, backgroundColor: '#fff5f5' },
  textarea: { minHeight: 60, maxHeight: 150 },

  btn: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: radius.sm, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.blue600 },
  btnPrimaryTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { backgroundColor: colors.btnSecondaryBg },
  btnSecondaryTexto: { color: colors.btnSecondaryTexto, fontWeight: '700', fontSize: 14 },
});
