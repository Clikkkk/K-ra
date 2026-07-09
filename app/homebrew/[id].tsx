import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { GameCover } from '@/components/ui/GameCover';
import { Toast } from '@/components/ui/Toast';
import { SYSTEM_LABEL, type System } from '@/lib/db/schema';
import { getHomebrewGameById } from '@/lib/homebrew/catalog';
import { addHomebrewGameToLibrary } from '@/lib/homebrew/download';
import { useTheme } from '@/lib/theme/ThemeContext';
import { colors as tokenColors, radii, spacing, typography } from '@/lib/theme/tokens';

const SYSTEM_THEME: Record<System, { bg: string; text: string; label: string }> = {
  nes: { bg: '#352021', text: '#E5484D', label: 'Nintendo NES' },
  snes: { bg: '#251E3D', text: '#9C8DFF', label: 'Super Nintendo' },
  gba: { bg: '#1A2D3C', text: '#4CA3FF', label: 'Game Boy Advance' },
};

export default function HomebrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getHomebrewGameById(id);
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Pressable
        onPress={() => router.back()}
        style={[styles.floatingCloseButton, { top: insets.top + spacing.sm }]}
      >
        <Ionicons name="close" size={20} color={colors.text} />
      </Pressable>

      <View style={styles.backgroundContainer}>
        {game.coverUrl ? (
          <Image source={{ uri: game.coverUrl }} style={styles.bannerImage} blurRadius={15} />
        ) : (
          <View style={[styles.bannerPlaceholder, { backgroundColor: colors.accentMuted }]} />
        )}
        <View style={styles.bannerOverlay} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.coverWrapper}>
          <GameCover
            title={game.title}
            coverUri={game.coverUrl}
            system={game.system}
            style={styles.cover}
          />
        </View>

        <Text style={styles.title}>{game.title}</Text>

        <View style={[styles.consoleBadge, { backgroundColor: SYSTEM_THEME[game.system].bg }]}>
          <Text style={[styles.consoleBadgeText, { color: SYSTEM_THEME[game.system].text }]}>
            {SYSTEM_THEME[game.system].label}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="person-outline" size={16} color={colors.accent} />
            <Text style={styles.statValue} numberOfLines={1}>
              {game.author}
            </Text>
            <Text style={styles.statLabel}>Autor</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
            <Text style={styles.statValue} numberOfLines={1}>
              {game.license}
            </Text>
            <Text style={styles.statLabel}>Licencia</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="game-controller-outline" size={16} color={colors.accent} />
            <Text style={styles.statValue}>{SYSTEM_LABEL[game.system]}</Text>
            <Text style={styles.statLabel}>Consola</Text>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Descripción</Text>
          <Text style={styles.description}>{game.description}</Text>
        </View>

        <Button
          label={downloading ? 'Descargando juego...' : 'Añadir a mi biblioteca'}
          icon={downloading ? 'cloud-download-outline' : 'download-outline'}
          onPress={handleAdd}
          disabled={downloading}
          style={styles.addButton}
        />
        <Toast message={toastMessage ?? ''} visible={!!toastMessage} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    height: 360,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 20, 15, 0.7)',
  },
  floatingCloseButton: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(29, 28, 22, 0.9)',
    borderWidth: 1,
    borderColor: tokenColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  container: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: spacing.xs,
  },
  cover: {
    width: 140,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 242, 238, 0.15)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: tokenColors.text,
    paddingHorizontal: spacing.md,
  },
  consoleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  consoleBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: tokenColors.surface,
    borderWidth: 1,
    borderColor: tokenColors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: tokenColors.text,
    textAlign: 'center',
    width: '90%',
  },
  statLabel: {
    fontSize: 10,
    color: tokenColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionSection: {
    width: '100%',
    backgroundColor: tokenColors.surface,
    borderWidth: 1,
    borderColor: tokenColors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 6,
    marginTop: spacing.xs,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: tokenColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    color: tokenColors.text,
  },
  addButton: {
    marginTop: spacing.md,
    width: '100%',
    borderRadius: radii.full,
  },
});
