import { Directory, File, Paths } from 'expo-file-system';
import { unzipSync } from 'fflate';

import { insertImportedGame } from '@/lib/db/games';
import { SYSTEM_TO_EXTENSION } from '@/lib/rom/detectSystem';

import type { HomebrewGame } from './catalog';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractRomFromZip(zipBytes: Uint8Array, extension: string): Uint8Array {
  const entries = unzipSync(zipBytes);
  const romEntryName = Object.keys(entries).find(
    (name) => !name.includes('/') && name.toLowerCase().endsWith(`.${extension}`)
  );
  if (!romEntryName) {
    throw new Error(`No se encontró un archivo .${extension} dentro del .zip descargado`);
  }
  return entries[romEntryName];
}

/** Downloads a homebrew catalog entry and adds it to the library as an imported game (F6.40). */
export async function addHomebrewGameToLibrary(game: HomebrewGame): Promise<string> {
  const tempDir = new Directory(Paths.cache, 'homebrew-downloads');
  if (!tempDir.exists) {
    tempDir.create({ intermediates: true });
  }

  const downloaded = await File.downloadFileAsync(game.downloadUrl, tempDir, { idempotent: true });
  const extension = SYSTEM_TO_EXTENSION[game.system];

  const romBytes = downloaded.uri.toLowerCase().endsWith('.zip')
    ? extractRomFromZip(await downloaded.bytes(), extension)
    : await downloaded.bytes();

  downloaded.delete();

  const id = generateId();
  const romsDir = new Directory(Paths.document, 'roms');
  if (!romsDir.exists) {
    romsDir.create({ intermediates: true });
  }

  const romFile = new File(romsDir, `${id}.${extension}`);
  romFile.write(romBytes);

  await insertImportedGame({
    id,
    title: game.title,
    system: game.system,
    file_uri: romFile.uri,
  });

  return id;
}
