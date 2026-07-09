import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionFilter } from '@/components/library/CollectionFilter';
import { EmptyState } from '@/components/library/EmptyState';
import { SearchBar } from '@/components/library/SearchBar';
import { SystemFilter } from '@/components/library/SystemFilter';
import { Text, View } from '@/components/Themed';
import { IconButton } from '@/components/ui/IconButton';
import { GameCover } from '@/components/ui/GameCover';
import { LoadingState } from '@/components/ui/LoadingState';
import { PromptModal } from '@/components/ui/PromptModal';
import { createCollection, getAllCollections, getGamesInCollection } from '@/lib/db/collections';
import { getAllGames } from '@/lib/db/games';
import type { Collection, Game, System } from '@/lib/db/schema';
import { useTheme } from '@/lib/theme/ThemeContext';
import { radii, spacing, typography } from '@/lib/theme/tokens';

export default function BibliotecaScreen() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState<System | 'all'>('all');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alpha' | 'played'>('recent');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const loadGames = useCallback(async () => {
    const result =
      collectionFilter === 'all'
        ? await getAllGames()
        : await getGamesInCollection(collectionFilter);
    setGames(result);
  }, [collectionFilter]);

  useFocusEffect(
    useCallback(() => {
      loadGames();
      getAllCollections().then(setCollections);
    }, [loadGames])
  );

  const sortedAndFilteredGames = useMemo(() => {
    if (!games) return [];
    const query = search.trim().toLowerCase();
    const filtered = games.filter((game) => {
      const matchesSystem = systemFilter === 'all' || game.system === systemFilter;
      const matchesQuery = !query || game.title.toLowerCase().includes(query);
      return matchesSystem && matchesQuery;
    });

    if (sortBy === 'alpha') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'played') {
      filtered.sort((a, b) => b.playtime - a.playtime);
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => b.imported_at - a.imported_at);
    }

    return filtered;
  }, [games, search, systemFilter, sortBy]);

  async function handleCreateCollection(name: string) {
    const collection = await createCollection(name);
    setCollections((prev) => [...prev, collection]);
    setCreatingCollection(false);
  }

  if (games === null) {
    return <LoadingState />;
  }

  const isLibraryTrulyEmpty =
    games.length === 0 && collectionFilter === 'all' && !search && systemFilter === 'all';

  if (isLibraryTrulyEmpty) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar value={search} onChangeText={setSearch} />
          </View>
          <IconButton icon="add" onPress={() => router.push('/biblioteca/import')} />
        </View>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedAndFilteredGames}
        keyExtractor={(game) => game.id}
        numColumns={3}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing.xl }]}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.searchRow}>
              <View style={{ flex: 1 }}>
                <SearchBar value={search} onChangeText={setSearch} />
              </View>
              <IconButton icon="add" onPress={() => router.push('/biblioteca/import')} />
            </View>

            <View style={styles.metaRow}>
              <View style={styles.sortWrapper}>
                <Pressable
                  style={[
                    styles.dropdownTrigger,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => setDropdownVisible(!dropdownVisible)}
                >
                  <Text style={[styles.dropdownTriggerText, { color: colors.text }]}>
                    {sortBy === 'recent'
                      ? 'Recién añadido'
                      : sortBy === 'alpha'
                        ? 'Alfabético'
                        : 'Más jugado'}
                  </Text>
                  <Ionicons
                    name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={colors.textMuted}
                  />
                </Pressable>

                {dropdownVisible && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                    ]}
                  >
                    <Pressable
                      style={[
                        styles.dropdownItem,
                        sortBy === 'recent' && { backgroundColor: colors.accent + '26' },
                      ]}
                      onPress={() => {
                        setSortBy('recent');
                        setDropdownVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: colors.textMuted },
                          sortBy === 'recent' && { color: colors.accent, fontWeight: 'bold' },
                        ]}
                      >
                        Recién añadido
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.dropdownItem,
                        sortBy === 'alpha' && { backgroundColor: colors.accent + '26' },
                      ]}
                      onPress={() => {
                        setSortBy('alpha');
                        setDropdownVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: colors.textMuted },
                          sortBy === 'alpha' && { color: colors.accent, fontWeight: 'bold' },
                        ]}
                      >
                        Alfabético
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.dropdownItem,
                        sortBy === 'played' && { backgroundColor: colors.accent + '26' },
                      ]}
                      onPress={() => {
                        setSortBy('played');
                        setDropdownVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: colors.textMuted },
                          sortBy === 'played' && { color: colors.accent, fontWeight: 'bold' },
                        ]}
                      >
                        Más jugado
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            <SystemFilter value={systemFilter} onChange={setSystemFilter} />
            <CollectionFilter
              collections={collections}
              value={collectionFilter}
              onChange={setCollectionFilter}
              onCreatePress={() => setCreatingCollection(true)}
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.noResults, { color: colors.textMuted }]}>
            No encontramos juegos con ese filtro.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.gameItem} onPress={() => router.push(`/game/${item.id}`)}>
            <GameCover title={item.title} coverUri={item.cover_uri} system={item.system} />
            <Text style={styles.gameTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </Pressable>
        )}
      />
      <PromptModal
        visible={creatingCollection}
        title="Nueva colección"
        placeholder="Nombre de la colección"
        onSubmit={handleCreateCollection}
        onCancel={() => setCreatingCollection(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    zIndex: 20,
  },
  sortWrapper: {
    position: 'relative',
    zIndex: 30,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  dropdownTriggerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 34,
    left: 0,
    width: 140,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm - 2,
  },
  dropdownItemText: {
    fontSize: 11,
  },
  noResults: {
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  gameItem: {
    flex: 1 / 3,
  },
  gameTitle: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
});
