/* Fendaria — Bendiciones de los Doce (inspirado en los dones de Hades II).
 * Durante una Grieta aparecen Altares de los Doce dioses de Fendaria. Al tocarlos, el dios te ofrece tres bendiciones
 * y eliges una. Las bendiciones duran solo esa Grieta (como una partida de un roguelite) y se combinan entre sí.
 * Huecos: Ataque (golpe básico), Habilidad, Esquiva y Pasivas (sin límite). Una nueva en un hueco ocupado lo reemplaza.
 * Si un dios te vuelve a ofrecer una que ya tienes, la mejoras de nivel. Rareza: Común, Rara, Épica, Heroica.
 * Los dioses están inspirados en los arquetipos clásicos del género (ira, puntería, escudos, veneno, tiempo, suerte…).
 */
'use strict';

const GODS = {
  ira: { name: 'Brakkar', title: "god of Wrath", color: '#ff5a3d', rgb: '255,90,61', sym: '⚔', quote: "Strike first, think later! That's how wars are won!" },
  punteria: { name: 'Ilvra', title: "goddess of the Hunt", color: '#7fe08a', rgb: '127,224,138', sym: '➶', quote: "Breathe. Aim. Nothing escapes those who know how to wait." },
  escudo: { name: 'Aldemar', title: "god of Shields", color: '#6fc3ff', rgb: '111,195,255', sym: '⛨', quote: "A wall doesn't attack, little one. But it never falls." },
  veneno: { name: 'Nharas', title: "goddess of Shadows", color: '#9be05a', rgb: '155,224,90', sym: '☠', quote: "The sweetest death is the one that takes its time…" },
  tiempo: { name: 'Kronael', title: "god of Time", color: '#c9a8ff', rgb: '201,168,255', sym: '⌛', quote: "Tick. Tock. Your enemies are already late." },
  suerte: { name: 'Felizar', title: "goddess of Luck", color: '#ffd54f', rgb: '255,213,79', sym: '🎲', quote: "Wanna bet a life this works out? Meow!" },
  cura: { name: 'Lunessa', title: "goddess of Healing", color: '#ff8ac8', rgb: '255,138,200', sym: '✚', quote: "While I'm watching over you, no wound is forever." },
  bestias: { name: 'Drakhon', title: "god of Beasts", color: '#ffa860', rgb: '255,168,96', sym: '🐉', quote: "You never fight alone. The pack walks with you." },
  riqueza: { name: 'Orvald', title: "god of Wealth", color: '#e0b060', rgb: '224,176,96', sym: '💰', quote: "Everything shines if you dig deep enough. Everything!" },
  bosque: { name: 'Silvano', title: "god of the Old Forest", color: '#5fd38a', rgb: '95,211,138', sym: '🌿', quote: "Roots remember. And they don't forgive." },
  sangre: { name: 'Kharra', title: "goddess of Blood", color: '#e0303a', rgb: '224,48,58', sym: '🩸', quote: "It hurts, doesn't it? Good. Pain is power." },
  fiesta: { name: 'Panzo', title: "god of Revelry", color: '#8fd0d0', rgb: '143,208,208', sym: '🍶', quote: "A toast! …and then a barrel on someone's head." },
};

// retratos pintados (img/gods/<id>.webp)
const GOD_IMG = {};
for (const id of Object.keys(GODS)) { const im = new Image(); im.onload = () => { GOD_IMG[id] = im; }; im.src = 'img/gods/' + id + '.webp'; }

const BOON_SLOTS = { atk: "Attack", skill: "Skill", dash: "Dodge", cast: "Seal", pas: "Passive", duo: "Duo" };
const BOON_RARITY = [
  { name: "Common", color: '#d8d4c4', mul: 1, w: 60 },
  { name: "Rare", color: '#5fb8ff', mul: 1.4, w: 28 },
  { name: "Epic", color: '#c77dff', mul: 1.8, w: 10 },
  { name: "Heroic", color: '#ff7a3d', mul: 2.3, w: 2 },
  { name: "Duo", color: '#7cffb0', mul: 1, w: 0 },
];
const pct = (v) => Math.round(v * 100) + '%';

