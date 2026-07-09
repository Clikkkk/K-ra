import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native';

import { colors, radii, spacing } from '@/lib/theme/tokens';

type CardProps = ViewProps;

export function Card({ style, ...viewProps }: CardProps) {
  return <View style={[styles.card, style]} {...viewProps} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
