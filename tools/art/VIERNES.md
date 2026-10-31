# Rework visual del viernes 30 (SpriteCook) — lista de control

Créditos previstos: **Adventurer (3000/mes, 5 generaciones a la vez, 8 variaciones, 2K/4K) + paquete de 1000** = 4000.
Paquete de 1000 recomendado YA (no caduca) para validar el estilo con Kara antes del viernes. Estilo y prompts: `tools/art/ESTILO.md`.

## 0. Validar el estilo (≈ 30 créditos)
- [x] Kara con 4 variaciones en estilo HD-2D chibi (31-oct, 96 créditos: las referencias suben el precio a 24 por imagen) → `tools/art/sc_out/kara_comparar.png`
- [x] Rechazadas por el usuario: no son chibi (la Kara vieja de referencia arrastró el estilo antiguo)
- [x] Segunda prueba (56 créditos): `pixel-engine-image-v1` a 96×96 sí sale chibi → `tools/art/sc_out/kara2_comparar.png`
- [ ] Elegir una con el usuario
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

## 5. Interfaz (≈ 250 créditos + ≈ 120 del árbol de talentos)
- [ ] Kit completo: marcos, botones, barras, iconos de habilidad propios de cada héroe
- [ ] **Árbol de talentos (pedido del usuario, 30-oct): rework visual completo** con SpriteCook (skill `spritecook-build-ui-kits`).
      Hoy son 72 iconos sueltos (`www/img/talents/`) sobre fondo plano. Hace falta, en el estilo HD-2D del rework:
  - [ ] Fondo de cada rama por héroe (21 en total: 3 ramas × 7 héroes), con el color y el motivo de la rama
  - [ ] Marcos de nodo: rango (bloqueado / disponible / con puntos / al máximo), encrucijada ★ (dos caminos) y culmen ★★ (más grande, con brillo)
  - [ ] Líneas de unión que se iluminan al aprender el nodo anterior
  - [ ] Iconos repintados en el mismo estilo (los 72 actuales, sin cambiar sus nombres de archivo)
  - [ ] Efecto al aprender un nodo (destello de 6 fotogramas) y al llegar al culmen
  - [ ] Probarlo en el móvil: el árbol cabe a lo alto, los nodos se tocan bien y se leen los rangos

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

## 8. HUD, interfaz y sensación de combate (sin créditos) — hecho el 30-oct, falta probar en el APK
Hecho con las skills `game-feel` y `game-ui-ux`. Todo está en español y en inglés (versión inglesa regenerada).
**Sensación de combate** (`feel.js`, `game.js`, `art.js`)
- [x] Temblor de cámara suave (ondas, no saltos al azar) que pega fuerte y se apaga rápido; respeta Ajustes → Temblor
- [x] Monstruo golpeado: se aplasta y vuelve poco a poco con un pequeño rebote
- [x] Remate de monstruo normal con micro-pausa (22 ms) y temblor mínimo; élite con pausa de 50 ms y más temblor
- [x] Quitada la pausa y el temblor duplicados del crítico
**HUD de combate** (`game.js`, `feel.js`)
- [x] HUD fuera de la muesca de la cámara: vida, panel de la Grieta, radar, racha, barra del jefe, botones de combate, pausa y bolsa
- [x] Botón que queda listo (habilidades, esquiva, definitiva): crece, se asienta y suelta un anillo de luz
- [x] Habilidades en recarga muestran los segundos que faltan (si queda más de 1 s)
- [x] Habilidad sin energía: los cristales de EN tiemblan y se ponen rojos, con una vibración corta
- [x] Barra de vida: destello blanco al recibir un golpe, tramo curado en verde y tramo perdido que baja igual a 30 y a 60 FPS
- [x] Flechas en el borde hacia el Guardián (☠), el cofre (◆), el Duende Dorado (★), las Gemas y el botín Épico/Legendario (⬥) fuera de la pantalla; máximo 4
- [x] Barra del Guardián con la marca de la furia al 50% y nombre más grande (14 px)
- [x] Avisos de botín en una columna a la izquierda con el color y la forma de su rareza (en vez del nombre flotando sobre el héroe)
**Interfaz y menús** (`qol.js`, `ui.css`)
- [x] Ajustes → **Texto grande**: textos del HUD y de los botones un 20% más grandes
- [x] ~~Botones de los menús que se hunden al tocar y vuelven con rebote~~ — quitado tras probar en el APK (no quedó bien); vuelve el hundido sutil de antes
- [x] Cámara de la Grieta más alejada (`look.js`, 380 → 460 unidades): el héroe ya no se ve tan grande ni pegado a la pantalla
- [x] 460 seguía viéndose pegado: ahora por defecto 560 (como la villa) y **Ajustes → Cámara en las Grietas**: Cerca 460 · Media 560 · Lejos 640
- [x] Rareza también por forma en la bolsa (Raro ◆, Épico ✦, Legendario ★), no solo por color
**Revisar en el APK**
- [ ] Girar el móvil a los dos lados: nada bajo la cámara; los botones responden donde se ven
- [ ] El pop de los botones no molesta al encadenar habilidades; los segundos se leen bien
- [ ] Las flechas del borde no estorban junto a los botones de abajo a la derecha; en Difícil no salen demasiadas
- [ ] La columna de botín no tapa el joystick ni el texto de racha
- [ ] Ajustes → Texto grande: nada se sale de su placa
**Ideas para después**
- [x] Rareza por forma también en las ranuras del equipo puesto (hecho, ver sección 11)
- [ ] Texto grande también en los menús HTML (hoy solo el HUD del canvas)

