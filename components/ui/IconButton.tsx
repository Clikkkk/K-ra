import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors, radii, spacing } from '@/lib/theme/tokens';

type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
};

export function IconButton({
  icon,
  size = 22,
  disabled,
  style,
  ...pressableProps
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={spacing.xs}
      style={(state) => [
        styles.base,
        disabled && styles.disabled,
        state.pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...pressableProps}
    >
      <Ionicons name={icon} color={colors.text} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceRaised,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
