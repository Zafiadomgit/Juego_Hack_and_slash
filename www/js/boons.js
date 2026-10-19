/* Fendaria — Bendiciones de los Doce (inspirado en los dones de Hades II).
 * Durante una Grieta aparecen Altares de los Doce dioses de Fendaria. Al tocarlos, el dios te ofrece tres bendiciones
 * y eliges una. Las bendiciones duran solo esa Grieta (como una partida de un roguelite) y se combinan entre sí.
 * Huecos: Ataque (golpe básico), Habilidad, Esquiva y Pasivas (sin límite). Una nueva en un hueco ocupado lo reemplaza.
 * Si un dios te vuelve a ofrecer una que ya tienes, la mejoras de nivel. Rareza: Común, Rara, Épica, Heroica.
 * Los dioses están inspirados en los arquetipos clásicos del género (ira, puntería, escudos, veneno, tiempo, suerte…).
 */
'use strict';

const GODS = {
  ira: { name: 'Brakkar', title: 'dios de la Ira', color: '#ff5a3d', rgb: '255,90,61', sym: '⚔', quote: '¡Golpea primero, piensa después! ¡Así se gana una guerra!' },
  punteria: { name: 'Ilvra', title: 'diosa de la Puntería', color: '#7fe08a', rgb: '127,224,138', sym: '➶', quote: 'Respira. Apunta. Nada escapa a quien sabe esperar.' },
  escudo: { name: 'Aldemar', title: 'dios de los Escudos', color: '#6fc3ff', rgb: '111,195,255', sym: '⛨', quote: 'Un muro no ataca, pequeño. Pero nunca cae.' },
  veneno: { name: 'Nharas', title: 'diosa de las Sombras', color: '#9be05a', rgb: '155,224,90', sym: '☠', quote: 'La muerte más dulce es la que tarda en llegar…' },
  tiempo: { name: 'Kronael', title: 'dios del Tiempo', color: '#c9a8ff', rgb: '201,168,255', sym: '⌛', quote: 'Tic. Tac. Tus enemigos ya llegan tarde.' },
  suerte: { name: 'Felizar', title: 'diosa de la Suerte', color: '#ffd54f', rgb: '255,213,79', sym: '🎲', quote: '¿Te apuestas una vida a que esto sale bien? ¡Miau!' },
  cura: { name: 'Lunessa', title: 'diosa de la Sanación', color: '#ff8ac8', rgb: '255,138,200', sym: '✚', quote: 'Mientras yo te mire, ninguna herida es para siempre.' },
  bestias: { name: 'Drakhon', title: 'dios de las Bestias', color: '#ffa860', rgb: '255,168,96', sym: '🐉', quote: 'Nunca peleas solo. La manada camina contigo.' },
  riqueza: { name: 'Orvald', title: 'dios de la Riqueza', color: '#e0b060', rgb: '224,176,96', sym: '💰', quote: 'Todo brilla si cavas lo bastante hondo. ¡Todo!' },
  bosque: { name: 'Silvano', title: 'dios del Bosque Viejo', color: '#5fd38a', rgb: '95,211,138', sym: '🌿', quote: 'Las raíces recuerdan. Y no perdonan.' },
  sangre: { name: 'Kharra', title: 'diosa de la Sangre', color: '#e0303a', rgb: '224,48,58', sym: '🩸', quote: 'Duele, ¿verdad? Bien. El dolor es poder.' },
  fiesta: { name: 'Panzo', title: 'dios de la Fiesta', color: '#8fd0d0', rgb: '143,208,208', sym: '🍶', quote: '¡Un brindis! …y luego un barril en la cabeza de alguien.' },
};

// retratos pintados (img/gods/<id>.webp)
const GOD_IMG = {};
for (const id of Object.keys(GODS)) { const im = new Image(); im.onload = () => { GOD_IMG[id] = im; }; im.src = 'img/gods/' + id + '.webp'; }

const BOON_SLOTS = { atk: 'Ataque', skill: 'Habilidad', dash: 'Esquiva', cast: 'Sello', pas: 'Pasiva', duo: 'Dúo' };
const BOON_RARITY = [
  { name: 'Común', color: '#d8d4c4', mul: 1, w: 60 },
  { name: 'Rara', color: '#5fb8ff', mul: 1.4, w: 28 },
  { name: 'Épica', color: '#c77dff', mul: 1.8, w: 10 },
  { name: 'Heroica', color: '#ff7a3d', mul: 2.3, w: 2 },
  { name: 'Dúo', color: '#7cffb0', mul: 1, w: 0 },
];
const pct = (v) => Math.round(v * 100) + '%';

