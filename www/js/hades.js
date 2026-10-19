/* Fendaria — mecánicas de combate inspiradas en Hades II (se apoyan en boons.js).
 *  · Dúos: bendiciones especiales que aparecen si ya tienes dones de dos dioses concretos.
 *  · Ataques Ω: mantén pulsada una habilidad para cargarla; al soltarla gasta 2 de energía extra,
 *    pega un 60% más y lanza una onda a tu alrededor.
 *  · Sello de atadura (botón ◎): un círculo rúnico que inmoviliza a los enemigos 3 s. Tiene su propio hueco de bendición.
 *  · Puertas de recompensa: a mitad de la Grieta eliges entre dos premios (dios, ámbar, cofre, curación o martillo).
 *  · Martillo de Tobías: mejoras que transforman tu ataque básico durante la Grieta.
 */
'use strict';

// ============================================================
// Dúos y bendiciones del Sello
// ============================================================
const DUOS = {
  venenoParalizante: { gods: ['veneno', 'tiempo'], name: 'Veneno Paralizante', d: () => 'Los enemigos envenenados quedan <b>ralentizados</b> y tus aturdimientos duran un <b>50%</b> más.' },
  furiaSangrienta: { gods: ['ira', 'sangre'], name: 'Furia Sangrienta', d: () => 'Por debajo de la mitad de vida haces <b>+30%</b> de daño y robas un <b>6%</b> como vida.' },
  manadaDorada: { gods: ['bestias', 'riqueza'], name: 'Manada Dorada', d: () => 'Tus espíritus y dragoncillos disparan <b>el doble de rápido</b> y ganas <b>+25%</b> de ámbar.' },
  murallaViva: { gods: ['escudo', 'bosque'], name: 'Muralla Viva', d: () => 'Cuando tu escudo para un golpe brotan <b>zarzas</b> a tu alrededor.' },
  tiroDeGracia: { gods: ['punteria', 'suerte'], name: 'Tiro de Gracia', d: () => 'Tus golpes a enemigos <b>marcados</b> tienen un <b>+30%</b> de crítico.' },
  brindisSanador: { gods: ['fiesta', 'cura'], name: 'Brindis Sanador', d: () => 'Cada enemigo que <b>aturdes</b> te cura un <b>1,5%</b> de tu vida.' },
};
for (const [id, D] of Object.entries(DUOS)) BOONS[id] = { god: D.gods[0], gods: D.gods, slot: 'duo', name: D.name, x: 1, d: D.d };

Object.assign(BOONS, {
  selloIgneo: { god: 'ira', slot: 'cast', name: 'Sello Ígneo', x: 2, d: (x) => `Tu <b>Sello</b> estalla al terminar (${pct(x)} del daño básico a los atrapados).` },
  selloToxico: { god: 'veneno', slot: 'cast', name: 'Sello Tóxico', x: 0.5, d: (x) => `Tu <b>Sello</b> envenena a los atrapados (${pct(x)} del básico por segundo).` },
  selloEterno: { god: 'tiempo', slot: 'cast', name: 'Sello Eterno', x: 0.6, max: 1.2, d: (x) => `Tu <b>Sello</b> dura un <b>${pct(x)}</b> más y es más grande.` },
  selloGuardian: { god: 'escudo', slot: 'cast', name: 'Sello Guardián', x: 0.04, max: 0.1, d: (x) => `Dentro de tu <b>Sello</b> ganas un escudo del ${pct(x)} de tu vida por segundo.` },
  selloSangriento: { god: 'sangre', slot: 'cast', name: 'Sello Sangriento', x: 0.25, max: 0.6, d: (x) => `Los atrapados en tu <b>Sello</b> reciben <b>+${pct(x)}</b> de daño.` },
});

const godsOwned = () => new Set(Object.keys((bst() || {}).owned || {}).map((id) => BOONS[id].god));
function injectDuo(opts, god) {
  const b = bst(), own = godsOwned();
  const cands = Object.entries(DUOS).filter(([id, D]) => !b.owned[id] && D.gods.includes(god) && own.has(D.gods.find((g) => g !== god)));
  if (!cands.length || Math.random() > 0.7) return;
  const [id] = pick(cands);
  opts[randi(0, opts.length - 1)] = { id, r: 4 };
}