// x = valor principal (escala con rareza y nivel); el resto de valores son fijos
const BOONS = {
  // Ira
  golpeIra: { god: 'ira', slot: 'atk', name: "Wrathful Strike", x: 0.4, d: (x) => `Your basic attacks deal <b>+${pct(x)}</b> damage.` },
  tajoDivino: { god: 'ira', slot: 'skill', name: "Divine Slash", x: 0.35, stun: 0.6, d: (x) => `Your skills deal <b>+${pct(x)}</b> damage and <b>stun</b> for 0.6 s.` },
  furiaIra: { god: 'ira', slot: 'pas', name: "Blind Fury", x: 0.5, d: (x) => `The less health you have, the more damage you deal: up to <b>+${pct(x)}</b>.` },
  // Puntería
  flechaMarca: { god: 'punteria', slot: 'atk', name: "Hunter's Mark", x: 0.25, max: 0.6, d: (x) => `Your basics <b>mark</b> for 4 s. Marked enemies take <b>+${pct(x)}</b> damage from everything.` },
  disparoEsquiva: { god: 'punteria', slot: 'dash', name: "Retreating Volley", x: 1, d: (x) => `When you dodge you fire <b>6 arrows</b> in a fan (${pct(x)} of basic damage each).` },
  ojoCertero: { god: 'punteria', slot: 'pas', name: "True Eye", x: 0.1, max: 0.3, d: (x) => `<b>+${pct(x)}</b> crit chance.` },
  // Escudos
  esquivaEgida: { god: 'escudo', slot: 'dash', name: "Swift Aegis", x: 0.1, max: 0.25, d: (x) => `When you dodge you gain a <b>shield</b> worth ${pct(x)} of your max health (every 2 s).` },
  runaProtectora: { god: 'escudo', slot: 'skill', name: "Warding Rune", x: 0.12, max: 0.3, d: (x) => `When you use a skill you gain a shield worth <b>${pct(x)}</b> of your health and <b>push back</b> nearby enemies.` },
  pielRunica: { god: 'escudo', slot: 'pas', name: "Runic Skin", x: 0.12, max: 0.35, d: (x) => `<b>+${pct(x)}</b> resistance to all damage.` },
  // Veneno
  filoToxico: { god: 'veneno', slot: 'atk', name: "Toxic Edge", x: 0.4, d: (x) => `Your basics <b>poison</b> for 3 s (${pct(x)} of basic damage per second).` },
  trampaSombra: { god: 'veneno', slot: 'dash', name: "Shadow Trap", x: 1.8, d: (x) => `When you dodge you leave a <b>trap</b> that explodes when stepped on (${pct(x)} of basic damage plus poison).` },
  golpeArtero: { god: 'veneno', slot: 'pas', name: "Sly Strike", x: 0.4, d: (x) => `<b>+${pct(x)}</b> damage to poisoned enemies.` },
  // Tiempo
  manecillas: { god: 'tiempo', slot: 'atk', name: "Clock Hands", x: 0.15, d: (x) => `Your basics <b>slow</b> for 1.5 s and you attack <b>${pct(x)}</b> faster.` },
  bucle: { god: 'tiempo', slot: 'skill', name: "Time Loop", x: 0.3, max: 0.5, d: (x) => `<b>${pct(x)}</b> chance that a skill <b>doesn't go on cooldown</b>.` },
  paradoja: { god: 'tiempo', slot: 'dash', name: "Paradox", x: 1, max: 1.6, d: (x) => `When you dodge you <b>freeze time</b> for nearby enemies for ${(x).toFixed(1)} s.` },
  // Suerte
  tiradaDados: { god: 'suerte', slot: 'atk', name: "Dice Roll", x: 0.2, max: 0.45, d: (x) => `<b>${pct(x)}</b> chance for a basic to deal <b>double</b> damage.` },
  gatoNegro: { god: 'suerte', slot: 'pas', name: "Black Cat", x: 0.4, d: (x) => `Your crits deal <b>+${pct(x)}</b> damage.` },
  premioGordo: { god: 'suerte', slot: 'pas', name: "Jackpot", x: 0.08, max: 0.2, d: (x) => `<b>${pct(x)}</b> chance for an enemy to drop a <b>pile of amber</b> when it dies.` },
  // Sanación
  palabraSanadora: { god: 'cura', slot: 'skill', name: "Healing Word", x: 0.04, max: 0.1, d: (x) => `Each skill <b>heals</b> you for ${pct(x)} of your max health.` },
  besoVital: { god: 'cura', slot: 'pas', name: "Kiss of Life", x: 0.012, max: 0.03, d: (x) => `Each enemy you kill heals you for <b>${(x * 100).toFixed(1)}%</b> of your health.` },
  segundoAliento: { god: 'cura', slot: 'pas', name: "Second Wind", x: 0.4, max: 0.8, d: (x) => `Once per Rift, when you fall you <b>come back</b> with ${pct(x)} of your health.` },
  // Bestias
  dragoncillo: { god: 'bestias', slot: 'skill', name: "Dragonling", x: 0.8, d: (x) => `Each skill summons a <b>dragonling</b> for 8 s that spits fire (${pct(x)} of basic damage).` },
  manada: { god: 'bestias', slot: 'pas', name: "Pack Spirit", x: 0.45, d: (x) => `A <b>spirit</b> follows you and fires non-stop (${pct(x)} of basic damage).` },
  zarpazo: { god: 'bestias', slot: 'atk', name: "Claw Swipe", x: 0.25, d: (x) => `Your basics deal <b>+${pct(x)}</b> damage and <b>knock back</b> further.` },
  // Riqueza
  bolsillo: { god: 'riqueza', slot: 'pas', name: "Deep Pockets", x: 0.4, d: (x) => `<b>+${pct(x)}</b> amber in this Rift.` },
  palaOro: { god: 'riqueza', slot: 'atk', name: "Golden Shovel", x: 0.18, d: (x) => `Your basics deal <b>+${pct(x)}</b> damage and sometimes <b>dig up amber</b>.` },
  pasoAvaro: { god: 'riqueza', slot: 'dash', name: "Greedy Step", x: 2, d: () => "When you dodge you <b>pull in all nearby loot</b> and gain a burst of speed." },
  // Bosque
  zarzas: { god: 'bosque', slot: 'dash', name: "Brambles", x: 0.6, d: (x) => `When you dodge you leave <b>brambles</b> for 3 s that hurt (${pct(x)} of basic per second) and slow.` },
  raices: { god: 'bosque', slot: 'skill', name: "Old Roots", x: 0.5, max: 0.8, d: (x) => `Your skills have a <b>${pct(x)}</b> chance to <b>root</b> (stun for 1 s).` },
  savia: { god: 'bosque', slot: 'pas', name: "Sap", x: 0.01, max: 0.025, d: (x) => `You <b>regenerate</b> ${(x * 100).toFixed(1)}% of your health per second.` },
  // Sangre
  cortaSangre: { god: 'sangre', slot: 'atk', name: "Bloody Cut", x: 0.3, d: (x) => `Your basics deal <b>+${pct(x)}</b> damage and <b>steal</b> 3% as health.` },
  sacrificio: { god: 'sangre', slot: 'pas', name: "Sacrifice", x: 0.35, d: (x) => `<b>+${pct(x)}</b> damage to everything, but <b>-20%</b> max health.` },
  castigo: { god: 'sangre', slot: 'skill', name: "Retribution", x: 1, d: (x) => `Your skills deal <b>+${Math.round(x * 10)}%</b> damage for every 10% of health you're missing.` },
  // Fiesta
  barrilazo: { god: 'fiesta', slot: 'dash', name: "Barrel Bash", x: 1.5, d: (x) => `When you dodge you leave a <b>barrel</b> that explodes (${pct(x)} of basic damage) and sends everyone flying.` },
  ebriedad: { god: 'fiesta', slot: 'atk', name: "Drunken Blow", x: 0.15, max: 0.35, d: (x) => `<b>${pct(x)}</b> chance for a basic to <b>stun</b> for 1 s.` },
  aguante: { god: 'fiesta', slot: 'pas', name: "Tavern Stamina", x: 0.25, d: (x) => `<b>+${pct(x)}</b> max health.` },
};

