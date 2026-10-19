/* Fendaria — capa de fluidez: lo que hace que todo se mueva «entre fotogramas».
 *  · Héroes: giro suave (como una hoja que se da la vuelta) y respiración en reposo.
 *  · Monstruos: giro suave al cambiar de dirección.
 *  · Villa: árboles que se mecen con el viento, hojas de otoño que caen y luciérnagas de noche.
 */
'use strict';

// ============================================================
// Héroes
// ============================================================
const HERO_MS = {};
const _drawHeroAnimM = drawHeroAnim;
drawHeroAnim = function (g, o) {
  if ((o.alpha ?? 1) < 0.5 || g !== ctx) return _drawHeroAnimM(g, o); // estelas y menús: tal cual
  const key = o.cls + '|' + scene;
  let st = HERO_MS[key];
  const c = Math.cos(o.dir);
  if (!st) st = HERO_MS[key] = { fs: c >= 0 ? 1 : -1, face: c >= 0 ? 1 : -1, t: now };
  if (Math.abs(c) > 0.3) st.face = c > 0 ? 1 : -1; // mirando arriba/abajo: conserva el lado (sin parpadeos)
  const target = st.face;
  const dt = clamp(now - st.t, 0, 0.1); st.t = now;
  st.fs = clamp(st.fs + clamp(target - st.fs, -dt * 13, dt * 13), -1, 1); // media vuelta en ~0,15 s
  const side = st.fs >= 0 ? 1 : -1, mag = Math.max(0.14, Math.abs(st.fs));
  const idle = !o.moving && !(o.swing > 0) && !(o.shot > 0) && !(o.hurt > 0);
  const br = idle ? Math.sin(now * 2.6 + o.cls.length) : 0;
  g.save();
  g.translate(o.x, o.y);
  g.scale(mag * (1 - br * 0.008), 1 + br * 0.014);
  g.translate(-o.x, -o.y);
  const r = _drawHeroAnimM(g, Object.assign({}, o, { dir: side > 0 ? 0 : Math.PI }));
  g.restore();
  return r;
};

// ============================================================
// Monstruos
// ============================================================
const _drawMonsterAnimM = drawMonsterAnim;
drawMonsterAnim = function (e, A0, k, ox, oy) {
  const f = e.face || 1;
  if (e._fs === undefined) e._fs = f;
  if (Math.abs(f) < 1) return _drawMonsterAnimM(e, A0, k, ox, oy);
  const dt = clamp(now - (e._ft || now), 0, 0.1); e._ft = now;
  e._fs = clamp(e._fs + clamp(f - e._fs, -dt * 11, dt * 11), -1, 1);
  e.face = (e._fs >= 0 ? 1 : -1) * Math.max(0.16, Math.abs(e._fs));
  try { return _drawMonsterAnimM(e, A0, k, ox, oy); } finally { e.face = f; }
};

// ============================================================
// Villa: viento en los árboles
// ============================================================
const _drawVillaSpriteM = drawVillaSprite;
drawVillaSprite = function (o) {
  if (o.kind !== 'tree') return _drawVillaSpriteM(o);
  // ráfagas que recorren el pueblo de oeste a este; los arbolitos se mecen más
  const gust = 0.6 + 0.4 * Math.sin(now * 0.35 - o.x * 0.002);
  const sk = Math.sin(now * 1.7 + o.x * 0.013 + o.y * 0.007) * 0.022 * gust * (o.s < 0.7 ? 1.5 : 1);
  ctx.save();
  ctx.translate(o.x, o.y); ctx.transform(1, 0, sk, 1, 0, 0); ctx.translate(-o.x, -o.y);
  try { return _drawVillaSpriteM(o); } finally { ctx.restore(); }
};

// ============================================================
// Villa: hojas que caen y luciérnagas
// ============================================================
const LEAVES = [], FIREFLIES = [];
const LEAF_COLS = ['#d9772f', '#c4472c', '#e8b545', '#b05a8a', '#8fae3c'];
const _drawSkyLifeM = drawSkyLife;
drawSkyLife = function () {
  _drawSkyLifeM();
  const dt = clamp(now - (LEAVES.t || now), 0, 0.1); LEAVES.t = now;
  const vw = W / zoom / 2 + 60, vh = H / zoom / 2 + 60;
  // hojas: caen girando, empujadas por el viento
  while (LEAVES.length < 26) LEAVES.push({ x: vCam.x + rand(-vw, vw), y: vCam.y + rand(-vh, vh) - 200, z: rand(40, 160), vz: rand(14, 26), ph: rand(0, TAU), c: pick(LEAF_COLS), s: rand(2.5, 4) });
  for (let i = LEAVES.length - 1; i >= 0; i--) {
    const l = LEAVES[i];
    l.z -= l.vz * dt; l.x += (14 + Math.sin(now * 0.35 - l.x * 0.002) * 10 + Math.sin(now * 2 + l.ph) * 18) * dt;
    if (l.z <= 0 || Math.abs(l.x - vCam.x) > vw + 80 || Math.abs(l.y - vCam.y) > vh + 260) { LEAVES.splice(i, 1); continue; }
    const fl = Math.sin(now * 5 + l.ph);
    ctx.save(); ctx.translate(l.x, l.y - l.z); ctx.rotate(fl * 0.9);
    ctx.fillStyle = l.c; ctx.fillRect(-l.s, -l.s * 0.45 * Math.abs(fl) - 0.6, l.s * 2, Math.max(1.2, l.s * 0.9 * Math.abs(fl)));
    ctx.restore();
  }
  // luciérnagas (las que brillan se dibujan después de la luz, en lightsFireflies)
  const k = typeof nightK === 'function' ? nightK() : 0;
  const want = Math.round(34 * k);
  while (FIREFLIES.length < want) FIREFLIES.push({ x: vCam.x + rand(-vw, vw), y: vCam.y + rand(-vh, vh), ph: rand(0, TAU), sp: rand(0.6, 1.4) });
  if (FIREFLIES.length > want) FIREFLIES.length = want;
  for (const f of FIREFLIES) {
    f.x += Math.sin(now * 0.7 * f.sp + f.ph) * 12 * dt; f.y += Math.cos(now * 0.9 * f.sp + f.ph * 2) * 9 * dt;
    if (Math.abs(f.x - vCam.x) > vw) f.x = vCam.x + rand(-vw, vw);
    if (Math.abs(f.y - vCam.y) > vh) f.y = vCam.y + rand(-vh, vh);
  }
};
// las luciérnagas brillan por encima de la oscuridad
const _renderLightingM = renderLighting;
renderLighting = function (lights, ambient, shade) {
  _renderLightingM(lights, ambient, shade);
  if (scene !== 'hub' || !FIREFLIES.length) return;
  const cx = vCam.x, cy = vCam.y, hz = zoom;
  for (const f of FIREFLIES) {
    const a = 0.5 + 0.5 * Math.sin(now * 3 * f.sp + f.ph);
    if (a < 0.15) continue;
    const x = (f.x - cx) * hz + W / 2, y = (f.y - cy - 26) * hz + H / 2;
    glow(x, y, 16 * hz, '200,255,140', 0.6 * a);
    circle(x, y, 1.6 * hz, `rgba(240,255,200,${a})`);
  }
};
