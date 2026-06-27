import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRelatorioDinamico } from '../../src/api';
import { colors, radius } from '../../src/theme';

const ENTIDADES = [
  { value: 'alunos', label: 'Alunos', icon: 'people' },
  { value: 'financeiro', label: 'Financeiro', icon: 'wallet' },
  { value: 'presencas', label: 'Presenças', icon: 'calendar' },
  { value: 'planos', label: 'Planos', icon: 'list' },
  { value: 'modalidades', label: 'Modalidades', icon: 'barbell' },
];

const FILTROS_POR_ENTIDADE = {
  alunos: [
    { key: 'situacao', label: 'Situação', chips: ['', 'Ativo', 'Inativo'] },
    { key: 'sexo', label: 'Sexo', chips: ['', 'M', 'F', 'O'] },
    { key: 'sem_modalidade', label: 'Sem modalidade', chips: ['', 'true'], chipLabels: ['Todos', 'Somente sem'] },
    { key: 'sem_plano', label: 'Sem plano', chips: ['', 'true'], chipLabels: ['Todos', 'Somente sem'] },
  ],
  financeiro: [
    { key: 'tipo', label: 'Tipo', chips: ['', 'receita', 'despesa'] },
    { key: 'ano', label: 'Ano', input: true, placeholder: '2026', keyboard: 'number-pad' },
    { key: 'mes', label: 'Mês', input: true, placeholder: '1-12', keyboard: 'number-pad' },
  ],
  presencas: [
    { key: 'ano', label: 'Ano', input: true, placeholder: '2026', keyboard: 'number-pad' },
    { key: 'mes', label: 'Mês', input: true, placeholder: '1-12', keyboard: 'number-pad' },
  ],
  planos: [],
  modalidades: [
    { key: 'sem_alunos', label: 'Sem alunos', chips: ['', 'true'], chipLabels: ['Todas', 'Somente sem'] },
  ],
};

const COLUNAS_POR_ENTIDADE = {
  alunos: [
    { key: 'nome', label: 'Nome' },
    { key: 'cpf', label: 'CPF' },
    { key: 'email', label: 'E-mail' },
    { key: 'situacao', label: 'Situação' },
    { key: 'sexo', label: 'Sexo' },
    { key: 'modalidades', label: 'Modalidades' },
    { key: 'total_planos', label: 'Planos' },
  ],
  financeiro: [
    { key: 'tipo', label: 'Tipo' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'quantidade', label: 'Qtd' },
    { key: 'total', label: 'Total (R$)', format: (v) => Number(v).toFixed(2).replace('.', ',') },
  ],
  presencas: [
    { key: 'aluno_nome', label: 'Aluno' },
    { key: 'total_checkins', label: 'Check-ins' },
    { key: 'primeiro_checkin', label: 'Primeiro', format: formatarData },
    { key: 'ultimo_checkin', label: 'Último', format: formatarData },
  ],
  planos: [
    { key: 'descricao', label: 'Plano' },
    { key: 'modalidade', label: 'Modalidade' },
    { key: 'preco', label: 'Preço (R$)', format: (v) => Number(v).toFixed(2).replace('.', ',') },
    { key: 'total_assinantes', label: 'Assinantes' },
    { key: 'receita_estimada', label: 'Receita est. (R$)', format: (v) => Number(v).toFixed(2).replace('.', ',') },
  ],
  modalidades: [
    { key: 'nome', label: 'Nome' },
    { key: 'total_alunos', label: 'Alunos' },
    { key: 'total_exercicios', label: 'Exercícios' },
    { key: 'professores', label: 'Professores' },
  ],
};

