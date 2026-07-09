import { File, Paths } from 'expo-file-system';

import { HOMEBREW_CATALOG, type HomebrewGame } from './catalog';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_FILE_NAME = 'homebrew-catalog-cache.json';

type CacheEntry = {
  fetchedAt: number;
  games: HomebrewGame[];
};

async function readCache(): Promise<CacheEntry | null> {
  const file = new File(Paths.cache, CACHE_FILE_NAME);
  if (!file.exists) {
    return null;
  }
  try {
    return JSON.parse(await file.text()) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  new File(Paths.cache, CACHE_FILE_NAME).write(JSON.stringify(entry));
}

async function fetchCatalog(): Promise<HomebrewGame[]> {
  // The catalog is bundled locally for now (see docs/homebrew-sources.md on why —
  // entries are hand-verified, not fetched from a remote list yet). Swapping in a
  // real network fetch later only touches this function.
  return HOMEBREW_CATALOG;
}

/** Returns the homebrew catalog, refreshing at most once every 24h (F6.41). */
export async function getHomebrewCatalog(): Promise<HomebrewGame[]> {
  const cached = await readCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.games;
  }

  const games = await fetchCatalog();
  writeCache({ fetchedAt: Date.now(), games });
  return games;
}
