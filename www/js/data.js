/* Fendaria — datos del juego: clases, monstruos, objetos, gemas. */
'use strict';

const CLASSES = {
  iop: {
    name: 'Rompeyelmos', role: 'Guerrera cuerpo a cuerpo', color: '#b8322a', hair: '#c0562a',
    desc: 'Yelmo con cuernos y hacha de doble filo. Barre a los enemigos en arco y salta al centro de la pelea.',
    hp: 130, speed: 165, basicMul: 1.4, weapon: { icon: '🪓', names: ['Hacha', 'Gran hacha', 'Hacha de guerra'] },
    skills: [
      { name: 'Embestida Sísmica', icon: '⤴', cost: 3, cd: 2.2, desc: 'Salta sobre el enemigo y aplasta la zona' },
      { name: 'Furia Ígnea', icon: '✸', cost: 6, cd: 6, desc: 'Un tajo de fuego descomunal tras una breve carga' },
    ],
  },
  cra: {
    name: 'Ojo de Halcón', role: 'Explorador a distancia', color: '#2f7f86', hair: '#efe3c8',
    desc: 'Capucha con pluma de halcón y arco largo. Dispara sin parar y castiga a los grupos desde lejos.',
    hp: 95, speed: 178, basicMul: 0.95, weapon: { icon: '🏹', names: ['Arco', 'Arco largo', 'Arco corto'] },
    skills: [
      { name: 'Flecha Ígnea', icon: '✹', cost: 3, cd: 1.4, desc: 'Flecha que estalla en área' },
      { name: 'Tormenta de Flechas', icon: '☄', cost: 5, cd: 5, desc: 'Una lluvia de flechas cae sobre la zona' },
    ],
  },
  feca: {
    name: 'Runista', role: 'Mago protector', color: '#5b3f8f', hair: '#3f9cc4',
    desc: 'Túnica de runas y bastón de ámbar. Escudos que absorben daño y círculos rúnicos que queman.',
    hp: 115, speed: 160, basicMul: 1.05, weapon: { icon: '🪄', names: ['Bastón', 'Varita', 'Cetro'] },
    skills: [
      { name: 'Égida Rúnica', icon: '⛨', cost: 3, cd: 6, desc: 'Escudo protector y onda de empuje' },
      { name: 'Runa de Fuego', icon: '✺', cost: 5, cd: 5, desc: 'Círculo rúnico que quema y ralentiza' },
    ],
  },
};

// lvl: nivel base del monstruo dentro de la Grieta 1; prog: cuánto llena la barra de la Grieta
const ENEMIES = {
  tofu:        { name: 'Chispín',         hp: 10,  speed: 150, dmg: 5,  r: 11, xp: 2,   kamas: [1, 2],   ai: 'chase',   blood: '#ff9a3d', kbRes: 1.2,  lvl: 1, prog: 1 },
  bouftou:     { name: 'Jabalí Musgoso',  hp: 30,  speed: 72,  dmg: 9,  r: 17, xp: 4,   kamas: [2, 4],   ai: 'charger', blood: '#8a5a3a', kbRes: 1,    lvl: 2, prog: 1.5 },
  arakne:      { name: 'Tejeceniza',      hp: 18,  speed: 105, dmg: 7,  r: 13, xp: 3,   kamas: [1, 3],   ai: 'zigzag',  blood: '#ff7a2a', kbRes: 1.1,  lvl: 2, prog: 1.2 },
  pissenlit:   { name: 'Seta Escupidora', hp: 22,  speed: 55,  dmg: 8,  r: 13, xp: 4,   kamas: [2, 4],   ai: 'shooter', blood: '#7fe0e8', kbRes: 0.8,  lvl: 3, prog: 1.5 },
  craqueleur:  { name: 'Gólem de Basalto',hp: 150, speed: 42,  dmg: 18, r: 25, xp: 16,  kamas: [6, 12],  ai: 'slammer', blood: '#ff8a3d', kbRes: 0.25, lvl: 5, prog: 5 },
  bouftouRoyal:{ name: 'Colmillo Ancestral', hp: 900, speed: 68,  dmg: 16, r: 38, xp: 150, kamas: [60, 90], ai: 'boss',    blood: '#8a5a3a', kbRes: 0.08, lvl: 4, prog: 0, boss: true },
  tofuRoyal:   { name: 'Garra Ígnea',     hp: 750, speed: 120, dmg: 14, r: 30, xp: 150, kamas: [60, 90], ai: 'bossTofu',blood: '#ff7a2a', kbRes: 0.1,  lvl: 4, prog: 0, boss: true },
};

