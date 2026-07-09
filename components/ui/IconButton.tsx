import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors, radii, spacing } from '@/lib/theme/tokens';

type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: SymbolViewProps['name'];
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
      <SymbolView name={icon} tintColor={colors.text} size={size} />
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
