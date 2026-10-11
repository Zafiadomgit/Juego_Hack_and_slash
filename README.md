# Astrub Slash

Un hack & slash (ARPG) para Android inspirado en el mundo de **Dofus**: entra por el Zaap de Astrub, limpia las *Failles*, derrota al Guardián y equípate con su botín.

> Fan game sin ánimo de lucro. Dofus, sus clases y sus monstruos son propiedad de Ankama. Todo el arte del juego se dibuja por código; no se usa ningún asset oficial.

## Cómo se juega

1. **Elige personaje**: Iop (cuerpo a cuerpo), Cra (a distancia) o Feca (mago protector). Cada uno tiene su propia partida guardada.
2. **Astrub** es el hub: elige el nivel de Faille, compra pan (curación) y gestiona tu equipo.
3. **La Faille**: los monstruos llegan en grupos. Cada muerte llena la barra de progreso. Al llenarla aparece el **Guardián** (Bouftou Real o Tofu Real), que entra en furia al 50% de vida.
4. **Botín**: objetos con rareza (Común, Raro, Épico, Legendario), con nombre en el suelo y haz de luz para los mejores. Los Guardianes pueden soltar un **Dofus** (bonus permanente).
5. Al vencer al Guardián se abre un **Zaap**: entra para volver a Astrub y desbloquear la siguiente Faille. Si acabas antes de que se agote el tiempo, recibes un bonus.
6. Cada nivel te da **5 puntos de característica** (Vitalidad, Sabiduría, Fuerza, Inteligencia, Suerte, Agilidad) que repartes desde la bolsa 🎒.

### Controles

| Móvil | Teclado | Acción |
|---|---|---|
| Joystick (mitad izquierda) | WASD / flechas | Moverse |
| Botón grande | J / Espacio (mantener) | Ataque básico (apunta solo al enemigo más cercano) |
| Botones azules | K / L | Hechizos (cuestan PA ★) |
| Botón verde | Shift | Esquiva (gasta 1 PM) |
| 🍞 | H | Comer pan (cura un 40%) |
| 🎒 | B | Personaje: equipo, bolsa y características |

### Clases

- **Iop**: espadazos en arco. *Salto* (cae sobre el enemigo y aplasta la zona) y *Cólera de Iop* (tajo gigante tras una carga).
- **Cra**: flechas rápidas. *Flecha Explosiva* (daño en área) y *Lluvia de Flechas*.
- **Feca**: orbes mágicos que atraviesan enemigos. *Escudo Feca* (absorbe daño y empuja) y *Glifo Ardiente* (quema y ralentiza).

## Estructura

```
www/                  El juego (HTML5 Canvas + JavaScript, sin dependencias)
  index.html
  css/style.css
  js/data.js          Clases, monstruos, objetos, Dofus
  js/art.js           Arte procedural (personajes, monstruos, Zaap, casas…)
  js/game.js          Lógica: combate, IA, Failles, botín, HUD, interfaz
android/              Proyecto Android generado por Capacitor
capacitor.config.json
.github/workflows/android.yml   Compila el APK en cada push
```

## Probar en el navegador

```bash
npm run serve        # abre http://localhost:8080 (en el móvil o con el modo móvil del navegador)
```

## Obtener el APK

**Sin instalar nada:** cada push a GitHub ejecuta el workflow *Android APK*. En la pestaña **Actions** del repositorio, abre la última ejecución y descarga el artefacto `astrub-slash-apk` (un zip con `astrub-slash.apk`). Si creas un tag `v*` (por ejemplo `v0.1.0`), el APK también se publica en *Releases*.

Para instalarlo en el móvil hay que permitir la instalación desde *orígenes desconocidos*.

**Compilando en local** (requiere Android Studio / Android SDK y JDK 21):

```bash
npm install
npm run apk          # genera android/app/build/outputs/apk/debug/app-debug.apk
```

O bien `npx cap open android` para abrirlo en Android Studio.

Si cambias algo dentro de `www/`, ejecuta `npx cap sync android` antes de compilar.