// ============================================================
// Efectos de los dúos y del Sello
// ============================================================
const _stunEnemy = stunEnemy;
stunEnemy = function (e, t) {
  const fresh = !(e.stunT > 0);
  _stunEnemy(e, has('venenoParalizante') ? t * 1.5 : t);
  if (fresh && has('brindisSanador') && P) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.015);
};

const _damageEnemy2 = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (!bst() || e.dead || !P) return _damageEnemy2(e, base, o);
  const src = o.src || curSrc || 'other';
  let m = 1;
  if (has('furiaSangrienta') && P.hp < P.maxHp * 0.5) m *= 1.3;
  if (src === 'skill' && P.omegaT > now) m *= 1.6;
  if (e.sealT > now && has('selloSangriento')) m *= 1 + bv('selloSangriento');
  if (src === 'basic') { if (hasHammer('filo')) m *= 1.35; if (echoMul) m *= echoMul; }
  if (has('tiroDeGracia') && e.markT > now && Math.random() < 0.3 && !o.quiet) o = Object.assign({}, o, { crit: true });
  _damageEnemy2(e, base * m, o);
  if (has('furiaSangrienta') && P.hp < P.maxHp * 0.5 && !o.quiet) P.hp = Math.min(P.maxHp, P.hp + base * m * 0.06);
};

const _hurtPlayer = hurtPlayer;
hurtPlayer = function (dmg, sx, sy, src) {
  const sh = P ? P.shield : 0;
  _hurtPlayer(dmg, sx, sy, src);
  const b = bst();
  if (b && P && has('murallaViva') && P.shield < sh && now > (b.wallT || 0)) {
    b.wallT = now + 1.5;
    b.zones.push({ kind: 'thorn', x: P.x, y: P.y, r: 90, life: 3, dps: basicDmg() * 0.8, tick: 0 });
  }
};

const _recalc2 = recalc;
recalc = function () {
  _recalc2();
  if (!P || !bst()) return;
  if (has('manadaDorada')) P.kamaMul *= 1.25;
  if (hasHammer('filo')) P.atkSpeed *= 1.2;
};

// ============================================================
// Ataques Ω (mantener pulsada una habilidad)
// ============================================================
const OMEGA_T = 0.45, OMEGA_COST = 2;
let omegaHold = null;
canvas.addEventListener('pointerdown', (ev) => {
  if (state !== 'play') return;
  const k = hitButton(ev.clientX, ev.clientY);
  if (k === 's0' || k === 's1') { input.pressed[k] = false; omegaHold = { id: ev.pointerId, k, t0: now }; }
});
function omegaRelease(ev) {
  if (!omegaHold || ev.pointerId !== omegaHold.id) return;
  const h = omegaHold; omegaHold = null;
  if (state !== 'play') return;
  const i = +h.k[1];
  if (now - h.t0 >= OMEGA_T && P.pa >= P.C.skills[i].cost + OMEGA_COST && P.skillCd[i] <= 0) omegaCast(i);
  else input.pressed[h.k] = true;
}
canvas.addEventListener('pointerup', omegaRelease);
canvas.addEventListener('pointercancel', omegaRelease);
// teclado: mantener K / L
const keyHold = {};
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase(), s = k === 'k' || k === '1' ? 's0' : k === 'l' || k === '2' ? 's1' : null;
  if (state !== 'play') return;
  if (s && !e.repeat) { input.pressed[s] = false; keyHold[s] = now; }
  if (k === 'o' || k === '5') input.pressed.cast = true;
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase(), s = k === 'k' || k === '1' ? 's0' : k === 'l' || k === '2' ? 's1' : null;
  if (!s || keyHold[s] === undefined || state !== 'play') { if (s) delete keyHold[s]; return; }
  const t0 = keyHold[s]; delete keyHold[s];
  const i = +s[1];
  if (now - t0 >= OMEGA_T && P.pa >= P.C.skills[i].cost + OMEGA_COST && P.skillCd[i] <= 0) omegaCast(i);
  else input.pressed[s] = true;
});
function omegaCast(i) {
  const pa0 = P.pa;
  P.omegaT = now + 1.4;
  useSkill(i);
  if (P.pa >= pa0) { P.omegaT = 0; return; }
  P.pa = Math.max(0, P.pa - OMEGA_COST);
  curSrc = 'skill';
  try { aoe(P.x, P.y, 150, skillDmg(1.6), 420, true); } finally { curSrc = null; }
  rings.push({ x: P.x, y: P.y, r0: 20, r1: 170, life: 0.45, max: 0.45, color: 'rgba(255,214,110,' });
  rings.push({ x: P.x, y: P.y, r0: 10, r1: 120, life: 0.3, max: 0.3, color: 'rgba(255,255,255,' });
  hitFlash(P.x, P.y - 20, 60, '255,214,110');
  sparks(P.x, P.y - 16, 24, '#ffe08a', 460);
  addText(P.x, P.y - 70, 'Ω ' + P.C.skills[i].name, '#ffd76a', 1.3);
  shake(12); hitStop(0.08); zoomPunch = Math.max(zoomPunch, 0.05);
  SFX.play('boom');
}

