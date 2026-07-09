import { Directory, File, Paths } from 'expo-file-system';

import { upsertSaveState } from '@/lib/db/saveStates';

import type { EmulatorViewHandle } from '@/components/emulator/EmulatorView';

/** Saves the running core's state to disk and registers it in the DB (single slot for MVP). */
export async function saveGameState(emulator: EmulatorViewHandle, gameId: string): Promise<void> {
  const stateBase64 = await emulator.saveState();

  const savesDir = new Directory(Paths.document, 'saves');
  if (!savesDir.exists) {
    savesDir.create({ intermediates: true });
  }

  const file = new File(savesDir, `${gameId}-slot0.state`);
  file.write(stateBase64, { encoding: 'base64' });

  await upsertSaveState({ id: `${gameId}-0`, gameId, fileUri: file.uri });
}
