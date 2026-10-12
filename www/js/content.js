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
  P.ult = Math.min(100, (P.ult || 0) + n * (transRank() >= 3 ? 1.3 : 1));
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
  if (CLASS_KIT[cls]) CLASS_KIT[cls].ult();
  else if (cls === 'iop') {
    P.spinT = 2.4; P.spinTick = 0; P.invul = Math.max(P.invul, 0.4);
  } else if (cls === 'cra') {
    for (let w = 0; w < 3; w++) {
      later(w * 0.35, () => {
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU + w * 0.17;
          projectiles.push({ team: 'p', kind: 'arrow', x: P.x, y: P.y - 8, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, r: 7, dmg: skillDmg(1.5 * ultMul()), life: 0.8, pierce: 2, kb: 160, hit: [] });
        }
        SFX.play('shoot');
      });
    }
    const near = enemies.filter((e) => !e.dead && dist(e.x, e.y, P.x, P.y) < 420).slice(0, 8);
    near.forEach((e, i) => later(0.5 + i * 0.1, () => {
      if (e.dead) return;
      for (let k = 0; k < 4; k++) particles.push({ kind: 'fallArrow', x: e.x + rand(-14, 14), y: e.y + rand(-6, 6), vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#fff', size: 2, grav: 0 });
      aoe(e.x, e.y, 70, skillDmg(2.2 * ultMul()), 120, true);
      hitFlash(e.x, e.y - 12, 26, '255,220,150');
    }));
  } else {
    glyphs.push({ x: P.x, y: P.y, r: 230, life: 5, max: 5, tick: 0, mul: 1.6 * ultMul() });
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
    meleeArc(P.x, P.y, P.dir, 130, Math.PI, skillDmg(1.3 * ultMul()), 40, false);
    slashes.push({ x: P.x, y: P.y, dir: P.dir, arc: 3.6, range: 130, life: 0.2, max: 0.2, color: weaponFxColor(), side: 1, width: 30, follow: true });
    SFX.play('swing');
  }
}

// ============================================================
// Misiones diarias (3 al día, se renuevan a medianoche)
// ============================================================
const DAILY_POOL = [
  { id: 'kill', text: (g) => `Derrota ${g} monstruos`, goals: [80, 150, 250], seals: [3, 5, 7] },
  { id: 'elite', text: (g) => `Derrota ${g} élites`, goals: [4, 8, 12], seals: [3, 5, 7] },
  { id: 'boss', text: (g) => `Vence a ${g} Guardián${g > 1 ? 'es' : ''}`, goals: [1, 2, 3], seals: [4, 6, 9], elixir: true },
  { id: 'rift', text: (g) => `Cierra ${g} Grieta${g > 1 ? 's' : ''}`, goals: [2, 3, 4], seals: [3, 5, 7] },
  { id: 'hard', text: (g) => `Cierra ${g} Grieta${g > 1 ? 's' : ''} en Medio o Difícil`, goals: [1, 2], seals: [5, 8], elixir: true },
  { id: 'amber', text: (g) => `Recoge ${g} de ámbar`, goals: [400, 900, 1600], seals: [3, 5, 7] },
  { id: 'ult', text: (g) => `Usa tu definitiva ${g} veces`, goals: [2, 4], seals: [3, 6] },
  { id: 'event', text: (g) => `Completa ${g} evento${g > 1 ? 's' : ''} de Grieta`, goals: [1, 2, 3], seals: [3, 5, 8] },
];
const DAILY_BONUS = 6; // cofre por completar las 3 misiones del día
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const questSeals = (q) => { const def = DAILY_POOL.find((x) => x.id === q.id); return def.seals[Math.max(0, def.goals.indexOf(q.goal))]; };

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
  S.daily = { day, list, bonus: false };
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
const bonusReady = (d) => !d.bonus && d.list.every((q) => q.claimed);
const dailyReady = () => { const d = ensureDaily(); return d ? d.list.filter((q) => q.prog >= q.goal && !q.claimed).length + (bonusReady(d) ? 1 : 0) : 0; };

// ============================================================
// Sellos de Gesta: la moneda de las misiones. Sirven para lo que el ámbar no compra:
// trascender al héroe, forjar estrellas en el equipo y la Armería de Gesta.
// ============================================================
const SEAL_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.4" fill="#7a3fb8" stroke="#2a1040" stroke-width="1.2"/><path d="M8 3.6 L9.2 6.6 L12.4 6.8 L9.9 8.8 L10.7 11.9 L8 10.2 L5.3 11.9 L6.1 8.8 L3.6 6.8 L6.8 6.6 Z" fill="#f2d27a"/></svg>';
const seals = () => (S && S.seals) || 0;
function gainSeals(n, why) {
  if (!S || n <= 0) return;
  S.seals = seals() + n;
  if (state === 'play' && P) addText(P.x, P.y - 66, `+${n} Sellos de Gesta${why ? ' · ' + why : ''}`, '#d7b4ff', 1);
}

