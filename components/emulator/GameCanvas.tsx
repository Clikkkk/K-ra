import * as ScreenOrientation from 'expo-screen-orientation';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { System } from '@/lib/db/schema';
import type { BridgeEvent } from '@/lib/emulator/bridge';
import { colors } from '@/lib/theme/tokens';

import { EmulatorView, type EmulatorViewHandle } from './EmulatorView';
import { TouchControls } from './TouchControls';

const ASPECT_RATIO: Record<System, number> = {
  nes: 4 / 3,
  snes: 4 / 3,
  gba: 3 / 2,
};

const CONTROLS_HEIGHT = 260;

type GameCanvasProps = {
  system: System;
  romUri: string;
  gameName: string;
  onEvent?: (event: BridgeEvent) => void;
  onMenuPress: () => void;
  onFastForwardPress?: () => void;
  onRewindPress?: () => void;
  isFastForwardActive?: boolean;
  canRewind?: boolean;
};

export const GameCanvas = forwardRef<EmulatorViewHandle, GameCanvasProps>(function GameCanvas(
  {
    system,
    romUri,
    gameName,
    onEvent,
    onMenuPress,
    onFastForwardPress,
    onRewindPress,
    isFastForwardActive = false,
    canRewind = false,
  },
  ref
) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const aspectRatio = ASPECT_RATIO[system];
  const emulatorRef = useRef<EmulatorViewHandle>(null);

  useImperativeHandle(ref, () => ({
    pause: () => emulatorRef.current?.pause(),
    resume: () => emulatorRef.current?.resume(),
    saveState: () =>
      emulatorRef.current?.saveState() ?? Promise.reject(new Error('Emulator not ready')),
    loadState: (stateBase64: string) =>
      emulatorRef.current?.loadState(stateBase64) ??
      Promise.reject(new Error('Emulator not ready')),
    setVolume: (volume: number) => emulatorRef.current?.setVolume(volume),
    setPixelSmoothing: (smooth: boolean) => emulatorRef.current?.setPixelSmoothing(smooth),
    sendInput: (input, pressed) => emulatorRef.current?.sendInput(input, pressed),
    toggleFastForward: () => emulatorRef.current?.toggleFastForward(),
    restart: () => emulatorRef.current?.restart(),
  }));

  useEffect(() => {
    // Unlock to allow landscape rotation
    ScreenOrientation.unlockAsync();
    return () => {
      // Re-lock to portrait when leaving the gameplay view
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const isLandscape = windowWidth > windowHeight;

  const availableGameHeight = isLandscape
    ? windowHeight
    : Math.max(windowHeight - CONTROLS_HEIGHT, 0);
  let gameWidth = isLandscape ? windowHeight * aspectRatio : windowWidth;
  let gameHeight = gameWidth / aspectRatio;

  if (gameHeight > availableGameHeight) {
    gameHeight = availableGameHeight;
    gameWidth = gameHeight * aspectRatio;
  }

  if (isLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.gameAreaLandscape}>
          <View style={{ width: gameWidth, height: gameHeight }}>
            <EmulatorView
              ref={emulatorRef}
              system={system}
              romUri={romUri}
              gameName={gameName}
              onEvent={onEvent}
            />
          </View>
        </View>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <TouchControls
            system={system}
            onInput={(input, pressed) => emulatorRef.current?.sendInput(input, pressed)}
            onMenuPress={onMenuPress}
            isLandscape={true}
            onFastForwardPress={onFastForwardPress}
            onRewindPress={onRewindPress}
            isFastForwardActive={isFastForwardActive}
            canRewind={canRewind}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        <View style={{ width: gameWidth, height: gameHeight }}>
          <EmulatorView
            ref={emulatorRef}
            system={system}
            romUri={romUri}
            gameName={gameName}
            onEvent={onEvent}
          />
        </View>
      </View>
      <View style={[styles.controlsArea, { height: CONTROLS_HEIGHT }]}>
        <TouchControls
          system={system}
          onInput={(input, pressed) => emulatorRef.current?.sendInput(input, pressed)}
          onMenuPress={onMenuPress}
          onFastForwardPress={onFastForwardPress}
          onRewindPress={onRewindPress}
          isFastForwardActive={isFastForwardActive}
          canRewind={canRewind}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameAreaLandscape: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsArea: {
    justifyContent: 'center',
  },
});
