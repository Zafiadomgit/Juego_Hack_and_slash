/* Fendaria — mundos del Acto II y del Acto III.
 * Acto II «Los Heraldos»: tras romperse los cinco Sellos, Morvhal huye y sus dos Heraldos abren Grietas nuevas:
 *   · Ciudad Hundida (Heraldo de la Marea) · Bosque de Cristal (Heraldo del Prisma)
 * Acto III «El Cerrajero»: la Ciudadela del Cerrajero, donde espera Morvhal.
 * Cada mundo añade su bioma, tres monstruos, un Guardián, un Súper Jefe con mecánica propia, un conjunto y dos gemas.
 */
'use strict';

// ---------- Monstruos ----------
Object.assign(ENEMIES, {
  // Ciudad Hundida
  cangrejo: { name: "Coral Crab", hp: 36, speed: 72, dmg: 10, r: 17, xp: 5, kamas: [2, 5], ai: 'charger', blood: '#ff8aa8', kbRes: 0.9, lvl: 2, prog: 1.5, art: true },
  medusa: { name: "Abyssal Jellyfish", hp: 20, speed: 104, dmg: 8, r: 14, xp: 3, kamas: [1, 3], ai: 'zigzag', blood: '#7fe8ff', kbRes: 1.2, lvl: 1, prog: 1.1, art: true, float: true },
  triton: { name: "Harpoon Triton", hp: 24, speed: 60, dmg: 9, r: 13, xp: 4, kamas: [2, 4], ai: 'shooter', blood: '#5fb8ff', kbRes: 0.9, lvl: 3, prog: 1.5, art: true },
  kraken: { name: "Kraken of the Ruins", hp: 880, speed: 90, dmg: 16, r: 34, xp: 170, kamas: [70, 100], ai: 'bossSpider', blood: '#c07cf0', kbRes: 0.08, lvl: 4, prog: 0, boss: true, art: true },
  // Bosque de Cristal
  duende: { name: "Quartz Imp", hp: 14, speed: 160, dmg: 6, r: 11, xp: 2, kamas: [1, 2], ai: 'chase', blood: '#e8f8ff', kbRes: 1.2, lvl: 1, prog: 1, art: true },
  polilla: { name: "Prismatic Moth", hp: 22, speed: 112, dmg: 8, r: 14, xp: 3, kamas: [1, 3], ai: 'zigzag', blood: '#ffb0f0', kbRes: 1.1, lvl: 2, prog: 1.2, art: true, float: true },
  golemC: { name: "Amethyst Golem", hp: 160, speed: 42, dmg: 19, r: 25, xp: 16, kamas: [6, 12], ai: 'slammer', blood: '#c07cf0', kbRes: 0.25, lvl: 5, prog: 5, art: true },
  ciervo: { name: "Crystal Stag", hp: 800, speed: 125, dmg: 15, r: 30, xp: 170, kamas: [70, 100], ai: 'bossTofu', blood: '#9fe8ff', kbRes: 0.1, lvl: 4, prog: 0, boss: true, art: true },
  // Ciudadela del Cerrajero
  guardiaR: { name: "Runic Guard", hp: 44, speed: 66, dmg: 11, r: 17, xp: 6, kamas: [3, 6], ai: 'charger', blood: '#c77dff', kbRes: 0.6, lvl: 3, prog: 1.6, art: true },
  ojo: { name: "Watcher Eye", hp: 26, speed: 58, dmg: 10, r: 14, xp: 5, kamas: [2, 5], ai: 'shooter', blood: '#ffd76a', kbRes: 0.9, lvl: 3, prog: 1.5, art: true, float: true },
  sombraC: { name: "Chained Shade", hp: 22, speed: 140, dmg: 9, r: 13, xp: 3, kamas: [1, 3], ai: 'chase', blood: '#9c5bd8', kbRes: 1.1, lvl: 2, prog: 1.1, art: true },
  carcelero: { name: "The Jailer", hp: 1200, speed: 54, dmg: 21, r: 40, xp: 190, kamas: [80, 120], ai: 'bossGolem', blood: '#c77dff', kbRes: 0.03, lvl: 4, prog: 0, boss: true, art: true },
});
// caja de dibujo de reserva (si el arte pintado no ha cargado se usa un dibujo parecido)
Object.assign(MONSTER_ART, {
  cangrejo: Object.assign({}, MONSTER_ART.bouftou, { r0: 17 }),
  medusa: Object.assign({}, MONSTER_ART.tofu, { r0: 14 }),
  triton: Object.assign({}, MONSTER_ART.pissenlit),
  kraken: Object.assign({}, MONSTER_ART.reinaTeje),
  duende: Object.assign({}, MONSTER_ART.tofu),
  polilla: Object.assign({}, MONSTER_ART.arakne, { r0: 14 }),
  golemC: Object.assign({}, MONSTER_ART.craqueleur),
  ciervo: Object.assign({}, MONSTER_ART.tofuRoyal),
  guardiaR: Object.assign({}, MONSTER_ART.bouftou),
  ojo: Object.assign({}, MONSTER_ART.pissenlit, { r0: 14 }),
  sombraC: Object.assign({}, MONSTER_ART.tofu, { r0: 13 }),
  carcelero: Object.assign({}, MONSTER_ART.colosoHielo),
});

