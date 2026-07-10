import { File } from 'expo-file-system';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
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
import { colors, radii, spacing } from '@/lib/theme/tokens';

import { ErrorState } from '@/components/ui/ErrorState';

export type EmulatorViewHandle = {
  pause: () => void;
  resume: () => void;
  saveState: () => Promise<string>;
  loadState: (stateBase64: string) => Promise<void>;
  setVolume: (volume: number) => void;
  setPixelSmoothing: (smooth: boolean) => void;
  sendInput: (input: TouchInput, pressed: boolean) => void;
  setFastForward: (active: boolean) => void;
  restart: () => void;
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
  canvas {
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
</style>
</head>
<body>
<div id="game"></div>
<div id="unmute-overlay" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(21,20,15,0.95);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="background:#C9834A;padding:12px 24px;border-radius:24px;color:#ffffff;font-weight:bold;font-size:13px;box-shadow:0 8px 16px rgba(0,0,0,0.4);letter-spacing:0.8px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
    🔊 ACTIVAR SONIDO
  </div>
  <span style="color:#A6A295;font-size:10px;letter-spacing:0.5px;text-transform:uppercase;">Toca la pantalla para habilitar el audio</span>
</div>
<script>
  // Intercept and auto-resume AudioContext to bypass mobile WebView autoplay constraints
  (function() {
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    if (!OriginalAudioContext) return;
    
    const activeContexts = [];
    
    function NewAudioContext(options) {
      const context = new OriginalAudioContext(options);
      activeContexts.push(context);
      
      const tryResume = function() {
        if (context.state === 'suspended') {
          context.resume().catch(function(){});
        }
      };
      
      context.onstatechange = tryResume;
      setTimeout(tryResume, 100);
      return context;
    }
    
    NewAudioContext.prototype = OriginalAudioContext.prototype;
    
    window.AudioContext = NewAudioContext;
    window.webkitAudioContext = NewAudioContext;
    
    setInterval(function() {
      activeContexts.forEach(function(ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(function(){});
        }
      });
      if (window.EJS_emulator && window.EJS_emulator.audioContext) {
        if (window.EJS_emulator.audioContext.state === 'suspended') {
          window.EJS_emulator.audioContext.resume().catch(function(){});
        }
      }
    }, 500);

    // Unmute overlay listener for direct user touch activation on mobile Safari WKWebView
    const unmuteOverlay = document.getElementById('unmute-overlay');
    if (unmuteOverlay) {
      const handleUnmute = function(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        activeContexts.forEach(function(ctx) {
          ctx.resume().catch(function(){});
        });
        if (window.EJS_emulator && window.EJS_emulator.audioContext) {
          window.EJS_emulator.audioContext.resume().catch(function(){});
        }
        unmuteOverlay.style.display = 'none';
      };
      unmuteOverlay.addEventListener('click', handleUnmute);
      unmuteOverlay.addEventListener('touchstart', handleUnmute);
    }
  })();

  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }



  window.onerror = function(message, source, lineno, colno) {
    post({ type: 'error', message: String(message) + ' @' + source + ':' + lineno + ':' + colno });
  };
  // Rejected promises are not treated as fatal: iOS WKWebView routinely
  // rejects AudioContext.resume() with NotAllowedError until the user makes
  // a direct gesture (handled by the unmute overlay below), which is normal
  // and not a reason to kill the whole session.
  window.addEventListener('unhandledrejection', function(e) {
    post({ type: 'log', level: 'warn', message: 'unhandledrejection: ' + e.reason });
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
      if (!window.EJS_emulator || !window.EJS_emulator.gameManager) {
        // Still reply (with an empty result) so the native side's FIFO
        // request queue doesn't get stuck waiting on this call forever.
        post({ type: 'log', level: 'warn', message: 'saveState skipped: core not ready yet' });
        post({ type: 'saveStateResult', stateBase64: '' });
        return;
      }
      try {
        const state = window.EJS_emulator.gameManager.getState();
        post({ type: 'saveStateResult', stateBase64: bytesToBase64(state) });
      } catch (e) {
        post({ type: 'error', message: 'saveState failed: ' + e });
      }
    },
    loadState: function(base64) {
      if (!window.EJS_emulator || !window.EJS_emulator.gameManager) {
        post({ type: 'log', level: 'warn', message: 'loadState skipped: core not ready yet' });
        post({ type: 'stateLoaded' });
        return;
      }
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
    },
    setFastForward: function(active) {
      const ev = new KeyboardEvent(active ? 'keydown' : 'keyup', {
        key: ' ',
        code: 'Space',
        keyCode: 32,
        which: 32,
        bubbles: true
      });
      document.dispatchEvent(ev);
    }
  };

  window.EJS_player = '#game';
  window.EJS_gameName = ${safeGameName};
  window.EJS_gameUrl = ${safeGameUrl};
  window.EJS_core = ${safeCore};
  window.EJS_pathtodata = 'data/';
  window.EJS_startOnLoaded = true;
  window.EJS_threads = false;
  window.EJS_volume = 1.0;
  window.EJS_disableDatabases = true;
  window.EJS_disableAutoLang = true;
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
  const [retryCount, setRetryCount] = useState(0);
  const pendingSaveStates = useRef<((stateBase64: string) => void)[]>([]);
  const pendingLoadStates = useRef<(() => void)[]>([]);
  const isRestartingRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (!started && !error) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.75,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    }
    return () => {
      anim?.stop();
    };
  }, [started, error, pulseAnim]);

  function appendLog(message: string) {
    if (__DEV__) {
      console.log(`[EmulatorView] ${message}`);
    }
  }

  function runCommand(command: BridgeCommand) {
    webViewRef.current?.injectJavaScript(buildCommandScript(command));
  }

  useImperativeHandle(ref, () => ({
    pause: () => runCommand({ type: 'pause' }),
    resume: () => runCommand({ type: 'resume' }),
    saveState: () =>
      new Promise<string>((resolve) => {
        pendingSaveStates.current.push(resolve);
        runCommand({ type: 'saveState' });
      }),
    loadState: (stateBase64: string) =>
      new Promise<void>((resolve) => {
        pendingLoadStates.current.push(resolve);
        runCommand({ type: 'loadState', stateBase64 });
      }),
    setVolume: (volume: number) => runCommand({ type: 'setVolume', volume }),
    setPixelSmoothing: (smooth: boolean) => runCommand({ type: 'setPixelSmoothing', smooth }),
    sendInput: (input: TouchInput, pressed: boolean) =>
      webViewRef.current?.injectJavaScript(buildSimulateInputScript(input, pressed)),
    setFastForward: (active: boolean) => runCommand({ type: 'setFastForward', active }),
    restart: () => {
      isRestartingRef.current = true;
      setStarted(false);
      setError(null);
      webViewRef.current?.reload();
    },
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
  }, [romUri, system, gameName, retryCount]);

  function handleRetry() {
    setError(null);
    setStarted(false);
    setHtmlFileUri(null);
    setRetryCount((count) => count + 1);
  }

  useEffect(() => {
    if (!htmlFileUri || started) return;
    const timeout = setTimeout(() => {
      const message = `Tiempo de espera agotado esperando el evento 'started' (${STARTED_TIMEOUT_MS / 1000}s)`;
      appendLog(`timeout: ${message} — revisa los logs arriba`);
      setError(message);
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
      onEvent?.(bridgeEvent);
      return;
    }
    if (bridgeEvent.type === 'error') {
      appendLog(`ERROR: ${bridgeEvent.message}`);
      setError(bridgeEvent.message);
      onEvent?.(bridgeEvent);
      return;
    }
    appendLog(`evento: ${bridgeEvent.type}`);
    if (bridgeEvent.type === 'started') {
      setStarted(true);
      const wasRestart = isRestartingRef.current;
      isRestartingRef.current = false;
      onEvent?.(wasRestart ? { ...bridgeEvent, isRestart: true } : bridgeEvent);
      return;
    }
    if (bridgeEvent.type === 'saveStateResult') {
      pendingSaveStates.current.shift()?.(bridgeEvent.stateBase64);
    } else if (bridgeEvent.type === 'stateLoaded') {
      pendingLoadStates.current.shift()?.();
    }
    onEvent?.(bridgeEvent);
  }

  const showLoading = !started && !error;
  const showProdError = !!error;

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
          allowsInlineMediaPlayback={true}
          onMessage={handleMessage}
          onError={(e) => appendLog(`WebView onError: ${JSON.stringify(e.nativeEvent)}`)}
          onHttpError={(e) => appendLog(`WebView onHttpError: ${JSON.stringify(e.nativeEvent)}`)}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          style={styles.webview}
        />
      )}
      {showLoading && (
        <View style={styles.overlay}>
          <View style={styles.skeletonContainer}>
            <Animated.View style={[styles.skeletonScreen, { opacity: pulseAnim }]} />
            <View style={styles.skeletonControls}>
              <View style={styles.skeletonLeft}>
                <Animated.View style={[styles.skeletonCircle, { opacity: pulseAnim }]} />
              </View>
              <View style={styles.skeletonCenter}>
                <Animated.View style={[styles.skeletonPill, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonPill, { opacity: pulseAnim }]} />
              </View>
              <View style={styles.skeletonRight}>
                <View style={styles.skeletonDiamond}>
                  <Animated.View style={[styles.skeletonBtn, { opacity: pulseAnim }]} />
                  <Animated.View style={[styles.skeletonBtn, { opacity: pulseAnim }]} />
                </View>
              </View>
            </View>
            <Text style={styles.skeletonText}>Iniciando núcleo...</Text>
          </View>
        </View>
      )}
      {showProdError && (
        <View style={styles.overlay}>
          <ErrorState
            message="No pudimos cargar el juego. Volvé a intentarlo."
            onRetry={handleRetry}
          />
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
    backgroundColor: '#15140F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: spacing.md,
  },
  skeletonScreen: {
    width: '85%',
    aspectRatio: 4 / 3,
    backgroundColor: '#292721',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#35332C',
  },
  skeletonControls: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  skeletonLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: '#292721',
    borderWidth: 1,
    borderColor: '#35332C',
  },
  skeletonCenter: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  skeletonPill: {
    width: 32,
    height: 12,
    borderRadius: radii.full,
    backgroundColor: '#292721',
    borderWidth: 1,
    borderColor: '#35332C',
  },
  skeletonRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonDiamond: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skeletonBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: '#292721',
    borderWidth: 1,
    borderColor: '#35332C',
  },
  skeletonText: {
    marginTop: spacing.xl,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
