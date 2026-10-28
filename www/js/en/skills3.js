/* Fendaria — tercera habilidad de cada héroe (botón propio sobre el ataque, tecla 5 / O).
 * Va por el mismo useSkill que las otras (energía, recarga, bendiciones y talentos que reaccionan a hechizos);
 * el efecto se lanza aquí cuando useSkill(2) consume la energía.
 */
'use strict';

const SKILL3 = {
  iop: { name: "Boomerang Axe", icon: '⟲', cost: 4, cd: 6, desc: "Throws the axe spinning: it passes through everyone on the way out and back, dragging them toward you" },
  cra: { name: "Thunder Arrow", icon: '⚡', cost: 4, cd: 6, desc: "A lightning bolt pierces every enemy in a line and jumps to those nearby" },
  feca: { name: "Frost Prison", icon: '❄', cost: 5, cd: 9, desc: "A ring of ice freezes enemies in the area for 2 s and damages them" },
  sombra: { name: "Smoke Bomb", icon: '☁', cost: 3, cd: 8, desc: "Poisonous smoke that blinds and slows; you step out of it in Ambush" },
  domadora: { name: "Wild Roots", icon: '🌿', cost: 4, cd: 7, desc: "Roots burst out in a cone, trapping enemies for 1.5 s and damaging them" },
  artificiera: { name: "Magnetic Mine", icon: '🧲', cost: 4, cd: 7, desc: "A mine that pulls enemies in for 1.2 s and then explodes" },
  berserker: { name: "Titan's Leap", icon: '⤒', cost: 4, cd: 7, desc: "Leaps over the crowd and lands with a red wave that stuns" },
};
for (const [id, sk] of Object.entries(SKILL3)) if (CLASSES[id] && CLASSES[id].skills.length < 3) CLASSES[id].skills.push(sk);
// los kits de las clases nuevas tratan cualquier índice distinto de 0 como el segundo hechizo: el 2 es nuestro
for (const id of Object.keys(CLASS_KIT)) {
  const k = CLASS_KIT[id], sk = k.skill;
  k.skill = function (i) { if (i !== 2) return sk.call(this, i); };
}
if (P && P.skillCd && P.skillCd.length < 3) P.skillCd.push(0);
const _createPlayerS3 = createPlayer;
createPlayer = function () { _createPlayerS3(); P.skillCd[2] = 0; };

// ---------- entrada ----------
input.pressed.s2 = false;
const _buttonLayoutS3 = buttonLayout;
buttonLayout = function () {
  const L = _buttonLayoutS3(), s = ui, A = L.attack;
  // arco interior de cuatro: tres habilidades y la esquiva (arriba a la derecha queda el radar)
  const at = (deg, R, r) => ({ x: A.x + Math.cos(deg * Math.PI / 180) * R * s, y: A.y + Math.sin(deg * Math.PI / 180) * R * s, r: r * s });
  L.s0 = at(180, 104, 28); L.s1 = at(213, 104, 28); L.s2 = at(246, 104, 28); L.dash = at(281, 104, 26);
  return L;
};
const _hitButtonS3 = hitButton;
hitButton = function (x, y) {
  const L = buttonLayout();
  if (scene === 'rift' && dist(x, y, L.s2.x, L.s2.y) < L.s2.r * 1.2) return 's2';
  return _hitButtonS3(x, y);
};
const _clearInputS3 = clearInput;
clearInput = function () { _clearInputS3(); input.pressed.s2 = false; };
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (state === 'play' && (k === '5' || k === 'o')) input.pressed.s2 = true;
});

// ---------- lanzamiento ----------
const _useSkillS3 = useSkill;
useSkill = function (i) {
  if (i !== 2) return _useSkillS3(i);
  const before = P.skillCd[2];
  _useSkillS3(2);
  if (P.skillCd[2] !== before) S3FX[P.cls]();
};
const _updatePlayerS3 = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerS3(dt);
  P.skillCd[2] -= dt;
  if (input.pressed.s2) { input.pressed.s2 = false; useSkill(2); }
  if (P.titan && !P.jump) titanLand();
  for (const z of s3Zones) z.t += dt;
  for (let i = s3Zones.length - 1; i >= 0; i--) { const z = s3Zones[i]; z.tick(z, dt); if (z.t >= z.dur) s3Zones.splice(i, 1); }
};
let s3Zones = [];
const _startNodeS3 = startNode;
startNode = function (b, n, d) { s3Zones = []; return _startNodeS3(b, n, d); };

