import { Image, StyleSheet, Text, View, type ViewProps } from 'react-native';

import type { System } from '@/lib/db/schema';
import { colors, radii, typography } from '@/lib/theme/tokens';

type GameCoverProps = ViewProps & {
  title: string;
  coverUri?: string | null;
  system?: System;
};

const SYSTEM_LABEL: Record<System, string> = {
  nes: 'NES',
  snes: 'SNES',
  gba: 'GBA',
};

export function GameCover({ title, coverUri, system, style, ...viewProps }: GameCoverProps) {
  return (
    <View style={[styles.container, style]} {...viewProps}>
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackLabel}>
            {system ? SYSTEM_LABEL[system] : title.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 3 / 4,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentMuted,
  },
  fallbackLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
    color: colors.text,
  },
});
