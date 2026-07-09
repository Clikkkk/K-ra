import type { System } from '@/lib/db/schema';

export interface HomebrewGame {
  id: string;
  title: string;
  system: System;
  description: string;
  coverUrl: string | null;
  downloadUrl: string;
  license: string;
  author: string;
  sourceUrl: string;
}

/**
 * Static catalog for the MVP (F6.37-38). Kept intentionally small: each entry's
 * license has been individually verified (see docs/homebrew-sources.md) — this is
 * not an automated scrape, entries are added by hand once a game's license is
 * confirmed to allow redistribution.
 */
export const HOMEBREW_CATALOG: HomebrewGame[] = [
  {
    id: 'minicraft-gba',
    title: 'Minicraft for GBA',
    system: 'gba',
    description:
      'Port homebrew de Minicraft (el juego original de Notch para la Ludum Dare 22) a Game Boy Advance.',
    coverUrl: null,
    downloadUrl:
      'https://github.com/Vulcalien/minicraft-gba/releases/download/2.0/minicraft-gba_2.0.zip',
    license: 'GPL-3.0',
    author: 'Vulcalien',
    sourceUrl: 'https://github.com/Vulcalien/minicraft-gba',
  },
];

export function getHomebrewGameById(id: string): HomebrewGame | null {
  return HOMEBREW_CATALOG.find((game) => game.id === id) ?? null;
}
