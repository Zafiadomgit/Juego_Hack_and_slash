# Fendaria

Un hack & slash (ARPG) para Android: cruza el Portal Rúnico de Villa Candela, cierra las *Grietas*, derrota al Guardián y equípate con su botín.

Todo el arte del juego se dibuja por código (sin assets de terceros).

## Cómo se juega

1. **Elige personaje**: Rompeyelmos (cuerpo a cuerpo), Ojo de Halcón (a distancia) o Runista (mago protector). Cada uno tiene su propia partida guardada.
2. **Villa Candela** es el hub: elige el nivel de Grieta, compra pociones y gestiona tu equipo.
3. **La Grieta**: los monstruos (Chispín, Jabalí Musgoso, Tejeceniza, Seta Escupidora, Gólem de Basalto) llegan en grupos. Cada muerte llena la barra de progreso. Al llenarla aparece el **Guardián** (Colmillo Ancestral o Garra Ígnea), que entra en furia al 50% de vida.
4. **Botín** con rareza (Común, Raro, Épico, Legendario). Los Guardianes pueden soltar una **Gema Ancestral** (bonus permanente).
5. Al vencer al Guardián se abre un **Portal**: crúzalo para volver a Villa Candela y desbloquear la siguiente Grieta.
6. Cada nivel da **5 puntos de característica** que repartes desde la bolsa 🎒.

### Controles

| Móvil | Teclado | Acción |
|---|---|---|
| Joystick (mitad izquierda) | WASD / flechas | Moverse |
| Botón grande | J / Espacio (mantener) | Ataque básico (apunta solo) |
| Botones azules | K / L | Hechizos (cuestan energía ★) |
| Botón verde | Shift | Esquiva (gasta impulso) |
| 🧪 | H | Poción (cura un 40%) |
| 🎒 | B | Equipo, bolsa y características |

## Estructura

```
www/                  El juego (HTML5 Canvas + JavaScript, sin dependencias)
  js/data.js          Clases, monstruos, objetos, gemas
  js/art.js           Arte procedural + caché de sprites
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
