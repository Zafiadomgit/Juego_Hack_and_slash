/* Fendaria — datos del juego: clases, monstruos, objetos, gemas. */
'use strict';

const CLASSES = {
  iop: {
    name: "Helmbreaker", role: "Melee warrior", color: '#b8322a', hair: '#c0562a',
    desc: "Horned helm and a double-bladed axe. Sweeps enemies in an arc and leaps into the middle of the fight.",
    hp: 130, speed: 165, basicMul: 1.4, weapon: { icon: '🪓', names: ["Axe", "Great axe", "War axe"] },
    skills: [
      { name: "Seismic Leap", icon: '⤴', cost: 3, cd: 2.2, desc: "Leaps onto the enemy and crushes the area" },
      { name: "Fiery Fury", icon: '✸', cost: 6, cd: 6, desc: "A colossal fire slash after a brief wind-up" },
    ],
  },
  cra: {
    name: "Hawkeye", role: "Ranged scout", color: '#2f7f86', hair: '#efe3c8',
    desc: "Hawk-feather hood and longbow. Shoots non-stop and punishes groups from afar.",
    hp: 95, speed: 178, basicMul: 0.95, weapon: { icon: '🏹', names: ["Bow", "Longbow", "Shortbow"] },
    skills: [
      { name: "Fire Arrow", icon: '✹', cost: 3, cd: 1.4, desc: "An arrow that explodes in an area" },
      { name: "Arrow Storm", icon: '☄', cost: 5, cd: 5, desc: "A rain of arrows falls on the area" },
    ],
  },
  feca: {
    name: "Runecaster", role: "Protective mage", color: '#5b3f8f', hair: '#3f9cc4',
    desc: "Rune-stitched robe and amber staff. Shields that absorb damage and rune circles that burn.",
    hp: 115, speed: 160, basicMul: 1.05, weapon: { icon: '🪄', names: ["Staff", "Wand", "Scepter"] },
    skills: [
      { name: "Runic Aegis", icon: '⛨', cost: 3, cd: 6, desc: "Protective shield and a pushback wave" },
      { name: "Fire Rune", icon: '✺', cost: 5, cd: 5, desc: "A rune circle that burns and slows" },
    ],
  },
};

// Información de la pantalla de selección: quién es, cómo se juega y su historia
const CLASS_LORE = {
  iop: {
    hero: 'Kara', epithet: "the Helmbreaker",
    summary: "Frontline warrior. Takes a lot of punishment, hits everything nearby in an arc and leaps into the middle of the fight with her axe.",
    playstyle: "Ideal if you like straightforward melee: get close, spin the axe and don't stop.",
    stats: { Vida: 5, Daño: 4, Alcance: 1, Defensa: 4, Movilidad: 3 }, difficulty: 1,
    story: "Kara grew up among the forges of Candela Village, where her father tempered helms for the guard. The night the first Rift opened, monsters ravaged the smithy and she held them back with a woodcutter's axe. Since then she carries that axe, riveted with helm iron, and has sworn to split every helmet that crosses the Portal.",
  },
  cra: {
    hero: 'Teo', epithet: "Hawkeye",
    summary: "Ranged scout. Shoots non-stop and punishes groups from afar with explosive arrows and arrow rain, but has little health.",
    playstyle: "For those who prefer to keep their distance: move, dodge and don't let them surround you.",
    stats: { Vida: 2, Daño: 4, Alcance: 5, Defensa: 2, Movilidad: 5 }, difficulty: 2,
    story: "Teo was a hunter in the woods around the village, before they turned to ash. He followed the beasts' trail to the first Rift and learned to read its paths like no one else. They say he never misses a shot and that his hawk flies ahead of him to warn him of what waits on the other side of the Portal.",
  },
  feca: {
    hero: 'Elara', epithet: "the Runecaster",
    summary: "Rune arcanist. Shields herself with barriers that absorb damage, pushes enemies away and burns the ground with rune circles.",
    playstyle: "Balanced and safe: use the Aegis when you're surrounded and let the runes do the work.",
    stats: { Vida: 3, Daño: 4, Alcance: 4, Defensa: 5, Movilidad: 2 }, difficulty: 2,
    story: "Elara was the youngest apprentice in the Tower of Runes when the Rift split it in two. She survived locked behind a rune shield she didn't yet know how to hold. Now she studies the Rifts from the inside: she believes the runes glowing on their edges are a lock, and that someone, somewhere, has the key.",
  },
};

