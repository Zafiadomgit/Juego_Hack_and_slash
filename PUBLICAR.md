# Publicar Fendaria en Google Play

Requisito de Google: desde el 31-08-2026 las apps nuevas y las actualizaciones deben apuntar a **Android 16 (API 36)**.
Por eso el proyecto ya usa **Capacitor 8** (minSdk 24, target/compile 36, AGP 8.13, Gradle 8.14.3).
Fuentes: https://developer.android.com/google/play/requirements/target-sdk · https://capacitorjs.com/docs/updating/8-0

## 1. Preparar el equipo (una vez)
- **Android Studio Otter (2025.2.1) o más nuevo** (Help › Check for Updates).
- **JDK 21**: Android Studio ya trae uno (Settings › Build Tools › Gradle › Gradle JDK = *jbr-21*).
- En el SDK Manager, instala **Android 16 (API 36)**.

## 2. Actualizar y abrir el proyecto
```
cd ~/Juego_Hack_and_slash && git pull && npm install && npx cap sync android && npx cap open android
```
La primera vez Gradle descarga bastante: espera a que termine el «Gradle sync».
Prueba el juego en tu móvil con ▶ Run antes de seguir.

## 3. Crear la llave de firma (una vez, ¡y no perderla!)
En una terminal, dentro de `android/`:
```
keytool -genkey -v -keystore fendaria-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fendaria
```
Crea el archivo `android/keystore.properties` (no se sube a git):
```
storeFile=../fendaria-release.jks
storePassword=TU_CONTRASEÑA
keyAlias=fendaria
keyPassword=TU_CONTRASEÑA
```
**Guarda una copia** del `.jks` y de las contraseñas fuera del ordenador (USB, gestor de contraseñas).
Con Play App Signing (activado por defecto) esta es tu *llave de subida*: si la pierdes se puede restablecer
desde Play Console, pero cuesta días.

## 4. Generar el paquete (.aab)
Android Studio: **Build › Generate Signed App Bundle / APK › Android App Bundle**, o en terminal:
```
cd android && ./gradlew bundleRelease
```
Resultado: `android/app/build/outputs/bundle/release/app-release.aab`

En cada actualización sube `versionCode` (y `versionName`) en `android/app/build.gradle`.
Ahora: versionCode 2, versionName 1.1.0.

## 5. Play Console
1. Cuenta de desarrollador: https://play.google.com/console (pago único de 25 USD, verificación de identidad).
2. **Crear app**: nombre «Fendaria: Las Grietas Rúnicas», idioma Español, Juego, Gratis.
3. **Ficha de la tienda** (carpeta `store/`):
   - Textos: `store/ficha_es.md` y, como traducción al inglés de la ficha, `store/ficha_en.md`
     (Ficha de la tienda › Gestionar traducciones › Inglés).
   - Para la ficha en inglés usa las imágenes de `store/en/` (capturas y gráfico destacado con el logo en inglés).
   - Icono 512x512: `store/icono_512.png`.
   - Gráfico destacado 1024x500: `store/grafico_destacado_1024x500.png`.
   - Capturas de teléfono/tablet: `store/cap_*.png` (1920x1080).
4. **Política de privacidad**: publica `docs/privacidad.html` (GitHub › Settings › Pages › rama main, carpeta `/docs`)
   y pega la URL: `https://zafiadomgit.github.io/Juego_Hack_and_slash/privacidad.html`.
5. **Contenido de la app**:
   - Anuncios: **No**.
   - Clasificación (cuestionario IARC): juego con **violencia de fantasía** (personajes no realistas), sin sangre realista,
     sin compras, sin chat. Interacción de usuarios: solo un nombre público en el ranking.
   - Público objetivo: 13+ (evita los requisitos extra de «familias»).
   - **Seguridad de los datos**: se recogen *ID de usuario* (identificador anónimo) y *nombre* (el del ranking) y
     *actividad en la app* (puntuación); finalidad «Funciones de la app»; no se comparten; cifrados en tránsito (HTTPS);
     el usuario puede pedir borrarlos por email. No hay ubicación, contactos ni analítica.
6. **Pruebas**: las cuentas personales nuevas deben hacer una **prueba cerrada con al menos 12 testers durante 14 días**
   antes de poder publicar en producción. Crea la pista *Prueba cerrada*, sube el `.aab`, añade los correos de los
   testers y comparte el enlace de opt-in.
7. Tras los 14 días: **Producción › Crear versión**, sube el `.aab` y envíalo a revisión (suele tardar de 1 a 7 días).

## Notas
- En tablets con Android 16, el sistema puede ignorar el bloqueo a horizontal: el juego debe verse bien igualmente.
- El ranking usa Supabase (proyecto «Fendaria»). El plan gratuito pausa el proyecto tras 7 días sin uso; si pasa,
  reactívalo en https://supabase.com/dashboard. El juego sigue funcionando sin ranking.

## Idiomas (español e inglés)
- El juego elige solo el idioma del móvil (español → español, el resto → inglés) y se puede cambiar en **Ajustes**.
- La versión inglesa (`www/index_en.html` y `www/js/en/`) **se genera**: no se edita a mano.
  Los textos traducidos están en `tools/i18n/en/*.txt`. Tras cambiar cualquier texto del juego:
  ```
  node tools/i18n/extract.js   # lista lo que falta por traducir en tools/i18n/work/
  node tools/i18n/build.js     # regenera la versión inglesa
  ```
- Cinemáticas en inglés: `cd cinematicas && python3 tools/build.py --en`, render, y vuelve a `python3 tools/build.py`.