// ============================================================
// Estado de la Grieta
// ============================================================
const bst = () => rift && rift.bn;
function boonInit() {
  rift.bn = { owned: {}, slots: {}, altars: [], given: 0, zones: [], spirits: [], egidaT: 0, revived: false, lastGod: null, magT: 0 };
}
// valor de una bendición (null si no se tiene)
function bv(id) {
  const b = bst(), o = b && b.owned[id];
  if (!o) return null;
  return boonX(id, o.r, o.lvl);
}
// valor con rareza y nivel, con tope para los efectos de probabilidad o de control
function boonX(id, r, lvl) {
  const B = BOONS[id], v = B.x * BOON_RARITY[r].mul * (1 + 0.5 * (lvl - 1));
  return B.max ? Math.min(B.max, v) : v;
}
const has = (id) => !!(bst() && bst().owned[id]);
const missingHp = () => (P && P.maxHp ? 1 - P.hp / P.maxHp : 0);

// ============================================================
// Altares y elección
// ============================================================
function spawnAltar() {
  const b = bst();
  const gods = Object.keys(GODS).filter((g) => g !== b.lastGod);
  const god = pick(gods);
  b.lastGod = god;
  let x = P.x, y = P.y;
  for (let k = 0; k < 20; k++) {
    const a = rand(0, TAU), d = rand(150, 230);
    x = clamp(P.x + Math.cos(a) * d, 80, WORLD.w - 80); y = clamp(P.y + Math.sin(a) * d, 80, WORLD.h - 80);
    if (!obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + 50)) break;
  }
  b.altars.push({ x, y, god, t: 0 });
  b.given++;
  showBanner("Altar of " + GODS[god].name, GODS[god].color, GODS[god].title + " offers you a blessing");
  SFX.play('legend');
}
function rollRarity() {
  const luck = has('ojoCertero') || has('tiradaDados') ? 4 : 0; // los favoritos de la suerte encuentran más rarezas
  let r = Math.random() * (100 + luck), acc = 0;
  for (let i = 3; i >= 0; i--) { acc += BOON_RARITY[i].w + (i ? luck / 3 : 0); if (r < acc) return i; }
  return 0;
}
let boonOffer = null;
// abre la elección del altar (la primera vez el dios se presenta)
function touchAltar(al) {
  if (!S.story || !S.story.seen || S.story.seen.boons || typeof playDialog !== 'function') return openBoonPick(al);
  S.story.seen.boons = 1;
  const G = GODS[al.god];
  SPEAKERS['god_' + al.god] = { name: G.name + ', ' + G.title, color: G.color, aura: G.rgb, img: 'img/gods/' + al.god + '.webp' };
  playDialog([
    ['god_' + al.god, "I am " + G.name + ", one of the Twelve. We gods of Fendaria cannot cross the Rifts…"],
    ['god_' + al.god, "…but we can lend you our power while you're inside. Choose wisely: my blessing fades when you leave."],
  ], { onEnd: () => { if (state === 'play') openBoonPick(al); } });
}
function openBoonPick(al) {
  const b = bst();
  const list = Object.keys(BOONS).filter((id) => BOONS[id].god === al.god && BOONS[id].slot !== 'duo').sort(() => Math.random() - 0.5).slice(0, 3);
  boonOffer = { al, prev: state, opts: list.map((id) => ({ id, r: b.owned[id] ? b.owned[id].r : rollRarity() })) };
  if (typeof injectDuo === 'function') injectDuo(boonOffer.opts, al.god);
  state = 'boon';
  clearInput();
  const G = GODS[al.god];
  const card = (o, k) => {
    const B = BOONS[o.id], R = BOON_RARITY[o.r], own = b.owned[o.id];
    const lvl = own ? own.lvl + 1 : 1;
    const x = boonX(o.id, o.r, lvl);
    const repl = B.slot !== 'pas' && B.slot !== 'duo' && b.slots[B.slot] && b.slots[B.slot] !== o.id ? `<div class="bp-repl">Replaces: ${BOONS[b.slots[B.slot]].name}</div>` : '';
    return `<button class="bp-card" data-k="${k}" style="--c:${G.color};--r:${R.color}">
      <div class="bp-top"><span class="bp-slot">${BOON_SLOTS[B.slot]}</span><span class="bp-rar">${own ? "Level " + lvl : R.name}</span></div>
      <div class="bp-name">${B.name}</div>
      <div class="bp-desc">${B.d(x)}</div>${repl}</button>`;
  };
  $('boonPick').innerHTML = `<div class="bp-box" style="--c:${G.color}">
    <div class="bp-head"><div class="bp-por"><img src="img/gods/${al.god}.webp" alt=""></div>
      <div><b>${G.name}</b><small>${G.title}</small><i>«${G.quote}»</i></div></div>
    <div class="bp-cards">${boonOffer.opts.map(card).join('')}</div></div>`;
  $('boonPick').classList.add('show');
  SFX.play('legend');
}
function chooseBoon(k) {
  const o = boonOffer.opts[k], b = bst(), B = BOONS[o.id];
  if (b.owned[o.id]) b.owned[o.id].lvl++;
  else {
    const slotted = B.slot !== 'pas' && B.slot !== 'duo';
    if (slotted && b.slots[B.slot]) delete b.owned[b.slots[B.slot]];
    b.owned[o.id] = { r: o.r, lvl: 1 };
    if (slotted) b.slots[B.slot] = o.id;
  }
  b.altars = b.altars.filter((a) => a !== boonOffer.al);
  $('boonPick').classList.remove('show');
  state = boonOffer.prev === 'boon' ? 'play' : boonOffer.prev;
  boonOffer = null;
  recalc();
  rings.push({ x: P.x, y: P.y, r0: 10, r1: 140, life: 0.5, max: 0.5, color: `rgba(${GODS[B.god].rgb},` });
  sparks(P.x, P.y - 20, 20, GODS[B.god].color, 360);
  SFX.play('click');
  buildBoonBar();
}
document.body.insertAdjacentHTML('beforeend', '<div id="boonPick" class="boon-pick"></div><div id="boonBar" class="boon-bar"></div>');
$('boonPick').addEventListener('click', (ev) => { const c = ev.target.closest('.bp-card'); if (c && boonOffer) chooseBoon(+c.dataset.k); });

