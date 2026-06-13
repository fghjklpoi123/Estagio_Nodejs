import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// Tela "em construção" para as seções do menu que ainda não foram convertidas
// nesta primeira leva (piloto: Login + Home). Existe só pra a sidebar não ter
// links mortos — quando essas seções forem portadas, este arquivo é substituído
// pela tela real de cada uma.
export default function SectionPlaceholder({ title }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>Esta seção ainda será convertida para React Native.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pageBg,
    padding: 32,
    gap: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
  },
  text: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },
});