// ---------- Biomas ----------
BIOMES.push(
  {
    id: 'hundida', name: "Sunken City",
    ground: [[40, 70, 78], [52, 86, 92], [30, 52, 60]], grain: [140, 210, 220], patch: ['rgba(40,140,150,0.25)', 'rgba(10,30,40,0.3)'],
    deco: { pebble: 12, blotch: 12, glowshroom: 6, bones: 4 }, decoCol: ['#3a7a7a', '#2a5a6a', '#5a9a8a'],
    tree: 'willow', props: { pillar: 22, crystal: 14, brazier: 10 }, pool: 'water', pools: 24, crystalHue: 0,
    ambient: 0.55, shade: '40,90,130', fog: '90,170,190', mote: 'spore', tint: 'rgba(40,140,200,0.16)',
    weights: { cangrejo: 4, medusa: 4, triton: 4, craqueleur: 1 }, boss: 'kraken', minion: 'medusa',
  },
  {
    id: 'cristal', name: "Crystal Forest",
    ground: [[60, 40, 80], [76, 52, 98], [44, 30, 60]], grain: [210, 180, 255], patch: ['rgba(150,90,220,0.25)', 'rgba(20,10,40,0.3)'],
    deco: { glowshroom: 6, pebble: 10, blotch: 12, iceshard: 5 }, decoCol: ['#7a5aa8', '#5a3a88', '#9a7ac8'],
    tree: 'pine', props: { pillar: 10, crystal: 18, brazier: 10 }, pool: 'ice', pools: 10, crystalHue: 1,
    ambient: 0.5, shade: '110,80,170', fog: '190,160,240', mote: 'snow', tint: 'rgba(170,120,255,0.16)',
    weights: { duende: 5, polilla: 4, golemC: 2 }, boss: 'ciervo', minion: 'duende',
  },
  {
    id: 'ciudadela', name: "Locksmith's Citadel",
    ground: [[30, 26, 38], [42, 36, 52], [20, 16, 26]], grain: [180, 140, 220], patch: ['rgba(120,60,180,0.25)', 'rgba(0,0,0,0.35)'],
    deco: { crackline: 20, pebble: 12, bones: 8, blotch: 10 }, decoCol: ['#3a2a48', '#2a1a38', '#5a3a68'],
    tree: 'dead', props: { pillar: 26, crystal: 10, brazier: 22 }, pool: 'lava', pools: 12, crystalHue: 1,
    ambient: 0.62, shade: '90,50,140', fog: '150,90,200', mote: 'ember', tint: 'rgba(150,60,255,0.14)',
    weights: { guardiaR: 4, ojo: 3, sombraC: 5 }, boss: 'carcelero', minion: 'sombraC',
  },
);
BIOMES[0].minion = 'tofu'; BIOMES[1].minion = 'arakne'; BIOMES[2].minion = 'tofu'; BIOMES[3].minion = 'tofu'; BIOMES[4].minion = 'tofu';
// los dos primeros mundos del Acto II y el del Acto III usan su propio arte: sin filtro de color
for (const id of ['hundida', 'cristal', 'ciudadela']) BIOMES.find((b) => b.id === id).mfilter = 'saturate(1.35) brightness(1.18)'; // resaltan sobre el fondo

