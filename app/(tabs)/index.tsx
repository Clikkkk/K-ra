import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContinuePlaying } from '@/components/home/ContinuePlaying';
import { SearchBar } from '@/components/library/SearchBar';
import { Text, View } from '@/components/Themed';
import { GameCover } from '@/components/ui/GameCover';
import { LoadingState } from '@/components/ui/LoadingState';
import { getAllGames } from '@/lib/db/games';
import type { Game } from '@/lib/db/schema';
import { useTheme } from '@/lib/theme/ThemeContext';
import { spacing, typography } from '@/lib/theme/tokens';

const RECENT_LIMIT = 9;

function formatTotalPlaytime(seconds: number): string {
  if (seconds < 60) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

export default function HomeScreen() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      getAllGames().then(setGames);
    }, [])
  );

  const filteredGames = useMemo(() => {
    if (!games) return [];
    const query = search.trim().toLowerCase();
    const list = query ? games.filter((game) => game.title.toLowerCase().includes(query)) : games;
    return list.slice(0, RECENT_LIMIT);
  }, [games, search]);

  const totalPlaytimeSeconds = useMemo(() => {
    if (!games) return 0;
    return games.reduce((acc, game) => acc + game.playtime, 0);
  }, [games]);

  if (games === null) {
    return <LoadingState />;
  }

  return (
    <FlatList
      data={filteredGames}
      keyExtractor={(game) => game.id}
      numColumns={3}
      contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing.xl }]}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <SearchBar value={search} onChangeText={setSearch} />

          <View
            style={[
              styles.statsBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.statsCard}>
              <Text style={[styles.statsNumber, { color: colors.accent }]}>{games.length}</Text>
              <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Juegos</Text>
            </View>
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statsCard}>
              <Text style={[styles.statsNumber, { color: colors.accent }]}>
                {formatTotalPlaytime(totalPlaytimeSeconds)}
              </Text>
              <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Jugado Total</Text>
            </View>
          </View>

          <ContinuePlaying />
          <Text style={styles.sectionTitle}>Biblioteca reciente</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.gameItem} onPress={() => router.push(`/game/${item.id}`)}>
          <GameCover title={item.title} coverUri={item.cover_uri} system={item.system} />
          <Text style={styles.gameTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: spacing.sm,
    paddingVertical: spacing.sm,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: '60%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#A39E94',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
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
  gameTitle: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
});