## 9. Historia que cambia cómo se juega (sin créditos) — hecho el 30-oct, falta probar en el APK
Con las skills `dialogue-systems` y `roguelike` (idea de Hades: la historia avanza también al morir). Código en
`www/js/saga.js` (nuevo) y escenas en `www/js/story.js`. Todo en español e inglés. Las decisiones son por héroe.
**Tres decisiones con efecto permanente** (se ven en la tarjeta 📖 de la villa al tocarla, con «✦N»)
- [x] Glaciar (`win2`), tras saber la verdad de Ivo: **perdonarlo** → Confianza de Ivo (+10% vida y energía) ·
      **echárselo en cara** → Diario de la Orden (+15% daño a Guardianes y Súper Jefes). Ivo y Morvhal hablan distinto según lo elegido
- [x] Desierto (`enter3`), oferta de Morvhal: **«Nunca»** → Mirada de los Doce (+5% crítico) ·
      **«¿Qué es la Fendaria Antigua?»** → Susurro del Cerrajero (+20% ámbar, pero recibes un 10% más de daño) y más trasfondo
- [x] Ciudadela (`win7`), la llave rota: **Tobías la funde** → Filo de la Llave (+12% daño) ·
      **la guardan los Doce** → Bendición de los Doce (+12% vida y +10% velocidad de ataque)
- [x] Si se cierra el diálogo sin elegir, cuenta la primera opción
**Hilos cerrados y Morvhal más gris**
- [x] Nereth (Heraldo de la Marea) es el hermano pequeño de Ivo: pistas en la Ciudad Hundida y revelación al vencerlo
- [x] Ivo confiesa (fin del Bosque de Cristal) que la Orden selló aquellas tierras con su gente dentro; Morvhal era uno de los doce y quería sacarlos
- [x] Al vencer al Carcelero vuelven los doce runistas (Elden habla) → Runas de la Orden (+5% daño y vida)
- [x] Cada Súper Jefe liberado (mundos 1–7) se despide al caer
**Morir también cuenta**
- [x] Primera muerte: Ivo explica que el Portal devuelve a quien lleva la luz de Candela
- [x] Al volver derrotado, un vecino comenta (consejos de jefe si caíste ante un Guardián o Súper Jefe)
- [x] Caer 2 y 4 veces en la misma Grieta: Ánimo de la villa (+10% / +20% de daño y vida allí hasta superarla)
- [x] Morvhal (o la voz) se burla al volver a entrar en una Grieta tras morir
**Probado** en Chrome sin ventana (es y en): las 3 decisiones con sus efectos, muertes, ánimo, burla y despedida; sin errores
**Revisar en el APK**
- [ ] Los botones de elección se leen bien y caben en el cuadro de diálogo en el móvil
- [ ] Tocar la tarjeta 📖 de la villa abre la lista de efectos sin taparse con nada
- [x] Partidas que ya pasaron esas escenas: Ivo les ofrece las decisiones en la villa (ver sección 11)

