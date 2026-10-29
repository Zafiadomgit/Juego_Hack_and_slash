/* Fendaria — monstruos que caminan de verdad: los fotogramas de andar avanzan según la distancia recorrida
 * (no según el reloj), con un rebote en cada pisada; si no se mueven, reposo. Así no «patinan» por el suelo. */
'use strict';

function monStep(e) {
  const t = performance.now();
  if (e._mx === undefined) { e._mx = e.x; e._my = e.y; e._wd = 0; e._st = t; e._sp = 0; }
  const d = Math.hypot(e.x - e._mx, e.y - e._my), dt = Math.max(1, t - e._st) / 1000;
  if (d < 60) { e._wd += d; e._sp = e._sp * 0.8 + (d / dt) * 0.2; } // saltos grandes (empujones, teletransporte) no cuentan como pasos
  e._mx = e.x; e._my = e.y; e._st = t;
}
const _monPoseW = monPose;
monPose = function (e, A) {
  const r = _monPoseW(e, A);
  if (r[0] !== 'move' || !A.move) return r;
  if ((e._sp || 0) < 6 && A.idle) return ['idle', Math.floor(e.t * 5) % A.idle.length];
  const stride = Math.max(14, (e.hTop || e.r * 3) * 0.32), n = A.move.length;
  return ['move', Math.floor((e._wd || 0) / (stride * 2) * n + e.seed * 3) % n];
};
const _drawMonsterAnimW = drawMonsterAnim;
drawMonsterAnim = function (e, A0, k, ox, oy) {
  monStep(e);
  const stride = Math.max(14, (e.hTop || e.r * 3) * 0.32);
  const moving = (e._sp || 0) >= 6 && !e.boss && !e.superDef;
  const hop = moving ? Math.abs(Math.sin((e._wd || 0) / stride * Math.PI)) * Math.min(3, stride * 0.08) : 0;
  if (!hop) return _drawMonsterAnimW(e, A0, k, ox, oy);
  ctx.save(); ctx.translate(0, -hop);
  try { return _drawMonsterAnimW(e, A0, k, ox, oy); } finally { ctx.restore(); }
};

