function verificarAutenticacao() {
  const alunoId = localStorage.getItem('alunoId');
  const professorId = localStorage.getItem('professorId');
  const tipo = localStorage.getItem('tipo');

  if (!alunoId && !professorId) {

    window.location.href = '/loginFront/login.html';
    return false;
  }

  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', verificarAutenticacao);
} else {
  verificarAutenticacao();
}