// ---------- Súper Jefes ----------
Object.assign(SUPER_BOSSES, {
  hundida: { base: 'kraken', name: "Nereth, Herald of the Tide", filter: 'none', aura: '80,200,255', move: 'tide' },
  cristal: { base: 'ciervo', name: "Lysara, Herald of the Prism", filter: 'none', aura: '220,140,255', move: 'prism' },
  ciudadela: { base: 'carcelero', name: "Morvhal, the Locksmith", filter: 'none', aura: '200,90,255', move: 'lock', final: true },
});
Object.assign(HAZ_COL, { wave: '80,200,255', prism: '220,140,255', lock: '200,90,255' });

// ---------- Conjuntos y gemas ----------
Object.assign(SETS, {
  hundida: { name: "Deep Tide", color: '#5fd0ff', bonus: { 2: { hpP: 0.15 }, 4: { regenP: 0.3 }, 6: { armorP: 0.15, dmgP: 0.18 } } },
  cristal: { name: "Eternal Prism", color: '#d08aff', bonus: { 2: { critP: 0.08 }, 4: { dmgP: 0.18 }, 6: { critP: 0.12, spdP: 0.15 } } },
  ciudadela: { name: "Master Key", color: '#ffd76a', bonus: { 2: { dmgP: 0.15 }, 4: { hpP: 0.2 }, 6: { dmgP: 0.3, critP: 0.1 } } },
});
Object.assign(GEMS, {
  perla: { name: "Abyssal Pearl", color: '#7fe8ff', src: 'hundida', desc: "+25% max HP" },
  marea: { name: "Tide Gem", color: '#3a9ad8', src: 'hundida', desc: "+30% energy regen" },
  prisma: { name: "Prismatic Gem", color: '#e0a0ff', src: 'cristal', desc: "+12% crit" },
  cuarzo: { name: "Living Quartz", color: '#e8f8ff', src: 'cristal', desc: "+15% attack speed" },
  llave: { name: "Key Gem", color: '#ffd76a', src: 'ciudadela', desc: "+25% damage" },
});
{ // efectos de las gemas nuevas
  const _derived = derived;
  derived = function () {
    const d = _derived();
    const has = (g) => gemOn(g);
    if (has('perla')) d.maxHp = Math.round(d.maxHp * 1.25);
    if (has('marea')) d.paRegen *= 1.3;
    if (has('prisma')) d.crit = Math.min(0.85, d.crit + 0.12);
    if (has('cuarzo')) d.atkSpeed *= 1.15;
    if (has('llave')) d.dmgMul *= 1.25;
    return d;
  };
}