// ============================================================
// Sello de atadura (botón ◎)
// ============================================================
const SEAL_CD = 9;
const _buttonLayout = buttonLayout;
buttonLayout = function () {
  const L = _buttonLayout(), s = ui;
  return L;
};
const _hitButton = hitButton;
hitButton = function (x, y) {
  if (scene === 'rift' && state === 'play') { const c = buttonLayout().cast; if (dist(x, y, c.x, c.y) < c.r * 1.25) return 'cast'; }
  return _hitButton(x, y);
};
function castSeal() {
  if (!P || (P.castCd || 0) > now || P.lock > 0) return;
  const b = bst(); if (!b) return;
  const ext = has('selloEterno') ? bv('selloEterno') : 0;
  P.castCd = now + SEAL_CD * (P.cdMul || 1);
  const t = nearestEnemy(P.x, P.y, 380);
  const x = t ? t.x : P.x + Math.cos(P.dir) * 160, y = t ? t.y : P.y + Math.sin(P.dir) * 160;
  const r = 110 * (1 + ext * 0.4), life = 3 * (1 + ext);
  b.seals.push({ x, y, r, life, max: life, tick: 0 });
  addDecal('rune', x, y, r, life, '170,200,255');
  rings.push({ x, y, r0: r * 1.6, r1: r, life: 0.35, max: 0.35, color: 'rgba(170,200,255,' });
  hitFlash(x, y - 10, 40, '170,200,255');
  SFX.play('magic');
}
function updateSeals(dt) {
  const b = bst();
  for (const sl of b.seals) {
    sl.life -= dt; sl.tick -= dt;
    for (const e of enemies) {
      if (e.dead || dist(e.x, e.y, sl.x, sl.y) > sl.r + e.r * 0.5) continue;
      e.sealT = now + 0.2;
      if (e.boss) e.slowT = Math.max(e.slowT, 0.2); else e.stunT = Math.max(e.stunT || 0, 0.15);
    }
    if (sl.tick <= 0) {
      sl.tick = 0.5;
      if (has('selloToxico')) for (const e of enemies) if (!e.dead && e.sealT > now && !e.dot) e.dot = { t: 3, dps: basicDmg() * bv('selloToxico'), tick: 0.5 };
      if (has('selloGuardian') && dist(P.x, P.y, sl.x, sl.y) < sl.r) { P.shield = Math.min(P.maxHp, (P.shield || 0) + P.maxHp * bv('selloGuardian') * 0.5); P.shieldT = 3; }
    }
    if (sl.life <= 0 && has('selloIgneo')) {
      for (const e of enemies) if (!e.dead && dist(e.x, e.y, sl.x, sl.y) < sl.r + e.r) _damageEnemy2(e, basicDmg() * bv('selloIgneo'), { kb: 300, fx: sl.x, fy: sl.y, heavy: true });
      rings.push({ x: sl.x, y: sl.y, r0: 10, r1: sl.r, life: 0.35, max: 0.35, color: 'rgba(255,120,60,' });
      embers(sl.x, sl.y, 16, '255,140,60', sl.r * 0.6); shake(7); SFX.play('boom');
    }
  }
  b.seals = b.seals.filter((s) => s.life > 0);
}

