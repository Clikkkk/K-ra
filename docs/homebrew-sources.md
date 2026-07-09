# Fuentes de contenido homebrew (F6.37)

## Hallazgo importante sobre licencias

Las colecciones más completas y organizadas por sistema —
[retrobrews/nes-games](https://github.com/retrobrews/nes-games),
[retrobrews/snes-games](https://github.com/retrobrews/snes-games) y
[retrobrews/gba-games](https://github.com/retrobrews/gba-games) (curadas para RetroPie,
150+ títulos combinados, bien documentadas, con captura + ficha de texto por juego) —
tienen esta nota explícita en cada repo:

> "The ROMs listed here have been approved for free distribution on this site/project
> only. If you want to share it, please contact owner/developer."

Es decir: el permiso de distribución libre está limitado a ese proyecto/sitio
específico, no es una licencia abierta que cubra automáticamente redistribuirlos desde
Kōra. Para usar cualquier título de ahí en nuestro catálogo con descarga automática,
haría falta contactar al autor original de cada juego individualmente — no es algo que
se pueda asumir en bloque.

**Conclusión:** estas colecciones sirven perfecto como fuente de _descubrimiento_
(qué juegos existen, screenshots, géneros), pero no como fuente directa de
`download_url` para el catálogo salvo que confirmemos permiso puntual por juego.

## Casos con licencia clara verificada (aptos para catálogo con descarga)

| Juego                                                            | Sistema | Autor     | Licencia                                                                                  | Fuente                                                 |
| ---------------------------------------------------------------- | ------- | --------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [Minicraft for GBA](https://vulcalien.itch.io/minicraft-for-gba) | GBA     | Vulcalien | **GPL-3.0**, código fuente público ([GitHub](https://github.com/Vulcalien/minicraft-gba)) | página propia del autor en itch.io, licencia explícita |

Este es el único título que verifiqué con licencia explícita, código fuente público y
descarga directa (`minicraft-gba_2.0.zip` → `minicraft.gba`) confirmando que el autor
autoriza libremente compartirlo. El resto de candidatos que encontré (vía búsqueda web,
sin descargar/verificar cada página individualmente) necesitan el mismo nivel de
verificación antes de entrar al catálogo:

- **NES**: título homebrew "Böbl" y otros listados en colecciones de itch.io
  (`itch.io/games/free/tag-homebrew/tag-nes-rom`) — licencia no verificada aún.
- **SNES**: escena más chica; candidatos vistos en tags de itch.io (`Keeping SNES
Alive!`, `Dottie Flowers`) y ejemplos del SDK [PVSnesLib](https://github.com/alekmaul/pvsneslib)
  (el SDK en sí es MIT, pero eso no license automáticamente los juegos hechos con él)
  — licencia no verificada aún.

## Recomendación para F6.38-41

Dado que armar un catálogo real requiere verificar licencia individual por juego (uno
por uno, no en bloque), propongo:

1. Construir el modelo de datos y las pantallas (F6.38/39/40/41) contra un catálogo de
   ejemplo/placeholder (2-3 entradas, incluyendo Minicraft GBA que ya está verificado).
2. Dejar la fuente del catálogo (JSON local por ahora) fácil de ampliar más adelante,
   a medida que se vayan verificando y confirmando más títulos por sistema.
3. No automatizar scraping/ingestión masiva de retrobrews ni de itch.io — cada entrada
   nueva al catálogo debe agregarse a mano tras confirmar licencia.
