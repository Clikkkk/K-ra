export type System = 'nes' | 'snes' | 'gba';

export const SYSTEM_LABEL: Record<System, string> = {
  nes: 'NES',
  snes: 'SNES',
  gba: 'GBA',
};

export interface Game {
  id: string;
  title: string;
  system: System;
  file_uri: string;
  cover_uri: string | null;
  last_played: number | null;
  playtime: number;
  imported_at: number;
}

export interface SaveState {
  id: string;
  game_id: string;
  slot: number;
  file_uri: string;
  created_at: number;
}

export interface Collection {
  id: string;
  name: string;
  created_at: number;
}

export const SCHEMA_VERSION = 5;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  system TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  cover_uri TEXT,
  last_played INTEGER,
  playtime INTEGER NOT NULL DEFAULT 0,
  imported_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS save_states (
  id TEXT PRIMARY KEY NOT NULL,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL,
  file_uri TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_save_states_game_id ON save_states(game_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_save_states_game_slot ON save_states(game_id, slot);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_games (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_games_game_id ON collection_games(game_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

// Applied in order for existing installs whose user_version is below SCHEMA_VERSION.
// Fresh installs skip these entirely since CREATE_TABLES_SQL above already reflects
// the latest shape.
export const MIGRATIONS: Record<number, string> = {
  2: 'ALTER TABLE games ADD COLUMN imported_at INTEGER NOT NULL DEFAULT 0;',
  3: 'CREATE UNIQUE INDEX IF NOT EXISTS idx_save_states_game_slot ON save_states(game_id, slot);',
  4: `
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS collection_games (
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      PRIMARY KEY (collection_id, game_id)
    );
    CREATE INDEX IF NOT EXISTS idx_collection_games_game_id ON collection_games(game_id);
  `,
  5: 'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
};
