import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { System } from '@/lib/db/schema';
import {
  SYSTEM_FACE_BUTTONS,
  type DPadDirection,
  type FaceButton,
  type TouchInput,
} from '@/lib/emulator/inputMap';
import { useTheme } from '@/lib/theme/ThemeContext';
// tokenColors is the static token set for use in module-scope StyleSheet.create
// blocks, which can't call useTheme(). Only background/surface/border/text/
// textMuted are safe here — accent/accentMuted DO vary per accent theme and
// must come from useTheme().colors in dynamic (inline) styles instead.
import { colors as tokenColors, radii, spacing, typography } from '@/lib/theme/tokens';

import { Joystick } from './Joystick';

type TouchControlsProps = {
  system: System;
  onInput: (input: TouchInput, pressed: boolean) => void;
  onMenuPress: () => void;
  isLandscape?: boolean;
  onFastForwardPress?: () => void;
  onRewindPress?: () => void;
  isFastForwardActive?: boolean;
  canRewind?: boolean;
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
  const { colors, controllerSkin } = useTheme();

  // Button style specs per controller skin
  const skinSpecs = {
    minimalist: {
      bg: colors.accent + '2d', // 18% opacity
      border: colors.accent + '73', // 45% opacity
      pressedBg: colors.accent + '8c', // 55% opacity
      pressedBorder: colors.accent,
      labelColor: colors.text,
    },
    retro: {
      bg: '#8B1E22', // maroon
      border: '#C4A056', // gold
      pressedBg: '#6B1215',
      pressedBorder: '#E5BE6C',
      labelColor: '#C4A056',
    },
    translucent: {
      bg: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.2)',
      pressedBg: 'rgba(255, 255, 255, 0.25)',
      pressedBorder: 'rgba(255, 255, 255, 0.6)',
      labelColor: '#FFFFFF',
    },
  }[controllerSkin];

  return (
    <Pressable
      onPressIn={() => onInput(input, true)}
      onPressOut={() => onInput(input, false)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? skinSpecs.pressedBg : skinSpecs.bg,
          borderColor: pressed ? skinSpecs.pressedBorder : skinSpecs.border,
          transform: pressed ? [{ scale: 0.95 }] : [],
        },
        style,
      ]}
    >
      <Text style={[styles.buttonLabel, { color: skinSpecs.labelColor }]}>{label}</Text>
    </Pressable>
  );
}

// Diagonal offsets for the face-button cluster, keyed by how many buttons the
// system has, so adjacent buttons don't sit close enough to double-touch by
// accident.
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

