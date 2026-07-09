import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { GameCover } from '@/components/ui/GameCover';
import { getGameById } from '@/lib/db/games';
import { SYSTEM_LABEL, type Game } from '@/lib/db/schema';
import { hasSaveState } from '@/lib/emulator/loadState';
import { spacing, typography } from '@/lib/theme/tokens';

function formatPlaytime(seconds: number): string {
  if (seconds < 60) {
    return 'Sin tiempo jugado todavía';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m jugadas` : `${minutes}m jugados`;
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGameById(id).then((result) => {
      if (!cancelled) setGame(result);
    });
    hasSaveState(id).then((result) => {
      if (!cancelled) setCanContinue(result);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (game === undefined) {
    return <View style={styles.center} />;
  }

  if (game === null) {
    return (
      <View style={styles.center}>
        <Text>Juego no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameCover
        title={game.title}
        coverUri={game.cover_uri}
        system={game.system}
        style={styles.cover}
      />
      <Text style={styles.title}>{game.title}</Text>
      <Text style={styles.meta}>{SYSTEM_LABEL[game.system]}</Text>
      <Text style={styles.meta}>{formatPlaytime(game.playtime)}</Text>
      <Button
        label={canContinue ? 'Continuar' : 'Jugar'}
        onPress={() => router.push(`/player/${game.id}`)}
        style={styles.playButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    width: 180,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  meta: {
    fontSize: typography.size.sm,
  },
  playButton: {
    marginTop: spacing.lg,
    minWidth: 180,
  },
});