## 10. Poder del héroe y progresión (sin créditos) — hecho el 30-oct, falta probar en el APK
**Problema encontrado:** `balance.js` subía la vida y el daño de los monstruos en la misma proporción que el poder real del héroe,
así que refinar, subir talentos o Trascendencia casi no se notaba (los monstruos crecían igual).
- [x] **Simulador** `tools/balance/simular.js` (`node tools/balance/simular.js`, usa Chrome o Edge): crea héroes con las funciones reales del
      juego (equipo, refinado, talentos, Trascendencia, Forja) en 3 perfiles (justo, normal, fuerte) y escribe `tools/balance/resultado.md`
- [x] **Poder esperado** por Grieta (medido con el simulador) y **banda de tolerancia**: hasta un 50% por encima de lo esperado no se
      compensa nada; por encima, solo la mitad del exceso. Golpes que aguanta un monstruo normal: con lo esperado ~3,5;
      jugador normal 2–4 (antes 5–7), fuerte 1–2 (antes 4–7), y quien no mejora nada como mucho ~8 (sin muro)
- [x] Los jefes siguen la misma proporción; su mínimo de golpes (45 Guardián / 110 Súper Jefe) baja hasta la mitad si vas muy por encima
- [x] **Poder visible**: «⚔ Poder» en la tarjeta de la villa y «Poder recomendado (tú X)» en el mapa de Grietas (verde si llegas; rojo si vas muy por debajo)
- [ ] Revisar en el APK: ¿se siente más fuerte al refinar y subir talentos? ¿los jefes siguen siendo un reto? (ajustes: `HITS_EXPECTED` y `expectK` en `balance.js`)
**Pendiente de decidir** (cambia mucho el juego)
- [ ] Ordenar las ~15 fuentes de poder en 3 capas: **Equipo** (botín y forja), **Héroe** (talentos y Trascendencia) y **Partida** (bendiciones);
      las mejoras de Maese Ivo y los Pactos pasarían a ser de comodidad (energía, imán, bolsa, re-tiradas) y no de daño puro

## 11. Más disfrutable (sin créditos) — hecho el 30-oct, falta probar en el APK
- [x] **Fluidez**: los choques con árboles y rocas usan una rejilla (cada cuerpo mira solo las 9 celdas de su alrededor, antes todo el mapa).
      En la prueba con combate real, esa parte pasó de ~5% del tiempo a casi nada y el juego aguantó en mejor calidad gráfica.
      Revisado con la skill `capacitor-performance`: sin registros de depuración en el juego y con la aceleración por hardware activa
- [x] **Aviso de Poder** en la villa: al equiparte, refinar o subir talentos sale «⚔ Poder 120 → 135 +15» (verde si sube)
- [x] **Partidas antiguas**: si ya pasaste el Glaciar, el Desierto o la Ciudadela antes de que existieran las decisiones,
      Maese Ivo te las ofrece al hablar con él (una por charla) y recibes su efecto
- [x] Rareza por forma también en las ranuras del **equipo puesto** (◆ ✦ ★)
- [x] **Fallo en la Grieta 1 con la Flecha Atronadora (pantalla café)**: no se reproduce en el PC. El juego ya no se congela si un fotograma falla:
      se recupera (también si fallaba dibujando el mundo HD-2D, que dejaba la pantalla quieta), guarda el error y lo enseña abajo a la izquierda
