#!/usr/bin/env bash
# Fendaria: descarga la última versión, copia el juego al proyecto Android y genera el APK de prueba.
# Uso (Git Bash / MSYS2 / Mac / Linux), dentro de la carpeta del proyecto:  ./actualizar-y-compilar.sh
set -e
cd "$(dirname "$0")"
echo "=== 1/4 Descargando la última versión ==="
git fetch origin claude/stoic-cray-jvyift
git checkout claude/stoic-cray-jvyift
git pull origin claude/stoic-cray-jvyift
echo "=== 2/4 Instalando dependencias ==="
npm install
echo "=== 3/4 Copiando el juego (www) al proyecto Android ==="
npx cap sync android
echo "=== 4/4 Compilando el APK ==="
# Java 21 de Android Studio (Gradle 8.14 no funciona con Java 25)
JBR="${JBR:-}"
[ -n "$JBR" ] || for j in "/c/Program Files/Android/Android Studio/jbr" /c/Program\ Files/Android/*/jbr "${LOCALAPPDATA:-/nonexistent}/Programs/Android Studio/jbr" \
         "/Applications/Android Studio.app/Contents/jbr/Contents/Home" "$HOME/android-studio/jbr"; do
  if [ -x "$j/bin/java" ] || [ -x "$j/bin/java.exe" ]; then JBR="$j"; break; fi
done
if [ -z "$JBR" ]; then
  echo "No encuentro el Java de Android Studio (carpeta jbr). Búscalo en Android Studio: Settings > Build Tools > Gradle > Gradle JDK"
  echo "y vuelve a ejecutar con:  JBR=\"/c/ruta/a/jbr\" ./actualizar-y-compilar.sh"
  exit 1
fi
echo "Java: $JBR"
cd android
if command -v cygpath >/dev/null 2>&1 && [ -f gradlew.bat ]; then
  # Windows (Git Bash / MSYS2): gradlew.bat necesita la ruta en formato Windows
  export JAVA_HOME="$(cygpath -w "$JBR")"
  cmd.exe //c "gradlew.bat --stop" >/dev/null 2>&1 || true  # cierra el Gradle que arrancó con el Java viejo
  cmd.exe //c "gradlew.bat assembleDebug"
else
  export JAVA_HOME="$JBR"
  ./gradlew --stop >/dev/null 2>&1 || true
  ./gradlew assembleDebug
fi
echo
echo "LISTO. APK: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
echo "En el juego, Ajustes debe decir «Versión 1.2 · 29-oct»."
