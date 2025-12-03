// aulas.js - Gestão de Planos (modalidade, valor, descrição) com validação visual
document.addEventListener('DOMContentLoaded', () => {

  // elementos
  const btnNovo = document.getElementById('btnNovo');
  const btnSalvar = document.getElementById('btnSalvar');
  const btnCancelar = document.getElementById('btnCancelar');

  const selectModalidade = document.getElementById('selectModalidade');
  const inputValor = document.getElementById('inputValor');
  const descPlano = document.getElementById('descPlano');

  const tableBody = document.querySelector('#tablePlanos tbody');
  const formArea = document.getElementById('formArea');
  const formTitle = document.getElementById('formTitle');
  const inputBusca = document.getElementById('buscarAluno'); // input de busca de planos

  let planos = JSON.parse(localStorage.getItem('planos')) || [];
  let editIndex = null;

  /* ---------- HELPERS ---------- */

  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }

  function savePlanos() {
    localStorage.setItem('planos', JSON.stringify(planos));
    window.dispatchEvent(new Event('planos:changed'));
  }

  function formatarParaPtBr(valorNum) {
    if (valorNum === null || valorNum === undefined || valorNum === '') return '';
    const n = Number(valorNum) || 0;
    // formata com 2 casas e vírgula
    return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function parseValorBr(str) {
    if (str === null || str === undefined || str === '') return 0;
    let s = String(str).trim();
    // remove espaços, pontos de milhar e transforma vírgula em ponto
    s = s.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function getLabel(el) {
    if (!el) return null;
    let label = document.querySelector(`label[for="${el.id}"]`);
    if (label) return label;
    const prev = el.previousElementSibling;
    if (prev && prev.tagName.toLowerCase() === 'label') return prev;
    return null;
  }

  function marcarErro(el, temErro) {
    if (!el) return;
    const label = getLabel(el);
    if (temErro) {
      el.classList.add('erro');
      if (label) label.classList.add('erro');
    } else {
      el.classList.remove('erro');
      if (label) label.classList.remove('erro');
    }
  }

  /* ---------- TEXTAREA AUTO-RESIZE ---------- */
  function ajustarAlturaTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 300) + 'px';
  }
  if (descPlano) {
    descPlano.addEventListener('input', () => ajustarAlturaTextarea(descPlano));
    ajustarAlturaTextarea(descPlano);
  }

  /* ---------- INPUT VALOR: EDIÇÃO LIVRE + FORMATA NO BLUR (limite 999,99) ---------- */
  if (inputValor) {
    // enquanto digita: aceita apenas dígitos e uma vírgula; não insere zeros automaticamente
    inputValor.addEventListener('input', (e) => {
      let v = e.target.value || '';
      // mantém apenas dígitos e vírgula
      v = v.replace(/[^\d,]/g, '');
      // se tiver mais de uma vírgula, mantém só a primeira
      const parts = v.split(',');
      if (parts.length > 2) v = parts.shift() + ',' + parts.join('');
      // limita parte inteira a 3 dígitos e decimais a 2
      if (v.includes(',')) {
        const [intPart, decPart] = v.split(',');
        const intClean = intPart.slice(0, 3);
        const decClean = decPart.slice(0, 2);
        e.target.value = intClean + (decClean ? ',' + decClean : (v.endsWith(',') ? ',' : ''));
      } else {
        e.target.value = v.slice(0, 3);
      }
    });

    // ao focar: apenas garante vírgulas em vez de pontos (mais natural para pt-BR)
    inputValor.addEventListener('focus', (e) => {
      if (!e.target.value) return;
      e.target.value = String(e.target.value).replace(/\./g, ',');
    });

    // ao perder foco: normaliza, limita até 999.99 e formata com duas casas
    inputValor.addEventListener('blur', (e) => {
      let raw = (e.target.value || '').trim();
      if (raw === '') { e.target.value = ''; return; }
      raw = raw.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.'); // pra parse
      let num = parseFloat(raw);
      if (isNaN(num)) { e.target.value = ''; return; }
      if (num > 999.99) num = 999.99;
      e.target.value = num.toFixed(2).replace('.', ',');
    });

    // colar: normaliza conteúdo e dispara blur para formatar/validar
    inputValor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text') || '';
      const cleaned = text.replace(/[^\d,\.]/g, '').replace(/\./g, ',');
      inputValor.value = cleaned;
      // formata:
      inputValor.dispatchEvent(new Event('blur', { bubbles: true }));
    });
  }

  /* ---------- MODAL OPEN/CLOSE ---------- */
  function abrirModal() {
    if (!formArea) return;
    formArea.classList.add('show');
    formArea.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    ajustarAlturaTextarea(descPlano);
  }
  function fecharModal() {
    if (!formArea) return;
    formArea.classList.remove('show');
    formArea.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  /* ---------- CARREGAR MODALIDADES ---------- */
  function carregarSelects() {
    const modalidades = readJSON('modalidades');
    if (selectModalidade) {
      selectModalidade.innerHTML = '<option value="">Selecione uma modalidade</option>';
      modalidades.forEach(m => {
        const nome = (typeof m === 'string') ? m : (m.nome || m);
        selectModalidade.innerHTML += `<option value="${escapeHtml(nome)}">${escapeHtml(nome)}</option>`;
      });
    }
  }
  carregarSelects();

  /* ---------- BOTÕES ---------- */
  btnNovo && btnNovo.addEventListener('click', () => {
    editIndex = null;
    formTitle.textContent = 'Novo Plano';
    limparForm();
    abrirModal();
  });

  btnCancelar && btnCancelar.addEventListener('click', () => {
    limparForm();
    fecharModal();
  });

  /* ---------- SALVAR (VALIDAÇÃO VISUAL) ---------- */
  btnSalvar && btnSalvar.addEventListener('click', () => {
    const modalidade = selectModalidade ? selectModalidade.value.trim() : '';
    const valorStr = inputValor ? inputValor.value.trim() : '';
    const descricao = descPlano ? descPlano.value.trim() : '';

    let temErro = false;

    const obrigatorios = [
      { el: selectModalidade, val: modalidade },
      { el: inputValor, val: valorStr },
      { el: descPlano, val: descricao }
    ];

    obrigatorios.forEach(({ el, val }) => {
      if (!el) return;
      if (!val) { marcarErro(el, true); temErro = true; } else { marcarErro(el, false); }
    });

    // valida numericamente o valor
    if (valorStr) {
      const valorNum = parseValorBr(valorStr);
      if (isNaN(valorNum) || valorNum < 0) { marcarErro(inputValor, true); temErro = true; }
      else { marcarErro(inputValor, false); }
    }

    if (temErro) return;

    const valor = parseValorBr(valorStr) || 0;
    const registro = { modalidade, valor, descricao };

    if (editIndex !== null) { planos[editIndex] = registro; editIndex = null; }
    else { planos.push(registro); }

    savePlanos();
    limparForm();
    fecharModal();
    atualizarTabela();
  });

  function limparForm() {
    if (selectModalidade) selectModalidade.value = '';
    if (inputValor) inputValor.value = '';
    if (descPlano) descPlano.value = '';
    [selectModalidade, inputValor, descPlano].forEach(el => { if (!el) return; marcarErro(el, false); });
    editIndex = null;
    ajustarAlturaTextarea(descPlano);
  }

  /* ---------- TABELA ---------- */
  function atualizarTabela() {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    let lista = planos;
    if (inputBusca && inputBusca.value.trim()) {
      const termo = inputBusca.value.trim().toLowerCase();
      lista = planos.filter(p =>
        (p.modalidade || '').toLowerCase().includes(termo) ||
        (p.descricao || '').toLowerCase().includes(termo)
      );
    }

    if (!lista.length) {
      tableBody.innerHTML = '<tr><td colspan="3" style="color:#888">Nenhum plano cadastrado</td></tr>';
      return;
    }

    lista.forEach((p) => {
      const realIndex = planos.indexOf(p);
      const tr = document.createElement('tr');

      // build row with actions centered
      tr.innerHTML = `
        <td>${escapeHtml(p.modalidade)}</td>
        <td style="white-space:nowrap;">${formatarParaPtBr(p.valor)}</td>
        <td style="text-align:center;">
          <button class="action-btn edit" data-index="${realIndex}" title="Editar"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-index="${realIndex}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // delegação para editar/excluir
  tableBody && tableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = parseInt(btn.dataset.index, 10);
    if (btn.classList.contains('edit')) editarRegistro(idx);
    else if (btn.classList.contains('delete')) excluirRegistro(idx);
  });

  function editarRegistro(i) {
    const p = planos[i];
    if (!p) return;
    editIndex = i;
    if (selectModalidade) {
      for (let j = 0; j < selectModalidade.options.length; j++) {
        if (selectModalidade.options[j].value === p.modalidade) {
          selectModalidade.selectedIndex = j;
          break;
        }
      }
    }
    if (inputValor) inputValor.value = formatarParaPtBr(p.valor);
    if (descPlano) descPlano.value = p.descricao || '';
    formTitle.textContent = 'Editar Plano';
    abrirModal();
    ajustarAlturaTextarea(descPlano);
  }

  function excluirRegistro(i) {
    if (!confirm('Excluir este plano?')) return;
    planos.splice(i, 1);
    savePlanos();
    atualizarTabela();
  }

  /* ---------- EXPORT CSV (opcional) ---------- */
  const btnExportCsv = document.getElementById('btnExportCsv');
  btnExportCsv && btnExportCsv.addEventListener('click', () => {
    if (!planos.length) { alert('Nenhum plano para exportar.'); return; }
    const headers = ['modalidade', 'valor', 'descricao'];
    const rows = planos.map(p => headers.map(h => `"${(p[h] || '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `planos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  /* ---------- LISTENERS GERAIS ---------- */
  inputBusca && inputBusca.addEventListener('input', atualizarTabela);

  window.addEventListener('storage', (e) => {
    if (e.key === 'planos') { planos = JSON.parse(localStorage.getItem('planos')) || []; atualizarTabela(); }
    if (e.key === 'modalidades') { carregarSelects(); }
  });

  window.addEventListener('modalidades:changed', () => carregarSelects());
  window.addEventListener('planos:changed', () => atualizarTabela());

  formArea && formArea.addEventListener('click', (e) => { if (e.target === formArea) fecharModal(); });

  /* ---------- INICIAR ---------- */
  atualizarTabela();
  carregarSelects();

}); // fim DOMContentLoaded
