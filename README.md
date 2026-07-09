# Kōra

Kōra es una consola virtual con interfaz moderna para emular juegos retro (NES, SNES, GBA) directamente desde tu móvil. Diseño minimalista, sin nostalgia forzada: la portada de cada juego es la protagonista, la interfaz solo la acompaña.

## Qué es y qué no es

Kōra es el shell de una consola: biblioteca, importador de partidas, player con overlay de controles táctiles, save states y un catálogo de juegos homebrew gratuitos y con licencia libre.

**Kōra no distribuye ROMs de juegos comerciales.** El usuario importa sus propias ROMs (archivos que ya posee) a través del selector de archivos del sistema. La app no incluye buscadores, links ni descargas de contenido con copyright. El único catálogo integrado es de homebrew/freeware con licencia abierta, con crédito a sus autores originales.

## Características

- Import manual de ROMs propias vía selector de archivos nativo
- Biblioteca con filtros por sistema y buscador
- Player a pantalla completa con overlay de controles táctiles
- Save states (guardar y continuar partida)
- Catálogo de juegos homebrew gratuitos y de licencia libre
- Soporte de mando físico con mapeo de botones personalizable
- Interfaz oscura, minimalista, sin elementos retro/pixel-art

## Stack técnico

- **React Native (Expo)** + TypeScript — interfaz y navegación
- **EmulatorJS / cores libretro compilados a WASM** — motor de emulación (fceumm, mgba, snes9x), embebido vía WebView con un puente JS de mensajería
- **SQLite / almacenamiento local** — biblioteca, metadatos y save states

## Sistemas soportados (MVP)

- NES
- SNES
- GBA

## Estado del proyecto

En desarrollo activo. Consulta el roadmap de commits hasta MVP en `/docs` (o el archivo de planificación del repo).

## Licencia y contenido de terceros

El código de Kōra es propio. El motor de emulación embebido es [EmulatorJS](https://emulatorjs.org) (GPL-3.0, ver `docs/EMULATORJS_LICENSE.txt`), que a su vez empaqueta cores de la comunidad libretro/RetroArch (fceumm, snes9x, mgba — ver `docs/cores.md`), cada uno bajo su propia licencia. Los juegos del catálogo homebrew mantienen la licencia y autoría de sus creadores originales; se incluye enlace y crédito a la fuente en cada ficha.

Este proyecto no aloja, enlaza ni facilita el acceso a ROMs de juegos comerciales protegidos por copyright.
