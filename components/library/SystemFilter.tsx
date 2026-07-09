import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { System } from '@/lib/db/schema';
import { colors, radii, spacing, typography } from '@/lib/theme/tokens';

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
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.text,
    fontWeight: typography.weight.medium,
  },
});