// lvl: nivel base del monstruo dentro de la Grieta 1; prog: cuánto llena la barra de la Grieta
const ENEMIES = {
  tofu:        { name: "Sparky",         hp: 10,  speed: 150, dmg: 5,  r: 11, xp: 2,   kamas: [1, 2],   ai: 'chase',   blood: '#ff9a3d', kbRes: 1.2,  lvl: 1, prog: 1 },
  bouftou:     { name: "Mossy Boar",  hp: 30,  speed: 72,  dmg: 9,  r: 17, xp: 4,   kamas: [2, 4],   ai: 'charger', blood: '#8a5a3a', kbRes: 1,    lvl: 2, prog: 1.5 },
  arakne:      { name: "Ashweaver",      hp: 18,  speed: 105, dmg: 7,  r: 13, xp: 3,   kamas: [1, 3],   ai: 'zigzag',  blood: '#ff7a2a', kbRes: 1.1,  lvl: 2, prog: 1.2 },
  pissenlit:   { name: "Spitting Shroom", hp: 22,  speed: 55,  dmg: 8,  r: 13, xp: 4,   kamas: [2, 4],   ai: 'shooter', blood: '#7fe0e8', kbRes: 0.8,  lvl: 3, prog: 1.5 },
  craqueleur:  { name: "Basalt Golem",hp: 150, speed: 42,  dmg: 18, r: 25, xp: 16,  kamas: [6, 12],  ai: 'slammer', blood: '#ff8a3d', kbRes: 0.25, lvl: 5, prog: 5 },
  bouftouRoyal:{ name: "Ancestral Fang", hp: 900, speed: 68,  dmg: 16, r: 38, xp: 150, kamas: [60, 90], ai: 'boss',    blood: '#8a5a3a', kbRes: 0.08, lvl: 4, prog: 0, boss: true },
  tofuRoyal:   { name: "Fiery Claw",     hp: 750, speed: 120, dmg: 14, r: 30, xp: 150, kamas: [60, 90], ai: 'bossTofu',blood: '#ff7a2a', kbRes: 0.1,  lvl: 4, prog: 0, boss: true },
  reinaTeje:   { name: "Ashweaver Queen", hp: 820, speed: 95, dmg: 15, r: 34, xp: 160, kamas: [60, 90], ai: 'bossSpider', blood: '#9be05a', kbRes: 0.08, lvl: 4, prog: 0, boss: true },
  colosoHielo: { name: "Frost Colossus", hp: 1100, speed: 52, dmg: 20, r: 40, xp: 170, kamas: [70, 100], ai: 'bossGolem', blood: '#bfe4ff', kbRes: 0.03, lvl: 4, prog: 0, boss: true },
  hechicero:   { name: "Abyss Sorcerer", hp: 760, speed: 85, dmg: 15, r: 26, xp: 180, kamas: [70, 110], ai: 'bossMage', blood: '#c07cf0', kbRes: 0.12, lvl: 4, prog: 0, boss: true },
};

const ELITES = [
  { suffix: "Vampire Black", color: '#ab47bc', vampire: true },
  { suffix: "Golden",        color: '#ffca28', kamas: 4 },
  { suffix: "Furious",       color: '#ff5722', speed: 1.4 },
  { suffix: "Ancestral",     color: '#26c6da', size: 1.3 },
  { suffix: "Armored",     color: '#b0bec5', armor: 0.45, minF: 3 },
  { suffix: "Explosive",     color: '#ff9100', explode: true, minF: 4 },
];

// ---------- Objetos ----------
const RARITY = [
  { name: "Common",      color: '#e8e2d0', affixes: 1, mul: 1,    beam: 'rgba(255,255,255,0)' },
  { name: "Rare",       color: '#4fc3f7', affixes: 2, mul: 1.7,  beam: 'rgba(79,195,247,0.0)' },
  { name: "Epic",      color: '#ce93d8', affixes: 3, mul: 2.8,  beam: 'rgba(206,147,216,0.55)' },
  { name: "Legendary", color: '#ffa726', affixes: 4, mul: 4.5,  beam: 'rgba(255,167,38,0.7)' },
];

const SLOTS = ['arma', 'sombrero', 'capa', 'amuleto', 'anillo', 'botas', 'cinturon'];
const SLOT_INFO = {
  arma:     { name: "Weapon" },
  sombrero: { name: "Hat", icon: '🎩', names: ["Hat", "Helmet", "Cap"] },
  capa:     { name: "Cape",     icon: '🧣', names: ["Cape", "Hood", "Mantle"] },
  amuleto:  { name: "Amulet",  icon: '📿', names: ["Amulet", "Necklace"] },
  anillo:   { name: "Ring",   icon: '💍', names: ["Ring", "Signet"] },
  botas:    { name: "Boots",    icon: '👢', names: ["Boots", "Sandals"] },
  cinturon: { name: "Belt", icon: '🎗', names: ["Belt", "Sash"] },
};
const FAMILIES = ["of the Boar", "of Ash", "of the Ashweaver", "of the Shroom", "of Basalt", "of Candela", "of the Rift", "of the Adventurer", "of Amber", "of the Hawk"];