function formatarData(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

export default function RelatoriosScreen() {
  const [entidade, setEntidade] = useState('');
  const [filtros, setFiltros] = useState({});
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  function selecionarEntidade(ent) {
    setEntidade(ent);
    setFiltros({});
    setResultado(null);
  }

  function setFiltro(key, value) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  async function gerarRelatorio() {
    if (!entidade) return;
    setCarregando(true);
    try {
      const data = await getRelatorioDinamico({ entidade, ...filtros });
      setResultado(data);
    } catch (erro) {
      setResultado({ erro: erro.message || 'Erro ao gerar relatório' });
    } finally {
      setCarregando(false);
    }
  }

  const filtrosConfig = FILTROS_POR_ENTIDADE[entidade] || [];
  const colunas = COLUNAS_POR_ENTIDADE[entidade] || [];
  const dados = resultado?.dados || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Relatórios</Text>

      <Text style={styles.label}>O que deseja consultar?</Text>
      <View style={styles.entidadeRow}>
        {ENTIDADES.map((e) => {
          const ativo = entidade === e.value;
          return (
            <Pressable key={e.value} onPress={() => selecionarEntidade(e.value)} style={[styles.entidadeChip, ativo && styles.entidadeChipAtivo]}>
              <Ionicons name={e.icon} size={20} color={ativo ? '#fff' : colors.blue600} />
              <Text style={[styles.entidadeTexto, ativo && styles.entidadeTextoAtivo]}>{e.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {entidade && filtrosConfig.length > 0 && (
        <View style={styles.filtrosBox}>
          <Text style={styles.filtrosTitulo}>Filtros</Text>
          {filtrosConfig.map((f) => (
            <View key={f.key} style={styles.filtroItem}>
              <Text style={styles.filtroLabel}>{f.label}</Text>
              {f.chips ? (
                <View style={styles.chipRow}>
                  {f.chips.map((chip, i) => {
                    const ativo = (filtros[f.key] || '') === chip;
                    const chipLabel = f.chipLabels ? f.chipLabels[i] : (chip || 'Todos');
                    return (
                      <Pressable key={chip} onPress={() => setFiltro(f.key, chip)} style={[styles.chip, ativo && styles.chipAtivo]}>
                        <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{chipLabel}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : f.input ? (
                <TextInput
                  style={styles.filtroInput}
                  placeholder={f.placeholder}
                  placeholderTextColor="#999"
                  value={filtros[f.key] || ''}
                  onChangeText={(v) => setFiltro(f.key, v)}
                  keyboardType={f.keyboard || 'default'}
                />
              ) : null}
            </View>
          ))}
        </View>
      )}

      {entidade && (
        <Pressable style={styles.btnGerar} onPress={gerarRelatorio} disabled={carregando}>
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.btnGerarTexto}>Gerar Relatório</Text>
            </>
          )}
        </Pressable>
      )}

      {resultado && !resultado.erro && (
        <View style={styles.resultadoBox}>
          {resultado.total != null && (
            <Text style={styles.resultadoResumo}>{resultado.total} registro(s) encontrado(s)</Text>
          )}
          {resultado.resumo && (
            <View style={styles.resumoRow}>
              <View style={[styles.resumoCard, { backgroundColor: colors.planoPreco }]}>
                <Text style={styles.resumoValor}>R$ {Number(resultado.resumo.total_receitas).toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.resumoLabel}>Receitas</Text>
              </View>
              <View style={[styles.resumoCard, { backgroundColor: colors.deleteBtn }]}>
                <Text style={styles.resumoValor}>R$ {Number(resultado.resumo.total_despesas).toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.resumoLabel}>Despesas</Text>
              </View>
              <View style={[styles.resumoCard, { backgroundColor: resultado.resumo.balanco >= 0 ? colors.blue600 : '#c0392b' }]}>
                <Text style={styles.resumoValor}>R$ {Number(resultado.resumo.balanco).toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.resumoLabel}>Balanço</Text>
              </View>
            </View>
          )}
          {resultado.total_checkins != null && (
            <Text style={styles.resultadoResumo}>Total de check-ins: {resultado.total_checkins}</Text>
          )}

          {dados.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabelaScroll}>
              <View>
                <View style={styles.tabelaHeader}>
                  {colunas.map((col) => (
                    <Text key={col.key} style={styles.th}>{col.label}</Text>
                  ))}
                </View>
                {dados.map((row, i) => (
                  <View key={i} style={[styles.tabelaRow, i % 2 === 0 && styles.tabelaRowAlt]}>
                    {colunas.map((col) => {
                      const val = row[col.key];
                      const texto = col.format ? col.format(val) : (val != null ? String(val) : '—');
                      return <Text key={col.key} style={styles.td} numberOfLines={2}>{texto}</Text>;
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.empty}>Nenhum dado encontrado com esses filtros.</Text>
          )}
        </View>
      )}

      {resultado?.erro && (
        <View style={styles.erroBox}>
          <Text style={styles.erroTexto}>{resultado.erro}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.textDark, marginBottom: 20 },
  label: { fontWeight: '600', color: '#333', fontSize: 14, marginBottom: 10 },

  entidadeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  entidadeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.blue600, backgroundColor: '#fff' },
  entidadeChipAtivo: { backgroundColor: colors.blue600 },
  entidadeTexto: { fontSize: 14, fontWeight: '700', color: colors.blue600 },
  entidadeTextoAtivo: { color: '#fff' },

  filtrosBox: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  filtrosTitulo: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 12 },
  filtroItem: { marginBottom: 12 },
  filtroLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#f9f9f9' },
  chipAtivo: { backgroundColor: colors.blue600, borderColor: colors.blue600 },
  chipTexto: { color: '#333', fontWeight: '600', fontSize: 12 },
  chipTextoAtivo: { color: '#fff' },
  filtroInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#fff', color: '#333' },

  btnGerar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.blue600, borderRadius: radius.sm, paddingVertical: 14, marginBottom: 20 },
  btnGerarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },

  resultadoBox: { marginTop: 4 },
  resultadoResumo: { fontSize: 14, fontWeight: '600', color: colors.textDark, marginBottom: 12 },
  resumoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  resumoCard: { flex: 1, borderRadius: radius.sm, padding: 14, alignItems: 'center' },
  resumoValor: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resumoLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 4 },

  tabelaScroll: { marginTop: 8 },
  tabelaHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.blue600 },
  th: { width: 130, fontSize: 11, fontWeight: '700', color: colors.blue600, textTransform: 'uppercase', paddingVertical: 10, paddingHorizontal: 8 },
  tabelaRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabelaRowAlt: { backgroundColor: '#f9fafb' },
  td: { width: 130, fontSize: 13, color: '#333', paddingVertical: 10, paddingHorizontal: 8 },

  empty: { color: colors.muted, fontSize: 13, fontStyle: 'italic', marginTop: 8 },
  erroBox: { backgroundColor: colors.erroBg, borderRadius: radius.sm, padding: 14, marginTop: 12 },
  erroTexto: { color: colors.erroTexto, fontWeight: '600', textAlign: 'center' },
});
