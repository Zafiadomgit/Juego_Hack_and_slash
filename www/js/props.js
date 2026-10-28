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
  dungeon: { bones: 'bonepile' },
  cristal: { glowshroom: 'shroom' },
  ciudadela: { bones: 'bonepile' },
};

// Número estable a partir de la posición (variante y volteo fijos para cada objeto)
const propHash = (x, y) => { let h = Math.imul((x * 73) | 0, 0x9e3779b1) ^ Math.imul((y * 131) | 0, 0x85ebca6b); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

function propFrame(kind, x, y) {
  if (scene !== 'rift') return null;
  const id = rift && rift.isDungeon && PROP_IMG.dungeon ? 'dungeon' : curBiome().id, img = PROP_IMG[id], list = PROP_ATLAS[id] && PROP_ATLAS[id][kind];
  if (!img || !list || !list.length) return null;
  const h = propHash(x, y);
  return { img, f: list[Math.floor(h * list.length) % list.length], flip: ((h * 7919) % 1) < 0.5 };
}

// Dibuja el sprite apoyado en (x, y) con la escala indicada
function blitProp(fr, x, y, scale, sink = 0) {
  const [sx, sy, sw, sh] = fr.f;
  const w = sw * PROP_WU_PER_PX * scale, h = sh * PROP_WU_PER_PX * scale;
  ctx.save();
  ctx.translate(x, y + h * sink);
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
    glow(o.x, o.y - h * 0.8, 26 * fl, rift.isDungeon ? (o.ph > 3 ? '200,90,255' : '255,150,60') : ({ glaciar: '120,190,255', hundida: '90,190,255', cristal: '210,170,255', ciudadela: '200,90,255' })[curBiome().id] || '255,150,60', 0.7);
    if (Math.random() < 0.25) particles.push({ kind: 'glowdot', x: o.x + rand(-4, 4), y: o.y - h * 0.85, vx: rand(-8, 8), vy: rand(-60, -30), life: 0.6, max: 0.6, rgb: '255,170,70', size: 3, grav: 0 });
  }
  return true;
}

// Detalles del suelo (se pintan una vez en los trozos de suelo cacheados)
function drawPropDeco(d) {
  if (scene !== 'rift') return false;
  const map = PROP_DECO[rift && rift.isDungeon && PROP_IMG.dungeon ? 'dungeon' : curBiome().id];
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
  const pool = kind === 'oak' ? list.slice(0, 2) : list; // el tercer roble trae un rombo de tierra pintado: fuera de la plaza flota
  return { img, f: pool[Math.floor(h * pool.length) % pool.length], flip: kind !== 'sign' && kind !== 'board' && ((h * 7919) % 1) < 0.5 };
}
// fracción de la altura del sprite que queda por debajo del punto de apoyo (mitad del rombo de la base)
const VILLA_SINK = { house: 0.13, stall: 0.1, alchemy: 0.08, well: 0.05, oak: 0.05, forge: 0.08 };
// escala de cada elemento para que todo esté a la medida del héroe (≈100 de alto): puertas a su altura, casas de dos pisos
const VILLA_SCALE = { house: 2.05, stall: 1.55, alchemy: 1.5, forge: 1.6, well: 1.4, lamp: 1.7, barrel: 1.5, bush: 1.6, sign: 1.4, cauldron: 1.6, board: 1.45, oak: 2 };
const villaScale = (kind, o) => (VILLA_SCALE[kind] || 1) * (kind === 'oak' ? o.s || 1 : 1);
const VILLA_KIND = { forge: 'forge', house: 'house', stall: 'stall', alchemy: 'alchemy', well: 'well', lamp: 'lamp', barrel: 'barrel', bush: 'bush', sign: 'sign', cauldron: 'cauldron' };
// sombras de contacto de la villa en una capa aparte, sobre el suelo y antes que los objetos
// (si cada objeto pinta la suya, la del árbol de delante cae encima del de detrás y parece que flota)
let villaShadowPass = false;
function villaShadows(list) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,20,0.32)';
  for (const o of list) {
    const kind = o.kind === 'tree' ? 'oak' : o.kind === 'board' ? 'board' : VILLA_KIND[o.kind];
    const fr = kind && villaFrame(kind, o.x, o.y);
    if (!fr) continue;
    const sw = fr.f[2] * PROP_WU_PER_PX * villaScale(kind, o);
    const iso = VILLA_SINK[kind] && kind !== 'oak';
    const rx = iso ? sw * 0.5 : kind === 'oak' ? Math.min(sw * 0.3, 46) : Math.min(sw * 0.36, 40), ry = iso ? sw * 0.24 : rx * 0.42;
    ctx.beginPath(); ctx.ellipse(o.x, o.y + (iso ? 4 : 1), rx, ry, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
// Dibuja un elemento del pueblo con sprite pintado; devuelve false si no hay sprite
function drawVillaSprite(o) {
  const kind = o.kind === 'tree' ? 'oak' : o.kind === 'board' ? 'board' : VILLA_KIND[o.kind];
  if (!kind) return false;
  const fr = villaFrame(kind, o.x, o.y);
  if (!fr) return false;
  const scale = villaScale(kind, o);
  const sw = fr.f[2] * PROP_WU_PER_PX * scale;
  // los edificios tienen una base isométrica (rombo): se apoyan por el centro de esa base
  const sink = VILLA_SINK[kind] || 0;
  if (villaShadowPass) { blitProp(fr, o.x, o.y, scale, sink); return true; } // las sombras ya están en su capa
  if (sink) {
    // sombra de contacto con la forma del rombo de la base
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.fillStyle = 'rgba(10,8,20,0.38)';
    ctx.beginPath(); ctx.ellipse(0, 4, sw * 0.5, sw * 0.24, 0, 0, TAU); ctx.fill();
    ctx.restore();
  } else shadow(o.x, o.y + 1, Math.min(sw * 0.38, 70));
  blitProp(fr, o.x, o.y, scale, sink);
  return true;
}

// altura en el mundo de cada vecino: adultos casi como el héroe, el niño más bajo
const VILLAGER_H = { vil3: 68 };
function villagerH(kind) {
  const list = PROP_ATLAS.villa && PROP_ATLAS.villa[kind];
  return list ? VILLAGER_H[kind] || 94 : 0;
}
// Vecinos pintados: personaje de pie que respira o camina (rebote y balanceo suaves)
function drawVillager(kind, x, y, face, moving, t) {
  const img = PROP_IMG.villa, list = PROP_ATLAS.villa && PROP_ATLAS.villa[kind];
  if (!img || !list) return false;
  const f = list[0];
  const hop = moving ? Math.abs(Math.sin(t * 9)) * 2.2 : 0;
  const breath = moving ? 0 : Math.sin(t * 2.4) * 0.012;
  const h = villagerH(kind), w = h * f[2] / f[3];
  ctx.save();
  ctx.translate(x, y - hop);
  ctx.rotate(moving ? Math.sin(t * 9) * 0.05 : 0);
  ctx.scale(face * (1 - breath * 0.5), 1 + breath);
  ctx.drawImage(img, f[0], f[1], f[2], f[3], -w / 2, -h + 2, w, h);
  ctx.restore();
  return true;
}