const STAT_INFO = {
  vit:  { name: "Vitality",     short: 'Vit',  base: 7,   desc: "+2 HP per point" },
  sab:  { name: "Wisdom",     short: "Wis",  base: 3,   desc: "+1% XP and +0.5% energy regen" },
  fue:  { name: "Strength",        short: "Str",  base: 4,   desc: "+1% damage" },
  int:  { name: "Intelligence",  short: 'Int',  base: 4,   desc: "+1.5% spell damage" },
  sue:  { name: "Luck",        short: "Lck",  base: 4,   desc: "+0.15% crit and +0.5% amber" },
  agi:  { name: "Agility",      short: 'Agi',  base: 4,   desc: "+0.6% attack speed" },
  dmg:  { name: "Damage",         short: "Damage", base: 1 },
  crit: { name: "% Critical",     short: "% Crit", base: 0.5 },
  res:  { name: "% Resistance", short: '% Res', base: 0.5 },
  pros: { name: "Prospecting",   short: 'Pros', base: 4 },
};
const CORE_STATS = ['vit', 'sab', 'fue', 'int', 'sue', 'agi'];
const AFFIX_POOL = ['vit', 'vit', 'sab', 'fue', 'fue', 'int', 'int', 'sue', 'agi', 'agi', 'dmg', 'crit', 'res', 'pros'];

function rollRarity(bonus = 0) {
  const r = Math.random() * 100 - bonus;
  if (r < 2.5) return 3;
  if (r < 13) return 2;
  if (r < 40) return 1;
  return 0;
}

function makeItem(cls, level, rarity, opts = {}) {
  const slot = opts.slot || pick(SLOTS);
  const R = RARITY[rarity];
  let icon, base;
  if (slot === 'arma') { icon = CLASSES[cls].weapon.icon; base = pick(CLASSES[cls].weapon.names); }
  else { icon = SLOT_INFO[slot].icon; base = pick(SLOT_INFO[slot].names); }
  const name = opts.name ? `${base} ${opts.name}` : `${base} ${pick(FAMILIES)}`;
  const stats = {};
  if (slot === 'arma') stats.dmg = Math.round((3 + level * 1.6) * R.mul);
  const pool = AFFIX_POOL.slice();
  for (let i = 0; i < R.affixes; i++) {
    const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const v = STAT_INFO[k].base * (1 + level * 0.45) * R.mul * rand(0.75, 1.2);
    stats[k] = (stats[k] || 0) + Math.max(1, Math.round(k === 'crit' || k === 'res' ? Math.min(v, 12) : v));
    pool.splice(0, pool.length, ...pool.filter((x) => x !== k));
  }
  return {
    id: Math.random().toString(36).slice(2, 10),
    slot, name, icon, rarity, level, stats,
    value: Math.round((6 + level * 4) * (1 + rarity * 1.8)),
  };
}

function itemPower(it) {
  if (!it) return 0;
  let s = 0;
  for (const [k, v] of Object.entries(it.stats)) {
    s += k === 'dmg' ? v * 4 : k === 'crit' || k === 'res' ? v * 3 : v;
  }
  return s;
}

// ---------- Gemas Ancestrales (bonus permanentes) ----------
// Se consiguen al vencer al Guardián (o Súper Jefe) del mundo indicado en `src`; 'super' = cualquier Súper Jefe.
// Hay que engarzarlas (3 huecos, ver GEM_SLOTS) para que den su bonus; se pueden cambiar cuando quieras.
const GEMS = {
  purpura:   { name: "Garnet Gem",     color: '#c0392b', src: 'ceniza',   desc: "+15% damage" },
  brasa:     { name: "Ember Gem",    color: '#ff7a2a', src: 'ceniza',   desc: "+12% attack speed" },
  esmeralda: { name: "Emerald Gem",   color: '#43a047', src: 'pantano',  desc: "+20% max HP" },
  musgo:     { name: "Moss Gem",    color: '#8bc34a', src: 'pantano',  desc: "You recover 1% of your HP every second" },
  turquesa:  { name: "Sapphire Gem",   color: '#3f9cc4', src: 'glaciar',  desc: "+10% crit chance" },
  escarcha:  { name: "Frost Gem", color: '#9fe0ff', src: 'glaciar',  desc: "-12% damage taken" },
  ocre:      { name: "Sun Gem",       color: '#f9a825', src: 'desierto', desc: "Energy recharges 30% faster" },
  ambar:     { name: "Amber Gem",    color: '#ffb84a', src: 'desierto', desc: "+40% amber and a wider pickup radius" },
  vacio:     { name: "Void Gem",   color: '#9c5bd8', src: 'abismo',   desc: "Crits deal 40% more damage" },
  obsidiana: { name: "Obsidian Gem",color: '#5a4a6a', src: 'abismo',   desc: "+25% spell damage" },
  fenix:     { name: "Phoenix Heart", color: '#ff5a3d', src: 'super',    desc: "Your ultimate charges 50% faster" },
  titan:     { name: "Titan Heart", color: '#e0d6a8', src: 'super',    desc: "+10% damage and +10% HP" },
};
const GEM_SLOTS = 3;
const gemsFor = (biomeId, isSuper) => Object.keys(GEMS).filter((k) => GEMS[k].src === biomeId || (isSuper && GEMS[k].src === 'super'));

