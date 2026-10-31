# Fendaria — guía de estilo de personajes (rework visual con SpriteCook)

Referencia visual: `tools/art/ref/estilo_personajes.png` (elfa de verde, encapuchado de azul, erudita de turquesa)
y `tools/art/ref/estilo_encapuchado.png` (el ejemplo del usuario, 82×82).

**ESTILO ELEGIDO (31-oct): Kara 6** → `tools/art/sc_out/kara2_6.png` (asset `d8ed40a1-5e8f-4ebd-9728-47b5f6a96e79`).
Es la referencia de TODO el juego: héroes, vecinos, villanos, monstruos y jefes (prueba: `sc_out/coherencia2.png`).
**Cómo generarlo:** `python3 tools/art/sc_gen.py lote.json` → `gpt-image-2.5-sunburst`, pixel, fondo transparente,
`style_asset_ids` = Kara 6 + encapuchado (y como `reference_asset_id` la referencia de diseño de ese personaje si la hay:
`ref/sombra_ref.png` para Nyx, el brujo de `ref/villano_caminar_ref.webp`, la seta de `ref/monstruo_seta_ref.webp`).
≈ 24–32 créditos por imagen. Pedir `size` 128 (96 para monstruos pequeños).
**Tamaño de píxel igual en todo:** héroe ≈ 124 px de alto. Si un sprite sale más grande (p. ej. 250 px, pixelado más fino),
reducirlo con `python3 tools/art/sc_norm.py in.png out.png 2` (gratis). Pedir «small sprite» en el prompt NO sirve: sale de 32 px.
**Si sale diminuto (≈32 px)**: el procesado de pixel art de SpriteCook calculó mal el píxel. La imagen buena está en
`raw_url` (`get_asset_metadata` con `verbose: true`, 1024 px): bajarla y reducirla con `sc_norm.py in.png out.png h136` (gratis).
No repetir la generación (vuelve a pasar y se paga otra vez).
**No usar el sprite viejo como referencia**: arrastra el estilo antiguo. `pixel-engine-image-v1` sale chibi pero con menos calidad de pixelado.

## El estilo
- **HD-2D al estilo Octopath Traveler**, chibi de **2 cabezas de alto** (cabeza grande, cuerpo corto pero esbelto).
- Silueta **limpia y legible** a tamaño pequeño; contorno oscuro nítido.
- **Sombreado suave con tramado (dither)**, **luz cálida desde arriba a la izquierda** en todos los sprites, paleta limitada.
- **Bordes de píxel nítidos**, sin antialias ni desenfoque.
- Vista de frente, de pie en reposo para el sprite base; las animaciones (caminar, atacar, lanzar, golpe recibido) salen de ese base.

## Sufijo común (va al final de TODOS los prompts de personaje)
```
Clean readable silhouette, soft dithered shading, warm light from upper left, limited palette, crisp pixel edges.
```
Prefijo común:
```
Octopath Traveler HD-2D style chibi character sprite, front view standing idle, tall 2-head-tall proportions:
```

## Ejemplos del usuario (tal cual)
- "Octopath Traveler HD-2D style chibi character sprite, front view standing idle, tall 2-head-tall proportions: a mysterious hooded figure called The System, long blue cloak with a high collar and gold clasp, pale silver hair, calm cold expression, faint glowing blue eyes, dark gloves, dark boots. Clean readable silhouette, soft dithered shading, warm light from upper left, limited palette, crisp pixel edges."
- "Octopath Traveler HD-2D style chibi character sprite, front view standing idle, tall 2-head-tall proportions: a young woman scholar named Margo with a teal long coat, small round glasses, dark hair in a bun, warm skin, cream scarf, brown boots, small satchel. Clean readable silhouette, soft dithered shading, warm light from upper left, limited palette, crisp pixel edges."

## Héroes (mantienen su diseño actual de `www/img/heroes/px/`, pasado a este estilo)
Prefijo + descripción + sufijo:
- **Kara, la Rompeyelmos (iop):** a fierce young warrior woman named Kara, long red ponytail, red tabard over steel plate armor, fur collar, red cape, steel greaves, carrying a huge double-bladed battle axe on her shoulder, determined grin.
- **Teo, Ojo de Halcón (cra):** a young ranger named Teo, green hood and short green cape, brown leather jerkin with straps, quiver of arrows on his back, wooden longbow in hand, brown boots, keen eyes.
- **Elara, la Runista (feca):** a young rune mage named Elara, wide-brimmed pointed blue wizard hat with gold band, long blue robe with gold trim, long blonde hair, wooden staff topped with a glowing blue crystal, calm kind expression.
- **Nyx, la Sombra (sombra) — NUEVO DISEÑO elegido por el usuario (29-oct), ver `ref/sombra_ref.png`:** a graceful dual-blade dancer assassin named Nyx, warm brown skin, long dark purple hair in two high buns with long flowing tails and gold hair ornaments, violet eyes, fitted dark purple outfit with gold trim, gold armbands, black and gold boots, wielding two long thin silver blades held low to the sides, light agile stance.
- **Ayla, la Domadora (domadora):** a wild beast tamer named Ayla, curly brown hair with braids and feathers, fur-trimmed hide top and skirt, bone necklace, tall wooden staff with feathers, barefoot with fur wraps, a small grey wolf pup at her side.
- **Brina, la Artificiera (artificiera):** a cheerful tinkerer girl named Brina, leather aviator cap with brass goggles, blonde hair, white shirt with rolled sleeves, brown overalls with tool pockets, big wrench in one hand and a round black bomb with a lit fuse in the other, work boots.
- **Brann, el Berserker (berserker):** a huge muscular berserker named Brann, long braided red hair and braided red beard, bare chest covered in red glowing rune tattoos, fur kilt and fur boots, iron bracers, wielding an enormous chipped stone greatsword. (Él es más alto y ancho que el resto: 2,3 cabezas.)

