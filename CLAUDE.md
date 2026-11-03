# Fendaria — reglas de trabajo para Claude

Juego hack and slash HD-2D (HTML5 + Capacitor para Android). Código del juego en `www/js` (la versión inglesa
`www/js/en` se genera con `node tools/i18n/build.js`: no editarla a mano). Herramientas en `tools/`.

## 1. Skills: usa siempre las que mejor encajen (obligatorio)

Antes de empezar cualquier tarea, revisa la lista de skills disponibles y carga la que mejor convenga
(o varias). No trabajes «de memoria» si hay una skill para eso. Guía rápida para este proyecto:

| Tarea | Skill |
|---|---|
| Sensación de combate, temblor, impactos, «que se sienta bien» | `game-feel` |
| HUD, menús, botones, escalado a móviles | `game-ui-ux` |
| Motor, bucle, colisiones, sprites | `game-engine` |
| Estadísticas, equipo, misiones, combate de RPG | `rpg` |
| Mazmorras, muerte permanente, botín | `roguelike` |
| Diálogos e historia con ramas | `dialogue-systems` |
| Rendimiento o fallos en el APK de Android | `capacitor-performance`, `debugging-capacitor` |
| Probar el juego en un navegador real, capturas | `playwright-cli` |
| Páginas web (web del estudio, ficha, menús HTML) | `design-taste-frontend`, `web-design-guidelines`, `image-to-code` |
| Vídeos, tráiler, cinemáticas | `hyperframes` (y las que enrute) |
| Ficha de Google Play / App Store | `aso` |
| Base de datos y ranking (Supabase) | `supabase` |
| Arte nuevo con SpriteCook | leer `tools/art/ESTILO.md` y `tools/art/VIERNES.md` antes de gastar créditos |

## 2. Graphify: obligatorio para ahorrar tokens al máximo

El proyecto tiene un mapa del código en `graphify-out/` (`graph.json` + `GRAPH_REPORT.md`), limitado por
`.graphifyignore` al código de `www/js` y `tools` (sin imágenes, sonido, documentos ni la copia inglesa).

1. **Al empezar la sesión**, si `graphify` no está instalado: `pip install graphifyy` (comando `graphify`).
2. **Antes de buscar o leer código** para cualquier pregunta sobre el proyecto (dónde está algo, qué llama a
   qué, cómo funciona una parte), consulta primero el grafo y lee solo las líneas que te indique:
   - `graphify query "<pregunta>" --budget 1500` — contexto amplio
   - `graphify explain "<función o nombre>"` — un elemento concreto y sus conexiones
   - `graphify path "<A>" "<B>"` — cómo se relacionan dos partes
   Para una visión general, `graphify-out/GRAPH_REPORT.md` (áreas, nodos centrales, puentes).
   Pon esta misma regla en el encargo de cualquier subagente que explore código.
3. **Después de cambiar código**: `graphify update .` (solo AST, gratis) y sube `graphify-out/graph.json`
   y `graphify-out/manifest.json` junto con el cambio.
4. **Cuidado con dos cosas que el grafo lee mal** en este proyecto; compruébalas con `grep` en la línea citada:
   - Muchas capas sustituyen funciones de otras (`const _f = f; f = function () { … _f() … }`): el grafo
     no siempre sigue esas cadenas, así que una función puede tener más llamadas reales de las que muestra.
   - Las variables globales compartidas (p. ej. `let state` en `game.js`, que leen y escriben unos 12
     archivos) aparecen a veces como llamadas a funciones del mismo nombre (el getter `__game.state`).
5. No reconstruyas el grafo entero (`/graphify .`) salvo que cambie la estructura de carpetas o el
   `.graphifyignore`; para lo demás basta `graphify update .`.