// ---------- Mecánicas de los Súper Jefes nuevos ----------
const SUPER_MOVES = {
  tide(e, n) {    // olas: franjas de agua que barren hacia el héroe
    const base = Math.atan2(P.y - e.y, P.x - e.x);
    for (let l = 0; l < 2 + n; l++) {
      const off = (l - (1 + n) / 2) * 70, nx = -Math.sin(base), ny = Math.cos(base);
      for (let j = 1; j <= 9; j++) addHazard('wave', e.x + Math.cos(base) * j * 50 + nx * off, e.y + Math.sin(base) * j * 50 + ny * off, 34, 0.7 + j * 0.08, e.dmg * 0.9, { src: e });
    }
    for (let i = 0; i < n; i++) { const a = rand(0, TAU); const m = spawnEnemy('medusa', e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80); poof(m.x, m.y); }
  },
  prism(e, n) {
    // haces de luz en estrella que giran
    const rays = 4 + n * 2, a0 = rand(0, TAU);
    for (let r = 0; r < rays; r++) {
      const a = a0 + (r / rays) * TAU;
      for (let j = 1; j <= 8; j++) addHazard('prism', e.x + Math.cos(a) * j * 48, e.y + Math.sin(a) * j * 48, 28, 0.9 + j * 0.05, e.dmg * 0.85, { src: e });
    }
  },
  lock(e, n) {
    // Morvhal: cerrojos alrededor del héroe y orbes que persiguen
    const R = 150;
    for (let i = 0; i < 6 + n * 2; i++) { const a = (i / (6 + n * 2)) * TAU; addHazard('lock', P.x + Math.cos(a) * R, P.y + Math.sin(a) * R, 40, 1.1, e.dmg * 1.1, { src: e }); }
    addHazard('lock', P.x, P.y, 70, 1.4, e.dmg * 1.4, { src: e });
    for (let i = 0; i < 3 + n; i++) enemyShoot(e, (i / (3 + n)) * TAU + now, 170, e.dmg * 0.9, 'homing', 10, 5);
    if (e.phase >= 1) for (let i = 0; i < 2; i++) { const a = rand(0, TAU); const m = spawnEnemy(pick(['sombraC', 'guardiaR']), e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90); poof(m.x, m.y); }
  }
};

// ============================================================
// Personajes de la trama de los Actos II y III
// ============================================================
for (const [id, G] of Object.entries(GODS)) SPEAKERS['god_' + id] = { name: G.name + ', ' + G.title, color: G.color, aura: G.rgb, img: 'img/gods/' + id + '.webp' };
Object.assign(SPEAKERS, {
  nereth: { name: "Nereth, Herald of the Tide", color: '#5fd0ff', aura: '80,200,255', img: 'img/portraits/nereth.webp' },
  lysara: { name: "Lysara, Herald of the Prism", color: '#e0a0ff', aura: '220,140,255', img: 'img/portraits/lysara.webp' },
});
SPEAKERS.morvhal.img = 'img/portraits/morvhal.webp';
// retratos de los Súper Jefes (se usan cuando habla «boss»)
const _speakerInfo = speakerInfo;
speakerInfo = function (who, ctx) {
  const sp = _speakerInfo(who, ctx);
  if (who === 'boss') sp.img = 'img/portraits/boss_' + BIOMES[ctx.b].id + '.webp';
  return sp;
};

