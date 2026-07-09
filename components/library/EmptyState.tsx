import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/lib/theme/tokens';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todavía no hay juegos acá</Text>
      <Text style={styles.subtitle}>Importá tu primera ROM para empezar a jugar.</Text>
      <Button label="Importar ROM" onPress={() => router.push('/biblioteca/import')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
