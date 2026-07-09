import { Image, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { colors, radii, typography } from '@/lib/theme/tokens';

type GameCoverProps = ViewProps & {
  title: string;
  coverUri?: string | null;
};

export function GameCover({ title, coverUri, style, ...viewProps }: GameCoverProps) {
  return (
    <View style={[styles.container, style]} {...viewProps}>
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackLetter}>{title.charAt(0).toUpperCase()}</Text>
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
  fallbackLetter: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
});
