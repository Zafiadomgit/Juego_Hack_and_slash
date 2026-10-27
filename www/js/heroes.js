/* Fendaria — la joya de la corona: cada héroe tiene una mecánica propia que se ve y se siente.
 *  · Rompeyelmos — Ímpetu: cada golpe que acierta suma carga (+6% daño); con 5, el siguiente tajo es un Quiebrayelmos.
 *  · Ojo de Halcón — Ojo del Halcón: cada 5.º disparo es una flecha dorada que atraviesa y pega el doble.
 *  · Runista — Runas orbitales: cada hechizo crea una runa que gira a su alrededor, quema y para golpes.
 *  · Sombra — Emboscada: tras esquivar, el siguiente golpe es un crítico brutal.
 *  · Domadora — Vínculo de manada: +8% daño por lobo; las bajas llaman a un Lobo Alfa.
 *  · Artificiera — Carga inestable: cada 6.º lanzamiento es una andanada de tres bombas.
 *  · Berserker — Sed de sangre: las bajas acumulan furia (+3% daño cada una); a tope, cada baja cura.
 * La carga se ve bajo los pies del héroe y en la pantalla de selección.
 */
'use strict';

const SIG = {
  iop: { name: 'Ímpetu', color: '255,140,60', max: 5, desc: 'Cada golpe que acierta suma <b>Ímpetu</b> (+6% daño). Con 5 cargas, tu siguiente tajo es un <b>Quiebrayelmos</b>: una onda que aplasta todo alrededor.' },
  cra: { name: 'Ojo del Halcón', color: '255,214,90', max: 5, desc: 'Cada <b>5.º disparo</b> es una flecha dorada que atraviesa a tres enemigos y pega más del doble.' },
  feca: { name: 'Runas orbitales', color: '130,200,255', max: 3, desc: 'Cada hechizo crea una <b>runa</b> que gira a tu alrededor quemando enemigos (hasta 3). Si te golpean, una runa se rompe y absorbe el 60% del daño.' },
  sombra: { name: 'Emboscada', color: '190,140,255', max: 1, desc: 'Tras <b>esquivar</b> te envuelve la sombra: tu siguiente golpe es un crítico seguro con +60% de daño.' },
  domadora: { name: 'Vínculo de manada', color: '140,230,120', max: 10, desc: '<b>+8% de daño</b> por cada lobo a tu lado. Cada 10 bajas aúlla un <b>Lobo Alfa</b> que lucha gratis.' },
  artificiera: { name: 'Carga inestable', color: '255,170,60', max: 6, desc: 'Cada lanzamiento calienta la carga; el <b>6.º</b> es una andanada de <b>tres bombas</b>.' },
  berserker: { name: 'Sed de sangre', color: '255,60,50', max: 10, desc: 'Cada baja suma <b>furia</b> (+3% daño, hasta 10). Con la furia al máximo, cada baja te <b>cura</b> un 3%.' },
};
const sigOn = () => scene === 'rift' && P && P.sig && SIG[P.cls];

const _createPlayerH = createPlayer;
createPlayer = function () {
  _createPlayerH();
  P.sig = { v: 0, t: 0, runes: [], tick: 0, amb: 0, pulse: 0 };
};

// ---------- daño ----------
let sigBasicHit = false;
function sigDmgMul() {
  const s = P.sig;
  if (P.cls === 'iop') return 1 + 0.06 * s.v;
  if (P.cls === 'berserker') return 1 + 0.03 * s.v;
  if (P.cls === 'domadora') return 1 + 0.08 * minions.filter((m) => m.kind === 'wolf').length;
  return 1;
}
const _damageEnemyH = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (!sigOn() || e.dead) return _damageEnemyH(e, base, o);
  sigBasicHit = true;
  base *= sigDmgMul();
  if (P.cls === 'sombra' && P.sig.amb > 0 && !o.quiet) {
    P.sig.amb = 0; P.sig.v = 0;
    base *= 1.6; o = Object.assign({}, o, { crit: true, heavy: true });
    rings.push({ x: e.x, y: e.y, r0: 6, r1: 70, life: 0.3, max: 0.3, color: 'rgba(190,140,255,' });
    sparks(e.x, e.y - 14, 16, '#d8c0ff', 340);
    addText(e.x, e.y - e.r * 2 - 10, '¡Emboscada!', '#d8c0ff', 1);
    hitStop(0.05);
  }
  return _damageEnemyH(e, base, o);
};

