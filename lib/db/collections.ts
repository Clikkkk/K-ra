import { getDb } from './client';
import type { Collection, Game } from './schema';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getAllCollections(): Promise<Collection[]> {
  const db = await getDb();
  return db.getAllAsync<Collection>('SELECT * FROM collections ORDER BY created_at ASC');
}

export async function createCollection(name: string): Promise<Collection> {
  const db = await getDb();
  const collection: Collection = { id: generateId(), name, created_at: Date.now() };
  await db.runAsync('INSERT INTO collections (id, name, created_at) VALUES (?, ?, ?)', [
    collection.id,
    collection.name,
    collection.created_at,
  ]);
  return collection;
}

export async function deleteCollection(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM collections WHERE id = ?', [id]);
}

export async function addGameToCollection(collectionId: string, gameId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR IGNORE INTO collection_games (collection_id, game_id) VALUES (?, ?)',
    [collectionId, gameId]
  );
}

export async function removeGameFromCollection(
  collectionId: string,
  gameId: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM collection_games WHERE collection_id = ? AND game_id = ?', [
    collectionId,
    gameId,
  ]);
}

export async function getGamesInCollection(collectionId: string): Promise<Game[]> {
  const db = await getDb();
  return db.getAllAsync<Game>(
    `SELECT games.* FROM games
     JOIN collection_games ON collection_games.game_id = games.id
     WHERE collection_games.collection_id = ?
     ORDER BY games.imported_at DESC`,
    [collectionId]
  );
}

export async function getCollectionsForGame(gameId: string): Promise<Collection[]> {
  const db = await getDb();
  return db.getAllAsync<Collection>(
    `SELECT collections.* FROM collections
     JOIN collection_games ON collection_games.collection_id = collections.id
     WHERE collection_games.game_id = ?
     ORDER BY collections.created_at ASC`,
    [gameId]
  );
}
