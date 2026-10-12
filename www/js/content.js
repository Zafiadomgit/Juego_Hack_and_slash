/* Fendaria — contenido extra: habilidades definitivas, misiones diarias y eventos de Grieta. */
'use strict';

// ============================================================
// Habilidad definitiva: se carga matando monstruos (100 = lista)
// ============================================================
const ULTIMATES = {
  iop: { name: 'Torbellino de Acero', icon: '🌀', desc: 'Gira con el hacha durante unos segundos golpeando todo a tu alrededor' },
  cra: { name: 'Lluvia de Halcones', icon: '🦅', desc: 'Tres oleadas de flechas en todas direcciones y halcones que caen sobre los enemigos cercanos' },
  feca: { name: 'Gran Runa Ancestral', icon: '✴', desc: 'Una runa enorme que quema y frena a los enemigos, y un escudo que absorbe la mitad de tu vida' },
};
const ULT_GAIN = { normal: 2.5, elite: 12, boss: 30 };

function gainUlt(n) {
  if (!P) return;
  const was = P.ult >= 100;
  P.ult = Math.min(100, (P.ult || 0) + n);
  if (!was && P.ult >= 100) { addText(P.x, P.y - 58, '¡Definitiva lista!', '#ffe08a', 1.1); SFX.play('shield'); }
}

function useUltimate() {
  if (!P || P.ult < 100 || P.lock > 0 || P.jump || P.cast) return;
  P.ult = 0;
  trackDaily('ult', 1);
  const cls = P.cls;
  shake(10); zoomPunch = Math.max(zoomPunch, 0.06); SFX.play('legend');
  hitFlash(P.x, P.y - 20, 60, '255,230,160');
  showBanner(ULTIMATES[cls].name, '#ffe08a');
  if (cls === 'iop') {
    P.spinT = 2.4; P.spinTick = 0; P.invul = Math.max(P.invul, 0.4);
  } else if (cls === 'cra') {
    for (let w = 0; w < 3; w++) {
      later(w * 0.35, () => {
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU + w * 0.17;
          projectiles.push({ team: 'p', kind: 'arrow', x: P.x, y: P.y - 8, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, r: 7, dmg: skillDmg(1.5), life: 0.8, pierce: 2, kb: 160, hit: [] });
        }
        SFX.play('shoot');
      });
    }
    const near = enemies.filter((e) => !e.dead && dist(e.x, e.y, P.x, P.y) < 420).slice(0, 8);
    near.forEach((e, i) => later(0.5 + i * 0.1, () => {
      if (e.dead) return;
      for (let k = 0; k < 4; k++) particles.push({ kind: 'fallArrow', x: e.x + rand(-14, 14), y: e.y + rand(-6, 6), vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#fff', size: 2, grav: 0 });
      aoe(e.x, e.y, 70, skillDmg(2.2), 120, true);
      hitFlash(e.x, e.y - 12, 26, '255,220,150');
    }));
  } else {
    glyphs.push({ x: P.x, y: P.y, r: 230, life: 5, max: 5, tick: 0, mul: 1.6 });
    addDecal('rune', P.x, P.y, 235, 5, '120,200,255');
    P.shield = Math.max(P.shield, Math.round(P.maxHp * 0.5)); P.shieldT = 8;
    rings.push({ x: P.x, y: P.y, r0: 20, r1: 240, life: 0.5, max: 0.5, color: 'rgba(140,210,255,' });
  }
}

// Torbellino del Rompeyelmos: golpes en círculo mientras dura
function updateUltimates(dt) {
  if (!P || !(P.spinT > 0)) return;
  P.spinT -= dt; P.spinTick -= dt;
  P.dir += dt * 18;
  if (P.spinTick <= 0) {
    P.spinTick = 0.18;
    meleeArc(P.x, P.y, P.dir, 130, Math.PI, skillDmg(1.3), 40, false);
    slashes.push({ x: P.x, y: P.y, dir: P.dir, arc: 3.6, range: 130, life: 0.2, max: 0.2, color: weaponFxColor(), side: 1, width: 30, follow: true });
    SFX.play('swing');
  }
}

// ============================================================
// Misiones diarias (3 al día, se renuevan a medianoche)
// ============================================================
const DAILY_POOL = [
  { id: 'kill', text: (g) => `Derrota ${g} monstruos`, goals: [80, 150, 250], reward: (g) => ({ amber: g * 2 }) },
  { id: 'elite', text: (g) => `Derrota ${g} élites`, goals: [4, 8, 12], reward: (g) => ({ amber: g * 40 }) },
  { id: 'boss', text: (g) => `Vence a ${g} Guardián${g > 1 ? 'es' : ''}`, goals: [1, 2, 3], reward: (g) => ({ amber: g * 120, elixir: true }) },
  { id: 'rift', text: (g) => `Cierra ${g} Grieta${g > 1 ? 's' : ''}`, goals: [2, 3, 4], reward: (g) => ({ amber: g * 90 }) },
  { id: 'hard', text: (g) => `Cierra ${g} Grieta${g > 1 ? 's' : ''} en Medio o Difícil`, goals: [1, 2], reward: (g) => ({ amber: g * 200, elixir: true }) },
  { id: 'amber', text: (g) => `Recoge ${g} de ámbar`, goals: [400, 900, 1600], reward: (g) => ({ amber: Math.round(g * 0.25) }) },
  { id: 'ult', text: (g) => `Usa tu definitiva ${g} veces`, goals: [2, 4], reward: (g) => ({ amber: g * 60 }) },
  { id: 'event', text: (g) => `Completa ${g} evento${g > 1 ? 's' : ''} de Grieta`, goals: [1, 2, 3], reward: (g) => ({ amber: g * 100 }) },
];
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

function ensureDaily() {
  if (!S) return null;
  const day = todayKey();
  if (S.daily && S.daily.day === day) return S.daily;
  // 3 misiones distintas, elegidas con la fecha como semilla
  let seed = [...day].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) & 0x7fffffff;
  const r = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const pool = DAILY_POOL.slice(), list = [];
  while (list.length < 3) {
    const q = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const goal = q.goals[Math.min(q.goals.length - 1, Math.floor(r() * q.goals.length))];
    list.push({ id: q.id, goal, prog: 0, claimed: false });
  }
  S.daily = { day, list };
  return S.daily;
}
function trackDaily(id, n = 1) {
  const d = ensureDaily();
  if (!d) return;
  for (const q of d.list) {
    if (q.id !== id || q.prog >= q.goal) continue;
    q.prog = Math.min(q.goal, q.prog + n);
    if (q.prog >= q.goal && state === 'play') { subBanner = { text: '✔ Misión cumplida: ' + DAILY_POOL.find((x) => x.id === id).text(q.goal), t: 3, max: 3 }; SFX.play('loot'); }
  }
}
const dailyReady = () => { const d = ensureDaily(); return d ? d.list.filter((q) => q.prog >= q.goal && !q.claimed).length : 0; };

