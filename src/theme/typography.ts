import { Platform } from 'react-native';

export const fontFamilies = {
  headline: Platform.select({ ios: 'Manrope', android: 'Manrope' }) ?? 'Manrope',
  headlineBold: Platform.select({ ios: 'Manrope-Bold', android: 'Manrope-Bold' }) ?? 'Manrope-Bold',
  headlineExtraBold: Platform.select({ ios: 'Manrope-ExtraBold', android: 'Manrope-ExtraBold' }) ?? 'Manrope-ExtraBold',
  body: Platform.select({ ios: 'Inter', android: 'Inter' }) ?? 'Inter',
  bodyMedium: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }) ?? 'Inter-Medium',
  bodySemiBold: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }) ?? 'Inter-SemiBold',
  label: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }) ?? 'Inter-Medium',
};

export const typography = {
  displayLg: {
    fontFamily: fontFamilies.headlineExtraBold,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.96, // -2%
  },
  headlineLg: {
    fontFamily: fontFamilies.headlineExtraBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  headlineMd: {
    fontFamily: fontFamilies.headlineBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.48,
  },
  headlineSm: {
    fontFamily: fontFamilies.headlineBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  titleLg: {
    fontFamily: fontFamilies.headlineBold,
    fontSize: 18,
    lineHeight: 26,
  },
  bodyLg: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 25.6, // 1.6 for Korean
  },
  bodyMd: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 22.4,
  },
  bodySm: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 19.2,
  },
  labelLg: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.7, // +5%
    textTransform: 'uppercase' as const,
  },
  labelMd: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.55,
    textTransform: 'uppercase' as const,
  },
  labelSm: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;
