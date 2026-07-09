import { File } from 'expo-file-system';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import type { System } from '@/lib/db/schema';
import {
  buildCommandScript,
  parseBridgeEvent,
  SYSTEM_TO_CORE,
  type BridgeCommand,
  type BridgeEvent,
} from '@/lib/emulator/bridge';
import { buildSimulateInputScript, type TouchInput } from '@/lib/emulator/inputMap';
import { prepareRomForEmulator } from '@/lib/emulator/loadRom';
import { ensureEmulatorAssets } from '@/lib/emulator/provision';
import { colors, spacing, typography } from '@/lib/theme/tokens';

export type EmulatorViewHandle = {
  pause: () => void;
  resume: () => void;
  saveState: () => Promise<string>;
  loadState: (stateBase64: string) => Promise<void>;
  setVolume: (volume: number) => void;
  setPixelSmoothing: (smooth: boolean) => void;
  sendInput: (input: TouchInput, pressed: boolean) => void;
};

type EmulatorViewProps = {
  system: System;
  romUri: string;
  gameName: string;
  onEvent?: (event: BridgeEvent) => void;
};

const STARTED_TIMEOUT_MS = 20000;

function buildHtml(core: string, gameUrl: string, gameName: string): string {
  const safeGameName = JSON.stringify(gameName);
  const safeCore = JSON.stringify(core);
  const safeGameUrl = JSON.stringify(gameUrl);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
  #game { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="game"></div>
<script>
  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }

  ['log', 'warn', 'error'].forEach(function(level) {
    const original = console[level] ? console[level].bind(console) : function() {};
    console[level] = function() {
      const message = Array.prototype.slice.call(arguments).map(String).join(' ');
      post({ type: 'log', level: level, message: message });
      original.apply(console, arguments);
    };
  });

  window.onerror = function(message, source, lineno, colno) {
    post({ type: 'error', message: String(message) + ' @' + source + ':' + lineno + ':' + colno });
  };
  window.addEventListener('unhandledrejection', function(e) {
    post({ type: 'error', message: 'unhandledrejection: ' + e.reason });
  });

  post({ type: 'log', level: 'log', message: 'bootstrap script running' });

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  window.__korabridge = {
    pause: function() {
      if (window.EJS_emulator) window.EJS_emulator.pause();
    },
    resume: function() {
      if (window.EJS_emulator) window.EJS_emulator.play();
    },
    setVolume: function(volume) {
      if (window.EJS_emulator) window.EJS_emulator.setVolume(volume);
    },
    saveState: function() {
      try {
        const state = window.EJS_emulator.gameManager.getState();
        post({ type: 'saveStateResult', stateBase64: bytesToBase64(state) });
      } catch (e) {
        post({ type: 'error', message: 'saveState failed: ' + e });
      }
    },
    loadState: function(base64) {
      try {
        window.EJS_emulator.gameManager.loadState(base64ToBytes(base64));
        post({ type: 'stateLoaded' });
      } catch (e) {
        post({ type: 'error', message: 'loadState failed: ' + e });
      }
    },
    setPixelSmoothing: function(smooth) {
      if (window.EJS_emulator && window.EJS_emulator.canvas) {
        window.EJS_emulator.canvas.style.imageRendering = smooth ? 'auto' : 'pixelated';
      }
    }
  };

  window.EJS_player = '#game';
  window.EJS_gameName = ${safeGameName};
  window.EJS_gameUrl = ${safeGameUrl};
  window.EJS_core = ${safeCore};
  window.EJS_pathtodata = 'data/';
  window.EJS_startOnLoaded = true;
  window.EJS_threads = false;
  window.EJS_disableDatabases = true;
  window.EJS_ready = function() { post({ type: 'ready' }); };
  window.EJS_onGameStart = function() {
    // Kōra draws its own touch controls (components/emulator/TouchControls.tsx);
    // EmulatorJS shows its built-in virtual gamepad automatically once it
    // detects a touch, which would otherwise stack on top of ours.
    if (window.EJS_emulator && window.EJS_emulator.virtualGamepad) {
      window.EJS_emulator.virtualGamepad.style.display = 'none';
    }
    post({ type: 'started' });
  };

  post({ type: 'log', level: 'log', message: 'requesting data/loader.js' });