function openQuests() {
  state = 'quests';
  buildQuests();
  showOverlay('quests');
  SFX.play('click');
}
function closeQuests() { persist(); state = 'hub'; buildHub(); showOverlay('hub'); }
function buildQuests() {
  const d = ensureDaily();
  $('questList').innerHTML = d.list.map((q, i) => {
    const def = DAILY_POOL.find((x) => x.id === q.id), rw = def.reward(q.goal), done = q.prog >= q.goal;
    return `<div class="quest ${q.claimed ? 'claimed' : done ? 'done' : ''}">
      <div class="q-txt"><b>${def.text(q.goal)}</b><span>Recompensa: ${AMBER_SVG} ${rw.amber}${rw.elixir ? ' + un elixir al azar' : ''}</span>
        <div class="q-bar"><i style="width:${(q.prog / q.goal) * 100}%"></i></div><small>${fmtNum(q.prog)} / ${fmtNum(q.goal)}</small></div>
      <button class="btn" data-q="${i}" ${done && !q.claimed ? '' : 'disabled'}>${q.claimed ? '✔ Cobrada' : done ? 'Reclamar' : 'En curso'}</button></div>`;
  }).join('');
  $('questAmber').innerHTML = AMBER_SVG + ' ' + fmtNum(S.kamas);
  const h = new Date(); const left = 24 - h.getHours();
  $('questNote').textContent = `Nuevas misiones en ${left} h. Las misiones avanzan con cualquier héroe que juegues hoy... ¡pero cada héroe tiene las suyas!`;
}
function claimQuest(i) {
  const d = ensureDaily(), q = d.list[i];
  if (!q || q.claimed || q.prog < q.goal) return;
  const rw = DAILY_POOL.find((x) => x.id === q.id).reward(q.goal);
  q.claimed = true;
  S.kamas += rw.amber;
  if (rw.elixir) { const k = pick(Object.keys(ELIXIRS)); S.boosts[k] = (S.boosts[k] || 0) + 1; showToast('questToast', `+${rw.amber} ámbar y ${ELIXIRS[k].name}`); }
  else showToast('questToast', `+${rw.amber} ámbar`);
  SFX.play('legend');
  persist();
  buildQuests();
}

