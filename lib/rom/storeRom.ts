import { Directory, File, Paths } from 'expo-file-system';

/**
 * Copies a ROM picked via the system file picker into the app's private
 * storage (documentDirectory/roms/) so it persists independently of the
 * picker's (often temporary/cache) source location.
 */
export function storeRom(sourceUri: string, gameId: string, extension: string): string {
  const romsDir = new Directory(Paths.document, 'roms');
  if (!romsDir.exists) {
    romsDir.create({ intermediates: true });
  }

  const destination = new File(romsDir, `${gameId}.${extension}`);
  if (destination.exists) {
    destination.delete();
  }

  new File(sourceUri).copy(destination);

  return destination.uri;
}
