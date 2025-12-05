import api from '/js/apiClient.js';

document.addEventListener('DOMContentLoaded', async () => {

  const modal = document.getElementById('formArea');
  const btnNovo = document.getElementById('btnNovo');
  const btnSalvar = document.getElementById('btnSalvar');
  const btnCancelar = document.getElementById('btnCancelar');

  const selectModalidade = document.getElementById('selectModalidade');
  const inputValor = document.getElementById('inputValor');
  const descPlano = document.getElementById('descPlano');
  
  const tableBody = document.querySelector('#tablePlanos tbody');
  const formTitle = document.getElementById('formTitle');
  const inputBusca = document.getElementById('buscarAluno');

  let planos = [];
  let modalidades = [];
  let editId = null;

  
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function marcarErro(el, temErro) {
    if (!el) return;
    if (temErro) {
      el.classList.add('erro');
      el.style.borderColor = '#c00';
      el.style.backgroundColor = '#ffe6e6';
    } else {
      el.classList.remove('erro');
      el.style.borderColor = '';
      el.style.backgroundColor = '';
    }
  }

  function formatarParaPtBr(valorNum) {
    if (valorNum === null || valorNum === undefined || valorNum === '') return '';
    const n = Number(valorNum) || 0;
    return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function parseValorBr(str) {
    if (str === null || str === undefined || str === '') return 0;
    let s = String(str).trim();
    s = s.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function ajustarAlturaTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 300) + 'px';
  }

  if (descPlano) {
    descPlano.addEventListener('input', () => ajustarAlturaTextarea(descPlano));
    ajustarAlturaTextarea(descPlano);
  }

  if (inputValor) {
    inputValor.addEventListener('input', (e) => {
      let v = e.target.value || '';
      v = v.replace(/[^\d,]/g, '');
      const parts = v.split(',');
      if (parts.length > 2) v = parts.shift() + ',' + parts.join('');
      if (v.includes(',')) {
        const [intPart, decPart] = v.split(',');
        const intClean = intPart.slice(0, 3);
        const decClean = decPart.slice(0, 2);
        v = intClean + ',' + decClean;
      } else {
        v = v.slice(0, 3);
      }
      e.target.value = v;
    });

    inputValor.addEventListener('blur', (e) => {
      let v = e.target.value || '';
      if (!v) return;
      const num = parseValorBr(v);
      e.target.value = formatarParaPtBr(num);
    });
  }

  async function carregarModalidades() {
    try {
      modalidades = await api.getModalidades() || [];
      if (selectModalidade) {
        selectModalidade.innerHTML = '<option value="">Selecione uma modalidade</option>';
        modalidades.forEach(m => {
          const option = document.createElement('option');
          option.value = m.id;
          option.textContent = escapeHtml(m.nome);
          selectModalidade.appendChild(option);
        });
      }
    } catch (err) {
      console.error('Erro ao carregar modalidades:', err);
    }
  }

  async function carregarPlanos() {
    try {
      planos = await api.getPlanos() || [];
      atualizarTabela();
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="3" style="color:#c00">Erro ao carregar planos</td></tr>';
      }
    }
  }

  function atualizarTabela() {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    let lista = planos;
    if (inputBusca && inputBusca.value.trim()) {
      const termo = inputBusca.value.trim().toLowerCase();
      lista = planos.filter(p =>
        (p.descricao || '').toLowerCase().includes(termo) ||
        (modalidades.find(m => m.id === p.modalidade_id)?.nome || '').toLowerCase().includes(termo)
      );
    }

    if (!lista.length) {
      tableBody.innerHTML = '<tr><td colspan="3" style="color:#888">Nenhum plano cadastrado</td></tr>';
      return;
    }

    lista.forEach((p) => {
      const tr = document.createElement('tr');
      const modalidade = modalidades.find(m => m.id === p.modalidade_id);
      const nomeModalidade = modalidade ? escapeHtml(modalidade.nome) : '—';

      tr.innerHTML = `
        <td>${nomeModalidade}</td>
        <td style="white-space:nowrap;">${formatarParaPtBr(p.preco)}</td>
        <td style="text-align:center;">
          <button class="action-btn edit" data-id="${p.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-id="${p.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function limparForm() {
    if (selectModalidade) selectModalidade.value = '';
    if (inputValor) inputValor.value = '';
    if (descPlano) descPlano.value = '';
    [selectModalidade, inputValor, descPlano].forEach(el => { if (el) marcarErro(el, false); });
    editId = null;
    if (descPlano) ajustarAlturaTextarea(descPlano);
  }

  function abrirModal() {
    if (!modal) return;
    modal.classList.add('show');
    document.body.classList.add('modal-open');
  }

  function fecharModal() {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }

  btnNovo && btnNovo.addEventListener('click', () => {
    editId = null;
    formTitle.textContent = 'Novo Plano';
    limparForm();
    abrirModal();
  });

  btnCancelar && btnCancelar.addEventListener('click', () => {
    fecharModal();
    limparForm();
  });

  btnSalvar && btnSalvar.addEventListener('click', async () => {
    const modalidadeId = selectModalidade && selectModalidade.value ? parseInt(selectModalidade.value) : null;
    const valorStr = inputValor ? inputValor.value.trim() : '';
    const descricao = descPlano ? descPlano.value.trim() : '';

    let temErro = false;

    if (!descricao) {
      marcarErro(descPlano, true);
      temErro = true;
    } else {
      marcarErro(descPlano, false);
    }

    if (!valorStr) {
      marcarErro(inputValor, true);
      temErro = true;
    } else {
      const valor = parseValorBr(valorStr);
      if (valor <= 0) {
        marcarErro(inputValor, true);
        temErro = true;
      } else {
        marcarErro(inputValor, false);
      }
    }

    if (temErro) return;

    const valor = parseValorBr(valorStr);
    const dados = {
      descricao,
      preco: valor,
      modalidade_id: modalidadeId
    };

    try {
      btnSalvar.disabled = true;
      if (editId) {
        await api.updatePlano(editId, dados);
      } else {
        await api.createPlano(dados);
      }
      fecharModal();
      limparForm();
      await carregarPlanos();
    } catch (err) {
      console.error('Erro ao salvar plano:', err);
      alert('Erro ao salvar plano: ' + (err.message || err));
    } finally {
      btnSalvar.disabled = false;
    }
  });

  tableBody && tableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);

    if (btn.classList.contains('edit')) {
      const plano = planos.find(p => p.id === id);
      if (!plano) return;
      editId = id;
      if (selectModalidade) selectModalidade.value = plano.modalidade_id || '';
      if (inputValor) inputValor.value = formatarParaPtBr(plano.preco);
      if (descPlano) descPlano.value = plano.descricao || '';
      formTitle.textContent = 'Editar Plano';
      abrirModal();
      ajustarAlturaTextarea(descPlano);
    } else if (btn.classList.contains('delete')) {
      if (!confirm('Excluir este plano?')) return;
      try {
        btn.disabled = true;
        await api.deletePlano(id);
        await carregarPlanos();
      } catch (err) {
        console.error('Erro ao deletar plano:', err);
        alert('Erro ao deletar plano: ' + (err.message || err));
      } finally {
        btn.disabled = false;
      }
    }
  });

  inputBusca && inputBusca.addEventListener('input', () => {
    atualizarTabela();
  });

  await carregarModalidades();
  await carregarPlanos();
});
