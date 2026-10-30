@echo off
REM Fendaria: descarga la ultima version, copia el juego al proyecto Android y genera el APK de prueba.
REM Uso: doble clic, o en PowerShell/CMD dentro de esta carpeta:  actualizar-y-compilar.bat
setlocal
REM git pull puede cambiar este mismo archivo: se ejecuta una copia desde la carpeta temporal
if not "%~1"=="_copia" (
  copy /y "%~f0" "%TEMP%\fendaria-compilar.bat" >nul
  "%TEMP%\fendaria-compilar.bat" _copia "%~dp0"
  exit /b
)
cd /d "%~2"
echo === 1/4 Descargando la ultima version (rama claude/stoic-cray-jvyift) ===
git fetch origin claude/stoic-cray-jvyift || goto :err
git checkout claude/stoic-cray-jvyift || goto :err
git pull origin claude/stoic-cray-jvyift || goto :err
echo === 2/4 Instalando dependencias ===
call npm install || goto :err
echo === 3/4 Copiando el juego (www) al proyecto Android ===
call npx cap sync android || goto :err
echo === 4/4 Compilando el APK ===
REM Gradle 8.14 necesita Java 17-24 (con Java 25 falla). Se busca por version: el jbr de Android Studio reciente ya es 25
set "JAVA_HOME="
for /d %%d in ("%USERPROFILE%\.jdks\*" "%USERPROFILE%\.gradle\jdks\*" "C:\Program Files\Android\Android Studio\jbr" "C:\Program Files\Java\*" "C:\Program Files\Eclipse Adoptium\*" "C:\Program Files\Microsoft\jdk-*") do (
  if not defined JAVA_HOME findstr /r /c:"JAVA_VERSION=\"1[7-9]" /c:"JAVA_VERSION=\"2[0-4]" "%%~d\release" >nul 2>&1 && set "JAVA_HOME=%%~d"
)
if not defined JAVA_HOME (
  echo No encuentro un Java entre 17 y 24. En Android Studio: Settings ^> Build Tools ^> Gradle ^> Gradle JDK ^> Download JDK ^> version 21
  goto :err
)
echo Java: %JAVA_HOME%
cd android
call gradlew.bat --stop >nul 2>&1
call gradlew.bat assembleDebug || goto :err
cd ..
echo.
echo LISTO. APK: %cd%\android\app\build\outputs\apk\debug\app-debug.apk
echo En el juego, Ajustes debe decir "Version 1.3.1 - 30-oct".
pause
exit /b 0
:err
echo.
echo Algo fallo en el paso anterior. Copia el mensaje de error y mandamelo.
pause
exit /b 1
