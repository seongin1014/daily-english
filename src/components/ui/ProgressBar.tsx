import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { borderRadius } from '../../theme/spacing';

interface ProgressBarProps {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color,
  trackColor,
  height = 8,
  style,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const fillColor = color ?? colors.secondary;
  const bgColor = trackColor ?? `${colors.outlineVariant}4D`;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { backgroundColor: bgColor, height }, style]}>
      <View
        style={[styles.fill, { backgroundColor: fillColor, width: `${clampedProgress * 100}%`, height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
