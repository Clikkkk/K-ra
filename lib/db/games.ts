import { getDb } from './client';
import type { Game } from './schema';

export async function getGameById(id: string): Promise<Game | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Game>('SELECT * FROM games WHERE id = ?', [id]);
  return row ?? null;
}

export async function upsertGame(game: Game): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO games (id, title, system, file_uri, cover_uri, last_played, playtime)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       system = excluded.system,
       file_uri = excluded.file_uri,
       cover_uri = excluded.cover_uri,
       last_played = excluded.last_played,
       playtime = excluded.playtime`,
    [
      game.id,
      game.title,
      game.system,
      game.file_uri,
      game.cover_uri,
      game.last_played,
      game.playtime,
    ]
  );
}
