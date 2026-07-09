import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ContinuePlaying } from '@/components/home/ContinuePlaying';
import { SearchBar } from '@/components/library/SearchBar';
import { Text, View } from '@/components/Themed';
import { GameCover } from '@/components/ui/GameCover';
import { getAllGames } from '@/lib/db/games';
import type { Game } from '@/lib/db/schema';
import { spacing, typography } from '@/lib/theme/tokens';

const RECENT_LIMIT = 9;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      getAllGames().then(setGames);
    }, [])
  );

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query ? games.filter((game) => game.title.toLowerCase().includes(query)) : games;
    return list.slice(0, RECENT_LIMIT);
  }, [games, search]);

  return (
    <FlatList
      data={filteredGames}
      keyExtractor={(game) => game.id}
      numColumns={3}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <SearchBar value={search} onChangeText={setSearch} />
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: spacing.md,
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