// ---------- Qué hace cada característica (texto + efecto actual) ----------
const STAT_HELP = {
  vit: { what: "+2 HP per point", short: 'PV', now: (t) => `+${t.vit * 2} PV` },
  sab: { what: "+1% XP and +0.5% energy regen per point", short: 'XP', now: (t) => `+${t.sab}% XP` },
  fue: { what: "+1% to all your damage per point", short: "damage", now: (t) => `+${t.fue}% damage` },
  int: { what: "+1.5% spell damage per point", short: 'hechizos', now: (t) => `+${Math.round(t.int * 1.5)}% spells` },
  sue: { what: "+0.15% crit and +0.5% amber per point", short: "crit", now: (t) => `+${(t.sue * 0.15).toFixed(1)}% crit` },
  agi: { what: "+0.6% attack speed and a bit of movement per point", short: 'velocidad', now: (t) => `+${Math.round(t.agi * 0.6)}% atk. speed` },
};
// Características recomendadas por clase
const STAT_REC = { iop: ['fue', 'vit'], cra: ['agi', 'sue'], feca: ['int', 'vit'] };

// ---------- Mercader ----------
// Elixires: se consumen al entrar en la siguiente Grieta y duran toda la Grieta
const ELIXIRS = {
  furia:   { name: "Elixir of Fury",          color: '#c0392b', hi: '#ffb07a', desc: "+30% damage for one Rift", base: 120 },
  piedra:  { name: "Stoneskin Elixir", color: '#7d8a96', hi: '#dfe8ee', desc: "-25% damage taken for one Rift", base: 120 },
  sabio:   { name: "Sage's Elixir",         color: '#8e5ad0', hi: '#e2c8ff', desc: "+50% experience for one Rift", base: 100 },
  fortuna: { name: "Elixir of Fortune",        color: '#e8b64c', hi: '#fff3c4', desc: "+50% amber and more rare items for one Rift", base: 150 },
};
// Mejoras permanentes (por personaje)
// Coste creciente (redondeado a 50): las mejoras son el gran destino del ámbar a lo largo de toda la partida
const upCost = (base, k, l) => Math.round((base * Math.pow(k, l)) / 50) * 50;
const UPGRADES = {
  afilador: { name: "Whetstone",   max: 15, cost: (l) => upCost(500, 1.32, l), desc: (l) => `+5% damage forever (now +${l * 5}%)` },
  vigor:    { name: "Vigor talisman",  max: 15, cost: (l) => upCost(500, 1.32, l), desc: (l) => `+5% max HP forever (now +${l * 5}%)` },
  piel:     { name: "Tanned hide",       max: 10, cost: (l) => upCost(600, 1.38, l), desc: (l) => `-2% damage taken (now -${l * 2}%)` },
  energia:  { name: "Energy crystal", max: 10, cost: (l) => upCost(500, 1.38, l), desc: (l) => `+6% energy regen (now +${l * 6}%)` },
  fortuna:  { name: "Lucky clover", max: 10, cost: (l) => upCost(400, 1.4, l), desc: (l) => `+5% amber in Rifts (now +${l * 5}%)` },
  reflejos: { name: "Reflex boots",  max: 2,  cost: (l) => [3000, 15000][l], desc: (l) => `+1 dodge charge (now ${3 + l})` },
  iman:     { name: "Amber magnet",      max: 4,  cost: (l) => upCost(300, 2, l), desc: (l) => `+25% radius to pull in amber and XP (now +${l * 25}%)` },
  bolsa:    { name: "Larger bag",     max: 4,  cost: (l) => 400 + l * 400, desc: (l) => `+6 bag slots (${36 + 6 * l} → ${42 + 6 * l})` },
  cinto:    { name: "Potion belt",  max: 3,  cost: (l) => 250 + l * 250, desc: (l) => `Carry up to ${6 + l} potions (now ${5 + l})` },
};