// --- Trascendencia del héroe: 10 rangos, cada uno +5% daño y +5% PV, con hitos especiales ---
const TRANS_MAX = 10;
const transRank = () => (S && S.trans) || 0;
const transCost = (r) => 15 + r * 10;          // coste del rango r+1
const transLevel = (r) => 4 + r * 4;           // nivel de héroe necesario para el rango r+1
const TRANS_PERKS = {
  3: { name: 'Furia contenida', desc: 'La definitiva se carga un 30% más rápido' },
  5: { name: 'Alma despierta', desc: 'Empiezas cada Grieta con la definitiva al 50%' },
  7: { name: 'Ojo del destino', desc: '+5% de probabilidad de crítico' },
  10: { name: 'Trascendido', desc: 'La definitiva hace un 50% más de daño y un aura dorada te acompaña' },
};
const TRANS_TITLES = ['', 'Iniciado', 'Iniciado', 'Templado', 'Templado', 'Despierto', 'Despierto', 'Heroico', 'Heroico', 'Legendario', 'Trascendido'];
const ultMul = () => (transRank() >= 10 ? 1.5 : 1);

// --- Forja de estrellas: cada ranura de equipo sube hasta 5★ y potencia la pieza que lleves (+12% por ★).
// Las estrellas son de la ranura: se conservan aunque cambies de pieza.
const FORGE_MAX = 5;
const forgeStars = (slot) => (S && S.forge && S.forge[slot]) || 0;
const forgeCost = (slot, st) => (slot === 'arma' ? 10 : 6) + st * (slot === 'arma' ? 5 : 3);
const forgeMul = (slot) => 1 + 0.12 * forgeStars(slot);

// --- Armería de Gesta: piezas legendarias exclusivas (más fuertes que las normales) ---
const ARMORY = {
  weapon: { name: 'Arma de Gesta', desc: 'Arma legendaria exclusiva, +20% de stats sobre una legendaria normal', cost: 150 },
  armor: { name: 'Pieza de Gesta', desc: 'Pieza legendaria exclusiva al azar (sin arma), +20% de stats', cost: 90 },
  gem: { name: 'Gema Ancestral', desc: 'Una Gema Ancestral que aún no tengas (bonus permanente)', cost: 220 },
};
function makeGestaItem(slot) {
  const lvl = Math.max(1, (highestLevel() - 1) * 2 + 3 + DIFFS[2].lvl);
  const it = makeItem(S.cls, lvl, 3, { slot, name: 'de Gesta' });
  for (const k of Object.keys(it.stats)) it.stats[k] = Math.max(1, Math.round(it.stats[k] * (k === 'crit' || k === 'res' ? 1.1 : 1.2)));
  it.gesta = true;
  it.value = Math.round(it.value * 1.5);
  return it;
}

// ============================================================
// Tablón: Misiones · Trascendencia · Forja · Armería
// ============================================================
let questTab = 'quests';
const QUEST_TABS = [['quests', 'Misiones'], ['trans', 'Trascendencia'], ['forge', 'Forja'], ['armory', 'Armería']];

function openQuests() {
  state = 'quests';
  buildQuests();
  showOverlay('quests');
  SFX.play('click');
}
function closeQuests() { persist(); state = 'hub'; buildHub(); showOverlay('hub'); }

function sealCard({ act, icon, name, color, sub, desc, price, can, done, doneTxt }) {
  return `<button class="offer gesta${done ? ' sold' : ''}" data-g="${act}" style="--rc:${color};--rb:${color}66" ${done ? 'disabled' : ''}>
    <div class="row"><div class="ico">${icon}</div>
      <div style="min-width:0"><span class="nm" style="color:${color}">${name}</span><span class="sub">${sub}</span></div></div>
    <span class="desc">${desc}</span>
    <span class="buy${can ? '' : ' no'}">${done ? doneTxt || 'Máximo' : SEAL_SVG + ' ' + price}</span>
  </button>`;
}
const bigIcon = (txt, bg) => `<span class="g-ico" style="background:${bg}">${txt}</span>`;

