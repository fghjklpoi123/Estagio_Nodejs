import { Drawer } from 'expo-router/drawer';
import SidebarMenu from '../../src/components/SidebarMenu';
import { colors } from '../../src/theme';

// Equivalente mobile da <aside class="sidebar"> fixa do home.html: no celular
// uma sidebar fixa de 260px não cabe, então vira um Drawer (menu deslizante,
// aberto pelo botão "hambúrguer" no cabeçalho). O conteúdo do menu (gradiente,
// logo, ícones, item ativo, "Sair") é todo desenhado em <SidebarMenu />, que
// substitui o drawer padrão — por isso as telas abaixo só precisam do título
// do cabeçalho.
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
  return (
    <Drawer
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
