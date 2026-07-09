import { type SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';

import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function migrate(db: SQLiteDatabase) {
  const { user_version: currentVersion } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  )) ?? { user_version: 0 };

  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  await db.execAsync(CREATE_TABLES_SQL);
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('kora.db').then(async (db) => {
      await db.execAsync('PRAGMA foreign_keys = ON');
      await migrate(db);
      return db;
    });
  }

  return dbPromise;
}
