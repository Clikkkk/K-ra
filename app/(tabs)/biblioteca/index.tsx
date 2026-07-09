import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { GameCover } from '@/components/ui/GameCover';
import { getAllGames } from '@/lib/db/games';
import type { Game } from '@/lib/db/schema';
import { spacing, typography } from '@/lib/theme/tokens';

export default function BibliotecaScreen() {
  const [games, setGames] = useState<Game[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllGames().then(setGames);
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <Button label="Importar ROM" onPress={() => router.push('/biblioteca/import')} />
      </View>

      {games.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Todavía no importaste ninguna ROM.</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(game) => game.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <Pressable style={styles.gameItem} onPress={() => router.push(`/game/${item.id}`)}>
              <GameCover title={item.title} coverUri={item.cover_uri} system={item.system} />
              <Text style={styles.gameTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
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
