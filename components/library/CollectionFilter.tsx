import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { Collection } from '@/lib/db/schema';
import { useTheme } from '@/lib/theme/ThemeContext';
import { radii, spacing, typography } from '@/lib/theme/tokens';

type CollectionFilterProps = {
  collections: Collection[];
  value: string;
  onChange: (value: string) => void;
  onCreatePress: () => void;
};

export function CollectionFilter({
  collections,
  value,
  onChange,
  onCreatePress,
}: CollectionFilterProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Pressable
        onPress={() => onChange('all')}
        style={[
          styles.chip,
          { backgroundColor: colors.surface, borderColor: colors.border },
          value === 'all' && { backgroundColor: colors.accent, borderColor: colors.accent },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: colors.textMuted },
            value === 'all' && [styles.labelActive, { color: colors.text }],
          ]}
        >
          Todos
        </Text>
      </Pressable>

      {collections.map((collection) => {
        const active = collection.id === value;
        return (
          <Pressable
            key={collection.id}
            onPress={() => onChange(collection.id)}
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
              {collection.name}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onCreatePress}
        style={[styles.createChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="add" size={16} color={colors.textMuted} />
      </Pressable>
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
  createChip: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