function buildBoonBar() {
  const b = bst(), el = $('boonBar');
  if (!b || !Object.keys(b.owned).length) { el.innerHTML = ''; el.classList.remove('show'); return; }
  el.innerHTML = Object.entries(b.owned).map(([id, o]) => {
    const B = BOONS[id], G = GODS[B.god];
    return `<span title="${B.name}" style="--c:${G.color};--r:${BOON_RARITY[o.r].color};background-image:url(img/gods/${B.god}.webp)">${o.lvl > 1 ? `<i>${o.lvl}</i>` : ''}</span>`;
  }).join('');
  el.classList.add('show');
}

// ============================================================
// Efectos
// ============================================================
let curSrc = null;
function tagNew(n, src) { for (let i = n; i < projectiles.length; i++) if (projectiles[i].team === 'p' && !projectiles[i].src) projectiles[i].src = src; }

const _later = later;
later = function (t, fn) {
  const s = curSrc;
  return _later(t, s ? () => { const p = curSrc; curSrc = s; try { fn(); } finally { curSrc = p; } } : fn);
};

const _basicAttack = basicAttack;
basicAttack = function () {
  const n = projectiles.length;
  curSrc = 'basic';
  try { _basicAttack(); } finally { curSrc = null; }
  tagNew(n, 'basic');
};

