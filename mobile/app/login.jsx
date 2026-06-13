import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useAuth } from '../src/AuthContext';
import { loginAluno, loginProfessor } from '../src/api';
import { colors, radius } from '../src/theme';

// Recriação de front/loginFront/login.html + login.css + login.js.
// O card de duas colunas (40% imagem / 60% formulário, 900px) era pensado pra
// desktop; em formato mobile vira uma coluna só, com a logo no topo.
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState(null); // { tipo: 'erro' | 'sucesso', texto }
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit() {
    const emailLimpo = email.trim();
    const senhaLimpa = senha.trim();

    if (!emailLimpo || !senhaLimpa) {
      setMensagem({ tipo: 'erro', texto: 'Email e senha são obrigatórios' });
      return;
    }

    setCarregando(true);
    setMensagem(null);

    // Mesma estratégia do login.js original: tenta como aluno, depois como
    // professor, e em caso de falha dos dois mostra o erro retornado pro aluno.
    let erroAluno = null;
    try {
      const dataAluno = await loginAluno(emailLimpo, senhaLimpa);
      await concluirLogin('aluno', dataAluno.aluno);
      return;
    } catch (erro) {
      erroAluno = erro;
    }

    try {
      const dataProfessor = await loginProfessor(emailLimpo, senhaLimpa);
      await concluirLogin('professor', dataProfessor.professor);
      return;
    } catch {
      setMensagem({ tipo: 'erro', texto: erroAluno?.message || 'Email ou senha inválidos' });
      setCarregando(false);
    }
  }

  async function concluirLogin(tipo, pessoa) {
    await login({ tipo, id: pessoa.id, nome: pessoa.nome });
    setMensagem({ tipo: 'sucesso', texto: '✓ Login bem-sucedido!' });
    setTimeout(() => router.replace('/home'), 1200);
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Image source={require('../assets/images/logo2.png')} style={styles.logo} resizeMode="contain" />

          <View style={styles.brand}>
            <Text style={styles.brandTitle}>
              Bem-vindo ao <Text style={styles.brandHighlight}>AcadFlow</Text>
            </Text>
            <Text style={styles.tagline}>O seu sistema de gestão da academia — simples e rápido.</Text>
          </View>

          {mensagem && (
            <View style={[styles.mensagem, mensagem.tipo === 'erro' ? styles.mensagemErro : styles.mensagemSucesso]}>
              <Text style={mensagem.tipo === 'erro' ? styles.mensagemErroTexto : styles.mensagemSucessoTexto}>
                {mensagem.texto}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@exemplo.com"
              placeholderTextColor="#9aa6b5"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="••••••••"
              placeholderTextColor="#9aa6b5"
              secureTextEntry
            />

            <Pressable onPress={handleSubmit} disabled={carregando} style={styles.botaoWrapper}>
              <LinearGradient
                colors={[colors.blue600, colors.blue700]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.botao}
              >
                {carregando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botaoTexto}>Entrar</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <Pressable style={styles.criarContaWrapper} onPress={() => router.push('/cadastro')}>
            <Text style={styles.linkCriarConta}>Criar conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    maxWidth: 440,
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    padding: 28,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  logo: {
    width: '100%',
    height: 140,
    alignSelf: 'center',
    marginBottom: 12,
  },
  brand: {
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 26,
    color: colors.blue700,
    lineHeight: 32,
    marginBottom: 6,
  },
  brandHighlight: {
    color: colors.blue600,
    fontWeight: '700',
  },
  tagline: {
    color: colors.muted,
    fontSize: 15,
  },
  mensagem: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
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
    marginTop: 18,
    gap: 12,
  },
  label: {
    fontWeight: '600',
    color: colors.textBrand,
    fontSize: 14,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: '#fff',
    fontSize: 16,
    color: colors.textDark,
  },
  botaoWrapper: {
    marginTop: 12,
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: colors.blue600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 3,
  },
  botao: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  criarContaWrapper: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkCriarConta: {
    color: colors.link,
    fontWeight: '700',
    fontSize: 16,
  },
});
