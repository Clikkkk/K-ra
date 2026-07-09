import type { System } from '@/lib/db/schema';

export const SYSTEM_TO_CORE: Record<System, string> = {
  nes: 'fceumm',
  snes: 'snes9x',
  gba: 'mgba',
};

export type BridgeCommand =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'saveState' }
  | { type: 'loadState'; stateBase64: string }
  | { type: 'setVolume'; volume: number };

export type BridgeEvent =
  | { type: 'ready' }
  | { type: 'started' }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'saveStateResult'; stateBase64: string }
  | { type: 'stateLoaded' }
  | { type: 'error'; message: string }
  | { type: 'log'; level: 'log' | 'warn' | 'error'; message: string };

export function buildCommandScript(command: BridgeCommand): string {
  switch (command.type) {
    case 'pause':
      return 'window.__korabridge && window.__korabridge.pause(); true;';
    case 'resume':
      return 'window.__korabridge && window.__korabridge.resume(); true;';
    case 'setVolume':
      return `window.__korabridge && window.__korabridge.setVolume(${JSON.stringify(command.volume)}); true;`;
    case 'saveState':
      return 'window.__korabridge && window.__korabridge.saveState(); true;';
    case 'loadState':
      return `window.__korabridge && window.__korabridge.loadState(${JSON.stringify(command.stateBase64)}); true;`;
  }
}

export function parseBridgeEvent(raw: string): BridgeEvent | null {
  try {
    const data = JSON.parse(raw);
    if (data && typeof data.type === 'string') {
      return data as BridgeEvent;
    }
  } catch {
    // ignore malformed messages from the WebView
  }
  return null;
}