// ============================================================
// Misiones personales de los héroes
// after: mundo cuyo Súper Jefe abre la misión · target: mundo donde hay que cerrar una Grieta
// ============================================================
const HERO_QUESTS = {
  cra: { after: 0, target: 1, title: "Flurry", goal: "Find your hawk in the Gloomy Swamp",
    start: [['hero', "Gust hasn't come back since we entered the Swamp. He never takes this long."], ['ivo', "Hawks hate the swamp, {hero}. If he's there, something is holding him."]],
    end: [['hero', "Gust! He was caught in an Ashweaver web… but he's still alive."], ['god_punteria', "Ilvra saw it all. A hunter who goes back for his companion deserves my favor."]] },
  iop: { after: 1, target: 2, title: "My father's helm", goal: "Find the lost forge on the Runic Glacier",
    start: [['tobias', "Kara, your father left a mountain forge before he died. They say it was on the Glacier."], ['hero', "Then his last helm is still there. I'm going for it."]],
    end: [['hero', "Found it. Helm iron, tempered in ice. Just like he used to say."], ['tobias', "Not even I can get a temper like that. Wear it with pride, girl."]] },
  artificiera: { after: 2, target: 3, title: "The amber core", goal: "Get a core of pure amber in the Desert",
    start: [['hero', "Ivo, if I get pure amber from the desert I can build the ultimate bomb."], ['ivo', "Or blow up half the village. Bring it, but we keep it far from my herbs."]],
    end: [['hero', "An amber core! It glows like a tiny sun. My bombs will never be the same."], ['god_fiesta', "Ha, ha! Panzo approves of explosions. A toast to you, little one."]] },
  feca: { after: 3, target: 4, title: "The Tower's pages", goal: "Recover the writings of the Tower of Runes in the Abyss",
    start: [['ivo', "Elara, when the Tower fell, the Abyss swallowed its library. There may be pages left."], ['hero', "If they're there, I'll find them. I need to know how they closed the first Rift."]],
    end: [['hero', "I have them. The Order didn't close the Rift: they held it. Someone always has to hold it."], ['god_escudo', "Aldemar knows about that. Your aegis is now mine too."]] },
  sombra: { after: 4, target: 5, title: "The lost crew", goal: "Find out what happened to your old gang in the Sunken City",
    start: [['hero', "My old smuggling gang went into a Rift at the harbor. They never came back."], ['brunilda', "Smugglers? I haven't heard a thing. But if they come back, they owe me money."]],
    end: [['hero', "They were in Aelmar. Nereth had turned them into sailors of his tide. They're free now."], ['god_veneno', "Nharas protects those who live in the shadows. And you've brought yours out of them."]] },
  domadora: { after: 5, target: 6, title: "The crystal pack", goal: "Free the pack trapped in the Crystal Forest",
    start: [['hero', "The grey she-wolf howls toward the crystal forest every night. Her pack is there."], ['ivo', "Lysara's song must have frozen them. Break the crystal without breaking them, Ayla."]],
    end: [['hero', "They're alive! Cold and furious, but alive. The pack is coming home."], ['god_bestias', "Drakhon never forgets those who don't leave their pack behind."]] },
  berserker: { after: 6, target: 7, title: "The clan's runes", goal: "Find the spirits of your clan in the Citadel",
    start: [['hero', "The Jailer keeps Morvhal's dead. My clan is with them. I feel it in the runes."], ['ivo', "Then the Citadel awaits you twice, Brann."]],
    end: [['hero', "I saw them. They sang me the war song one last time. Now they rest."], ['god_sangre', "Kharra honors the blood your people shed. Your fury is now mine too."]] },
};
const nodesCleared = (b) => { let c = 0; for (let n = 1; n <= LEVELS_PER_BIOME; n++) c += clearedDiffs(b, n) ? 1 : 0; return c + (clearedDiffs(b, 'S') ? 1 : 0); };
const heroQuest = () => (S && HERO_QUESTS[S.cls]) || null;
function hqState() { if (!S.hq) S.hq = { stage: 0 }; return S.hq; }
const hqDone = () => !!(S && S.hq && S.hq.stage === 2);
// recompensa: +10% de daño y de vida para ese héroe
{
  const _derived2 = derived;
  derived = function () {
    const d = _derived2();
    if (hqDone()) { d.dmgMul *= 1.1; d.maxHp = Math.round(d.maxHp * 1.1); }
    return d;
  };
}
function checkHeroQuest(tries = 0) {
  const q = heroQuest(); if (!q || !S) return;
  if (state === 'dialog' || dlg) { if (tries < 40) setTimeout(() => checkHeroQuest(tries + 1), 800); return; }
  if (state !== 'hub') return;
  const st = hqState();
  if (st.stage === 0 && superDone(q.after)) {
    st.stage = 1; st.base = nodesCleared(q.target); persist();
    playDialog(q.start, { onEnd: () => { showStoryCard("Quest of " + CLASS_LORE[S.cls].hero, q.title); buildHub(); } });
  } else if (st.stage === 1 && nodesCleared(q.target) > (st.base || 0)) {
    st.stage = 2; persist(); if (P) recalc();
    playDialog(q.end, { onEnd: () => { showStoryCard("Quest complete", q.title + " · +10% damage and health"); buildHub(); } });
  }
}
const _goHubQ = goHub;
goHub = function () { _goHubQ(); setTimeout(checkHeroQuest, 1600); };
const _buildHubQ = buildHub;
buildHub = function () {
  _buildHubQ();
  const q = heroQuest(), st = S && S.hq;
  if (!q || !st || st.stage !== 1) return;
  $('hubChar').insertAdjacentHTML('beforeend', `<div class="hubQuest" title="${q.goal}">⚔ <b>${q.title}</b> · ${q.goal}</div>`);
};

