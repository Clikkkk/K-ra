import { getDb } from './client';

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const db = await getDb();
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return result ? result.value : defaultValue;
  } catch (error) {
    console.error(`Error loading setting ${key}:`, error);
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
  }
}
