import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { GameCover } from '@/components/ui/GameCover';
import { getRecentlyPlayedGames } from '@/lib/db/games';
import type { Game } from '@/lib/db/schema';
import { useTheme } from '@/lib/theme/ThemeContext';
import { radii, spacing, typography } from '@/lib/theme/tokens';

const MAX_ITEMS = 6;
const COVER_WIDTH = 96;

function formatPlaytimeValue(seconds: number): string {
  if (seconds < 60) return '0 min';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs} h`;
}

export function ContinuePlaying() {
  const [games, setGames] = useState<Game[]>([]);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      getRecentlyPlayedGames(MAX_ITEMS).then(setGames);
    }, [])
  );

  if (games.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Continuar jugando</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {games.map((game) => (
          <Pressable
            key={game.id}
            style={styles.item}
            onPress={() => router.push(`/game/${game.id}`)}
          >
            <View style={styles.coverWrapper}>
              <GameCover title={game.title} coverUri={game.cover_uri} system={game.system} />
              <View style={styles.systemBadge}>
                <Text style={[styles.systemBadgeText, { color: colors.accent }]}>
                  {game.system.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
              {game.title}
            </Text>
            <Text style={[styles.itemPlaytime, { color: colors.textMuted }]} numberOfLines={1}>
              {formatPlaytimeValue(game.playtime)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#A39E94',
    paddingHorizontal: spacing.md,
  },
  row: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  item: {
    width: COVER_WIDTH,
  },
  coverWrapper: {
    position: 'relative',
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  systemBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(21, 20, 15, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.sm - 4,
    borderWidth: 0.5,
    borderColor: 'rgba(244, 242, 238, 0.15)',
  },
  systemBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  itemTitle: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    textAlign: 'center',
    fontWeight: '500',
  },
  itemPlaytime: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
});
