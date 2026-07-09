import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { GameCover } from '@/components/ui/GameCover';
import { Toast } from '@/components/ui/Toast';
import { SYSTEM_LABEL } from '@/lib/db/schema';
import { getHomebrewGameById } from '@/lib/homebrew/catalog';
import { addHomebrewGameToLibrary } from '@/lib/homebrew/download';
import { spacing, typography } from '@/lib/theme/tokens';

export default function HomebrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getHomebrewGameById(id);
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!game) {
    return (
      <View style={styles.center}>
        <Text>Juego no encontrado</Text>
      </View>
    );
  }

  async function handleAdd() {
    if (!game) return;
    setDownloading(true);
    try {
      await addHomebrewGameToLibrary(game);
      router.replace('/biblioteca');
    } catch {
      setToastMessage('No pudimos descargar este juego. Probá de nuevo.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={styles.container}>
      <GameCover
        title={game.title}
        coverUri={game.coverUrl}
        system={game.system}
        style={styles.cover}
      />
      <Text style={styles.title}>{game.title}</Text>
      <Text style={styles.meta}>
        {SYSTEM_LABEL[game.system]} · {game.author}
      </Text>
      <Text style={styles.description}>{game.description}</Text>
      <Text style={styles.license}>Licencia: {game.license}</Text>
      <Button
        label={downloading ? 'Descargando...' : 'Añadir a mi biblioteca'}
        onPress={handleAdd}
        disabled={downloading}
        style={styles.addButton}
      />
      <Toast message={toastMessage ?? ''} visible={!!toastMessage} />
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
  description: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  license: {
    fontSize: typography.size.xs,
  },
  addButton: {
    marginTop: spacing.lg,
    minWidth: 220,
  },
});