// ============================================================
// Martillo de Tobías (mejoras del ataque básico)
// ============================================================
const HAMMERS = {
  eco: { name: 'Eco del Golpe', icon: '〰', d: 'Cada ataque básico se <b>repite</b> 0,15 s después con un 60% del daño.' },
  sismo: { name: 'Golpe Sísmico', icon: '💥', d: 'Cada <b>tercer</b> ataque básico lanza una onda a tu alrededor (150% del daño básico).' },
  fantasma: { name: 'Proyectil Fantasma', icon: '👻', d: 'Cada ataque básico dispara además un <b>orbe</b> al enemigo más cercano (60% del daño básico).' },
  filo: { name: 'Filo Ancho', icon: '🗡', d: 'Tus ataques básicos hacen <b>+35%</b> de daño y atacas un <b>20%</b> más rápido.' },
};
const hasHammer = (k) => !!(bst() && bst().hammers && bst().hammers[k]);
let echoMul = 0;
const _basicAttack2 = basicAttack;
basicAttack = function () {
  _basicAttack2();
  const b = bst();
  if (!b || echoMul) return;
  if (hasHammer('eco')) {
    later(0.15, () => {
      if (!P || state !== 'play') return;
      const cd = P.atkCd, n = projectiles.length;
      echoMul = 0.6;
      try { _basicAttack2(); } finally { echoMul = 0; }
      for (let i = n; i < projectiles.length; i++) if (projectiles[i].team === 'p') projectiles[i].dmg *= 0.6;
      P.atkCd = cd;
    });
  }
  if (hasHammer('sismo') && ++b.quake % 3 === 0) {
    curSrc = 'basic';
    try { aoe(P.x, P.y, 125, basicDmg() * 1.5, 280); } finally { curSrc = null; }
    rings.push({ x: P.x, y: P.y, r0: 10, r1: 130, life: 0.3, max: 0.3, color: 'rgba(255,200,120,' });
    dust(P.x, P.y, 10); shake(4);
  }
  if (hasHammer('fantasma')) {
    const t = nearestEnemy(P.x, P.y, 420);
    if (t) { const a = Math.atan2(t.y - P.y, t.x - P.x); projectiles.push({ team: 'p', kind: 'orb', src: 'other', x: P.x, y: P.y - 20, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, r: 6, dmg: basicDmg() * 0.6, life: 0.9, pierce: 0, kb: 30, hit: [] }); }
  }
};

// ============================================================
// Elección genérica (puertas y martillo)
// ============================================================
document.body.insertAdjacentHTML('beforeend', '<div id="choicePick" class="boon-pick"></div>');
let choice = null;
function openChoice(head, opts, onPick) {
  choice = { prev: state, opts, onPick };
  state = 'boon';
  clearInput();
  $('choicePick').innerHTML = `<div class="bp-box" style="--c:${head.color}">
    <div class="bp-head"><div class="bp-por bp-icon">${head.icon}</div><div><b>${head.title}</b><small>${head.sub}</small><i>«${head.quote}»</i></div></div>
    <div class="bp-cards">${opts.map((o, k) => `<button class="bp-card" data-k="${k}" style="--c:${head.color};--r:${o.color || head.color}">
      <div class="bp-top"><span class="bp-slot"${o.can === false ? ' style="opacity:.6"' : ''}>${o.tag}</span><span class="bp-rar">${o.icon || ''}</span></div>
      <div class="bp-name">${o.name}</div><div class="bp-desc">${o.d}</div></button>`).join('')}</div></div>`;
  $('choicePick').classList.add('show');
  SFX.play('legend');
}
$('choicePick').addEventListener('click', (ev) => {
  const c = ev.target.closest('.bp-card');
  if (!c || !choice) return;
  const ch = choice; choice = null;
  $('choicePick').classList.remove('show');
  state = ch.prev === 'boon' ? 'play' : ch.prev;
  SFX.play('click');
  ch.onPick(ch.opts[+c.dataset.k]);
});

