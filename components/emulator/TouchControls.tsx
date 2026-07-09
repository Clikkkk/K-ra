import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { System } from '@/lib/db/schema';
import {
  SYSTEM_FACE_BUTTONS,
  type DPadDirection,
  type FaceButton,
  type TouchInput,
} from '@/lib/emulator/inputMap';
import { colors, radii, spacing, typography } from '@/lib/theme/tokens';

import { Joystick } from './Joystick';

type TouchControlsProps = {
  system: System;
  onInput: (input: TouchInput, pressed: boolean) => void;
};

const BUTTON_LABEL: Record<FaceButton, string> = {
  a: 'A',
  b: 'B',
  x: 'X',
  y: 'Y',
  l: 'L',
  r: 'R',
  start: 'Start',
  select: 'Select',
};

function TouchButton({
  input,
  label,
  onInput,
  style,
}: {
  input: TouchInput;
  label: string;
  onInput: TouchControlsProps['onInput'];
  style?: object;
}) {
  return (
    <Pressable
      onPressIn={() => onInput(input, true)}
      onPressOut={() => onInput(input, false)}
      style={[styles.button, style]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

// Diagonal offsets for the face-button cluster, keyed by how many buttons the
// system has, so adjacent buttons don't sit close enough to double-touch by
// accident (e.g. B is placed above A, matching the user's explicit request).
const TWO_BUTTON_LAYOUT: Partial<Record<FaceButton, object>> = {
  b: { marginBottom: 28 },
  a: { marginTop: 28 },
};

const FOUR_BUTTON_DIAMOND: Partial<Record<FaceButton, object>> = {
  x: { position: 'absolute', top: 0, left: 44 },
  y: { position: 'absolute', top: 44, left: 0 },
  a: { position: 'absolute', top: 44, left: 88 },
  b: { position: 'absolute', top: 88, left: 44 },
};

function ActionButtons({
  buttons,
  onInput,
}: {
  buttons: FaceButton[];
  onInput: TouchControlsProps['onInput'];
}) {
  if (buttons.length === 4) {
    return (
      <View style={styles.diamondCluster}>
        {buttons.map((button) => (
          <TouchButton
            key={button}
            input={button}
            label={BUTTON_LABEL[button]}
            onInput={onInput}
            style={FOUR_BUTTON_DIAMOND[button]}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.actionCluster}>
      {buttons.map((button) => (
        <TouchButton
          key={button}
          input={button}
          label={BUTTON_LABEL[button]}
          onInput={onInput}
          style={TWO_BUTTON_LAYOUT[button]}
        />
      ))}
    </View>
  );
}

export function TouchControls({ system, onInput }: TouchControlsProps) {
  const buttons = SYSTEM_FACE_BUTTONS[system];
  const shoulderButtons = buttons.filter((b): b is 'l' | 'r' => b === 'l' || b === 'r');
  const actionButtons = buttons.filter(
    (b): b is FaceButton => b !== 'l' && b !== 'r' && b !== 'start' && b !== 'select'
  );
  const systemButtons = buttons.filter(
    (b): b is 'start' | 'select' => b === 'start' || b === 'select'
  );

  const activeDpadDirections = useRef<Set<DPadDirection>>(new Set());

  function handleDirectionsChange(next: Set<DPadDirection>) {
    const prev = activeDpadDirections.current;
    for (const direction of prev) {
      if (!next.has(direction)) onInput(direction, false);
    }
    for (const direction of next) {
      if (!prev.has(direction)) onInput(direction, true);
    }
    activeDpadDirections.current = next;
  }

  const left = shoulderButtons.find((b) => b === 'l');
  const right = shoulderButtons.find((b) => b === 'r');

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {left ? (
          <TouchButton input={left} label="L" onInput={onInput} style={styles.shoulderButton} />
        ) : (
          <View style={styles.shoulderButton} />
        )}

        <View style={styles.systemRow}>
          {systemButtons.map((button) => (
            <TouchButton
              key={button}
              input={button}
              label={BUTTON_LABEL[button]}
              onInput={onInput}
              style={styles.systemButton}
            />
          ))}
        </View>

        {right ? (
          <TouchButton input={right} label="R" onInput={onInput} style={styles.shoulderButton} />
        ) : (
          <View style={styles.shoulderButton} />
        )}
      </View>

      <View style={styles.mainRow}>
        <Joystick size={140} onDirectionsChange={handleDirectionsChange} />
        <ActionButtons buttons={actionButtons} onInput={onInput} />
      </View>
    </View>
  );
}

const BUTTON_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  shoulderButton: {
    width: 64,
    height: 36,
    borderRadius: radii.sm,
  },
  systemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  systemButton: {
    width: 64,
    height: 30,
    borderRadius: radii.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  actionCluster: {
    width: BUTTON_SIZE * 2 + spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  diamondCluster: {
    width: 132,
    height: 132,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 108, 246, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonLabel: {
    color: colors.text,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
});