// ---------- ataque básico ----------
const _basicAttackH = basicAttack;
basicAttack = function () {
  if (!sigOn()) return _basicAttackH();
  const s = P.sig, cls = P.cls;
  if (cls === 'iop' && s.v >= 5) { _basicAttackH(); breakHelm(); return; }
  sigBasicHit = false;
  const np = projectiles.length, nm = minions.length;
  _basicAttackH();
  if (cls === 'iop' && sigBasicHit) { s.v = Math.min(5, s.v + 1); s.t = 2.6; if (s.v === 5) sigReady(); }
  else if (cls === 'cra' && projectiles.length > np) {
    s.v++;
    if (s.v >= 5) {
      s.v = 0;
      const p = projectiles[projectiles.length - 1];
      p.dmg *= 2.2; p.pierce = 3; p.gold = true; p.r = 8; p.life *= 1.3;
      p.vx *= 1.25; p.vy *= 1.25;
      sparks(p.x, p.y, 10, '#ffe08a', 240);
      SFX.play('fireshot');
    } else if (s.v === 4) sigReady();
  } else if (cls === 'artificiera' && minions.length > nm) {
    s.v++;
    if (s.v >= 6) {
      s.v = 0;
      const m = minions[minions.length - 1], a = Math.atan2(m.ty - P.y, m.tx - P.x);
      for (const k of [-1, 1]) {
        const aa = a + k * 0.32, d = dist(P.x, P.y, m.tx, m.ty) * 0.92;
        throwBomb(P.x + Math.cos(aa) * d, P.y + Math.sin(aa) * d, m.dmg * 1.1, 52, { big: true });
      }
      m.big = true; m.R *= 1.2;
      sparks(P.x, P.y - 20, 12, '#ffb040', 260);
      addText(P.x, P.y - 54, '¡Andanada!', '#ffb040', 0.9);
    } else if (s.v === 5) sigReady();
  }
};
function breakHelm() {
  const s = P.sig;
  s.v = 0; s.t = 0;
  const R = 135;
  rings.push({ x: P.x, y: P.y, r0: 12, r1: R, life: 0.35, max: 0.35, color: 'rgba(255,150,60,' });
  rings.push({ x: P.x, y: P.y, r0: 8, r1: R * 0.7, life: 0.25, max: 0.25, color: 'rgba(255,230,160,' });
  aoe(P.x, P.y, R, skillDmg(2.4), 460, true);
  addDecal('scorch', P.x, P.y, R * 0.8, 3, '255,110,30');
  embers(P.x, P.y, 20, '255,140,40', R * 0.6);
  hitFlash(P.x, P.y - 16, 46, '255,160,60');
  addText(P.x, P.y - 60, '¡Quiebrayelmos!', '#ffb070', 1.1);
  shake(14); hitStop(0.07); zoomPunch = Math.max(zoomPunch, 0.05);
  SFX.play('boom');
}
function sigReady() {
  P.sig.pulse = 0.6;
  const c = SIG[P.cls].color;
  rings.push({ x: P.x, y: P.y, r0: 30, r1: 10, life: 0.3, max: 0.3, color: `rgba(${c},` });
}

// ---------- hechizos (Runista) ----------
const _useSkillH = useSkill;
useSkill = function (i) {
  const before = P && P.skillCd[i];
  _useSkillH(i);
  if (!P || P.skillCd[i] === before) return;
  P.castAnim = 0.5; // pose de lanzar (si la hoja existe)
  castFlourish();
  if (sigOn() && P.cls === 'feca' && P.sig.runes.length < 3) {
    P.sig.runes.push({ a: rand(0, TAU), born: now });
    sparks(P.x, P.y - 20, 8, '#bfe8ff', 200);
  }
};

// ---------- esquiva (Sombra) ----------
const _dashH = dash;
dash = function () {
  const was = P.dashT;
  _dashH();
  if (sigOn() && P.cls === 'sombra' && P.dashT > 0 && was <= 0) {
    P.sig.amb = 2.5; P.sig.v = 1;
    for (let k = 0; k < 10; k++) particles.push({ kind: 'glowdot', x: P.x + rand(-14, 14), y: P.y - rand(0, 34), vx: rand(-30, 30), vy: -rand(20, 60), life: 0.6, max: 0.6, rgb: '150,100,230', size: 4, grav: 0 });
  }
};

