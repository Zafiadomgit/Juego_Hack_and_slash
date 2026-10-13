# Fendaria

Un hack & slash (ARPG) para Android: cruza el Portal Rúnico de Villa Candela, cierra las *Grietas*, derrota al Guardián y equípate con su botín.

Todo el arte del juego se dibuja por código (sin assets de terceros).

Estilo visual **HD-2D** (inspirado en Octopath Traveler): el mundo se dibuja como pixel art en baja resolución y encima se aplican luz dinámica, bloom y desenfoque tipo maqueta.

Al abrir el juego por primera vez se reproduce un **video de presentación** (se puede saltar tocando). Después aparece la pantalla de título con el logotipo (**Toca para empezar**) y el menú principal: *Continuar*, *Nuevo juego* (con una ficha de cada héroe: resumen, atributos, habilidades e historia) y *Ver presentación*. El tráiler se genera con HyperFrames desde `trailer/`.

**Música y sonido**: banda sonora original sintetizada por código (`tools/audio/compose.py`): tema de título, Villa Candela, una pista por mundo, Guardianes, Súper Jefes, fanfarria de victoria y lamento de derrota; los efectos (`tools/audio/sfx.py`) son muestras generadas igual. Todo está en `www/audio/`.

## Cómo se juega

1. **Elige personaje** entre 7 clases, cada una con su partida guardada:
   - **Rompeyelmos** (cuerpo a cuerpo), **Ojo de Halcón** (a distancia) y **Runista** (mago protector).
   - **Sombra**: asesina de dagas; Paso Sombrío (aparece tras el enemigo con crítico seguro), Abanico Venenoso y la definitiva Danza de Mil Cortes.
   - **Domadora**: cayado de espíritus y lobos; Llamada del Lobo (hasta 3 lobos), Rugido Salvaje (enfurece a la manada) y la definitiva Estampida.
   - **Artificiera**: bombas en parábola; Torreta de Chispas, Bomba Racimo y la definitiva Bombardeo.
   - **Berserker**: espadón; pega más fuerte cuanto menos vida tiene y se cura al golpear; Golpe Sangriento, Grito de Guerra y la definitiva Frenesí Rojo.
2. **Villa Candela** es un pueblo por el que caminas (joystick, teclado o tocando el suelo). **Brunilda la Mercader** vende equipo nuevo tras cada Grieta; **Tobías el Herrero** refina armas y equipo hasta +10 (+10% de stats por nivel; a partir de +5 puede fallar sin romper el objeto), asciende su calidad (Común → Raro → Épico → Legendario), reforja sus propiedades y desguaza lo que no uses en Fragmentos de mineral, la moneda de la herrería. **Maese Ivo el Alquimista** vende elixires para la siguiente Grieta, pociones y mejoras permanentes con precio creciente (Piedra de afilar y Talismán de vigor hasta nivel 15, Piel curtida, Cristal de energía, Trébol de la suerte, Botas de reflejos, Imán de ámbar, bolsa y cinto). Los monstruos de cada Grieta cuentan con que vas comprando afilador y talismán poco a poco, así que el ámbar siempre tiene un destino. Todo se paga con ámbar. Al acercarte al **Portal Rúnico** de la plaza aparece su panel: desde ahí eliges Grieta en el mapa y entras. El pueblo tiene vida: aldeanos que pasean, gallinas, pájaros, mariposas y nubes.
   Desde la villa abres el **Mapa de Grietas**: cada mundo tiene 7 Grietas y un **Súper Jefe** al final. Cada Grieta tiene 3 dificultades (**Fácil**, **Medio**, **Difícil**) que se desbloquean en orden; superar una Grieta abre la siguiente y vencer al Súper Jefe abre el mundo siguiente. Cuanto más difícil, más vida y daño tienen los monstruos, pero más ámbar, XP y probabilidad de conseguir piezas del **conjunto** de esa zona (10% / 30% / 60%; el Súper Jefe siempre suelta una). La calidad del botín también depende de la dificultad: **Fácil** suelta Común y Raro, **Medio** Raro y Épico, **Difícil** Épico y Legendario, y cada calidad multiplica mucho los stats (×1 / ×1,7 / ×2,8 / ×4,5). Los monstruos se calculan a partir de un héroe de referencia con el equipo de esa dificultad: Fácil está pensada para equipo Común, Medio para Raro y Difícil para Legendario (e incluso con él sigue siendo dura). Con 2, 4 y 6 piezas del mismo conjunto equipadas se activan sus bonus.
3. **La Grieta**: cada nivel de Grieta te lleva a uno de 5 mundos (Bosque Ceniciento, Pantano Sombrío, Glaciar Rúnico, Desierto de Ámbar y Abismo Volcánico), cada uno con su terreno, clima, monstruos favoritos y Guardián propio. Los monstruos (Chispín, Jabalí Musgoso, Tejeceniza, Seta Escupidora, Gólem de Basalto) llegan en grupos y cada muerte llena la barra de progreso. Al llenarla aparece el **Guardián** del mundo (Colmillo Ancestral, Reina Tejeceniza, Coloso de Escarcha, Garra Ígnea o Hechicero del Abismo), que entra en furia al 50% de vida.
   La dificultad sube con cada Grieta: más vida y daño, más élites (Acorazado, Explosivo…) y ataques nuevos (doble embestida, abanicos de 5 proyectiles, suelo en llamas, Chispines que estallan).
