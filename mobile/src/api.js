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

// --- Relatórios ---
export const getRelatorioModalidadesPopulares = () => request('/relatorios/modalidades-populares');
export const getRelatorioAlunosSemModalidade = () => request('/relatorios/alunos-sem-modalidade');
export const getRelatorioAlunosPorModalidade = () => request('/relatorios/alunos-por-modalidade');
