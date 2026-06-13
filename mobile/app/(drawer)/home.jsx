import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../src/theme';

// Recriação de front/homeFront/home.html + home.css (parte ".content").
// A fileira de 3 stat-cards lado a lado fazia sentido numa tela larga; em
// formato de celular, empilhamos verticalmente pra cada card ficar legível.
// Os <h3> de estatística já vinham vazios no HTML original (home.js não
// preenchia nada — só tinha um console.log), então mantemos o mesmo estado.
const STATS = [
  { label: 'Alunos cadastrados' },
  { label: 'Treinadores' },
  { label: 'Modalidades' },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Bem-vindo!</Text>
      <Text style={styles.subtext}>Você foi logado com sucesso no sistema.</Text>

      <View style={styles.mainCard}>
        <Image source={require('../../assets/images/logo.png')} style={styles.mainCardLogo} resizeMode="contain" />
        <Text style={styles.mainCardTitle}>Acad Flow</Text>
      </View>

      <View style={styles.stats}>
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statNumber}> </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    padding: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 6,
  },
  subtext: {
    color: colors.muted,
    fontSize: 16,
    marginBottom: 24,
  },
  mainCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  mainCardLogo: {
    width: 110,
    height: 110,
    opacity: 0.95,
    marginBottom: 16,
  },
  mainCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
  },
  stats: {
    gap: 16,
  },
  statCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radius.lg,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textDark,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2,
  },
});
