/* Fendaria — vida de Villa Candela sin arte nuevo: humo en las chimeneas pintadas, fuego y chispas en la forja,
 * burbujas en el caldero del alquimista, faroles que titilan y mariposas.
 * Los puntos de emisión están en fracciones del sprite (img/props/villa.png) y siguen al sprite aunque se dibuje volteado.
 */
'use strict';

// [fx, fy, tipo] por tipo de elemento y por fotograma del atlas (índice en PROP_ATLAS.villa[kind])
const VFX_POINTS = {
  house: { 0: [[0.49, 0.12, 'smoke']], 2: [[0.86, 0.05, 'smoke']] },
  forge: { 0: [[0.31, 0.05, 'smoke'], [0.44, 0.68, 'fire']] },
  cauldron: { 0: [[0.5, 0.15, 'brew']] },
};
const VFX = { parts: [], emit: [], built: false, flies: [] };

function vfxBuild() {
  VFX.emit = [];
  if (!PROP_IMG.villa || !PROP_ATLAS.villa) return;
  for (const o of VILLAGE.props) {
    const pts = VFX_POINTS[o.kind];
    if (!pts) continue;
    const fr = villaFrame(o.kind, o.x, o.y);
    if (!fr) continue;
    const idx = PROP_ATLAS.villa[o.kind].indexOf(fr.f);
    for (const [fx, fy, k] of pts[idx] || []) {
      const w = fr.f[2] * PROP_WU_PER_PX, h = fr.f[3] * PROP_WU_PER_PX, sink = VILLA_SINK[o.kind] || 0;
      VFX.emit.push({ k, x: o.x + (fr.flip ? 0.5 - fx : fx - 0.5) * w, y: o.y + h * sink - h + 2 + fy * h, t: Math.random() * 2 });
    }
  }
  // el humo antiguo salía de casas dibujadas a mano que ya no existen
  VILLAGE.smoke = [];
  // mariposas alrededor de la plaza
  VFX.flies = Array.from({ length: 7 }, (_, i) => ({ x: rand(-520, 520), y: rand(-260, 380), a: rand(0, TAU), ph: rand(0, 10), c: ['255,214,90', '255,140,190', '150,210,255', '255,255,255'][i % 4] }));
  VFX.built = true;
}

function vfxUpdate(dt) {
  if (!VFX.built) vfxBuild();
  for (const e of VFX.emit) {
    e.t -= dt;
    if (e.t > 0) continue;
    if (e.k === 'smoke') { e.t = 0.28 + Math.random() * 0.25; VFX.parts.push({ k: 'smoke', x: e.x + rand(-2, 2), y: e.y, vx: rand(6, 14), vy: rand(-26, -18), r: rand(6, 9), life: 3.6, max: 3.6 }); }
    else if (e.k === 'fire') { e.t = 0.07; VFX.parts.push({ k: 'ember', x: e.x + rand(-8, 8), y: e.y + rand(-4, 4), vx: rand(-10, 10), vy: rand(-55, -30), r: rand(2, 3.2), life: 1.2, max: 1.1 }); }
    else if (e.k === 'brew') { e.t = 0.18 + Math.random() * 0.2; VFX.parts.push({ k: 'bubble', x: e.x + rand(-9, 9), y: e.y + rand(-2, 2), vx: rand(-3, 3), vy: rand(-22, -12), r: rand(1.5, 3.2), life: 0.9, max: 0.9 }); }
  }
  for (const p of VFX.parts) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.k === 'smoke') { p.r += dt * 6; p.vx += dt * 3; }
    else if (p.k === 'ember') p.vx += Math.sin(now * 7 + p.y) * 20 * dt;
  }
  VFX.parts = VFX.parts.filter((p) => p.life > 0);
  if (VFX.parts.length > 260) VFX.parts.splice(0, VFX.parts.length - 260);
  for (const f of VFX.flies) {
    f.a += (Math.sin(now * 0.7 + f.ph) * 1.6) * dt;
    f.x += Math.cos(f.a) * 26 * dt; f.y += Math.sin(f.a) * 18 * dt;
    if (f.x < VB.x0 || f.x > VB.x1 || f.y < VB.y0 || f.y > VB.y1) f.a += Math.PI;
  }
}

function vfxDraw() {
  ctx.save();
  for (const e of VFX.emit) {
    if (e.k === 'fire') glow(e.x, e.y, 34 + Math.sin(now * 13) * 4 + Math.sin(now * 29) * 3, '255,140,50', 0.75 + Math.sin(now * 17) * 0.15);
    else if (e.k === 'brew') glow(e.x, e.y, 18 + Math.sin(now * 4) * 2, '120,255,120', 0.35);
  }
  for (const p of VFX.parts) {
    const a = p.life / p.max;
    if (p.k === 'smoke') {
      ctx.globalAlpha = 0.55 * a * Math.min(1, (p.max - p.life) * 3);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, 'rgba(225,220,214,1)'); g.addColorStop(1, 'rgba(200,196,190,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    } else if (p.k === 'ember') { ctx.globalAlpha = a; ctx.fillStyle = a > 0.5 ? '#ffd27a' : '#ff7a2a'; ctx.fillRect(p.x, p.y, p.r, p.r); glow(p.x, p.y, p.r * 3, '255,150,60', a * 0.5); }
    else if (p.k === 'bubble') { ctx.globalAlpha = 0.8 * a; ctx.strokeStyle = '#b8ff9a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.2 - a * 0.3), 0, TAU); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  for (const f of VFX.flies) {
    const flap = Math.abs(Math.sin(now * 14 + f.ph)) * 3 + 0.6;
    ctx.fillStyle = `rgba(${f.c},0.95)`;
    ctx.beginPath(); ctx.ellipse(f.x - flap * 0.6, f.y, flap, 2.2, -0.4, 0, TAU); ctx.ellipse(f.x + flap * 0.6, f.y, flap, 2.2, 0.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

const _updateVillageVfx = updateVillage;
updateVillage = function (dt) { _updateVillageVfx(dt); vfxUpdate(dt); };
const _drawSkyLifeVfx = drawSkyLife;
drawSkyLife = function () { if (scene !== 'rift') vfxDraw(); _drawSkyLifeVfx(); };
// faroles con llama: la luz titila un poco
const _renderLightingVfx = renderLighting;
renderLighting = function (lights, ...rest) {
  if (scene !== 'rift') for (const l of lights) if (l.rgb === '255,165,85') l.a *= 0.86 + Math.sin(now * 9 + l.x) * 0.06 + Math.sin(now * 23 + l.y) * 0.05;
  return _renderLightingVfx(lights, ...rest);
};
