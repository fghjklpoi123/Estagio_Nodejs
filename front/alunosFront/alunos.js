import api from '/js/apiClient.js';

// Alunos front — usa rotas exatas do backend (Option A)
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalAluno');
  const btnNovo = document.getElementById('btnNovoAluno');
  const btnSalvar = document.getElementById('salvarAluno');
  const btnFechar = document.getElementById('fecharModal');

  const nomeInput = document.getElementById('nomeAluno');
  const emailInput = document.getElementById('emailAluno');
  const nascInput = document.getElementById('nascAluno');
  const cpfInput = document.getElementById('cpfAluno');
  const telefoneInput = document.getElementById('telefoneAluno');
  const sexoInput = document.getElementById('sexoAluno');
  const endInput = document.getElementById('enderecoAluno');
  const sitInput = document.getElementById('situacaoAluno');
  const obsInput = document.getElementById('obsAluno');
  const senhaInput = document.getElementById('senhaAluno');

  const lista = document.getElementById('listaAlunos');
  const busca = document.getElementById('buscarAluno');
  const filtroSituacao = document.getElementById('filtroSituacao');
  const paginacao = document.getElementById('paginacao');

  let alunos = [];
  let alunoEditando = null; // DB id when editing

  function escapeHtml(s){ if (s===undefined||s===null) return ''; return String(s).replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function calcularIdade(d){ if(!d) return ''; const nasc=new Date(d); if(isNaN(nasc)) return ''; const hoje=new Date(); let i=hoje.getFullYear()-nasc.getFullYear(); if(hoje.getMonth()<nasc.getMonth()|| (hoje.getMonth()===nasc.getMonth()&&hoje.getDate()<nasc.getDate())) i--; return i; }
  
  // CPF validation (verifica dígitos verificadores)
  function validarCPF(cpf) {
    cpf = String(cpf).replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf[10]);
  }

  // Função para marcar erro em um campo
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

  // CPF mask while typing (limit to 11 digits)
  cpfInput && cpfInput.addEventListener('input', ()=>{
    let v = cpfInput.value.replace(/\D/g,'');
    if (v.length > 11) v = v.slice(0,11);
    v = v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{2})$/,'$1-$2');
    cpfInput.value = v;
  });
  // Telefone mask while typing
  telefoneInput && telefoneInput.addEventListener('input', ()=>{
    let v = telefoneInput.value.replace(/\D/g,'');
    if (v.length > 10) v = v.slice(0,11);
    if (v.length <= 2) telefoneInput.value = v;
    else if (v.length <= 6) telefoneInput.value = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length <= 10) telefoneInput.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else telefoneInput.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7,11)}`;
  });

  btnNovo && btnNovo.addEventListener('click', ()=>{ alunoEditando=null; document.getElementById('tituloModal').innerText='Novo Aluno'; modal&&modal.classList.add('active'); });
  btnFechar && btnFechar.addEventListener('click', ()=>{ modal&&modal.classList.remove('active'); limpar(); });

  btnSalvar && btnSalvar.addEventListener('click', async ()=>{
    const nome = nomeInput.value.trim(); 
    const email = emailInput.value.trim(); 
    const nasc = nascInput.value; 
    const cpf = cpfInput.value.trim().replace(/\D/g,''); 
    const endereco = endInput.value.trim(); 
    const telefone = telefoneInput ? telefoneInput.value.trim() : '';
    const sexo = (sexoInput && sexoInput.value) ? sexoInput.value.toUpperCase() : 'O';
    const situacao = sitInput.value; 
    const obs = obsInput.value.trim();
    const senha = senhaInput ? senhaInput.value.trim() : '';
    
    let temErro = false;
    
    // Marcar campos obrigatórios vazios
    if(!nome) { marcarErro(nomeInput, true); temErro = true; } else { marcarErro(nomeInput, false); }
    if(!email) { marcarErro(emailInput, true); temErro = true; } else { const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if(!emailRe.test(String(email).toLowerCase())){ marcarErro(emailInput, true); temErro = true; } else { marcarErro(emailInput, false); } }
    if(!nasc) { marcarErro(nascInput, true); temErro = true; } else { marcarErro(nascInput, false); }
    if(!cpf) { marcarErro(cpfInput, true); temErro = true; } else { marcarErro(cpfInput, false); }
    if(!senha) { marcarErro(senhaInput, true); temErro = true; } else { marcarErro(senhaInput, false); }
    
    // Validação de CPF se preenchido
    if(cpf && !validarCPF(cpf)) { marcarErro(cpfInput, true); temErro = true; }

    // Validação simples de telefone (se preenchido requer pelo menos 8 dígitos)
    if (telefone) {
      const digits = telefone.replace(/\D/g,'');
      if (digits.length < 8) { marcarErro(telefoneInput, true); temErro = true; }
      else { marcarErro(telefoneInput, false); }
    } else {
      marcarErro(telefoneInput, false);
    }
    
    const dados = { name: nome, cpf, telefone: telefone || '', sexo, data_nascimento: nasc, email, senha, endereco, situacao, obs };
    try{ if(alunoEditando!==null) await api.updateAluno(alunoEditando,dados); else await api.createAluno(dados); modal&&modal.classList.remove('active'); limpar(); await carregarAlunos(); } catch(err){ console.error(err); alert('Erro ao salvar: '+err.message); }
  });

  function limpar(){
    if(!nomeInput) return;
    nomeInput.value='';
    emailInput.value='';
    nascInput.value='';
    cpfInput.value='';
    if (telefoneInput) telefoneInput.value = '';
    if (sexoInput) sexoInput.value = '';
    endInput.value='';
    sitInput.value='Ativo';
    obsInput.value='';
    if (senhaInput) senhaInput.value = '';
    marcarErro(nomeInput, false);
    marcarErro(emailInput, false);
    marcarErro(nascInput, false);
    marcarErro(cpfInput, false);
    marcarErro(telefoneInput, false);
    if (senhaInput) marcarErro(senhaInput, false);
  }

  lista && lista.addEventListener('click', async (ev)=>{ const btn=ev.target.closest('button'); if(!btn) return; const id = btn.dataset.id ? parseInt(btn.dataset.id,10) : NaN; if(btn.classList.contains('edit-btn')) { if(!Number.isFinite(id)) return; editarAluno(id); } else if(btn.classList.contains('delete-btn')) { if(!Number.isFinite(id)) return; if(!confirm('Excluir aluno?')) return; try{ await api.deleteAluno(id); await carregarAlunos(); }catch(err){ console.error(err); alert('Erro ao excluir: '+err.message); } } });

  function editarAluno(id){
    const a = alunos.find(x=>x.id===id);
    if(!a) return;
    alunoEditando = id;
    nomeInput.value = a.nome || '';
    emailInput.value = a.email || '';
    nascInput.value = a.data_nascimento || '';
    cpfInput.value = a.cpf || '';
    if (sexoInput) sexoInput.value = a.sexo || '';
    if (telefoneInput) telefoneInput.value = a.telefone || '';
    endInput.value = a.endereco || '';
    sitInput.value = a.situacao || 'Ativo';
    obsInput.value = a.obs || '';
    if (senhaInput) senhaInput.value = a.senha || '';
    document.getElementById('tituloModal').innerText = 'Editar Aluno';
    modal&&modal.classList.add('active');
  }

  let paginaAtual=1, porPagina=6;
  function render(){ try{ lista.innerHTML=''; const termo=(busca&&busca.value)?busca.value.trim().toLowerCase():''; const sitVal=filtroSituacao?filtroSituacao.value:''; let filtrados = alunos.filter(a=> a.nome.toLowerCase().includes(termo) && (sitVal===''||a.situacao===sitVal)); const totalPaginas=Math.max(1,Math.ceil(filtrados.length/porPagina)); if(paginaAtual>totalPaginas) paginaAtual=totalPaginas; const inicio=(paginaAtual-1)*porPagina; const segmento=filtrados.slice(inicio,inicio+porPagina); segmento.forEach(a=>{ const realId=a.id; const card=document.createElement('div'); card.className='card'; card.innerHTML=`<button class="edit-btn" data-id="${realId}" title="Editar"><i class="fa-solid fa-pen"></i></button><button class="delete-btn" data-id="${realId}" title="Excluir"><i class="fa-solid fa-trash"></i></button><h3>${escapeHtml(a.nome)}</h3><span>Idade: ${escapeHtml(String(a.idade||calcularIdade(a.data_nascimento)))} anos</span><span>CPF: ${escapeHtml(a.cpf)}</span><span>Situação: ${escapeHtml(a.situacao)}</span>`; lista.appendChild(card); }); paginacao.innerHTML=''; for(let i=1;i<=Math.max(1,Math.ceil(filtrados.length/porPagina));i++){ const b=document.createElement('button'); b.textContent=i; if(i===paginaAtual) b.className='ativo'; b.addEventListener('click',()=>{ paginaAtual=i; render();}); paginacao.appendChild(b);} }catch(err){ console.error(err); lista.innerHTML='<p style="color:#c00;">Erro ao exibir alunos. Veja console.</p>'; } }

  // After rendering basic cards, enrich each card with plan info and a link to modalidades page
  async function enrichCards(){
    try{
      const nodes = lista.querySelectorAll('.card');
      for(const node of nodes){
        const editBtn = node.querySelector('.edit-btn');
        if(!editBtn) continue;
        const id = Number(editBtn.dataset.id);
        const infoDiv = document.createElement('div');
        infoDiv.className = 'plan-info';
        infoDiv.textContent = 'Carregando plano...';
        node.appendChild(infoDiv);

        const btnWrap = document.createElement('div');
        btnWrap.style.marginTop = '8px';
        const link = document.createElement('a');
        btnWrap.appendChild(link);
        node.appendChild(btnWrap);

        // fetch plan and inscricoes
        try{
          const [plano, inscricoes] = await Promise.allSettled([api.getAlunoPlano(id), api.getAlunoModalidades(id)]);
          let textoPlano = 'Plano: Nenhum';
          if(plano.status === 'fulfilled' && plano.value){
            const p = plano.value;
            const limite = p.limite == null ? null : Number(p.limite);
            const descr = p.descricao || p.nome || '—';
            const usadas = (inscricoes.status === 'fulfilled' && Array.isArray(inscricoes.value)) ? inscricoes.value.length : 0;
            textoPlano = `Plano: ${descr}` + (limite != null ? ` — Vagas restantes: ${Math.max(0, limite - usadas)}` : '');
          }
          infoDiv.textContent = textoPlano;
        }catch(e){ infoDiv.textContent = 'Erro ao carregar plano'; }
      }
    }catch(err){ console.error('Erro enrichCards', err); }
  }

  if(busca) busca.addEventListener('input',()=>{ paginaAtual=1; render(); }); if(filtroSituacao) filtroSituacao.addEventListener('change',()=>{ paginaAtual=1; render(); });

  // Sincronização entre abas: quando modalidades mudam em outra aba
  window.addEventListener('modalidades:changed', () => {
    console.log('[alunos] modalidades:changed recebido');
    render();
  });

  // Sincronização de storage: detecta mudanças em alunos de outra aba
  window.addEventListener('storage', (e) => {
    if (e.key === 'alunos') {
      alunos = JSON.parse(localStorage.getItem('alunos')) || [];
      render();
    }
  });

  async function carregarAlunos(){ try{ alunos = await api.getAlunos() || []; render(); } catch(err){ console.error('Erro ao carregar alunos:',err); lista.innerHTML = '<p style="color:#c00;">Erro ao carregar alunos. Veja console.</p>'; } }

  (async()=>{ try{ await carregarAlunos(); }catch(err){ console.error(err); } })();

  // after initial load, enrich cards with plan info and link to modalidades
  const observer = new MutationObserver(()=>{ enrichCards(); });
  observer.observe(lista, { childList: true });

  window.__alunosDebug = { render, carregarAlunos, validarCPF, calcularIdade };
});