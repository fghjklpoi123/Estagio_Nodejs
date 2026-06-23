import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, setOnUnauthorized } from './api';

const STORAGE_KEYS = ['alunoId', 'alunoNome', 'professorId', 'professorNome', 'adminId', 'adminNome', 'tipo', 'token'];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    AsyncStorage.multiGet(STORAGE_KEYS).then((pares) => {
      const dados = Object.fromEntries(pares);

      if (dados.token) {
        setAuthToken(dados.token);
      }

      if (dados.alunoId || dados.professorId || dados.adminId) {
        setSession({
          tipo: dados.tipo,
          id: dados.alunoId || dados.professorId || dados.adminId,
          nome: dados.alunoNome || dados.professorNome || dados.adminNome,
        });
      } else {
        setSession(false);
      }
    });
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      AsyncStorage.multiRemove(STORAGE_KEYS);
      setAuthToken(null);
      setSession(false);
    });
  }, []);

  const login = useCallback(async ({ tipo, id, nome, token }) => {
    setAuthToken(token);

    const pairs = [['tipo', tipo], ['token', token]];
    if (tipo === 'aluno') {
      pairs.push(['alunoId', String(id)], ['alunoNome', nome]);
    } else if (tipo === 'professor') {
      pairs.push(['professorId', String(id)], ['professorNome', nome]);
    } else {
      pairs.push(['adminId', String(id)], ['adminNome', nome]);
    }

    await AsyncStorage.multiSet(pairs);
    setSession({ tipo, id: String(id), nome });
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
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