// x = valor principal (escala con rareza y nivel); el resto de valores son fijos
const BOONS = {
  // Ira
  golpeIra: { god: 'ira', slot: 'atk', name: 'Golpe Iracundo', x: 0.4, d: (x) => `Tus ataques básicos hacen <b>+${pct(x)}</b> de daño.` },
  tajoDivino: { god: 'ira', slot: 'skill', name: 'Tajo Divino', x: 0.35, stun: 0.6, d: (x) => `Tus habilidades hacen <b>+${pct(x)}</b> de daño y <b>aturden</b> 0,6 s.` },
  furiaIra: { god: 'ira', slot: 'pas', name: 'Furia Ciega', x: 0.5, d: (x) => `Cuanta menos vida tengas, más daño haces: hasta <b>+${pct(x)}</b>.` },
  // Puntería
  flechaMarca: { god: 'punteria', slot: 'atk', name: 'Marca del Cazador', x: 0.25, max: 0.6, d: (x) => `Tus básicos <b>marcan</b> 4 s. Los marcados reciben <b>+${pct(x)}</b> de daño de todo.` },
  disparoEsquiva: { god: 'punteria', slot: 'dash', name: 'Lluvia en Retirada', x: 1, d: (x) => `Al esquivar disparas <b>6 flechas</b> en abanico (${pct(x)} del daño básico cada una).` },
  ojoCertero: { god: 'punteria', slot: 'pas', name: 'Ojo Certero', x: 0.1, max: 0.3, d: (x) => `<b>+${pct(x)}</b> de probabilidad de crítico.` },
  // Escudos
  esquivaEgida: { god: 'escudo', slot: 'dash', name: 'Égida Veloz', x: 0.1, max: 0.25, d: (x) => `Al esquivar ganas un <b>escudo</b> del ${pct(x)} de tu vida máxima (cada 2 s).` },
  runaProtectora: { god: 'escudo', slot: 'skill', name: 'Runa Protectora', x: 0.12, max: 0.3, d: (x) => `Al usar una habilidad ganas un escudo del <b>${pct(x)}</b> de tu vida y <b>empujas</b> a los cercanos.` },
  pielRunica: { god: 'escudo', slot: 'pas', name: 'Piel Rúnica', x: 0.12, max: 0.35, d: (x) => `<b>+${pct(x)}</b> de resistencia a todo el daño.` },
  // Veneno
  filoToxico: { god: 'veneno', slot: 'atk', name: 'Filo Tóxico', x: 0.4, d: (x) => `Tus básicos <b>envenenan</b> 3 s (${pct(x)} del daño básico por segundo).` },
  trampaSombra: { god: 'veneno', slot: 'dash', name: 'Trampa de Sombra', x: 1.8, d: (x) => `Al esquivar dejas una <b>trampa</b> que estalla al pisarla (${pct(x)} del daño básico y veneno).` },
  golpeArtero: { god: 'veneno', slot: 'pas', name: 'Golpe Artero', x: 0.4, d: (x) => `<b>+${pct(x)}</b> de daño a enemigos envenenados.` },
  // Tiempo
  manecillas: { god: 'tiempo', slot: 'atk', name: 'Manecillas', x: 0.15, d: (x) => `Tus básicos <b>ralentizan</b> 1,5 s y atacas un <b>${pct(x)}</b> más rápido.` },
  bucle: { god: 'tiempo', slot: 'skill', name: 'Bucle Temporal', x: 0.3, max: 0.5, d: (x) => `<b>${pct(x)}</b> de probabilidad de que una habilidad <b>no se recargue</b>.` },
  paradoja: { god: 'tiempo', slot: 'dash', name: 'Paradoja', x: 1, max: 1.6, d: (x) => `Al esquivar <b>detienes el tiempo</b> de los enemigos cercanos ${(x).toFixed(1).replace('.', ',')} s.` },
  // Suerte
  tiradaDados: { god: 'suerte', slot: 'atk', name: 'Tirada de Dados', x: 0.2, max: 0.45, d: (x) => `<b>${pct(x)}</b> de que un básico haga <b>el doble</b> de daño.` },
  gatoNegro: { god: 'suerte', slot: 'pas', name: 'Gato Negro', x: 0.4, d: (x) => `Tus críticos hacen <b>+${pct(x)}</b> de daño.` },
  premioGordo: { god: 'suerte', slot: 'pas', name: 'Premio Gordo', x: 0.08, max: 0.2, d: (x) => `<b>${pct(x)}</b> de que un enemigo suelte un <b>montón de ámbar</b> al morir.` },
  // Sanación
  palabraSanadora: { god: 'cura', slot: 'skill', name: 'Palabra Sanadora', x: 0.04, max: 0.1, d: (x) => `Cada habilidad te <b>cura</b> un ${pct(x)} de tu vida máxima.` },
  besoVital: { god: 'cura', slot: 'pas', name: 'Beso Vital', x: 0.012, max: 0.03, d: (x) => `Cada enemigo que matas te cura un <b>${(x * 100).toFixed(1).replace('.', ',')}%</b> de tu vida.` },
  segundoAliento: { god: 'cura', slot: 'pas', name: 'Segundo Aliento', x: 0.4, max: 0.8, d: (x) => `Una vez por Grieta, al caer <b>vuelves</b> con el ${pct(x)} de tu vida.` },
  // Bestias
  dragoncillo: { god: 'bestias', slot: 'skill', name: 'Dragoncillo', x: 0.8, d: (x) => `Cada habilidad invoca un <b>dragoncillo</b> 8 s que escupe fuego (${pct(x)} del daño básico).` },
  manada: { god: 'bestias', slot: 'pas', name: 'Espíritu de la Manada', x: 0.45, d: (x) => `Un <b>espíritu</b> te acompaña y dispara sin parar (${pct(x)} del daño básico).` },
  zarpazo: { god: 'bestias', slot: 'atk', name: 'Zarpazo', x: 0.25, d: (x) => `Tus básicos hacen <b>+${pct(x)}</b> de daño y <b>empujan</b> más.` },
  // Riqueza
  bolsillo: { god: 'riqueza', slot: 'pas', name: 'Bolsillo Hondo', x: 0.4, d: (x) => `<b>+${pct(x)}</b> de ámbar en esta Grieta.` },
  palaOro: { god: 'riqueza', slot: 'atk', name: 'Pala de Oro', x: 0.18, d: (x) => `Tus básicos hacen <b>+${pct(x)}</b> de daño y a veces <b>arrancan ámbar</b>.` },
  pasoAvaro: { god: 'riqueza', slot: 'dash', name: 'Paso Avaro', x: 2, d: () => 'Al esquivar <b>atraes todo el botín</b> cercano y ganas velocidad un instante.' },
  // Bosque
  zarzas: { god: 'bosque', slot: 'dash', name: 'Zarzas', x: 0.6, d: (x) => `Al esquivar dejas <b>zarzas</b> 3 s que dañan (${pct(x)} del básico por segundo) y ralentizan.` },
  raices: { god: 'bosque', slot: 'skill', name: 'Raíces Viejas', x: 0.5, max: 0.8, d: (x) => `Tus habilidades tienen un <b>${pct(x)}</b> de <b>enraizar</b> (aturdir 1 s).` },
  savia: { god: 'bosque', slot: 'pas', name: 'Savia', x: 0.01, max: 0.025, d: (x) => `<b>Regeneras</b> un ${(x * 100).toFixed(1).replace('.', ',')}% de tu vida por segundo.` },
  // Sangre
  cortaSangre: { god: 'sangre', slot: 'atk', name: 'Corte Sangriento', x: 0.3, d: (x) => `Tus básicos hacen <b>+${pct(x)}</b> de daño y <b>roban</b> un 3% como vida.` },
  sacrificio: { god: 'sangre', slot: 'pas', name: 'Sacrificio', x: 0.35, d: (x) => `<b>+${pct(x)}</b> de daño a todo, pero <b>-20%</b> de vida máxima.` },
  castigo: { god: 'sangre', slot: 'skill', name: 'Castigo', x: 1, d: (x) => `Tus habilidades hacen <b>+${Math.round(x * 10)}%</b> de daño por cada 10% de vida que te falte.` },
  // Fiesta
  barrilazo: { god: 'fiesta', slot: 'dash', name: 'Barrilazo', x: 1.5, d: (x) => `Al esquivar dejas un <b>barril</b> que explota (${pct(x)} del daño básico) y lanza a todos por los aires.` },
  ebriedad: { god: 'fiesta', slot: 'atk', name: 'Golpe Ebrio', x: 0.15, max: 0.35, d: (x) => `<b>${pct(x)}</b> de que un básico <b>aturda</b> 1 s.` },
  aguante: { god: 'fiesta', slot: 'pas', name: 'Aguante de Taberna', x: 0.25, d: (x) => `<b>+${pct(x)}</b> de vida máxima.` },
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
  showBanner('Altar de ' + GODS[god].name, GODS[god].color, GODS[god].title + ' te ofrece su bendición');
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
    ['god_' + al.god, 'Soy ' + G.name + ', uno de los Doce. Los dioses de Fendaria no podemos cruzar las Grietas…'],
    ['god_' + al.god, '…pero sí podemos prestarte nuestro poder mientras estés dentro. Elige bien: mi bendición se desvanece cuando sales.'],
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
    const repl = B.slot !== 'pas' && B.slot !== 'duo' && b.slots[B.slot] && b.slots[B.slot] !== o.id ? `<div class="bp-repl">Reemplaza: ${BOONS[b.slots[B.slot]].name}</div>` : '';
    return `<button class="bp-card" data-k="${k}" style="--c:${G.color};--r:${R.color}">
      <div class="bp-top"><span class="bp-slot">${BOON_SLOTS[B.slot]}</span><span class="bp-rar">${own ? 'Nivel ' + lvl : R.name}</span></div>
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
  if (has('bucle') && Math.random() < bv('bucle')) { P.skillCd[i] = 0; P.pa += P.C.skills[i].cost * 0.5; addText(P.x, P.y - 60, '¡Bucle!', GODS.tiempo.color, 1.1); }
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
  if (dbl) addText(e.x, e.y - e.r * 2.4, '¡×2!', GODS.suerte.color, 1.2);
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
  if (!was) addText(e.x, e.y - e.r * 2.2, '¡Aturdido!', '#ffe08a', 0.8);
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
    addText(e.x, e.y - 40, '¡Premio gordo!', GODS.suerte.color, 1.2);
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
    showBanner('¡Segundo Aliento!', GODS.cura.color, 'Lunessa no ha terminado contigo');
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
