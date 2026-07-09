import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { GameCover } from '@/components/ui/GameCover';
import { LoadingState } from '@/components/ui/LoadingState';
import { SYSTEM_LABEL } from '@/lib/db/schema';
import { getHomebrewCatalog } from '@/lib/homebrew/cache';
import type { HomebrewGame } from '@/lib/homebrew/catalog';
import { colors, radii, spacing, typography } from '@/lib/theme/tokens';

export default function HomebrewScreen() {
  const [games, setGames] = useState<HomebrewGame[] | null>(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      getHomebrewCatalog().then(setGames);
    }, [])
  );

  if (games === null) {
    return <LoadingState />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <FlatList
        data={games}
        keyExtractor={(game) => game.id}
        numColumns={3}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing.xl }]}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable style={styles.gameItem} onPress={() => router.push(`/homebrew/${item.id}`)}>
            <View style={styles.coverWrapper}>
              <GameCover title={item.title} coverUri={item.coverUrl} system={item.system} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{SYSTEM_LABEL[item.system]}</Text>
              </View>
            </View>
            <Text style={styles.gameTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  gameItem: {
    flex: 1 / 3,
  },
  coverWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  badgeText: {
    color: colors.text,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  gameTitle: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
});
