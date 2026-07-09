import { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Animated, type ViewProps } from 'react-native';

import { SYSTEM_LABEL, type System } from '@/lib/db/schema';
import { useTheme } from '@/lib/theme/ThemeContext';
import { radii, typography } from '@/lib/theme/tokens';

type GameCoverProps = ViewProps & {
  title: string;
  coverUri?: string | null;
  system?: System;
};

export function GameCover({ title, coverUri, system, style, ...viewProps }: GameCoverProps) {
  const { colors } = useTheme();
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [animProgress]);

  const animatedStyle = {
    opacity: animProgress,
    transform: [
      {
        scale: animProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.surfaceRaised }, animatedStyle, style]}
      {...viewProps}
    >
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.fallback, { backgroundColor: colors.accentMuted }]}>
          <Text style={[styles.fallbackLabel, { color: colors.text }]}>
            {system ? SYSTEM_LABEL[system] : title.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 3 / 4,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
});
