import * as api from '/js/apiClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const planosContainer = document.getElementById('planosContainer');
  const statusContainer = document.getElementById('statusContainer');
  const buscarPlanoInput = document.getElementById('buscarPlano');

  let planos = [];
  let modalidadesMap = {}; // id -> nome

  // Helper para renderizar mensagem de status
  function showStatus(type, message) {
    statusContainer.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    if (type === 'success' || type === 'info') {
      setTimeout(() => { statusContainer.innerHTML = ''; }, 5000);
    }
  }

  // Helper para escapar HTML
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  // Formatar valor para BRL
  function formatarValor(valor) {
    if (!valor) return 'R$ 0,00';
    const num = parseFloat(valor) || 0;
    return 'R$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Carregar modalidades
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

  // Carregar modalidades inscritas do aluno
  let inscricoes = [];
  async function carregarInscricoes() {
    try {
      const alunoId = localStorage.getItem('alunoId');
      if (alunoId) {
        inscricoes = await api.getAlunoModalidades(alunoId) || [];
      }
    } catch (err) {
      console.error('Erro ao carregar inscrições:', err);
    }
  }

  // Carregar planos
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

  // Renderizar planos
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

      // Verifica se o aluno já está inscrito nessa modalidade
      const jaInscrito = inscricoes.some(insc => insc.modalidade_id === plano.modalidade_id);

      let btnHtml = jaInscrito
        ? `<button class="btn-assinar" disabled style="opacity: 0.6; cursor: not-allowed;">✓ Já Inscrito</button>`
        : `<button class="btn-assinar" data-plano-id="${plano.id}">Assinar Plano</button>`;

      card.innerHTML = `
        <h3>${escapeHtml(modalidadeNome)}</h3>
        <div class="plano-preco">${valor}</div>
        <div class="plano-desc">${escapeHtml(descricao)}</div>
        ${btnHtml}
      `;

      const btn = card.querySelector('button');
      if (!jaInscrito) {
        btn.addEventListener('click', () => {
          assinarPlano(plano.id, btn);
        });
      }

      planosContainer.appendChild(card);
    });
  }

  // Assinar plano
  async function assinarPlano(planoId, btn) {
    const alunoId = localStorage.getItem('alunoId');
    if (!alunoId) {
      showStatus('error', 'Aluno não identificado. Faça login novamente.');
      return;
    }

    // Desabilitar botão
    btn.disabled = true;
    const btnText = btn.innerText;
    btn.innerHTML = '<span class="spinner"></span> Processando...';

    try {
      const resultado = await api.assinarPlano(planoId);
      showStatus('success', '✓ Inscrito com sucesso no plano!');
      
      // Recarregar após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Erro ao assinar plano:', err);
      let mensagem = err.message || 'Falha ao assinar plano';
      // Se for erro 409 ou mensagem contém "já inscrito", mostrar mensagem específica
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

  // Event listener para busca
  buscarPlanoInput && buscarPlanoInput.addEventListener('input', () => {
    render();
  });

  // Inicializar
  await carregarModalidades();
  await carregarPlanos();
});
