import Constants from 'expo-constants';

function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];

  if (host) return `http://${host}:3000/api`;
  return 'http://localhost:3000/api';
}

export const BASE_URL = resolveBaseUrl();

// --- Token JWT gerenciado pelo AuthContext ---
let _token = null;
let _onUnauthorized = null;

export function setAuthToken(token) {
  _token = token;
}

export function setOnUnauthorized(callback) {
  _onUnauthorized = callback;
}

async function request(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.body) headers['Content-Type'] = 'application/json';
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  let res;
  try {
    res = await fetch(BASE_URL + path, { ...opts, headers });
  } catch {
    throw new Error('Erro ao conectar com o servidor');
  }

  if (!res.ok) {
    let mensagem = `HTTP ${res.status}`;
    try {
      const corpo = await res.json();
      mensagem = corpo.erro || corpo.error || mensagem;
    } catch {
      // resposta sem corpo JSON
    }

    if (res.status === 401 && _token) {
      _token = null;
      if (_onUnauthorized) _onUnauthorized();
    }

    throw new Error(mensagem);
  }

  return res.status === 204 ? null : res.json();
}

// --- Auth ---
export const loginAluno = (email, senha) =>
  request('/login/aluno', { method: 'POST', body: JSON.stringify({ email, senha }) });

export const loginProfessor = (email, senha) =>
  request('/login/professor', { method: 'POST', body: JSON.stringify({ email, senha }) });

export const loginAdmin = (email, senha) =>
  request('/login/admin', { method: 'POST', body: JSON.stringify({ email, senha }) });

// Cadastro é público (não precisa de token)
export const cadastrarAluno = (dados) =>
  request('/alunos', { method: 'POST', body: JSON.stringify(dados) });