4. **Botín** con rareza (Común, Raro, Épico, Legendario). Los Guardianes pueden soltar una **Gema Ancestral** (bonus permanente).
5. Al vencer al Guardián se abre un **Portal**: crúzalo para volver a Villa Candela y desbloquear la siguiente Grieta.
6. **Habilidad definitiva**: matar monstruos carga el botón dorado (élites y Guardianes cargan mucho más). Al 100% se desata: **Torbellino de Acero** (Rompeyelmos gira golpeando todo a su alrededor), **Lluvia de Halcones** (Ojo de Halcón dispara tres oleadas de flechas y hace caer halcones sobre los enemigos cercanos) o **Gran Runa Ancestral** (Runista crea una runa enorme que quema y frena, y un escudo de la mitad de su vida).
7. **Eventos de Grieta**: de vez en cuando ocurre algo dentro de la Grieta: un **Cofre del Tesoro** que hay que encontrar (aparece en el radar), una **Lluvia de Ámbar**, una **Emboscada** de élites con recompensa, o un **Altar de Poder** (+50% daño y más velocidad durante 30 s).
8. **Misiones diarias y Sellos de Gesta**: el **Tablón** de la plaza de Villa Candela tiene 3 misiones nuevas cada día (por héroe): derrotar monstruos o élites, vencer Guardianes, cerrar Grietas, recoger ámbar, usar la definitiva, completar eventos… No dan ámbar sino **Sellos de Gesta**, una moneda aparte (y un **Cofre del día** extra al completar las 3). También se ganan sellos la primera vez que vences a un Súper Jefe o superas una Grieta en Difícil. Los sellos se gastan en el mismo tablón:
   - **Trascendencia** del héroe: 10 rangos (+5% daño y +5% PV cada uno) con hitos: definitiva un 30% más rápida (rango 3), empezar cada Grieta con la definitiva al 50% (rango 5), +5% crítico (rango 7) y, en el rango 10, definitiva un 50% más fuerte y un aura dorada.
   - **Forja**: cada ranura de equipo sube hasta 5★ (+12% a los stats de la pieza por estrella). Las estrellas son de la ranura y se conservan al cambiar de pieza.
   - **Armería de Gesta**: Arma de Gesta (150 sellos) y Pieza de Gesta (90) —legendarias exclusivas, +20% de stats— y Gemas Ancestrales (220).
9. Cada nivel da **5 puntos de característica** que repartes desde la bolsa 🎒. Cada característica muestra lo que te da ahora mismo, y el botón **?** explica todas.

### Controles

| Móvil | Teclado | Acción |
|---|---|---|
| Joystick (mitad izquierda) | WASD / flechas | Moverse |
| Botón grande | J / Espacio (mantener) | Ataque básico (apunta solo) |
| Botones azules | K / L | Hechizos (cuestan energía ★) |
| Botón verde | Shift | Esquiva (gasta impulso) |
| 🧪 | H | Poción (cura un 40%) |
| Botón dorado | U | Habilidad definitiva (al 100%) |
| 🎒 | B | Equipo, bolsa y características |

## Estructura

```
www/                  El juego (HTML5 Canvas + JavaScript, sin dependencias)
  js/data.js          Clases, monstruos, objetos, gemas
  js/art.js           Arte procedural + caché de sprites
  js/biomes.js        Mundos de las Grietas (terreno, vegetación, clima)
  js/progress.js      Mapa, dificultades, conjuntos y Súper Jefes
  js/hd2d.js          Estilo HD-2D: búfer pixelado, bloom y tilt-shift
  js/village.js       Villa Candela: pueblo caminable, vecinos y tiendas
  js/content.js       Definitivas, misiones diarias y eventos de Grieta
  js/classes.js       Clases nuevas: Sombra, Domadora, Artificiera y Berserker
audio/ (en www)       Música (.ogg en bucle) y efectos de sonido
tools/audio/          Sintetizador y compositor de la banda sonora (Python)
  js/game.js          Lógica: combate, IA, Grietas, botín, HUD, interfaz
android/              Proyecto Android (Capacitor)
eas.json / app.json   Compilación del APK con EAS
```

## Probar en el navegador

```bash
npm run serve        # abre http://localhost:8080 (en el móvil o con el modo móvil del navegador)
```

## Obtener el APK

### Con EAS (recomendado)

El proyecto está enlazado a EAS (`@zafiadom14/astrub-slash`). EAS compila el proyecto Android nativo de Capacitor; antes de compilar ejecuta `npx cap sync android` (hook `eas-build-post-install`) para copiar `www/` dentro de la app.

```bash
npm install
npx eas-cli build -p android --profile preview    # o: npm run eas:apk
```

Al terminar, EAS da un enlace/QR para descargar el `.apk` directamente en el móvil.

- `preview`: APK debug, sin firma de producción (ideal para probar).
- `production`: APK release firmado con las credenciales de EAS.

### Con Android Studio

Requiere JDK 17 (el que trae Android Studio sirve).

```bash
npm install
npx cap sync android
npx cap open android      # abre el proyecto en Android Studio
```

En Android Studio: *Build → Build App Bundle(s) / APK(s) → Build APK(s)*, o pulsa ▶ con el móvil conectado por USB.
También desde terminal: `npm run apk` → `android/app/build/outputs/apk/debug/app-debug.apk`.

Si cambias algo dentro de `www/`, vuelve a ejecutar `npx cap sync android` antes de compilar.

## Créditos

- Efectos de sonido basados en los packs CC0 de **Kenney** (www.kenney.nl): RPG Audio, Impact Sounds, Interface Sounds, Sci-Fi Sounds y Casino Audio. Se generan con `tools/audio/kenney_sfx.py`.
