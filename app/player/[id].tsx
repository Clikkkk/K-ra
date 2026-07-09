import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ExitButton } from '@/components/emulator/ExitButton';
import type { EmulatorViewHandle } from '@/components/emulator/EmulatorView';
import { GameCanvas } from '@/components/emulator/GameCanvas';
import { QuickMenu } from '@/components/emulator/QuickMenu';
import { Text, View } from '@/components/Themed';
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
  const [hasSave, setHasSave] = useState(false);
  const [smoothing, setSmoothing] = useState(false);
  const trackerRef = useRef<PlaytimeTracker | null>(null);
  const gameCanvasRef = useRef<EmulatorViewHandle>(null);

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
    };
  }, [id]);

  useEffect(() => {
    hasSaveState(id).then(setHasSave);
  }, [id]);

  async function handleBridgeEvent(event: BridgeEvent) {
    if (event.type === 'started' && gameCanvasRef.current) {
      await loadLatestSaveState(gameCanvasRef.current, id);
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

  async function handleSave() {
    if (!gameCanvasRef.current) return;
    await saveGameState(gameCanvasRef.current, id);
    setHasSave(true);
  }

  async function handleLoad() {
    if (!gameCanvasRef.current) return;
    await loadLatestSaveState(gameCanvasRef.current, id);
    handleCloseMenu();
  }

  function handleToggleSmoothing(value: boolean) {
    setSmoothing(value);
    gameCanvasRef.current?.setPixelSmoothing(value);
  }

  function handleExit() {
    setQuickMenuVisible(false);
    router.back();
  }

  if (game === undefined) {
    return <View style={styles.center} />;
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
      />
      <ExitButton />
      <QuickMenu
        visible={quickMenuVisible}
        onClose={handleCloseMenu}
        onSave={handleSave}
        onLoad={handleLoad}
        onExit={handleExit}
        hasSaveState={hasSave}
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
