import * as api from '/js/apiClient.js';

document.addEventListener('DOMContentLoaded', ()=>{
  const modalBg = document.getElementById('modalTreinador');
  const btnNovo = document.getElementById('btnNovoTreinador');
  const btnSalvar = document.getElementById('salvarTreinador');
  const btnFechar = document.getElementById('fecharModalTreinador');

  const nomeInput = document.getElementById('nomeTreinador');
  const emailInput = document.getElementById('emailTreinador');
  const cpfInput = document.getElementById('cpfTreinador');
  const telInput = document.getElementById('telefoneTreinador');
  const sexoInput = document.getElementById('sexoTreinador');
  const nascInput = document.getElementById('nascTreinador');
  const modSelect = document.getElementById('modalidadeTreinador');
  const senhaInput = document.getElementById('senhaTreinador');

  const listaEl = document.getElementById('listaTreinadores');
  const buscar = document.getElementById('buscarTreinador');
  const filtroMod = document.getElementById('filtroModalidadeTreinador');
  const paginacaoEl = document.getElementById('paginacaoTreinadores');

  let treinadores = [];
  let editId = null;

  function escapeHtml(s){ if(s===undefined||s===null) return ''; return String(s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function marcarErro(el, temErro){ if(!el) return; if(temErro){ el.classList.add('erro'); el.style.borderColor='#c00'; el.style.backgroundColor='#ffe6e6'; } else { el.classList.remove('erro'); el.style.borderColor=''; el.style.backgroundColor=''; } }

  function validarCPF(cpf) {
    cpf = String(cpf).replace(/\D/g, '');
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

  cpfInput && cpfInput.addEventListener('input', ()=>{
    let v = cpfInput.value.replace(/\D/g,'');
    if (v.length > 11) v = v.slice(0,11);
    v = v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{2})$/,'$1-$2');
    cpfInput.value = v;
  });
 
  telInput && telInput.addEventListener('input', ()=>{ let v = telInput.value.replace(/\D/g,''); if (v.length > 11) v = v.slice(0,11); if (v.length <= 2) telInput.value = v; else if (v.length <= 6) telInput.value = `(${v.slice(0,2)}) ${v.slice(2)}`; else if (v.length <= 10) telInput.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`; else telInput.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7,11)}`; });

  btnNovo && btnNovo.addEventListener('click', ()=>{ editId = null; document.getElementById('tituloModalTreinador').innerText='Novo Treinador'; limpar(); modalBg.classList.add('active'); });
  btnFechar && btnFechar.addEventListener('click', ()=>{ modalBg.classList.remove('active'); });

  let modalidadesMap = {};
  async function carregarModalidades(){ try{ const mods = await api.getModalidades(); modSelect.innerHTML = '<option value="">Selecione</option>'; filtroMod.innerHTML = '<option value="">Modalidade</option>'; modalidadesMap = {}; (mods||[]).forEach(m=>{ modalidadesMap[m.id] = m.nome; modSelect.innerHTML += `<option value="${m.id}">${m.nome}</option>`; filtroMod.innerHTML += `<option value="${m.id}">${m.nome}</option>`; }); }catch(err){ console.error('Erro carregar modalidades',err); } }

  async function carregarTreinadores(){ try{ treinadores = await api.getProfessores() || []; render(); }catch(err){ console.error('Erro ao carregar treinadores',err); listaEl.innerHTML = '<p style="color:#c00">Erro ao carregar treinadores. Veja console.</p>'; } }

  btnSalvar && btnSalvar.addEventListener('click', async ()=>{
    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const cpf = cpfInput.value.trim().replace(/\D/g,'');
    const tel = telInput.value.trim();
    const sexo = (sexoInput && sexoInput.value) ? sexoInput.value.toUpperCase() : 'O';
    const modalidade = modSelect.value ? Number(modSelect.value) : null;
    const senha = senhaInput ? senhaInput.value.trim() : '';

    const nasc = nascInput ? nascInput.value : null;

    let temErro = false;
    if(!nome){ marcarErro(nomeInput, true); temErro = true; } else marcarErro(nomeInput, false);
    if(!email){ marcarErro(emailInput, true); temErro = true; } else { const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if(!emailRe.test(String(email).toLowerCase())){ marcarErro(emailInput, true); temErro = true; } else marcarErro(emailInput, false); }
    if(!cpf){ marcarErro(cpfInput, true); temErro = true; } else { marcarErro(cpfInput, false); }
    if(cpf && cpf.length !== 11){ marcarErro(cpfInput, true); temErro = true; } else if (cpf && !validarCPF(cpf)) { marcarErro(cpfInput, true); temErro = true; }

    if(!tel){ marcarErro(telInput, true); temErro = true; } else { const digits = tel.replace(/\D/g,''); if(digits.length < 8){ marcarErro(telInput, true); temErro = true; } else marcarErro(telInput, false); }

    if(!sexo || !['M','F','O'].includes(sexo)){ if(sexoInput) marcarErro(sexoInput, true); temErro = true; } else if(sexoInput) marcarErro(sexoInput, false);

    if(!nasc || isNaN(Date.parse(nasc))){ if(nascInput) marcarErro(nascInput, true); temErro = true; } else if(nascInput) marcarErro(nascInput, false);

    if(!senha) { marcarErro(senhaInput, true); temErro = true; } else { marcarErro(senhaInput, false); }

    if(temErro) return;

    const dados = { name: nome, cpf, telefone: tel || '', sexo, data_nascimento: nasc, email, senha, modalidade_id: modalidade };

    try{
      if(editId){ await api.updateProfessor(editId, dados); }
      else { await api.createProfessor(dados); }
      modalBg.classList.remove('active'); limpar(); await carregarTreinadores();
    }catch(err){ console.error(err); alert('Erro ao salvar: '+(err.message||err)); }
  });

  function limpar(){ nomeInput.value=''; emailInput.value=''; cpfInput.value=''; telInput.value=''; if(sexoInput) sexoInput.value=''; if(nascInput) nascInput.value=''; modSelect.value=''; if (senhaInput) senhaInput.value = ''; marcarErro(nomeInput,false); marcarErro(emailInput,false); marcarErro(cpfInput,false); marcarErro(telInput,false); if(sexoInput) marcarErro(sexoInput,false); if(nascInput) marcarErro(nascInput,false); }

  listaEl && listaEl.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return; const id = btn.dataset.id ? Number(btn.dataset.id) : null;
    if(btn.classList.contains('edit-btn')){
      if(!id) return; editar(id);
    } else if(btn.classList.contains('delete-btn')){
      if(!id) return; if(!confirm('Excluir treinador?')) return; try{ await api.deleteProfessor(id); await carregarTreinadores(); }catch(err){ console.error(err); alert('Erro ao excluir: '+(err.message||err)); }
    }
  });

  async function editar(id){
    try{
      const t = await api.getProfessor(id);
      if(!t) return;
      editId = id;
      nomeInput.value = t.nome || '';
      emailInput.value = t.email || '';
      cpfInput.value = t.cpf || '';
      telInput.value = t.telefone || '';
      if(sexoInput) sexoInput.value = t.sexo || '';
      if(nascInput) nascInput.value = t.data_nascimento ? t.data_nascimento.split('T')[0] : '';
      modSelect.value = t.modalidade_id ? String(t.modalidade_id) : '';
      if (senhaInput) senhaInput.value = t.senha || '';
      document.getElementById('tituloModalTreinador').innerText = 'Editar Treinador';
      modalBg.classList.add('active');
    }catch(err){ console.error('Erro editar',err); }
  }

  function render(){ listaEl.innerHTML = ''; const termo = (buscar && buscar.value) ? buscar.value.trim().toLowerCase() : ''; const modVal = filtroMod ? filtroMod.value : '';
    const filtrados = (treinadores||[]).filter(t => (t.nome||'').toLowerCase().includes(termo) && (modVal===''|| String(t.modalidade_id||'') === String(modVal)));
    const porPagina = 6; let paginaAtual = 1; const totalPaginas = Math.max(1, Math.ceil(filtrados.length/porPagina)); if(paginaAtual>totalPaginas) paginaAtual=totalPaginas; const inicio=(paginaAtual-1)*porPagina; const segmento = filtrados.slice(inicio,inicio+porPagina);
    segmento.forEach(t=>{ const id = t.id || t._id || null; const card = document.createElement('div'); card.className='card'; card.innerHTML = `\n      <button class="edit-btn" data-id="${id}" title="Editar"><i class="fa-solid fa-pen"></i></button>\n      <button class="delete-btn" data-id="${id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>\n      <h3>${escapeHtml(t.nome)}</h3>\n      <span>E-mail: ${escapeHtml(t.email||'')}</span>\n      <span>CPF: ${escapeHtml(t.cpf||'')}</span>\n      <span>Telefone: ${escapeHtml(t.telefone||'')}</span>\n      <span>Modalidade: ${escapeHtml(modalidadesMap[t.modalidade_id] || 'Nenhuma')}</span>\n    `; listaEl.appendChild(card); });


    paginacaoEl.innerHTML=''; for(let p=1;p<=Math.max(1,Math.ceil(filtrados.length/porPagina));p++){ const b=document.createElement('button'); b.textContent=p; if(p===1) b.className='ativo'; b.addEventListener('click', ()=>{ paginaAtual=p; render(); }); paginacaoEl.appendChild(b); }
  }

  if(buscar) buscar.addEventListener('input', ()=> render()); if(filtroMod) filtroMod.addEventListener('change', ()=> render());

  window.addEventListener('modalidades:changed', ()=>{ carregarModalidades(); carregarTreinadores(); });

  (async ()=>{ await carregarModalidades(); await carregarTreinadores(); })();

  window._treinadores = { render, carregarTreinadores };
});