const S3FX = {
  iop() {
    const a = aimAt(340);
    P.dir = a; P.aimHold = 0.4; P.swingT = 0.2;
    s3Zones.push({ axe: true, a, x: P.x, y: P.y - 16, t: 0, dur: 1.1, hits: new Map(), tick(z, dt) {
      const k = z.t / z.dur, d = Math.sin(Math.min(1, k) * Math.PI) * 250; // sale y vuelve
      const back = k > 0.5;
      z.x = P.x + Math.cos(z.a) * d; z.y = P.y - 16 + Math.sin(z.a) * d;
      for (const e of enemies) {
        if (e.dead || e.z > 30 || dist(z.x, z.y + 16, e.x, e.y) > e.r + 34) continue;
        const last = z.hits.get(e) || -1;
        if (z.t - last < 0.3) continue;
        z.hits.set(e, z.t);
        damageEnemy(e, skillDmg(2.1), back ? { kb: 0 } : { kb: 120, fx: P.x, fy: P.y });
        if (back && !e.boss) { const dd = dist(P.x, P.y, e.x, e.y) || 1; e.x += (P.x - e.x) / dd * 40; e.y += (P.y - e.y) / dd * 40; }
      }
      if (Math.random() < 0.7) particles.push({ kind: 'glowdot', x: z.x, y: z.y, vx: 0, vy: 0, life: 0.3, max: 0.3, rgb: '255,170,90', size: 4, grav: 0 });
    } });
    SFX.play('swing');
  },
  cra() {
    const a = aimAt(520);
    P.dir = a; P.aimHold = 0.4; P.shotT = 0.15;
    const L = 560, x1 = P.x + Math.cos(a) * L, y1 = P.y + Math.sin(a) * L;
    const hit = [];
    for (const e of enemies) {
      if (e.dead || e.z > 30) continue;
      const t = clamp(((e.x - P.x) * Math.cos(a) + (e.y - P.y) * Math.sin(a)) / L, 0, 1);
      if (dist(e.x, e.y, P.x + Math.cos(a) * L * t, P.y + Math.sin(a) * L * t) < e.r + 18) hit.push(e);
    }
    bolt(P.x, P.y - 14, x1, y1 - 14, '190,230,255', 0.5, 5);
    for (const e of hit) damageEnemy(e, skillDmg(3.2), { kb: 140, fx: P.x, fy: P.y, heavy: true });
    // salta a los cercanos
    for (const e of hit.slice(0, 4)) {
      const n = enemies.find((q) => !q.dead && !hit.includes(q) && dist(q.x, q.y, e.x, e.y) < 150);
      if (n) { bolt(e.x, e.y - 14, n.x, n.y - 14, '170,210,255', 0.3, 3); damageEnemy(n, skillDmg(1.6), { kb: 60 }); hit.push(n); }
    }
    hitFlash(P.x + Math.cos(a) * 30, P.y - 14 + Math.sin(a) * 30, 30, '200,235,255');
    shake(7); SFX.play('fireshot');
  },
  feca() {
    const t = nearestEnemy(P.x, P.y, 340);
    const x = t ? t.x : P.x, y = t ? t.y : P.y, R = 140;
    rings.push({ x, y, r0: R, r1: R * 0.9, life: 0.6, max: 0.6, color: 'rgba(170,230,255,', fill: true });
    spawnVfx('ice', x, y - 20, R * 2.2, { dur: 0.7 });
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; spawnVfx('ice', x + Math.cos(a) * R, y + Math.sin(a) * R * 0.6 - 10, 46, { dur: 0.6 + Math.random() * 0.3 }); }
    for (const e of enemies) if (!e.dead && dist(x, y, e.x, e.y) < R + e.r) {
      damageEnemy(e, skillDmg(2), { kb: 0 });
      e.stunT = Math.max(e.stunT || 0, e.boss ? 0.7 : 2); e.slowT = Math.max(e.slowT, 4); e.iceT = e.boss ? 0.7 : 2;
    }
    addDecal('rune', x, y, R, 2.5, '170,230,255');
    shake(6); SFX.play('shield');
  },
  sombra() {
    const x = P.x, y = P.y, R = 120;
    spawnVfx('smoke', x, y - 20, R * 2.4, { dur: 1.2 });
    s3Zones.push({ x, y, R, t: 0, dur: 4, k: 0, tick(z, dt) {
      z.k -= dt;
      if (Math.random() < 0.5) particles.push({ kind: 'glowdot', x: z.x + rand(-z.R, z.R) * 0.8, y: z.y + rand(-z.R, z.R) * 0.45, vx: 0, vy: -16, life: 1, max: 1, rgb: '110,80,150', size: 9, grav: 0 });
      if (z.k > 0) return; z.k = 0.5;
      for (const e of enemies) if (!e.dead && dist(z.x, z.y, e.x, e.y) < z.R + e.r) { e.slowT = Math.max(e.slowT, 0.6); damageEnemy(e, skillDmg(0.5), { quiet: true, color: '#9be05a' }); }
    } });
    if (P.sig) { P.sig.amb = 3; P.sig.v = 1; }
    P.invul = Math.max(P.invul, 0.6);
    poof(x, y); SFX.play('dash');
  },
  domadora() {
    const a = aimAt(300);
    P.dir = a;
    for (let k = 1; k <= 7; k++) {
      later(k * 0.05, () => {
        if (!P || scene !== 'rift') return;
        for (const side of [-1, 0, 1]) {
          const aa = a + side * 0.28 * (k / 7), d = k * 38, x = P.x + Math.cos(aa) * d, y = P.y + Math.sin(aa) * d;
          addDecal('scorch', x, y, 18, 2.4, '90,140,50');
          for (let j = 0; j < 3; j++) particles.push({ x: x + rand(-8, 8), y: y + rand(-4, 4), vx: rand(-20, 20), vy: -rand(80, 160), life: 0.45, max: 0.45, color: pick(['#5d8a2e', '#8bc34a', '#4e342e']), size: rand(2, 4), grav: 300 });
          for (const e of enemies) if (!e.dead && dist(x, y, e.x, e.y) < 30 + e.r && !e.rootK) {
            e.rootK = 1; later(0.6, () => { e.rootK = 0; });
            damageEnemy(e, skillDmg(1.9), { kb: 0 });
            e.stunT = Math.max(e.stunT || 0, e.boss ? 0.5 : 1.5); e.rootT = e.boss ? 0.5 : 1.5;
          }
        }
      });
    }
    shake(5); SFX.play('hit');
  },
  artificiera() {
    const t = nearestEnemy(P.x, P.y, 360);
    const a = t ? Math.atan2(t.y - P.y, t.x - P.x) : P.dir, d = t ? Math.min(260, dist(P.x, P.y, t.x, t.y)) : 200;
    const x = clamp(P.x + Math.cos(a) * d, 40, WORLD.w - 40), y = clamp(P.y + Math.sin(a) * d, 40, WORLD.h - 40);
    P.dir = a; P.shotT = 0.15;
    s3Zones.push({ x, y, R: 210, t: 0, dur: 1.25, mine: true, tick(z, dt) {
      for (const e of enemies) {
        if (e.dead || e.boss) continue;
        const dd = dist(z.x, z.y, e.x, e.y);
        if (dd < z.R && dd > 14) { e.x += (z.x - e.x) / dd * 230 * dt; e.y += (z.y - e.y) / dd * 230 * dt; }
      }
      if (Math.random() < 0.6) { const aa = rand(0, TAU); particles.push({ kind: 'glowdot', x: z.x + Math.cos(aa) * z.R * 0.8, y: z.y + Math.sin(aa) * z.R * 0.5, vx: -Math.cos(aa) * 200, vy: -Math.sin(aa) * 120, life: 0.5, max: 0.5, rgb: '120,200,255', size: 3, grav: 0 }); }
      if (z.t + dt >= z.dur) { blast(z.x, z.y, 120, skillDmg(3.4), true); shake(10); }
    } });
    SFX.play('hit');
  },
  berserker() {
    const t = nearestEnemy(P.x, P.y, 360);
    let tx, ty;
    if (t) { tx = t.x; ty = t.y; } else { const a = P.moving ? Math.atan2(input.my, input.mx) : P.dir; tx = P.x + Math.cos(a) * 220; ty = P.y + Math.sin(a) * 220; }
    tx = clamp(tx, 40, WORLD.w - 40); ty = clamp(ty, 40, WORLD.h - 40);
    P.dir = Math.atan2(ty - P.y, tx - P.x);
    P.jump = { sx: P.x, sy: P.y, tx, ty, t: 0, dur: 0.48 };
    P.titan = true;
    rings.push({ x: P.x, y: P.y, r0: 30, r1: 6, life: 0.25, max: 0.25, color: 'rgba(255,70,50,' });
    SFX.play('dash');
  },
};

