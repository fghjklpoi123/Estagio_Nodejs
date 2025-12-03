export async function apiFetch(path, opts = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const getAlunos = () => apiFetch('/api/alunos');
export const createAluno = (data) => apiFetch('/api/alunos', { method: 'POST', body: JSON.stringify(data) });
export const updateAluno = (id, data) => apiFetch(`/api/alunos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAluno = (id) => apiFetch(`/api/alunos/${id}`, { method: 'DELETE' });

export const getModalidades = () => apiFetch('/api/modalidades');
