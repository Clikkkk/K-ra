import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ExitButton } from '@/components/emulator/ExitButton';
import { GameCanvas } from '@/components/emulator/GameCanvas';
import { Text, View } from '@/components/Themed';
import { getGameById, markGamePlayed } from '@/lib/db/games';
import type { Game } from '@/lib/db/schema';
import { PlaytimeTracker } from '@/lib/emulator/playtimeTracker';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const trackerRef = useRef<PlaytimeTracker | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGameById(id).then((result) => {
      if (!cancelled) setGame(result);
      if (result) markGamePlayed(result.id);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    trackerRef.current = new PlaytimeTracker(id);
    return () => {
      trackerRef.current?.stop();
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
      <GameCanvas system={game.system} romUri={game.file_uri} gameName={game.title} />
      <ExitButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