// ---------- golpes recibidos (Runista) ----------
const _hurtPlayerH = hurtPlayer;
hurtPlayer = function (dmg, sx, sy, src) {
  if (sigOn() && P.cls === 'feca' && P.sig.runes.length && state === 'play' && !(P.invul > 0) && !(P.dashT > 0) && !P.jump) {
    const r = P.sig.runes.pop(), x = P.x + Math.cos(r.a) * 40, y = P.y - 18 + Math.sin(r.a) * 18;
    sparks(x, y, 14, '#bfe8ff', 300);
    rings.push({ x: P.x, y: P.y, r0: 16, r1: 60, life: 0.25, max: 0.25, color: 'rgba(130,200,255,' });
    SFX.play('shield');
    dmg *= 0.4;
  }
  return _hurtPlayerH(dmg, sx, sy, src);
};

// ---------- bajas ----------
const _killEnemyH = killEnemy;
killEnemy = function (e) {
  const was = e.dead;
  _killEnemyH(e);
  if (was || !sigOn()) return;
  const s = P.sig;
  if (P.cls === 'berserker') {
    if (s.v >= 10) { heal(Math.round(P.maxHp * 0.03)); }
    else { s.v++; if (s.v === 10) { sigReady(); addText(P.x, P.y - 58, '¡Sed de sangre!', '#ff6a5a', 1); } }
    s.t = 4.5;
  } else if (P.cls === 'domadora') {
    s.v++;
    if (s.v >= 10) { s.v = 0; callAlpha(); }
  }
};
function callAlpha() {
  const a = rand(0, TAU);
  const w = { kind: 'wolf', alpha: true, x: P.x + Math.cos(a) * 34, y: P.y + Math.sin(a) * 34, life: 14, atkCd: 0.2, dir: 0, walkT: 0, moving: false, seed: rand(0, 9), rage: 3 };
  minions.push(w);
  poof(w.x, w.y); dust(w.x, w.y, 10);
  rings.push({ x: P.x, y: P.y, r0: 20, r1: 150, life: 0.4, max: 0.4, color: 'rgba(140,230,120,' });
  addText(P.x, P.y - 58, '¡Lobo Alfa!', '#a8f08a', 1);
  SFX.play('baa');
}

// ---------- cada fotograma ----------
const _updatePlayerH = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerH(dt);
  if (P.castAnim > 0) P.castAnim -= dt;
  if (!sigOn()) return;
  const s = P.sig;
  s.pulse = Math.max(0, s.pulse - dt);
  if (P.cls === 'iop' && s.v > 0 && s.v < 5) { s.t -= dt; if (s.t <= 0) s.v = 0; }
  if (P.cls === 'berserker' && s.v > 0) { s.t -= dt; if (s.t <= 0) { s.v--; s.t = 0.6; } }
  if (P.cls === 'sombra' && s.amb > 0) {
    s.amb -= dt; if (s.amb <= 0) s.v = 0;
    if (Math.random() < 0.4) particles.push({ kind: 'glowdot', x: P.x + rand(-12, 12), y: P.y - rand(0, 34), vx: 0, vy: -30, life: 0.5, max: 0.5, rgb: '150,100,230', size: 3, grav: 0 });
  }
  if (P.cls === 'feca' && s.runes.length) {
    s.tick -= dt;
    for (const r of s.runes) r.a += dt * 3.2;
    if (s.tick <= 0) {
      s.tick = 0.35;
      for (const r of s.runes) {
        const x = P.x + Math.cos(r.a) * 46, y = P.y + Math.sin(r.a) * 22;
        for (const e of enemies) if (!e.dead && e.z < 30 && dist(x, y, e.x, e.y) < e.r + 16) _damageEnemyH(e, skillDmg(0.55), { quiet: true, color: '#9fd8ff' });
      }
    }
  }
  // estela de la flecha dorada
  if (P.cls === 'cra') for (const p of projectiles) if (p.gold && Math.random() < 0.8) particles.push({ kind: 'glowdot', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.35, max: 0.35, rgb: '255,214,90', size: 4, grav: 0 });
};

