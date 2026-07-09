import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { GameCanvas } from '@/components/emulator/GameCanvas';
import { Text, View } from '@/components/Themed';
import { getGameById, markGamePlayed } from '@/lib/db/games';
import type { Game } from '@/lib/db/schema';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<Game | null | undefined>(undefined);

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

  return <GameCanvas system={game.system} romUri={game.file_uri} gameName={game.title} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
