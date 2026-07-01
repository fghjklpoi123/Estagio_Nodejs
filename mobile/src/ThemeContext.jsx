import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, setColors } from './theme';

const STORAGE_KEY = 'acadflow-theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      const dark = val === 'dark';
      setIsDark(dark);
      setColors(dark ? darkColors : lightColors);
      setPronto(true);
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    const novoDark = !isDark;
    setIsDark(novoDark);
    setColors(novoDark ? darkColors : lightColors);
    await AsyncStorage.setItem(STORAGE_KEY, novoDark ? 'dark' : 'light');
  }, [isDark]);

  if (!pronto) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme precisa ser usado dentro de <ThemeProvider>');
  return ctx;
}
