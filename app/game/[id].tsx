import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { GameCover } from '@/components/ui/GameCover';
import { LoadingState } from '@/components/ui/LoadingState';
import { PromptModal } from '@/components/ui/PromptModal';
import {
  addGameToCollection,
  createCollection,
  getAllCollections,
  getCollectionsForGame,
  removeGameFromCollection,
} from '@/lib/db/collections';
import { getGameById, updateGameCover, deleteGame } from '@/lib/db/games';
import { getSaveStatesForGame, deleteSaveState } from '@/lib/db/saveStates';
import { type Collection, type Game, type System, type SaveState } from '@/lib/db/schema';
import { hasSaveState } from '@/lib/emulator/loadState';
import { useTheme } from '@/lib/theme/ThemeContext';
import { colors as tokenColors, radii, spacing, typography } from '@/lib/theme/tokens';

const SYSTEM_THEME: Record<System, { bg: string; text: string; label: string }> = {
  nes: { bg: '#352021', text: '#E5484D', label: 'Nintendo NES' },
  snes: { bg: '#251E3D', text: '#9C8DFF', label: 'Super Nintendo' },
  gba: { bg: '#1A2D3C', text: '#4CA3FF', label: 'Game Boy Advance' },
};

function formatPlaytimeValue(seconds: number): string {
  if (seconds < 60) return '0 min';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs} h`;
}

function formatLastPlayed(timestamp: number | null): string {
  if (!timestamp) return 'Nunca';
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatImportedDate(timestamp: number): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [canContinue, setCanContinue] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [gameCollectionIds, setGameCollectionIds] = useState<Set<string>>(new Set());
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [saveStates, setSaveStates] = useState<SaveState[]>([]);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const refreshGameCollections = useCallback(async () => {
    const result = await getCollectionsForGame(id);
    setGameCollectionIds(new Set(result.map((c) => c.id)));
  }, [id]);

  const refreshSaveStates = useCallback(async () => {
    const result = await getSaveStatesForGame(id);
    setSaveStates(result);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    getGameById(id).then((result) => {
      if (!cancelled) setGame(result);
    });
    hasSaveState(id).then((result) => {
      if (!cancelled) setCanContinue(result);
    });
    getAllCollections().then((result) => {
      if (!cancelled) setCollections(result);
    });
    refreshGameCollections();
    refreshSaveStates();
    return () => {
      cancelled = true;
    };
  }, [id, refreshGameCollections, refreshSaveStates]);

  async function toggleCollection(collectionId: string) {
    if (gameCollectionIds.has(collectionId)) {
      await removeGameFromCollection(collectionId, id);
    } else {
      await addGameToCollection(collectionId, id);
    }
    await refreshGameCollections();
  }

  async function handleCreateCollection(name: string) {
    const collection = await createCollection(name);
    setCollections((prev) => [...prev, collection]);
    setCreatingCollection(false);
    await addGameToCollection(collection.id, id);
    await refreshGameCollections();
  }

  async function handleChangeCover() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const coversDir = new Directory(Paths.document, 'covers');
    if (!coversDir.exists) {
      coversDir.create({ intermediates: true });
    }

    const destination = new File(coversDir, `${id}.jpg`);
    if (destination.exists) {
      destination.delete();
    }
    new File(result.assets[0].uri).copy(destination);

    await updateGameCover(id, destination.uri);
    setGame((prev) => (prev ? { ...prev, cover_uri: destination.uri } : prev));
  }

  async function handleDeleteGame() {
    Alert.alert(
      'Eliminar juego',
      '¿Estás seguro de que querés eliminar este juego de la biblioteca y todas sus partidas guardadas? Esta acción es irreversible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!game) return;
            await deleteGame(game.id);
            try {
              if (game.file_uri) {
                const romFile = new File(game.file_uri);
                if (romFile.exists) {
                  romFile.delete();
                }
              }
            } catch (e) {
              console.warn('Error deleting ROM file:', e);
            }
            try {
              if (game.cover_uri) {
                const coverFile = new File(game.cover_uri);
                if (coverFile.exists) {
                  coverFile.delete();
                }
              }
            } catch (e) {
              console.warn('Error deleting cover file:', e);
            }
            router.back();
          },
        },
      ]
    );
  }

  async function handleDeleteSaveSlot(slot: number) {
    Alert.alert(
      'Borrar partida guardada',
      `¿Querés borrar la partida del Slot ${slot + 1}? Esta acción no se puede deshacer y liberará espacio.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await deleteSaveState(id, slot);
            try {
              const stateObj = saveStates.find((s) => s.slot === slot);
              if (stateObj && stateObj.file_uri) {
                const stateFile = new File(stateObj.file_uri);
                if (stateFile.exists) {
                  stateFile.delete();
                }
              }
            } catch (e) {
              console.warn('Error deleting save state file:', e);
            }
            await refreshSaveStates();
            const continueExists = await hasSaveState(id);
            setCanContinue(continueExists);
          },
        },
      ]
    );
  }

  if (game === undefined) {
    return <LoadingState />;
  }

  if (game === null) {
    return (
      <View style={styles.center}>
        <Text>Juego no encontrado</Text>
      </View>
    );
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
        {game.cover_uri ? (
          <Image source={{ uri: game.cover_uri }} style={styles.bannerImage} blurRadius={15} />
        ) : (
          <View style={[styles.bannerPlaceholder, { backgroundColor: colors.accentMuted }]} />
        )}
        <View style={styles.bannerOverlay} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={handleChangeCover} style={styles.coverWrapper}>
          <GameCover
            title={game.title}
            coverUri={game.cover_uri}
            system={game.system}
            style={styles.cover}
          />
          <View style={styles.coverEditBadge}>
            <Ionicons name="camera" size={14} color={colors.text} />
          </View>
        </Pressable>

        <Text style={styles.title}>{game.title}</Text>

        <View style={[styles.consoleBadge, { backgroundColor: SYSTEM_THEME[game.system].bg }]}>
          <Text style={[styles.consoleBadgeText, { color: SYSTEM_THEME[game.system].text }]}>
            {SYSTEM_THEME[game.system].label}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={16} color={colors.accent} />
            <Text style={styles.statValue}>{formatPlaytimeValue(game.playtime)}</Text>
            <Text style={styles.statLabel}>Jugado</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="game-controller-outline" size={16} color={colors.accent} />
            <Text style={styles.statValue}>{formatLastPlayed(game.last_played)}</Text>
            <Text style={styles.statLabel}>Partida</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="download-outline" size={16} color={colors.accent} />
            <Text style={styles.statValue}>{formatImportedDate(game.imported_at)}</Text>
            <Text style={styles.statLabel}>Importado</Text>
          </View>
        </View>

        <Button
          label={canContinue ? 'Continuar jugando' : 'Iniciar emulador'}
          icon={canContinue ? 'play' : 'game-controller'}
          onPress={() => router.push(`/player/${game.id}`)}
          style={styles.playButton}
        />

        <View style={styles.saveStatesSection}>
          <Text style={styles.sectionLabel}>Partidas Guardadas</Text>
          {saveStates.length === 0 ? (
            <View style={styles.emptySaveCard}>
              <Text style={styles.noSaveStatesText}>Sin partidas guardadas aún.</Text>
            </View>
          ) : (
            <View style={styles.saveStatesList}>
              {saveStates.map((state) => (
                <View key={state.id} style={styles.saveStateRow}>
                  <View style={styles.saveStateInfo}>
                    <Ionicons name="save-outline" size={14} color={colors.accent} />
                    <Text style={styles.saveStateText}>Slot {state.slot + 1}</Text>
                  </View>
                  <View style={styles.saveStateActionRow}>
                    <Text style={styles.saveStateDate}>
                      {new Date(state.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Pressable
                      onPress={() => handleDeleteSaveSlot(state.slot)}
                      hitSlop={8}
                      style={styles.deleteSlotButton}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.collectionsSection}>
          <Text style={styles.sectionLabel}>Colecciones</Text>
          <View style={styles.collectionChips}>
            {collections.map((collection) => {
              const active = gameCollectionIds.has(collection.id);
              return (
                <Pressable
                  key={collection.id}
                  onPress={() => toggleCollection(collection.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    active && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: colors.textMuted },
                      active && [styles.chipLabelActive, { color: '#15140F' }],
                    ]}
                  >
                    {collection.name}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setCreatingCollection(true)}
              style={[
                styles.addChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="add" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <Button
          label="Eliminar juego de la biblioteca"
          icon="trash-outline"
          variant="secondary"
          onPress={handleDeleteGame}
          style={styles.deleteGameButton}
        />

        <PromptModal
          visible={creatingCollection}
          title="Nueva colección"
          placeholder="Nombre de la colección"
          onSubmit={handleCreateCollection}
          onCancel={() => setCreatingCollection(false)}
        />
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
    position: 'relative',
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
  coverEditBadge: {
    position: 'absolute',
    bottom: -spacing.xs,
    right: -spacing.xs,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 28, 22, 0.95)',
    borderWidth: 1,
    borderColor: tokenColors.border,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: tokenColors.text,
  },
  statLabel: {
    fontSize: 10,
    color: tokenColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playButton: {
    marginTop: spacing.md,
    width: '100%',
    borderRadius: radii.full,
  },
  saveStatesSection: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  emptySaveCard: {
    backgroundColor: tokenColors.surface,
    borderWidth: 1,
    borderColor: tokenColors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  noSaveStatesText: {
    fontSize: typography.size.sm,
    color: tokenColors.textMuted,
  },
  saveStatesList: {
    backgroundColor: tokenColors.surface,
    borderWidth: 1,
    borderColor: tokenColors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  saveStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokenColors.border,
  },
  saveStateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  saveStateText: {
    fontSize: typography.size.sm,
    fontWeight: 'bold',
    color: tokenColors.text,
  },
  saveStateActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  saveStateDate: {
    fontSize: 11,
    color: tokenColors.textMuted,
  },
  deleteSlotButton: {
    padding: spacing.xs,
  },
  collectionsSection: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: tokenColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collectionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 11,
  },
  chipLabelActive: {
    fontWeight: 'bold',
  },
  addChip: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deleteGameButton: {
    marginTop: spacing.lg,
    width: '100%',
    borderRadius: radii.full,
  },
});