## Vecinos de Villa Candela
- **Brunilda (mercader):** a plump friendly market woman named Brunilda, red hair in a bun, green dress with cream apron, rolled sleeves, holding a small coin pouch, warm smile.
- **Maese Ivo (alquimista):** an old alchemist named Master Ivo, long white beard, purple pointed hat and purple robe with stars, round spectacles, holding a bubbling green potion flask.
- **Tobías (herrero):** a stocky blacksmith named Tobias, bald head, thick brown beard, leather apron over a sleeveless shirt, strong arms, holding a smith hammer.
- **Aldeanos:** farmer with straw hat and hoe; woman with basket of apples; town guard with helmet and spear; small kid with a green shirt (kid: 1,6 cabezas).

## Monstruos (mismo estilo, sin el «2-head-tall»)
```
Octopath Traveler HD-2D style chibi monster sprite, front three-quarter view, idle pose: <descripción>. Clean readable silhouette, soft dithered shading, warm light from upper left, limited palette, crisp pixel edges.
```
Ejemplos: mossy boar with tusks and moss on its back (bouftou) · small fiery chick spirit (tofu) · ash-grey spider with orange glowing marks (arakne) · walking spitting mushroom (pissenlit) · basalt golem with lava cracks (craqueleur).

## Reglas para que todo encaje en el juego
- Tamaño en el juego: héroe ≈ 104 de alto; vecinos adultos ≈ 94; niño ≈ 68; monstruos según `MON_SIZE` (look.js).
- Generar en lienzo cuadrado con el personaje centrado y los pies en la misma línea; fondo transparente.
- Para animar con SpriteCook, la imagen base debe medir **256×256 o menos**.
- Mismo sentido de la luz (arriba a la izquierda) en héroes, vecinos, monstruos y edificios.

## Animaciones: fluidas (petición del usuario)
Hoy los héroes tienen muy pocos fotogramas: reposo 2–4, ataque 3–6, lanzar 3–6, golpe 1–2 y **sin pose de deslizar**
(el dash reutiliza la de caminar). Objetivo del rework, por héroe:

| Animación | Fotogramas | Velocidad | Notas |
|---|---|---|---|
| Reposo (idle) | 8 | 8 fps | respiración, pelo y capa que se mueven |
| Caminar | 8–12 | 12 fps | ciclo completo, sin saltos entre el último y el primero |
| Deslizar / dash | 6 | 18 fps | inclinado hacia delante, capa y pelo hacia atrás; 1 de arranque, 4 de deslizamiento, 1 de frenada |
| Ataque básico | 8–10 | 16–20 fps | anticipación (2) → tajo con estela/smear (2) → impacto (1) → recuperación (3); el golpe del juego cae en el fotograma de impacto |
| Ataque 2 (combo) | 8 | 18 fps | variante con el arma al otro lado, para alternar golpes |
| Lanzar habilidad | 8 | 14 fps | carga (3) → liberación (2) → recuperación (3) |
| Golpe recibido | 4 | 16 fps | retroceso y vuelta |
| Muerte | 8 | 12 fps | cae y se queda en el suelo |

Reglas para que se vea fluido:
- **Mismo encuadre en todos los fotogramas**: pies en la misma línea y el cuerpo centrado, para que no «tiemble».
- Movimiento secundario (pelo, capa, bufanda) que sigue al cuerpo con un poco de retraso.
- El arma deja **estela (smear) de 1–2 fotogramas** en el tajo; nada de saltar de pose a pose.
- Vista de lado (mirando a la derecha); el juego voltea para la izquierda.
- Monstruos: reposo 6, caminar 8, ataque 8 (con anticipación clara para que el jugador pueda esquivar), golpe 3, muerte 6.

Coste aproximado en SpriteCook: héroe base 12 + primera animación 20 + 14 por cada animación extra
→ ~7 animaciones por héroe ≈ 116 créditos por héroe, **≈ 810 para los 7** (más que los ~520 estimados al principio).
En el motor: `HERO_ANIM` (anim_data.js) admite estas poses; hay que añadir la pose `dash` y `attack2`, y que el
golpe se aplique en el fotograma de impacto.

