import { Asset } from 'expo-asset';

import { upsertGame } from '@/lib/db/games';

export const NESTEST_GAME_ID = 'dev-nestest';

/**
 * Dev-only helper (F1.13): seeds a `games` row pointing at the bundled nestest.nes
 * test ROM so the full import -> core -> render pipeline can be exercised end-to-end
 * without a real ROM-import UI (that lands in F2/Biblioteca).
 */
export async function seedNestestGame(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro asset resolution needs a static require()
  const asset = Asset.fromModule(require('../../assets/test-roms/nestest.nes'));
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Could not resolve local URI for nestest.nes');
  }

  await upsertGame({
    id: NESTEST_GAME_ID,
    title: 'nestest (ROM de prueba)',
    system: 'nes',
    file_uri: asset.localUri,
    cover_uri: null,
    last_played: null,
    playtime: 0,
    imported_at: Date.now(),
  });

  return NESTEST_GAME_ID;
}