// --- Alunos ---
export const getAlunos = () => request('/alunos');
export const getAluno = (id) => request(`/alunos/${id}`);
export const createAluno = (dados) => request('/alunos', { method: 'POST', body: JSON.stringify(dados) });
export const updateAluno = (id, dados) => request(`/alunos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const deleteAluno = (id) => request(`/alunos/${id}`, { method: 'DELETE' });

export const getAlunoPlano = (id) => request(`/alunos/${id}/plano`);
export const putAlunoPlano = (id, planoBody) => request(`/alunos/${id}/plano`, { method: 'PUT', body: JSON.stringify(planoBody) });
export const getAlunoModalidades = (id) => request(`/alunos/${id}/modalidades`);

// --- Modalidades ---
export const getModalidades = () => request('/modalidades');
export const createModalidade = (dados) => request('/modalidades', { method: 'POST', body: JSON.stringify(dados) });
export const updateModalidade = (id, dados) => request(`/modalidades/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const deleteModalidade = (id) => request(`/modalidades/${id}`, { method: 'DELETE' });

// --- Professores ---
export const getProfessores = () => request('/professores');
export const getProfessor = (id) => request(`/professores/${id}`);
export const createProfessor = (dados) => request('/professores', { method: 'POST', body: JSON.stringify(dados) });
export const updateProfessor = (id, dados) => request(`/professores/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const deleteProfessor = (id) => request(`/professores/${id}`, { method: 'DELETE' });

// --- Planos ---
export const getPlanos = () => request('/planos');
export const getPlano = (id) => request(`/planos/${id}`);
export const createPlano = (dados) => request('/planos', { method: 'POST', body: JSON.stringify(dados) });
export const updatePlano = (id, dados) => request(`/planos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const deletePlano = (id) => request(`/planos/${id}`, { method: 'DELETE' });
export const assinarPlano = (planoId) =>
  request(`/planos/${planoId}/assinar`, { method: 'POST', body: JSON.stringify({}) });
export const getMeusPlanos = () => request('/planos/meus');
export const cancelarPlano = (planoId) =>
  request(`/planos/${planoId}/cancelar`, { method: 'DELETE' });

// --- Aluno-Modalidade ---
export const inscreverAluno = (alunoId, modalidadeId) =>
  request('/aluno-modalidade/vincular', { method: 'POST', body: JSON.stringify({ alunoId, modalidadeId }) });
export const cancelarInscricao = (alunoId, modalidadeId) =>
  request(`/aluno-modalidade/${alunoId}/${modalidadeId}`, { method: 'DELETE' });

// --- Exercícios ---
export const getExercicios = (modalidadeId) =>
  request(modalidadeId ? `/exercicios?modalidade_id=${modalidadeId}` : '/exercicios');
export const getExercicio = (id) => request(`/exercicios/${id}`);
export const createExercicio = (dados) => request('/exercicios', { method: 'POST', body: JSON.stringify(dados) });
export const updateExercicio = (id, dados) => request(`/exercicios/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const deleteExercicio = (id) => request(`/exercicios/${id}`, { method: 'DELETE' });

// --- Aulas / Fichas de Treino ---
export const getAulas = (filtros) => {
  const params = new URLSearchParams();
  if (filtros?.aluno_id) params.set('aluno_id', filtros.aluno_id);
  if (filtros?.professor_id) params.set('professor_id', filtros.professor_id);
  if (filtros?.modalidade_id) params.set('modalidade_id', filtros.modalidade_id);
  const qs = params.toString();
  return request('/aulas' + (qs ? `?${qs}` : ''));
};
export const getAula = (id) => request(`/aulas/${id}`);
export const createAula = (dados) => request('/aulas', { method: 'POST', body: JSON.stringify(dados) });
export const updateAula = (id, dados) => request(`/aulas/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const deleteAula = (id) => request(`/aulas/${id}`, { method: 'DELETE' });

// --- Check-in ---
export const fazerCheckin = () => request('/checkins', { method: 'POST', body: JSON.stringify({}) });
export const statusCheckinHoje = () => request('/checkins/hoje');
export const historicoCheckins = () => request('/checkins/historico');
export const listarCheckins = (filtros) => {
  const params = new URLSearchParams();
  if (filtros?.aluno_id) params.set('aluno_id', filtros.aluno_id);
  if (filtros?.data) params.set('data', filtros.data);
  if (filtros?.data_inicio) params.set('data_inicio', filtros.data_inicio);
  if (filtros?.data_fim) params.set('data_fim', filtros.data_fim);
  const qs = params.toString();
  return request('/checkins' + (qs ? `?${qs}` : ''));
};
export const totalCheckinsHoje = () => request('/checkins/total-hoje');

// --- Financeiro ---
export const getLancamentos = (filtros) => {
  const params = new URLSearchParams();
  if (filtros?.tipo) params.set('tipo', filtros.tipo);
  if (filtros?.categoria) params.set('categoria', filtros.categoria);
  if (filtros?.mes) params.set('mes', filtros.mes);
  if (filtros?.ano) params.set('ano', filtros.ano);
  const qs = params.toString();
  return request('/financeiro' + (qs ? `?${qs}` : ''));
};
export const getResumoFinanceiro = (filtros) => {
  const params = new URLSearchParams();
  if (filtros?.mes) params.set('mes', filtros.mes);
  if (filtros?.ano) params.set('ano', filtros.ano);
  const qs = params.toString();
  return request('/financeiro/resumo' + (qs ? `?${qs}` : ''));
};
export const createLancamento = (dados) => request('/financeiro', { method: 'POST', body: JSON.stringify(dados) });
export const updateLancamento = (id, dados) => request(`/financeiro/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const deleteLancamento = (id) => request(`/financeiro/${id}`, { method: 'DELETE' });

// --- Logs ---
export const getLogs = (filtros) => {
  const params = new URLSearchParams();
  if (filtros?.usuario_tipo) params.set('usuario_tipo', filtros.usuario_tipo);
  if (filtros?.metodo) params.set('metodo', filtros.metodo);
  if (filtros?.usuario_nome) params.set('usuario_nome', filtros.usuario_nome);
  if (filtros?.data) params.set('data', filtros.data);
  if (filtros?.rota) params.set('rota', filtros.rota);
  const qs = params.toString();
  return request('/logs' + (qs ? `?${qs}` : ''));
};

// --- Relatórios ---
export const getRelatorioDinamico = (filtros) => {
  const params = new URLSearchParams();
  Object.entries(filtros || {}).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  return request('/relatorios' + (qs ? `?${qs}` : ''));
};
