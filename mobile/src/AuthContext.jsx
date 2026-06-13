import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Equivalente ao front/js/authGuard.js + às chaves de localStorage usadas em
// login.js e logout.html ('alunoId', 'alunoNome', 'professorId', 'professorNome', 'tipo'),
// só que usando AsyncStorage — o React Native não tem localStorage do navegador.
const STORAGE_KEYS = ['alunoId', 'alunoNome', 'professorId', 'professorNome', 'tipo'];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null = ainda carregando do AsyncStorage; false = sem sessão; objeto = logado
  const [session, setSession] = useState(null);

  useEffect(() => {
    AsyncStorage.multiGet(STORAGE_KEYS).then((pares) => {
      const dados = Object.fromEntries(pares);
      if (dados.alunoId || dados.professorId) {
        setSession({
          tipo: dados.tipo,
          id: dados.alunoId || dados.professorId,
          nome: dados.alunoNome || dados.professorNome,
        });
      } else {
        setSession(false);
      }
    });
  }, []);

  const login = useCallback(async ({ tipo, id, nome }) => {
    if (tipo === 'aluno') {
      await AsyncStorage.multiSet([
        ['alunoId', String(id)],
        ['alunoNome', nome],
        ['tipo', 'aluno'],
      ]);
    } else {
      await AsyncStorage.multiSet([
        ['professorId', String(id)],
        ['professorNome', nome],
        ['tipo', 'professor'],
      ]);
    }
    setSession({ tipo, id: String(id), nome });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(STORAGE_KEYS);
    setSession(false);
  }, []);

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}