const _useSkill = useSkill;
useSkill = function (i) {
  const pa = P.pa, n = projectiles.length;
  curSrc = 'skill';
  try { _useSkill(i); } finally { curSrc = null; }
  tagNew(n, 'skill');
  if (P.pa < pa && bst()) onSkillCast(i);
};

function onSkillCast(i) {
  if (has('bucle') && Math.random() < bv('bucle')) { P.skillCd[i] = 0; P.pa += P.C.skills[i].cost * 0.5; addText(P.x, P.y - 60, "Loop!", GODS.tiempo.color, 1.1); }
  if (has('palabraSanadora')) heal(Math.round(P.maxHp * bv('palabraSanadora')));
  if (has('runaProtectora')) {
    P.shield = Math.max(P.shield, Math.round(P.maxHp * bv('runaProtectora'))); P.shieldT = 5;
    rings.push({ x: P.x, y: P.y, r0: 20, r1: 130, life: 0.35, max: 0.35, color: 'rgba(111,195,255,' });
    for (const e of enemies) if (!e.dead && dist(P.x, P.y, e.x, e.y) < 130 + e.r) { const a = Math.atan2(e.y - P.y, e.x - P.x); e.kvx += Math.cos(a) * 420 * e.D.kbRes; e.kvy += Math.sin(a) * 420 * e.D.kbRes; }
  }
  if (has('dragoncillo')) bst().spirits.push({ kind: 'dragon', life: 8, cd: 0.4, a: rand(0, TAU), god: 'bestias', x: P.x, y: P.y });
}

const _dash = dash;
dash = function () {
  const pm = P.pm, sx = P.x, sy = P.y;
  _dash();
  if (P.pm < pm && bst()) onDash(sx, sy);
};
function onDash(sx, sy) {
  const b = bst();
  const bd = basicDmg();
  if (has('disparoEsquiva')) {
    const a0 = P.dir;
    for (let k = 0; k < 6; k++) {
      const a = a0 + Math.PI + (k - 2.5) * 0.28;
      projectiles.push({ team: 'p', kind: 'arrow', src: 'dash', x: P.x, y: P.y - 6, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, r: 6, dmg: bd * bv('disparoEsquiva'), life: 0.55, pierce: 0, kb: 80, hit: [] });
    }
  }
  if (has('esquivaEgida') && now > b.egidaT) { b.egidaT = now + 2; P.shield = Math.max(P.shield, Math.round(P.maxHp * bv('esquivaEgida'))); P.shieldT = 4; }
  if (has('trampaSombra')) b.zones.push({ kind: 'trap', x: sx, y: sy, r: 34, life: 10, dmg: bd * bv('trampaSombra') });
  if (has('paradoja')) {
    for (const e of enemies) if (!e.dead && dist(P.x, P.y, e.x, e.y) < 140 + e.r) e.stunT = Math.max(e.stunT || 0, bv('paradoja') * (e.boss ? 0.4 : 1));
    rings.push({ x: P.x, y: P.y, r0: 140, r1: 20, life: 0.4, max: 0.4, color: 'rgba(201,168,255,' });
  }
  if (has('pasoAvaro')) b.magT = 1.2;
  if (has('zarzas')) b.zones.push({ kind: 'thorn', x: sx, y: sy, r: 70, life: 3, dps: bd * bv('zarzas'), tick: 0 });
  if (has('barrilazo')) b.zones.push({ kind: 'barrel', x: sx, y: sy, r: 95, life: 0.8, dmg: bd * bv('barrilazo') });
}

