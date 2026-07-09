import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { System } from '@/lib/db/schema';
import { useTheme } from '@/lib/theme/ThemeContext';
import { radii, spacing, typography } from '@/lib/theme/tokens';

type SystemFilterValue = System | 'all';

type SystemFilterProps = {
  value: SystemFilterValue;
  onChange: (value: SystemFilterValue) => void;
};

const OPTIONS: { value: SystemFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'nes', label: 'NES' },
  { value: 'snes', label: 'SNES' },
  { value: 'gba', label: 'GBA' },
];

export function SystemFilter({ value, onChange }: SystemFilterProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              active && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: colors.textMuted },
                active && [styles.labelActive, { color: colors.text }],
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  label: {
    fontSize: typography.size.sm,
  },
  labelActive: {
    fontWeight: typography.weight.medium,
  },
});
