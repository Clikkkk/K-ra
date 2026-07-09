import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
};

export function Button({
  label,
  variant = 'primary',
  disabled,
  style,
  ...pressableProps
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        variantStyles[variant],
        disabled && styles.disabled,
        state.pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...pressableProps}
    >
      <Text style={[styles.label, variant === 'primary' && styles.labelOnAccent]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  labelOnAccent: {
    color: colors.text,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});