// ============================================================
// Eventos de Grieta: cofre, lluvia de ámbar, emboscada de élites y altar de poder
// ============================================================
const RIFT_EVENTS = {
  chest: { name: 'Cofre del Tesoro', desc: 'Un cofre ha aparecido en la Grieta. ¡Encuéntralo!', color: '#ffd54f' },
  rain: { name: 'Lluvia de Ámbar', desc: '¡Recoge todo el ámbar que puedas!', color: '#ffb040' },
  ambush: { name: 'Emboscada', desc: 'Élites te rodean. Derrótalos a todos para una recompensa', color: '#ff5a3d' },
  altar: { name: 'Altar de Poder', desc: 'Toca el altar para ganar poder durante 30 s', color: '#7fd4ff' },
};
let riftEvent = null;

function resetRiftEvents() { riftEvent = null; if (rift) rift.eventT = rand(35, 60); }
function startRiftEvent(force) {
  const kind = force || pick(Object.keys(RIFT_EVENTS)), E = RIFT_EVENTS[kind];
  const pos = spawnPos();
  riftEvent = { kind, t: 0, x: pos.x, y: pos.y, done: false };
  if (kind === 'rain') riftEvent.dur = 10;
  if (kind === 'ambush') {
    riftEvent.mobs = [];
    for (let i = 0; i < 3 + Math.floor(rift.threat / 3); i++) {
      const a = (i / 4) * TAU, m = spawnEnemy(pick(Object.keys(rift.biome.weights)), P.x + Math.cos(a) * 260, P.y + Math.sin(a) * 260, { elite: true });
      poof(m.x, m.y); riftEvent.mobs.push(m);
    }
  }
  showBanner(E.name, E.color, E.desc);
  SFX.play('zaap');
}
function finishRiftEvent(success) {
  if (!riftEvent || riftEvent.done) return;
  riftEvent.done = true;
  if (success) { trackDaily('event', 1); rift.events = (rift.events || 0) + 1; }
  later(1.5, () => { riftEvent = null; });
}

