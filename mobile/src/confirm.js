import { Alert, Platform } from 'react-native';

export function confirm(titulo, mensagem, botoes) {
  if (Platform.OS === 'web') {
    const resultado = window.confirm(`${titulo}\n\n${mensagem}`);
    if (resultado) {
      const botaoConfirmar = botoes?.find((b) => b.style !== 'cancel') || botoes?.[botoes.length - 1];
      botaoConfirmar?.onPress?.();
    }
  } else {
    Alert.alert(titulo, mensagem, botoes);
  }
}
