import { File } from 'expo-file-system';

import { getSaveState } from '@/lib/db/saveStates';

import type { EmulatorViewHandle } from '@/components/emulator/EmulatorView';

export async function hasSaveState(gameId: string): Promise<boolean> {
  const state = await getSaveState(gameId);
  return state !== null;
}

/** Loads the game's saved state into the running core, if one exists. Returns whether it did. */
export async function loadLatestSaveState(
  emulator: EmulatorViewHandle,
  gameId: string
): Promise<boolean> {
  const state = await getSaveState(gameId);
  if (!state) {
    return false;
  }

  const file = new File(state.file_uri);
  if (!file.exists) {
    return false;
  }

  const stateBase64 = await file.base64();
  await emulator.loadState(stateBase64);
  return true;
}