function buildQuests() {
  const d = ensureDaily();
  $('questTabs').innerHTML = QUEST_TABS.map(([id, label]) => `<button data-tab="${id}" class="${questTab === id ? 'on' : ''}">${label}${id === 'quests' && dailyReady() ? ' •' : ''}</button>`).join('');
  $('questAmber').innerHTML = SEAL_SVG + ' ' + fmtNum(seals());
  const list = $('questList');
  list.className = questTab === 'quests' ? 'quest-list' : 'shop-grid gesta-grid';
  if (questTab === 'quests') {
    list.innerHTML = d.list.map((q, i) => {
      const def = DAILY_POOL.find((x) => x.id === q.id), done = q.prog >= q.goal;
      return `<div class="quest ${q.claimed ? 'claimed' : done ? 'done' : ''}">
        <div class="q-txt"><b>${def.text(q.goal)}</b><span>Recompensa: ${SEAL_SVG} ${questSeals(q)} Sellos de Gesta${def.elixir ? ' + un elixir al azar' : ''}</span>
          <div class="q-bar"><i style="width:${(q.prog / q.goal) * 100}%"></i></div><small>${fmtNum(q.prog)} / ${fmtNum(q.goal)}</small></div>
        <button class="btn" data-q="${i}" ${done && !q.claimed ? '' : 'disabled'}>${q.claimed ? '✔ Cobrada' : done ? 'Reclamar' : 'En curso'}</button></div>`;
    }).join('') + `<div class="quest bonus ${d.bonus ? 'claimed' : bonusReady(d) ? 'done' : ''}">
        <div class="q-txt"><b>🎁 Cofre del día</b><span>Completa y cobra las 3 misiones: ${SEAL_SVG} ${DAILY_BONUS} Sellos de Gesta extra</span></div>
        <button class="btn" data-q="bonus" ${bonusReady(d) ? '' : 'disabled'}>${d.bonus ? '✔ Abierto' : bonusReady(d) ? 'Abrir' : 'Cerrado'}</button></div>`;
    const left = 24 - new Date().getHours();
    $('questNote').innerHTML = `Nuevas misiones en ${left} h · cada héroe tiene las suyas. Los <b>Sellos de Gesta</b> se gastan en Trascendencia, Forja y Armería.`;
  } else if (questTab === 'trans') {
    const r = transRank(), cards = [];
    const maxed = r >= TRANS_MAX, cost = transCost(r), lvlReq = transLevel(r), lvlOk = S.level >= lvlReq;
    const perk = TRANS_PERKS[r + 1];
    cards.push(sealCard({ act: 'trans', icon: bigIcon('✦' + r, 'radial-gradient(#ffe7a0,#b07a1a)'), name: maxed ? 'Trascendido' : `Rango ${r + 1}: ${TRANS_TITLES[r + 1]}`, color: '#ffd76a',
      sub: `${CLASSES[S.cls].name} · rango ${r}/${TRANS_MAX}`,
      desc: maxed ? 'Has alcanzado la cima de la Trascendencia.' : `+5% de daño y +5% de PV para siempre (ahora +${r * 5}%).${perk ? ` <b style="color:#ffd76a">Hito: ${perk.name}</b> — ${perk.desc}.` : ''}${lvlOk ? '' : ` <b style="color:#ff8a80">Necesitas nivel ${lvlReq}.</b>`}`,
      price: cost, can: !maxed && lvlOk && seals() >= cost, done: maxed }));
    for (const [k, p] of Object.entries(TRANS_PERKS)) {
      const got = r >= +k;
      cards.push(sealCard({ act: 'perk', icon: bigIcon(got ? '★' : k, got ? 'radial-gradient(#fff3c4,#c9962a)' : '#2a2f48'), name: p.name, color: got ? '#ffd76a' : '#8d90a8',
        sub: `Hito del rango ${k}`, desc: p.desc, done: true, doneTxt: got ? '✔ Activo' : `Rango ${k}` }));
    }
    list.innerHTML = cards.join('');
    $('questNote').textContent = 'La Trascendencia es permanente para este héroe y no depende del equipo.';
  } else if (questTab === 'forge') {
    list.innerHTML = SLOTS.map((slot) => {
      const st = forgeStars(slot), it = S.equip[slot], maxed = st >= FORGE_MAX, cost = forgeCost(slot, st);
      const stars = '★'.repeat(st) + '☆'.repeat(FORGE_MAX - st);
      return sealCard({ act: 'forge:' + slot, icon: it ? itemSVG(it, 40) : bigIcon('·', '#2a2f48'), name: `${SLOT_INFO[slot].name} ${stars}`, color: st >= 5 ? '#ffd76a' : st ? '#e6c0ff' : '#c9c3ae',
        sub: it ? it.name : 'Ranura vacía', desc: maxed ? `+${st * 12}% a los stats de la pieza que lleves aquí.` : `+${st * 12}% → <b style="color:#e6c0ff">+${(st + 1) * 12}%</b> a los stats de la pieza de esta ranura.`,
        price: cost, can: !maxed && seals() >= cost, done: maxed });
    }).join('');
    $('questNote').textContent = 'Las estrellas son de la ranura: se conservan aunque cambies de pieza.';
  } else {
    const missing = Object.keys(GEMS).filter((k) => !S.dofus.includes(k));
    list.innerHTML = Object.entries(ARMORY).map(([k, A]) => {
      const done = k === 'gem' && !missing.length;
      return sealCard({ act: 'armory:' + k, icon: k === 'weapon' ? bigIcon(CLASSES[S.cls].weapon.icon, 'radial-gradient(#ffcf8a,#8a4a10)') : k === 'armor' ? bigIcon('🛡', 'radial-gradient(#ffcf8a,#8a4a10)') : bigIcon('◆', 'radial-gradient(#9ff0ff,#1a6a8a)'),
        name: A.name, color: k === 'gem' ? '#8fe8ff' : '#ffc37a', sub: k === 'gem' ? `${S.dofus.length}/${Object.keys(GEMS).length} gemas` : `Legendaria · Nv ${Math.max(1, (highestLevel() - 1) * 2 + 3 + DIFFS[2].lvl)}`,
        desc: A.desc, price: A.cost, can: !done && seals() >= A.cost, done, doneTxt: 'Las tienes todas' });
    }).join('');
    $('questNote').textContent = 'El nivel de las piezas de Gesta sube con la Grieta más alta que hayas superado.';
  }
}

