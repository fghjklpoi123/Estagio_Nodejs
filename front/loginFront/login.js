// login.js - autentica aluno ou professor contra o backend
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('username');
  const senhaInput = document.getElementById('password');
  const mensagem = document.getElementById('mensagem') || null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();

    if (!email || !senha) {
      mostrarMensagem('Email e senha são obrigatórios', 'erro');
      return;
    }

    try {
      // Tentar login como aluno primeiro
      const respAluno = await fetch('/api/login/aluno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (respAluno.ok) {
        const dataAluno = await respAluno.json();
        // Login bem-sucedido como aluno
        localStorage.setItem('alunoId', dataAluno.aluno.id);
        localStorage.setItem('alunoNome', dataAluno.aluno.nome);
        localStorage.setItem('tipo', 'aluno');
        mostrarMensagem('✓ Login bem-sucedido!', 'sucesso');
        setTimeout(() => {
          window.location.href = '/homeFront/home.html';
        }, 1500);
        return;
      }

      // Se falhar como aluno, tentar como professor
      const respProfessor = await fetch('/api/login/professor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (respProfessor.ok) {
        const dataProfessor = await respProfessor.json();
        // Login bem-sucedido como professor
        localStorage.setItem('professorId', dataProfessor.professor.id);
        localStorage.setItem('professorNome', dataProfessor.professor.nome);
        localStorage.setItem('tipo', 'professor');
        mostrarMensagem('✓ Login bem-sucedido!', 'sucesso');
        setTimeout(() => {
          window.location.href = '/homeFront/home.html';
        }, 1500);
        return;
      }

      // Ambas as requisições falharam
      const erro = await respAluno.json();
      mostrarMensagem(erro.erro || 'Email ou senha inválidos', 'erro');

    } catch (err) {
      console.error('Erro ao fazer login:', err);
      mostrarMensagem('Erro ao conectar com o servidor', 'erro');
    }
  });

  function mostrarMensagem(msg, tipo) {
    if (mensagem) {
      mensagem.textContent = msg;
      mensagem.className = `mensagem ${tipo}`;
      mensagem.style.display = 'block';
    } else {
      alert(msg);
    }
  }
});
