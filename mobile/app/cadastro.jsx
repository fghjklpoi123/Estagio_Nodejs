import { Stack } from 'expo-router';
import SectionPlaceholder from '../src/components/SectionPlaceholder';

// front/cadastro/cadastro.html ainda não entrou nesta primeira leva (piloto:
// Login + Home) — fica como placeholder pra o link "Criar conta" do Login não
// virar um link morto.
export default function CadastroScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Criar conta' }} />
      <SectionPlaceholder title="Criar conta" />
    </>
  );
}