export function TouchControls({
  system,
  onInput,
  onMenuPress,
  isLandscape = false,
  onFastForwardPress,
  onRewindPress,
  isFastForwardActive = false,
  canRewind = false,
}: TouchControlsProps) {
  const { colors } = useTheme();
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

  if (isLandscape) {
    return (
      <View style={styles.containerLandscape} pointerEvents="box-none">
        {/* Left Column: L-Shoulder and Joystick */}
        <View style={styles.columnLandscape} pointerEvents="box-none">
          {left ? (
            <TouchButton
              input={left}
              label="L"
              onInput={onInput}
              style={styles.shoulderButtonLandscape}
            />
          ) : (
            <View style={styles.emptyHeaderButton} />
          )}
          <View style={styles.spacerLandscape} pointerEvents="none" />
          <Joystick size={120} onDirectionsChange={handleDirectionsChange} />
        </View>

        {/* Center Column: System row floating at the top */}
        <View style={styles.centerColumnLandscape} pointerEvents="box-none">
          <View style={styles.systemRowLandscape}>
            {onRewindPress && (
              <Pressable
                style={[styles.utilityButtonLandscape, !canRewind && { opacity: 0.35 }]}
                onPress={onRewindPress}
                disabled={!canRewind}
              >
                <Ionicons name="play-back-outline" size={14} color={colors.text} />
              </Pressable>
            )}

            {systemButtons.map((button) => (
              <TouchButton
                key={button}
                input={button}
                label={BUTTON_LABEL[button]}
                onInput={onInput}
                style={styles.systemButtonLandscape}
              />
            ))}
            <Pressable style={styles.menuButtonLandscape} onPress={onMenuPress}>
              <Ionicons name="menu-outline" size={14} color={colors.text} />
            </Pressable>

            {onFastForwardPress && (
              <Pressable
                style={[
                  styles.utilityButtonLandscape,
                  isFastForwardActive && { backgroundColor: colors.accent },
                ]}
                onPress={onFastForwardPress}
              >
                <Ionicons
                  name="play-forward-outline"
                  size={14}
                  color={isFastForwardActive ? '#15140F' : colors.text}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Right Column: R-Shoulder and Actions */}
        <View style={styles.columnLandscape} pointerEvents="box-none">
          {right ? (
            <TouchButton
              input={right}
              label="R"
              onInput={onInput}
              style={styles.shoulderButtonLandscape}
            />
          ) : (
            <View style={styles.emptyHeaderButton} />
          )}
          <View style={styles.spacerLandscape} pointerEvents="none" />
          <ActionButtons buttons={actionButtons} onInput={onInput} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Row 1: Shoulder Buttons spanning the left and right edges */}
      <View style={styles.shoulderRow}>
        {left ? (
          <TouchButton input={left} label="L" onInput={onInput} style={styles.shoulderButton} />
        ) : (
          <View style={styles.shoulderButtonPlaceholder} />
        )}
        {right ? (
          <TouchButton input={right} label="R" onInput={onInput} style={styles.shoulderButton} />
        ) : (
          <View style={styles.shoulderButtonPlaceholder} />
        )}
      </View>

      {/* Row 2: Centered, clean system buttons select / start / menu */}
      <View style={styles.systemRow}>
        {onRewindPress && (
          <Pressable
            style={[styles.utilityButton, !canRewind && { opacity: 0.35 }]}
            onPress={onRewindPress}
            disabled={!canRewind}
          >
            <Ionicons name="play-back-outline" size={14} color={colors.text} />
          </Pressable>
        )}

        {systemButtons.map((button) => (
          <TouchButton
            key={button}
            input={button}
            label={BUTTON_LABEL[button]}
            onInput={onInput}
            style={styles.systemButton}
          />
        ))}
        <Pressable style={styles.menuButton} onPress={onMenuPress}>
          <Ionicons name="menu-outline" size={14} color={colors.text} />
        </Pressable>

        {onFastForwardPress && (
          <Pressable
            style={[
              styles.utilityButton,
              isFastForwardActive && { backgroundColor: colors.accent },
            ]}
            onPress={onFastForwardPress}
          >
            <Ionicons
              name="play-forward-outline"
              size={14}
              color={isFastForwardActive ? '#15140F' : colors.text}
            />
          </Pressable>
        )}
      </View>

      {/* Row 3: Gamepad inputs (Joystick and Action Buttons) */}
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
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  shoulderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  shoulderButton: {
    width: 72,
    height: 32,
    borderRadius: radii.sm,
  },
  shoulderButtonPlaceholder: {
    width: 72,
    height: 32,
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  systemButton: {
    width: 60,
    height: 26,
    borderRadius: radii.full,
  },
  menuButton: {
    width: 28,
    height: 26,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    borderWidth: 1.5,
  },
  buttonLabel: {
    fontWeight: typography.weight.bold,
    fontSize: 11,
  },
  // Landscape Styles
  containerLandscape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  columnLandscape: {
    width: 140,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  centerColumnLandscape: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  systemRowLandscape: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: 'rgba(21, 20, 15, 0.85)',
    padding: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: tokenColors.border,
  },
  shoulderButtonLandscape: {
    width: 72,
    height: 36,
    borderRadius: radii.sm,
  },
  systemButtonLandscape: {
    width: 60,
    height: 28,
    borderRadius: radii.full,
  },
  menuButtonLandscape: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  spacerLandscape: {
    flex: 1,
  },
  emptyHeaderButton: {
    width: 72,
    height: 36,
  },
  utilityButton: {
    width: 28,
    height: 26,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  utilityButtonLandscape: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
