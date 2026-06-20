// theme.js
// Controla o tema claro/escuro do sistema inteiro.
// A preferência do usuário é salva no localStorage e aplicada em todas as páginas.

(function () {
  const STORAGE_KEY = "acadflow-theme";

  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY); // "dark" | "light" | null
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    updateToggleIcon(theme);
  }

  function updateToggleIcon(theme) {
    const icon = document.querySelector("[data-theme-toggle] i");
    const label = document.querySelector("[data-theme-toggle] span");
    if (icon) {
      icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }
    if (label) {
      label.textContent = theme === "dark" ? "Modo claro" : "Modo escuro";
    }
  }

  function toggleTheme() {
    const current = getSavedTheme() === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  // Aplica o tema o quanto antes (antes mesmo do body renderizar)
  // para evitar o "flash" de tela clara antes de escurecer.
  applyTheme(getSavedTheme());

  // Quando o DOM estiver pronto, conecta o botão de alternância (se existir na página)
  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getSavedTheme());
    const toggleBtn = document.querySelector("[data-theme-toggle]");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", toggleTheme);
    }
  });

  // Expõe globalmente, caso algum HTML queira chamar manualmente
  window.toggleTheme = toggleTheme;
})();