// ---------- dibujo: carga bajo los pies y runas ----------
const _drawPlayerH = drawPlayer;
drawPlayer = function () {
  const front = [];
  if (sigOn() && P.cls === 'feca') for (const r of P.sig.runes) (Math.sin(r.a) > 0 ? front : (front.back = front.back || [])).push(r);
  if (front.back) for (const r of front.back) drawRune(r);
  _drawPlayerH();
  for (const r of front) drawRune(r);
  if (sigOn() && P.cls === 'domadora') for (const m of minions) if (m.alpha && m.life > 0) glow(m.x, m.y - 10, 30, '140,230,120', 0.4 + Math.sin(now * 6) * 0.1);
  if (sigOn()) drawSigGauge();
};
function drawRune(r) {
  const x = P.x + Math.cos(r.a) * 46, y = P.y - 16 + Math.sin(r.a) * 22, k = Math.min(1, (now - r.born) * 4);
  glow(x, y, 28 * k, '130,200,255', 0.65);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(now * 2 + r.a);
  ctx.globalAlpha = 0.95 * k;
  ctx.strokeStyle = '#dff4ff'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); }
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.moveTo(-4, -2); ctx.lineTo(4, 3); ctx.stroke();
  ctx.restore();
}
function drawSigGauge() {
  const D = SIG[P.cls], s = P.sig;
  let v = s.v, max = D.max;
  if (P.cls === 'feca') v = s.runes.length;
  if (P.cls === 'domadora') max = 10;
  const full = v >= max;
  const n = Math.min(max, 10), filled = max > 10 ? Math.round((v / max) * n) : v;
  const y = P.y + 13, w = n > 6 ? 9 : 12, h = 5, gap = 3, x0 = P.x - (n * w + (n - 1) * gap) / 2;
  ctx.save();
  if (full || s.pulse > 0) glow(P.x, y, 34, D.color, 0.4 + Math.sin(now * 8) * 0.15);
  for (let i = 0; i < n; i++) {
    const on = i < filled, x = x0 + i * (w + gap);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x + w, y); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x, y); ctx.closePath();
    ctx.globalAlpha = on ? 1 : 0.55;
    ctx.fillStyle = on ? `rgb(${D.color})` : 'rgba(15,15,25,0.85)';
    ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = on && full ? '#fff' : 'rgba(0,0,0,0.85)'; ctx.stroke();
  }
  ctx.restore();
}

// ---------- selección de héroe: la mecánica propia ----------
const _showClassInfoH = showClassInfo;
showClassInfo = function (id) {
  _showClassInfoH(id);
  const D = SIG[id], el = document.querySelector('#hsInfo .hs-skills');
  if (D && el) el.insertAdjacentHTML('afterbegin', `<div class="hs-sig" style="--sc:rgb(${D.color})"><b>✦ ${D.name}</b> <span>· mecánica propia — ${D.desc}</span></div>`);
};

// ---------- pose de lanzar hechizo (hojas «cast» de 6 fotogramas) ----------
const _heroAnimPoseH = heroAnimPose;
heroAnimPose = function (cls, o) {
  const A = HERO_ANIM[cls];
  if (A && A.cast && scene === 'rift' && P && cls === P.cls && P.castAnim > 0 && !(o.hurt > 0)) {
    const n = A.cast.length;
    return ['cast', Math.min(n - 1, Math.floor((1 - P.castAnim / 0.5) * n))];
  }
  return _heroAnimPoseH(cls, o);
};

// ---------- selección de héroe: aura del color del héroe y chispas que suben detrás de la ilustración ----------
(function () {
  const art = document.querySelector('.hs-art');
  if (!art) return;
  let h = '<div class="hs-aura"></div><div class="hs-motes">';
  for (let i = 0; i < 14; i++) h += `<i style="left:${(8 + Math.random() * 84).toFixed(0)}%;animation-duration:${(3.5 + Math.random() * 3).toFixed(1)}s;animation-delay:${(-Math.random() * 6).toFixed(1)}s"></i>`;
  art.insertAdjacentHTML('afterbegin', h + '</div>');
})();
const _showClassInfoA = showClassInfo;
showClassInfo = function (id) {
  _showClassInfoA(id);
  const art = document.querySelector('.hs-art'), D = SIG[id];
  if (art && D) art.style.setProperty('--hc', D.color);
};

