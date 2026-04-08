import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'surface' | 'surfaceLow' | 'primary';
}

// No-Line Rule: no borders, boundaries via background color shifts only
export function Card({ children, style, variant = 'surface' }: CardProps) {
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
    // No borderWidth — enforces No-Line Rule from DESIGN.md
  },
});
