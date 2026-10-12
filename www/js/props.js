/* Fendaria — objetos de escenario pintados (pixel art HD-2D) por bioma.
 * Los sprites vienen empaquetados en img/props/<bioma>.png (ver tools/art/build_props.py y props_data.js).
 * Si un bioma no tiene sprite para un tipo de objeto, se usa el dibujo procedural de siempre.
 */
'use strict';

const PROP_IMG = {};
Object.keys(PROP_ATLAS).forEach((id) => {
  const img = new Image();
  img.onload = () => { PROP_IMG[id] = img; if (typeof groundChunks !== 'undefined') groundChunks.clear(); };
  img.src = 'img/props/' + id + '.png';
});

// Detalles del suelo que se sustituyen por sprites, por bioma: tipo de deco → tipo de sprite
const PROP_DECO = {
  ceniza: { fern: 'fern', bones: 'bones' },
  pantano: { glowshroom: 'shroom' },
  glaciar: { iceshard: 'shard' },
  desierto: { bones: 'skull' },
};

// Número estable a partir de la posición (variante y volteo fijos para cada objeto)
const propHash = (x, y) => { let h = Math.imul((x * 73) | 0, 0x9e3779b1) ^ Math.imul((y * 131) | 0, 0x85ebca6b); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

function propFrame(kind, x, y) {
  if (scene !== 'rift') return null;
  const id = curBiome().id, img = PROP_IMG[id], list = PROP_ATLAS[id] && PROP_ATLAS[id][kind];
  if (!img || !list || !list.length) return null;
  const h = propHash(x, y);
  return { img, f: list[Math.floor(h * list.length) % list.length], flip: ((h * 7919) % 1) < 0.5 };
}

// Dibuja el sprite apoyado en (x, y) con la escala indicada
function blitProp(fr, x, y, scale) {
  const [sx, sy, sw, sh] = fr.f;
  const w = sw * PROP_WU_PER_PX * scale, h = sh * PROP_WU_PER_PX * scale;
  ctx.save();
  ctx.translate(x, y);
  if (fr.flip) ctx.scale(-1, 1);
  ctx.drawImage(fr.img, sx, sy, sw, sh, -w / 2, -h + 2 * scale, w, h);
  ctx.restore();
  return h;
}

// Obstáculos de la Grieta: devuelve true si se ha dibujado con sprite
function drawPropSprite(o, kind) {
  const fr = propFrame(kind, o.x, o.y);
  if (!fr) return false;
  const scale = kind === 'brazier' ? 1 : o.s || 1;
  const [, , sw] = fr.f;
  shadow(o.x, o.y + 2, Math.min(sw * PROP_WU_PER_PX * scale * 0.42, kind === 'tree' ? 34 * scale : 60));
  if (kind === 'crystal') {
    const rgb = CRYSTAL_COLS[o.hue][3], pulse = 0.75 + Math.sin(now * 2 + o.ph) * 0.25;
    glow(o.x, o.y - 22 * scale, 50 * scale, rgb, 0.45 * pulse);
  }
  const h = blitProp(fr, o.x, o.y, scale);
  if (kind === 'brazier') {
    const fl = 0.8 + Math.sin(now * 13 + o.ph) * 0.12 + Math.sin(now * 7.3 + o.ph) * 0.08;
    glow(o.x, o.y - h * 0.8, 26 * fl, curBiome().id === 'glaciar' ? '120,190,255' : '255,150,60', 0.7);
    if (Math.random() < 0.25) particles.push({ kind: 'glowdot', x: o.x + rand(-4, 4), y: o.y - h * 0.85, vx: rand(-8, 8), vy: rand(-60, -30), life: 0.6, max: 0.6, rgb: '255,170,70', size: 3, grav: 0 });
  }
  return true;
}

// Detalles del suelo (se pintan una vez en los trozos de suelo cacheados)
function drawPropDeco(d) {
  if (scene !== 'rift') return false;
  const map = PROP_DECO[curBiome().id];
  const kind = map && map[d.kind];
  if (!kind) return false;
  const fr = propFrame(kind, d.x, d.y);
  if (!fr) return false;
  blitProp(fr, d.x, d.y, (d.s || 1) * 0.9);
  return true;
}

// ---------- Villa Candela ----------
function villaFrame(kind, x, y) {
  const img = PROP_IMG.villa, list = PROP_ATLAS.villa && PROP_ATLAS.villa[kind];
  if (!img || !list || !list.length) return null;
  const h = propHash(x, y);
  return { img, f: list[Math.floor(h * list.length) % list.length], flip: kind !== 'sign' && kind !== 'board' && ((h * 7919) % 1) < 0.5 };
}
const VILLA_KIND = { house: 'house', stall: 'stall', alchemy: 'alchemy', well: 'well', lamp: 'lamp', barrel: 'barrel', bush: 'bush', sign: 'sign', cauldron: 'cauldron' };
// Dibuja un elemento del pueblo con sprite pintado; devuelve false si no hay sprite
function drawVillaSprite(o) {
  const kind = o.kind === 'tree' ? 'oak' : o.kind === 'board' ? 'board' : VILLA_KIND[o.kind];
  if (!kind) return false;
  const fr = villaFrame(kind, o.x, o.y);
  if (!fr) return false;
  const scale = kind === 'oak' ? o.s || 1 : 1;
  const sw = fr.f[2] * PROP_WU_PER_PX * scale;
  shadow(o.x, o.y + 1, Math.min(sw * 0.38, 70));
  blitProp(fr, o.x, o.y, scale);
  return true;
}