// Salto del Titán: al aterrizar (el aterrizaje normal ya pega), onda roja que aturde
function titanLand() {
  P.titan = false;
  const R = 160;
  rings.push({ x: P.x, y: P.y, r0: 20, r1: R, life: 0.4, max: 0.4, color: 'rgba(255,60,50,' });
  rings.push({ x: P.x, y: P.y, r0: 10, r1: R * 0.6, life: 0.3, max: 0.3, color: 'rgba(255,200,160,' });
  spawnVfx('rage', P.x, P.y - 20, R * 1.6, { dur: 0.6 });
  for (const e of enemies) if (!e.dead && dist(P.x, P.y, e.x, e.y) < R + e.r) { damageEnemy(e, skillDmg(2.2), { kb: 320, fx: P.x, fy: P.y, heavy: true }); e.stunT = Math.max(e.stunT || 0, e.boss ? 0.4 : 1.2); }
  addDecal('scorch', P.x, P.y, R * 0.7, 3, '200,40,30');
  for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; particles.push({ x: P.x + Math.cos(a) * 30, y: P.y + Math.sin(a) * 15, vx: Math.cos(a) * 260, vy: Math.sin(a) * 130 - 80, life: 0.5, max: 0.5, color: pick(['#8a5a3a', '#ff5a4a', '#5d4037']), size: rand(3, 6), grav: 500 }); }
  shake(16); hitStop(0.08); zoomPunch = Math.max(zoomPunch, 0.06);
  SFX.play('boom');
}
// rayo quebrado entre dos puntos (dura unas décimas)
let s3Bolts = [];
function bolt(x0, y0, x1, y1, rgb, life, w) {
  const pts = [], n = Math.max(4, Math.round(dist(x0, y0, x1, y1) / 30));
  for (let i = 0; i <= n; i++) { const k = i / n, j = i && i < n ? rand(-14, 14) : 0; pts.push([lerp(x0, x1, k) + j * 0.5, lerp(y0, y1, k) + j]); }
  s3Bolts.push({ pts, rgb, life, max: life, w });
}

