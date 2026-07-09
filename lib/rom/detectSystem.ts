import type { System } from '@/lib/db/schema';

export type DetectSystemResult = { ok: true; system: System } | { ok: false; reason: string };

const EXTENSION_TO_SYSTEM: Record<string, System> = {
  nes: 'nes',
  sfc: 'snes',
  smc: 'snes',
  gba: 'gba',
};

export const SYSTEM_TO_EXTENSION: Record<System, string> = {
  nes: 'nes',
  snes: 'sfc',
  gba: 'gba',
};

const KNOWN_UNSUPPORTED_REASON: Record<string, string> = {
  gb: 'Game Boy todavía no está soportado.',
  gbc: 'Game Boy Color todavía no está soportado.',
  nds: 'Nintendo DS todavía no está soportado.',
  n64: 'Nintendo 64 todavía no está soportado.',
  z64: 'Nintendo 64 todavía no está soportado.',
};

function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function detectSystemFromFileName(fileName: string): DetectSystemResult {
  const extension = getExtension(fileName);

  const system = EXTENSION_TO_SYSTEM[extension];
  if (system) {
    return { ok: true, system };
  }

  if (extension in KNOWN_UNSUPPORTED_REASON) {
    return { ok: false, reason: KNOWN_UNSUPPORTED_REASON[extension] };
  }

  return {
    ok: false,
    reason: 'Este archivo no es una ROM compatible. Elegí un archivo .nes, .sfc o .gba.',
  };
}
