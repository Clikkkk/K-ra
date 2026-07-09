import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeContext';
import { radii, spacing, typography } from '@/lib/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Button({
  label,
  variant = 'primary',
  icon,
  disabled,
  style,
  ...pressableProps
}: ButtonProps) {
  const { colors } = useTheme();
  const iconColor = variant === 'primary' ? '#15140F' : colors.text;

  const dynamicVariantStyles = {
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
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        dynamicVariantStyles[variant],
        disabled && styles.disabled,
        state.pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...pressableProps}
    >
      <View style={styles.content}>
        {icon && <Ionicons name={icon} size={18} color={iconColor} style={styles.icon} />}
        <Text
          style={[
            styles.label,
            { color: colors.text },
            variant === 'primary' && styles.labelOnAccent,
          ]}
        >
          {label}
        </Text>
      </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    marginRight: -2,
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
  },
  labelOnAccent: {
    color: '#15140F',
    fontWeight: 'bold',
  },
});
