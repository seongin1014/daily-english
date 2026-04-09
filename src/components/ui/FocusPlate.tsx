import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { borderRadius, ambientShadow } from '../../theme/spacing';

interface FocusPlateProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
}

export function FocusPlate({ children, style, accentColor }: FocusPlateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainerLowest }, style]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor ?? colors.primaryContainer }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    ...ambientShadow,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
});
