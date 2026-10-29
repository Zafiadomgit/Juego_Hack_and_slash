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
# Java para Gradle 8.14: entre 17 y 24 (con Java 25 falla con «class file major version 69»).
# Se busca por versión (archivo «release» del JDK): el jbr de los Android Studio recientes ya es Java 25,
# y el «Use JVM 21» de Android Studio suele descargar un JDK 21 en C:\Users\<tú>\.jdks
jver() { sed -n 's/^JAVA_VERSION="\([0-9]*\).*/\1/p' "$1/release" 2>/dev/null; }
okjava() { local v; v=$(jver "$1"); [ -n "$v" ] && [ "$v" -ge 17 ] && [ "$v" -le 24 ]; }
UP="$HOME"; command -v cygpath >/dev/null 2>&1 && [ -n "$USERPROFILE" ] && UP="$(cygpath "$USERPROFILE")"
JBR="${JBR:-}"
if [ -z "$JBR" ]; then
  for j in "$UP"/.jdks/* "$UP"/.gradle/jdks/* /c/Program\ Files/Android/*/jbr /c/Program\ Files/Java/* \
           /c/Program\ Files/Eclipse\ Adoptium/* /c/Program\ Files/Microsoft/jdk-* /c/Program\ Files/Amazon\ Corretto/* /c/Program\ Files/Zulu/* \
           "/Applications/Android Studio.app/Contents/jbr/Contents/Home" /Library/Java/JavaVirtualMachines/*/Contents/Home "$HOME/android-studio/jbr" /usr/lib/jvm/*; do
    if okjava "$j"; then JBR="$j"; break; fi
  done
fi
if [ -z "$JBR" ]; then
  echo "No encuentro un Java entre 17 y 24 (Gradle 8.14 no funciona con Java 25)."
  echo "Javas encontrados:"; for j in "$UP"/.jdks/* /c/Program\ Files/Android/*/jbr /c/Program\ Files/Java/*; do [ -f "$j/release" ] && echo "  $j -> Java $(jver "$j")"; done
  echo "Solución: Android Studio > Settings > Build Tools > Gradle > Gradle JDK > Download JDK > versión 21,"
  echo "y vuelve a ejecutar:  ./actualizar-y-compilar.sh   (o indica la carpeta:  JBR=\"/c/ruta/al/jdk-21\" ./actualizar-y-compilar.sh)"
  exit 1
fi
echo "Java $(jver "$JBR"): $JBR"
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