// ---------- el arma se nota según su rareza: brillo en la mano, estela al atacar y halo en los proyectiles ----------
const WPN_FX = [null, { rgb: '120,200,255', n: 0.4 }, { rgb: '210,150,255', n: 0.7 }, { rgb: '255,180,70', n: 1 }];
const wpnFx = () => { const w = S && S.equip && S.equip.arma; return w ? WPN_FX[w.rarity] : null; };
const _updatePlayerW = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerW(dt);
  const f = wpnFx();
  if (!f || scene !== 'rift') return;
  const face = Math.cos(P.dir) >= 0 ? 1 : -1;
  // motas que salen del arma (en la mano, delante del héroe)
  if (Math.random() < f.n * dt * 30) particles.push({ kind: 'glowdot', x: P.x + face * rand(8, 22), y: P.y - rand(18, 44), vx: rand(-10, 10), vy: -rand(20, 50), life: 0.6, max: 0.6, rgb: f.rgb, size: f === WPN_FX[3] ? 6 : 5, grav: 0 });
  // estela del golpe
  if (P.swingT > 0.05) for (let i = 0; i < 4; i++) {
    const a = P.dir + rand(-0.9, 0.9), r = rand(30, 80);
    particles.push({ kind: 'glowdot', x: P.x + Math.cos(a) * r, y: P.y - 16 + Math.sin(a) * r, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: 0.35, max: 0.35, rgb: f.rgb, size: 5, grav: 0 });
  }
  // halo de los proyectiles
  for (const p of projectiles) if (p.team === 'p' && !p.gold && Math.random() < f.n) particles.push({ kind: 'glowdot', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.28, max: 0.28, rgb: f.rgb, size: 5, grav: 0 });
};
const _drawPlayerW = drawPlayer;
drawPlayer = function () {
  _drawPlayerW();
  const f = wpnFx();
  if (!f || scene !== 'rift' || !P) return;
  const face = Math.cos(P.dir) >= 0 ? 1 : -1;
  glow(P.x + face * 16, P.y - 30, f === WPN_FX[3] ? 40 : 30, f.rgb, 0.5 + Math.sin(now * 5) * 0.15);
};

// ---------- destello propio de cada héroe al lanzar cualquier habilidad ----------
const CAST_FX = {
  iop: { rgb: '255,130,50', vfx: null }, cra: { rgb: '255,214,90', vfx: null }, feca: { rgb: '130,200,255', vfx: 'runeBlue', size: 150, flat: true },
  sombra: { rgb: '170,120,240', vfx: 'smoke', size: 120 }, domadora: { rgb: '140,230,120', vfx: 'wolf', size: 110 },
  artificiera: { rgb: '255,170,60', vfx: null }, berserker: { rgb: '255,60,50', vfx: 'rage', size: 130 },
};
function castFlourish() {
  const f = CAST_FX[P.cls];
  if (!f || scene !== 'rift') return;
  rings.push({ x: P.x, y: P.y, r0: 8, r1: 64, life: 0.3, max: 0.3, color: `rgba(${f.rgb},` });
  if (f.vfx) spawnVfx(f.vfx, P.x, P.y - (f.flat ? 0 : 24), f.size, f.flat ? { dur: 0.6, flat: true, layer: 'ground' } : { dur: 0.5 });
  for (let i = 0; i < 12; i++) {
    const a = rand(0, TAU), sp = rand(60, 160);
    particles.push({ kind: 'glowdot', x: P.x + Math.cos(a) * 10, y: P.y - 24 + Math.sin(a) * 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 40, life: 0.5, max: 0.5, rgb: f.rgb, size: 4, grav: 0 });
  }
  glow(P.x, P.y - 24, 50, f.rgb, 0.5);
}

// ---------- pantalla de inicio: chispas que suben desde la Grieta ----------
(function () {
  const box = document.querySelector('#title .t-sparks');
  if (!box) return;
  let h = '';
  for (let i = 0; i < 34; i++) {
    const w = Math.random() < 0.35 ? ' class="w"' : '';
    h += `<i${w} style="left:${(Math.random() * 100).toFixed(1)}%;--dx:${(Math.random() * 120 - 60).toFixed(0)}px;animation-duration:${(6 + Math.random() * 8).toFixed(1)}s;animation-delay:${(-Math.random() * 12).toFixed(1)}s;transform:scale(${(0.5 + Math.random()).toFixed(2)})"></i>`;
  }
  box.innerHTML = h;
})();