</script>
<script src="data/loader.js" onerror="post({type:'error', message:'failed to load data/loader.js'})"></script>
</body>
</html>`;
}

export const EmulatorView = forwardRef<EmulatorViewHandle, EmulatorViewProps>(function EmulatorView(
  { system, romUri, gameName, onEvent },
  ref
) {
  const webViewRef = useRef<WebView>(null);
  const [htmlFileUri, setHtmlFileUri] = useState<string | null>(null);
  const [readAccessUrl, setReadAccessUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const pendingSaveState = useRef<((stateBase64: string) => void) | null>(null);
  const pendingLoadState = useRef<(() => void) | null>(null);

  function appendLog(message: string) {
    setLogs((prev) => [...prev.slice(-49), message]);
  }

  function runCommand(command: BridgeCommand) {
    webViewRef.current?.injectJavaScript(buildCommandScript(command));
  }

  useImperativeHandle(ref, () => ({
    pause: () => runCommand({ type: 'pause' }),
    resume: () => runCommand({ type: 'resume' }),
    saveState: () =>
      new Promise<string>((resolve) => {
        pendingSaveState.current = resolve;
        runCommand({ type: 'saveState' });
      }),
    loadState: (stateBase64: string) =>
      new Promise<void>((resolve) => {
        pendingLoadState.current = resolve;
        runCommand({ type: 'loadState', stateBase64 });
      }),
    setVolume: (volume: number) => runCommand({ type: 'setVolume', volume }),
    setPixelSmoothing: (smooth: boolean) => runCommand({ type: 'setPixelSmoothing', smooth }),
    sendInput: (input: TouchInput, pressed: boolean) =>
      webViewRef.current?.injectJavaScript(buildSimulateInputScript(input, pressed)),
  }));

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        appendLog('provisionando assets de EmulatorJS...');
        const dirUri = await ensureEmulatorAssets();
        appendLog(`assets listos en ${dirUri}`);

        appendLog('copiando ROM...');
        const { gameUrl } = await prepareRomForEmulator(romUri, system, dirUri);
        appendLog(`ROM lista: ${gameUrl}`);

        if (cancelled) return;
        const html = buildHtml(SYSTEM_TO_CORE[system], gameUrl, gameName);
        const htmlFile = new File(dirUri, 'game.html');
        htmlFile.write(html);
        appendLog(`HTML escrito en ${htmlFile.uri}, montando WebView...`);
        setReadAccessUrl(dirUri.endsWith('/') ? dirUri : `${dirUri}/`);
        setHtmlFileUri(htmlFile.uri);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        appendLog(`ERROR en setup: ${message}`);
        if (!cancelled) {
          setError(message);
        }
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [romUri, system, gameName]);

  useEffect(() => {
    if (!htmlFileUri || started) return;
    const timeout = setTimeout(() => {
      appendLog(
        `timeout: no llegó el evento 'started' en ${STARTED_TIMEOUT_MS / 1000}s — revisa los logs arriba`
      );
    }, STARTED_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [htmlFileUri, started]);

  function handleMessage(event: WebViewMessageEvent) {
    const bridgeEvent = parseBridgeEvent(event.nativeEvent.data);
    if (!bridgeEvent) {
      appendLog(`mensaje no reconocido: ${event.nativeEvent.data}`);
      return;
    }
    if (bridgeEvent.type === 'log') {
      appendLog(`[${bridgeEvent.level}] ${bridgeEvent.message}`);
    } else if (bridgeEvent.type === 'error') {
      appendLog(`ERROR: ${bridgeEvent.message}`);
      setError(bridgeEvent.message);
    } else {
      appendLog(`evento: ${bridgeEvent.type}`);
      if (bridgeEvent.type === 'started') {
        setStarted(true);
      } else if (bridgeEvent.type === 'saveStateResult') {
        pendingSaveState.current?.(bridgeEvent.stateBase64);
        pendingSaveState.current = null;
      } else if (bridgeEvent.type === 'stateLoaded') {
        pendingLoadState.current?.();
        pendingLoadState.current = null;
      }
    }
    onEvent?.(bridgeEvent);
  }

  const showDiagnostics = !started;

  return (
    <View style={styles.container}>
      {htmlFileUri && readAccessUrl && (
        <WebView
          ref={webViewRef}
          source={{ uri: htmlFileUri }}
          originWhitelist={['*']}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          allowingReadAccessToURL={readAccessUrl}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          onMessage={handleMessage}
          onError={(e) => appendLog(`WebView onError: ${JSON.stringify(e.nativeEvent)}`)}
          onHttpError={(e) => appendLog(`WebView onHttpError: ${JSON.stringify(e.nativeEvent)}`)}
          style={styles.webview}
        />
      )}
      {showDiagnostics && (
        <View style={styles.overlay} pointerEvents="none">
          {error && <Text style={styles.errorText}>{error}</Text>}
          <ScrollView style={styles.logScroll}>
            {logs.map((line, i) => (
              <Text key={i} style={styles.logText}>
                {line}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  logScroll: {
    flex: 1,
  },
  logText: {
    color: colors.text,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
  },
});
