export const colors = {
  // Primary
  primary: '#121858',
  primaryContainer: '#1a237e',
  primaryFixed: '#e0e0ff',
  primaryFixedDim: '#bdc2ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#8690ee',
  onPrimaryFixed: '#000767',
  onPrimaryFixedVariant: '#343d96',

  // Secondary
  secondary: '#ac3509',
  secondaryContainer: '#fe6f42',
  secondaryFixed: '#ffdbd0',
  secondaryFixedDim: '#ffb59f',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#631800',
  onSecondaryFixed: '#3a0a00',
  onSecondaryFixedVariant: '#852300',

  // Tertiary
  tertiary: '#111d23',
  tertiaryContainer: '#263238',
  tertiaryFixed: '#d7e4ec',
  tertiaryFixedDim: '#bbc8d0',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#8d9aa1',
  onTertiaryFixed: '#111d23',
  onTertiaryFixedVariant: '#3c494f',

  // Surface
  surface: '#f9f9f9',
  surfaceBright: '#f9f9f9',
  surfaceContainer: '#eeeeee',
  surfaceContainerHigh: '#e8e8e8',
  surfaceContainerHighest: '#e2e2e2',
  surfaceContainerLow: '#f3f3f3',
  surfaceContainerLowest: '#ffffff',
  surfaceDim: '#dadada',
  surfaceTint: '#4c56af',
  surfaceVariant: '#e2e2e2',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#454652',

  // Outline
  outline: '#767683',
  outlineVariant: '#c6c5d4',

  // Error
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  // Inverse
  inverseSurface: '#2f3131',
  inverseOnSurface: '#f1f1f1',
  inversePrimary: '#bdc2ff',

  // Background
  background: '#f9f9f9',
  onBackground: '#1a1c1c',
} as const;

export const darkColors: Record<string, string> = {
  surface: '#121212',
  surfaceContainer: '#1e1e1e',
  surfaceContainerLow: '#1a1a1a',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerHigh: '#2a2a2a',
  onSurface: '#f1f1f1',
  onSurfaceVariant: '#c6c5d4',
  background: '#121212',
  onBackground: '#f1f1f1',
};

export type ColorTokens = typeof colors;