const _damageEnemy = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  const b = bst();
  if (!b || e.dead || !P) return _damageEnemy(e, base, o);
  const src = o.src || curSrc || 'other';
  let m = 1;
  if (src === 'basic') for (const id of ['golpeIra', 'zarpazo', 'palaOro', 'cortaSangre']) if (has(id)) m *= 1 + bv(id);
  if (src === 'skill') {
    if (has('tajoDivino')) m *= 1 + bv('tajoDivino');
    if (has('castigo')) m *= 1 + bv('castigo') * missingHp();
  }
  if (has('furiaIra')) m *= 1 + bv('furiaIra') * missingHp();
  if (has('sacrificio')) m *= 1 + bv('sacrificio');
  if (e.markT > now && has('flechaMarca')) m *= 1 + bv('flechaMarca');
  if (e.dot && has('golpeArtero')) m *= 1 + bv('golpeArtero');
  let dbl = false;
  if (src === 'basic' && has('tiradaDados') && Math.random() < bv('tiradaDados')) { m *= 2; dbl = true; }
  const kbMul = src === 'basic' && has('zarpazo') ? 1.8 : 1;
  _damageEnemy(e, base * m, kbMul > 1 && o.kb ? Object.assign({}, o, { kb: o.kb * kbMul }) : o);
  if (o.quiet) return;
  if (dbl) addText(e.x, e.y - e.r * 2.4, "×2!", GODS.suerte.color, 1.2);
  if (src === 'basic') {
    if (has('cortaSangre')) P.hp = Math.min(P.maxHp, P.hp + base * m * 0.03);
    if (has('palaOro') && Math.random() < 0.12) dropPickup(e.x, e.y, 'kama', { val: Math.max(1, Math.round(rift.level * P.kamaMul)) });
  }
  if (e.dead) return;
  if (src === 'basic') {
    if (has('flechaMarca')) e.markT = now + 4;
    if (has('filoToxico') && !e.dot) e.dot = { t: 3, dps: basicDmg() * bv('filoToxico'), tick: 0.5 };
    if (has('manecillas')) e.slowT = Math.max(e.slowT, 1.5);
    if (has('ebriedad') && Math.random() < bv('ebriedad')) stunEnemy(e, 1);
  }
  if (src === 'skill') {
    if (has('tajoDivino')) stunEnemy(e, 0.6);
    if (has('raices') && Math.random() < bv('raices')) stunEnemy(e, 1);
  }
};
function stunEnemy(e, t) {
  const was = e.stunT > 0;
  e.stunT = Math.max(e.stunT || 0, t * (e.boss ? 0.35 : 1));
  if (!was) addText(e.x, e.y - e.r * 2.2, "Stunned!", '#ffe08a', 0.8);
}

const _updateEnemy = updateEnemy;
updateEnemy = function (e, dt) {
  if (e.stunT > 0) { e.stunT -= dt; e.t += dt; e.flash -= dt; e.hitCd -= dt; e.slowT -= dt; e.kvx *= 0.85; e.kvy *= 0.85; e.x += e.kvx * dt; e.y += e.kvy * dt; return; }
  _updateEnemy(e, dt);
};

const _killEnemy = killEnemy;
killEnemy = function (e) {
  _killEnemy(e);
  if (!bst() || !P) return;
  if (has('besoVital')) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * bv('besoVital'));
  if (has('premioGordo') && Math.random() < bv('premioGordo')) {
    const val = Math.round((5 + rift.level * 3) * P.kamaMul);
    for (let i = 0; i < 5; i++) dropPickup(e.x, e.y, 'kama', { val });
    addText(e.x, e.y - 40, "Jackpot!", GODS.suerte.color, 1.2);
  }
};

const _playerDied = playerDied;
playerDied = function () {
  const b = bst();
  if (b && has('segundoAliento') && !b.revived && state === 'play') {
    b.revived = true;
    P.hp = Math.round(P.maxHp * bv('segundoAliento'));
    P.invul = 2.5;
    rings.push({ x: P.x, y: P.y, r0: 10, r1: 200, life: 0.8, max: 0.8, color: 'rgba(255,138,200,' });
    showBanner("Second Wind!", GODS.cura.color, "Lunessa isn't done with you yet");
    SFX.play('heal');
    return;
  }
  _playerDied();
};

const _recalc = recalc;
recalc = function () {
  _recalc();
  if (!P || !bst()) return;
  const ratio = P.hp / P.maxHp;
  if (has('ojoCertero')) P.crit = Math.min(0.85, P.crit + bv('ojoCertero'));
  if (has('gatoNegro')) P.critDmg *= 1 + bv('gatoNegro');
  if (has('pielRunica')) P.armor = Math.min(0.8, P.armor + bv('pielRunica'));
  if (has('manecillas')) P.atkSpeed *= 1 + bv('manecillas');
  if (has('savia')) P.hpRegen = (P.hpRegen || 0) + bv('savia');
  if (has('bolsillo')) P.kamaMul *= 1 + bv('bolsillo');
  let hm = 1;
  if (has('aguante')) hm *= 1 + bv('aguante');
  if (has('sacrificio')) hm *= 0.8;
  if (hm !== 1) { P.maxHp = Math.round(P.maxHp * hm); P.hp = Math.max(1, Math.round(P.maxHp * ratio)); }
  P.baseMagnet = P.magnet;
};