// ---------- dibujo ----------
const _drawPlayerS3 = drawPlayer;
drawPlayer = function () {
  for (const z of s3Zones) if (z.axe) {
    ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(now * 22);
    glow(0, 0, 30, '255,170,90', 0.35);
    ctx.fillStyle = '#d8dde6'; ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 2;
    for (const sg of [1, -1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sg * 20, -16, sg * 20, 0); ctx.quadraticCurveTo(sg * 20, 16, 0, 0); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(-2, -22, 4, 44);
    ctx.restore();
  } else if (z.mine) {
    const k = z.t / z.dur;
    glow(z.x, z.y, 40 + k * 30, '120,200,255', 0.5 + Math.sin(now * 30) * 0.15);
    ctx.save(); ctx.translate(z.x, z.y); ctx.scale(1, 0.5);
    circle(0, 0, z.R * (1 - (now * 1.5) % 1), null, 'rgba(140,210,255,0.5)', 2);
    ctx.restore();
    circle(z.x, z.y - 6, 9, '#30363f', '#9fd8ff', 2);
  } else if (z.R) {
    ctx.save(); ctx.globalAlpha = 0.28 * Math.min(1, (z.dur - z.t) * 2);
    ctx.translate(z.x, z.y); ctx.scale(1, 0.55); circle(0, 0, z.R, 'rgba(70,50,100,0.9)'); ctx.restore();
  }
  _drawPlayerS3();
  for (let i = s3Bolts.length - 1; i >= 0; i--) {
    const b = s3Bolts[i];
    b.life -= 1 / 60;
    if (b.life <= 0) { s3Bolts.splice(i, 1); continue; }
    const a = b.life / b.max;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
    for (const [lw, al] of [[b.w * 3, 0.25], [b.w, 0.9], [b.w * 0.4, 1]]) {
      ctx.strokeStyle = al === 1 ? `rgba(255,255,255,${a})` : `rgba(${b.rgb},${a * al})`; ctx.lineWidth = lw;
      ctx.beginPath(); b.pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
    ctx.restore();
  }
};
// enemigos congelados o atrapados por raíces: se pintan encima
const _drawEnemyS3 = typeof drawEnemy === 'function' ? drawEnemy : null;
if (_drawEnemyS3) drawEnemy = function (e) {
  _drawEnemyS3(e);
  if (e.stunT > 0 && e.iceT > 0) { ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(e.x, e.y - e.r); ctx.scale(1, 1.2); circle(0, 0, e.r * 1.15, 'rgba(170,230,255,0.45)', '#e0f6ff', 2); ctx.restore(); }
  else if (e.stunT > 0 && e.rootT > 0) for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + e.seed; ctx.save(); ctx.strokeStyle = '#5d8a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * e.r, e.y + 2); ctx.quadraticCurveTo(e.x + Math.cos(a) * e.r * 0.4, e.y - e.r * 0.6, e.x, e.y - e.r * 0.8); ctx.stroke(); ctx.restore(); }
};

// ---------- botón ----------
const _drawControlsS3 = drawControls;
drawControls = function () {
  _drawControlsS3();
  if (!P || !P.C.skills[2] || scene !== 'rift') return;
  const s = ui, b = buttonLayout().s2, sk = P.C.skills[2];
  const cdk = clamp(P.skillCd[2] / sk.cd, 0, 1), on = P.pa >= sk.cost && cdk <= 0;
  combatButton(b, skillImg(P.cls, 3) || sk.icon, sk.cost + ' EN', '#ab7cf0', cdk, on, false, '#d1b8ff');
};