function openHammer() {
  const b = bst();
  const free = Object.keys(HAMMERS).filter((k) => !b.hammers[k]).sort(() => Math.random() - 0.5).slice(0, 2);
  if (!free.length) { dropPickup(P.x, P.y, 'item', { item: makeItem(S.cls, itemLevel(), rollDiffRarity(rift.D, 0.5)) }); return; }
  openChoice({ icon: '⚒', title: 'Martillo de Tobías', sub: 'Mejora tu arma durante esta Grieta', quote: 'Un buen golpe de martillo lo cambia todo, chaval.', color: '#ffb070' },
    free.map((k) => ({ id: k, tag: 'Arma', icon: HAMMERS[k].icon, name: HAMMERS[k].name, d: HAMMERS[k].d })),
    (o) => { b.hammers[o.id] = true; recalc(); buildBoonBar(); rings.push({ x: P.x, y: P.y, r0: 10, r1: 140, life: 0.5, max: 0.5, color: 'rgba(255,176,112,' }); });
}

// ============================================================
// Puertas de recompensa (a mitad de la Grieta)
// ============================================================
const REWARDS = {
  dios: { name: 'Bendición', icon: '✦', rgb: '255,236,160', d: 'Un dios te ofrecerá su bendición' },
  martillo: { name: 'Martillo', icon: '⚒', rgb: '255,176,112', d: 'Mejora tu ataque básico' },
  oro: { name: 'Tesoro', icon: '💰', rgb: '255,210,90', d: 'Un buen montón de ámbar' },
  cofre: { name: 'Cofre', icon: '🎁', rgb: '200,140,255', d: 'Dos piezas de equipo de calidad' },
  cura: { name: 'Manantial', icon: '✚', rgb: '120,255,160', d: 'Recupera toda tu vida y una poción' },
};
function spawnDoors() {
  const b = bst();
  const first = Math.random() < 0.6 ? 'dios' : 'martillo';
  const second = pick(Object.keys(REWARDS).filter((k) => k !== first));
  const a = rand(0, TAU);
  [first, second].forEach((kind, i) => {
    const ang = a + i * Math.PI;
    let x = clamp(P.x + Math.cos(ang) * 170, 80, WORLD.w - 80), y = clamp(P.y + Math.sin(ang) * 120, 80, WORLD.h - 80);
    for (const o of obstacles) if (dist(x, y, o.x, o.y) < o.r + 50) o.gone = true;
    b.doors.push({ x, y, kind });
  });
  obstacles = obstacles.filter((o) => !o.gone);
  showBanner('Elige tu recompensa', '#ffe08a', 'Dos puertas se han abierto: solo puedes cruzar una');
  SFX.play('zaap');
}
function takeDoor(d) {
  const b = bst();
  b.doors = [];
  rings.push({ x: d.x, y: d.y, r0: 10, r1: 120, life: 0.4, max: 0.4, color: `rgba(${REWARDS[d.kind].rgb},` });
  SFX.play('zaap');
  if (d.kind === 'dios') {
    const gods = Object.keys(GODS).filter((g) => g !== b.lastGod);
    const al = { x: d.x, y: d.y, god: pick(gods), t: 0 };
    b.lastGod = al.god; b.altars.push(al);
    openBoonPick(al);
  } else if (d.kind === 'martillo') openHammer();
  else if (d.kind === 'oro') { const v = Math.round((20 + rift.level * 12) * P.kamaMul); for (let i = 0; i < 12; i++) dropPickup(d.x, d.y, 'kama', { val: v }); }
  else if (d.kind === 'cofre') { for (let i = 0; i < 2; i++) dropPickup(d.x, d.y, 'item', { item: makeItem(S.cls, itemLevel() + 1, rollDiffRarity(rift.D, 0.5)) }); }
  else if (d.kind === 'cura') { heal(P.maxHp); S.pan = Math.min(panMax(), S.pan + 1); }
}

// el segundo altar de la Grieta se convierte en una elección de puertas
const _spawnAltar = spawnAltar;
spawnAltar = function () {
  const b = bst();
  if (b.given === 1 && !rift.isSuper) { b.given++; spawnDoors(); return; }
  _spawnAltar();
};

