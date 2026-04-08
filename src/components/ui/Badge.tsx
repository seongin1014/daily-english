import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type BadgeVariant = 'ready' | 'processing' | 'error' | 'archived' | 'beginner' | 'intermediate' | 'advanced';

const variantStyles: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  ready: { bg: colors.secondaryFixed, text: colors.onSecondaryFixedVariant, label: '완료' },
  processing: { bg: colors.surfaceContainerHighest, text: colors.onSurfaceVariant, label: '처리중' },
  error: { bg: colors.errorContainer, text: colors.onErrorContainer, label: '오류' },
  archived: { bg: colors.surfaceContainerHighest, text: colors.onSurfaceVariant, label: 'ARCHIVED' },
  beginner: { bg: '#e8f5e9', text: '#2e7d32', label: 'BEGINNER' },
  intermediate: { bg: colors.secondaryFixed, text: colors.secondary, label: 'INTERMEDIATE' },
  advanced: { bg: colors.primaryFixed, text: colors.primary, label: 'ADVANCED' },
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export function Badge({ variant, label }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label ?? v.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  text: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
