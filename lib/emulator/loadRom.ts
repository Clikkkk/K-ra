import { Directory, File } from 'expo-file-system';

import type { System } from '@/lib/db/schema';

const ROM_EXTENSION: Record<System, string> = {
  nes: 'nes',
  snes: 'sfc',
  gba: 'gba',
};

/**
 * Copies the user's imported ROM into the provisioned EmulatorJS directory so it can be
 * fetched by the WebView as a relative URL against `baseUrl` (EJS can't read arbitrary
 * app file:// URIs directly — the file must live under the same origin it's served from).
 */
export async function prepareRomForEmulator(
  romUri: string,
  system: System,
  provisionedDirUri: string
): Promise<{ gameUrl: string }> {
  const romsDir = new Directory(provisionedDirUri, 'roms');
  if (!romsDir.exists) {
    romsDir.create({ intermediates: true });
  }

  const fileName = `current.${ROM_EXTENSION[system]}`;
  const destination = new File(romsDir, fileName);
  if (destination.exists) {
    destination.delete();
  }

  const source = new File(romUri);
  source.copy(destination);

  return { gameUrl: `roms/${fileName}` };
}
