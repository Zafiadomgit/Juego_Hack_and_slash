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
// ventanas de cada casa pintada (fracciones del sprite): ahí van el brillo y la luz al anochecer
const VFX_WINDOWS = {
  0: [[0.16, 0.7], [0.31, 0.75], [0.56, 0.77], [0.87, 0.65], [0.7, 0.51]],
  1: [[0.19, 0.44], [0.13, 0.71], [0.29, 0.75], [0.79, 0.72]],
  2: [[0.2, 0.73], [0.36, 0.76], [0.85, 0.66], [0.25, 0.47], [0.6, 0.5], [0.85, 0.46], [0.31, 0.34]],
  3: [[0.55, 0.72]],
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
      const k = villaScale(o.kind, o), w = fr.f[2] * PROP_WU_PER_PX * k, h = fr.f[3] * PROP_WU_PER_PX * k, sink = VILLA_SINK[o.kind] || 0;
      VFX.emit.push({ k, x: o.x + (fr.flip ? 0.5 - fx : fx - 0.5) * w, y: o.y + h * sink - h + 2 * k + fy * h, t: Math.random() * 2 });
    }
  }
  // las ventanas antiguas eran de las casas dibujadas a mano: ahora salen de las ventanas del sprite
  VILLAGE.windows = [];
  for (const o of VILLAGE.props) {
    if (o.kind !== 'house') continue;
    const fr = villaFrame('house', o.x, o.y);
    if (!fr) continue;
    const k = villaScale('house', o), w = fr.f[2] * PROP_WU_PER_PX * k, h = fr.f[3] * PROP_WU_PER_PX * k, sink = VILLA_SINK.house || 0;
    for (const [fx, fy] of VFX_WINDOWS[PROP_ATLAS.villa.house.indexOf(fr.f)] || []) {
      // village.js dibuja el brillo en (x+8, y+9)
      VILLAGE.windows.push({ x: o.x + (fr.flip ? 0.5 - fx : fx - 0.5) * w - 8, y: o.y + h * sink - h + 2 * k + fy * h - 9 });
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

// ---------- Entrar por el Portal: el remolino absorbe al héroe, la luz del Portal llena la pantalla y se abre la Grieta ----------
const PFX = { dur: 0.8, run: null };
const _startNodeVfx = startNode;
startNode = function (b, n, d) {
  if (scene !== 'hub' || PFX.run || navigator.webdriver) { _startNodeVfx(b, n, d); return; }
  PFX.run = { t0: performance.now(), fx: vHero.x, fy: vHero.y, go: () => _startNodeVfx(b, n, d), fired: false };
  vHero.warp = true; vHero.target = null; vHero.pending = null;
  $('hub').style.visibility = 'hidden'; // sin botones encima durante la entrada
  SFX.play('zaap');
  if (typeof buzz === 'function') buzz('portal', [20, 30, 50], 0);
};
const pfxEase = (x) => x * x * (3 - 2 * x);
// posición y forma del héroe mientras lo absorbe el Portal
function pfxHero() {
  const r = PFX.run, k = clamp((performance.now() - r.t0) / 1000 / PFX.dur, 0, 1), e = pfxEase(k);
  return { x: lerp(r.fx, PORTAL.x, e), y: lerp(r.fy, PORTAL.y - 30, e), lift: e * 70 * PORTAL_K, s: 1 - 0.88 * e * e, spin: Math.cos(k * k * 22), a: 1 - Math.pow(k, 4), k };
}
const _updateVillagePfx = updateVillage;
updateVillage = function (dt) {
  if (!PFX.run) return _updateVillagePfx(dt);
  // mientras dura no se mueve nadie: solo la vida del pueblo y las chispas que entran en el Portal
  villageLife(dt); vfxUpdate(dt);
  const h = pfxHero();
  for (let i = 0; i < 3; i++) {
    const a = rand(0, TAU), rr = rand(60, 160);
    VILLAGE.fx.push({ k: 'spark', x: h.x + Math.cos(a) * rr, y: h.y - h.lift - 40 + Math.sin(a) * rr * 0.6, vx: -Math.cos(a) * rr * 2.2, vy: -Math.sin(a) * rr * 1.3, life: 0.4, max: 0.4, r: 2 });
  }
  vCam.x = lerp(vCam.x, PORTAL.x, 1 - Math.exp(-4 * dt)); vCam.y = lerp(vCam.y, PORTAL.y - 40, 1 - Math.exp(-4 * dt));
};
// el héroe se dibuja encogiendo y girando hacia el centro del remolino
function pfxDrawHero(o) {
  const h = pfxHero();
  ctx.save();
  ctx.globalAlpha = h.a;
  ctx.translate(h.x, h.y - h.lift);
  ctx.scale(h.s * (0.35 + 0.65 * Math.abs(h.spin)), h.s);
  glow(0, -50, 70, '140,220,255', 0.6 * h.k);
  drawHero(ctx, S.cls, Object.assign({}, o, { x: 0, y: 0, moving: false }));
  ctx.restore();
}
// luz del Portal que crece hasta llenar la pantalla; al final, destello y entra la Grieta
const _renderPfx = render;
render = function () {
  _renderPfx();
  const r = PFX.run;
  if (!r) return;
  const t = (performance.now() - r.t0) / 1000, k = clamp(t / PFX.dur, 0, 1);
  const px = (PORTAL.x - vCam.x) * zoom + W / 2, py = (PORTAL.y - 110 * PORTAL_K - vCam.y) * zoom + H / 2;
  const R = Math.hypot(W, H) * (0.08 + 1.1 * Math.pow(k, 2.2));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(px, py, 0, px, py, R);
  g.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); g.addColorStop(0.35, `rgba(150,230,255,${0.75 * k})`); g.addColorStop(0.75, `rgba(60,140,255,${0.45 * k})`); g.addColorStop(1, 'rgba(20,40,120,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (k > 0.8) { ctx.fillStyle = `rgba(255,255,255,${(k - 0.8) / 0.2})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  if (k >= 1 && !r.fired) {
    r.fired = true;
    let el = $('portalFx');
    if (!el) { el = document.createElement('div'); el.id = 'portalFx'; document.body.appendChild(el); }
    el.className = 'flash';
    vHero.warp = false;
    try { r.go(); } finally {
      $('hub').style.visibility = '';
      PFX.run = null;
      requestAnimationFrame(() => { el.className = 'flash out'; });
      setTimeout(() => { el.className = ''; }, 900);
    }
  }
};
