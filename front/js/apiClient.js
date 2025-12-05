const BASE = '/api';

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

export const putAlunoPlano = (id, planoBody) => request(`/alunos/${id}/plano`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planoBody) });
export const getAlunoPlano = (id) => request(`/alunos/${id}/plano`);

export const getPlanos = () => request('/planos');
export const getPlano = (id) => request(`/planos/${id}`);
export const createPlano = (data) => request('/planos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updatePlano = (id, data) => request(`/planos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deletePlano = (id) => request(`/planos/${id}`, { method: 'DELETE' });
export const assinarPlano = (planoId) => request(`/planos/${planoId}/assinar`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({}) });

export const getModalidades = () => request('/modalidades');
export const getAlunoModalidades = (id) => request(`/alunos/${id}/modalidades`);

export const getProfessores = () => request('/professores');
export const getProfessor = (id) => request(`/professores/${id}`);
export const createProfessor = (data) => request('/professores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateProfessor = (id, data) => request(`/professores/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteProfessor = (id) => request(`/professores/${id}`, { method: 'DELETE' });

export const createModalidade = (data) => request('/modalidades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateModalidade = (id, data) => request(`/modalidades/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteModalidade = (id) => request(`/modalidades/${id}`, { method: 'DELETE' });

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