// luces de altares y espíritus (las llama render)
function boonLights(lights, toS) {
  const b = scene === 'rift' && bst();
  if (!b) return;
  for (const al of b.altars) { const q = toS(al.x, al.y - 40); lights.push({ x: q.x, y: q.y, r: 220 * zoom, a: 1, rgb: GODS[al.god].rgb, haze: 0.35 }); }
  for (const s of b.spirits) { const q = toS(s.x, s.y); lights.push({ x: q.x, y: q.y, r: 90 * zoom, a: 0.7, rgb: s.kind === 'pack' ? '180,220,255' : GODS[s.god].rgb }); }
  for (const z of b.zones) if (z.kind === 'trap' || z.kind === 'barrel') { const q = toS(z.x, z.y); lights.push({ x: q.x, y: q.y, r: 70 * zoom, a: 0.6, rgb: z.kind === 'trap' ? '155,224,90' : '255,190,90' }); }
}

// zonas, espíritus y altares
function boonUpdate(dt) {
  const b = bst();
  if (!b) return;
  // altares: 25 %, 55 % y 85 % de la barra (en el Súper Jefe, uno al empezar)
  const th = rift.isSuper ? [0] : [0.25, 0.55, 0.85];
  if (b.given < th.length && rift.progress / rift.goal >= th[b.given] && (!rift.bossSpawned || rift.isSuper)) spawnAltar();
  for (const al of b.altars) al.t += dt; // se activan con el botón de interacción (camp.js)
  if (b.magT > 0) { b.magT -= dt; P.magnet = (P.baseMagnet || P.magnet) * 6; if (b.magT <= 0) P.magnet = P.baseMagnet || P.magnet; }
  const bd = basicDmg();
  for (const z of b.zones) {
    z.life -= dt;
    if (z.kind === 'trap') {
      const e = enemies.find((q) => !q.dead && dist(q.x, q.y, z.x, z.y) < z.r + q.r);
      if (e) {
        z.life = 0;
        for (const q of enemies) if (!q.dead && dist(q.x, q.y, z.x, z.y) < 90 + q.r) { _damageEnemy(q, z.dmg, { kb: 200, fx: z.x, fy: z.y }); if (!q.dead && !q.dot) q.dot = { t: 3, dps: bd * 0.3, tick: 0.5 }; }
        rings.push({ x: z.x, y: z.y, r0: 10, r1: 90, life: 0.35, max: 0.35, color: 'rgba(155,224,90,' });
        SFX.play('boom');
      }
    } else if (z.kind === 'thorn') {
      z.tick -= dt;
      for (const q of enemies) if (!q.dead && dist(q.x, q.y, z.x, z.y) < z.r + q.r) q.slowT = Math.max(q.slowT, 0.3);
      if (z.tick <= 0) { z.tick = 0.5; for (const q of enemies) if (!q.dead && dist(q.x, q.y, z.x, z.y) < z.r + q.r) _damageEnemy(q, z.dps * 0.5, { quiet: true, color: '#7ad85a' }); }
    } else if (z.kind === 'barrel' && z.life <= 0) {
      for (const q of enemies) if (!q.dead && dist(q.x, q.y, z.x, z.y) < z.r + q.r) { _damageEnemy(q, z.dmg, { kb: 520, fx: z.x, fy: z.y, heavy: true }); if (!q.dead) stunEnemy(q, 0.8); }
      rings.push({ x: z.x, y: z.y, r0: 10, r1: z.r, life: 0.35, max: 0.35, color: 'rgba(255,190,90,' });
      embers(z.x, z.y, 14, '255,170,70', 40); shake(8); SFX.play('boom');
    }
  }
  b.zones = b.zones.filter((z) => z.life > 0);
  // espíritus: el de la manada siempre; los dragoncillos un rato
  if (has('manada') && !b.spirits.some((s) => s.kind === 'pack')) b.spirits.push({ kind: 'pack', life: 1e9, cd: 1, a: 0, god: 'bestias', x: P.x, y: P.y });
  for (const s of b.spirits) {
    s.life -= dt; s.cd -= dt; s.a += dt * (s.kind === 'pack' ? 1.6 : 2.4);
    const R = s.kind === 'pack' ? 46 : 60;
    s.x = lerp(s.x, P.x + Math.cos(s.a) * R, 1 - Math.exp(-8 * dt));
    s.y = lerp(s.y, P.y - 34 + Math.sin(s.a) * R * 0.5, 1 - Math.exp(-8 * dt));
    if (s.cd <= 0) {
      const t = nearestEnemy(s.x, s.y, 380);
      if (t) {
        s.cd = s.kind === 'pack' ? 1.1 : 0.8;
        const a = Math.atan2(t.y - s.y, t.x - s.x);
        const mul = s.kind === 'pack' ? bv('manada') : bv('dragoncillo') || 0.8;
        projectiles.push({ team: 'p', kind: 'orb', src: 'other', x: s.x, y: s.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 6, dmg: bd * mul, life: 0.8, pierce: 0, kb: 40, hit: [] });
      } else s.cd = 0.3;
    }
  }
  b.spirits = b.spirits.filter((s) => s.life > 0 && (s.kind !== 'pack' || has('manada')));
}

