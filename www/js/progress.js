/* Fendaria — mapa de Grietas: niveles por bioma, dificultades, conjuntos y súper jefes.
 * Cada bioma tiene LEVELS_PER_BIOME Grietas y un Súper Jefe al final.
 * Cada Grieta tiene 3 dificultades que se desbloquean en orden (Fácil → Medio → Difícil).
 * Superar una Grieta (en cualquier dificultad) desbloquea la siguiente; el Súper Jefe abre el bioma siguiente.
 */
'use strict';

const LEVELS_PER_BIOME = 7;

const DIFFS = [
  // rar: calidades que pueden caer (la baja y la alta); hi: probabilidad base de la alta
  { id: 'facil',   name: 'Fácil',   color: '#7cc457', hp: 1,   dmg: 1,   lvl: 0, threat: 0, reward: 1,   rarity: 0,  rar: [0, 1], hi: 0.25, set: 0.10, eliteSet: 0 },
  { id: 'medio',   name: 'Medio',   color: '#f0b030', hp: 2.1, dmg: 1.5, lvl: 3, threat: 2, reward: 1.6, rarity: 8,  rar: [1, 2], hi: 0.25, set: 0.30, eliteSet: 0.01 },
  { id: 'dificil', name: 'Difícil', color: '#ff4a3d', hp: 4.2, dmg: 2.2, lvl: 6, threat: 4, reward: 2.5, rarity: 18, rar: [2, 3], hi: 0.25, set: 0.60, eliteSet: 0.03 },
];

// Calidad del botín según la dificultad: Fácil = Común/Raro, Medio = Raro/Épico, Difícil = Épico/Legendario
function rollDiffRarity(DF, bonus = 0) {
  return Math.random() < Math.min(0.9, DF.hi + bonus) ? DF.rar[1] : DF.rar[0];
}
const rarityRangeText = (DF) => DF.rar.map((r) => `<span style="color:${RARITY[r].color}">${RARITY[r].name}</span>`).join(' y ');

// Conjuntos de equipo (uno por bioma). Bonus por piezas equipadas: 2, 4 y 6.
// Claves: dmgP (daño), hpP (PV), critP (crítico), spdP (vel. ataque), armorP (resistencia), kamaP (ámbar), regenP (energía), xpP (experiencia)
const SETS = {
  ceniza:   { name: 'Ceniza Ardiente', color: '#ff7a45', bonus: { 2: { dmgP: 0.10 }, 4: { hpP: 0.15 }, 6: { critP: 0.10, dmgP: 0.15 } } },
  pantano:  { name: 'Ciénaga Sombría', color: '#5fd38a', bonus: { 2: { hpP: 0.12 }, 4: { regenP: 0.25 }, 6: { armorP: 0.15, dmgP: 0.10 } } },
  glaciar:  { name: 'Escarcha Rúnica', color: '#7fd4ff', bonus: { 2: { armorP: 0.08 }, 4: { hpP: 0.20 }, 6: { armorP: 0.12, critP: 0.08 } } },
  desierto: { name: 'Sol de Ámbar',    color: '#ffcf40', bonus: { 2: { kamaP: 0.25 }, 4: { spdP: 0.15 }, 6: { critP: 0.12, dmgP: 0.12 } } },
  abismo:   { name: 'Vacío Eterno',    color: '#c77dff', bonus: { 2: { dmgP: 0.12 }, 4: { critP: 0.10 }, 6: { dmgP: 0.25, regenP: 0.30 } } },
};
const SET_BONUS_TEXT = {
  dmgP: (v) => `+${Math.round(v * 100)}% daño`, hpP: (v) => `+${Math.round(v * 100)}% PV`, critP: (v) => `+${Math.round(v * 100)}% crítico`,
  spdP: (v) => `+${Math.round(v * 100)}% vel. ataque`, armorP: (v) => `+${Math.round(v * 100)}% resistencia`, kamaP: (v) => `+${Math.round(v * 100)}% ámbar`,
  regenP: (v) => `+${Math.round(v * 100)}% energía`, xpP: (v) => `+${Math.round(v * 100)}% XP`,
};
const setBonusLine = (b) => Object.entries(b).map(([k, v]) => SET_BONUS_TEXT[k](v)).join(', ');