## Fallos vistos en el móvil (29-oct) que el arte nuevo NO debe repetir
Lista de control para revisar cada animación antes de meterla en el juego:
- **Caminar con zancada corta**: los pies de Kara y Teo apenas se separan, así que parece que se deslizan. Las piernas
  deben abrirse de verdad (paso largo, rodilla que se dobla) y el cuerpo debe subir y bajar en cada paso.
- **Ataque de un solo lado**: solo hay un tajo, y el juego lo pone al revés para el golpe alterno. Hace falta un
  `attack2` de verdad (tajo de vuelta o al otro lado) para el combo.
- **Monstruos que patinan**: el ciclo de andar debe tener contacto claro de cada pata con el suelo; el motor ya
  avanza los fotogramas según la distancia recorrida (anim2.js), así que el ciclo debe ser completo y regular.
- **Fotogramas que tiemblan**: mismo encuadre y la misma línea de pies en todos los fotogramas de una animación.
- **Pocas poses**: nada de animaciones de 2–4 fotogramas (ver la tabla de arriba).
Prueba obligatoria: grabar al héroe caminando hacia ambos lados y atacando 4 veces seguidas, y a cada monstruo
caminando, antes de dar una animación por buena.

## Referencias de animación del usuario (29-oct) — «algo así quiero»
Archivos en `tools/art/ref/` (tira de fotogramas en `ref/refs_tiras.png`):
- **`sombra_ataque_ref.webp` — ataque de Nyx (8 fotogramas).** Así deben sentirse TODOS los ataques de los héroes:
  1–2 guardia con las dos espadas bajas → 3 preparación (gira el torso y recoge los brazos) → 4 **tajo con estela
  en media luna morada dibujada en el propio sprite** → 5 seguimiento con la estela que se deshace en chispas →
  6 el arma termina el recorrido → 7–8 vuelta a la guardia. El pelo y las coletas siguen el giro con retraso.
  Para Nyx: estela morada; para cada héroe, la estela del color de su clase (rojo Kara, verde Teo, azul Elara…).
- **`villano_caminar_ref.webp` — caminar del brujo encapuchado (8 fotogramas).** Así deben caminar héroes, vecinos
  y monstruos: el cuerpo se mece de lado a lado con un rebote suave, la túnica y la capa ondean, el arma/bastón
  se balancea con el paso y el libro acompaña; mismo encuadre en los 8 fotogramas (no tiembla).
  Además, el **brujo** (sombrero puntiagudo, capucha negra sin cara con ojos brillantes, túnica raída con parches,
  libro de hechizos y bastón con orbe) sirve de modelo para un **enemigo**: Hechicero de la Ciudadela o jefe.
- **`sombra_ref.png`** — diseño de Nyx que sustituye al actual (encapuchada con máscara).

## Monstruos: referencia del usuario (29-oct) — «en ese estilo quiero los monstruos»
`ref/monstruo_seta_ref.webp` (tira en `ref/monstruo_seta_tira.png`): la Seta Escupidora en el estilo deseado, 8 fotogramas
de ataque. Chibi redondito, contorno oscuro limpio, sombreado suave, paleta cálida, proporciones achaparradas, cara simple.
Ataque de referencia (prompt del usuario, usarlo como plantilla de ataque cuerpo a cuerpo de monstruos pequeños):
> "Pull back with a small hop, lifting one stubby arm and leaning the mushroom cap slightly behind the body, then lunge
> forward with a quick two-handed body slam or shove, briefly stretching the torso into the strike before settling back
> into a centered recovery stance."
Reglas para TODOS los monstruos:
- Este estilo y este nivel de animación (preparación con saltito → golpe estirando el cuerpo → vuelta al centro).
- Si hace falta, se baja su velocidad de movimiento o de ataque, se hacen menos a la vez o se simplifica el diseño:
  **que se vean bien manda** (pedido del usuario).
- Tamaño acorde a lo que son, según `MON_SIZE` (look.js): pequeños ~55–70, medianos ~85–95, gólems ~115 (héroe 104).
- Caminar 8 fotogramas con saltitos y balanceo (como el brujo), golpe 3, muerte 6.

## Animar (probado con Kara, 31-oct)
1. Base girada a la derecha: editar la imagen elegida (`edit_asset_id`) pidiendo vista de tres cuartos; si sale mirando a la izquierda, voltearla (gratis) y subirla con `sc_upload.py`.
2. `python3 tools/art/sc_anim.py lote.json` (20 créditos por animación). **Caminar con `pixel-engine-v1.5`** (de perfil, zancada larga; su primer fotograma es el giro: no usarlo). Reposo, ataque y golpe con la v1.1 por defecto.
3. `python3 tools/art/sc_hero_atlas.py ID idle=… walk=…:1,2,3,4,5,6,7 attack=… hurt=…:0,1` → atlas y `HERO_ANIM` sin reescalar.
