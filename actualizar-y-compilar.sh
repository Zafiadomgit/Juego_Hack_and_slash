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
for j in "/c/Program Files/Android/Android Studio/jbr" "/Applications/Android Studio.app/Contents/jbr/Contents/Home" "$HOME/android-studio/jbr"; do
  if [ -x "$j/bin/java" ] || [ -x "$j/bin/java.exe" ]; then export JAVA_HOME="$j"; break; fi
done
echo "Java: ${JAVA_HOME:-el del sistema}"
cd android
if [ -f gradlew.bat ] && command -v cmd.exe >/dev/null 2>&1; then cmd.exe //c "gradlew.bat assembleDebug"; else ./gradlew assembleDebug; fi
echo
echo "LISTO. APK: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
echo "En el juego, Ajustes debe decir «Versión 1.2 · 29-oct»."
