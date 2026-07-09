import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import type { DPadDirection } from '@/lib/emulator/inputMap';
import { useTheme } from '@/lib/theme/ThemeContext';
import { radii } from '@/lib/theme/tokens';

type JoystickProps = {
  size: number;
  onDirectionsChange: (directions: Set<DPadDirection>) => void;
};

const BASE_SIZE = 100;
const THUMB_SIZE = 56;
const MAX_RADIUS = 50;
const DEAD_ZONE = 12;

function directionsFromDelta(dx: number, dy: number): Set<DPadDirection> {
  const next = new Set<DPadDirection>();
  if (dx > DEAD_ZONE) next.add('right');
  if (dx < -DEAD_ZONE) next.add('left');
  if (dy > DEAD_ZONE) next.add('down');
  if (dy < -DEAD_ZONE) next.add('up');
  return next;
}

function sameDirections(a: Set<DPadDirection>, b: Set<DPadDirection>): boolean {
  if (a.size !== b.size) return false;
  for (const direction of a) {
    if (!b.has(direction)) return false;
  }
  return true;
}

export function Joystick({ size, onDirectionsChange }: JoystickProps) {
  const { colors, controllerSkin } = useTheme();
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });
  const activeDirections = useRef<Set<DPadDirection>>(new Set());

  function reportDirections(next: Set<DPadDirection>) {
    if (!sameDirections(activeDirections.current, next)) {
      activeDirections.current = next;
      onDirectionsChange(next);
    }
  }

  function reset() {
    setOrigin(null);
    setThumbOffset({ x: 0, y: 0 });
    reportDirections(new Set());
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setOrigin({ x: locationX, y: locationY });
        setThumbOffset({ x: 0, y: 0 });
      },
      onPanResponderMove: (_evt, gesture) => {
        const distance = Math.sqrt(gesture.dx * gesture.dx + gesture.dy * gesture.dy);
        const clamped = Math.min(distance, MAX_RADIUS);
        const angle = Math.atan2(gesture.dy, gesture.dx);
        setThumbOffset({ x: Math.cos(angle) * clamped, y: Math.sin(angle) * clamped });
        reportDirections(directionsFromDelta(gesture.dx, gesture.dy));
      },
      onPanResponderRelease: reset,
      onPanResponderTerminate: reset,
    })
  ).current;

  // Joystick Skin Presets
  const skinStyles = {
    minimalist: {
      baseBg: colors.accent + '14',
      baseBorder: colors.accent + '40',
      thumbBg: colors.accent + '73',
      thumbBorder: colors.accent + 'b3',
    },
    retro: {
      baseBg: '#C4A05626',
      baseBorder: '#C4A0564d',
      thumbBg: '#8B1E22',
      thumbBorder: '#C4A056',
    },
    translucent: {
      baseBg: 'rgba(255, 255, 255, 0.05)',
      baseBorder: 'rgba(255, 255, 255, 0.15)',
      thumbBg: 'rgba(255, 255, 255, 0.3)',
      thumbBorder: 'rgba(255, 255, 255, 0.5)',
    },
  }[controllerSkin];

  return (
    <View style={[styles.zone, { width: size, height: size }]} {...panResponder.panHandlers}>
      {origin && (
        <View
          style={[
            styles.base,
            {
              left: origin.x - BASE_SIZE / 2,
              top: origin.y - BASE_SIZE / 2,
              backgroundColor: skinStyles.baseBg,
              borderColor: skinStyles.baseBorder,
            },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.thumb,
              {
                transform: [{ translateX: thumbOffset.x }, { translateY: thumbOffset.y }],
                backgroundColor: skinStyles.thumbBg,
                borderColor: skinStyles.thumbBorder,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    justifyContent: 'center',
  },
  base: {
    position: 'absolute',
    width: BASE_SIZE,
    height: BASE_SIZE,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.full,
    borderWidth: 1,
  },
});
