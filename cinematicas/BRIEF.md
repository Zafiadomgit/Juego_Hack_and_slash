---
workflow: general-video
flow: automation
storyboard: yes
message: "Fendaria es una leyenda épica que merece ser vivida: cada Sello roto acerca a Morvhal"
aspect: 1920x1080
language: es
length: 25s
audience: jugadores de Fendaria en móvil
---

## Intent

Cinco cinemáticas cortas (20–30 s cada una) que se ven dentro del juego en los momentos clave de la
historia: prólogo, caída del primer Sello, la revelación de Ivo, el inicio del Acto II (los Heraldos) y el
final contra Morvhal. Estilo «super chingón»: épico, ilustraciones HD‑2D pintadas con Leonardo, cámara
en movimiento, partículas y texto en pantalla con música orquestal, sin voz.

## Assets

- ../www/img/gods/*.webp — retratos de los Doce dioses.
- ../www/img/portraits/*.webp — retratos de Nereth, Lysara, Morvhal y los Súper Jefes.
- ../www/img/heroes/px/*.png — los 7 héroes rediseñados.
- ../www/img/logo.png — logo de Fendaria.
- ../www/js/story.js — guion de la trama (escenas prologo, win0, win2, win4, win7).

## Customizations

- Ilustraciones de cada plano generadas con Leonardo (gemini-image-2), estilo coherente con el juego.
- Música propia por cinemática con tools/audio (compositor sintetizado del proyecto).
- Se pueden saltar dentro del juego (toque).

## Notes

- Texto en español, corto y legible en móvil (tamaño grande).
- Cada cinemática se renderiza por separado (compositions/cN-*.html) y se convierte a webm para www/video/.
