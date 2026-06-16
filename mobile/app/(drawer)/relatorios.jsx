import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getRelatorioModalidadesPopulares,
  getRelatorioAlunosSemModalidade,
  getRelatorioAlunosPorModalidade,
} from '../../src/api';
import { colors, radius } from '../../src/theme';

// Recriação de front/relatorios/relatorios.html + relatorios.css.
// No original, os 3 botões "(PDF)" geravam um PDF via jsPDF/autoTable — sem
// equivalente direto em React Native sem libs nativas extras. Aqui o mesmo
// dado retornado pelas rotas /api/relatorios/* é exibido direto nas tabelas
// dos cards (que no HTML original ficavam sempre vazias por um bug no script).

const COLUNAS_LABELS = {
  nome: 'Nome',
  total_alunos: 'Total',
  professor: 'Professor',
  status: 'Status',
  cpf: 'CPF',
  telefone: 'Telefone',
  email: 'Email',
  criado_em: 'Data',
  obs: 'Observações',
  situacao: 'Situação',
  data_matricula: 'Data',
};

function ReportTable({ columns, rows }) {
  if (!rows.length) {
    return <Text style={styles.semDados}>Nenhum dado</Text>;
  }
  const colWidth = Math.max(90, Math.floor(280 / columns.length));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.tableRow}>
          {columns.map((c) => (
            <Text key={c} style={[styles.th, { width: colWidth }]}>
              {(COLUNAS_LABELS[c] || c).toUpperCase()}
            </Text>
          ))}
        </View>
        {rows.map((r, i) => (
          <View key={i} style={[styles.tableRow, styles.tableRowBody]}>
            {columns.map((c) => (
              <Text key={c} style={[styles.td, { width: colWidth }]} numberOfLines={2}>
                {String(r[c] ?? '')}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ReportCard({ title, status, onGerar, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Pressable style={styles.btnPrimary} onPress={onGerar} disabled={status === 'loading'}>
        {status === 'loading' ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="bar-chart-outline" size={16} color="#fff" />
            <Text style={styles.btnPrimaryTexto}>Gerar relatório</Text>
          </>
        )}
      </Pressable>
      {status === 'error' && <Text style={styles.erroTexto}>Erro ao gerar relatório.</Text>}
      {status === 'done' && <View style={styles.tableWrapper}>{children}</View>}
    </View>
  );
}

export default function RelatoriosScreen() {
  const [modPop, setModPop] = useState({ status: 'idle', rows: [] });
  const [alunosSem, setAlunosSem] = useState({ status: 'idle', rows: [] });
  const [alunosPorMod, setAlunosPorMod] = useState({ status: 'idle', sections: [] });

  async function carregarModalidadesPopulares() {
    setModPop({ status: 'loading', rows: [] });
    try {
      const data = await getRelatorioModalidadesPopulares();
      const rows = (data.modalidades || []).map((m) => ({
        nome: m.nome,
        total_alunos: m.total_alunos,
        professor: m.professor ? m.professor.nome : 'Nenhum',
        status: m.status || 'Ativa',
      }));
      rows.push({ nome: 'TOTAL GERAL', total_alunos: data.total_geral || 0, professor: '', status: '' });
      setModPop({ status: 'done', rows });
    } catch {
      setModPop({ status: 'error', rows: [] });
    }
  }

  async function carregarAlunosSemModalidade() {
    setAlunosSem({ status: 'loading', rows: [] });
    try {
      const data = await getRelatorioAlunosSemModalidade();
      const rows = (data || []).map((a) => ({
        nome: a.nome,
        cpf: a.cpf,
        telefone: a.telefone,
        email: a.email,
        criado_em: a.criado_em,
        obs: a.obs,
      }));
      setAlunosSem({ status: 'done', rows });
    } catch {
      setAlunosSem({ status: 'error', rows: [] });
    }
  }

  async function carregarAlunosPorModalidade() {
    setAlunosPorMod({ status: 'loading', sections: [] });
    try {
      const data = await getRelatorioAlunosPorModalidade();
      const sections = (data || []).map((item) => ({
        title: `${item.modalidade.nome} (${(item.alunos || []).length} aluno(s))`,
        rows: (item.alunos || []).map((a) => ({
          nome: a.nome,
          cpf: a.cpf,
          telefone: a.telefone,
          situacao: a.situacao,
          data_matricula: a.data_matricula,
        })),
      }));
      setAlunosPorMod({ status: 'done', sections });
    } catch {
      setAlunosPorMod({ status: 'error', sections: [] });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Relatórios</Text>

      <ReportCard title="Modalidades Populares (PDF)" status={modPop.status} onGerar={carregarModalidadesPopulares}>
        <ReportTable columns={['nome', 'total_alunos', 'professor', 'status']} rows={modPop.rows} />
      </ReportCard>

      <ReportCard title="Alunos sem Modalidade (PDF)" status={alunosSem.status} onGerar={carregarAlunosSemModalidade}>
        <ReportTable columns={['nome', 'cpf', 'telefone', 'email', 'criado_em', 'obs']} rows={alunosSem.rows} />
      </ReportCard>

      <ReportCard title="Alunos por Modalidade (PDF)" status={alunosPorMod.status} onGerar={carregarAlunosPorModalidade}>
        {alunosPorMod.sections.length === 0 ? (
          <Text style={styles.semDados}>Nenhum dado</Text>
        ) : (
          alunosPorMod.sections.map((s, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <ReportTable columns={['nome', 'cpf', 'telefone', 'situacao', 'data_matricula']} rows={s.rows} />
            </View>
          ))
        )}
      </ReportCard>
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
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 10,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.blue600,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  btnPrimaryTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  erroTexto: {
    color: colors.erroTexto,
    marginTop: 10,
    fontSize: 13,
  },
  tableWrapper: {
    marginTop: 12,
  },
  semDados: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 13,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowBody: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f6',
  },
  th: {
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  td: {
    fontSize: 13,
    color: '#273444',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
});
