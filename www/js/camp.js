/* Fendaria — ritmo de Grieta al estilo Hades 2.
 *  · Oleadas: al llegar a un umbral de la barra deja de haber refuerzos; al despejar la zona aparece la recompensa.
 *  · Nada se abre solo al pisarlo: altares, puertas, mercader y Portal usan el botón de interacción (o la tecla E).
 *  · Campamento tras el Guardián: la mercader (mercancía para después de la Grieta) y una Ofrenda de los Doce
 *    cuya bendición te acompaña en la próxima Grieta.
 *  · Al cruzar el Portal: una escena breve y, ya en Villa Candela, un recordatorio de dónde mejorar.
 */
'use strict';

const aliveFoes = () => enemies.filter((e) => !e.dead);

// ============================================================
// Oleadas: la batalla termina antes de cada recompensa
// ============================================================
const _spawnAltarW = spawnAltar;
spawnAltar = function () {
  const b = bst();
  if (rift.isSuper) return _spawnAltarW();
  if (b.lull) return; // primero termina la oleada en curso
  b.lull = { n: b.given, t: 0, ready: false };
  b.given++;
  showBanner('¡Despeja la zona!', '#ffe08a', 'Acaba con los que quedan: la batalla termina y llega tu recompensa');
  SFX.play('legend');
};
function lullReward(b) {
  b.lull.ready = true;
  b.given = b.lull.n; // el original vuelve a contar este umbral
  if (b.lull.n === 1) { b.given++; spawnDoors(); } else _spawnAltar();
  showBanner('Batalla superada', '#7cff8a', b.lull.n === 1 ? 'Elige una puerta: acércate y pulsa el botón' : 'Un dios te espera: acércate a su altar');
}
const _spawnPackW = spawnPack;
spawnPack = function () {
  const b = scene === 'rift' && rift && rift.bn;
  if (b && b.lull) return;
  return _spawnPackW();
};

// ============================================================
// Mercancía del campamento (después del Guardián): cosas que valen fuera de la Grieta
// ============================================================
Object.assign(WARES, {
  cofre: { name: 'Cofre del Heraldo', icon: '🎁', d: 'Una pieza <b>épica o legendaria</b> de tu nivel.', k: 22, ok: () => true,
    buy: () => dropPickup(P.x + 26, P.y + 8, 'item', { item: makeItem(S.cls, itemLevel() + 2, Math.max(2, rift.D.rar[1])) }) },
  mineral: { name: 'Saco de mineral', icon: '⛏', d: '<b>Fragmentos de mineral</b> para refinar en la herrería de Tobías.', k: 12, ok: () => true,
    buy: () => { const n = 4 + Math.floor(rift.level / 4); S.frag = (S.frag || 0) + n; addText(P.x, P.y - 70, '+' + n + ' fragmentos', '#9fd0ff', 1.1); } },
  favor: { name: 'Favor de los Doce', icon: '✦', d: 'Empiezas la próxima Grieta con una <b>bendición rara o mejor</b>.', k: 16, ok: () => !S.carryFavor,
    buy: () => { S.carryFavor = 1; } },
  tomo: { name: 'Tomo del runista', icon: '📖', d: 'Mucha <b>experiencia</b> de golpe.', k: 14, ok: () => true,
    buy: () => gainXp(Math.round(xpNext(S.level) * 0.35)) },
  sello: { name: 'Sello de Gesta', icon: '🏅', d: '<b>+1 Sello de Gesta</b> para el Tablón.', k: 40, ok: () => true, buy: () => gainSeals(1, 'la mercader') },
});
WARES.pocion.d = 'Una <b>poción</b> más para tu bolsa (se guarda para las siguientes Grietas).';
const CAMP_WARES = ['cofre', 'favor', 'tomo', 'sello', 'pocion'];

function setUpCamp() {
  const b = bst(), z = rift.zaap;
  if (!b || !z || rift.camp) return;
  rift.camp = { leaving: false };
  const spot = (dx, dy) => {
    const x = clamp(z.x + dx, 80, WORLD.w - 80), y = clamp(z.y + dy, 80, WORLD.h - 80);
    for (const o of obstacles) if (dist(o.x, o.y, x, y) < o.r + 50) o.gone = true;
    obstacles = obstacles.filter((o) => !o.gone);
    return { x, y };
  };
  const m = spot(-150, 40);
  b.merchant = { x: m.x, y: m.y, stock: CAMP_WARES.slice().sort(() => Math.random() - 0.5).slice(0, 4), sold: {}, camp: true };
  const a = spot(150, 40);
  const god = pick(Object.keys(GODS).filter((g) => g !== b.lastGod));
  b.altars.push({ x: a.x, y: a.y, god, t: 0, carry: true });
  later(1.6, () => showBanner('Campamento', '#ffcf7a', 'La mercader y una Ofrenda de los Doce te esperan junto al Portal'));
}
const _guardianDefeatedC = guardianDefeated;
guardianDefeated = function (e) {
  _guardianDefeatedC(e);
  if (bst()) later(1.4, setUpCamp); // el Portal aparece a los 1,2 s
};

