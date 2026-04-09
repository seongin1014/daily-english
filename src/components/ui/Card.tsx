import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { borderRadius } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'surface' | 'surfaceLow' | 'primary';
}

export function Card({ children, style, variant = 'surface' }: CardProps) {
  const { colors } = useTheme();
  const bgColor = variant === 'primary' ? colors.primary
    : variant === 'surfaceLow' ? colors.surfaceContainerLow
    : colors.surfaceContainerLowest;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: 24,
  },
});
