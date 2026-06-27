import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

const MENU_ITEMS = [
  { route: '/home',        label: 'Home',           icon: 'house',     papel: null },
  { route: '/alunos',      label: 'Alunos',         icon: 'user',      papel: ['professor', 'admin'] },
  { route: '/treinadores', label: 'Treinadores',    icon: 'user-tie',  papel: ['admin'] },
  { route: '/modalidades', label: 'Modalidades',    icon: 'dumbbell',  papel: ['admin'] },
  { route: '/exercicios',  label: 'Exercícios',     icon: 'dumbbell',  papel: ['professor', 'admin'] },
  { route: '/fichas',      label: 'Fichas de Treino',icon: 'clipboard', papel: ['professor', 'admin'] },
  { route: '/presencas',   label: 'Presenças',       icon: 'calendar-check',papel: ['professor', 'admin'] },
  { route: '/planos',      label: 'Planos (Admin)', icon: 'list',      papel: ['admin'] },
  { route: '/checkin',     label: 'Check-in',         icon: 'calendar-check',papel: ['aluno'] },
  { route: '/meus-treinos',label: 'Meus Treinos',    icon: 'clipboard', papel: ['aluno'] },
  { route: '/meus-planos', label: 'Meus Planos',    icon: 'ticket',    papel: ['aluno'] },
  { route: '/financeiro',  label: 'Financeiro',      icon: 'wallet',    papel: ['admin'] },
  { route: '/relatorios',  label: 'Relatórios',     icon: 'file',      papel: ['admin'] },
  { route: '/logs',        label: 'Auditoria',      icon: 'shield-checkmark', papel: ['admin'] },
];

export default function SidebarMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { session, logout } = useAuth();

  const tipo = session?.tipo;
  const itensVisiveis = MENU_ITEMS.filter((item) => item.papel === null || (Array.isArray(item.papel) && item.papel.includes(tipo)));

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <LinearGradient
      colors={[colors.blue700, colors.blue600]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.sidebar}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.logoRow}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logoImg} />
          <Text style={styles.logoText}>Nome da Empresa</Text>
        </View>

        {itensVisiveis.map((item) => {
          const ativo = pathname === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route)}
              style={({ pressed }) => [
                styles.menuItem,
                ativo && styles.menuItemAtivo,
                pressed && !ativo && styles.menuItemPressionado,
              ]}
            >
              <FontAwesome6 name={item.icon} size={18} color={ativo ? colors.sidebarTextActive : colors.sidebarText} />
              <Text style={[styles.menuLabel, ativo && styles.menuLabelAtivo]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.menuBottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressionado]}
        >
          <FontAwesome6 name="right-from-bracket" size={18} color={colors.sidebarText} />
          <Text style={styles.menuLabel}>Sair</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  logoImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoText: {
    color: '#e8f1ff',
    fontWeight: '700',
    fontSize: 16,
    flexShrink: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 6,
  },
  menuItemPressionado: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  menuItemAtivo: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  menuLabel: {
    color: colors.sidebarText,
    fontSize: 15,
  },
  menuLabelAtivo: {
    color: colors.sidebarTextActive,
    fontWeight: '700',
  },
  menuBottom: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
});