const _boonInit = boonInit;
boonInit = function () {
  _boonInit();
  Object.assign(rift.bn, { seals: [], doors: [], hammers: {}, quake: 0, wallT: 0 });
  if (P) P.castCd = 0;
};

const _boonUpdate = boonUpdate;
boonUpdate = function (dt) {
  _boonUpdate(dt);
  const b = bst();
  if (!b || state !== 'play') return;
  if (input.pressed.cast) { input.pressed.cast = false; castSeal(); }
  updateSeals(dt);
  if (has('manadaDorada')) for (const s of b.spirits) s.cd -= dt;
  if (has('venenoParalizante')) for (const e of enemies) if (!e.dead && e.dot) e.slowT = Math.max(e.slowT, 0.2);
  for (const d of b.doors) if (dist(P.x, P.y, d.x, d.y) < 44) { takeDoor(d); break; }
};

const _buildBoonBar = buildBoonBar;
buildBoonBar = function () {
  _buildBoonBar();
  const b = bst(), el = $('boonBar');
  if (!b || !b.hammers) return;
  const hs = Object.keys(b.hammers);
  if (!hs.length) return;
  el.insertAdjacentHTML('beforeend', hs.map((k) => `<span class="hm" title="${HAMMERS[k].name}" style="--c:#ffb070;--r:#ffb070">${HAMMERS[k].icon}</span>`).join(''));
  el.classList.add('show');
};

// dibujo de puertas
const _drawDecals2 = drawDecals;
drawDecals = function () {
  _drawDecals2();
  const b = scene === 'rift' && bst();
  if (!b) return;
  for (const d of b.doors) {
    const R = REWARDS[d.kind], bob = Math.sin(now * 2.6 + d.x) * 4;
    glow(d.x, d.y - 40, 80, R.rgb, 0.55);
    ctx.save(); ctx.translate(d.x, d.y);
    ctx.fillStyle = '#3a3448'; ctx.strokeStyle = `rgb(${R.rgb})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-26, -52); ctx.arc(0, -52, 26, Math.PI, 0); ctx.lineTo(26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    const gr = ctx.createLinearGradient(0, -78, 0, 0); gr.addColorStop(0, `rgba(${R.rgb},0.9)`); gr.addColorStop(1, `rgba(${R.rgb},0.2)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-18, -50); ctx.arc(0, -50, 18, Math.PI, 0); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill();
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(R.icon, 0, -96 + bob);
    ctx.font = '900 11px Nunito, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(R.name, 0, 12);
    ctx.restore();
  }
};
const _boonLights = boonLights;
boonLights = function (lights, toS) {
  _boonLights(lights, toS);
  const b = scene === 'rift' && bst();
  if (!b) return;
  for (const d of b.doors) { const q = toS(d.x, d.y - 40); lights.push({ x: q.x, y: q.y, r: 180 * zoom, a: 1, rgb: REWARDS[d.kind].rgb, haze: 0.3 }); }
  for (const s of b.seals) { const q = toS(s.x, s.y); lights.push({ x: q.x, y: q.y, r: s.r * 2 * zoom, a: 0.8, rgb: '170,200,255', haze: 0.2 }); }
};

