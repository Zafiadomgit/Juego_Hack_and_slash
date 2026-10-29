#!/usr/bin/env bash
# Fendaria: descarga la última versión, copia el juego al proyecto Android y genera el APK de prueba.
set -e
cd "$(dirname "$0")"
git fetch origin claude/stoic-cray-jvyift
git checkout claude/stoic-cray-jvyift
git pull origin claude/stoic-cray-jvyift
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
echo "LISTO. APK: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