// ofrenda: la bendición elegida se guarda para la próxima Grieta
const _openBoonPickC = openBoonPick;
let favorMin = 0;
const _rollRarityC = rollRarity;
rollRarity = function () { return Math.max(favorMin, _rollRarityC()); };
openBoonPick = function (al) {
  favorMin = al.minR || 0;
  _openBoonPickC(al);
  favorMin = 0;
  if (al.carry) {
    const sm = document.querySelector('#boonPick .bp-head small');
    if (sm) sm.innerHTML = '<span style="color:#ffe08a;font-weight:800">Ofrenda</span> · esta bendición te acompañará en tu próxima Grieta';
  }
};
const _chooseBoonC = chooseBoon;
chooseBoon = function (k) {
  const off = boonOffer;
  if (!off || !off.al.carry) return _chooseBoonC(k);
  const o = off.opts[k];
  S.carryBoon = { id: o.id, r: o.r };
  bst().altars = bst().altars.filter((a) => a !== off.al);
  $('boonPick').classList.remove('show');
  state = off.prev === 'boon' ? 'play' : off.prev;
  boonOffer = null;
  persist();
  sparks(P.x, P.y - 20, 20, GODS[BOONS[o.id].god].color, 360);
  SFX.play('click');
  showBanner(BOONS[o.id].name, GODS[BOONS[o.id].god].color, 'Te acompañará al entrar en tu próxima Grieta');
};

// en el campamento la mercader vende cosas para después de la Grieta
const _openMerchantC = openMerchant;
openMerchant = function () {
  _openMerchantC();
  const m = bst().merchant, sm = document.querySelector('#choicePick .bp-head small');
  if (m && m.camp && sm) sm.textContent = 'Campamento · mercancía que te llevas a casa';
};

// al empezar una Grieta: bendición guardada y Favor de los Doce
const _startNodeC = startNode;
startNode = function (bi, n, d) {
  _startNodeC(bi, n, d);
  const b = bst();
  if (!b || rift.isDungeon) return;
  const cb = S.carryBoon;
  if (cb && BOONS[cb.id]) {
    const B = BOONS[cb.id], slotted = B.slot !== 'pas' && B.slot !== 'duo';
    b.owned[cb.id] = { r: cb.r, lvl: 1 };
    if (slotted) b.slots[B.slot] = cb.id;
    delete S.carryBoon;
    later(0.6, () => { recalc(); buildBoonBar(); });
    later(1.2, () => showBanner('Ofrenda: ' + B.name, GODS[B.god].color, GODS[B.god].name + ' camina contigo en esta Grieta'));
  }
  if (S.carryFavor) {
    delete S.carryFavor;
    later(3.2, () => {
      if (!rift || !bst()) return;
      const al = { x: clamp(P.x + 110, 80, WORLD.w - 80), y: P.y, god: pick(Object.keys(GODS)), t: 0, minR: 1 };
      bst().altars.push(al);
      showBanner('Favor de los Doce', '#ffe08a', 'Un altar te espera junto a ti');
    });
  }
};

