import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { seedNestestGame } from '@/lib/emulator/devSeed';
import { spacing } from '@/lib/theme/tokens';

export default function AjustesScreen() {
  const [error, setError] = useState<string | null>(null);

  async function handleRunTestRom() {
    setError(null);
    try {
      const gameId = await seedNestestGame();
      router.push(`/player/${gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      {__DEV__ && (
        <View style={styles.devSection}>
          <Button label="Dev: correr ROM de prueba (nestest)" onPress={handleRunTestRom} />
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  devSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  error: {
    color: 'red',
  },
});
