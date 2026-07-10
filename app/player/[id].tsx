import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { ExitButton } from '@/components/emulator/ExitButton';
import type { EmulatorViewHandle } from '@/components/emulator/EmulatorView';
import { GameCanvas } from '@/components/emulator/GameCanvas';
import { QuickMenu } from '@/components/emulator/QuickMenu';
import { Text, View } from '@/components/Themed';
import { LoadingState } from '@/components/ui/LoadingState';
import { getGameById, markGamePlayed } from '@/lib/db/games';
import type { Game } from '@/lib/db/schema';
import type { BridgeEvent } from '@/lib/emulator/bridge';
import { hasSaveState, loadLatestSaveState } from '@/lib/emulator/loadState';
import { PlaytimeTracker } from '@/lib/emulator/playtimeTracker';
import { saveGameState } from '@/lib/emulator/saveState';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [quickMenuVisible, setQuickMenuVisible] = useState(false);
  const [saveSlotsExist, setSaveSlotsExist] = useState<boolean[]>([false, false, false]);
  const [smoothing, setSmoothing] = useState(false);
  const [isFastForwardActive, setIsFastForwardActive] = useState(false);
  const [canRewind, setCanRewind] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const trackerRef = useRef<PlaytimeTracker | null>(null);
  const gameCanvasRef = useRef<EmulatorViewHandle>(null);
  const rewindBuffer = useRef<string[]>([]);
  const rewindIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quickMenuVisibleRef = useRef(false);

  const checkSaveSlots = useCallback(async () => {
    const results = await Promise.all([
      hasSaveState(id, 0),
      hasSaveState(id, 1),
      hasSaveState(id, 2),
    ]);
    setSaveSlotsExist(results);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    getGameById(id).then((result) => {
      if (!cancelled) setGame(result);
      if (result) markGamePlayed(result.id);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    trackerRef.current = new PlaytimeTracker(id);
    return () => {
      trackerRef.current?.stop();
      if (rewindIntervalRef.current) {
        clearInterval(rewindIntervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    checkSaveSlots();
  }, [id, checkSaveSlots]);

  useEffect(() => {
    quickMenuVisibleRef.current = quickMenuVisible;
  }, [quickMenuVisible]);

  async function handleBridgeEvent(event: BridgeEvent) {
    if (event.type === 'started' && gameCanvasRef.current) {
      // Load slot 0 (primary slot) state by default, unless this 'started'
      // event came from a manual restart (which should boot clean, not
      // reload the last save).
      if (!event.isRestart) {
        await loadLatestSaveState(gameCanvasRef.current, id, 0);
      }

      // Start the 2-second automatic rewind buffer interval
      if (rewindIntervalRef.current) {
        clearInterval(rewindIntervalRef.current);
      }
      rewindBuffer.current = [];
      setCanRewind(false);

      rewindIntervalRef.current = setInterval(async () => {
        // Record only when playing normally (quick menu not visible)
        if (gameCanvasRef.current && !quickMenuVisibleRef.current) {
          try {
            const state = await gameCanvasRef.current.saveState();
            if (state) {
              rewindBuffer.current.push(state);
              // Maintain maximum 6 states (lasts around 10-12 seconds of gameplay)
              if (rewindBuffer.current.length > 6) {
                rewindBuffer.current.shift();
              }
              setCanRewind(rewindBuffer.current.length > 1);
            }
          } catch {
            // ignore errors if the core is not fully loaded/interactive
          }
        }
      }, 2000);
    }
  }

  function handleMenuPress() {
    gameCanvasRef.current?.pause();
    setQuickMenuVisible(true);
  }

  function handleCloseMenu() {
    gameCanvasRef.current?.resume();
    setQuickMenuVisible(false);
  }

  async function handleSave(slot: number) {
    if (!gameCanvasRef.current) return;
    await saveGameState(gameCanvasRef.current, id, slot);
    await checkSaveSlots();
  }

  async function handleLoad(slot: number) {
    if (!gameCanvasRef.current) return;
    await loadLatestSaveState(gameCanvasRef.current, id, slot);
    // Reset rewind buffer on manual save load
    rewindBuffer.current = [];
    setCanRewind(false);
    handleCloseMenu();
  }

  function handleRestart() {
    if (!gameCanvasRef.current) return;
    if (rewindIntervalRef.current) {
      clearInterval(rewindIntervalRef.current);
      rewindIntervalRef.current = null;
    }
    gameCanvasRef.current.restart();
    rewindBuffer.current = [];
    setCanRewind(false);
    handleCloseMenu();
  }

  function handleToggleSmoothing(value: boolean) {
    setSmoothing(value);
    gameCanvasRef.current?.setPixelSmoothing(value);
  }

  function handleFastForwardPress() {
    if (!gameCanvasRef.current) return;
    const next = !isFastForwardActive;
    gameCanvasRef.current.setFastForward(next);
    setIsFastForwardActive(next);
  }

  async function handleRewindPress() {
    if (!gameCanvasRef.current || rewindBuffer.current.length <= 1) return;

    // Discard the current moment's state
    rewindBuffer.current.pop();
    // Retrieve the state from 2 seconds ago
    const targetState = rewindBuffer.current[rewindBuffer.current.length - 1];

    if (targetState) {
      try {
        await gameCanvasRef.current.loadState(targetState);
        setCanRewind(rewindBuffer.current.length > 1);
      } catch (e) {
        console.warn('[PlayerScreen] Failed to load rewind state:', e);
      }
    }
  }

  function handleExit() {
    if (rewindIntervalRef.current) {
      clearInterval(rewindIntervalRef.current);
    }
    setQuickMenuVisible(false);
    router.back();
  }

  if (game === undefined) {
    return <LoadingState />;
  }

  if (game === null) {
    return (
      <View style={styles.center}>
        <Text>Juego no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameCanvas
        ref={gameCanvasRef}
        system={game.system}
        romUri={game.file_uri}
        gameName={game.title}
        onEvent={handleBridgeEvent}
        onMenuPress={handleMenuPress}
        onFastForwardPress={handleFastForwardPress}
        onRewindPress={handleRewindPress}
        isFastForwardActive={isFastForwardActive}
        canRewind={canRewind}
      />
      {!isLandscape && <ExitButton />}
      <QuickMenu
        visible={quickMenuVisible}
        onClose={handleCloseMenu}
        onSave={handleSave}
        onLoad={handleLoad}
        onRestart={handleRestart}
        onExit={handleExit}
        saveSlotsExist={saveSlotsExist}
        smoothing={smoothing}
        onToggleSmoothing={handleToggleSmoothing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
