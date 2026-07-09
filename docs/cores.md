# Cores de emulación

Kōra usa [EmulatorJS](https://emulatorjs.org/) (builds WASM de cores libretro) embebido en un WebView, sin dependencia de CDN externo — los archivos del core y el loader se empaquetan localmente en `assets/emulatorjs/` para que la app funcione offline.

## Cores elegidos (MVP)

| Sistema | Core     | Alternativas descartadas                                                       |
| ------- | -------- | ------------------------------------------------------------------------------ |
| NES     | `fceumm` | `nestopia` (más lento en WASM, mejor precisión de timing en casos raros)       |
| SNES    | `snes9x` | `bsnes`/`higan` (precisión ciclo-exacta, demasiado pesados para WASM en móvil) |
| GBA     | `mgba`   | ninguna — es el core de referencia para GBA en libretro                        |

Todos son proyectos GPL de la comunidad libretro/RetroArch, distribuidos como builds WASM oficiales de EmulatorJS. Se acredita su autoría en la app (ver README, sección "Licencia y contenido de terceros").

## Limitaciones conocidas

### fceumm (NES)

- Cobertura de mappers muy amplia (cubre la inmensa mayoría de ROMs comerciales y homebrew).
- Timing de PPU/APU no es ciclo-exacto en todos los casos — puede haber glitches menores en juegos que dependen de mid-scanline raster tricks muy específicos.
- Sin soporte para expansión de audio de mappers raros (VRC7, N163) en la build WASM estándar de EmulatorJS.
- Rendimiento excelente incluso en hardware móvil de gama baja.

### snes9x (SNES)

- Buena compatibilidad y rendimiento; soporta la mayoría de chips de expansión comunes (SuperFX, SA-1, DSP-1).
- Chips de expansión menos comunes (Cx4, S-DD1 en algunos títulos) pueden tener soporte parcial o requerir configuración adicional del core.
- No es ciclo-exacto (a diferencia de bsnes) — puede haber desincronizaciones raras de timing en juegos que dependen de eso, pero es la opción viable en términos de rendimiento para WASM en móvil.

### mgba (GBA)

- Core de referencia para GBA: alta precisión y buen rendimiento.
- Juegos con Real-Time Clock (RTC) — ej. Pokémon Ruby/Sapphire/Emerald — necesitan que el core detecte el flag RTC correctamente vía el propio archivo ROM (no requiere configuración manual en la mayoría de casos, EmulatorJS lo maneja automático).
- No emula GB/GBC (solo GBA) — si se añade soporte Game Boy en el futuro, se necesitaría un core aparte (ej. `gambatte`).

## Notas de integración

- Los cores se cargan como parte del bundle EmulatorJS (`assets/emulatorjs/`), no se descargan en runtime — importante para que la app funcione sin conexión y no dependa de un CDN de terceros.
- El WebView (`components/emulator/EmulatorView.tsx`, ver F1.9) se comunica con el core vía un puente `postMessage` tipado (`lib/emulator/bridge.ts`, ver F1.10) — el core en sí no se modifica, se controla desde JS del lado EmulatorJS.

## Procedencia y versión del bundle vendorizado

- EmulatorJS **v4.2.3** (tag oficial en GitHub), runtime (`emulator.min.js`, `loader.js`, `emulator.min.css`, `compression/*`) construido localmente desde el código fuente de ese tag con el propio script de minificación del proyecto (`minify/minify.js`, terser + clean-css) — no se usa el CDN de EmulatorJS.
- Los `.data` de los cores (`fceumm`, `snes9x`, `mgba`) vienen de los paquetes npm oficiales `@emulatorjs/core-*` (misma versión 4.2.3), copiados directamente sin modificar.
- Todo el payload (runtime + cores) se empaqueta en `assets/emulatorjs/emulatorjs.zip` (un solo asset binario, ~6.7 MB) para evitar que Metro intente parsear los `.js`/`.css` vendorizados como módulos propios de la app. Se extrae a `documentDirectory` en el primer arranque (ver `lib/emulator/provision.ts`, F1.9).
- **Variantes bundleadas**: solo `<core>-wasm.data` y `<core>-legacy-wasm.data` (sin threads). Se descartan las variantes `-thread-*`: requieren `SharedArrayBuffer`, que necesita headers COOP/COEP sobre HTTP — no viables sirviendo HTML local vía `file://`/`baseUrl` en un WebView de RN. La variante `legacy`/no-legacy la elige el propio runtime en automático según soporte de WebGL2 del WebView.
- Licencia: EmulatorJS es GPL-3.0 (`docs/EMULATORJS_LICENSE.txt`); los cores libretro mantienen su propia licencia (ver tabla arriba).
