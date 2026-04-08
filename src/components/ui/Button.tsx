import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', style, icon, disabled }: ButtonProps) {
  const bgColor = variant === 'primary' ? colors.secondary
    : variant === 'secondary' ? colors.primaryFixed
    : 'transparent';
  const textColor = variant === 'primary' ? colors.onSecondary
    : variant === 'secondary' ? colors.onPrimaryFixed
    : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor, opacity: disabled ? 0.5 : 1 }, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {icon}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  text: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
});