// ============================================================
// Pactos de las Grietas: mejoras permanentes con ámbar (estilo «Espejo» de Hades), en la tienda de Maese Ivo
// ============================================================
Object.assign(UPGRADES, {
  dados: { name: "Dice of Fate", max: 3, cost: (l) => upCost(1500, 1.8, l), desc: (l) => `You can reroll the blessings a god offers you (${l} → ${l + 1} times per Rift)` },
  favor: { name: "Favor of the Twelve", max: 5, cost: (l) => upCost(1200, 1.5, l), desc: (l) => `More rare, epic and heroic blessings (now +${l * 20}%)` },
  aliento: { name: "Death Defiance", max: 2, cost: (l) => [4000, 12000][l], desc: (l) => `You come back to life with half health (${l} → ${l + 1} times per Rift)` },
  puerta: { name: "Key of Doors", max: 1, cost: () => 6000, desc: () => "A second choice of doors appears at 75% of every Rift" },
  regateo: { name: "Haggling", max: 5, cost: (l) => upCost(800, 1.45, l), desc: (l) => `The wandering Merchant charges you less (now -${l * 8}%)` },
  ofrenda: { name: "Opening offering", max: 1, cost: () => 8000, desc: () => "Every Rift starts with a god's Altar beside you" },
});
const upL = (k) => (S && S.up && S.up[k]) || 0;
rollRarity = (function (orig) {
  return function () {
    const f = upL('favor');
    if (f && Math.random() < f * 0.12) return Math.min(3, orig() + 1);
    return orig();
  };
})(rollRarity);
const _warePrice = warePrice;
warePrice = (id) => Math.round(_warePrice(id) * (1 - 0.08 * upL('regateo')));
const _openBoonPickW = openBoonPick;
openBoonPick = function (al) {
  _openBoonPickW(al);
  const b = bst();
  if (!b || !(b.rerolls > 0)) return;
  $('boonPick').querySelector('.bp-box').insertAdjacentHTML('beforeend', `<button class="btn bp-reroll" type="button">🎲 Reroll (${b.rerolls})</button>`);
  $('boonPick').querySelector('.bp-reroll').onclick = (ev) => {
    ev.stopPropagation(); b.rerolls--; SFX.play('click');
    $('boonPick').classList.remove('show'); state = boonOffer.prev === 'boon' ? 'play' : boonOffer.prev;
    openBoonPick(al);
  };
};
const _boonInitW = boonInit;
boonInit = function () {
  _boonInitW();
  Object.assign(rift.bn, { rerolls: upL('dados'), lives: upL('aliento'), door2: false });
  if (upL('ofrenda')) later(3.4, () => {
    const b = bst(); if (!b || !P) return;
    const god = pick(Object.keys(GODS)); b.lastGod = god;
    b.altars.push({ x: clamp(P.x + 110, 80, WORLD.w - 80), y: clamp(P.y - 40, 80, WORLD.h - 80), god, t: 0 });
  });
};
const _boonUpdateW = boonUpdate;
boonUpdate = function (dt) {
  _boonUpdateW(dt);
  const b = bst();
  if (b && state === 'play' && upL('puerta') && !b.door2 && !rift.isSuper && !rift.bossSpawned && rift.progress / rift.goal >= 0.75 && !b.doors.length) { b.door2 = true; spawnDoors(); }
};
const _playerDiedW = playerDied;
playerDied = function () {
  const b = bst();
  if (b && b.lives > 0 && state === 'play') {
    b.lives--;
    P.hp = Math.round(P.maxHp * 0.5); P.invul = 2.5;
    rings.push({ x: P.x, y: P.y, r0: 10, r1: 220, life: 0.8, max: 0.8, color: 'rgba(255,220,140,' });
    showBanner("Death Defiance!", '#ffd76a', b.lives ? `${b.lives} left` : "That was the last one");
    SFX.play('heal');
    return;
  }
  _playerDiedW();
};
