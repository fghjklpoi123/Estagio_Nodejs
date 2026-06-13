import Constants from 'expo-constants';

// No navegador, front/js/apiClient.js usava caminhos relativos ('/api/...') porque o
// Express servia o front e a API na mesma origem. Aqui o app roda no celular/emulador,
// um dispositivo diferente do servidor — por isso precisamos de uma URL absoluta.
//
// Detectamos o IP da máquina que está rodando `expo start` (o Metro informa esse host
// em Constants.expoConfig.hostUri) e assumimos que o backend Express roda na mesma
// máquina, na porta padrão 3000. Isso cobre o caso comum de testar com Expo Go no
// celular conectado ao mesmo Wi-Fi do PC.
//
// Se isso não funcionar no seu ambiente (porta diferente, emulador isolado, etc.),
// defina EXPO_PUBLIC_API_URL no arquivo mobile/.env, ex: EXPO_PUBLIC_API_URL=http://192.168.0.160:3000/api
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];

  if (host) return `http://${host}:3000/api`;
  return 'http://localhost:3000/api';
}

export const BASE_URL = resolveBaseUrl();

async function request(path, opts = {}) {
  let res;
  try {
    res = await fetch(BASE_URL + path, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    });
  } catch {
    // Igual ao catch de front/loginFront/login.js: falha de rede (servidor fora do ar,
    // IP errado, etc.) ganha uma mensagem amigável em vez do erro técnico do fetch.
    throw new Error('Erro ao conectar com o servidor');
  }

  if (!res.ok) {
    let mensagem = `HTTP ${res.status}`;
    try {
      const corpo = await res.json();
      mensagem = corpo.erro || corpo.error || mensagem;
    } catch {
      // resposta sem corpo JSON, mantém a mensagem padrão
    }
    throw new Error(mensagem);
  }

  return res.status === 204 ? null : res.json();
}

export const loginAluno = (email, senha) =>
  request('/login/aluno', { method: 'POST', body: JSON.stringify({ email, senha }) });

export const loginProfessor = (email, senha) =>
  request('/login/professor', { method: 'POST', body: JSON.stringify({ email, senha }) });
