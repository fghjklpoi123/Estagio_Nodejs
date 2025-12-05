import api from '/js/apiClient.js';

function qs(name) { const url = new URL(location.href); return url.searchParams.get(name); }
const alunoId = qs('alunoId');

const listaModalidadesEl = document.getElementById('listaModalidades');
const buscarModalidadeInput = document.getElementById('buscarModalidade');

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

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

if (alunoId) {
  (async function studentView(){
    try {
      const [modalidades, inscricoes, plano] = await Promise.all([
        api.getModalidades(),
        api.getAlunoModalidades(alunoId),
        api.getAlunoPlano(alunoId).catch(()=>null)
      ]);

      const inscritosIds = new Set((inscricoes || []).map(m => m.id));

      function remaining() {
        if (!plano) return null;
        return (plano.limite == null) ? null : Math.max(0, plano.limite - (inscricoes || []).length);
      }

      function render() {
        listaModalidadesEl.innerHTML = '';
        const term = (buscarModalidadeInput && buscarModalidadeInput.value) ? buscarModalidadeInput.value.trim().toLowerCase() : '';
        const filtered = (modalidades || []).filter(m => (m.nome||'').toLowerCase().includes(term) || (m.descricao||'').toLowerCase().includes(term));
        filtered.forEach(m => {
          const enrolled = inscritosIds.has(m.id);
          const card = document.createElement('div');
          card.className = 'card';
          const btn = enrolled ? `<button class="cancel-btn" data-id="${m.id}">Cancelar</button>` : `<button class="join-btn" data-id="${m.id}">Inscrever-se</button>`;
          card.innerHTML = `<h3>${escapeHtml(m.nome)}</h3><p>${escapeHtml(m.descricao||'')}</p><div>${btn}</div>`;
          listaModalidadesEl.appendChild(card);
        });

        const info = document.createElement('div');
        info.style.marginTop = '12px';
        let planText = 'Plano: ' + (plano ? (plano.descricao || '—') : 'Nenhum');
        const rem = remaining();
        if (rem != null) planText += ` — Vagas restantes: ${rem}`;
        info.textContent = planText;
        listaModalidadesEl.prepend(info);
      }

      listaModalidadesEl.addEventListener('click', async (ev)=>{
        const btn = ev.target.closest('button'); if(!btn) return; const id = btn.dataset.id;
        if(btn.classList.contains('join-btn')){
          btn.disabled = true; try{ const res = await api.inscreverAluno(alunoId, Number(id)); alert(res.mensagem || 'Inscrito com sucesso'); 
            const ins = await api.getAlunoModalidades(alunoId); ins.forEach(x=>inscritosIds.add(x.id)); render();
          }catch(err){ console.error(err); alert('Erro ao inscrever: '+err.message); } finally{ btn.disabled=false; }
        } else if(btn.classList.contains('cancel-btn')){
          if(!confirm('Confirmar cancelamento desta modalidade?')) return; btn.disabled=true; try{ const res = await api.cancelarInscricao(alunoId, Number(id)); alert(res.mensagem || 'Cancelado'); const ins = await api.getAlunoModalidades(alunoId); inscritosIds.clear(); (ins||[]).forEach(x=>inscritosIds.add(x.id)); render(); }catch(err){ console.error(err); alert('Erro ao cancelar: '+err.message); } finally{ btn.disabled=false; }
        }
      });

      buscarModalidadeInput && buscarModalidadeInput.addEventListener('input', ()=>render());
      render();
    } catch (err) {
      console.error('Erro ao carregar tela de modalidades do aluno:', err);
      listaModalidadesEl.innerHTML = '<p style="color:#c00">Erro ao carregar modalidades. Veja console.</p>';
    }
  })();

} else {
  (async function adminView(){
    const modalModalidade = document.getElementById('modalModalidade');
    const btnNovaModalidade = document.getElementById('btnNovaModalidade');
    const btnSalvarModalidade = document.getElementById('salvarModalidade');
    const btnFecharModal = document.getElementById('fecharModal');
    const nomeModalidadeInput = document.getElementById('nomeModalidade');
    const descModalidadeInput = document.getElementById('descModalidade');

    let modalidades = [];
    let editId = null;

    function renderList(){
      const term = (buscarModalidadeInput && buscarModalidadeInput.value) ? buscarModalidadeInput.value.trim().toLowerCase() : '';
      const filtered = (modalidades || []).filter(m => (m.nome||'').toLowerCase().includes(term) || (m.descricao||'').toLowerCase().includes(term));
      listaModalidadesEl.innerHTML = '';
      filtered.forEach(m=>{
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div style="position:absolute; top:8px; right:8px; display:flex; gap:8px;">
            <button class="edit-btn" data-id="${m.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
            <button class="delete-btn" data-id="${m.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
          </div>
          <h3>${escapeHtml(m.nome)}</h3>
          <p>${escapeHtml(m.descricao||'')}</p>
        `;
        listaModalidadesEl.appendChild(card);
      });
    }

    async function load(){
      try{
        modalidades = await api.getModalidades() || [];
        renderList();
      }catch(err){ console.error(err); listaModalidadesEl.innerHTML = '<p style="color:#c00">Erro ao carregar modalidades. Veja console.</p>'; }
    }

    btnNovaModalidade && btnNovaModalidade.addEventListener('click', ()=>{
      editId = null; nomeModalidadeInput.value=''; descModalidadeInput.value=''; document.getElementById('tituloModal').innerText = 'Nova Modalidade'; modalModalidade.classList.add('active');
    });

    btnFecharModal && btnFecharModal.addEventListener('click', ()=>{ modalModalidade.classList.remove('active'); });

    btnSalvarModalidade && btnSalvarModalidade.addEventListener('click', async ()=>{
      const nome = nomeModalidadeInput.value.trim(); const desc = descModalidadeInput.value.trim();
      if(!nome){ marcarErro(nomeModalidadeInput, true); alert('Informe o nome da modalidade.'); return; }
      else { marcarErro(nomeModalidadeInput, false); }
      try{
        if(editId){ await api.updateModalidade(editId, { nome, descricao: desc }); }
        else { await api.createModalidade({ nome, descricao: desc }); }
        modalModalidade.classList.remove('active');
        await load();
      }catch(err){ console.error(err); alert('Erro ao salvar modalidade: '+(err.message||err)); }
    });

    listaModalidadesEl.addEventListener('click', async (ev)=>{
      const btn = ev.target.closest('button'); if(!btn) return; const id = btn.dataset.id ? Number(btn.dataset.id) : null;
      if(btn.classList.contains('edit-btn')){
        if(!id) return; const m = modalidades.find(x=>x.id===id); if(!m) return; editId = id; nomeModalidadeInput.value = m.nome||''; descModalidadeInput.value = m.descricao||''; document.getElementById('tituloModal').innerText='Editar Modalidade'; modalModalidade.classList.add('active');
      } else if(btn.classList.contains('delete-btn')){
        if(!id) return; if(!confirm('Excluir modalidade?')) return; try{ await api.deleteModalidade(id); await load(); }catch(err){ console.error(err); alert('Erro ao excluir: '+(err.message||err)); }
      }
    });

    buscarModalidadeInput && buscarModalidadeInput.addEventListener('input', ()=>renderList());

    await load();
  })();
}
