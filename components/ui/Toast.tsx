import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme/tokens';

type ToastProps = {
  message: string;
  visible: boolean;
};

export function Toast({ message, visible }: ToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  text: {
    color: colors.text,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});
