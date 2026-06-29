import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { cadastrarAluno } from '../src/api';
import { maskCpf, maskData, maskTelefone, validarCPF } from '../src/masks';
import { colors, radius } from '../src/theme';

// Recriação de front/cadastro/cadastro.html + cadastro.css + cadastro.js.
// O grid de duas colunas (.form-row) do CSS já colapsa pra uma coluna em telas
// estreitas (@media max-width:600px), então no mobile tudo fica em coluna única,
// na mesma ordem de leitura dos campos do formulário original.

const SEXO_OPCOES = [
  { valor: 'M', label: 'Masculino' },
  { valor: 'F', label: 'Feminino' },
  { valor: 'O', label: 'Outro' },
];

function Campo({ label, erro, style, ...inputProps }) {
  const styles = makeStyles();
  return (
    <View style={[styles.formGroup, style]}>
      <Text style={[styles.label, erro && styles.labelErro]}>{label}</Text>
      <TextInput
        style={[styles.input, erro && styles.inputErro]}
        placeholderTextColor="#9aa6b5"
        autoCorrect={false}
        {...inputProps}
      />
    </View>
  );
}

export default function CadastroScreen() {
  const styles = makeStyles();
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [endereco, setEndereco] = useState('');

  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(false);

  function validar() {
    const novosErros = {};

    if (!nome.trim()) novosErros.nome = true;
    if (!email.trim()) novosErros.email = true;

    const cpfDigits = cpf.replace(/\D/g, '');
    if (!cpfDigits || !validarCPF(cpfDigits)) novosErros.cpf = true;

    if (!senha || senha.length < 6) novosErros.senha = true;
    if (senha !== confirmaSenha) novosErros.confirmaSenha = true;

    if (!dataNascimento || isNaN(Date.parse(dataNascimento))) novosErros.dataNascimento = true;
    if (!sexo) novosErros.sexo = true;

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function handleSubmit() {
    if (!validar()) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, corrija os erros no formulário.' });
      return;
    }

    setMensagem(null);
    setCarregando(true);

    const dados = {
      name: nome.trim(),
      email: email.trim(),
      cpf: cpf.replace(/\D/g, ''),
      senha,
      telefone: telefone.replace(/\D/g, ''),
      data_nascimento: dataNascimento,
      sexo,
      endereco: endereco.trim(),
      situacao: 'Ativo',
      obs: '',
    };

    try {
      const resultado = await cadastrarAluno(dados);
      if (resultado && resultado.id) {
        setMensagem({ tipo: 'sucesso', texto: '✓ Conta criada com sucesso! Redirecionando para login...' });
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao criar conta. Tente novamente.' });
        setCarregando(false);
      }
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: `Erro: ${erro.message || 'Erro ao criar conta'}` });
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Criar Conta</Text>
            <Text style={styles.headerSubtitle}>Preencha os dados abaixo para se cadastrar</Text>
          </View>

          {mensagem && (
            <View style={[styles.mensagem, mensagem.tipo === 'erro' ? styles.mensagemErro : styles.mensagemSucesso]}>
              <Text style={mensagem.tipo === 'erro' ? styles.mensagemErroTexto : styles.mensagemSucessoTexto}>
                {mensagem.texto}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Campo
              label="Nome Completo *"
              placeholder="João Silva"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              erro={erros.nome}
            />

            <View style={styles.formRow}>
              <Campo
                label="E-mail *"
                placeholder="seu@exemplo.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                erro={erros.email}
                style={styles.formRowItem}
              />
              <Campo
                label="CPF *"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={(v) => setCpf(maskCpf(v))}
                keyboardType="number-pad"
                maxLength={14}
                erro={erros.cpf}
                style={styles.formRowItem}
              />
            </View>

            <View style={styles.formRow}>
              <Campo
                label="Senha *"
                placeholder="••••••••"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                erro={erros.senha}
                style={styles.formRowItem}
              />
              <Campo
                label="Confirmar Senha *"
                placeholder="••••••••"
                value={confirmaSenha}
                onChangeText={setConfirmaSenha}
                secureTextEntry
                erro={erros.confirmaSenha}
                style={styles.formRowItem}
              />
            </View>

            <View style={styles.formRow}>
              <Campo
                label="Telefone"
                placeholder="(11) 98765-4321"
                value={telefone}
                onChangeText={(v) => setTelefone(maskTelefone(v))}
                keyboardType="number-pad"
                maxLength={15}
                style={styles.formRowItem}
              />
              <Campo
                label="Data de Nascimento *"
                placeholder="AAAA-MM-DD"
                value={dataNascimento}
                onChangeText={(v) => setDataNascimento(maskData(v))}
                keyboardType="number-pad"
                maxLength={10}
                erro={erros.dataNascimento}
                style={styles.formRowItem}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formRowItem]}>
                <Text style={[styles.label, erros.sexo && styles.labelErro]}>Sexo *</Text>
                <View style={styles.sexoRow}>
                  {SEXO_OPCOES.map((opcao) => (
                    <Pressable
                      key={opcao.valor}
                      onPress={() => setSexo(opcao.valor)}
                      style={[
                        styles.sexoOpcao,
                        sexo === opcao.valor && styles.sexoOpcaoAtiva,
                        erros.sexo && styles.inputErro,
                      ]}
                    >
                      <Text style={[styles.sexoOpcaoTexto, sexo === opcao.valor && styles.sexoOpcaoTextoAtiva]}>
                        {opcao.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Campo
                label="Endereço"
                placeholder="Rua, número, cidade"
                value={endereco}
                onChangeText={setEndereco}
                style={styles.formRowItem}
              />
            </View>

            <View style={styles.formActions}>
              <Pressable onPress={handleSubmit} disabled={carregando} style={styles.btnCadastroWrapper}>
                <LinearGradient
                  colors={[colors.blue600, colors.blue700]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.btnCadastro, carregando && styles.btnDesabilitado]}
                >
                  {carregando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnCadastroTexto}>Criar Conta</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.btnVoltar} onPress={() => router.replace('/login')}>
                <Text style={styles.btnVoltarTexto}>Voltar ao Login</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = () => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: 24,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.blue700,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: colors.muted,
    fontSize: 14.5,
    textAlign: 'center',
  },
  mensagem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 20,
  },
  mensagemErro: {
    backgroundColor: colors.erroBg,
    borderColor: colors.erroBorda,
  },
  mensagemErroTexto: {
    color: colors.erroTexto,
    fontWeight: '600',
    textAlign: 'center',
  },
  mensagemSucesso: {
    backgroundColor: colors.sucessoBg,
    borderColor: colors.sucessoBorda,
  },
  mensagemSucessoTexto: {
    color: colors.sucessoTexto,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formRowItem: {
    flex: 1,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
    color: colors.textBrand,
    fontSize: 14,
  },
  labelErro: {
    color: colors.deleteBtn,
    fontWeight: '700',
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cardBg,
    fontSize: 16,
    color: colors.textDark,
  },
  inputErro: {
    borderColor: colors.deleteBtn,
    backgroundColor: '#fff5f5',
  },
  sexoRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sexoOpcao: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
  },
  sexoOpcaoAtiva: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
  },
  sexoOpcaoTexto: {
    color: colors.textDark,
    fontWeight: '600',
    fontSize: 13,
  },
  sexoOpcaoTextoAtiva: {
    color: '#fff',
  },
  formActions: {
    gap: 12,
    marginTop: 8,
  },
  btnCadastroWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: colors.blue600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 3,
  },
  btnCadastro: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDesabilitado: {
    opacity: 0.6,
  },
  btnCadastroTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  btnVoltar: {
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnVoltarTexto: {
    color: colors.blue600,
    fontWeight: '700',
    fontSize: 16,
  },
});
