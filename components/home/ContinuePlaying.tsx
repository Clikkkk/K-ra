import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { GameCover } from '@/components/ui/GameCover';
import { getRecentlyPlayedGames } from '@/lib/db/games';
import type { Game } from '@/lib/db/schema';
import { spacing, typography } from '@/lib/theme/tokens';

const MAX_ITEMS = 10;
const COVER_WIDTH = 96;

export function ContinuePlaying() {
  const [games, setGames] = useState<Game[]>([]);

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
            <GameCover title={game.title} coverUri={game.cover_uri} system={game.system} />
            <Text style={styles.itemTitle} numberOfLines={1}>
              {game.title}
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
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: spacing.md,
  },
  row: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  item: {
    width: COVER_WIDTH,
  },
  itemTitle: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
});
