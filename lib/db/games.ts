import { getDb } from './client';
import type { Game, System } from './schema';

export async function getGameById(id: string): Promise<Game | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Game>('SELECT * FROM games WHERE id = ?', [id]);
  return row ?? null;
}

export async function getAllGames(): Promise<Game[]> {
  const db = await getDb();
  return db.getAllAsync<Game>('SELECT * FROM games ORDER BY imported_at DESC');
}

export async function getRecentlyPlayedGames(limit: number): Promise<Game[]> {
  const db = await getDb();
  return db.getAllAsync<Game>(
    'SELECT * FROM games WHERE last_played IS NOT NULL ORDER BY last_played DESC LIMIT ?',
    [limit]
  );
}

export async function markGamePlayed(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE games SET last_played = ? WHERE id = ?', [Date.now(), id]);
}

/** Adds `deltaSeconds` to a game's stored playtime (F4.30). */
export async function incrementPlaytime(id: string, deltaSeconds: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE games SET playtime = playtime + ? WHERE id = ?', [deltaSeconds, id]);
}

export async function updateGameCover(id: string, coverUri: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE games SET cover_uri = ? WHERE id = ?', [coverUri, id]);
}

export async function upsertGame(game: Game): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO games (id, title, system, file_uri, cover_uri, last_played, playtime, imported_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       system = excluded.system,
       file_uri = excluded.file_uri,
       cover_uri = excluded.cover_uri,
       last_played = excluded.last_played,
       playtime = excluded.playtime,
       imported_at = excluded.imported_at`,
    [
      game.id,
      game.title,
      game.system,
      game.file_uri,
      game.cover_uri,
      game.last_played,
      game.playtime,
      game.imported_at,
    ]
  );
}

export type ImportGameInput = {
  id: string;
  title: string;
  system: System;
  file_uri: string;
};

/** Inserts a freshly-imported ROM as a new library entry (F2.17). */
export async function insertImportedGame(input: ImportGameInput): Promise<Game> {
  const game: Game = {
    id: input.id,
    title: input.title,
    system: input.system,
    file_uri: input.file_uri,
    cover_uri: null,
    last_played: null,
    playtime: 0,
    imported_at: Date.now(),
  };

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO games (id, title, system, file_uri, cover_uri, last_played, playtime, imported_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      game.id,
      game.title,
      game.system,
      game.file_uri,
      game.cover_uri,
      game.last_played,
      game.playtime,
      game.imported_at,
    ]
  );

  return game;
}

export async function deleteGame(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM games WHERE id = ?', [id]);
}
