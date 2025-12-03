// authGuard.js - protege páginas que exigem autenticação
// Use this in pages que require login (alunos, modalidades, treinadores, planos, etc.)

function verificarAutenticacao() {
  const alunoId = localStorage.getItem('alunoId');
  const professorId = localStorage.getItem('professorId');
  const tipo = localStorage.getItem('tipo');

  // Se não há alunoId nem professorId, redirecionar para login
  if (!alunoId && !professorId) {
    // Redirecionar para login
    window.location.href = '/loginFront/login.html';
    return false;
  }

  return true;
}

// Executar ao carregar a página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', verificarAutenticacao);
} else {
  verificarAutenticacao();
}