- [ ] Si vuelve a pasar: foto del aviso rojo de abajo a la izquierda (dice qué falló) para arreglar la causa
**Revisar en el APK**
- [ ] El combate va igual o más fluido con muchos monstruos (y sin atravesar árboles ni rocas)
- [ ] El aviso de Poder no tapa nada arriba y no sale de más (solo cuando cambia)

## 12. Grimorio y árbol de talentos 2 (sin créditos) — hecho el 30-oct, falta probar en el APK
Código en `www/js/grimoire.js` (nuevo). Todo en español e inglés.
**Grimorio** (pestaña nueva en la ficha del héroe): 5 habilidades (las 3 de siempre + 2 nuevas) y 2 definitivas por héroe.
Eliges qué habilidad va en cada botón y qué definitiva llevas. Gratis en Villa Candela; dentro de una Grieta no se cambia.
- [x] 14 habilidades nuevas y 7 definitivas nuevas:
  - Rompeyelmos: Cadena de Hierro, Martillo Rúnico · definitiva Ira del Gigante
  - Ojo de Halcón: Lluvia Venenosa, Paso del Viento · Halcón Real
  - Runista: Orbe Arcano, Égida Reflectante · Tormenta Rúnica
  - Sombra: Ejecución, Lluvia de Dagas · Marca de la Muerte
  - Domadora: Aullido Ancestral, Espíritus Guardianes · Gran Cacería
  - Artificiera: Granada de Fragmentación, Escudo de Chispas · Lluvia de Cohetes
  - Berserker: Corte Carmesí, Desafío · Sangre Hirviente
- [x] Cada habilidad funciona en cualquier botón: bendiciones, talentos y ataques Ω reaccionan igual
**Árbol de talentos 2** (mismas 3 ramas y nodos por héroe, reglas y diseño nuevos)
- [x] 8 filas que se abren con los puntos gastados EN TOTAL (0, 2, 4, 7, 10, 14, 18, 24): se pueden mezclar ramas
- [x] Solo UN culmen en todo el árbol (la fila VIII): define a tu héroe
- [x] Columna del **Grimorio** en el centro: habilidad nueva 1 (4 puntos), habilidad nueva 2 (10) y definitiva nueva (18)
- [x] Árboles de antes: los puntos se devuelven una vez con un aviso (las reglas han cambiado)
**Probado** en Chrome sin ventana (es y en): los 7 héroes lanzan sus 2 habilidades nuevas, una de siempre en otro botón y la definitiva nueva; sin errores
**Revisar en el APK**
- [ ] Equilibrio de las habilidades nuevas (daño, recarga y energía) frente a las de siempre
- [ ] El árbol y el Grimorio se leen y se tocan bien en el móvil
**Arte que falta** (va con el rework de SpriteCook de la sección 5)
- [ ] Iconos propios de las 14 habilidades y 7 definitivas nuevas (hoy usan iconos de talentos que ya existían)
- [ ] Efectos propios: cadena, martillo rúnico, orbe, marca de la muerte, cohetes…

## Aplazado (pedido del usuario, 30-oct): se decide cuando estén los reworks y lo visual
- [ ] Combate por turnos estilo JRPG (grupo de 4 héroes, puntos débiles y ruptura): primero un prototipo en una rama aparte
- [ ] Cambiar la historia (antes, decir qué no convence: tono, personajes, ritmo o villano)

## Presupuesto (≈ 4000 créditos)
| Bloque | Créditos |
|---|---|
| Validar estilo (Kara ×4) | 30 |
| 7 héroes completos | 810 |
| 16 jefes con habilidades y aturdido | 1630 |
| Villa | 400 |
| Vecinos | 370 |
| Interfaz | 250 |
| Árbol de talentos (fondos, marcos, uniones, iconos) | 120 |
| Efectos de habilidades de héroes | 150 |
| **Total** | **≈ 3760** (sobran ~240 para repetir lo que no salga bien) |

## Segunda recarga
- [ ] Monstruos normales (~40) con caminar 8, ataque 8, golpe 3, muerte 6
- [ ] Suelos y decorado de los 8 mundos
