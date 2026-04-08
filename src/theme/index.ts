import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, darkColors, type ColorTokens } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, ambientShadow, elevatedShadow } from './spacing';

type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  colors: ColorTokens;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadow: typeof ambientShadow;
  elevatedShadow: typeof elevatedShadow;
  isDark: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const theme = useMemo<Theme>(() => ({
    colors: isDark ? { ...colors, ...darkColors } as unknown as ColorTokens : colors,
    typography,
    spacing,
    borderRadius,
    shadow: ambientShadow,
    elevatedShadow,
    isDark,
  }), [isDark]);

  const value = useMemo(() => ({
    theme,
    themeMode,
    setThemeMode,
  }), [theme, themeMode]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return { themeMode: ctx.themeMode, setThemeMode: ctx.setThemeMode };
}

export { colors, darkColors, typography, spacing, borderRadius, ambientShadow, elevatedShadow };
