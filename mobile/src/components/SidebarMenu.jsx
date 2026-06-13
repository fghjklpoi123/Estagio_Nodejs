import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

// Equivalente mobile da <aside class="sidebar"> de front/homeFront/home.html + home.css:
// mesmo gradiente azul (180deg, #0b3b7e -> #0f4fa8), logo, lista de menu com ícones
// Font Awesome (mesmos nomes do fa-solid original) e "Sair" fixado embaixo.
const MENU_ITEMS = [
  { route: '/home', label: 'Home', icon: 'house' },
  { route: '/alunos', label: 'Alunos', icon: 'user' },
  { route: '/treinadores', label: 'Treinadores', icon: 'user-tie' },
  { route: '/modalidades', label: 'Modalidades', icon: 'dumbbell' },
  { route: '/planos', label: 'Planos (Admin)', icon: 'list' },
  { route: '/meus-planos', label: 'Meus Planos', icon: 'ticket' },
  { route: '/relatorios', label: 'Relatórios', icon: 'file' },
];

export default function SidebarMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

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

        {MENU_ITEMS.map((item) => {
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
