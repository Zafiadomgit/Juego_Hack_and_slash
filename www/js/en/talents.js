/* Fendaria — Árbol de talentos de los 7 héroes.
 * 1 punto por nivel. Tres ramas por héroe, 8 nodos por rama:
 *   · nodos de rango (hasta 5): bonus pequeños que se acumulan,
 *   · encrucijadas (★): eliges UNA de dos opciones que cambian cómo juegas,
 *   · culmen (★★): pide 15 puntos en su rama.
 * Cada nodo pide el anterior de su rama. Reiniciar es gratis en Villa Candela.
 */
'use strict';

// iconos pintados (img/talents); si falta alguno se usa el símbolo
const TALENT_ICON = {"🪓": "axe", "🗡": "dagger", "⚡": "bolt", "✦": "twinslash", "🌀": "whirl", "💥": "burst", "🩸": "blood", "💀": "skull", "🗿": "giant", "🔥": "flame", "✸": "fireburst", "⏳": "hourglass", "🌋": "volcano", "↺": "echo", "★": "energy", "🌬": "breath", "☄": "comet", "🛡": "shield", "❤": "heart", "🌵": "thorns", "✚": "regen", "👢": "boots", "🍷": "wine", "⛰": "mountain", "➶": "bow", "🪶": "feather", "➹": "pierce", "»": "dash", "👁": "eye", "🦌": "stag", "🎯": "target", "☰": "volley", "✹": "powder", "✶": "twinarrow", "☔": "rain", "✨": "spark", "🦅": "hawk", "🌲": "pine", "💨": "gust", "◆": "amber", "🍖": "meat", "🌿": "herb", "✳": "trap", "✺": "rune", "◎": "doublering", "🧘": "meditate", "🔮": "orb", "⛨": "aegis", "🪄": "staff", "💎": "crystal", "🔔": "bell", "☠": "poison", "✧": "thousandcuts", "☾": "moon", "☁": "toxiccloud", "🌑": "eclipse", "👻": "ghost", "🐺": "wolf", "🐾": "paw", "🌕": "fullmoon", "👑": "crown", "🌳": "oak", "💣": "bomb", "🧱": "wall", "⚙": "gear", "🔧": "wrench", "🛠": "tools", "🏆": "trophy", "⚔": "swords", "😡": "rage", "🦇": "bat", "📯": "horn"};
const talIcon = (ic, cls = '') => (TALENT_ICON[ic] ? `<img class="tal-img ${cls}" src="img/talents/${TALENT_ICON[ic]}.png" alt="" draggable="false">` : ic);

// ---------- Constructores de nodos ----------
const N = (id, name, icon, max, m, d) => ({ id, name, icon, max, m, d });
const K = (id, name, icon, fx, d, m) => ({ id, name, icon, max: 1, key: 1, fx, d, m });
const X = (id, a, b) => ({ id, choice: [a, b], max: 1 });
const CAP = (id, name, icon, d, fx, m) => ({ id, name, icon, max: 1, cap: 1, fx, d, m });
// nodos de rango habituales
const nDmg = (id, n, i) => N(id, n, i, 5, { dmg: 0.03 }, "+3% damage per rank");
const nAspd = (id, n, i) => N(id, n, i, 5, { aspd: 0.03 }, "+3% attack speed per rank");
const nCrit = (id, n, i) => N(id, n, i, 5, { crit: 0.015 }, "+1.5% crit chance per rank");
const nCritD = (id, n, i) => N(id, n, i, 3, { critDmg: 0.1 }, "+10% crit damage per rank");
const nSkill = (id, n, i) => N(id, n, i, 5, { skill: 0.04 }, "+4% skill damage per rank");
const nCd = (id, n, i) => N(id, n, i, 5, { cd: 0.03 }, "-3% cooldown time per rank");
const nHp = (id, n, i) => N(id, n, i, 5, { hp: 0.04 }, "+4% max HP per rank");
const nArmor = (id, n, i) => N(id, n, i, 5, { armor: 0.015 }, "-1.5% damage taken per rank");
const nSpeed = (id, n, i) => N(id, n, i, 3, { speed: 0.03 }, "+3% movement speed per rank");
const nRegen = (id, n, i) => N(id, n, i, 3, { regen: 0.002 }, "Recover 0.2% health per second per rank");
const nLs = (id, n, i) => N(id, n, i, 3, { ls: 0.008 }, "Steal 0.8% of damage as health per rank");
const nPa = (id, n, i) => N(id, n, i, 2, { pa: 1 }, "+1 max energy per rank");
const nPaR = (id, n, i) => N(id, n, i, 5, { paRegen: 0.05 }, "+5% energy regen per rank");
const nKama = (id, n, i) => N(id, n, i, 3, { kama: 0.08 }, "+8% amber per rank");
const nUlt = (id, n, i) => N(id, n, i, 3, { ult: 0.1 }, "Your ultimate charges 10% faster per rank");
const nBoss = (id, n, i) => N(id, n, i, 3, { boss: 0.06 }, "+6% damage to Guardians and elites per rank");

