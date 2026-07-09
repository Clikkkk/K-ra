import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/library/EmptyState';
import { SearchBar } from '@/components/library/SearchBar';
import { SystemFilter } from '@/components/library/SystemFilter';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { GameCover } from '@/components/ui/GameCover';
import { getAllGames } from '@/lib/db/games';
import type { Game, System } from '@/lib/db/schema';
import { spacing, typography } from '@/lib/theme/tokens';

export default function BibliotecaScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState<System | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      getAllGames().then(setGames);
    }, [])
  );

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    return games.filter((game) => {
      const matchesSystem = systemFilter === 'all' || game.system === systemFilter;
      const matchesQuery = !query || game.title.toLowerCase().includes(query);
      return matchesSystem && matchesQuery;
    });
  }, [games, search, systemFilter]);

  if (games.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Biblioteca</Text>
        </View>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGames}
        keyExtractor={(game) => game.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Biblioteca</Text>
              <Button label="Importar ROM" onPress={() => router.push('/biblioteca/import')} />
            </View>
            <SearchBar value={search} onChangeText={setSearch} />
            <SystemFilter value={systemFilter} onChange={setSystemFilter} />
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.noResults}>No encontramos juegos con ese filtro.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  noResults: {
    textAlign: 'center',
    paddingTop: spacing.xl,
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
