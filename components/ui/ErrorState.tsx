import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { colors, spacing, typography } from '@/lib/theme/tokens';

import { Button } from './Button';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && <Button label="Reintentar" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  message: {
    fontSize: typography.size.md,
    textAlign: 'center',
  },
});
