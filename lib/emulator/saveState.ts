import { Directory, File, Paths } from 'expo-file-system';

import { base64ToBytes } from '@/lib/base64';
import { upsertSaveState } from '@/lib/db/saveStates';

import type { EmulatorViewHandle } from '@/components/emulator/EmulatorView';

/** Saves the running core's state to disk and registers it in the DB. */
export async function saveGameState(
  emulator: EmulatorViewHandle,
  gameId: string,
  slot: number = 0
): Promise<void> {
  const stateBase64 = await emulator.saveState();

  const savesDir = new Directory(Paths.document, 'saves');
  if (!savesDir.exists) {
    savesDir.create({ intermediates: true });
  }

  const file = new File(savesDir, `${gameId}-slot${slot}.state`);
  // file.write's native binding only accepts a single argument in this
  // expo-file-system version (the `encoding` option in its TS types isn't
  // actually implemented natively yet), so decode base64 -> bytes ourselves.
  file.write(base64ToBytes(stateBase64));

  await upsertSaveState({ id: `${gameId}-${slot}`, gameId, fileUri: file.uri, slot });
}