// ============================================================
// Tajos en media luna (como el ataque de referencia de Nyx): cuerpo del color del héroe, filo blanco brillante,
// la cola se desvanece y, al terminar, la estela se deshace en chispas.
// ============================================================
drawSlash = function (s) {
  const k = 1 - s.life / s.max, alpha = Math.max(0, 1 - k * k);
  const a0 = s.dir - (s.arc / 2) * s.side, sweep = s.arc * Math.min(1, k * 2.4) * s.side;
  const rgb = (P && typeof ULT_RGB !== 'undefined' && ULT_RGB[P.cls]) || (s.color === '#ffcc33' ? '255,180,60' : hexRgb(s.color));
  const R = s.range, W0 = s.width * 1.15, cy = s.y - 16, steps = 18;
  const pt = (a, rr) => [s.x + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // segmentos de la cola a la punta: más gruesos y opacos hacia la punta
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps, t1 = (i + 1) / steps, a = a0 + sweep * t0, b = a0 + sweep * t1;
    const w0 = W0 * Math.sin(Math.min(1, t0 * 1.15) * Math.PI * 0.5 + 0.08), w1 = W0 * Math.sin(Math.min(1, t1 * 1.15) * Math.PI * 0.5 + 0.08);
    const fa = alpha * (0.15 + 0.85 * t1);
    // cuerpo de color
    ctx.fillStyle = `rgba(${rgb},${0.55 * fa})`;
    ctx.beginPath();
    let p = pt(a, R); ctx.moveTo(p[0], p[1]); p = pt(b, R); ctx.lineTo(p[0], p[1]);
    p = pt(b, R - w1); ctx.lineTo(p[0], p[1]); p = pt(a, R - w0); ctx.lineTo(p[0], p[1]);
    ctx.closePath(); ctx.fill();
    // filo blanco en el borde exterior
    ctx.fillStyle = `rgba(255,255,255,${0.75 * fa})`;
    ctx.beginPath();
    p = pt(a, R + 1); ctx.moveTo(p[0], p[1]); p = pt(b, R + 1); ctx.lineTo(p[0], p[1]);
    p = pt(b, R - w1 * 0.28); ctx.lineTo(p[0], p[1]); p = pt(a, R - w0 * 0.28); ctx.lineTo(p[0], p[1]);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  const tip = pt(a0 + sweep, R - W0 * 0.3);
  glow(tip[0], tip[1], W0 * 1.8, rgb, alpha * 0.9);
  // al acabar el barrido: chispas a lo largo de la estela
  if (k > 0.45 && !s.sparked && QUALITY.fxK !== 0.5) {
    s.sparked = true;
    for (let i = 0; i < 9; i++) {
      const t = 0.25 + Math.random() * 0.75, [x, y] = pt(a0 + sweep * t, R - W0 * Math.random() * 0.7), out = a0 + sweep * t;
      particles.push({ kind: 'glowdot', x, y, vx: Math.cos(out) * rand(20, 70), vy: Math.sin(out) * rand(20, 60) - 20, life: 0.45, max: 0.45, rgb, size: rand(2, 3.5), grav: 0 });
    }
  }
};

// ============================================================
// Guardián derrotado: cámara lenta, columna de luz dorada donde cae, fuente de chispas de oro,
// pulso dorado en los bordes y un halo de victoria alrededor del héroe.
// ============================================================
let victFx = null;
const _guardianDefeatedV = guardianDefeated;
guardianDefeated = function (e) {
  _guardianDefeatedV(e);
  if (scene !== 'rift' || !P || (rift && rift.training)) return;
  victFx = { x: e.x, y: e.y, t0: performance.now() };
  if (typeof slowT !== 'undefined') slowT = Math.max(slowT, 1.1);
  for (let i = 0; i < 46; i++) {
    const a = -Math.PI / 2 + rand(-0.9, 0.9), sp = rand(160, 420);
    particles.push({ kind: 'glowdot', x: e.x + rand(-20, 20), y: e.y - 30, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.9, 1.6), max: 1.6, rgb: pick(['255,214,110', '255,240,190', '255,170,60']), size: rand(3, 6), grav: 380 });
  }
  rings.push({ x: e.x, y: e.y, r0: 30, r1: 360, life: 0.9, max: 0.9, color: 'rgba(255,214,110,' });
  rings.push({ x: P.x, y: P.y, r0: 10, r1: 120, life: 0.7, max: 0.7, color: 'rgba(255,240,190,' });
  if (typeof skillFx !== 'undefined') skillFx = { t: 0, max: 1.1, k: 1.4, rgb: '255,214,110' };
  SFX.play('legend');
};
function drawVictory() {
  const v = victFx, t = (performance.now() - v.t0) / 1000, D = 2.2;
  if (t > D || scene !== 'rift') { victFx = null; return; }
  const sx = (v.x - cam.x) * zoom + W / 2, sy = (v.y - cam.y) * zoom + H / 2;
  const grow = Math.min(1, t / 0.25), fade = t < D - 0.8 ? 1 : (D - t) / 0.8, w = (60 + 40 * grow) * zoom;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  // columna de luz
  const g = ctx.createLinearGradient(sx - w, 0, sx + w, 0);
  g.addColorStop(0, 'rgba(255,214,110,0)'); g.addColorStop(0.5, `rgba(255,240,190,${0.55 * fade * grow})`); g.addColorStop(1, 'rgba(255,214,110,0)');
  ctx.fillStyle = g; ctx.fillRect(sx - w, 0, w * 2, sy);
  // rayos que giran alrededor del punto de caída
  ctx.translate(sx, sy - 30 * zoom);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU + t * 0.6, L = (180 + 60 * Math.sin(t * 3 + i)) * zoom * grow;
    ctx.rotate(TAU / 10);
    const rg = ctx.createLinearGradient(0, 0, L, 0);
    rg.addColorStop(0, `rgba(255,230,160,${0.4 * fade})`); rg.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, -10 * zoom); ctx.lineTo(L, 10 * zoom); ctx.closePath(); ctx.fill();
    void a;
  }
  ctx.restore();
}
const _renderVict = render;
render = function () { _renderVict(); if (victFx) drawVictory(); };
