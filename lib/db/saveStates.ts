import { getDb } from './client';
import type { SaveState } from './schema';

export const DEFAULT_SAVE_SLOT = 0;

export async function getSaveState(
  gameId: string,
  slot: number = DEFAULT_SAVE_SLOT
): Promise<SaveState | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SaveState>(
    'SELECT * FROM save_states WHERE game_id = ? AND slot = ?',
    [gameId, slot]
  );
  return row ?? null;
}

export type UpsertSaveStateInput = {
  id: string;
  gameId: string;
  fileUri: string;
  slot?: number;
};

export async function upsertSaveState(input: UpsertSaveStateInput): Promise<void> {
  const slot = input.slot ?? DEFAULT_SAVE_SLOT;
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO save_states (id, game_id, slot, file_uri, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(game_id, slot) DO UPDATE SET
       file_uri = excluded.file_uri,
       created_at = excluded.created_at`,
    [input.id, input.gameId, slot, input.fileUri, Date.now()]
  );
}
