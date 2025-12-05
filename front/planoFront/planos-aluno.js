import * as api from '/js/apiClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const planosContainer = document.getElementById('planosContainer');
  const statusContainer = document.getElementById('statusContainer');
  const buscarPlanoInput = document.getElementById('buscarPlano');

  let planos = [];
  let modalidadesMap = {}; 

  function showStatus(type, message) {
    statusContainer.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    if (type === 'success' || type === 'info') {
      setTimeout(() => { statusContainer.innerHTML = ''; }, 5000);
    }
  }

  
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function formatarValor(valor) {
    if (!valor) return 'R$ 0,00';
    const num = parseFloat(valor) || 0;
    return 'R$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  async function carregarModalidades() {
    try {
      const mods = await api.getModalidades();
      modalidadesMap = {};
      (mods || []).forEach(m => {
        modalidadesMap[m.id] = m.nome;
      });
    } catch (err) {
      console.error('Erro ao carregar modalidades:', err);
    }
  }

  let inscricoes = [];
  async function carregarInscricoes() {
    try {
      const alunoId = localStorage.getItem('alunoId');
      if (alunoId) {
        inscricoes = await api.getAlunoModalidades(alunoId) || [];
      } else {
        inscricoes = [];
      }
    } catch (err) {
      console.error('Erro ao carregar inscrições:', err);
    }
  }

  let modalOverlay = null;
  function criarModalConfirmacao() {
    if (modalOverlay) return modalOverlay;
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay confirm-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-card modal-confirm-card card">
        <h3 id="confirm-title">Confirmar ação</h3>
        <p id="confirm-text">Tem certeza?</p>
        <div class="form-actions confirm-actions" style="margin-top:18px; justify-content: flex-end;">
          <button type="button" class="btn-secondary btn-cancel-modal">Cancelar</button>
          <button type="button" class="btn-primary btn-confirm-modal" style="margin-left:8px">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    modalOverlay.querySelector('.btn-cancel-modal').addEventListener('click', () => {
      fecharModalConfirmacao();
    });

    modalOverlay.addEventListener('click', (ev) => {
      if (ev.target === modalOverlay) fecharModalConfirmacao();
    });

    return modalOverlay;
  }

  function abrirModalConfirmacao({ title = 'Confirmar cancelamento', text = 'Deseja realmente cancelar a assinatura desta modalidade?', onConfirm, confirmBtnClass = 'btn-danger' } = {}) {
    const overlay = criarModalConfirmacao();
    overlay.querySelector('#confirm-title').innerText = title;
    overlay.querySelector('#confirm-text').innerText = text;

    const confirmBtn = overlay.querySelector('.btn-confirm-modal');
   
    const newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

    
    newConfirm.className = `btn-confirm-modal ${confirmBtnClass}`;

    newConfirm.addEventListener('click', async () => {
      newConfirm.disabled = true;
      newConfirm.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin-right:8px"></span>Processando...';
      try {
        await onConfirm();
        fecharModalConfirmacao();
      } catch (err) {
        console.error('Erro no onConfirm do modal:', err);
        showStatus('error', err.message || 'Erro ao processar a solicitação');
        newConfirm.disabled = false;
        newConfirm.innerText = 'Confirmar';
      }
    });

    document.body.classList.add('modal-open');
    overlay.classList.add('show');
  }

  function fecharModalConfirmacao() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    const confirmBtn = modalOverlay.querySelector('.btn-confirm-modal');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerText = 'Confirmar';
    }
  }

  async function carregarPlanos() {
    try {
      await carregarInscricoes();
      planos = await api.getPlanos() || [];
      if (planos.length === 0) {
        planosContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Nenhum plano disponível no momento.</p>';
        return;
      }
      render();
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
      showStatus('error', 'Erro ao carregar planos');
    }
  }

  function render() {
    planosContainer.innerHTML = '';
    if (!planos || planos.length === 0) {
      planosContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Nenhum plano disponível.</p>';
      return;
    }

    const termo = (buscarPlanoInput && buscarPlanoInput.value) ? buscarPlanoInput.value.trim().toLowerCase() : '';
    const filtrados = planos.filter(p =>
      (p.descricao || '').toLowerCase().includes(termo) ||
      (modalidadesMap[p.modalidade_id] || '').toLowerCase().includes(termo)
    );

    if (filtrados.length === 0) {
      planosContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Nenhum plano encontrado com esse termo.</p>';
      return;
    }

    filtrados.forEach(plano => {
      const card = document.createElement('div');
      card.className = 'plano-card';

      const modalidadeNome = plano.modalidade_id ? modalidadesMap[plano.modalidade_id] || `Modalidade ${plano.modalidade_id}` : 'Sem modalidade';
      const descricao = plano.descricao || 'Plano sem descrição';
      const valor = formatarValor(plano.preco || 0);

      const jaInscrito = inscricoes.some(insc => Number(insc.id) === Number(plano.modalidade_id));

      let btnHtml;
      if (jaInscrito) {
        btnHtml = `<button class="cancel-btn" data-modalidade-id="${plano.modalidade_id}">Cancelar Assinatura</button>`;
      } else {
        btnHtml = `<button class="btn-assinar" data-plano-id="${plano.id}">Assinar Plano</button>`;
      }

      card.innerHTML = `
        <h3>${escapeHtml(modalidadeNome)}</h3>
        <div class="plano-preco">${valor}</div>
        <div class="plano-desc">${escapeHtml(descricao)}</div>
        ${btnHtml}
      `;

      const btn = card.querySelector('button');
      if (!jaInscrito) {
        btn.addEventListener('click', () => {
          const alunoId = localStorage.getItem('alunoId');
          if (!alunoId) { showStatus('error', 'Aluno não identificado. Faça login novamente.'); return; }

          abrirModalConfirmacao({
            title: 'Confirmar assinatura',
            text: `Deseja assinar o plano da modalidade "${escapeHtml(modalidadeNome)}"?`,
            confirmBtnClass: 'btn-success',
            onConfirm: async () => {
              await assinarPlano(plano.id, btn);
            }
          });
        });
      } else {
        btn.addEventListener('click', async () => {
          const alunoId = localStorage.getItem('alunoId');
          if (!alunoId) { showStatus('error', 'Aluno não identificado. Faça login novamente.'); return; }

          const modalidadeId = Number(btn.dataset.modalidadeId || btn.getAttribute('data-modalidade-id'));
          
          abrirModalConfirmacao({
            title: 'Cancelar assinatura',
            text: `Deseja realmente cancelar a assinatura da modalidade "${escapeHtml(modalidadesMap[modalidadeId] || modalidadeId)}"?`,
            confirmBtnClass: 'btn-danger',
            onConfirm: async () => {
              
              btn.disabled = true;
              const originalText = btn.innerHTML;
              btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;margin-right:8px"></span>Cancelando...';
              try {
                const res = await api.cancelarInscricao(alunoId, modalidadeId);
                showStatus('success', res.mensagem || res.message || 'Assinatura cancelada com sucesso');
                await carregarInscricoes();
                render();
              } catch (err) {
                console.error('Erro ao cancelar assinatura:', err);
                showStatus('error', err.message || 'Erro ao cancelar assinatura');
                btn.disabled = false;
                btn.innerHTML = originalText;
                throw err; 
              }
            }
          });

        });
      }
      planosContainer.appendChild(card);
    });
  }

  async function assinarPlano(planoId, btn) {
    const alunoId = localStorage.getItem('alunoId');
    if (!alunoId) {
      showStatus('error', 'Aluno não identificado. Faça login novamente.');
      return;
    }

    btn.disabled = true;
    const btnText = btn.innerText;
    btn.innerHTML = '<span class="spinner"></span> Processando...';

    try {
      const resultado = await api.assinarPlano(planoId);
      showStatus('success', '✓ Inscrito com sucesso no plano!');
 
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Erro ao assinar plano:', err);
      let mensagem = err.message || 'Falha ao assinar plano';
      if (mensagem.includes('409') || mensagem.includes('já está inscrito')) {
        mensagem = 'Você já está inscrito nessa modalidade';
        showStatus('info', mensagem);
      } else {
        showStatus('error', `Erro: ${mensagem}`);
      }
      btn.disabled = false;
      btn.innerText = btnText;
    }
  }

  buscarPlanoInput && buscarPlanoInput.addEventListener('input', () => {
    render();
  });

  await carregarModalidades();
  await carregarPlanos();
});
