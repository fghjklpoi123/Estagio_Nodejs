import * as api from '/js/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {

  // ── Elementos ──────────────────────────────────────────
  const modalBg      = document.getElementById('modalTreino');
  const btnNovo      = document.getElementById('btnNovoTreino');
  const btnSalvar    = document.getElementById('salvarTreino');
  const btnFechar    = document.getElementById('fecharModalTreino');

  const nomeInput      = document.getElementById('nomeTreino');
  const descInput      = document.getElementById('descricaoTreino');
  const modalidadeSelect = document.getElementById('modalidadeTreino');
  const treinadorSelect  = document.getElementById('treinadorTreino');
  const alunoSelect      = document.getElementById('alunoTreino');
  const duracaoInput     = document.getElementById('duracaoTreino');
  const nivelSelect      = document.getElementById('nivelTreino');

  const listaEl      = document.getElementById('listaTreinos');
  const paginacaoEl  = document.getElementById('paginacaoTreinos');
  const buscar       = document.getElementById('buscarTreino');
  const filtroMod    = document.getElementById('filtroModalidadeTreino');

  let treinos = [];
  let editId  = null;
  let paginaAtual = 1;
  const porPagina = 6;

  // ── Helpers ────────────────────────────────────────────
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, m =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])
    );
  }

  function marcarErro(el, temErro) {
    if (!el) return;
    if (temErro) {
      el.classList.add('erro');
    } else {
      el.classList.remove('erro');
      el.style.borderColor = '';
      el.style.backgroundColor = '';
    }
  }

  function badgeNivel(nivel) {
    const map = {
      'Iniciante':     'badge-iniciante',
      'Intermediário': 'badge-intermediario',
      'Avançado':      'badge-avancado'
    };
    const cls = map[nivel] || '';
    return nivel ? `<span class="badge ${cls}">${escapeHtml(nivel)}</span>` : '';
  }

  // ── Sidebar ativo ──────────────────────────────────────
  const currentPath = window.location.pathname;
  document.querySelectorAll('.menu a').forEach(link => {
    if (currentPath.includes(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });

  // ── Carregar selects ───────────────────────────────────
  async function carregarModalidades() {
    try {
      const mods = await api.getModalidades();
      const opts = '<option value="">Modalidade</option>' +
        (mods || []).map(m => `<option value="${m.id}">${escapeHtml(m.nome)}</option>`).join('');
      filtroMod.innerHTML = opts;
      modalidadeSelect.innerHTML = '<option value="">Selecione</option>' +
        (mods || []).map(m => `<option value="${m.id}">${escapeHtml(m.nome)}</option>`).join('');
    } catch (err) { console.error('Erro modalidades', err); }
  }

  async function carregarTreinadores() {
    try {
      const lista = await api.getProfessores();
      treinadorSelect.innerHTML = '<option value="">Selecione</option>' +
        (lista || []).map(t => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');
    } catch (err) { console.error('Erro treinadores', err); }
  }

  async function carregarAlunos() {
    try {
      const lista = await api.getAlunos();
      alunoSelect.innerHTML = '<option value="">Selecione</option>' +
        (lista || []).map(a => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`).join('');
    } catch (err) { console.error('Erro alunos', err); }
  }

  async function carregarTreinos() {
    try {
      treinos = await api.getTreinos() || [];
      paginaAtual = 1;
      render();
    } catch (err) {
      console.error('Erro ao carregar treinos', err);
      listaEl.innerHTML = '<p style="color:#c00">Erro ao carregar treinos.</p>';
    }
  }

  // ── Render ─────────────────────────────────────────────
  function render() {
    listaEl.innerHTML = '';
    const termo  = buscar.value.trim().toLowerCase();
    const modVal = filtroMod.value;

    const filtrados = treinos.filter(t =>
      (t.nome || '').toLowerCase().includes(termo) &&
      (modVal === '' || String(t.modalidade_id || '') === String(modVal))
    );

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    const segmento = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

    if (segmento.length === 0) {
      listaEl.innerHTML = '<p style="color:#6d7b8c;margin-top:20px">Nenhum treino encontrado.</p>';
    }

    segmento.forEach(t => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <button class="edit-btn"   data-id="${t.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn" data-id="${t.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        <h3>${escapeHtml(t.nome)}</h3>
        <span><i class="fa-solid fa-dumbbell" style="margin-right:6px;color:#0f4fa8"></i>${escapeHtml(t.modalidade_nome || '')}</span>
        <span><i class="fa-solid fa-user-tie" style="margin-right:6px;color:#0f4fa8"></i>${escapeHtml(t.treinador_nome || '')}</span>
        <span><i class="fa-solid fa-user"     style="margin-right:6px;color:#0f4fa8"></i>${escapeHtml(t.aluno_nome || '')}</span>
        <span><i class="fa-solid fa-clock"    style="margin-right:6px;color:#0f4fa8"></i>${escapeHtml(t.duracao || '')} min</span>
        ${badgeNivel(t.nivel)}
      `;
      listaEl.appendChild(card);
    });

    // Paginação
    paginacaoEl.innerHTML = '';
    for (let p = 1; p <= totalPaginas; p++) {
      const btn = document.createElement('button');
      btn.textContent = p;
      if (p === paginaAtual) btn.classList.add('ativo');
      btn.addEventListener('click', () => { paginaAtual = p; render(); });
      paginacaoEl.appendChild(btn);
    }
  }

  // ── Modal abrir/fechar ─────────────────────────────────
  btnNovo.addEventListener('click', () => {
    editId = null;
    document.getElementById('tituloModalTreino').innerText = 'Novo Treino';
    limpar();
    modalBg.classList.add('active');
  });

  btnFechar.addEventListener('click', () => modalBg.classList.remove('active'));

  // ── Salvar ─────────────────────────────────────────────
  btnSalvar.addEventListener('click', async () => {
    const nome       = nomeInput.value.trim();
    const descricao  = descInput.value.trim();
    const modalidade = modalidadeSelect.value ? Number(modalidadeSelect.value) : null;
    const treinador  = treinadorSelect.value  ? Number(treinadorSelect.value)  : null;
    const aluno      = alunoSelect.value      ? Number(alunoSelect.value)      : null;
    const duracao    = duracaoInput.value      ? Number(duracaoInput.value)     : null;
    const nivel      = nivelSelect.value;

    let temErro = false;
    marcarErro(nomeInput,    !nome);       if (!nome)    temErro = true;
    marcarErro(nivelSelect,  !nivel);      if (!nivel)   temErro = true;
    if (temErro) return;

    const dados = { nome, descricao, modalidade_id: modalidade, professor_id: treinador, aluno_id: aluno, duracao, nivel };

    try {
      if (editId) { await api.updateTreino(editId, dados); }
      else        { await api.createTreino(dados); }
      modalBg.classList.remove('active');
      limpar();
      await carregarTreinos();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar: ' + (err.message || err));
    }
  });

  // ── Editar / Excluir ───────────────────────────────────
  listaEl.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.classList.contains('edit-btn')) {
      try {
        const t = await api.getTreino(id);
        if (!t) return;
        editId = id;
        nomeInput.value         = t.nome        || '';
        descInput.value         = t.descricao   || '';
        modalidadeSelect.value  = t.modalidade_id ? String(t.modalidade_id) : '';
        treinadorSelect.value   = t.professor_id  ? String(t.professor_id)  : '';
        alunoSelect.value       = t.aluno_id      ? String(t.aluno_id)      : '';
        duracaoInput.value      = t.duracao       || '';
        nivelSelect.value       = t.nivel         || '';
        document.getElementById('tituloModalTreino').innerText = 'Editar Treino';
        modalBg.classList.add('active');
      } catch (err) { console.error('Erro editar', err); }

    } else if (btn.classList.contains('delete-btn')) {
      if (!confirm('Excluir treino?')) return;
      try {
        await api.deleteTreino(id);
        await carregarTreinos();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir: ' + (err.message || err));
      }
    }
  });

  // ── Limpar form ────────────────────────────────────────
  function limpar() {
    [nomeInput, descInput, duracaoInput].forEach(el => el.value = '');
    [modalidadeSelect, treinadorSelect, alunoSelect, nivelSelect].forEach(el => el.value = '');
    [nomeInput, descInput, nivelSelect].forEach(el => marcarErro(el, false));
  }

  // ── Filtros ────────────────────────────────────────────
  buscar.addEventListener('input',    () => render());
  filtroMod.addEventListener('change', () => render());

  // ── Init ───────────────────────────────────────────────
  (async () => {
    await Promise.all([carregarModalidades(), carregarTreinadores(), carregarAlunos()]);
    await carregarTreinos();
  })();
});