// Súper Jefes: versión colosal y corrupta del Guardián del bioma, con mecánicas propias
const SUPER_BOSSES = {
  ceniza:   { base: 'bouftouRoyal', name: 'Rey Ceniza, el Devorador',  filter: 'saturate(1.6) brightness(0.75) contrast(1.2)', aura: '255,70,20',  move: 'meteor' },
  pantano:  { base: 'reinaTeje',    name: 'Madre de la Ciénaga',       filter: 'hue-rotate(-40deg) saturate(1.5)',              aura: '120,255,140', move: 'brood' },
  glaciar:  { base: 'colosoHielo',  name: 'Titán del Invierno Eterno', filter: 'brightness(1.2) saturate(1.4)',                 aura: '150,220,255', move: 'nova' },
  desierto: { base: 'tofuRoyal',    name: 'Fénix de Ámbar',            filter: 'hue-rotate(25deg) saturate(1.5) brightness(1.1)', aura: '255,210,80', move: 'firelines' },
  abismo:   { base: 'hechicero',    name: 'Archimago del Vacío',       filter: 'hue-rotate(-30deg) saturate(1.6) contrast(1.2)', aura: '200,90,255', move: 'void' },
};

// ---------- Nodos del mapa ----------
// n: 1..LEVELS_PER_BIOME son Grietas; n = 'S' es el Súper Jefe
const nodeKey = (b, n) => b + '-' + n;
const globalLevel = (b, n) => (n === 'S' ? (b + 1) * LEVELS_PER_BIOME + 1 : b * LEVELS_PER_BIOME + n);
function mapProg() {
  if (!S.map) S.map = { c: {}, sel: { b: 0, n: 1, d: 0 } };
  return S.map;
}
const clearedDiffs = (b, n) => mapProg().c[nodeKey(b, n)] || 0;
const superDone = (b) => clearedDiffs(b, 'S') > 0;
const biomeUnlocked = (b) => b === 0 || superDone(b - 1);
function nodeUnlocked(b, n) {
  if (!biomeUnlocked(b)) return false;
  if (n === 'S') return clearedDiffs(b, LEVELS_PER_BIOME) > 0;
  return n === 1 || clearedDiffs(b, n - 1) > 0;
}
const diffUnlocked = (b, n, d) => nodeUnlocked(b, n) && (n === 'S' ? d === 0 : clearedDiffs(b, n) >= d);
function markCleared(b, n, d) {
  const m = mapProg(), k = nodeKey(b, n);
  m.c[k] = Math.max(m.c[k] || 0, n === 'S' ? 1 : d + 1);
}
// Nivel recomendado del héroe para una Grieta
const recLevel = (b, n, d) => Math.max(1, 1 + (globalLevel(b, n) - 1) * 2 + DIFFS[d].lvl);
// Grieta más alta superada (para precios del Mercader y nivel de objetos de la tienda)
function highestLevel() {
  let h = 1;
  for (const k of Object.keys(mapProg().c)) {
    const [b, n] = k.split('-');
    h = Math.max(h, globalLevel(+b, n === 'S' ? 'S' : +n) + 1);
  }
  return h;
}
// Partidas anteriores al mapa: cada Grieta superada cuenta como el Fácil de los primeros niveles
function migrateMap(s) {
  if (s.map) return;
  s.map = { c: {}, sel: { b: 0, n: 1, d: 0 } };
  const done = Math.min(LEVELS_PER_BIOME, (s.maxFaille || 1) - 1);
  for (let i = 1; i <= done; i++) s.map.c[nodeKey(0, i)] = 1;
  s.map.sel.n = Math.min(LEVELS_PER_BIOME, done + 1);
}

// ---------- Conjuntos equipados ----------
function setCounts() {
  const c = {};
  for (const slot of SLOTS) { const it = S.equip[slot]; if (it && it.set) c[it.set] = (c[it.set] || 0) + 1; }
  return c;
}
function activeSetBonus() {
  const out = {};
  const c = setCounts();
  for (const [id, n] of Object.entries(c)) {
    for (const need of [2, 4, 6]) {
      if (n < need) continue;
      for (const [k, v] of Object.entries(SETS[id].bonus[need])) out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}
function makeSetItem(cls, level, setId) {
  const owned = new Set([...SLOTS.map((s) => S.equip[s]), ...S.bag].filter((it) => it && it.set === setId).map((it) => it.slot));
  const missing = SLOTS.filter((s) => !owned.has(s));
  // prioriza las piezas que aún no tienes
  const slot = missing.length && Math.random() < 0.75 ? pick(missing) : pick(SLOTS);
  const it = makeItem(cls, level, 3, { slot, name: 'de ' + SETS[setId].name });
  it.set = setId;
  for (const k of Object.keys(it.stats)) it.stats[k] = Math.round(it.stats[k] * 1.1);
  it.value = Math.round(it.value * 1.5);
  return it;
}
