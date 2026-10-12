/* Fendaria — efectos visuales animados (atlas img/fx/vfx.png, fondo negro: se dibujan sumando luz).
 * Ver tools/art/build_vfx.py. Si el atlas no ha cargado, el juego sigue con sus efectos procedurales.
 */
'use strict';

const VFX_IMG = { img: null };
(() => { const img = new Image(); img.onload = () => { VFX_IMG.img = img; }; img.src = 'img/fx/vfx.png'; })();
// fotogramas útiles de cada efecto (el último de "heal" junta tres columnas)
const VFX_USE = { heal: [0, 1, 2] };
let vfxList = [];

// name: efecto; size: tamaño del lado mayor en unidades de mundo
// o: { dur, loop, life, flat, rot, alpha, layer: 'ground'|'top', follow: () => ({x, y}) }
function spawnVfx(name, x, y, size, o = {}) {
  if (!VFX_IMG.img || !VFX_ATLAS[name]) return null;
  const v = Object.assign({ name, x, y, size, t: 0, dur: 0.5, loop: false, life: 0, flat: false, rot: 0, alpha: 1, layer: 'top' }, o);
  vfxList.push(v);
  return v;
}
function resetVfx() { vfxList = []; }
function updateVfx(dt) {
  for (const v of vfxList) {
    v.t += dt;
    if (v.follow) { const p = v.follow(); if (p) { v.x = p.x; v.y = p.y; } }
  }
  vfxList = vfxList.filter((v) => (v.loop ? v.t < v.life : v.t < v.dur));
}

function vfxFrames(name) {
  const A = VFX_ATLAS[name], use = VFX_USE[name];
  return use ? use.map((i) => A.f[i]) : A.f;
}
// Dibuja un fotograma del efecto centrado en (x, y)
function blitVfx(name, x, y, size, frame, alpha, flat, rot, flipX) {
  const A = VFX_ATLAS[name], fr = vfxFrames(name);
  const [sx, sy] = fr[((frame % fr.length) + fr.length) % fr.length];
  const k = size / Math.max(A.w, A.h), w = A.w * k, h = A.h * k;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (flat) ctx.scale(1, 0.5);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(VFX_IMG.img, sx, sy, A.w, A.h, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawVfxLayer(layer) {
  if (!VFX_IMG.img) return;
  for (const v of vfxList) {
    if (v.layer !== layer) continue;
    const n = vfxFrames(v.name).length;
    let f, a = v.alpha;
    if (v.loop) {
      f = Math.floor(v.t * (v.fps || 12));
      a *= Math.min(1, v.t * 6, (v.life - v.t) * 3);
    } else {
      const k = v.t / v.dur;
      f = Math.min(n - 1, Math.floor(k * n));
      a *= k > 0.7 ? (1 - k) / 0.3 : 1;
    }
    blitVfx(v.name, v.x, v.y, v.size, f, a, v.flat, v.rot);
  }
}

// Efectos que dependen del estado (se dibujan cada fotograma sin crear objetos)
function drawVfxState(layer) {
  if (!VFX_IMG.img || !P) return;
  const fr = Math.floor(now * 12);
  if (layer === 'ground') {
    for (const g of glyphs) blitVfx('runeFire', g.x, g.y, g.r * 2.3, fr, Math.min(1, g.life * 1.5) * 0.85, true, 0);
    if (P.frenzyT > 0 || P.warcryT > 0) blitVfx('rage', P.x, P.y, 120, fr, P.frenzyT > 0 ? 0.8 : 0.5, true, 0);
  } else {
    if (P.shield > 0) blitVfx('shield', P.x, P.y - 26, 86, fr, 0.5 + Math.sin(now * 5) * 0.08, false, 0);
    if (P.frenzyT > 0) blitVfx('rage', P.x, P.y - 28, 70, fr + 4, 0.35, false, 0);
    for (const e of enemies) if (!e.dead && e.dot && Math.abs(e.x - cam.x) < 900 && Math.abs(e.y - cam.y) < 600) blitVfx('poison', e.x, e.y - e.r * 1.1, e.r * 2.6, fr + (e.seed * 10 | 0), 0.55, false, 0);
  }
}

// Tajo pintado sobre el tajo procedural (la curva mira hacia fuera, en la dirección del golpe)
function drawVfxSlash(s) {
  if (!VFX_IMG.img || s.arc < 0.8) return;
  const k = 1 - s.life / s.max, a = 1 - k;
  const R = s.range * (0.75 + k * 0.25);
  const size = 2 * s.range * Math.sin(Math.min(s.arc, 3) / 2) * 1.15 + 20;
  const pick = ((s.x * 7 + s.y * 13) | 0) % 5;
  blitVfx('slash', s.x + Math.cos(s.dir) * R * 0.55, s.y - 16 + Math.sin(s.dir) * R * 0.55 * 0.85, size, pick, a, false, s.dir + Math.PI / 2);
}
