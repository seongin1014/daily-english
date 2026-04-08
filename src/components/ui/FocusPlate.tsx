import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, ambientShadow } from '../../theme/spacing';

interface FocusPlateProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
}

export function FocusPlate({ children, style, accentColor = colors.primaryContainer }: FocusPlateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLowest,
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
