import type { System } from '@/lib/db/schema';

export type DPadDirection = 'up' | 'down' | 'left' | 'right';
export type FaceButton = 'a' | 'b' | 'x' | 'y' | 'l' | 'r' | 'start' | 'select';
export type TouchInput = DPadDirection | FaceButton;

// libretro RETRO_DEVICE_ID_JOYPAD_* indices, as used by EmulatorJS's own
// input handling (gameManager.simulateInput(player, id, value)).
const DPAD_INPUT_VALUE: Record<DPadDirection, number> = {
  up: 4,
  down: 5,
  left: 6,
  right: 7,
};

const FACE_BUTTON_INPUT_VALUE: Record<FaceButton, number> = {
  b: 0,
  y: 1,
  select: 2,
  start: 3,
  a: 8,
  x: 9,
  l: 10,
  r: 11,
};

export function inputValueFor(input: TouchInput): number {
  return input in FACE_BUTTON_INPUT_VALUE
    ? FACE_BUTTON_INPUT_VALUE[input as FaceButton]
    : DPAD_INPUT_VALUE[input as DPadDirection];
}

// Face/shoulder buttons shown per system, matching real hardware layouts.
export const SYSTEM_FACE_BUTTONS: Record<System, FaceButton[]> = {
  nes: ['b', 'a', 'select', 'start'],
  snes: ['y', 'x', 'l', 'r', 'b', 'a', 'select', 'start'],
  gba: ['b', 'a', 'l', 'r', 'select', 'start'],
};

export function buildSimulateInputScript(input: TouchInput, pressed: boolean): string {
  const value = inputValueFor(input);
  return `window.EJS_emulator && window.EJS_emulator.gameManager && window.EJS_emulator.gameManager.simulateInput(0, ${value}, ${pressed ? 1 : 0}); true;`;
}
