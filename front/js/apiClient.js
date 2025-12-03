// API client base. When the backend serves the front (recommended), use the '/api' prefix.
// If you serve front and backend separately, set BASE to the backend origin, e.g. 'http://localhost:3000/api'.
const BASE = '/api';

// Helper para incluir alunoId no header de autenticação
// Para desenvolvimento: usa header X-Aluno-Id com alunoId do localStorage
// Para produção: usar JWT no Authorization Bearer
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const alunoId = localStorage.getItem('alunoId');
  if (alunoId) {
    headers['X-Aluno-Id'] = alunoId;
  }
  return headers;
}

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const getAlunos = () => request('/alunos');
export const getAluno = (id) => request(`/alunos/${id}`);
export const createAluno = (data) => request('/alunos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateAluno = (id, data) => request(`/alunos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteAluno = (id) => request(`/alunos/${id}`, { method: 'DELETE' });

// Plano
export const putAlunoPlano = (id, planoBody) => request(`/alunos/${id}/plano`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planoBody) });
export const getAlunoPlano = (id) => request(`/alunos/${id}/plano`);

// Planos - listar, criar, editar, deletar e assinar
export const getPlanos = () => request('/planos');
export const getPlano = (id) => request(`/planos/${id}`);
export const createPlano = (data) => request('/planos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updatePlano = (id, data) => request(`/planos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deletePlano = (id) => request(`/planos/${id}`, { method: 'DELETE' });
export const assinarPlano = (planoId) => request(`/planos/${planoId}/assinar`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({}) });

// Modalidades
export const getModalidades = () => request('/modalidades');
export const getAlunoModalidades = (id) => request(`/alunos/${id}/modalidades`);

// Professores / Treinadores
export const getProfessores = () => request('/professores');
export const getProfessor = (id) => request(`/professores/${id}`);
export const createProfessor = (data) => request('/professores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateProfessor = (id, data) => request(`/professores/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteProfessor = (id) => request(`/professores/${id}`, { method: 'DELETE' });

// Modalidades (admin)
export const createModalidade = (data) => request('/modalidades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateModalidade = (id, data) => request(`/modalidades/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteModalidade = (id) => request(`/modalidades/${id}`, { method: 'DELETE' });

// Movimentação (alunos_modalidades)
export const inscreverAluno = (alunoId, modalidadeId) => request(`/aluno-modalidade/vincular`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alunoId, modalidadeId }) });
export const cancelarInscricao = (alunoId, modalidadeId) => request(`/aluno-modalidade/${alunoId}/${modalidadeId}`, { method: 'DELETE' });

export default {
  getAlunos, getAluno, createAluno, updateAluno, deleteAluno,
  putAlunoPlano, getAlunoPlano,
  getModalidades, getAlunoModalidades,
  createModalidade, updateModalidade, deleteModalidade,
  getProfessores, getProfessor, createProfessor, updateProfessor, deleteProfessor,
  getPlanos, getPlano, createPlano, updatePlano, deletePlano, assinarPlano,
  inscreverAluno, cancelarInscricao
};
