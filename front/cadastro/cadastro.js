document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cadastroForm');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const cpfInput = document.getElementById('cpf');
  const senhaInput = document.getElementById('senha');
  const confirmaSenhaInput = document.getElementById('confirmaSenha');
  const telefoneInput = document.getElementById('telefone');
  const dataNascimentoInput = document.getElementById('dataNascimento');
  const sexoInput = document.getElementById('sexo');
  const enderecoInput = document.getElementById('endereco');
  const mensagemEl = document.getElementById('mensagem');

  console.log('DOM carregado. Formulário encontrado:', !!form);

  if (!form) {
    console.error('ERRO: Formulário com id="cadastroForm" não encontrado!');
    return;
  }

  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function marcarErro(el, temErro) {
    if (!el) return;
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (temErro) {
      el.classList.add('erro');
      if (label) label.classList.add('erro');
    } else {
      el.classList.remove('erro');
      if (label) label.classList.remove('erro');
    }
  }

  function showMensagem(tipo, texto) {
    mensagemEl.className = `mensagem ${tipo}`;
    mensagemEl.textContent = texto;
    mensagemEl.style.display = 'block';
    if (tipo === 'sucesso') {
      setTimeout(() => {
        window.location.href = '/loginFront/login.html';
      }, 2000);
    }
  }

  cpfInput && cpfInput.addEventListener('input', () => {
    let v = cpfInput.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 3) cpfInput.value = v;
    else if (v.length <= 6) cpfInput.value = `${v.slice(0, 3)}.${v.slice(3)}`;
    else if (v.length <= 9) cpfInput.value = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    else cpfInput.value = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  });

  telefoneInput && telefoneInput.addEventListener('input', () => {
    let v = telefoneInput.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 2) telefoneInput.value = v;
    else if (v.length <= 7) telefoneInput.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else telefoneInput.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  });

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

  function validarFormulario() {
    let temErro = false;

    if (!nomeInput.value.trim()) {
      marcarErro(nomeInput, true);
      temErro = true;
    } else {
      marcarErro(nomeInput, false);
    }

    if (!emailInput.value.trim()) {
      marcarErro(emailInput, true);
      temErro = true;
    } else {
      marcarErro(emailInput, false);
    }

    const cpf = cpfInput.value.trim();
    if (!cpf) {
      marcarErro(cpfInput, true);
      temErro = true;
    } else if (!validarCPF(cpf)) {
      marcarErro(cpfInput, true);
      temErro = true;
    } else {
      marcarErro(cpfInput, false);
    }

    if (!senhaInput.value || senhaInput.value.length < 6) {
      marcarErro(senhaInput, true);
      temErro = true;
    } else {
      marcarErro(senhaInput, false);
    }

    if (senhaInput.value !== confirmaSenhaInput.value) {
      marcarErro(confirmaSenhaInput, true);
      temErro = true;
    } else {
      marcarErro(confirmaSenhaInput, false);
    }

    if (!dataNascimentoInput.value) {
      marcarErro(dataNascimentoInput, true);
      temErro = true;
    } else {
      marcarErro(dataNascimentoInput, false);
    }

    if (!sexoInput.value) {
      marcarErro(sexoInput, true);
      temErro = true;
    } else {
      marcarErro(sexoInput, false);
    }

    return !temErro;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulário enviado!');

    if (!validarFormulario()) {
      showMensagem('erro', 'Por favor, corrija os erros no formulário.');
      return;
    }

    const cpfClean = cpfInput.value.replace(/\D/g, '');
    const telefoneClean = telefoneInput.value.replace(/\D/g, '');

    const dados = {
      name: nomeInput.value.trim(),
      email: emailInput.value.trim(),
      cpf: cpfClean,
      senha: senhaInput.value,
      telefone: telefoneClean,
      data_nascimento: dataNascimentoInput.value,
      sexo: sexoInput.value,
      endereco: enderecoInput.value.trim(),
      situacao: 'Ativo',
      obs: ''
    };

    console.log('Dados a enviar:', dados);

    try {
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Criando conta...';

      const res = await fetch('/api/alunos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });

      console.log('Resposta status:', res.status);
      const resultado = await res.json();
      console.log('Resultado:', resultado);

      if (!res.ok) {
        throw new Error(resultado.message || resultado.error || `Erro HTTP ${res.status}`);
      }

      if (resultado && resultado.id) {
        showMensagem('sucesso', '✓ Conta criada com sucesso! Redirecionando para login...');
      } else {
        showMensagem('erro', 'Erro ao criar conta. Tente novamente.');
        button.disabled = false;
        button.textContent = 'Criar Conta';
      }
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      const mensagem = err.message || 'Erro ao criar conta';
      showMensagem('erro', `Erro: ${mensagem}`);
      const button = form.querySelector('button[type="submit"]');
      button.disabled = false;
      button.textContent = 'Criar Conta';
    }
  });

  console.log('Event listener de submit registrado com sucesso');
});
