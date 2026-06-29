export const lightColors = {
  blue600: '#0f4fa8',
  blue700: '#0b3b7e',
  muted: '#6d7b8c',
  cardBg: '#ffffff',
  pageBg: '#f3f6fb',
  textDark: '#1e2a3b',
  textBrand: '#233142',
  inputBorder: '#e0e6ef',
  inputBg: '#ffffff',
  sidebarText: '#dce7ff',
  sidebarTextActive: '#ffffff',
  link: '#4A90E2',
  linkHover: '#2f6ebb',
  erroBg: '#f8d7da',
  erroTexto: '#721c24',
  erroBorda: '#f5c6cb',
  sucessoBg: '#d4edda',
  sucessoTexto: '#155724',
  sucessoBorda: '#c3e6cb',
  deleteBtn: '#d9534f',
  btnSecondaryBg: '#e9ecef',
  btnSecondaryTexto: '#333333',
  planoPreco: '#2ecc71',
  assinarBtn: '#3498db',
  infoBg: '#d1ecf1',
  infoTexto: '#0c5460',
};

export const darkColors = {
  blue600: '#3b82f6',
  blue700: '#2563eb',
  muted: '#9ca3af',
  cardBg: '#1e293b',
  pageBg: '#0f172a',
  textDark: '#f1f5f9',
  textBrand: '#e2e8f0',
  inputBorder: '#334155',
  inputBg: '#1e293b',
  sidebarText: '#94a3b8',
  sidebarTextActive: '#ffffff',
  link: '#60a5fa',
  linkHover: '#93bbfc',
  erroBg: '#450a0a',
  erroTexto: '#fca5a5',
  erroBorda: '#7f1d1d',
  sucessoBg: '#052e16',
  sucessoTexto: '#86efac',
  sucessoBorda: '#14532d',
  deleteBtn: '#ef4444',
  btnSecondaryBg: '#334155',
  btnSecondaryTexto: '#e2e8f0',
  planoPreco: '#34d399',
  assinarBtn: '#3b82f6',
  infoBg: '#083344',
  infoTexto: '#67e8f9',
};

// Mantém compatibilidade — `colors` é o tema claro por padrão.
// O ThemeProvider sobrescreve isso em runtime.
export let colors = { ...lightColors };

export function setColors(newColors) {
  Object.assign(colors, newColors);
}

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
};
