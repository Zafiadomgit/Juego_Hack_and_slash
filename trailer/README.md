# Tráiler de Fendaria (HyperFrames)

Video de presentación de 30 s, estilo anime, hecho con [HyperFrames](https://hyperframes.heygen.com) (HTML + GSAP → MP4).
La versión comprimida para el juego está en `www/video/intro.webm`.

## Regenerar

1. **Clips de juego** (sin HUD, `window.TRAILER = true`): sirve `www/` en `http://localhost:8765` y ejecuta
   `node tools/record_clips.js <carpeta>`; recorta cada `.webm` a `assets/<nombre>.mp4`
   (`glaciar`, `pantano`, `mago`, `super`, `pueblo`) con `ffmpeg -ss … -t … -c:v libx264`.
2. **Música** (orquesta sintetizada, `tools/audio`): `python3 ../tools/audio/trailer_music.py assets/music.wav && ffmpeg -i assets/music.wav -c:a aac assets/music.m4a`.
3. **Logo**: `tools/logo.html` se renderiza a `assets/logo.png` / `www/img/logo.png` (captura con fondo transparente).
4. **Render**: `npx hyperframes@0.8.150 lint . && npx hyperframes@0.8.150 render -q high -o fendaria_trailer.mp4`
5. **Versión del juego**: `ffmpeg -i fendaria_trailer.mp4 -c:v libvpx-vp9 -crf 38 -b:v 0 -c:a libopus -b:a 112k ../www/video/intro.webm`