const ELITES = [
  { suffix: 'Negro Vampiro', color: '#ab47bc', vampire: true },
  { suffix: 'Dorado',        color: '#ffca28', kamas: 4 },
  { suffix: 'Furioso',       color: '#ff5722', speed: 1.4 },
  { suffix: 'Ancestral',     color: '#26c6da', size: 1.3 },
];

// ---------- Objetos ----------
const RARITY = [
  { name: 'Común',      color: '#e8e2d0', affixes: 1, mul: 1,    beam: 'rgba(255,255,255,0)' },
  { name: 'Raro',       color: '#4fc3f7', affixes: 2, mul: 1.25, beam: 'rgba(79,195,247,0.0)' },
  { name: 'Épico',      color: '#ce93d8', affixes: 3, mul: 1.55, beam: 'rgba(206,147,216,0.55)' },
  { name: 'Legendario', color: '#ffa726', affixes: 4, mul: 2,    beam: 'rgba(255,167,38,0.7)' },
];

const SLOTS = ['arma', 'sombrero', 'capa', 'amuleto', 'anillo', 'botas', 'cinturon'];
const SLOT_INFO = {
  arma:     { name: 'Arma' },
  sombrero: { name: 'Sombrero', icon: '🎩', names: ['Sombrero', 'Casco', 'Gorro'] },
  capa:     { name: 'Capa',     icon: '🧣', names: ['Capa', 'Capucha', 'Manto'] },
  amuleto:  { name: 'Amuleto',  icon: '📿', names: ['Amuleto', 'Collar'] },
  anillo:   { name: 'Anillo',   icon: '💍', names: ['Anillo', 'Sortija'] },
  botas:    { name: 'Botas',    icon: '👢', names: ['Botas', 'Sandalias'] },
  cinturon: { name: 'Cinturón', icon: '🎗', names: ['Cinturón', 'Faja'] },
};
const FAMILIES = ['del Jabalí', 'de Ceniza', 'de la Tejeceniza', 'de la Seta', 'del Basalto', 'de Candela', 'de la Grieta', 'del Aventurero', 'de Ámbar', 'del Halcón'];

const STAT_INFO = {
  vit:  { name: 'Vitalidad',     short: 'Vit',  base: 7,   desc: '+2 PV por punto' },
  sab:  { name: 'Sabiduría',     short: 'Sab',  base: 3,   desc: '+1% XP y +0,5% recarga de energía' },
  fue:  { name: 'Fuerza',        short: 'Fue',  base: 4,   desc: '+1% de daño' },
  int:  { name: 'Inteligencia',  short: 'Int',  base: 4,   desc: '+1,5% daño de hechizos' },
  sue:  { name: 'Suerte',        short: 'Sue',  base: 4,   desc: '+0,15% crítico y +0,5% ámbar' },
  agi:  { name: 'Agilidad',      short: 'Agi',  base: 4,   desc: '+0,6% vel. de ataque' },
  dmg:  { name: 'Daños',         short: 'Daños', base: 1 },
  crit: { name: '% Crítico',     short: '% Crít', base: 0.5 },
  res:  { name: '% Resistencia', short: '% Res', base: 0.5 },
  pros: { name: 'Prospección',   short: 'Pros', base: 4 },
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
const GEMS = {
  turquesa:  { name: 'Gema de Zafiro',   color: '#3f9cc4', desc: '+10% de golpes críticos' },
  esmeralda: { name: 'Gema Esmeralda',   color: '#43a047', desc: '+20% de PV máximos' },
  purpura:   { name: 'Gema Granate',     color: '#c0392b', desc: '+15% de daño' },
  ocre:      { name: 'Gema Solar',       color: '#f9a825', desc: 'La energía se recarga un 30% más rápido' },
};