function gestaAction(act) {
  const [kind, key] = act.split(':');
  const spend = (n) => { if (seals() < n) { showToast('questToast', 'No tienes suficientes Sellos de Gesta', false); SFX.play('hurt'); return false; } S.seals -= n; return true; };
  if (kind === 'trans') {
    const r = transRank();
    if (r >= TRANS_MAX) return;
    if (S.level < transLevel(r)) { showToast('questToast', `Necesitas nivel ${transLevel(r)}`, false); return; }
    if (!spend(transCost(r))) return;
    S.trans = r + 1;
    const perk = TRANS_PERKS[S.trans];
    showToast('questToast', perk ? `¡Rango ${S.trans}! Hito: ${perk.name}` : `¡Trascendencia rango ${S.trans}!`);
    SFX.play('legend');
  } else if (kind === 'forge') {
    const st = forgeStars(key);
    if (st >= FORGE_MAX) return;
    if (!spend(forgeCost(key, st))) return;
    S.forge = S.forge || {};
    S.forge[key] = st + 1;
    showToast('questToast', `${SLOT_INFO[key].name} forjada a ${st + 1}★`);
    SFX.play('level');
  } else if (kind === 'armory') {
    if (key !== 'gem' && S.bag.length >= bagMax()) { showToast('questToast', '¡Bolsa llena! Vende algo primero', false); return; }
    const missing = Object.keys(GEMS).filter((k) => !S.dofus.includes(k));
    if (key === 'gem' && !missing.length) return;
    if (!spend(ARMORY[key].cost)) return;
    if (key === 'gem') { const g = pick(missing); S.dofus.push(g); showToast('questToast', `${GEMS[g].name}: ${GEMS[g].desc}`); }
    else {
      const it = makeGestaItem(key === 'weapon' ? 'arma' : pick(SLOTS.filter((s) => s !== 'arma')));
      S.bag.push(it);
      showToast('questToast', `${it.name} está en tu bolsa`);
    }
    SFX.play('legend');
  } else return;
  persist();
  buildQuests();
}

function claimQuest(i) {
  const d = ensureDaily();
  if (i === 'bonus') {
    if (!bonusReady(d)) return;
    d.bonus = true;
    gainSeals(DAILY_BONUS);
    showToast('questToast', `🎁 Cofre del día: +${DAILY_BONUS} Sellos de Gesta`);
    SFX.play('legend'); persist(); buildQuests();
    return;
  }
  const q = d.list[i];
  if (!q || q.claimed || q.prog < q.goal) return;
  const def = DAILY_POOL.find((x) => x.id === q.id), n = questSeals(q);
  q.claimed = true;
  gainSeals(n);
  if (def.elixir) { const k = pick(Object.keys(ELIXIRS)); S.boosts[k] = (S.boosts[k] || 0) + 1; showToast('questToast', `+${n} Sellos de Gesta y ${ELIXIRS[k].name}`); }
  else showToast('questToast', `+${n} Sellos de Gesta`);
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
