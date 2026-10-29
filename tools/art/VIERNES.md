# Rework visual del viernes 30 (SpriteCook) — lista de control

Créditos previstos: **Adventurer (3000/mes, 5 generaciones a la vez, 8 variaciones, 2K/4K) + paquete de 1000** = 4000.
Paquete de 1000 recomendado YA (no caduca) para validar el estilo con Kara antes del viernes. Estilo y prompts: `tools/art/ESTILO.md`.

## 0. Validar el estilo (≈ 30 créditos)
- [ ] Kara con 4 variaciones en estilo HD-2D chibi → elegir una con el usuario
- [ ] Probar su caminar y su ataque en el juego antes de seguir

## 1. Héroes (≈ 810 créditos) — 7 héroes, cada uno con:
- [ ] Sprite base nuevo (Kara, Teo, Elara, **Nyx con el nuevo diseño**, Ayla, Brina, Brann)
- [ ] Reposo 8 · Caminar 8–12 (balanceo como el brujo) · **Deslizar 6 (nuevo)**
- [ ] Ataque 8–10 con estela de color en el sprite (como la referencia de Nyx) · **Ataque 2 de combo (nuevo)**
- [ ] Lanzar habilidad 8 · Golpe recibido 4 · Muerte 8
- [ ] Motor: poses `dash` y `attack2`, golpe en el fotograma de impacto
- [ ] Prueba obligatoria: caminar a ambos lados + 4 ataques seguidos grabados

## 2. Villa Candela (≈ 400 créditos)
- [ ] 6–8 casas a escala del héroe (puerta a su altura)
- [ ] Puesto de Brunilda, tienda de Maese Ivo, fragua de Tobías, pozo, tablón, faroles, barriles, cercas
- [ ] Árboles y arbustos de la villa en el mismo estilo
- [ ] Ventanas y chimeneas marcadas para luces y humo (villafx.js)

## 3. Vecinos (≈ 370 créditos)
- [ ] Brunilda, Maese Ivo, Tobías + 4 aldeanos (granjero, mujer con cesta, guardia, niño)
- [ ] Reposo + caminar de cada uno

## 4. Efectos de habilidades
- [ ] Estelas, explosiones, rayos y runas animadas propias de cada héroe (sustituyen a los efectos actuales)

## 5. Interfaz (≈ 250 créditos)
- [ ] Kit completo: marcos, botones, barras, iconos de habilidad propios de cada héroe

## 6. Jefes y Súper Jefes con animaciones de sus habilidades (≈ 1400 créditos) — pedido del usuario
Cada jefe (≈ 102 créditos): sprite nuevo 12 + caminar 20 + ataque básico 14 + **2 habilidades animadas 28** + muerte 14
+ **aturdido 14** (bucle tambaleándose para la barra de Ruptura: ya funciona en el juego con estrellas y grietas de luz).
Las habilidades llevan preparación muy visible (2–3 fotogramas de carga) para que el jugador pueda esquivarlas,
y el efecto de la habilidad dibujado en el sprite (estela, onda, aliento, runas).
**Guardianes (8):**
- [ ] Colmillo Ancestral (jabalí) — embestida + pisotón que agrieta el suelo
- [ ] Madre Tejedora / Reina Tejeceniza (araña) — lluvia de telarañas + invocar crías
- [ ] Coloso de Hielo — puñetazo al suelo con picos de hielo + aliento helado
- [ ] Rey Chispín / Tofu Real (desierto) — salto aplastante + lluvia de fuego
- [ ] Hechicero del Abismo — meteoros + círculo de llamas
- [ ] Kraken de las Ruinas — tentáculos que salen del suelo + chorro de tinta
- [ ] Ciervo de Cristal — carga con cuernos + estallido de cristales
- [ ] El Carcelero — cadenas que atrapan + golpe de maza con onda
**Súper Jefes (8):** Rey Ceniza, Madre de la Ciénaga, Titán del Invierno Eterno, Fénix de Ámbar, Archimago del Vacío
y los de Ciudad Hundida, Bosque de Cristal y Ciudadela — cada uno con 2 habilidades propias más grandes que su Guardián
- [ ] (16 jefes en total; hoy los Súper Jefes son el Guardián recoloreado: tendrán sprite propio)
**Ruptura (pedido del usuario):**
- [ ] Efecto animado de RUPTURA: el escudo/coraza del jefe estalla en cristales (hoja de efecto de 8 fotogramas, reutilizable)
- [ ] Efectos en estado roto: estrellas/pájaros girando, grietas de luz que laten y vapor helado (bucle de 6–8 fotogramas)
- [ ] Recoloreo de cada jefe y Súper Jefe roto: versión azul hielo apagada de su sprite (hoy se hace con filtro en el juego;
      con arte propio, una paleta «roto» por jefe que se vea mejor) + animación de aturdido tambaleándose
- [ ] Nuevo enemigo: el brujo encapuchado de la referencia (Hechicero de la Ciudadela o jefe)

## Presupuesto (≈ 4000 créditos)
| Bloque | Créditos |
|---|---|
| Validar estilo (Kara ×4) | 30 |
| 7 héroes completos | 810 |
| 16 jefes con habilidades y aturdido | 1630 |
| Villa | 400 |
| Vecinos | 370 |
| Interfaz | 250 |
| Efectos de habilidades de héroes | 150 |
| **Total** | **≈ 3640** (sobran ~360 para repetir lo que no salga bien) |

## Segunda recarga
- [ ] Monstruos normales (~40) con caminar 8, ataque 8, golpe 3, muerte 6
- [ ] Suelos y decorado de los 8 mundos
