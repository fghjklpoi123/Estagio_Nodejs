import { Drawer } from 'expo-router/drawer';
import SidebarMenu from '../../src/components/SidebarMenu';
import { useTheme } from '../../src/ThemeContext';
import { colors } from '../../src/theme';

const TITLES = {
  home: 'Home',
  alunos: 'Alunos',
  treinadores: 'Treinadores',
  modalidades: 'Modalidades',
  planos: 'Planos (Admin)',
  exercicios: 'Exercícios',
  fichas: 'Fichas de Treino',
  presencas: 'Presenças',
  checkin: 'Check-in',
  'meus-treinos': 'Meus Treinos',
  'meus-planos': 'Meus Planos',
  financeiro: 'Financeiro',
  relatorios: 'Relatórios',
  logs: 'Auditoria',
};

export default function DrawerLayout() {
  const { isDark } = useTheme();

  return (
    <Drawer
      key={isDark ? 'dark' : 'light'}
      drawerContent={() => <SidebarMenu />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.blue700 },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        drawerStyle: { width: 260 },
        sceneStyle: { backgroundColor: colors.pageBg },
      }}
    >
      {Object.entries(TITLES).map(([name, title]) => (
        <Drawer.Screen key={name} name={name} options={{ title }} />
      ))}
    </Drawer>
  );
}