// botón del Sello y carga de los ataques Ω
const _drawControls = drawControls;
drawControls = function () {
  _drawControls();
  if (scene !== 'rift' || !P || !bst()) return;
  const s = ui, L = buttonLayout(), c = L.cast;
  const cdk = clamp(((P.castCd || 0) - now) / (SEAL_CD * (P.cdMul || 1)), 0, 1);
  ctx.save();
  ctx.globalAlpha = cdk > 0 ? 0.6 : 1;
  circle(c.x, c.y, c.r, 'rgba(12,16,32,0.6)', has('selloIgneo') || has('selloToxico') || has('selloEterno') || has('selloGuardian') || has('selloSangriento') ? '#ffd76a' : '#9fb8ff', 3);
  if (cdk > 0) { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.arc(c.x, c.y, c.r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * cdk); ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill(); }
  text('◎', c.x, c.y, c.r * 0.9, '#fff', 'center', 900);
  ctx.restore();
  // carga Ω
  const hk = omegaHold ? omegaHold.k : Object.keys(keyHold)[0];
  const t0 = omegaHold ? omegaHold.t0 : keyHold[hk];
  if (hk && t0 !== undefined) {
    const bt = L[hk], k = clamp((now - t0) / OMEGA_T, 0, 1), ready = k >= 1 && P.pa >= P.C.skills[+hk[1]].cost + OMEGA_COST;
    ctx.save();
    ctx.lineWidth = 5 * s; ctx.strokeStyle = ready ? '#ffd76a' : 'rgba(255,214,110,0.6)';
    ctx.beginPath(); ctx.arc(bt.x, bt.y, bt.r + 6 * s, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
    if (ready) { ctx.globalAlpha = 0.5 + Math.sin(now * 14) * 0.3; text('Ω', bt.x, bt.y - bt.r - 16 * s, 18 * s, '#ffd76a', 'center', 900); }
    ctx.restore();
  }
};

// ============================================================
// Mercader errante: tienda de ámbar dentro de la Grieta (aparece al 40 % de la barra)
// ============================================================
const WARES = {
  cura: { name: 'Cataplasma', icon: '✚', d: 'Recupera el <b>50%</b> de tu vida.', k: 6, ok: () => P.hp < P.maxHp, buy: () => heal(Math.round(P.maxHp * 0.5)) },
  pocion: { name: 'Poción extra', icon: '🧪', d: 'Una <b>poción</b> más para esta Grieta.', k: 5, ok: () => S.pan < panMax(), buy: () => { S.pan = Math.min(panMax(), S.pan + 1); } },
  bendicion: { name: 'Ofrenda a los Doce', icon: '✦', d: 'Un dios te ofrece una <b>bendición</b> ahora mismo.', k: 14, ok: () => true, buy: () => {
    const b = bst(), al = { x: P.x, y: P.y, god: pick(Object.keys(GODS).filter((g) => g !== b.lastGod)), t: 0 };
    b.lastGod = al.god; b.altars.push(al); later(0.1, () => openBoonPick(al));
  } },
  martillo: { name: 'Golpe de martillo', icon: '⚒', d: 'Una mejora del <b>Martillo de Tobías</b> para tu arma.', k: 16, ok: () => Object.keys(HAMMERS).some((h) => !bst().hammers[h]), buy: () => later(0.1, openHammer) },
  pulir: { name: 'Pulir bendición', icon: '💎', d: 'Sube de <b>rareza</b> una de tus bendiciones al azar.', k: 12, ok: () => Object.values(bst().owned).some((o) => o.r < 3), buy: () => {
    const c = Object.entries(bst().owned).filter(([, o]) => o.r < 3); const [id, o] = pick(c); o.r++; recalc(); buildBoonBar();
    addText(P.x, P.y - 60, BOONS[id].name + ' → ' + BOON_RARITY[o.r].name, BOON_RARITY[o.r].color, 1.1);
  } },
  vigor: { name: 'Corazón de Grieta', icon: '❤', d: '<b>+15%</b> de vida máxima hasta salir de la Grieta.', k: 10, ok: () => true, buy: () => { bst().vigor = (bst().vigor || 0) + 0.15; recalc(); heal(Math.round(P.maxHp * 0.15)); } },
};
function warePrice(id) { return Math.round(WARES[id].k * (6 + rift.level * 3)); }
function spawnMerchant() {
  const b = bst();
  let x = P.x, y = P.y;
  for (let k = 0; k < 20; k++) {
    const a = rand(0, TAU), d = rand(170, 240);
    x = clamp(P.x + Math.cos(a) * d, 80, WORLD.w - 80); y = clamp(P.y + Math.sin(a) * d, 80, WORLD.h - 80);
    if (!obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + 60)) break;
  }
  const stock = Object.keys(WARES).sort(() => Math.random() - 0.5).slice(0, 3);
  b.merchant = { x, y, stock, sold: {}, near: false };
  showBanner('Mercader errante', '#ffcf7a', 'Cambia tu ámbar por ayuda dentro de la Grieta');
  SFX.play('coin');
}
function openMerchant() {
  const b = bst(), m = b.merchant;
  const opts = m.stock.map((id) => {
    const W = WARES[id], price = warePrice(id), sold = m.sold[id], can = !sold && S.kamas >= price && W.ok();
    return { id, tag: sold ? 'Vendido' : `${fmtNum(price)} ámbar`, icon: W.icon, name: W.name, d: W.d + (can || sold ? '' : ' <span style="color:#ff8a80">No disponible</span>'), color: can ? '#ffcf7a' : '#555a70', can };
  });
  opts.push({ id: 'salir', tag: 'Seguir', icon: '➜', name: 'Seguir luchando', d: `Tienes <b>${fmtNum(S.kamas)}</b> ámbar.`, color: '#8d90a8', can: true });
  openChoice({ icon: '🪙', title: 'Mercader errante', sub: 'Tienda de la Grieta', quote: '¿Ámbar? Lo acepto todo, viajero… menos excusas.', color: '#ffcf7a' }, opts, (o) => {
    if (o.id === 'salir' || !o.can) return;
    const price = warePrice(o.id);
    S.kamas -= price; m.sold[o.id] = true;
    WARES[o.id].buy();
    SFX.play('coin');
    addText(P.x, P.y - 50, '-' + fmtNum(price) + ' ámbar', '#ffcf7a', 1);
    if (o.id !== 'bendicion' && o.id !== 'martillo') later(0.25, () => { if (state === 'play') openMerchant(); }); // seguir comprando
  });
}
const _boonUpdate2 = boonUpdate;
boonUpdate = function (dt) {
  _boonUpdate2(dt);
  const b = bst();
  if (!b || state !== 'play' || rift.isSuper) return;
  if (!b.merchant && !rift.bossSpawned && rift.progress / rift.goal >= 0.4) spawnMerchant();
  const m = b.merchant;
  if (m) {
    const d = dist(P.x, P.y, m.x, m.y);
    if (d < 46 && !m.inside) { m.inside = true; openMerchant(); }
    else if (d > 80) m.inside = false;
  }
};
const _recalc3 = recalc;
recalc = function () {
  _recalc3();
  const b = P && bst();
  if (b && b.vigor) { const r = P.hp / P.maxHp; P.maxHp = Math.round(P.maxHp * (1 + b.vigor)); P.hp = Math.round(P.maxHp * r); }
};
const _drawDecals3 = drawDecals;
drawDecals = function () {
  _drawDecals3();
  const b = scene === 'rift' && bst(), m = b && b.merchant;
  if (!m) return;
  const img = PROP_IMG.villa, f = PROP_ATLAS.villa && PROP_ATLAS.villa.merchant && PROP_ATLAS.villa.merchant[0];
  glow(m.x, m.y - 30, 70, '255,207,122', 0.4);
  ctx.save(); ctx.fillStyle = 'rgba(10,8,20,0.4)'; ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, 30, 10, 0, 0, TAU); ctx.fill(); ctx.restore();
  // alfombra con mercancía
  ctx.save(); ctx.translate(m.x + 30, m.y);
  ctx.fillStyle = '#7a2a2a'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#e0b060'; ctx.lineWidth = 1.5; ctx.stroke();
  circle(-8, -5, 4, '#ff6a6a', '#2a1010', 1); circle(4, -6, 4, '#7ad8ff', '#10202a', 1); circle(12, -3, 3, '#ffd76a', '#2a2010', 1);
  ctx.restore();
  if (img && f) {
    const w = f[2] * PROP_WU_PER_PX, h = f[3] * PROP_WU_PER_PX;
    ctx.drawImage(img, f[0], f[1], f[2], f[3], m.x - w / 2, m.y - h + 2, w, h);
  } else circle(m.x, m.y - 20, 14, '#ffcf7a', '#2a2010', 2);
  ctx.save(); ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.fillText('🪙', m.x, m.y - 84 + Math.sin(now * 3) * 3); ctx.restore();
};
const _boonLights2 = boonLights;
boonLights = function (lights, toS) {
  _boonLights2(lights, toS);
  const b = scene === 'rift' && bst();
  if (b && b.merchant) { const q = toS(b.merchant.x, b.merchant.y - 30); lights.push({ x: q.x, y: q.y, r: 160 * zoom, a: 0.9, rgb: '255,207,122', haze: 0.3 }); }
};
