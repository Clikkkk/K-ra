import * as ScreenOrientation from 'expo-screen-orientation';
import { forwardRef, useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { BridgeEvent } from '@/lib/emulator/bridge';
import type { System } from '@/lib/db/schema';
import { colors } from '@/lib/theme/tokens';

import { EmulatorView, type EmulatorViewHandle } from './EmulatorView';

const ASPECT_RATIO: Record<System, number> = {
  nes: 4 / 3,
  snes: 4 / 3,
  gba: 3 / 2,
};

type GameCanvasProps = {
  system: System;
  romUri: string;
  gameName: string;
  onEvent?: (event: BridgeEvent) => void;
};

export const GameCanvas = forwardRef<EmulatorViewHandle, GameCanvasProps>(function GameCanvas(
  { system, romUri, gameName, onEvent },
  ref
) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const aspectRatio = ASPECT_RATIO[system];

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  let width = windowWidth;
  let height = width / aspectRatio;
  if (height > windowHeight) {
    height = windowHeight;
    width = height * aspectRatio;
  }

  return (
    <View style={styles.container}>
      <View style={{ width, height }}>
        <EmulatorView
          ref={ref}
          system={system}
          romUri={romUri}
          gameName={gameName}
          onEvent={onEvent}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