const _updateRift = updateRift;
updateRift = function (dt) {
  _updateRift(dt);
  if (rift && state === 'play') boonUpdate(dt);
};

const _startNode2 = startNode;
startNode = function (b, n, d) {
  _startNode2(b, n, d);
  boonInit();
  buildBoonBar();
};
const _goHub2 = goHub;
goHub = function () { _goHub2(); buildBoonBar(); };

// dibujo (capa del suelo, antes que los personajes)
const _drawDecals = drawDecals;
drawDecals = function () {
  _drawDecals();
  const b = scene === 'rift' && bst();
  if (!b) return;
  for (const z of b.zones) {
    if (z.kind === 'trap') { glow(z.x, z.y, 30, '155,224,90', 0.5 + Math.sin(now * 6) * 0.15); circle(z.x, z.y, 12, 'rgba(30,50,20,0.9)', '#9be05a', 2); }
    else if (z.kind === 'thorn') {
      ctx.save(); ctx.globalAlpha = Math.min(1, z.life * 2);
      ctx.fillStyle = 'rgba(40,90,40,0.35)'; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 3;
      for (let k = 0; k < 9; k++) { const a = k * 0.7, rr = z.r * (0.3 + (k % 3) * 0.25); const x = z.x + Math.cos(a) * rr, y = z.y + Math.sin(a) * rr * 0.55; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y - 12); ctx.lineTo(x + 6, y); ctx.stroke(); }
      ctx.restore();
    } else if (z.kind === 'barrel') {
      ctx.save(); ctx.translate(z.x, z.y);
      ctx.fillStyle = '#7a4a24'; ctx.fillRect(-11, -26, 22, 26); ctx.fillStyle = '#3a2412'; ctx.fillRect(-11, -20, 22, 3); ctx.fillRect(-11, -8, 22, 3);
      ctx.restore();
      if (Math.sin(now * 30) > 0) glow(z.x, z.y - 28, 10, '255,200,80', 0.9);
    }
  }
  for (const al of b.altars) {
    const G = GODS[al.god], bob = Math.sin(now * 2.4) * 5;
    glow(al.x, al.y, 90, G.rgb, 0.45 + Math.sin(now * 3) * 0.1);
    ctx.save(); ctx.translate(al.x, al.y);
    ctx.fillStyle = 'rgba(20,16,30,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 14, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = G.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 34, 14, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#4a4458'; ctx.fillRect(-12, -30, 24, 30); ctx.fillStyle = '#6a6478'; ctx.fillRect(-15, -34, 30, 6);
    ctx.restore();
    glow(al.x, al.y - 62 + bob, 40, G.rgb, 0.9);
    const gi = GOD_IMG[al.god];
    if (gi) {
      ctx.save(); ctx.beginPath(); ctx.arc(al.x, al.y - 62 + bob, 22, 0, TAU); ctx.clip();
      ctx.drawImage(gi, al.x - 22, al.y - 84 + bob, 44, 44); ctx.restore();
      ctx.strokeStyle = G.color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(al.x, al.y - 62 + bob, 22, 0, TAU); ctx.stroke();
    } else { ctx.save(); ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(G.sym, al.x, al.y - 62 + bob); ctx.restore(); }
    if (Math.random() < 0.3) particles.push({ kind: 'glowdot', x: al.x + rand(-20, 20), y: al.y - rand(0, 20), vx: 0, vy: rand(-60, -30), life: 0.8, max: 0.8, rgb: G.rgb, size: 3, grav: 0 });
  }
  for (const s of b.spirits) {
    const G = GODS[s.god];
    glow(s.x, s.y, s.kind === 'pack' ? 22 : 18, s.kind === 'pack' ? '180,220,255' : G.rgb, 0.85);
    circle(s.x, s.y, s.kind === 'pack' ? 6 : 5, '#fff', null);
  }
};
