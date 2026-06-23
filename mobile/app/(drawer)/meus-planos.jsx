import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { confirm } from '../../src/confirm';
import { useAuth } from '../../src/AuthContext';
import { assinarPlano, cancelarInscricao, getAlunoModalidades, getModalidades, getPlanos } from '../../src/api';
import { colors, radius } from '../../src/theme';

// Recriação de front/planoFront/planos-aluno.html + planos-aluno.js.
// Nessa página o .btn-assinar é sobrescrito por estilo inline para azul
// (colors.assinarBtn), diferente do .btn-assinar de plano.css (admin).

function formatarValor(valor) {
  const num = Number(valor) || 0;
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

export default function MeusPlanosScreen() {
  const { session } = useAuth();
  const isAluno = session && session.tipo === 'aluno';
  const alunoId = session?.id;

  const [planos, setPlanos] = useState([]);
  const [modalidadesMap, setModalidadesMap] = useState({});
  const [inscricoes, setInscricoes] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [status, setStatus] = useState(null);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [planosData, modalidadesData, inscricoesData] = await Promise.all([
        getPlanos(),
        getModalidades(),
        isAluno && alunoId ? getAlunoModalidades(alunoId) : Promise.resolve([]),
      ]);
      setPlanos(planosData || []);
      setModalidadesMap(Object.fromEntries((modalidadesData || []).map((m) => [m.id, m.nome])));
      setInscricoes(inscricoesData || []);
    } catch (erro) {
      setStatus({ tipo: 'error', texto: erro.message || 'Erro ao carregar planos' });
    } finally {
      setCarregando(false);
    }
  }, [isAluno, alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!status || status.tipo === 'error') return;
    const t = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(t);
  }, [status]);

  const planosFiltrados = planos.filter((p) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    const nomeModalidade = modalidadesMap[p.modalidade_id] || '';
    return (p.descricao || '').toLowerCase().includes(termo) || nomeModalidade.toLowerCase().includes(termo);
  });

  function confirmarAssinar(plano) {
    const nomeModalidade = modalidadesMap[plano.modalidade_id] || 'modalidade';
    confirm('Assinar plano', `Confirma a assinatura do plano de ${nomeModalidade}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Assinar', onPress: () => assinar(plano) },
    ]);
  }

  async function assinar(plano) {
    setAcaoEmAndamento(plano.id);
    try {
      await assinarPlano(plano.id);
      setStatus({ tipo: 'success', texto: 'Plano assinado com sucesso!' });
      await carregar();
    } catch (erro) {
      const msg = erro.message || '';
      if (msg.includes('409') || msg.toLowerCase().includes('já está inscrito')) {
        setStatus({ tipo: 'info', texto: 'Você já está inscrito nessa modalidade.' });
      } else {
        setStatus({ tipo: 'error', texto: msg || 'Erro ao assinar plano' });
      }
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  function confirmarCancelar(plano) {
    const nomeModalidade = modalidadesMap[plano.modalidade_id] || 'modalidade';
    confirm('Cancelar assinatura', `Confirma o cancelamento da assinatura de ${nomeModalidade}?`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar Assinatura', style: 'destructive', onPress: () => cancelar(plano) },
    ]);
  }

  async function cancelar(plano) {
    setAcaoEmAndamento(plano.id);
    try {
      await cancelarInscricao(alunoId, plano.modalidade_id);
      setStatus({ tipo: 'success', texto: 'Assinatura cancelada com sucesso!' });
      await carregar();
    } catch (erro) {
      setStatus({ tipo: 'error', texto: erro.message || 'Erro ao cancelar assinatura' });
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Meus Planos</Text>
      <TextInput
        style={styles.busca}
        placeholder="Buscar plano..."
        placeholderTextColor="#999"
        value={busca}
        onChangeText={setBusca}
      />

      {status && (
        <View style={[styles.statusMsg, styles[`status_${status.tipo}`]]}>
          <Text style={[styles.statusTexto, styles[`statusTexto_${status.tipo}`]]}>{status.texto}</Text>
        </View>
      )}

      {carregando ? (
        <ActivityIndicator color={colors.blue600} style={styles.loading} />
      ) : planosFiltrados.length === 0 ? (
        <Text style={styles.empty}>Nenhum plano encontrado.</Text>
      ) : (
        planosFiltrados.map((plano) => {
          const jaInscrito = inscricoes.some((insc) => insc.id === plano.modalidade_id);
          const emAndamento = acaoEmAndamento === plano.id;
          return (
            <View key={plano.id} style={styles.planoCard}>
              <Text style={styles.planoTitulo}>{modalidadesMap[plano.modalidade_id] || 'Modalidade'}</Text>
              <Text style={styles.planoPreco}>{formatarValor(plano.preco)}</Text>
              {plano.descricao ? <Text style={styles.planoDesc}>{plano.descricao}</Text> : null}
              {jaInscrito ? (
                <Pressable
                  style={[styles.btn, styles.btnCancelar, emAndamento && styles.btnDesabilitado]}
                  onPress={() => confirmarCancelar(plano)}
                  disabled={emAndamento}
                >
                  {emAndamento ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnTexto}>Cancelar Assinatura</Text>}
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.btn, styles.btnAssinar, emAndamento && styles.btnDesabilitado]}
                  onPress={() => confirmarAssinar(plano)}
                  disabled={emAndamento}
                >
                  {emAndamento ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnTexto}>Assinar Plano</Text>}
                </Pressable>
              )}
            </View>
          );
        })
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
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  statusMsg: {
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  status_success: {
    backgroundColor: colors.sucessoBg,
    borderWidth: 1,
    borderColor: colors.sucessoBorda,
  },
  status_error: {
    backgroundColor: colors.erroBg,
    borderWidth: 1,
    borderColor: colors.erroBorda,
  },
  status_info: {
    backgroundColor: colors.infoBg,
  },
  statusTexto: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusTexto_success: {
    color: colors.sucessoTexto,
  },
  statusTexto_error: {
    color: colors.erroTexto,
  },
  statusTexto_info: {
    color: colors.infoTexto,
  },
  loading: {
    marginTop: 24,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  planoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.sm,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  planoTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 6,
  },
  planoPreco: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.planoPreco,
    marginBottom: 8,
  },
  planoDesc: {
    fontSize: 13,
    color: '#777',
    marginBottom: 14,
    lineHeight: 18,
  },
  btn: {
    alignSelf: 'flex-start',
    minWidth: 160,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAssinar: {
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