const TALENTS = {
  iop: [
    { id: 'furia', name: "Fury", color: '#ff5a3d', icon: '🪓', nodes: [
      nDmg('filo', "Honed edge", '🗡'), nAspd('ritmo', "War rhythm", '⚡'),
      X('golpe', K('doble', "Double chop", '✦', { k: 'combo', n: 4, mul: 0.7 }, "Every 4th basic hit throws a second slash (70%)"),
        K('giro', "Windmill", '🌀', { k: 'fan', n: 5 }, "Every 5th basic hit is a full spin that hits everyone around")),
      nCritD('brutal', "Brutal blow", '💥'), nLs('sed', "Bloodlust", '🩸'),
      X('instinto', K('verdugo', "Executioner", '💀', { k: 'execute' }, "+40% damage to enemies below 30% health"),
        K('cazagigantes', "Giant slayer", '🗿', { k: 'bossbane' }, "+25% damage to Guardians and elites")),
      nDmg('furor', "Frenzy", '🔥'),
      CAP('ira', "Unstoppable rage", '🔥', "Each enemy you kill: +8% attack speed for 3 s (up to ×5)", { k: 'ira' }),
    ] },
    { id: 'torbellino', name: "Whirlwind", color: '#ffb040', icon: '✸', nodes: [
      nSkill('conducto', "Fiery conduit", '✸'), nCd('vigor', "Runic vigor", '⏳'),
      X('salto', K('aterrizaje', "Burning landing", '🌋', { k: 'zone', i: 0 }, "Seismic Leap leaves the ground burning for 3 s"),
        K('rebote', "Rebound", '↺', { k: 'echo', i: 0, p: 0.3 }, "30% chance that Seismic Leap doesn't use its cooldown")),
      nPa('reserva', "Energy reserve", '★'), nPaR('aliento2', "Combat breathing", '🌬'),
      X('fuego', K('incendio', "Wildfire", '🔥', { k: 'zone', i: 1 }, "Fiery Fury leaves the ground burning for 3 s"),
        K('sobrecarga', "Overcharge", '⚡', { k: 'overcharge' }, "+20% damage while your energy is full")),
      nUlt('cataclismo0', "Omen", '☄'),
      CAP('cataclismo', "Cataclysm", '☄', "Your ultimate charges 40% faster and your skills deal +15%", null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'bastion', name: "Bastion", color: '#8fb7d8', icon: '🛡', nodes: [
      nHp('piel', "Iron skin", '❤'), nArmor('guardia', "Guard", '🛡'),
      X('aguante', K('aliento', "Second wind", '🌬', { k: 'aliento' }, "Once per Rift, when you drop below 25% health you recover 35%"),
        K('espinas', "Spiked plate", '🌵', { k: 'thorns' }, "Reflect 40% of damage taken to nearby enemies")),
      nRegen('regen', "Regeneration", '✚'), nSpeed('pies', "Light feet", '👢'),
      X('defensa', K('escudo', "War shield", '🛡', { k: 'skillShield' }, "Each skill gives you a shield worth 12% of your health"),
        K('sanguinaria', "Bloodthirsty", '🍷', { k: 'frenesi' }, "Each enemy you kill heals you for 2% health")),
      nHp('coloso', "Colossus", '⛰'),
      CAP('inquebrantable', "Unbreakable", '⛰', "When you dodge: 1 s more invulnerability and +25% damage for 2 s", { k: 'inquebrantable' }),
    ] },
  ],
  cra: [
    { id: 'punteria', name: "Marksmanship", color: '#7fe08a', icon: '➶', nodes: [
      nDmg('plumas', "Sharp feathers", '🪶'), nAspd('tension', "Quick draw", '⚡'),
      X('flecha', K('perforante', "Piercing arrow", '➹', { k: 'pierce' }, "Your basic arrows pierce one more enemy"),
        K('rafaga', "Flurry", '»', { k: 'combo', n: 3, mul: 0.6 }, "Every 3rd shot fires a second arrow (60%)")),
      nCrit('ojo', "Critical eye", '👁'), nCritD('punta', "Lethal tip", '💥'),
      X('caza', K('verdugo', "Coup de grâce", '💀', { k: 'execute' }, "+40% damage to enemies below 30% health"),
        K('cazamayor', "Big game", '🦌', { k: 'bossbane' }, "+25% damage to Guardians and elites")),
      nDmg('precision', "Precision", '🎯'),
      CAP('multiple', "Multishot", '☰', "Every 5th shot fires 3 arrows in a fan", { k: 'fan', n: 5 }),
    ] },
    { id: 'artilleria', name: "Artillery", color: '#ffb040', icon: '✹', nodes: [
      nSkill('polvora', "Gunpowder", '✹'), nCd('carcaj', "Light quiver", '⏳'),
      X('ignea', K('gemela', "Twin arrow", '✶', { k: 'twin', i: 0 }, "Fire Arrow shoots two arrows at once"),
        K('brasas', "Embers", '🔥', { k: 'zone', i: 0 }, "Fire Arrow leaves fire where it lands")),
      nPa('energia', "Energy reserve", '★'), nPaR('recarga', "Breathing", '🌀'),
      X('lluvia', K('diluvio', "Deluge", '☔', { k: 'echo', i: 1, p: 0.25 }, "25% chance that Arrow Storm doesn't use its cooldown"),
        K('chispas', "Critical spark", '✨', { k: 'critEnergy' }, "Your critical hits give you energy back")),
      nUlt('halcon0', "Keen sight", '🦅'),
      CAP('halcon', "Hawk's eye", '🦅', "Your ultimate charges 40% faster and your skills deal +15%", null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'supervivencia', name: "Survival", color: '#8fb7d8', icon: '🌲', nodes: [
      nHp('piel', "Tanned leather", '❤'), nSpeed('zancada', "Stride", '👢'),
      X('viento', K('paso', "Wind step", '»', null, "+1 dodge charge", { pm: 1 }),
        K('nova', "Recoil", '💨', { k: 'nova' }, "When you dodge you push back and damage nearby enemies")),
      nArmor('guardia', "Instinctive dodge", '🛡'), nKama('saqueo', "Looter", '◆'),
      X('instinto', K('aliento', "Last resort", '🌬', { k: 'aliento' }, "Once per Rift, when you drop below 25% health you recover 35%"),
        K('presa', "Easy prey", '🍖', { k: 'frenesi' }, "Each enemy you kill heals you for 2% health")),
      nRegen('campamento', "Forest herbs", '🌿'),
      CAP('trampa', "Tactical retreat", '✳', "When you dodge you leave a trap that explodes (200% skill damage)", { k: 'trampa' }),
    ] },
  ],
  feca: [
    { id: 'runas', name: "Runes", color: '#ff8a3a', icon: '✺', nodes: [
      nSkill('tinta', "Fire ink", '✺'), nCd('trazo', "Quick stroke", '⏳'),
      X('circulo', K('doble', "Double circle", '◎', { k: 'zone', i: 1 }, "Fire Rune leaves a second burning circle"),
        K('eco', "Resonant rune", '↺', { k: 'echo', i: 1, p: 0.3 }, "30% chance that Fire Rune doesn't use its cooldown")),
      nPa('reserva', "Arcane reserve", '★'), nPaR('meditacion', "Meditation", '🧘'),
      X('poder', K('sobrecarga', "Arcane overcharge", '⚡', { k: 'overcharge' }, "+20% damage while your energy is full"),
        K('chispa', "Critical spark", '✨', { k: 'critEnergy' }, "Your critical hits give you energy back")),
      nUlt('presagio', "Runic omen", '☄'),
      CAP('archimaga', "Archmage", '🔮', "Your ultimate charges 40% faster and your skills deal +15%", null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'egida', name: "Aegis", color: '#8fd0ff', icon: '⛨', nodes: [
      nHp('escudo', "Seal of life", '❤'), nArmor('glifo', "Warding glyph", '🛡'),
      X('egida', K('reflejo', "Reflecting aegis", '🌵', { k: 'thorns' }, "Reflect 40% of damage taken to nearby enemies"),
        K('aliento', "Rune of life", '🌬', { k: 'aliento' }, "Once per Rift, when you drop below 25% health you recover 35%")),
      nRegen('savia', "Runic sap", '✚'), nSpeed('levitar', "Levitation", '🪶'),
      X('barrera', K('escudo2', "Eternal barrier", '🛡', { k: 'skillShield' }, "Each skill gives you a shield worth 12% of your health"),
        K('nova', "Runic wave", '💨', { k: 'nova' }, "When you dodge you push back and damage nearby enemies")),
      nHp('baluarte', "Bulwark", '⛰'),
      CAP('inquebrantable', "Living wall", '⛰', "When you dodge: 1 s more invulnerability and +25% damage for 2 s", { k: 'inquebrantable' }),
    ] },
    { id: 'baculo', name: "Staff", color: '#d7b4ff', icon: '🪄', nodes: [
      nDmg('cristal', "Polished crystal", '💎'), nAspd('conjuro', "Swift casting", '⚡'),
      X('orbe', K('perforante', "Wandering orb", '➹', { k: 'pierce' }, "Your orbs pierce one more enemy"),
        K('gemelo', "Twin orb", '✶', { k: 'combo', n: 3, mul: 0.6 }, "Every 3rd shot fires a second orb (60%)")),
      nCrit('foco', "Focus", '👁'), nCritD('estallido', "Burst", '💥'),
      X('juicio', K('verdugo', "Judgment", '💀', { k: 'execute' }, "+40% damage to enemies below 30% health"),
        K('cazaheraldos', "Herald hunter", '🗿', { k: 'bossbane' }, "+25% damage to Guardians and elites")),
      nDmg('resonancia', "Resonance", '🔔'),
      CAP('lluvia', "Orb rain", '☰', "Every 5th shot fires 3 orbs in a fan", { k: 'fan', n: 5 }),
    ] },
  ],
  sombra: [
    { id: 'filo', name: "Edge", color: '#b490ff', icon: '🗡', nodes: [
      nDmg('afilar', "Sharpen", '🗡'), nAspd('danza', "Dagger dance", '⚡'),
      X('corte', K('doble', "Double cut", '✦', { k: 'combo', n: 3, mul: 0.6 }, "Every 3rd basic hit adds an extra slash (60%)"),
        K('veneno', "Poisoned edge", '☠', { k: 'poison' }, "Your hits poison (25% of damage over 3 s)")),
      nCrit('punto', "Weak spot", '👁'), nCritD('letal', "Lethal blow", '💥'),
      X('asesino', K('verdugo', "Assassination", '💀', { k: 'execute' }, "+40% damage to enemies below 30% health"),
        K('cazarrecompensas', "Bounty hunter", '◆', { k: 'bossbane' }, "+25% damage to Guardians and elites")),
      nCritD('carnicera', "Butcher", '🩸'),
      CAP('mil', "Thousand cuts", '✧', "Every 5th basic hit is a whirl of daggers that hits everyone around", { k: 'fan', n: 5 }),
    ] },
    { id: 'sombras', name: "Shadows", color: '#7a5aa8', icon: '☾', nodes: [
      nSkill('noche', "Pitch-black night", '☾'), nCd('fugaz', "Fleeting", '⏳'),
      X('paso', K('rebote', "Double step", '↺', { k: 'echo', i: 0, p: 0.35 }, "35% chance that Shadowstep doesn't use its cooldown"),
        K('niebla', "Toxic mist", '☁', { k: 'zone', i: 1 }, "Venom Fan leaves a damaging cloud")),
      nPa('reserva', "Shadow reserve", '★'), nPaR('susurro', "Whisper", '🌬'),
      X('vacio', K('chispa', "Void hunger", '✨', { k: 'critEnergy' }, "Your critical hits give you energy back"),
        K('sobrecarga', "Total darkness", '⚡', { k: 'overcharge' }, "+20% damage while your energy is full")),
      nUlt('eclipse0', "Twilight", '🌑'),
      CAP('eclipse', "Eclipse", '🌑', "Your ultimate charges 40% faster and your skills deal +15%", null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'evasion', name: "Evasion", color: '#8fb7d8', icon: '💨', nodes: [
      nSpeed('sigilo', "Stealth", '👢'), nHp('fibra', "Sinew", '❤'),
      X('esquiva', K('viento', "Wind step", '»', null, "+1 dodge charge", { pm: 1 }),
        K('nova', "Smoke screen", '💨', { k: 'nova' }, "When you dodge you push back and damage nearby enemies")),
      nArmor('reflejos', "Reflexes", '🛡'), nLs('sanguijuela', "Leech", '🩸'),
      X('supervivencia', K('aliento', "Escape artist", '🌬', { k: 'aliento' }, "Once per Rift, when you drop below 25% health you recover 35%"),
        K('presa', "Predator", '🍖', { k: 'frenesi' }, "Each enemy you kill heals you for 2% health")),
      nKama('botin', "Plunder", '◆'),
      CAP('fantasma', "Ghost", '👻', "When you dodge: 1 s more invulnerability and +25% damage for 2 s", { k: 'inquebrantable' }),
    ] },
  ],
  domadora: [
    { id: 'manada', name: "Pack", color: '#9be05a', icon: '🐺', nodes: [
      nSkill('aullido', "Howl", '🐺'), nCd('rastreo', "Tracking", '⏳'),
      X('lobos', K('alfa', "Alpha wolf", '↺', { k: 'echo', i: 0, p: 0.3 }, "30% chance that Call of the Wolf doesn't use its cooldown"),
        K('estampida', "Torn earth", '🐾', { k: 'zone', i: 1 }, "Savage Roar tears up the ground (damages for 3 s)")),
      nPa('reserva', "Savage reserve", '★'), nPaR('vinculo', "Bond", '🌀'),
      X('instinto', K('sobrecarga', "Full instinct", '⚡', { k: 'overcharge' }, "+20% damage while your energy is full"),
        K('escudo', "Bearskin", '🛡', { k: 'skillShield' }, "Each skill gives you a shield worth 12% of your health")),
      nUlt('luna0', "Full moon", '🌕'),
      CAP('reina', "Queen of the pack", '👑', "Your ultimate charges 40% faster and your skills deal +15%", null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'cayado', name: "Staff", color: '#e0b060', icon: '🪄', nodes: [
      nDmg('madera', "Ashwood", '🌳'), nAspd('ritmo', "Tribal rhythm", '⚡'),
      X('golpe', K('doble', "Double hit", '✦', { k: 'combo', n: 4, mul: 0.7 }, "Every 4th basic hit strikes again (70%)"),
        K('veneno', "Thorns", '🌵', { k: 'poison' }, "Your hits poison (25% of damage over 3 s)")),
      nCrit('ojo', "Lynx eye", '👁'), nCritD('colmillo', "Fang", '💥'),
      X('caza', K('verdugo', "Finisher", '💀', { k: 'execute' }, "+40% damage to enemies below 30% health"),
        K('cazamayor', "Big game", '🦌', { k: 'bossbane' }, "+25% damage to Guardians and elites")),
      nDmg('furia', "Savage fury", '🔥'),
      CAP('giro', "Staff whirl", '🌀', "Every 5th basic hit strikes everyone around", { k: 'fan', n: 5 }),
    ] },
    { id: 'naturaleza', name: "Nature", color: '#7fe08a', icon: '🌿', nodes: [
      nHp('raices', "Roots", '❤'), nRegen('savia', "Sap", '✚'),
      X('bosque', K('espinas', "Thorny bark", '🌵', { k: 'thorns' }, "Reflect 40% of damage taken to nearby enemies"),
        K('aliento', "Rebirth", '🌬', { k: 'aliento' }, "Once per Rift, when you drop below 25% health you recover 35%")),
      nArmor('corteza', "Bark", '🛡'), nSpeed('zancada', "Stride", '👢'),
      X('ciclo', K('presa', "Circle of life", '🍖', { k: 'frenesi' }, "Each enemy you kill heals you for 2% health"),
        K('nova', "Sprout", '💨', { k: 'nova' }, "When you dodge you push back and damage nearby enemies")),
      nHp('roble', "Oak", '⛰'),
      CAP('druida', "Archdruid", '🌳', "When you dodge: 1 s more invulnerability and +25% damage for 2 s", { k: 'inquebrantable' }),
    ] },
  ],
  artificiera: [
    { id: 'explosivos', name: "Explosives", color: '#ff8a3a', icon: '💣', nodes: [
      nDmg('polvora', "Fine powder", '💥'), nAspd('mecha', "Short fuse", '⚡'),
      X('bomba', K('racimo', "Twin bombs", '✶', { k: 'combo', n: 3, mul: 0.6 }, "Every 3rd bomb throws an extra one (60%)"),
        K('rebote', "Bouncing bomb", '➹', { k: 'pierce' }, "Your bombs pass through one more enemy before exploding")),
      nCrit('calibre', "Caliber", '🎯'), nCritD('metralla', "Shrapnel", '💥'),
      X('demolicion', K('verdugo', "Demolition", '💀', { k: 'execute' }, "+40% damage to enemies below 30% health"),
        K('rompemuros', "Wallbreaker", '🧱', { k: 'bossbane' }, "+25% damage to Guardians and elites")),
      nDmg('nitro', "Nitro", '🔥'),
      CAP('bombardeo', "Bombardment", '☰', "Every 5th bomb throws 3 in a fan", { k: 'fan', n: 5 }),
    ] },
    { id: 'ingenieria', name: "Engineering", color: '#ffd76a', icon: '⚙', nodes: [
      nSkill('engranaje', "Gears", '⚙'), nCd('llave', "Monkey wrench", '🔧'),
      X('torreta', K('doble', "Express turret", '↺', { k: 'echo', i: 0, p: 0.3 }, "30% chance that the Turret doesn't use its cooldown"),
        K('aceite', "Burning oil", '🔥', { k: 'zone', i: 1 }, "Cluster Bomb sets the ground on fire")),
      nPa('bateria', "Battery", '★'), nPaR('dinamo', "Dynamo", '🌀'),
      X('genio', K('chispa', "Bright spark", '✨', { k: 'critEnergy' }, "Your critical hits give you energy back"),
        K('sobrecarga', "Overcharge", '⚡', { k: 'overcharge' }, "+20% damage while your energy is full")),
      nUlt('prototipo', "Prototype", '🛠'),
      CAP('obra', "Masterpiece", '🏆', "Your ultimate charges 40% faster and your skills deal +15%", null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'blindaje', name: "Plating", color: '#8fb7d8', icon: '🛡', nodes: [
      nHp('placas', "Plates", '❤'), nArmor('remaches', "Rivets", '🛡'),
      X('armadura', K('escudo', "Brass shield", '🛡', { k: 'skillShield' }, "Each skill gives you a shield worth 12% of your health"),
        K('espinas', "Spikes", '🌵', { k: 'thorns' }, "Reflect 40% of damage taken to nearby enemies")),
      nSpeed('botas', "Steam boots", '👢'), nKama('chatarra', "Scrapper", '◆'),
      X('emergencia', K('aliento', "First-aid kit", '🌬', { k: 'aliento' }, "Once per Rift, when you drop below 25% health you recover 35%"),
        K('cohete', "Thruster", '💨', { k: 'nova' }, "When you dodge you push back and damage nearby enemies")),
      nRegen('reparacion', "Self-repair", '✚'),
      CAP('trampa', "Parting mine", '✳', "When you dodge you leave a mine that explodes (200% skill damage)", { k: 'trampa' }),
    ] },
  ],
  berserker: [
    { id: 'matanza', name: "Slaughter", color: '#ff4a3a', icon: '⚔', nodes: [
      nDmg('acero', "Steel", '🗡'), nAspd('frenesi0', "Frenzy", '⚡'),
      X('tajo', K('doble', "Backswing", '✦', { k: 'combo', n: 4, mul: 0.7 }, "Every 4th basic hit adds another slash (70%)"),
        K('giro', "Whirlwind", '🌀', { k: 'fan', n: 5 }, "Every 5th basic hit strikes everyone around")),
      nCritD('brutal', "Brutal", '💥'), nCrit('ojo', "Red eye", '👁'),
      X('caza', K('verdugo', "Behead", '💀', { k: 'execute' }, "+40% damage to enemies below 30% health"),
        K('mataogros', "Ogre slayer", '🗿', { k: 'bossbane' }, "+25% damage to Guardians and elites")),
      nDmg('carniceria', "Carnage", '🔥'),
      CAP('ira', "Red wrath", '🔥', "Each enemy you kill: +8% attack speed for 3 s (up to ×5)", { k: 'ira' }),
    ] },
    { id: 'sangre', name: "Blood", color: '#b0203a', icon: '🩸', nodes: [
      nLs('sed', "Thirst", '🩸'), nHp('vigor', "Vigor", '❤'),
      X('herida', K('rabia', "Wounded rage", '😡', { k: 'berserk' }, "Below 50% health you deal 30% more damage"),
        K('presa', "Feast", '🍖', { k: 'frenesi' }, "Each enemy you kill heals you for 2% health")),
      nRegen('cicatriz', "Scars", '✚'), nLs('vampiro', "Vampire", '🦇'),
      X('pacto', K('aliento', "Refuse to fall", '🌬', { k: 'aliento' }, "Once per Rift, when you drop below 25% health you recover 35%"),
        K('espinas', "War hide", '🌵', { k: 'thorns' }, "Reflect 40% of damage taken to nearby enemies")),
      nHp('mole', "Hulk", '⛰'),
      CAP('inmortal', "Immortal", '⛰', "When you dodge: 1 s more invulnerability and +25% damage for 2 s", { k: 'inquebrantable' }),
    ] },
    { id: 'grito', name: "Shout", color: '#ffb040', icon: '📯', nodes: [
      nSkill('voz', "Booming voice", '📯'), nCd('aliento', "War breath", '⏳'),
      X('golpe', K('rebote', "Hot blood", '↺', { k: 'echo', i: 0, p: 0.3 }, "30% chance that Blood Strike doesn't use its cooldown"),
        K('terremoto', "Earthquake", '🌋', { k: 'zone', i: 0 }, "Blood Strike cracks the ground (damages for 3 s)")),
      nPa('reserva', "Rage reserve", '★'), nPaR('furia', "Fury", '🌀'),
      X('grito', K('escudo', "Iron shout", '🛡', { k: 'skillShield' }, "Each skill gives you a shield worth 12% of your health"),
        K('sobrecarga', "Full rage", '⚡', { k: 'overcharge' }, "+20% damage while your energy is full")),
      nUlt('presagio', "Call to war", '☄'),
      CAP('caudillo', "Warlord", '👑', "Your ultimate charges 40% faster and your skills deal +15%", null, { ult: 0.4, skill: 0.15 }),
    ] },
  ],
};
const CAP_NEED = 15; // puntos en la rama para el nodo culmen

// ---------- Estado ----------
const talTree = () => (S && TALENTS[S.cls]) || null;
// claves válidas del héroe actual (rama.nodo o rama.nodo.opción)
function talKeys() {
  const out = {}, T = talTree();
  if (!T) return out;
  for (const br of T) br.nodes.forEach((n, i) => {
    if (n.choice) for (const o of n.choice) out[br.id + '.' + n.id + '.' + o.id] = { br, n, o, i };
    else out[br.id + '.' + n.id] = { br, n, o: n, i };
  });
  return out;
}
function talState() {
  if (!S.tal) S.tal = {};
  const valid = talKeys();
  for (const k of Object.keys(S.tal)) if (!valid[k]) delete S.tal[k]; // árboles antiguos: se devuelven los puntos
  return S.tal;
}
const talRank = (k) => (S && S.tal && S.tal[k]) || 0;
const nodeRank = (br, n) => (n.choice ? n.choice.reduce((a, o) => a + talRank(br.id + '.' + n.id + '.' + o.id), 0) : talRank(br.id + '.' + n.id));
const talSpent = () => Object.values(talState()).reduce((a, b) => a + b, 0);
const talPoints = () => Math.max(0, (S.level - 1) - talSpent());
const branchSpent = (br) => br.nodes.reduce((a, n) => a + nodeRank(br, n), 0);
function talCan(key) {
  const K0 = talKeys()[key];
  if (!K0) return false;
  const { br, n, o, i } = K0;
  if (talRank(key) >= o.max || talPoints() < 1) return false;
  if (n.choice && nodeRank(br, n) > 0) return false; // ya elegiste la otra
  if (i > 0 && nodeRank(br, br.nodes[i - 1]) < 1) return false;
  if (n.cap && branchSpent(br) < CAP_NEED) return false;
  return true;
}
function talActive() { // opciones aprendidas
  const out = [];
  const keys = talKeys();
  for (const [k, v] of Object.entries(keys)) { const r = talRank(k); if (r) out.push({ o: v.o, r }); }
  return out;
}
function talMods() {
  const m = {};
  for (const { o, r } of talActive()) if (o.m) for (const [k, v] of Object.entries(o.m)) m[k] = (m[k] || 0) + v * r;
  return m;
}
const talFxList = () => talActive().filter((a) => a.o.fx).map((a) => a.o.fx);
const talFx = (k) => talFxList().find((f) => f.k === k) || null;

// ---------- Estadísticas ----------
const _derivedT = derived;
derived = function () {
  const d = _derivedT(), m = talMods();
  d.maxHp = Math.round(d.maxHp * (1 + (m.hp || 0)));
  d.dmgMul *= (1 + (m.dmg || 0)) * (P && P.indT > 0 ? 1.25 : 1);
  d.skillMul *= 1 + (m.skill || 0);
  d.crit = Math.min(0.8, d.crit + (m.crit || 0));
  d.critDmg *= 1 + (m.critDmg || 0);
  d.cdMul *= 1 - Math.min(0.5, m.cd || 0);
  d.atkSpeed *= (1 + (m.aspd || 0)) * (1 + 0.08 * ((P && P.iraT > 0 && P.iraN) || 0));
  d.speed *= 1 + (m.speed || 0);
  d.armor = Math.min(0.8, d.armor + (m.armor || 0));
  d.hpRegen += m.regen || 0;
  d.paRegen *= 1 + (m.paRegen || 0);
  d.kamaMul *= 1 + (m.kama || 0);
  return d;
};
const _recalcT = recalc;
recalc = function () {
  _recalcT();
  if (!P) return;
  const m = talMods();
  P.maxPa = 6 + (m.pa || 0);
  P.maxPm = 3 + (S.up.reflejos || 0) + (uniqueOn('viento') ? 1 : 0) + (m.pm || 0);
};
const _stealLifeT = stealLife;
stealLife = function (dmg) { _stealLifeT(dmg); const ls = talMods().ls; if (ls && P && P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + dmg * ls); };
const _gainUltT = gainUlt;
gainUlt = function (n) { return _gainUltT(n * (1 + (talMods().ult || 0))); };

// ---------- Efectos especiales (genéricos para todos los héroes) ----------
let talShots = 0;
// daño: ejecución, cazagigantes, energía llena, rabia herida, veneno, crítico que devuelve energía
const _damageEnemyT = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (!P || e.dead || o.tal) return _damageEnemyT(e, base, o);
  const m = talMods();
  if (talFx('execute') && e.hp < e.maxHp * 0.3) base *= 1.4;
  if (e.boss || e.elite) base *= (1 + (m.boss || 0)) * (talFx('bossbane') ? 1.25 : 1);
  if (talFx('overcharge') && P.pa >= P.maxPa - 0.01) base *= 1.2;
  if (talFx('berserk') && P.hp < P.maxHp * 0.5) base *= 1.3;
  const hp0 = e.hp, r = _damageEnemyT(e, base, o);
  const dealt = Math.max(0, hp0 - Math.max(0, e.hp));
  if (talFx('poison') && !e.dead && dealt > 0) e.dot = { t: 3, dps: Math.max(1, dealt * 0.25 / 3), tick: 0.5 };
  if (talFx('critEnergy') && Math.random() < P.crit) P.pa = Math.min(P.maxPa, P.pa + 0.4);
  return r;
};
function extraShots(nP, offs, mul) {
  const made = projectiles.slice(nP).filter((p) => p.team === 'p');
  const base = made[made.length - 1];
  if (!base) return false;
  for (const off of offs) {
    const a = Math.atan2(base.vy, base.vx) + off, sp = Math.hypot(base.vx, base.vy);
    projectiles.push(Object.assign({}, base, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: base.dmg * mul, hit: [] }));
  }
  return true;
}
const _basicAttackT = basicAttack;
basicAttack = function () {
  const nP = projectiles.length;
  _basicAttackT();
  talShots++;
  const ranged = projectiles.length > nP;
  if (talFx('pierce')) for (let i = nP; i < projectiles.length; i++) if (projectiles[i].team === 'p') projectiles[i].pierce = (projectiles[i].pierce || 0) + 1;
  const combo = talFx('combo');
  if (combo && talShots % combo.n === 0) {
    if (ranged) extraShots(nP, [0.12], combo.mul);
    else {
      const a = P.dir;
      later(0.12, () => {
        if (!P || scene !== 'rift') return;
        slashes.push({ x: P.x, y: P.y, dir: a, arc: 2.3, range: 86, life: 0.18, max: 0.18, color: '#ff8a5a', side: -P.swingSide, width: 26, follow: true });
        meleeArc(P.x, P.y, a, 90, 1.2, basicDmg() * combo.mul, 200);
        SFX.play('swing');
      });
    }
  }
  const fan = talFx('fan');
  if (fan && talShots % fan.n === 0) {
    if (ranged) extraShots(nP, [-0.22, 0.22], 1);
    else {
      aoe(P.x, P.y, 110, basicDmg() * 0.9, 220);
      rings.push({ x: P.x, y: P.y, r0: 20, r1: 110, life: 0.25, max: 0.25, color: 'rgba(255,200,140,' });
      SFX.play('swing');
    }
  }
};
const _useSkillT = useSkill;
useSkill = function (i) {
  const cd0 = P.skillCd[i], nP = projectiles.length, pa0 = P.pa;
  _useSkillT(i);
  if (P.skillCd[i] <= cd0) return; // no se lanzó
  for (const f of talFxList()) {
    if (f.k === 'zone' && f.i === i) {
      const t = nearestEnemy(P.x, P.y, 360), tx = P.jump ? P.jump.tx : t ? t.x : P.x, ty = P.jump ? P.jump.ty : t ? t.y : P.y;
      later(0.4, () => { if (P && scene === 'rift') { glyphs.push({ x: tx, y: ty, r: 95, life: 3, max: 3, tick: 0, mul: 0.8 }); addDecal('scorch', tx, ty, 80, 3, '255,110,30'); } });
    }
    if (f.k === 'echo' && f.i === i && Math.random() < f.p) { P.skillCd[i] = 0; addText(P.x, P.y - 60, "Again!", '#ffe08a', 0.9); }
    if (f.k === 'twin' && f.i === i) extraShots(nP, [0.16], 1);
  }
  if (talFx('skillShield')) { P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * 0.12)); P.shieldT = Math.max(P.shieldT || 0, 4); }
  if (talFx('refund') && Math.random() < 0.25) P.pa = Math.min(P.maxPa, P.pa + (pa0 - P.pa));
};
const _dashT = dash;
dash = function () {
  const pm0 = P.pm;
  _dashT();
  if (P.pm >= pm0) return;
  if (talFx('inquebrantable')) { P.invul = Math.max(P.invul, 1.25); P.indT = 2; recalc(); }
  if (talFx('nova')) {
    aoe(P.x, P.y, 100, skillDmg(1), 420);
    rings.push({ x: P.x, y: P.y, r0: 10, r1: 100, life: 0.3, max: 0.3, color: 'rgba(200,230,255,' });
  }
  if (talFx('trampa')) {
    const x = P.x, y = P.y;
    later(0.6, () => {
      if (!P || scene !== 'rift') return;
      aoe(x, y, 90, skillDmg(2), 260);
      rings.push({ x, y, r0: 10, r1: 90, life: 0.35, max: 0.35, color: 'rgba(160,255,140,' });
      sparks(x, y - 6, 16, '#c8ff9a', 300);
      SFX.play('boom');
    });
  }
};
const _hurtPlayerT = hurtPlayer;
hurtPlayer = function (dmg, sx, sy, src) {
  const hp0 = P ? P.hp : 0;
  const r = _hurtPlayerT(dmg, sx, sy, src);
  const lost = P ? hp0 - P.hp : 0;
  if (lost > 0 && talFx('thorns')) for (const e of enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < 120) _damageEnemyT(e, lost * 0.4, { quiet: true, color: '#9be05a', tal: 1 });
  return r;
};
const _killEnemyT = killEnemy;
killEnemy = function (e) {
  const r = _killEnemyT(e);
  if (!P) return r;
  if (talFx('ira')) { P.iraN = Math.min(5, (P.iraT > 0 ? P.iraN || 0 : 0) + 1); P.iraT = 3; recalc(); }
  if (talFx('frenesi')) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.02);
  return r;
};
const _updatePlayerT = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerT(dt);
  if (!P) return;
  if (P.iraT > 0) { P.iraT -= dt; if (P.iraT <= 0) { P.iraN = 0; recalc(); } }
  if (P.indT > 0) { P.indT -= dt; if (P.indT <= 0) recalc(); }
  if (talFx('aliento') && !P.alientoUsed && P.hp > 0 && P.hp < P.maxHp * 0.25) {
    P.alientoUsed = true;
    heal(Math.round(P.maxHp * 0.35));
    rings.push({ x: P.x, y: P.y, r0: 10, r1: 110, life: 0.45, max: 0.45, color: 'rgba(160,220,255,' });
    addText(P.x, P.y - 60, "Second wind!", '#bfe8ff', 1.1);
    SFX.play('heal');
  }
};

// ---------- Interfaz: pestaña Talentos en la ficha del personaje ----------
$('shModes').insertAdjacentHTML('beforeend', "<button data-m=\"talents\" type=\"button\"><img class=\"pico-ui\" src=\"img/icons/talents.png\" width=\"18\" height=\"18\" alt=\"\"> Talents</button>");
document.querySelector('#inv .sh-body').insertAdjacentHTML('beforeend', '<section id="shTalents" class="sh-talents"></section>');
let talSel = null;
function talNodeBtn(br, n, i, key, o, cls) {
  const r = talRank(key), can = talCan(key), prev = i === 0 || nodeRank(br, br.nodes[i - 1]) > 0;
  const other = n.choice && nodeRank(br, n) > 0 && !r;
  const lock = !r && !can && (!prev || (n.cap && branchSpent(br) < CAP_NEED) || other);
  const st = r >= o.max ? 'max' : r ? 'got' : can ? 'can' : lock ? 'lock' : 'off';
  const rank = o.max > 1 ? `<span class="tv-r">${r}/${o.max}</span>` : '';
  return `<button class="tv-n ${cls} ${n.cap ? 'cap' : ''} ${st} ${other ? 'gone' : ''} ${talSel === key ? 'sel' : ''}" data-k="${key}" title="${o.name}">
    <span class="tv-ring"></span><span class="tv-ic">${talIcon(o.icon)}</span>${rank}</button>`;
}
function buildTalents() {
  const box = $('shTalents'), T = talTree();
  if (!T) { box.innerHTML = "<div class=\"tal-soon\">🌳 This hero doesn't have a talent tree yet.</div>"; return; }
  const keys = talKeys(), pts = talPoints();
  if (!talSel || !keys[talSel]) talSel = Object.keys(keys)[0];
  const rows = T.map((br) => {
    const spent = branchSpent(br), capPct = Math.min(100, (spent / CAP_NEED) * 100);
    const nodes = br.nodes.map((n, i) => {
      const lit = nodeRank(br, n) > 0, prevLit = i === 0 || nodeRank(br, br.nodes[i - 1]) > 0;
      const line = i ? `<i class="tv-l ${lit ? 'on' : prevLit ? 'next' : ''}"></i>` : '';
      if (!n.choice) return line + talNodeBtn(br, n, i, br.id + '.' + n.id, n, '');
      return line + `<span class="tv-fork ${lit ? 'done' : ''}">${n.choice.map((o) => talNodeBtn(br, n, i, br.id + '.' + n.id + '.' + o.id, o, 'half')).join('<b>o</b>')}</span>`;
    }).join('');
    return `<div class="tv-row" style="--c:${br.color}">
      <div class="tv-crest"><span class="tv-emb">${talIcon(br.icon)}</span><span class="tv-nm">${br.name}<small>${spent} pts</small></span>
        <span class="tv-bar" title="Capstone: ${CAP_NEED} points"><i style="width:${capPct}%"></i></span></div>
      <div class="tv-path">${nodes}</div></div>`;
  }).join('');
  const { br: SB, n: SN, o: SO, i: SI } = keys[talSel], r = talRank(talSel), can = talCan(talSel);
  const why = r >= SO.max ? '' : pts < 1 ? "No points: you earn one per level" : SN.choice && nodeRank(SB, SN) > 0 ? "You already chose the other option (reset to change)"
    : SI > 0 && nodeRank(SB, SB.nodes[SI - 1]) < 1 ? "First learn the previous one in the branch" : SN.cap && branchSpent(SB) < CAP_NEED ? `You need ${CAP_NEED} points in ${SB.name} (you have ${branchSpent(SB)})` : '';
  const kind = SN.cap ? "★★ Capstone" : SN.choice ? "★ Crossroads" : "Passive";
  const segs = SO.max > 1 ? `<div class="ti-segs">${Array.from({ length: SO.max }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('')}</div>` : '';
  const alt = SN.choice ? SN.choice.find((o) => o !== SO) : null;
  box.innerHTML = `<div class="tv-head"><b>Talents</b>
      <span class="tv-pts ${pts ? 'has' : ''}"><i><img class="pico-ui" src="img/icons/talents.png" width="16" height="16" alt=""></i>${pts}<small>point${pts === 1 ? '' : 's'}</small></span>
      <small class="tv-sp">${talSpent()} spent · one per level</small>
      <button id="talReset" class="tv-reset" ${talSpent() && invReturn === 'hub' ? '' : 'disabled'} title="Free in Candela Village">↺ Reset</button></div>
    <div class="tv-grid"><div class="tv-tree">${rows}</div>
      <aside class="tv-info" style="--c:${SB.color}">
        <div class="ti-top"><span class="ti-medal ${r ? 'got' : ''} ${SN.cap ? 'cap' : ''}">${talIcon(SO.icon)}</span>
          <div><div class="ti-n">${SO.name}</div><span class="ti-chip">${kind}</span><span class="ti-br">${SB.name}</span></div></div>
        <div class="ti-d">${SO.d}</div>
        ${segs}
        ${alt ? `<div class="ti-alt"><span>or</span><b>${talIcon(alt.icon, 'sm')} ${alt.name}</b>${alt.d}</div>` : ''}
        <button id="talLearn" class="ti-learn" ${can ? '' : 'disabled'}>${r >= SO.max ? "✔ Learned" : r ? `Upgrade · rank ${r + 1}` : "Learn"}</button>
        ${why ? `<small class="ti-why">${why}</small>` : ''}</aside></div>`;
  for (const b of box.querySelectorAll('.tv-n')) b.onclick = () => { talSel = b.dataset.k; SFX.play('click'); buildTalents(); };
  $('talLearn').onclick = () => {
    if (!talCan(talSel)) return;
    talState()[talSel] = r + 1;
    SFX.play(SN.cap || SN.choice ? 'legend' : 'level');
    persist(); if (P) recalc();
    buildTalents();
    buildInventory();
    const el = $('shTalents').querySelector(`.tv-n[data-k="${talSel}"]`);
    if (el) { el.classList.add('pop'); }
  };
  $('talReset').onclick = () => { S.tal = {}; persist(); if (P) recalc(); SFX.play('zaap'); buildTalents(); buildInventory(); };
}
const _setInvModeT = setInvMode;
setInvMode = function (m) {
  _setInvModeT(m);
  $('inv').classList.toggle('mode-talents', m === 'talents');
  for (const b of $('shModes').querySelectorAll('button')) b.classList.toggle('on', b.dataset.m === m);
  if (m === 'talents') buildTalents();
};
// aviso de puntos de talento sin gastar en la pestaña
const _buildInventoryT = buildInventory;
buildInventory = function (j) {
  _buildInventoryT(j);
  const b = $('shModes') && $('shModes').querySelector('[data-m="talents"]');
  if (b && S) b.innerHTML = "<img class=\"pico-ui\" src=\"img/icons/talents.png\" width=\"18\" height=\"18\" alt=\"\"> Talents" + (talTree() && talPoints() ? ` <i class="badge">${talPoints()}</i>` : '');
};