// ============================================================
// Botón de interacción
// ============================================================
document.body.insertAdjacentHTML('beforeend', '<button id="riftAct" class="hub-prompt rift-act" type="button"></button>');
let actTarget = null;
function findInteract() {
  const b = bst();
  if (!b || !P) return null;
  let best = null, bd = 80;
  const near = (x, y, o) => { const d = dist(P.x, P.y, x, y); if (d < bd) { bd = d; best = o; } };
  for (const al of b.altars) near(al.x, al.y, { kind: 'altar', al });
  for (const d of b.doors) near(d.x, d.y - 20, { kind: 'door', d });
  if (b.merchant) near(b.merchant.x, b.merchant.y, { kind: 'merchant' });
  if (rift.zaap && rift.camp) near(rift.zaap.x, rift.zaap.y - 10, { kind: 'portal' });
  return best;
}
function actLabel(t) {
  if (t.kind === 'altar') { const G = GODS[t.al.god]; return t.al.carry ? `✦ Ofrenda de ${G.name}` : `✦ Bendición de ${G.name}`; }
  if (t.kind === 'door') return t.d.god ? `✦ Cruzar: bendición de ${GODS[t.d.god].name}` : `${REWARDS[t.d.kind].icon} Cruzar: ${REWARDS[t.d.kind].name}`;
  if (t.kind === 'merchant') return '🪙 Comerciar con la mercader';
  return '🌀 Cruzar el Portal';
}
function doInteract() {
  const t = actTarget;
  if (!t || state !== 'play') return;
  SFX.play('click');
  if (t.kind === 'altar') { if (t.al.carry) openBoonPick(t.al); else touchAltar(t.al); }
  else if (t.kind === 'door') takeDoor(t.d);
  else if (t.kind === 'merchant') openMerchant();
  else leaveRift();
}
// «click» y no «pointerdown»: si el panel se abriera al apoyar el dedo, el click de levantarlo
// caería sobre la tarjeta que aparece debajo (compra o cierre sin querer en Android)
$('riftAct').addEventListener('pointerdown', (ev) => ev.stopPropagation());
$('riftAct').addEventListener('click', (ev) => { ev.stopPropagation(); doInteract(); });
// por si acaso: los paneles ignoran toques durante 0,35 s tras abrirse
const PANEL_T = {};
for (const id of ['choicePick', 'boonPick']) {
  new MutationObserver(() => { if ($(id).classList.contains('show')) PANEL_T[id] = performance.now(); }).observe($(id), { attributes: true, attributeFilter: ['class'] });
  $(id).addEventListener('click', (ev) => { if (performance.now() - (PANEL_T[id] || 0) < 350) { ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
}
window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if ((k === 'e' || k === 'enter') && state === 'play' && actTarget) doInteract(); });

const _boonUpdateC = boonUpdate;
boonUpdate = function (dt) {
  _boonUpdateC(dt);
  const b = bst();
  if (!b) return;
  // oleada: sin refuerzos; el reloj se detiene mientras despejas
  if (b.lull) {
    b.lull.t += dt;
    if (!rift.bossDead) rift.time += dt;
    if (rift.bossSpawned && !b.lull.ready) b.lull = null; // el Guardián manda
    else if (!b.lull.ready) {
      const foes = aliveFoes();
      if (b.lull.t > 22 && foes.length <= 3) for (const e of foes) if (!e.boss) { e.dead = true; poof(e.x, e.y); }
      if (!aliveFoes().length) lullReward(b);
    } else if (!b.altars.some((a) => !a.carry && !a.minR) && !b.doors.length && state === 'play') {
      b.lull = null;
      later(0.8, () => showBanner('¡Nueva oleada!', '#ff8a65', 'Las Grietas vuelven a escupir monstruos'));
    }
  }
};
// el Portal del final no se cruza solo: hay que pulsar el botón
const _finishRiftC = finishRift;
finishRift = function () {
  if (rift && rift.camp && !rift.camp.leaving) return;
  return _finishRiftC();
};

function frameAct() {
  const el = $('riftAct');
  const on = scene === 'rift' && state === 'play' && rift && rift.bn;
  actTarget = on ? findInteract() : null;
  if (actTarget) {
    const lb = actLabel(actTarget);
    if (el.textContent !== lb) el.textContent = lb;
    el.classList.add('show');
  } else el.classList.remove('show');
  requestAnimationFrame(frameAct);
}
requestAnimationFrame(frameAct);

// marcador «quedan N» mientras se despeja la zona
const _drawHUDC = drawHUD;
drawHUD = function () {
  _drawHUDC();
  const b = scene === 'rift' && rift && rift.bn;
  if (b && b.lull && !b.lull.ready) {
    const n = aliveFoes().length, s = ui;
    text(`Despeja la zona · quedan ${n}`, W / 2, 26 * s, 13 * s, '#ffe08a', 'center', 900);
  }
};

// ============================================================
// Salida: escena breve al cruzar el Portal
// ============================================================
const END_TALK = [
  [['ivo', 'Huelo a ceniza desde aquí. Buen trabajo, {hero}. Vuelve: el ámbar no se gasta solo.']],
  [['brunilda', 'Si traes ranas, que no sea vivas. Pásate por mi puesto, que hoy tengo género nuevo.']],
  [['tobias', 'Esa arma llora, chaval. Tráemela a la fragua y la dejo cantando.']],
  [['ivo', 'Cada Grieta que cierras me da un día más. Mis mejoras te esperan en el puesto.']],
  [['voz', 'Qué entretenido… sigue cerrando puertas, lucecita. Yo sigo abriendo otras.']],
  [['ivo', 'Los Doce te observan con más interés cada vez. Eso es bueno… casi siempre.']],
  [['tobias', 'Si me traes ámbar te subo el arma un punto. O dos, si me pillas de buenas.']],
  [['brunilda', '¿Ámbar en los bolsillos? Qué casualidad: a mí me encanta el ámbar.']],
];
function leaveRift() {
  if (!rift || !rift.camp || rift.camp.leaving) return;
  rift.camp.leaving = true;
  const seen = (S.story && S.story.seen) || {};
  const first = !rift.isDungeon && !seen.tip_back;
  let lines = END_TALK[(rift.b * 3 + rift.n + (S.rifts || 0)) % END_TALK.length];
  if (first) { seen.tip_back = 1; lines = [['ivo', '¡Has vuelto entero! Con el ámbar que traes puedes mejorar en la villa: yo vendo mejoras permanentes, Tobías refina tu arma y el Tablón tiene misiones.']]; }
  if (typeof playDialog === 'function') playDialog(lines, { onEnd: () => { if (state === 'play') finishRift(); } });
  else finishRift();
}

// ============================================================
// De vuelta en Villa Candela: dónde gastar lo ganado
// ============================================================
document.body.insertAdjacentHTML('beforeend', `<div id="backTips" class="back-tips">
  <div class="bt-head"><b>¿Qué mejoro?</b><span id="btAmber"></span><button class="bt-x" aria-label="Cerrar">✕</button></div>
  <button data-go="ivo"><i>⚗</i><span><b>Maese Ivo</b><small>Mejoras permanentes y Pactos</small></span></button>
  <button data-go="smith"><i>⚒</i><span><b>Tobías</b><small>Refinar y ascender tu arma</small></span></button>
  <button data-go="board"><i>📜</i><span><b>Tablón</b><small>Misiones y Gesta</small></span></button>
</div>`);
const hideTips = () => $('backTips').classList.remove('show');
$('backTips').addEventListener('click', (ev) => {
  const g = ev.target.closest('[data-go]');
  if (ev.target.closest('.bt-x')) { hideTips(); return; }
  if (!g || state !== 'hub') return;
  hideTips();
  if (g.dataset.go === 'ivo') { openShop('alchemist'); shopTab = 'upgrade'; buildShop(); }
  else if (g.dataset.go === 'smith') openShop('smith');
  else openQuests();
});
const _finishRiftT = finishRift;
finishRift = function () {
  const was = state;
  _finishRiftT();
  if (was === 'play' && state === 'end' && !rift.isDungeon) S.backTips = 1;
};
const _goHubC = goHub;
goHub = function () {
  _goHubC();
  hideTips();
  if (!S || !S.backTips) return;
  delete S.backTips;
  const show = () => {
    if (state !== 'hub') return;
    if (typeof dlg !== 'undefined' && dlg) { setTimeout(show, 800); return; }
    $('btAmber').innerHTML = `${AMBER_SVG} ${fmtNum(S.kamas)}`;
    $('backTips').classList.add('show');
    setTimeout(hideTips, 14000);
  };
  setTimeout(show, 1500);
};

// ============================================================
// Puertas de recompensa: arco rúnico con portal y medallón
// ============================================================
drawDecals = (function (prev) {
  return function () {
    const b = scene === 'rift' && bst(), doors = b ? b.doors : null;
    if (doors) b.doors = []; // la versión anterior no las dibuja
    prev();
    if (!doors) return;
    b.doors = doors;
    for (const d of doors) drawRewardDoor(d);
  };
})(drawDecals);
// la puerta de bendición ya sabe qué dios espera detrás (se ve su retrato)
const godImg = (g) => GOD_IMG[g]; // retratos ya cargados en boons.js
const _spawnDoorsC = spawnDoors;
spawnDoors = function () {
  _spawnDoorsC();
  const b = bst();
  for (const d of b.doors) if (d.kind === 'dios') { d.god = pick(Object.keys(GODS).filter((g) => g !== b.lastGod)); }
};
const _takeDoorC = takeDoor;
takeDoor = function (d) {
  if (d.kind !== 'dios' || !d.god) return _takeDoorC(d);
  const b = bst();
  b.doors = [];
  rings.push({ x: d.x, y: d.y, r0: 10, r1: 120, life: 0.4, max: 0.4, color: `rgba(${GODS[d.god].rgb},` });
  SFX.play('zaap');
  const al = { x: d.x, y: d.y, god: d.god, t: 0 };
  b.lastGod = al.god; b.altars.push(al);
  touchAltar(al);
};
function drawRewardDoor(d) {
  const R = REWARDS[d.kind], G = d.god && GODS[d.god], rgb = G ? G.rgb : R.rgb, t = now + d.x * 0.01, near = actTarget && actTarget.d === d;
  ctx.save(); ctx.translate(d.x, d.y);
  // círculo rúnico en el suelo
  ctx.save(); ctx.scale(1, 0.42);
  ctx.strokeStyle = `rgba(${rgb},${near ? 0.9 : 0.55})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.stroke();
  ctx.rotate(t * 0.6);
  ctx.fillStyle = `rgba(${rgb},0.85)`;
  for (let k = 0; k < 10; k++) { ctx.rotate(TAU / 10); ctx.fillRect(-2, -55, 4, 8); }
  ctx.restore();
  glow(0, -50, near ? 100 : 80, rgb, near ? 0.5 : 0.32);
  // pilares de piedra
  const stone = (x) => {
    const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0); g.addColorStop(0, '#4a4458'); g.addColorStop(0.5, '#6e6880'); g.addColorStop(1, '#38334a');
    ctx.fillStyle = g; ctx.fillRect(x - 9, -86, 18, 86);
    ctx.fillStyle = '#2a2638'; ctx.fillRect(x - 12, -8, 24, 8); ctx.fillRect(x - 11, -92, 22, 7);
    ctx.fillStyle = `rgba(${rgb},${0.55 + Math.sin(t * 3 + x) * 0.3})`;
    for (let k = 0; k < 4; k++) ctx.fillRect(x - 2, -76 + k * 17, 4, 7);
  };
  // portal (relleno arremolinado)
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-26, -78); ctx.arc(0, -78, 26, Math.PI, 0); ctx.lineTo(26, 0); ctx.closePath(); ctx.clip();
  const pg = ctx.createRadialGradient(0, -60, 4, 0, -60, 70); pg.addColorStop(0, `rgba(${rgb},0.95)`); pg.addColorStop(0.45, `rgba(${rgb},0.55)`); pg.addColorStop(1, 'rgba(20,14,40,0.95)');
  ctx.fillStyle = pg; ctx.fillRect(-30, -110, 60, 112);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, -56, 8 + k * 9, t * (2 + k) , t * (2 + k) + 2.2); ctx.stroke(); }
  ctx.restore();
  stone(-31); stone(31);
  // arco superior con clave
  ctx.strokeStyle = '#5a5470'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, -84, 31, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = `rgba(${rgb},0.8)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -84, 31, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#7a7290'; ctx.beginPath(); ctx.moveTo(-8, -122); ctx.lineTo(8, -122); ctx.lineTo(5, -108); ctx.lineTo(-5, -108); ctx.closePath(); ctx.fill();
  // medallón flotante con el icono
  const by = -150 + Math.sin(t * 2.4) * 4;
  const gi = G && godImg(d.god);
  circle(0, by, G ? 24 : 19, 'rgba(14,10,28,0.92)', `rgb(${rgb})`, 3);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (gi && gi.complete && gi.naturalWidth) {
    ctx.save(); ctx.beginPath(); ctx.arc(0, by, 21, 0, TAU); ctx.clip();
    const sw = gi.naturalWidth * 0.62; ctx.drawImage(gi, (gi.naturalWidth - sw) / 2, gi.naturalHeight * 0.06, sw, sw, -21, by - 21, 42, 42);
    ctx.restore();
  } else { ctx.font = '20px serif'; ctx.fillStyle = '#fff'; ctx.fillText(d.kind === 'dios' ? '✨' : R.icon, 0, by + 1); }
  // placa con el nombre
  const label = G ? G.name : R.name;
  ctx.font = '900 12px Cinzel, serif';
  const tw = ctx.measureText(label).width + 18;
  ctx.fillStyle = 'rgba(14,10,28,0.85)'; ctx.fillRect(-tw / 2, 8, tw, 18);
  ctx.strokeStyle = `rgba(${rgb},0.9)`; ctx.lineWidth = 1.5; ctx.strokeRect(-tw / 2, 8, tw, 18);
  ctx.fillStyle = '#fff6dc'; ctx.fillText(label, 0, 18);
  if (near) { ctx.font = '700 10px Garamond, Georgia, serif'; ctx.fillStyle = `rgb(${rgb})`; ctx.fillText(G ? G.title + ' · bendición' : R.d, 0, 36); }
  ctx.restore();
}

// los botones de fin de Grieta se enlazaron al goHub original (antes de los añadidos de historia y campamento)
for (const id of ['btnEndHub', 'btnDeadHub']) { $(id).removeEventListener('click', _goHub); $(id).addEventListener('click', () => goHub()); }
