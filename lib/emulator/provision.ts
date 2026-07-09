import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { unzipSync } from 'fflate';

const BUNDLE_DIR_NAME = 'emulatorjs';
const BUNDLE_VERSION = 1;
const MARKER_FILE_NAME = `.installed-v${BUNDLE_VERSION}`;

let provisionPromise: Promise<string> | null = null;

function extractZipInto(zipBytes: Uint8Array, targetDir: Directory) {
  const entries = unzipSync(zipBytes);

  for (const [rawName, data] of Object.entries(entries)) {
    const relPath = rawName.replace(/\\/g, '/');
    if (relPath.endsWith('/') || data.byteLength === 0) {
      continue;
    }

    const segments = relPath.split('/').filter(Boolean);
    const fileName = segments.pop();
    if (!fileName) {
      continue;
    }

    let dir = targetDir;
    for (const segment of segments) {
      dir = new Directory(dir, segment);
      if (!dir.exists) {
        dir.create({ intermediates: true });
      }
    }

    new File(dir, fileName).write(data);
  }
}

async function provision(): Promise<string> {
  const targetDir = new Directory(Paths.document, BUNDLE_DIR_NAME);
  const marker = new File(targetDir, MARKER_FILE_NAME);

  if (targetDir.exists && marker.exists) {
    return targetDir.uri;
  }

  if (targetDir.exists) {
    targetDir.delete();
  }
  targetDir.create({ intermediates: true });

  const asset = Asset.fromModule(require('../../assets/emulatorjs/emulatorjs.zip'));
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Could not resolve local URI for emulatorjs.zip');
  }

  const zipBytes = await new File(asset.localUri).bytes();
  extractZipInto(zipBytes, targetDir);

  marker.create();
  return targetDir.uri;
}

export function ensureEmulatorAssets(): Promise<string> {
  if (!provisionPromise) {
    provisionPromise = provision().catch((error) => {
      provisionPromise = null;
      throw error;
    });
  }
  return provisionPromise;
}

/** Deletes the provisioned EmulatorJS bundle so it's re-extracted on next play (F7 clear cache). */
export function clearProvisionedEmulatorAssets(): void {
  const targetDir = new Directory(Paths.document, BUNDLE_DIR_NAME);
  if (targetDir.exists) {
    targetDir.delete();
  }
  provisionPromise = null;
}
