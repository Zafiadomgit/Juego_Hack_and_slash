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

## 6b. Pedidos del usuario tras probar en el móvil (29-oct)
- [ ] **Cinemática del prólogo** (y las otras 4): se ven feas; la primera escena es la villa vieja bajo niebla morada
      borrosa. Rehacerlas en HyperFrames (`cinematicas/`) con la villa, los héroes y el Portal nuevos, imagen nítida.
- [ ] **Luz azul del Portal** en la villa: se ve mal (halo azul plano encima de todo). Sustituirla por un efecto
      animado del Portal hecho con SpriteCook (remolino, runas que giran, partículas) y una luz más sutil.
- [ ] **Presentación del estudio Lumen** (pedido del usuario, 29-oct): rehacer la intro de arranque (`www/js/lumen.js`, 5 s)
      con arte propio: logotipo llama-farol pintado en el estilo del juego, partículas y chispas de SpriteCook,
      «LUMEN» forjado con un brillo mejor y «STUDIO». Debe verse en el móvil (ya se arregló que no apareciera en Android).
      Mismo logotipo para la ficha y el tráiler.
- [ ] **Icono de la app** (pedido del usuario, 29-oct): icono nuevo en el estilo HD-2D del rework (héroe o emblema
      de Fendaria reconocible a tamaño pequeño, fondo con contraste). Generar en 1024 y exportar: icono adaptativo de
      Android (primer plano + fondo, `android/app/src/main/res/mipmap-*`), icono de Play Store 512×512, favicon y
      pantalla de arranque de Android 12+ (`ic_launcher_foreground`). Comprobar que se ve bien en círculo y en cuadrado.

## 7. Ficha de Google Play (sin créditos, al terminar el rework)
- [ ] 6 capturas nuevas 1920×1080 en español (`store/`) y en inglés (`store/en/`) con la villa y el arte nuevos
- [ ] Gráfico destacado 1024×500 nuevo (es/en) e icono 512 nuevo (ver 6b)
- [ ] Sustituirlas en Play Console (ficha principal + traducción en inglés) antes de producción

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