function updateRiftEvents(dt) {
  if (!rift || rift.bossSpawned || rift.isSuper) return;
  if (!riftEvent) {
    rift.eventT -= dt;
    if (rift.eventT <= 0) { rift.eventT = rand(55, 85); startRiftEvent(); }
    return;
  }
  const ev = riftEvent;
  ev.t += dt;
  if (ev.done) return;
  if (ev.kind === 'chest' && dist(P.x, P.y, ev.x, ev.y) < 40) {
    const nK = Math.round((40 + rift.level * 12) * rift.D.reward);
    for (let i = 0; i < 8; i++) dropPickup(ev.x, ev.y, 'kama', { val: Math.round(nK / 8) });
    dropPickup(ev.x, ev.y, 'item', { item: makeItem(S.cls, itemLevel() + 1, rollDiffRarity(rift.D, 0.35)) });
    if (Math.random() < rift.D.set * 0.5) dropPickup(ev.x, ev.y, 'item', { item: makeSetItem(S.cls, itemLevel(), rift.biome.id) });
    hitFlash(ev.x, ev.y - 14, 40, '255,220,120'); embers(ev.x, ev.y, 18, '255,210,100', 20); SFX.play('legend');
    finishRiftEvent(true);
  } else if (ev.kind === 'chest' && ev.t > 45) finishRiftEvent(false);
  if (ev.kind === 'rain') {
    if (Math.random() < dt * 9) { const a = rand(0, TAU), r = rand(30, 260); dropPickup(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, 'kama', { val: Math.max(1, Math.round((2 + rift.level) * rift.D.reward)) }); }
    if (ev.t > ev.dur) finishRiftEvent(true);
  }
  if (ev.kind === 'ambush' && ev.mobs.every((m) => m.dead)) {
    const bonus = Math.round((60 + rift.level * 20) * rift.D.reward);
    S.kamas += bonus; subBanner = { text: `Emboscada superada · +${bonus} ámbar`, t: 2.5, max: 2.5 }; SFX.play('coin');
    finishRiftEvent(true);
  }
  if (ev.kind === 'altar') {
    if (!ev.used && dist(P.x, P.y, ev.x, ev.y) < 42) {
      ev.used = true; P.altarT = 30; recalc();
      hitFlash(ev.x, ev.y - 30, 50, '140,210,255'); rings.push({ x: ev.x, y: ev.y, r0: 10, r1: 160, life: 0.5, max: 0.5, color: 'rgba(140,210,255,' });
      showBanner('¡Poder del altar!', '#7fd4ff', '+50% daño y más velocidad durante 30 s'); SFX.play('level');
      finishRiftEvent(true);
    } else if (!ev.used && ev.t > 45) finishRiftEvent(false);
  }
}
// el efecto del altar se acaba
function updateAltarBuff(dt) {
  if (!P || !(P.altarT > 0)) return;
  P.altarT -= dt;
  if (Math.random() < 0.3) particles.push({ kind: 'glowdot', x: P.x + rand(-10, 10), y: P.y - rand(0, 40), vx: 0, vy: -40, life: 0.6, max: 0.6, rgb: '140,210,255', size: 4, grav: 0 });
  if (P.altarT <= 0) { recalc(); addText(P.x, P.y - 50, 'El poder del altar se desvanece', '#9fd3ff', 0.8); }
}

function drawRiftEvents() {
  const ev = riftEvent;
  if (!ev || ev.done && ev.kind !== 'altar') return;
  if (ev.kind === 'chest') {
    const bob = Math.sin(now * 3) * 2;
    glow(ev.x, ev.y - 14, 60, '255,210,100', 0.5 + Math.sin(now * 4) * 0.15);
    shadow(ev.x, ev.y + 1, 18);
    ctx.save(); ctx.translate(ev.x, ev.y - bob);
    sprite('chest', 44, 40, 22, 36, (g) => {
      g.fillStyle = '#5a3418'; g.fillRect(-18, -22, 36, 20);
      g.fillStyle = '#7a4a24'; g.beginPath(); g.moveTo(-18, -22); g.quadraticCurveTo(0, -36, 18, -22); g.closePath(); g.fill();
      g.fillStyle = '#e8b64c'; g.fillRect(-18, -24, 36, 3); g.fillRect(-18, -10, 36, 2); g.fillRect(-3, -26, 6, 10);
      g.fillStyle = '#fff3c4'; g.fillRect(-1, -22, 2, 3);
    });
    ctx.restore();
  } else if (ev.kind === 'altar') {
    const lit = !ev.used;
    glow(ev.x, ev.y - 34, 70, '120,200,255', lit ? 0.6 + Math.sin(now * 3) * 0.2 : 0.15);
    shadow(ev.x, ev.y + 1, 24);
    ctx.save(); ctx.translate(ev.x, ev.y);
    sprite('altar|' + (lit ? 1 : 0), 64, 80, 32, 76, (g) => {
      g.fillStyle = '#5e564c'; g.fillRect(-26, -12, 52, 12);
      g.fillStyle = '#857a6c'; g.fillRect(-20, -46, 40, 34);
      g.fillStyle = '#9a9080'; g.fillRect(-24, -50, 48, 6);
      g.fillStyle = lit ? '#7fd4ff' : '#4a5a68';
      g.beginPath(); g.moveTo(0, -74); g.lineTo(10, -58); g.lineTo(0, -50); g.lineTo(-10, -58); g.closePath(); g.fill();
      g.strokeStyle = lit ? '#bfe8ff' : '#5a6a78'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-10, -40); g.lineTo(-4, -30); g.lineTo(-10, -20); g.moveTo(6, -40); g.lineTo(6, -20); g.stroke();
    });
    ctx.restore();
  }
}
