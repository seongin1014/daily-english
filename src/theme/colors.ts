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

  // Semantic
  success: '#16a34a',
  successContainer: '#f0fdf4',
  onSuccess: '#ffffff',
  warning: '#F59E0B',
  warningContainer: '#fffbeb',
} as const;

export const darkColors: Record<string, string> = {
  // Primary (adjusted for dark — indigo accent)
  primary: '#8F7BE8',
  primaryContainer: '#2A2460',
  primaryFixed: '#2A2460',
  primaryFixedDim: '#6B5DC2',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#C4B8F0',
  onPrimaryFixed: '#E0D8F8',
  onPrimaryFixedVariant: '#8F7BE8',

  // Secondary (warm coral, brightened for dark)
  secondary: '#F7543E',
  secondaryContainer: '#3D1A12',
  secondaryFixed: '#3D1A12',
  secondaryFixedDim: '#D94A36',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#FFB59F',
  onSecondaryFixed: '#FFB59F',
  onSecondaryFixedVariant: '#F7543E',

  // Tertiary
  tertiary: '#8D9AA1',
  tertiaryContainer: '#1E2A30',
  tertiaryFixed: '#1E2A30',
  tertiaryFixedDim: '#6B7980',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#BBC8D0',
  onTertiaryFixed: '#BBC8D0',
  onTertiaryFixedVariant: '#8D9AA1',

  // Surface (deep navy palette from reference)
  surface: '#0A0E1E',
  surfaceBright: '#1F1E2C',
  surfaceContainer: '#141829',
  surfaceContainerHigh: '#1F1E2C',
  surfaceContainerHighest: '#282838',
  surfaceContainerLow: '#101424',
  surfaceContainerLowest: '#060A16',
  surfaceDim: '#0A0E1E',
  surfaceTint: '#8F7BE8',
  surfaceVariant: '#282838',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#B0B0B0',

  // Outline
  outline: '#3A3A4A',
  outlineVariant: '#2A2A3A',

  // Error
  error: '#FF6B6B',
  errorContainer: '#3D1A1A',
  onError: '#FFFFFF',
  onErrorContainer: '#FFB4B4',

  // Inverse
  inverseSurface: '#E8E8E8',
  inverseOnSurface: '#1A1A2E',
  inversePrimary: '#121858',

  // Background
  background: '#0A0E1E',
  onBackground: '#E8E8E8',

  // Semantic
  success: '#4ADE80',
  successContainer: '#1A3D2A',
  onSuccess: '#FFFFFF',
  warning: '#FBBF24',
  warningContainer: '#3D2E0A',
};

export type ColorTokens = typeof colors;
