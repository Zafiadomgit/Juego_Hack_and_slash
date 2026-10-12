/* Fendaria — hack & slash para móvil.
 * Bucle: Villa Candela (hub con Portal Rúnico) -> Grieta (oleadas, barra de progreso) -> Guardián -> botín -> Portal de vuelta.
 * Todo el arte se dibuja por código (art.js). Datos en data.js.
 */
'use strict';

// ============================================================
// Utilidades
// ============================================================
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
const fmtTime = (t) => { t = Math.max(0, Math.ceil(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };

// ============================================================
// Canvas y escalado
// ============================================================
const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d', { alpha: false }); // `let`: la caché de sprites lo intercambia al dibujar
let W = 0, H = 0, DPR = 1, zoom = 1, ui = 1;

// Calidad adaptativa: si el móvil no llega a ~45 FPS se baja la resolución interna
const QUALITY = { maxDpr: 1.5, samples: [], checkT: 0 };
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, QUALITY.maxDpr);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  zoom = Math.min(W, H) / 420; // ~420 unidades de mundo en el lado corto
  ui = clamp(Math.min(W, H) / 400, 0.8, 1.6);
  spriteScaleUpdate(zoom * DPR);
  groundChunks.clear();
  vignetteCache = null;
}
const groundChunks = new Map();
let vignetteCache = null;
window.addEventListener('resize', resize);
resize();

// ============================================================
// Sonido (sintetizado con WebAudio)
// ============================================================
const SFX = {
  ac: null,
  muted: false,
  budget: 0,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ac = null; }
  },
  tone(freq, dur, type = 'square', vol = 0.06, slide = 0, delay = 0) {
    const c = this.ac;
    if (!c || this.muted) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },
  noise(dur, vol = 0.08, freq = 1500, q = 1) {
    const c = this.ac;
    if (!c || this.muted) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start();
  },
  play(name) {
    if (!this.ac || this.muted) return;
    if (this.budget > 6) return;
    this.budget++;
    switch (name) {
      case 'swing': this.noise(0.09, 0.07, 2600, 0.8); break;
      case 'shoot': this.tone(700, 0.08, 'triangle', 0.04, 400); break;
      case 'magic': this.tone(520, 0.12, 'sine', 0.06, 300); break;
      case 'hit': this.tone(170, 0.07, 'square', 0.035, -70); this.noise(0.05, 0.05, 900); break;
      case 'crit': this.tone(320, 0.1, 'sawtooth', 0.05, -200); this.noise(0.08, 0.08, 700); break;
      case 'boom': this.noise(0.35, 0.18, 300, 0.7); this.tone(90, 0.3, 'sine', 0.12, -50); break;
      case 'coin': this.tone(988, 0.05, 'square', 0.025); this.tone(1318, 0.09, 'square', 0.025, 0, 0.05); break;
      case 'xp': this.tone(1200 + Math.random() * 300, 0.04, 'sine', 0.02); break;
      case 'hurt': this.tone(220, 0.18, 'sawtooth', 0.06, -140); break;
      case 'level': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'square', 0.04, 0, i * 0.08)); break;
      case 'dash': this.noise(0.12, 0.06, 1800, 0.6); break;
      case 'shield': this.tone(400, 0.25, 'sine', 0.07, 400); break;
      case 'baa': this.tone(330, 0.25, 'sawtooth', 0.04, -80); this.tone(345, 0.25, 'sawtooth', 0.03, -60, 0.02); break;
      case 'piou': this.tone(1400, 0.12, 'square', 0.04, 600); break;
      case 'boss': [196, 185, 174, 164].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.06, 0, i * 0.18)); break;
      case 'die': this.tone(440, 0.6, 'triangle', 0.08, -380); break;
      case 'heal': this.tone(660, 0.15, 'sine', 0.05, 330); break;
      case 'click': this.tone(880, 0.04, 'square', 0.03); break;
      case 'loot': this.tone(740, 0.08, 'triangle', 0.05); this.tone(990, 0.12, 'triangle', 0.05, 0, 0.07); break;
      case 'legend': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.06, 0, i * 0.09)); break;
      case 'zaap': this.tone(300, 0.6, 'sine', 0.07, 900); break;
    }
  },
};

// ============================================================
// Guardado (localStorage)
// ============================================================
const SAVE_KEY = 'astrubSlash.v2';
const BAG_MAX = 36;
let SAVE = loadSave();
let S = null; // personaje activo

function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.slots) return s;
  } catch (e) { /* ignorar */ }
  return { slots: {}, last: null };
}
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* ignorar */ }
}
function newSlot(cls) {
  return {
    cls, level: 1, xp: 0, points: 0,
    stats: { vit: 0, sab: 0, fue: 0, int: 0, sue: 0, agi: 0 },
    kamas: 0, bag: [], equip: { arma: makeItem(cls, 1, 0, { slot: 'arma', name: 'de Novato' }) },
    dofus: [], maxFaille: 1, faille: 1, pan: 3, kills: 0, rifts: 0,
  };
}
const xpNext = (lvl) => Math.floor(30 + 22 * Math.pow(lvl, 1.7));

// ============================================================
// Estado
// ============================================================
let state = 'menu'; // menu | hub | play | pause | inv | end | dead
let scene = 'hub';  // hub | rift
let P = null;
let enemies = [], projectiles = [], pickups = [], particles = [], texts = [], slashes = [], rings = [], glyphs = [], timers = [];
let obstacles = [], decos = [], motes = [];
let cam = { x: 0, y: 0 };
let shakeMag = 0, hitStopT = 0, gameTime = 0, now = 0;
let rift = null, bossRef = null, banner = null, subBanner = null;
let streak = { n: 0, t: 0 };
let invReturn = 'hub';
let selectedClass = null;

// ============================================================
// Mundo de la Grieta
// ============================================================
const WORLD = { w: 2600, h: 2600 };

function genRift() {
  obstacles = [];
  decos = [];
  const cx = WORLD.w / 2, cy = WORLD.h / 2;
  const tryPlace = (r, minCenter) => {
    for (let k = 0; k < 30; k++) {
      const x = rand(80, WORLD.w - 80), y = rand(80, WORLD.h - 80);
      if (dist(x, y, cx, cy) < minCenter) continue;
      if (obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + r + 80)) continue;
      return { x, y };
    }
    return null;
  };
  for (let i = 0; i < 65; i++) {
    const pos = tryPlace(24, 260);
    if (pos) obstacles.push({ kind: 'tree', x: pos.x, y: pos.y, r: 22, s: rand(0.9, 1.3), hue: Math.random() < 0.6 ? 3 : 2 });
  }
  for (let i = 0; i < 45; i++) {
    const r = rand(12, 22);
    const pos = tryPlace(r, 200);
    if (pos) obstacles.push({ kind: 'rock', x: pos.x, y: pos.y, r, s: r / 16 });
  }
  for (let i = 0; i < 700; i++) {
    const t = Math.random();
    decos.push({
      x: rand(0, WORLD.w), y: rand(0, WORLD.h),
      kind: t < 0.45 ? 'fern' : t < 0.75 ? 'blotch' : 'pebble',
      c: pick(['#3e5a2a', '#4d6b30', '#2f4a22', '#5b6e2c']),
      s: rand(0.8, 1.6),
    });
  }
  motes = [];
  for (let i = 0; i < 40; i++) motes.push({ x: rand(0, 1), y: rand(0, 1), s: rand(1, 2.5), v: rand(0.004, 0.015), p: rand(0, 6) });
}

// Hub: Villa Candela
const HUB = { houses: [], stones: [], trees: [], lamps: [] };
function genHub() {
  HUB.houses = [
    { x: -270, y: -120, w: 90, h: 64, roof: '#c62828' },
    { x: 260, y: -150, w: 100, h: 70, roof: '#6a1b9a' },
    { x: -420, y: 90, w: 80, h: 58, roof: '#1565c0' },
    { x: 430, y: 60, w: 86, h: 60, roof: '#c62828' },
  ];
  HUB.stones = [];
  for (let i = 0; i < 260; i++) {
    const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random());
    HUB.stones.push({ x: Math.cos(a) * r * 300, y: Math.sin(a) * r * 170 + 10, w: rand(14, 26), h: rand(8, 14), c: pick(['#c8a878', '#bb9a6a', '#d2b48c', '#b08d5e']) });
  }
  HUB.trees = [];
  for (let i = 0; i < 26; i++) {
    const a = rand(0, Math.PI * 2);
    HUB.trees.push({ kind: 'tree', x: Math.cos(a) * rand(560, 900), y: Math.sin(a) * rand(330, 600), r: 22, s: rand(0.9, 1.3), hue: randi(0, 2) });
  }
}
genHub();

function makePattern(base, alt, line) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 64);
  g.fillStyle = alt;
  g.beginPath(); g.moveTo(64, 0); g.lineTo(128, 32); g.lineTo(64, 64); g.lineTo(0, 32); g.closePath(); g.fill();
  g.strokeStyle = line; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, 32); g.lineTo(64, 0); g.lineTo(128, 32); g.lineTo(64, 64); g.closePath(); g.stroke();
  const pat = ctx.createPattern(c, 'repeat');
  pat.src = c;
  return pat;
}
const grassPattern = makePattern('#7fb24a', '#78aa45', 'rgba(40,70,20,0.18)');
const riftPattern = makePattern('#5b3324', '#56301f', 'rgba(20,8,0,0.25)');

// ============================================================
// Entrada (táctil + teclado)
// ============================================================
const input = {
  mx: 0, my: 0,
  attack: false,
  pressed: { s0: false, s1: false, dash: false, pan: false },
  joy: null,
  touches: new Map(),
  keys: new Set(),
};

function buttonLayout() {
  const s = ui;
  const m = 18 * s;
  const ax = W - m - 52 * s, ay = H - m - 52 * s;
  return {
    attack: { x: ax, y: ay, r: 48 * s },
    s0: { x: ax - 108 * s, y: ay + 14 * s, r: 34 * s },
    s1: { x: ax - 82 * s, y: ay - 86 * s, r: 34 * s },
    dash: { x: ax + 6 * s, y: ay - 118 * s, r: 28 * s },
    pan: { x: ax - 182 * s, y: ay + 24 * s, r: 24 * s },
    pause: { x: W - 30 * s, y: 30 * s, r: 22 * s },
    bag: { x: W - 82 * s, y: 30 * s, r: 22 * s },
  };
}

function hitButton(x, y) {
  const L = buttonLayout();
  for (const k of ['attack', 's0', 's1', 'dash', 'pan', 'pause', 'bag']) {
    const b = L[k];
    if (dist(x, y, b.x, b.y) < b.r * 1.25) return k;
  }
  return null;
}

function clearInput() {
  input.attack = false; input.joy = null; input.mx = input.my = 0; input.touches.clear();
  input.pressed.s0 = input.pressed.s1 = input.pressed.dash = input.pressed.pan = false;
}

canvas.addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  SFX.init();
  if (state !== 'play') return;
  const x = ev.clientX, y = ev.clientY;
  const b = hitButton(x, y);
  if (b) {
    input.touches.set(ev.pointerId, b);
    if (b === 'attack') input.attack = true;
    else if (b === 'pause') pauseGame();
    else if (b === 'bag') openInventory('play');
    else input.pressed[b] = true;
    return;
  }
  if (x < W * 0.55 && !input.joy) {
    input.joy = { id: ev.pointerId, ox: x, oy: y, x, y };
    input.touches.set(ev.pointerId, 'joy');
  }
}, { passive: false });

canvas.addEventListener('pointermove', (ev) => {
  if (input.joy && ev.pointerId === input.joy.id) {
    const j = input.joy;
    const maxR = 60 * ui;
    let dx = ev.clientX - j.ox, dy = ev.clientY - j.oy;
    const d = Math.hypot(dx, dy);
    if (d > maxR) {
      j.ox += (dx / d) * (d - maxR);
      j.oy += (dy / d) * (d - maxR);
      dx = ev.clientX - j.ox; dy = ev.clientY - j.oy;
    }
    j.x = ev.clientX; j.y = ev.clientY;
    const dd = Math.hypot(dx, dy);
    if (dd < 8 * ui) { input.mx = 0; input.my = 0; }
    else { const k = Math.min(1, dd / maxR); input.mx = (dx / dd) * k; input.my = (dy / dd) * k; }
  }
});

function releasePointer(ev) {
  const b = input.touches.get(ev.pointerId);
  input.touches.delete(ev.pointerId);
  if (b === 'joy' || (input.joy && input.joy.id === ev.pointerId)) {
    input.joy = null; input.mx = 0; input.my = 0;
  }
  if (b === 'attack') input.attack = [...input.touches.values()].includes('attack');
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  SFX.init();
  const k = e.key.toLowerCase();
  if (input.keys.has(k)) return;
  input.keys.add(k);
  if (state === 'play') {
    if (k === 'k' || k === '1') input.pressed.s0 = true;
    if (k === 'l' || k === '2') input.pressed.s1 = true;
    if (k === 'shift' || k === 'i') input.pressed.dash = true;
    if (k === 'h' || k === '3') input.pressed.pan = true;
    if (k === 'b' || k === 'c') openInventory('play');
    if (k === 'escape' || k === 'p') pauseGame();
  } else if (state === 'pause' && (k === 'escape' || k === 'p')) resumeGame();
  else if (state === 'inv' && (k === 'escape' || k === 'b' || k === 'c')) closeInventory();
});
window.addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));

function readKeyboard() {
  if (input.joy) return;
  const K = input.keys;
  let x = 0, y = 0;
  if (K.has('a') || K.has('arrowleft') || K.has('q')) x -= 1;
  if (K.has('d') || K.has('arrowright')) x += 1;
  if (K.has('w') || K.has('arrowup') || K.has('z')) y -= 1;
  if (K.has('s') || K.has('arrowdown')) y += 1;
  const d = Math.hypot(x, y);
  input.mx = d ? x / d : 0;
  input.my = d ? y / d : 0;
}
const keyboardAttack = () => input.keys.has('j') || input.keys.has(' ');

// ============================================================
// Jugador y características
// ============================================================
function totalStats() {
  const t = { vit: 0, sab: 0, fue: 0, int: 0, sue: 0, agi: 0, dmg: 0, crit: 0, res: 0, pros: 0 };
  for (const k of CORE_STATS) t[k] += S.stats[k];
  for (const slot of SLOTS) {
    const it = S.equip[slot];
    if (!it) continue;
    for (const [k, v] of Object.entries(it.stats)) t[k] = (t[k] || 0) + v;
  }
  return t;
}

function derived() {
  const t = totalStats();
  const C = CLASSES[S.cls];
  const has = (d) => S.dofus.includes(d);
  return {
    maxHp: Math.round((C.hp + (S.level - 1) * 8 + t.vit * 2) * (has('esmeralda') ? 1.2 : 1)),
    power: 8 + S.level * 1.2 + t.dmg,
    dmgMul: (1 + t.fue * 0.01) * (has('purpura') ? 1.15 : 1),
    skillMul: 1 + t.int * 0.015,
    crit: Math.min(0.75, 0.05 + t.sue * 0.0015 + t.crit * 0.01 + (has('turquesa') ? 0.1 : 0)),
    atkSpeed: 1 + t.agi * 0.006,
    speed: C.speed * (1 + Math.min(0.35, t.agi * 0.002)),
    xpMul: 1 + t.sab * 0.01,
    paRegen: (1 / 1.25) * (1 + t.sab * 0.005) * (has('ocre') ? 1.3 : 1),
    armor: Math.min(0.6, t.res * 0.01),
    kamaMul: 1 + (t.pros + t.sue * 0.5) * 0.01,
    magnet: 80 * (1 + Math.min(1.5, t.pros * 0.004)),
    t,
  };
}

function recalc() {
  if (!P) return;
  const d = derived();
  const ratio = P.maxHp ? P.hp / P.maxHp : 1;
  Object.assign(P, d);
  P.hp = Math.min(P.maxHp, Math.max(1, Math.round(P.maxHp * ratio)));
}

function createPlayer() {
  const C = CLASSES[S.cls];
  P = {
    cls: S.cls, C,
    x: WORLD.w / 2, y: WORLD.h / 2, r: 14,
    dir: 0, aimHold: 0,
    hp: 1, maxHp: 0,
    pa: 6, maxPa: 6,
    pm: 3, maxPm: 3, pmRegen: 1 / 2.2,
    atkCd: 0, skillCd: [0, 0], panCd: 0,
    invul: 0, shield: 0, shieldT: 0,
    dashT: 0, dashVx: 0, dashVy: 0,
    lock: 0, jump: null, cast: null,
    walkT: 0, moving: false, hurtFlash: 0,
    swingT: 0, swingSide: 1, shotT: 0,
  };
  recalc();
  P.hp = P.maxHp;
}

function nearestEnemy(x, y, range) {
  let best = null, bd = range * range;
  for (const e of enemies) {
    if (e.dead || e.z > 30) continue;
    const dx = e.x - x, dy = e.y - y;
    const d = dx * dx + dy * dy - e.r * e.r;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function aimAt(range) {
  const t = nearestEnemy(P.x, P.y, range);
  if (t) return Math.atan2(t.y - P.y, t.x - P.x);
  if (P.moving) return Math.atan2(input.my, input.mx);
  return P.dir;
}

const basicDmg = () => P.power * P.C.basicMul * P.dmgMul;
const skillDmg = (mul) => P.power * mul * P.dmgMul * P.skillMul;

function basicAttack() {
  const cls = P.cls;
  if (cls === 'iop') {
    const a = aimAt(170);
    P.dir = a; P.aimHold = 0.3;
    P.swingT = 0.2; P.swingSide *= -1;
    const range = 80;
    slashes.push({ x: P.x, y: P.y, dir: a, arc: 2.3, range, life: 0.16, max: 0.16, color: '#fff6d0', side: P.swingSide, width: 22, follow: true });
    meleeArc(P.x, P.y, a, range, 1.2, basicDmg(), 240);
    P.x += Math.cos(a) * 5; P.y += Math.sin(a) * 5;
    P.atkCd = 0.42 / P.atkSpeed;
    SFX.play('swing');
  } else if (cls === 'cra') {
    const a = aimAt(460);
    P.dir = a; P.aimHold = 0.3; P.shotT = 0.15;
    projectiles.push({ team: 'p', kind: 'arrow', x: P.x + Math.cos(a) * 14, y: P.y - 6 + Math.sin(a) * 14, vx: Math.cos(a) * 680, vy: Math.sin(a) * 680, r: 6, dmg: basicDmg(), life: 0.75, pierce: 0, kb: 110, hit: [] });
    P.atkCd = 0.34 / P.atkSpeed;
    SFX.play('shoot');
  } else {
    const a = aimAt(400);
    P.dir = a; P.aimHold = 0.3; P.shotT = 0.15;
    projectiles.push({ team: 'p', kind: 'orb', x: P.x + Math.cos(a) * 16, y: P.y - 8 + Math.sin(a) * 16, vx: Math.cos(a) * 470, vy: Math.sin(a) * 470, r: 8, dmg: basicDmg(), life: 0.85, pierce: 1, kb: 160, hit: [] });
    P.atkCd = 0.46 / P.atkSpeed;
    SFX.play('magic');
  }
}

function meleeArc(x, y, a, range, halfArc, dmg, kb, heavy = false) {
  for (const e of enemies) {
    if (e.dead || e.z > 30) continue;
    const d = dist(x, y, e.x, e.y);
    if (d > range + e.r) continue;
    const ang = Math.atan2(e.y - y, e.x - x);
    if (d < e.r + 18 || Math.abs(angDiff(ang, a)) < halfArc) damageEnemy(e, dmg, { kb, fx: x, fy: y, heavy });
  }
}

function aoe(x, y, r, dmg, kb, heavy = false) {
  for (const e of enemies) {
    if (e.dead || e.z > 30) continue;
    if (dist(x, y, e.x, e.y) < r + e.r) damageEnemy(e, dmg, { kb, fx: x, fy: y, heavy });
  }
}

function useSkill(i) {
  const sk = P.C.skills[i];
  if (P.skillCd[i] > 0 || P.pa < sk.cost || P.lock > 0 || P.jump || P.cast) return;
  P.pa -= sk.cost;
  P.skillCd[i] = sk.cd;
  const cls = P.cls;

  if (cls === 'iop' && i === 0) {
    const t = nearestEnemy(P.x, P.y, 340);
    let tx, ty;
    if (t) { tx = t.x; ty = t.y; }
    else {
      const a = P.moving ? Math.atan2(input.my, input.mx) : P.dir;
      tx = P.x + Math.cos(a) * 200; ty = P.y + Math.sin(a) * 200;
    }
    tx = clamp(tx, 40, WORLD.w - 40); ty = clamp(ty, 40, WORLD.h - 40);
    P.dir = Math.atan2(ty - P.y, tx - P.x);
    P.jump = { sx: P.x, sy: P.y, tx, ty, t: 0, dur: 0.38 };
    SFX.play('dash');
  } else if (cls === 'iop' && i === 1) {
    const a = aimAt(230);
    P.dir = a; P.aimHold = 0.8;
    P.lock = 0.55;
    P.cast = { kind: 'cone', dir: a, range: 160, arc: 1.0, t: 0, max: 0.45 };
    later(0.45, () => {
      if (!P || scene !== 'rift') return;
      P.cast = null;
      slashes.push({ x: P.x, y: P.y, dir: a, arc: 2.2, range: 160, life: 0.28, max: 0.28, color: '#ffcc33', side: 1, width: 46, follow: false });
      meleeArc(P.x, P.y, a, 160, 1.05, skillDmg(7), 520, true);
      shake(16); hitStop(0.09);
      SFX.play('boom');
      for (let k = 0; k < 24; k++) {
        const aa = a + rand(-1, 1), sp = rand(150, 420);
        particles.push({ x: P.x, y: P.y, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, life: 0.5, max: 0.5, color: pick(['#ffcc33', '#ff7a1a', '#fff']), size: rand(2, 5), grav: 0 });
      }
    });
  } else if (cls === 'cra' && i === 0) {
    const a = aimAt(460);
    P.dir = a; P.aimHold = 0.3; P.shotT = 0.15;
    projectiles.push({ team: 'p', kind: 'explo', x: P.x, y: P.y - 6, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, r: 8, dmg: skillDmg(2.6), life: 0.8, pierce: 0, kb: 0, hit: [] });
    SFX.play('shoot');
  } else if (cls === 'cra' && i === 1) {
    const t = nearestEnemy(P.x, P.y, 440);
    const tx = t ? t.x : P.x + Math.cos(P.dir) * 160;
    const ty = t ? t.y : P.y + Math.sin(P.dir) * 160;
    const R = 125;
    rings.push({ x: tx, y: ty, r0: R, r1: R, life: 1.4, max: 1.4, color: 'rgba(120,220,120,', fill: true });
    for (let k = 0; k < 6; k++) {
      later(0.3 + k * 0.18, () => {
        for (let n = 0; n < 7; n++) {
          const aa = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * R;
          particles.push({ kind: 'fallArrow', x: tx + Math.cos(aa) * rr, y: ty + Math.sin(aa) * rr, vx: 0, vy: 0, life: 0.22, max: 0.22, color: '#5d4037', size: 2, grav: 0 });
        }
        aoe(tx, ty, R, skillDmg(1.25), 40);
        SFX.play('shoot');
      });
    }
  } else if (cls === 'feca' && i === 0) {
    P.shield = Math.round(P.maxHp * 0.45);
    P.shieldT = 6;
    rings.push({ x: P.x, y: P.y, r0: 20, r1: 120, life: 0.35, max: 0.35, color: 'rgba(130,200,255,' });
    aoe(P.x, P.y, 110, skillDmg(1.3), 480);
    SFX.play('shield');
    shake(5);
  } else if (cls === 'feca' && i === 1) {
    const t = nearestEnemy(P.x, P.y, 320);
    const gx = t ? t.x : P.x, gy = t ? t.y : P.y;
    glyphs.push({ x: gx, y: gy, r: 115, life: 4.5, max: 4.5, tick: 0 });
    SFX.play('magic');
  }
}

function dash() {
  if (P.pm < 1 || P.dashT > 0 || P.jump || P.lock > 0) return;
  P.pm -= 1;
  const a = P.moving ? Math.atan2(input.my, input.mx) : P.dir;
  P.dashT = 0.17;
  P.dashVx = Math.cos(a) * 720; P.dashVy = Math.sin(a) * 720;
  P.invul = Math.max(P.invul, 0.25);
  SFX.play('dash');
}

function eatBread() {
  if (S.pan <= 0 || P.panCd > 0 || P.hp >= P.maxHp) return;
  S.pan--;
  P.panCd = 1;
  heal(Math.round(P.maxHp * 0.4));
  SFX.play('heal');
  for (let i = 0; i < 12; i++) particles.push({ x: P.x + rand(-14, 14), y: P.y - rand(0, 36), vx: 0, vy: -50, life: 0.6, max: 0.6, color: '#76ff03', size: rand(2, 4), grav: 0 });
}

function updatePlayer(dt) {
  P.pa = Math.min(P.maxPa, P.pa + P.paRegen * dt);
  if (P.pm < P.maxPm) P.pm = Math.min(P.maxPm, P.pm + P.pmRegen * dt);
  P.atkCd -= dt; P.skillCd[0] -= dt; P.skillCd[1] -= dt; P.panCd -= dt;
  P.invul -= dt; P.lock -= dt; P.aimHold -= dt; P.hurtFlash -= dt;
  P.swingT -= dt; P.shotT -= dt;
  if (P.shieldT > 0) { P.shieldT -= dt; if (P.shieldT <= 0) P.shield = 0; }
  if (P.cast) P.cast.t += dt;

  P.moving = Math.hypot(input.mx, input.my) > 0.1;

  if (P.jump) {
    const j = P.jump;
    j.t += dt;
    const k = Math.min(1, j.t / j.dur);
    P.x = lerp(j.sx, j.tx, k); P.y = lerp(j.sy, j.ty, k);
    if (k >= 1) {
      P.jump = null;
      rings.push({ x: P.x, y: P.y, r0: 10, r1: 105, life: 0.3, max: 0.3, color: 'rgba(255,220,150,' });
      aoe(P.x, P.y, 100, skillDmg(2.4), 380, true);
      shake(9); SFX.play('boom');
      dust(P.x, P.y, 16);
    }
    return;
  }

  if (P.dashT > 0) {
    P.dashT -= dt;
    P.x += P.dashVx * dt; P.y += P.dashVy * dt;
    if (Math.random() < 0.8) particles.push({ x: P.x + rand(-6, 6), y: P.y + rand(-4, 4), vx: 0, vy: -20, life: 0.25, max: 0.25, color: 'rgba(255,255,255,0.7)', size: rand(3, 6), grav: 0 });
  } else if (P.lock <= 0 && P.moving) {
    P.x += input.mx * P.speed * dt;
    P.y += input.my * P.speed * dt;
    P.walkT += dt;
    if (P.aimHold <= 0) P.dir = Math.atan2(input.my, input.mx);
  }

  collideObstacles(P);
  P.x = clamp(P.x, 30, WORLD.w - 30);
  P.y = clamp(P.y, 30, WORLD.h - 30);

  if ((input.attack || keyboardAttack()) && P.atkCd <= 0 && P.lock <= 0 && !P.cast) basicAttack();
  if (input.pressed.s0) useSkill(0);
  if (input.pressed.s1) useSkill(1);
  if (input.pressed.dash) dash();
  if (input.pressed.pan) eatBread();
  input.pressed.s0 = input.pressed.s1 = input.pressed.dash = input.pressed.pan = false;
}

function heal(n) {
  if (!P) return;
  const before = P.hp;
  P.hp = Math.min(P.maxHp, P.hp + n);
  const got = Math.round(P.hp - before);
  if (got > 0) addText(P.x, P.y - 34, '+' + got, '#5cff6b', 1);
}

function hurtPlayer(dmg, sx, sy, src) {
  if (state !== 'play' || P.invul > 0 || P.dashT > 0 || P.jump) return;
  dmg = Math.max(1, Math.round(dmg * (1 - P.armor) * rand(0.9, 1.1)));
  if (P.shield > 0) {
    const a = Math.min(P.shield, dmg);
    P.shield -= a; dmg -= a;
    addText(P.x, P.y - 40, '-' + a, '#8fd0ff', 0.9);
    if (dmg <= 0) { P.invul = 0.25; SFX.play('hit'); return; }
  }
  P.hp -= dmg;
  addText(P.x, P.y - 40, '-' + dmg, '#ff3b3b', 1.15);
  P.invul = 0.55; P.hurtFlash = 0.25;
  shake(7); SFX.play('hurt');
  if (src && src.elite && src.elite.vampire) { src.hp = Math.min(src.maxHp, src.hp + dmg * 2); addText(src.x, src.y - src.r * 2, '+' + dmg * 2, '#ce93d8', 0.9); }
  if (sx !== undefined) {
    const a = Math.atan2(P.y - sy, P.x - sx);
    P.x += Math.cos(a) * 12; P.y += Math.sin(a) * 12;
  }
  if (P.hp <= 0) { P.hp = 0; playerDied(); }
}

// ============================================================
// Enemigos
// ============================================================
function spawnEnemy(type, x, y, o = {}) {
  const D = ENEMIES[type];
  const F = rift ? rift.level : 1;
  let lvl = o.lvl ?? (D.boss ? F * 3 + 2 : D.lvl + (F - 1) * 3);
  const elite = o.elite ? pick(ELITES) : null;
  if (elite) lvl += 2;
  const hpMul = 1 + (lvl - 1) * 0.2;
  const dmgMul = 1 + (lvl - 1) * 0.09;
  const hp = Math.round(D.hp * hpMul * (elite ? 3.5 : 1));
  const e = {
    type, D, x, y, r: D.r * (elite ? elite.size || 1.15 : 1),
    hp, maxHp: hp, lvl, elite, boss: !!D.boss,
    name: elite ? `${D.name} ${elite.suffix}` : D.name,
    speed: D.speed * rand(0.92, 1.08) * (elite && elite.speed ? elite.speed : 1),
    dmg: D.dmg * dmgMul * (elite ? 1.4 : 1),
    ai: D.ai, state: 'move', st: D.boss ? 1.5 : 0, cd: rand(0.5, 2), t: rand(0, 10), seed: rand(0, 10),
    kvx: 0, kvy: 0, flash: 0, hitCd: 0, slowT: 0, z: 0, face: 1, spawnT: 0.35,
    dead: false, cycle: 0, enraged: false,
  };
  enemies.push(e);
  if (e.boss) bossRef = e;
  return e;
}

function damageEnemy(e, base, o = {}) {
  if (e.dead) return;
  const crit = Math.random() < P.crit;
  const dmg = Math.max(1, Math.round(base * (crit ? 1.8 : 1) * rand(0.9, 1.1)));
  e.hp -= dmg;
  e.flash = 0.1;
  if (o.kb) {
    const a = Math.atan2(e.y - o.fy, e.x - o.fx);
    const k = o.kb * e.D.kbRes;
    e.kvx += Math.cos(a) * k; e.kvy += Math.sin(a) * k;
  }
  addText(e.x + rand(-6, 6), e.y - e.r - 10 - e.z, String(dmg), crit ? '#ffa726' : '#ffffff', crit ? 1.45 : 1);
  for (let i = 0; i < (crit ? 9 : 4); i++) {
    const a = rand(0, Math.PI * 2), sp = rand(60, 200);
    particles.push({ x: e.x, y: e.y - e.r * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.4, max: 0.4, color: e.D.blood, size: rand(2, 4), grav: 500 });
  }
  SFX.play(crit ? 'crit' : 'hit');
  if (crit || o.heavy) hitStop(o.heavy ? 0.06 : 0.035);
  if (e.boss && !e.enraged && e.hp > 0 && e.hp < e.maxHp * 0.5) {
    e.enraged = true;
    showBanner(`¡El ${e.D.name} entra en furia!`, '#ff5252');
    SFX.play('boss');
  }
  if (e.hp <= 0) killEnemy(e);
}

function itemLevel() { return Math.max(1, rift.level * 3 + randi(-1, 1)); }

function killEnemy(e) {
  e.dead = true;
  rift.kills++;
  S.kills++;
  const D = e.D;
  // racha de masacre
  streak.n = gameTime - streak.t < 1.6 ? streak.n + 1 : 1;
  streak.t = gameTime;
  // progreso de la Grieta
  if (!rift.bossSpawned) {
    rift.progress = Math.min(rift.goal, rift.progress + D.prog * (e.elite ? 4 : 1));
    if (rift.progress >= rift.goal) spawnGuardian();
  }
  // botín
  const lvlK = 1 + (e.lvl - 1) * 0.15;
  const eliteK = e.elite ? 3 * (e.elite.kamas || 1) : 1;
  const nK = Math.max(1, Math.round(randi(D.kamas[0], D.kamas[1]) * lvlK * eliteK * P.kamaMul));
  const coins = Math.min(8, Math.ceil(nK / 4));
  for (let i = 0; i < coins; i++) dropPickup(e.x, e.y, 'kama', { val: Math.max(1, Math.round(nK / coins)) });
  const xp = D.xp * (1 + (e.lvl - 1) * 0.3) * (e.elite ? 4 : 1);
  const orbs = Math.min(10, Math.ceil(xp / 4));
  for (let i = 0; i < orbs; i++) dropPickup(e.x, e.y, 'xp', { val: xp / orbs });
  if (Math.random() < 0.025) dropPickup(e.x, e.y, 'pain', { val: 25 });
  if (e.elite) dropPickup(e.x, e.y, 'item', { item: makeItem(S.cls, itemLevel(), Math.max(1, rollRarity(12))) });
  else if (!e.boss && Math.random() < 0.035) dropPickup(e.x, e.y, 'item', { item: makeItem(S.cls, itemLevel(), rollRarity()) });

  for (let i = 0; i < 14; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(40, 160);
    particles.push({ x: e.x, y: e.y - e.r * 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, max: 0.5, color: i % 2 ? '#ffffff' : D.blood, size: rand(3, 7), grav: 0 });
  }
  if (e.boss) guardianDefeated(e);
}

function dropPickup(x, y, type, o = {}) {
  const a = rand(0, Math.PI * 2), sp = type === 'item' || type === 'dofus' ? rand(60, 160) : rand(40, 140);
  pickups.push({ x, y, type, val: o.val || 0, item: o.item, id: o.id, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, z: 0, vz: rand(140, 220) });
}

function enemyShoot(e, a, speed, dmg) {
  projectiles.push({ team: 'e', kind: 'seed', x: e.x, y: e.y - 14, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 6, dmg, life: 2.4, pierce: 0, hit: [], src: e });
}

function updateEnemy(e, dt) {
  e.t += dt; e.flash -= dt; e.hitCd -= dt; e.slowT -= dt;
  if (e.spawnT > 0) { e.spawnT -= dt; return; }
  const dx = P.x - e.x, dy = P.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const sp = e.speed * (e.slowT > 0 ? 0.45 : 1);
  let mvx = 0, mvy = 0;
  let contactMul = 1;

  switch (e.ai) {
    case 'chase':
      mvx = ux * sp; mvy = uy * sp;
      break;
    case 'zigzag': {
      const s = Math.sin(e.t * 4 + e.seed) * 0.9;
      mvx = (ux - uy * s) * sp; mvy = (uy + ux * s) * sp;
      break;
    }
    case 'charger':
      if (e.state === 'move') {
        mvx = ux * sp; mvy = uy * sp;
        e.cd -= dt;
        if (d < 240 && e.cd <= 0) { e.state = 'wind'; e.st = 0.6; }
      } else if (e.state === 'wind') {
        e.st -= dt; e.cdx = ux; e.cdy = uy;
        if (e.st <= 0) { e.state = 'charge'; e.st = 0.5; if (Math.random() < 0.4) SFX.play('baa'); }
      } else if (e.state === 'charge') {
        e.st -= dt; contactMul = 1.4;
        mvx = e.cdx * sp * 4.8; mvy = e.cdy * sp * 4.8;
        if (Math.random() < 0.5) dust(e.x, e.y, 1);
        if (e.st <= 0) { e.state = 'rest'; e.st = 0.7; }
      } else {
        e.st -= dt;
        if (e.st <= 0) { e.state = 'move'; e.cd = rand(1.6, 2.8); }
      }
      break;
    case 'shooter': {
      if (d > 300) { mvx = ux * sp; mvy = uy * sp; }
      else if (d < 190) { mvx = -ux * sp; mvy = -uy * sp; }
      else { const s = Math.sin(e.seed) > 0 ? 1 : -1; mvx = -uy * sp * 0.5 * s; mvy = ux * sp * 0.5 * s; }
      e.cd -= dt;
      if (e.cd <= 0 && d < 480) {
        const a = Math.atan2(dy, dx);
        enemyShoot(e, a, 240, e.dmg);
        if (rift.level >= 3) { enemyShoot(e, a - 0.25, 240, e.dmg); enemyShoot(e, a + 0.25, 240, e.dmg); }
        e.cd = rand(1.9, 2.8); e.st = 0.25;
      }
      e.st -= dt;
      break;
    }
    case 'slammer':
      if (e.state === 'move') {
        mvx = ux * sp; mvy = uy * sp;
        if (d < e.r + 75) { e.state = 'wind'; e.st = 0.9; e.max = 0.9; }
      } else if (e.state === 'wind') {
        e.st -= dt;
        if (e.st <= 0) {
          const R = 110;
          rings.push({ x: e.x, y: e.y, r0: 20, r1: R, life: 0.3, max: 0.3, color: 'rgba(200,170,120,' });
          dust(e.x, e.y, 14); shake(8); SFX.play('boom');
          if (dist(P.x, P.y, e.x, e.y) < R + P.r) hurtPlayer(e.dmg * 1.4, e.x, e.y, e);
          e.state = 'rest'; e.st = 0.9;
        }
      } else {
        e.st -= dt;
        if (e.st <= 0) e.state = 'move';
      }
      break;
    case 'boss':
      updateBossBouftou(e, dt, d, ux, uy, sp);
      mvx = e.mvx; mvy = e.mvy;
      contactMul = e.state === 'charge' ? 1.5 : 1;
      break;
    case 'bossTofu':
      updateBossTofu(e, dt, d, ux, uy, sp);
      mvx = e.mvx; mvy = e.mvy;
      contactMul = e.state === 'charge' ? 1.6 : 1;
      break;
  }

  if (mvx || mvy) e.face = mvx >= 0 ? 1 : -1;
  e.x += (mvx + e.kvx) * dt;
  e.y += (mvy + e.kvy) * dt;
  const fr = Math.exp(-9 * dt);
  e.kvx *= fr; e.kvy *= fr;
  if (e.z <= 1) collideObstacles(e);
  e.x = clamp(e.x, 20, WORLD.w - 20);
  e.y = clamp(e.y, 20, WORLD.h - 20);

  if (e.z <= 1 && d < e.r + P.r - 2 && e.hitCd <= 0) {
    hurtPlayer(e.dmg * contactMul, e.x, e.y, e);
    e.hitCd = 0.8;
  }
}

function updateBossBouftou(e, dt, d, ux, uy, sp) {
  const spd = sp * (e.enraged ? 1.3 : 1);
  e.mvx = 0; e.mvy = 0;
  if (e.state === 'move') {
    e.mvx = ux * spd; e.mvy = uy * spd;
    e.st -= dt;
    if (e.st <= 0) {
      const next = ['charge', 'slam', 'summon', 'charge', 'slam'][e.cycle++ % 5];
      if (next === 'charge') { e.state = 'wind'; e.st = 0.7; e.charges = e.enraged ? 3 : 2; }
      else if (next === 'slam') { e.state = 'leap'; e.st = 1.0; e.max = 1.0; e.tx = P.x; e.ty = P.y; e.sx = e.x; e.sy = e.y; }
      else { e.state = 'summon'; e.st = 0.8; SFX.play('baa'); }
    }
  } else if (e.state === 'wind') {
    e.st -= dt; e.cdx = ux; e.cdy = uy;
    if (e.st <= 0) { e.state = 'charge'; e.st = 0.65; SFX.play('baa'); }
  } else if (e.state === 'charge') {
    e.st -= dt;
    e.mvx = e.cdx * spd * 5.5; e.mvy = e.cdy * spd * 5.5;
    if (Math.random() < 0.7) dust(e.x, e.y, 1);
    if (e.st <= 0) {
      e.charges--;
      if (e.charges > 0) { e.state = 'wind'; e.st = 0.45; }
      else { e.state = 'move'; e.st = e.enraged ? 1.6 : 2.4; }
    }
  } else if (e.state === 'leap') {
    e.st -= dt;
    const k = 1 - e.st / e.max;
    if (k < 0.45) { e.tx = lerp(e.tx, P.x, 0.08); e.ty = lerp(e.ty, P.y, 0.08); }
    e.x = lerp(e.sx, e.tx, k); e.y = lerp(e.sy, e.ty, k);
    e.z = Math.sin(k * Math.PI) * 110;
    e.kvx = e.kvy = 0;
    if (e.st <= 0) {
      e.z = 0;
      const R = 170;
      rings.push({ x: e.x, y: e.y, r0: 30, r1: R, life: 0.4, max: 0.4, color: 'rgba(255,240,200,' });
      dust(e.x, e.y, 24); shake(16); SFX.play('boom');
      if (dist(P.x, P.y, e.x, e.y) < R + P.r) hurtPlayer(e.dmg * 1.6, e.x, e.y, e);
      e.state = 'move'; e.st = e.enraged ? 1.4 : 2.2;
    }
  } else if (e.state === 'summon') {
    e.st -= dt;
    if (e.st <= 0) {
      const n = e.enraged ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const m = spawnEnemy(Math.random() < 0.3 ? 'tofu' : 'bouftou', e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70);
        poof(m.x, m.y);
      }
      e.state = 'move'; e.st = 2;
    }
  }
}

function updateBossTofu(e, dt, d, ux, uy, sp) {
  const spd = sp * (e.enraged ? 1.35 : 1);
  e.mvx = 0; e.mvy = 0;
  if (e.state === 'move') {
    // revolotea alrededor del jugador
    const side = Math.sin(e.t * 0.7) > 0 ? 1 : -1;
    const k = d > 220 ? 1 : d < 140 ? -0.6 : 0;
    e.mvx = (ux * k - uy * side * 0.8) * spd;
    e.mvy = (uy * k + ux * side * 0.8) * spd;
    e.st -= dt;
    if (e.st <= 0) {
      const next = ['dash', 'summon', 'dash', 'volley'][e.cycle++ % 4];
      if (next === 'dash') { e.state = 'wind'; e.max = e.enraged ? 0.55 : 0.8; e.st = e.max; e.charges = e.enraged ? 3 : 2; }
      else if (next === 'summon') { e.state = 'summon'; e.st = 0.6; SFX.play('piou'); }
      else { e.state = 'volley'; e.st = 1.2; e.cd = 0; }
    }
  } else if (e.state === 'wind') {
    e.st -= dt;
    if (e.st > 0.2) { e.cdx = ux; e.cdy = uy; }
    if (e.st <= 0) { e.state = 'charge'; e.st = 420 / 950; SFX.play('piou'); }
  } else if (e.state === 'charge') {
    e.st -= dt;
    e.mvx = e.cdx * 950; e.mvy = e.cdy * 950;
    if (Math.random() < 0.8) particles.push({ x: e.x, y: e.y - 10, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.35, max: 0.35, color: '#fff59d', size: rand(3, 6), grav: 0 });
    if (e.st <= 0) {
      e.charges--;
      if (e.charges > 0) { e.state = 'wind'; e.max = 0.45; e.st = e.max; }
      else { e.state = 'move'; e.st = e.enraged ? 1.3 : 2; }
    }
  } else if (e.state === 'summon') {
    e.st -= dt;
    if (e.st <= 0) {
      const n = e.enraged ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const m = spawnEnemy('tofu', e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60);
        poof(m.x, m.y);
      }
      e.state = 'move'; e.st = 1.8;
    }
  } else if (e.state === 'volley') {
    // lluvia de plumas en abanico
    e.st -= dt; e.cd -= dt;
    if (e.cd <= 0) {
      const a = Math.atan2(uy, ux);
      for (let i = -2; i <= 2; i++) enemyShoot(e, a + i * 0.22, 260, e.dmg * 0.7);
      e.cd = e.enraged ? 0.3 : 0.45;
    }
    if (e.st <= 0) { e.state = 'move'; e.st = 1.6; }
  }
}

function separateEnemies() {
  const n = enemies.length;
  for (let i = 0; i < n; i++) {
    const a = enemies[i];
    if (a.dead || a.z > 1) continue;
    for (let j = i + 1; j < n; j++) {
      const b = enemies[j];
      if (b.dead || b.z > 1) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const rr = a.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        const push = (rr - d) * 0.5;
        const nx = dx / d, ny = dy / d;
        const wa = a.boss ? 0.1 : 1, wb = b.boss ? 0.1 : 1;
        a.x -= nx * push * wa; a.y -= ny * push * wa;
        b.x += nx * push * wb; b.y += ny * push * wb;
      }
    }
  }
}

function collideObstacles(o) {
  for (const ob of obstacles) {
    const dx = o.x - ob.x, dy = o.y - ob.y;
    const rr = o.r + ob.r;
    const d2 = dx * dx + dy * dy;
    if (d2 < rr * rr) {
      const d = Math.sqrt(d2) || 0.01;
      o.x = ob.x + (dx / d) * rr;
      o.y = ob.y + (dy / d) * rr;
    }
  }
}

// ============================================================
// La Grieta
// ============================================================
const RIFT_TIME = 300;

function riftTypes(F) {
  return [['tofu', 4], ['bouftou', 3], ['arakne', 3], ['pissenlit', 2], ['craqueleur', F >= 3 ? 2 : 1]];
}

function weightedPick(list) {
  const total = list.reduce((s, x) => s + x[1], 0);
  let r = Math.random() * total;
  for (const [k, w] of list) { r -= w; if (r <= 0) return k; }
  return list[0][0];
}

function spawnPos() {
  const view = Math.hypot(W / 2, H / 2) / zoom;
  for (let k = 0; k < 12; k++) {
    const a = rand(0, Math.PI * 2);
    const r = view + rand(30, 120);
    const x = clamp(P.x + Math.cos(a) * r, 40, WORLD.w - 40);
    const y = clamp(P.y + Math.sin(a) * r, 40, WORLD.h - 40);
    if (dist(x, y, P.x, P.y) < 220) continue;
    if (obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + 30)) continue;
    return { x, y };
  }
  const a = rand(0, Math.PI * 2);
  return { x: clamp(P.x + Math.cos(a) * 400, 40, WORLD.w - 40), y: clamp(P.y + Math.sin(a) * 400, 40, WORLD.h - 40) };
}

function spawnPack() {
  const p = spawnPos();
  const n = randi(3, 5 + Math.floor(rift.level / 2));
  const types = riftTypes(rift.level);
  // los primeros segundos sin crujidores
  const early = rift.elapsed < 20;
  const eliteIdx = rift.elapsed > 15 && Math.random() < 0.14 ? 0 : -1;
  for (let i = 0; i < n; i++) {
    let type = weightedPick(types);
    if (early && type === 'craqueleur') type = 'bouftou';
    const e = spawnEnemy(type, p.x + rand(-50, 50), p.y + rand(-50, 50), { elite: i === eliteIdx });
    poof(e.x, e.y);
  }
}

function startRift(level) {
  SFX.init();
  scene = 'rift';
  genRift();
  groundChunks.clear();
  rift = {
    level, progress: 0, goal: 70 + level * 5, time: RIFT_TIME, elapsed: 0,
    bossSpawned: false, bossDead: false, zaap: null, spawnT: 1, kills: 0,
    items: 0, legendaries: 0, kamas0: S.kamas, xp: 0, levels: 0, bonus: 0, dofus: null,
  };
  createPlayer();
  enemies = []; projectiles = []; pickups = []; particles = []; texts = []; slashes = []; rings = []; glyphs = []; timers = [];
  cam.x = P.x; cam.y = P.y;
  bossRef = null; banner = null; subBanner = null;
  streak = { n: 0, t: -10 };
  clearInput();
  state = 'play';
  showOverlay(null);
  showBanner('Grieta ' + level, '#ffd76a', 'Llena la barra de progreso para invocar al Guardián');
  SFX.play('zaap');
  enterFullscreen();
}

function spawnGuardian() {
  rift.bossSpawned = true;
  const type = rift.level % 2 === 1 ? 'bouftouRoyal' : 'tofuRoyal';
  const p = spawnPos();
  const b = spawnEnemy(type, p.x, p.y);
  poof(b.x, b.y);
  showBanner('¡El Guardián aparece!', '#ff7043', ENEMIES[type].name + ' · niv. ' + b.lvl);
  SFX.play('boss');
  shake(10);
}

function guardianDefeated(e) {
  bossRef = null;
  rift.bossDead = true;
  shake(20); hitStop(0.2);
  SFX.play('boom');
  // limpiar invocaciones
  for (const m of enemies) if (!m.dead && m !== e) { m.dead = true; poof(m.x, m.y); }
  // botín del guardián
  const n = 4 + Math.floor(rift.level / 2);
  for (let i = 0; i < n; i++) {
    let r = rollRarity(10);
    if (i === 0) r = Math.max(2, r);
    const named = r === 3 ? { name: e.type === 'bouftouRoyal' ? 'del Colmillo Ancestral' : 'de la Garra Ígnea' } : {};
    dropPickup(e.x, e.y, 'item', { item: makeItem(S.cls, itemLevel() + 1, r, named) });
  }
  for (let i = 0; i < 3; i++) dropPickup(e.x, e.y, 'pain', { val: 30 });
  // ¿Gema Ancestral?
  const missing = Object.keys(GEMS).filter((k) => !S.dofus.includes(k));
  if (missing.length && Math.random() < 0.3 + rift.level * 0.07) dropPickup(e.x, e.y, 'dofus', { id: pick(missing) });
  // bonus de tiempo
  if (rift.time > 0) {
    rift.bonus = Math.round(40 * rift.level * P.kamaMul);
    for (let i = 0; i < 6; i++) dropPickup(e.x, e.y, 'kama', { val: Math.round(rift.bonus / 6) });
    dropPickup(e.x, e.y, 'item', { item: makeItem(S.cls, itemLevel(), Math.max(1, rollRarity(5))) });
  }
  showBanner(`¡${e.D.name} derrotado!`, '#ffd76a', 'Recoge el botín y cruza el Portal para volver a Villa Candela');
  // zaap de salida
  const zx = clamp(e.x + 140, 80, WORLD.w - 80), zy = clamp(e.y - 60, 80, WORLD.h - 80);
  for (const o of obstacles) if (dist(o.x, o.y, zx, zy) < 90) o.gone = true;
  obstacles = obstacles.filter((o) => !o.gone);
  later(1.2, () => { rift.zaap = { x: zx, y: zy }; poof(zx, zy - 30); SFX.play('zaap'); });
  S.maxFaille = Math.max(S.maxFaille, rift.level + 1);
  persist();
}

function updateRift(dt) {
  rift.elapsed += dt;
  if (!rift.bossDead) rift.time -= dt;
  if (!rift.bossSpawned) {
    rift.spawnT -= dt;
    const cap = 26 + rift.level * 2;
    if (rift.spawnT <= 0 && enemies.length < cap) {
      spawnPack();
      rift.spawnT = rand(1.3, 2.3) * Math.max(0.55, 1 - rift.level * 0.04);
    }
  }
  if (rift.zaap && dist(P.x, P.y, rift.zaap.x, rift.zaap.y - 10) < 34) finishRift();
  // fin de racha
  if (streak.n >= 10 && gameTime - streak.t > 1.6) {
    const bonus = Math.round(streak.n * 2 * P.kamaMul);
    S.kamas += bonus;
    gainXp(streak.n * rift.level);
    subBanner = { text: `Racha ×${streak.n}  ·  +${bonus} ámbar`, t: 2.5, max: 2.5 };
    SFX.play('coin');
    streak.n = 0;
  }
}

// ============================================================
// Proyectiles, botín, efectos
// ============================================================
function updateProjectiles(dt) {
  for (const p of projectiles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.life -= dt;
    if (p.team === 'p') {
      for (const e of enemies) {
        if (e.dead || e.z > 20 || p.hit.includes(e)) continue;
        if (dist(p.x, p.y, e.x, e.y - e.r * 0.4) < p.r + e.r) {
          if (p.kind === 'explo') { explode(p); p.life = -1; break; }
          p.hit.push(e);
          damageEnemy(e, p.dmg, { kb: p.kb, fx: p.x - p.vx, fy: p.y - p.vy });
          p.pierce--;
          if (p.pierce < 0) { p.life = -1; break; }
        }
      }
      if (p.life <= 0 && p.kind === 'explo' && !p.exploded) explode(p);
    } else if (dist(p.x, p.y, P.x, P.y - 8) < p.r + P.r) {
      hurtPlayer(p.dmg, p.x, p.y, p.src);
      p.life = -1;
    }
    if (p.kind === 'orb' && Math.random() < 0.6) {
      particles.push({ x: p.x, y: p.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.3, max: 0.3, color: '#9fd8ff', size: rand(2, 4), grav: 0 });
    }
    if (p.kind === 'explo' && Math.random() < 0.8) {
      particles.push({ x: p.x, y: p.y, vx: rand(-20, 20), vy: rand(-30, 0), life: 0.3, max: 0.3, color: pick(['#ffb300', '#ff5722']), size: rand(2, 4), grav: 0 });
    }
  }
  projectiles = projectiles.filter((p) => p.life > 0);
}

function explode(p) {
  p.exploded = true;
  const R = 88;
  aoe(p.x, p.y, R, p.dmg, 300, true);
  rings.push({ x: p.x, y: p.y, r0: 10, r1: R, life: 0.3, max: 0.3, color: 'rgba(255,160,40,' });
  for (let i = 0; i < 20; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(80, 280);
    particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.45, max: 0.45, color: pick(['#ffb300', '#ff5722', '#fff3e0']), size: rand(3, 6), grav: 0 });
  }
  shake(6); SFX.play('boom');
}

function updateGlyphs(dt) {
  for (const g of glyphs) {
    g.life -= dt;
    g.tick -= dt;
    for (const e of enemies) if (!e.dead && dist(g.x, g.y, e.x, e.y) < g.r + e.r * 0.5) e.slowT = 0.2;
    if (g.tick <= 0) { g.tick = 0.35; aoe(g.x, g.y, g.r, skillDmg(0.75), 0); }
    if (Math.random() < 0.7) {
      const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * g.r;
      particles.push({ x: g.x + Math.cos(a) * r, y: g.y + Math.sin(a) * r, vx: 0, vy: rand(-60, -20), life: 0.5, max: 0.5, color: pick(['#ff7043', '#ffca28', '#ff3d00']), size: rand(2, 4), grav: 0 });
    }
  }
  glyphs = glyphs.filter((g) => g.life > 0);
}

let bagFullMsgT = 0;
function updatePickups(dt) {
  bagFullMsgT -= dt;
  for (const k of pickups) {
    k.t += dt;
    if (k.vz !== 0 || k.z > 0) {
      k.vz -= 600 * dt; k.z += k.vz * dt;
      if (k.z <= 0) { k.z = 0; k.vz = 0; }
    }
    const d = dist(k.x, k.y, P.x, P.y);
    const magnetic = k.type === 'kama' || k.type === 'xp';
    if (magnetic && k.t > 0.35 && d < P.magnet) {
      const a = Math.atan2(P.y - k.y, P.x - k.x);
      const sp = 260 + (P.magnet - d) * 6;
      k.vx = Math.cos(a) * sp; k.vy = Math.sin(a) * sp;
    } else {
      const fr = Math.exp(-4 * dt);
      k.vx *= fr; k.vy *= fr;
    }
    k.x += k.vx * dt; k.y += k.vy * dt;
    if (k.t > 0.4 && d < P.r + (magnetic ? 10 : 18)) collect(k);
    if (magnetic && k.t > 60) k.taken = true;
  }
  pickups = pickups.filter((k) => !k.taken);
}

function collect(k) {
  if (k.type === 'kama') { S.kamas += k.val; SFX.play('coin'); }
  else if (k.type === 'xp') { gainXp(k.val); SFX.play('xp'); }
  else if (k.type === 'pain') {
    if (P.hp >= P.maxHp && S.pan < 5) { S.pan++; addText(P.x, P.y - 40, '+1 🧪', '#b5f28a', 0.9); }
    else heal(Math.round(P.maxHp * 0.25));
    SFX.play('heal');
  } else if (k.type === 'item') {
    if (S.bag.length >= BAG_MAX) {
      if (bagFullMsgT <= 0) { addText(P.x, P.y - 50, '¡Bolsa llena!', '#ff8a80', 1); bagFullMsgT = 2; }
      return;
    }
    S.bag.push(k.item);
    rift.items++;
    const R = RARITY[k.item.rarity];
    addText(P.x, P.y - 50, k.item.name, R.color, 0.85);
    if (k.item.rarity === 3) {
      rift.legendaries++;
      showBanner('Objeto legendario: ' + k.item.name + '!', '#ffa726');
      SFX.play('legend');
    } else SFX.play('loot');
  } else if (k.type === 'dofus') {
    if (!S.dofus.includes(k.id)) S.dofus.push(k.id);
    rift.dofus = k.id;
    recalc();
    showBanner(GEMS[k.id].name.toUpperCase(), GEMS[k.id].color, GEMS[k.id].desc);
    banner.egg = k.id;
    SFX.play('legend');
    shake(6);
  }
  k.taken = true;
}

function gainXp(v) {
  v *= P.xpMul;
  S.xp += v;
  rift.xp += v;
  while (S.xp >= xpNext(S.level)) {
    S.xp -= xpNext(S.level);
    S.level++;
    S.points += 5;
    rift.levels++;
    recalc();
    P.hp = P.maxHp;
    showBanner('¡Nivel ' + S.level + '!', '#7dd3ff', '+5 puntos de característica (abre la bolsa 🎒)');
    SFX.play('level');
    rings.push({ x: P.x, y: P.y, r0: 10, r1: 90, life: 0.5, max: 0.5, color: 'rgba(120,210,255,' });
  }
}

function updateEffects(dt) {
  for (const p of particles) {
    p.life -= dt;
    p.vy += (p.grav || 0) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  particles = particles.filter((p) => p.life > 0);
  if (particles.length > 350) particles.splice(0, particles.length - 350);
  for (const t of texts) { t.life -= dt; t.y -= 38 * dt; }
  texts = texts.filter((t) => t.life > 0);
  for (const s of slashes) {
    s.life -= dt;
    if (s.follow && P) { s.x = P.x; s.y = P.y; }
  }
  slashes = slashes.filter((s) => s.life > 0);
  for (const r of rings) r.life -= dt;
  rings = rings.filter((r) => r.life > 0);
  for (const t of timers) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; t.fn(); } }
  timers = timers.filter((t) => !t.done);
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  if (subBanner) { subBanner.t -= dt; if (subBanner.t <= 0) subBanner = null; }
}

function later(t, fn) { timers.push({ t, fn, done: false }); }
function addText(x, y, txt, color, scale) { texts.push({ x, y, txt, color, scale, life: 0.9, max: 0.9 }); }
function shake(m) { shakeMag = Math.max(shakeMag, m); }
function hitStop(t) { hitStopT = Math.max(hitStopT, t); }
function showBanner(text, color, sub) { banner = { text, color, sub, t: 2.8, max: 2.8 }; }
function dust(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(30, 140);
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, life: 0.5, max: 0.5, color: 'rgba(214,196,150,0.8)', size: rand(3, 7), grav: 0 });
  }
}
function poof(x, y) {
  for (let i = 0; i < 10; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(30, 90);
    particles.push({ x, y: y - 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.45, max: 0.45, color: 'rgba(255,255,255,0.85)', size: rand(4, 8), grav: 0 });
  }
}

// ============================================================
// HUD
// ============================================================
function roundRect(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

function drawStar(x, y, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
}

function drawHeart(x, y, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = '#3a0a0a'; ctx.lineWidth = 1.5; ctx.stroke();
}

function text(str, x, y, size, color, align = 'left', weight = 800, stroke = true) {
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = Math.max(2, size / 6); ctx.strokeStyle = 'rgba(20,10,0,0.85)'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawHUD() {
  const s = ui;
  const pad = 12 * s;
  const L = buttonLayout();
  const nextXp = xpNext(S.level);

  // XP barra superior
  roundRect(0, 0, W, 5 * s, 0, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(0, 0, W * clamp(S.xp / nextXp, 0, 1), 5 * s);

  // retrato
  const px = pad + 26 * s, py = pad + 30 * s;
  circle(px, py, 26 * s, '#3a2a17', '#c9a24a', 3 * s);
  ctx.save();
  ctx.beginPath(); ctx.arc(px, py, 24 * s, 0, Math.PI * 2); ctx.clip();
  ctx.translate(px, py + 30 * s);
  ctx.scale(s * 1.15, s * 1.15);
  drawHero(ctx, P.cls, { x: 0, y: 0, dir: 0.2, walkT: 0, moving: false, swing: 0, swingSide: 1, shot: 0, t: now });
  ctx.restore();
  roundRect(px - 13 * s, py + 17 * s, 26 * s, 15 * s, 6 * s, '#c9a24a');
  text(String(S.level), px, py + 25 * s, 12 * s, '#2a1d0e', 'center', 900, false);

  // PV
  const bx = px + 34 * s, bw = Math.min(190 * s, W * 0.28), bh = 16 * s;
  let by = pad + 8 * s;
  roundRect(bx, by, bw, bh, bh / 2, 'rgba(0,0,0,0.6)', '#2a1d0e', 2);
  const hpk = Math.max(0, P.hp / P.maxHp);
  if (hpk > 0) roundRect(bx + 2, by + 2, (bw - 4) * hpk, bh - 4, (bh - 4) / 2, hpk < 0.3 ? '#ff1744' : '#e53935');
  if (P.shield > 0) roundRect(bx + 2, by + 2, Math.min(bw - 4, (bw - 4) * (P.shield / P.maxHp)), (bh - 4) / 2, 3, 'rgba(140,210,255,0.85)');
  drawHeart(bx + 2 * s, by + bh / 2, 10 * s, '#e53935');
  text(Math.ceil(P.hp) + ' / ' + P.maxHp, bx + 16 * s, by + bh / 2 + 1, 11 * s, '#fff', 'left', 800);

  // PA y PM
  by += bh + 6 * s;
  for (let i = 0; i < P.maxPa; i++) {
    const cx = bx + 9 * s + i * 17 * s, cy = by + 8 * s;
    drawStar(cx, cy, 8 * s, 'rgba(0,0,0,0.5)');
    const fillK = clamp(P.pa - i, 0, 1);
    if (fillK >= 1) drawStar(cx, cy, 7 * s, '#29b6f6');
    else if (fillK > 0) drawStar(cx, cy, 7 * s * fillK, '#0277bd');
  }
  text('EN', bx + 9 * s + P.maxPa * 17 * s, by + 8 * s, 10 * s, '#81d4fa', 'left', 900);
  by += 18 * s;
  for (let i = 0; i < P.maxPm; i++) {
    const cx = bx + 9 * s + i * 17 * s, cy = by + 8 * s;
    circle(cx, cy, 7 * s, 'rgba(0,0,0,0.5)');
    const fillK = clamp(P.pm - i, 0, 1);
    if (fillK > 0) circle(cx, cy, 6 * s * (fillK >= 1 ? 1 : fillK * 0.8), fillK >= 1 ? '#66bb6a' : '#2e7d32');
  }
  text('IM', bx + 9 * s + P.maxPm * 17 * s, by + 8 * s, 10 * s, '#a5d6a7', 'left', 900);

  // botones pausa / bolsa
  circle(L.pause.x, L.pause.y, L.pause.r, 'rgba(0,0,0,0.45)', '#c9a24a', 2);
  ctx.fillStyle = '#f3ead2';
  ctx.fillRect(L.pause.x - 6 * s, L.pause.y - 7 * s, 4 * s, 14 * s);
  ctx.fillRect(L.pause.x + 2 * s, L.pause.y - 7 * s, 4 * s, 14 * s);
  circle(L.bag.x, L.bag.y, L.bag.r, 'rgba(0,0,0,0.45)', '#c9a24a', 2);
  text('🎒', L.bag.x, L.bag.y + 1, 18 * s, '#fff', 'center', 400, false);
  if (S.points > 0) {
    circle(L.bag.x + L.bag.r * 0.75, L.bag.y - L.bag.r * 0.7, 8 * s, '#e53935');
    text(String(S.points), L.bag.x + L.bag.r * 0.75, L.bag.y - L.bag.r * 0.7, 9 * s, '#fff', 'center', 900, false);
  }

  // panel de la Faille (arriba a la derecha)
  const rx = W - pad, ry = 66 * s;
  text('Grieta ' + rift.level, rx - 150 * s, ry, 13 * s, '#ffd76a', 'left', 900);
  const tcol = rift.time > 30 ? '#f3ead2' : '#ff8a80';
  text(rift.bossSpawned ? (rift.bossDead ? '✔' : 'GUARDIÁN') : fmtTime(rift.time), rx, ry, 12 * s, rift.bossSpawned ? '#ff7043' : tcol, 'right', 900);
  const pw = 150 * s;
  roundRect(rx - pw, ry + 9 * s, pw, 8 * s, 4 * s, 'rgba(0,0,0,0.6)', '#6b5228', 1.5);
  const pk = rift.progress / rift.goal;
  if (pk > 0) roundRect(rx - pw + 1.5, ry + 10.5 * s, (pw - 3) * pk, 5 * s, 3 * s, rift.bossSpawned ? '#ff7043' : '#ffb300');

  // minimapa (radar)
  const mr = 30 * s, mx = rx - mr, my = ry + 26 * s + mr;
  circle(mx, my, mr, 'rgba(20,12,4,0.55)', '#c9a24a', 2);
  ctx.save();
  ctx.beginPath(); ctx.arc(mx, my, mr - 2, 0, Math.PI * 2); ctx.clip();
  const ms = mr / 900;
  for (const e of enemies) {
    if (e.dead) continue;
    const ex = mx + (e.x - P.x) * ms, ey = my + (e.y - P.y) * ms;
    circle(ex, ey, e.boss ? 4 * s : e.elite ? 2.6 * s : 1.6 * s, e.boss ? '#ff3d00' : e.elite ? e.elite.color : '#ff8a80');
  }
  for (const k of pickups) if (k.type === 'item' || k.type === 'dofus') circle(mx + (k.x - P.x) * ms, my + (k.y - P.y) * ms, 2 * s, k.type === 'dofus' ? '#26c6da' : RARITY[k.item.rarity].color);
  if (rift.zaap) { const zx = mx + (rift.zaap.x - P.x) * ms, zy = my + (rift.zaap.y - P.y) * ms; circle(clamp(zx, mx - mr + 5, mx + mr - 5), clamp(zy, my - mr + 5, my + mr - 5), 4 * s, '#4fc3f7', '#fff', 1.5); }
  ctx.restore();
  drawStar(mx, my, 3.5 * s, '#fff');
  text(S.kamas + ' ámbar', mx - mr - 8 * s, my - 8 * s, 13 * s, '#ffd76a', 'right', 900);
  text('☠ ' + rift.kills, mx - mr - 8 * s, my + 10 * s, 11 * s, '#f3ead2', 'right', 800);

  // jefe
  if (bossRef && !bossRef.dead) {
    const w = Math.min(W * 0.42, 340 * s), x = W / 2 - w / 2, y = pad + 18 * s;
    text(bossRef.D.name + ' · niv. ' + bossRef.lvl, W / 2, y - 6 * s, 13 * s, bossRef.enraged ? '#ff5252' : '#ffd76a', 'center', 900);
    roundRect(x, y + 2 * s, w, 12 * s, 6 * s, 'rgba(0,0,0,0.65)', '#c9a24a', 2);
    roundRect(x + 2, y + 2 * s + 2, (w - 4) * Math.max(0, bossRef.hp / bossRef.maxHp), 12 * s - 4, 4 * s, '#d84315');
  }

  // racha
  if (streak.n >= 5 && gameTime - streak.t < 1.6) {
    text('Racha ×' + streak.n, pad, H * 0.42, 15 * s, '#ffcc80', 'left', 900);
  }

  drawBanners();
  drawControls();
}

function drawBanners() {
  const s = ui;
  if (banner) {
    const k = banner.t / banner.max;
    const a = Math.min(1, (1 - k) * 6, k * 3);
    ctx.save();
    ctx.globalAlpha = a;
    const sc = 1 + Math.max(0, k - 0.85) * 2;
    let y = H * 0.3;
    if (banner.egg) {
      drawGem(ctx, W / 2, H * 0.3 - 40 * s, 2.6 * s, GEMS[banner.egg].color, now);
      y += 10 * s;
    }
    text(banner.text, W / 2, y, Math.min(28 * s * sc, (W * 0.9) / Math.max(8, banner.text.length) * 1.8), banner.color, 'center', 900);
    if (banner.sub) text(banner.sub, W / 2, y + 26 * s, 12 * s, '#f3ead2', 'center', 700);
    ctx.restore();
  }
  if (subBanner) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, subBanner.t * 2);
    text(subBanner.text, W / 2, H * 0.3 + 54 * s, 14 * s, '#ffcc80', 'center', 900);
    ctx.restore();
  }
}

function drawControls() {
  const s = ui;
  const L = buttonLayout();
  if (input.joy) {
    const j = input.joy;
    circle(j.ox, j.oy, 60 * s, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.35)', 2);
    circle(j.ox + input.mx * 60 * s, j.oy + input.my * 60 * s, 26 * s, 'rgba(255,240,200,0.45)', 'rgba(255,255,255,0.7)', 2);
  } else if (isTouch) {
    const x = 90 * s, y = H - 90 * s;
    circle(x, y, 60 * s, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.18)', 2);
    circle(x, y, 26 * s, 'rgba(255,255,255,0.12)');
  }

  const btn = (b, label, sub, color, cdk, enabled, held) => {
    ctx.save();
    ctx.globalAlpha = enabled ? 1 : 0.55;
    circle(b.x, b.y, b.r, held ? 'rgba(255,220,140,0.55)' : 'rgba(30,20,8,0.55)', color, 3);
    if (cdk > 0) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdk);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fill();
    }
    text(label, b.x, b.y - (sub ? 4 * s : 0), b.r * 0.75, '#fff', 'center', 900);
    if (sub) text(sub, b.x, b.y + b.r * 0.5, 10 * s, '#81d4fa', 'center', 900);
    ctx.restore();
  };

  const atkIcon = P.cls === 'iop' ? '⚔' : P.cls === 'cra' ? '➶' : '✦';
  btn(L.attack, atkIcon, null, '#ffd76a', 0, true, input.attack);
  for (let i = 0; i < 2; i++) {
    const sk = P.C.skills[i];
    const cdk = clamp(P.skillCd[i] / sk.cd, 0, 1);
    btn(L['s' + i], sk.icon, sk.cost + ' EN', '#29b6f6', cdk, P.pa >= sk.cost && cdk <= 0, false);
  }
  const pmk = P.pm >= 1 ? 0 : 1 - (P.pm % 1);
  btn(L.dash, '»', String(Math.floor(P.pm)), '#66bb6a', pmk, P.pm >= 1, false);
  btn(L.pan, '🧪', String(S.pan), '#7cc457', 0, S.pan > 0, false);
}

// ============================================================
// Render
// ============================================================
function renderRift() {
  const sx = shakeMag > 0 ? rand(-shakeMag, shakeMag) : 0;
  const sy = shakeMag > 0 ? rand(-shakeMag, shakeMag) : 0;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x + sx, -cam.y + sy);

  const vw = W / zoom / 2 + 80, vh = H / zoom / 2 + 100;
  const vl = cam.x - vw, vr = cam.x + vw, vt = cam.y - vh, vb = cam.y + vh;
  const inView = (x, y, m = 0) => x > vl - m && x < vr + m && y > vt - m && y < vb + m;

  // suelo pre-renderizado por trozos (una sola copia de imagen por trozo visible)
  const c0x = Math.max(0, Math.floor(vl / CHUNK)), c1x = Math.min(Math.ceil(WORLD.w / CHUNK) - 1, Math.floor(vr / CHUNK));
  const c0y = Math.max(0, Math.floor(vt / CHUNK)), c1y = Math.min(Math.ceil(WORLD.h / CHUNK) - 1, Math.floor(vb / CHUNK));
  for (let cy = c0y; cy <= c1y; cy++) {
    for (let cx = c0x; cx <= c1x; cx++) ctx.drawImage(groundChunk(cx, cy), cx * CHUNK - 0.5, cy * CHUNK - 0.5, CHUNK + 1, CHUNK + 1);
  }
  ctx.strokeStyle = '#1a0d08'; ctx.lineWidth = 24;
  ctx.strokeRect(-12, -12, WORLD.w + 24, WORLD.h + 24);

  for (const g of glyphs) drawGlyph(g);
  for (const r of rings) {
    if (!r.fill) continue;
    const k = r.life / r.max;
    circle(r.x, r.y, r.r1, r.color + (0.15 * k) + ')', r.color + (0.7 * k) + ')', 2);
  }

  if (rift.zaap) drawPortal(rift.zaap.x, rift.zaap.y, now);
  for (const k of pickups) if (inView(k.x, k.y, 200)) drawPickup(k);
  if (P.cast) drawCast();

  const drawList = [];
  for (const o of obstacles) if (inView(o.x, o.y, 60)) drawList.push(o);
  for (const e of enemies) if (inView(e.x, e.y, 60)) drawList.push(e);
  drawList.push(P);
  drawList.sort((a, b) => a.y - b.y);
  for (const o of drawList) {
    if (o === P) drawPlayer();
    else if (o.kind === 'tree') drawTree(o);
    else if (o.kind === 'rock') drawRock(o);
    else drawEnemy(o);
  }

  for (const p of projectiles) if (inView(p.x, p.y)) drawProjectile(p);
  for (const s of slashes) drawSlash(s);
  for (const r of rings) {
    if (r.fill) continue;
    const k = 1 - r.life / r.max;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.translate(r.x, r.y); ctx.scale(1, 0.7);
    circle(0, 0, lerp(r.r0, r.r1, k), null, r.color + '0.9)', 5 * (1 - k) + 1);
    ctx.restore();
  }
  for (const p of particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a;
    if (p.kind === 'fallArrow') {
      const off = a * 60;
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x - 6, p.y - off - 16); ctx.lineTo(p.x, p.y - off); ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2);
    const pop = 1 + Math.max(0, t.life - t.max + 0.15) * 4;
    text(t.txt, t.x, t.y, 15 * t.scale * pop, t.color, 'center', 900);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // atmósfera: motas flotantes y viñeta
  for (const m of motes) {
    m.y -= m.v * 0.016; m.x += Math.sin(now + m.p) * 0.0004;
    if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
    ctx.globalAlpha = 0.35 + Math.sin(now * 2 + m.p) * 0.25;
    circle(m.x * W, m.y * H, m.s * ui, '#ffe9b0');
  }
  ctx.globalAlpha = 1;
  drawVignette(P.hp / P.maxHp < 0.3);

  drawHUD();
}

function renderHub() {
  const hz = zoom * 0.8;
  const offX = W > H * 1.2 ? (W * 0.2) / hz : 0;
  const cx = offX, cy = -30;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(hz, hz);
  ctx.translate(-cx, -cy);
  const vw = W / hz / 2 + 50, vh = H / hz / 2 + 50;
  ctx.fillStyle = grassPattern;
  ctx.fillRect(cx - vw, cy - vh, vw * 2, vh * 2);
  // plaza empedrada
  ellipse(0, 10, 315, 182, '#a88a5c');
  for (const st of HUB.stones) {
    ctx.fillStyle = st.c;
    ctx.beginPath(); ctx.roundRect(st.x - st.w / 2, st.y - st.h / 2, st.w, st.h, 3); ctx.fill();
  }
  const list = [...HUB.houses.map((h) => ({ y: h.y, f: () => drawHouse(h) })), ...HUB.trees.map((t) => ({ y: t.y, f: () => drawTree(t) }))];
  list.push({ y: -20, f: () => drawPortal(0, -20, now) });
  const hero = { y: 70, f: () => { shadow(-10, 70, 13); drawHero(ctx, S ? S.cls : selectedClass || 'iop', { x: -10, y: 70, dir: -0.6, walkT: 0, moving: false, swing: 0, swingSide: 1, shot: 0, t: now }); } };
  if (S || selectedClass) list.push(hero);
  list.sort((a, b) => a.y - b.y);
  for (const o of list) o.f();
  // jabalíes paseando por Villa Candela
  for (let i = 0; i < 3; i++) {
    const t = now * 0.3 + i * 2.1;
    const e = { type: 'bouftou', x: Math.cos(t) * (420 + i * 40), y: 210 + Math.sin(t * 1.3) * 40 + i * 20, r: 13, t: now + i, state: 'move', face: -Math.sin(t) >= 0 ? 1 : -1, z: 0, flash: 0 };
    shadow(e.x, e.y + 1, e.r);
    drawMonsterBody(e);
  }
  ctx.restore();
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = scene === 'rift' ? '#1a0d08' : '#3d6b25';
  ctx.fillRect(0, 0, W, H);
  if (scene === 'rift' && P && rift) renderRift();
  else renderHub();
}

// ============================================================
// Bucle principal
// ============================================================
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let last = performance.now();

function update(dt) {
  gameTime += dt;
  readKeyboard();
  updatePlayer(dt);
  for (const e of enemies) if (!e.dead) updateEnemy(e, dt);
  separateEnemies();
  enemies = enemies.filter((e) => !e.dead);
  updateProjectiles(dt);
  updateGlyphs(dt);
  updatePickups(dt);
  updateEffects(dt);
  if (state === 'play') updateRift(dt);
  cam.x = lerp(cam.x, P.x, 1 - Math.exp(-8 * dt));
  cam.y = lerp(cam.y, P.y - 10, 1 - Math.exp(-8 * dt));
}

function frame(t) {
  const raw = Math.min(0.05, (t - last) / 1000);
  last = t;
  now = t / 1000;
  SFX.budget = 0;
  if (state === 'play') {
    if (hitStopT > 0) hitStopT -= raw;
    else update(raw);
  }
  shakeMag = Math.max(0, shakeMag - raw * 40);
  render();
  adaptQuality(raw);
  requestAnimationFrame(frame);
}

function adaptQuality(dt) {
  if (state !== 'play' || QUALITY.maxDpr <= 1) return;
  QUALITY.samples.push(dt);
  QUALITY.checkT += dt;
  if (QUALITY.checkT < 3) return;
  const avg = QUALITY.samples.reduce((a, b) => a + b, 0) / QUALITY.samples.length;
  QUALITY.samples = []; QUALITY.checkT = 0;
  if (avg > 1 / 45 && (window.devicePixelRatio || 1) > 1) { QUALITY.maxDpr = 1; resize(); }
}

// Trozo de suelo: textura + manchas + helechos + guijarros, dibujado una vez
const CHUNK = 520;
function groundChunk(cx, cy) {
  const key = cx + ',' + cy;
  let c = groundChunks.get(key);
  if (c) return c;
  const gs = Math.min(1.4, Math.max(0.8, zoom * DPR));
  c = document.createElement('canvas');
  c.width = c.height = Math.ceil(CHUNK * gs);
  const g = c.getContext('2d', { alpha: false });
  g.scale(gs, gs);
  g.translate(-cx * CHUNK, -cy * CHUNK);
  g.fillStyle = g.createPattern(riftPattern.src, 'repeat');
  g.fillRect(cx * CHUNK, cy * CHUNK, CHUNK, CHUNK);
  // grano de tierra
  let seed = (cx * 73856093) ^ (cy * 19349663);
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 900; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(25,10,5,0.22)' : 'rgba(150,100,70,0.16)';
    const sz = 1 + rnd() * 2.5;
    g.fillRect(cx * CHUNK + rnd() * CHUNK, cy * CHUNK + rnd() * CHUNK, sz, sz);
  }
  const saved = ctx;
  ctx = g;
  try {
    for (const d of decos) {
      if (d.x < cx * CHUNK - 40 || d.x > (cx + 1) * CHUNK + 40 || d.y < cy * CHUNK - 40 || d.y > (cy + 1) * CHUNK + 40) continue;
      if (d.kind === 'fern') drawFern(d);
      else if (d.kind === 'blotch') ellipse(d.x, d.y, 26 * d.s, 12 * d.s, 'rgba(120,60,30,0.25)');
      else ellipse(d.x, d.y, 3 * d.s, 2 * d.s, '#7a5a48');
    }
  } finally { ctx = saved; }
  if (groundChunks.size > 30) groundChunks.delete(groundChunks.keys().next().value);
  groundChunks.set(key, c);
  return c;
}

function drawVignette(low) {
  if (!vignetteCache) {
    const mk = (col) => {
      const c = document.createElement('canvas');
      c.width = Math.ceil(W / 2); c.height = Math.ceil(H / 2);
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.75);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, col);
      g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
      return c;
    };
    vignetteCache = { dark: mk('rgba(10,0,0,0.55)'), red: mk('rgba(170,0,0,0.6)') };
  }
  ctx.drawImage(vignetteCache.dark, 0, 0, W, H);
  if (low) {
    ctx.globalAlpha = 0.65 + Math.sin(now * 5) * 0.2;
    ctx.drawImage(vignetteCache.red, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// Interfaz (DOM)
// ============================================================
const $ = (id) => document.getElementById(id);
const overlays = ['menu', 'hub', 'inv', 'pause', 'end', 'dead'];
function showOverlay(id) {
  for (const o of overlays) $(o).classList.toggle('show', o === id);
}

// ---------- Menú de personajes ----------
function buildMenu() {
  const list = $('classList');
  list.innerHTML = '';
  for (const id of Object.keys(CLASSES)) {
    const C = CLASSES[id];
    const slot = SAVE.slots[id];
    const el = document.createElement('div');
    el.className = 'card' + (selectedClass === id ? ' selected' : '');
    el.innerHTML = `<div class="head"><canvas width="112" height="112"></canvas><div><div class="name">${C.name}</div><div class="role">${slot ? `Nivel ${slot.level} · Faille ${slot.maxFaille}` : C.role}</div></div></div>
      <div class="desc">${C.desc}</div>
      <div class="skills">${C.skills.map((sk) => `${sk.icon} ${sk.name} (${sk.cost} energía)`).join('<br>')}</div>`;
    const g = el.querySelector('canvas').getContext('2d');
    g.scale(2, 2); g.translate(28, 52); g.scale(1.1, 1.1);
    drawHero(g, id, { x: 0, y: 0, dir: 0.3, walkT: 0, moving: false, swing: 0, swingSide: 1, shot: 0, t: 0 });
    el.addEventListener('click', () => {
      SFX.init(); SFX.play('click');
      selectedClass = id;
      for (const c of list.children) c.classList.toggle('selected', c === el);
      $('btnStart').disabled = false;
      $('btnStart').textContent = SAVE.slots[id] ? `Continuar con ${C.name}` : `Crear ${C.name}`;
    });
    list.appendChild(el);
  }
  $('btnStart').disabled = !selectedClass;
  $('menuHint').textContent = 'Joystick a la izquierda, ataques a la derecha. Teclado: WASD + J (ataque), K / L (hechizos), Shift (esquiva), H (poción), B (bolsa)';
}

function goHub() {
  scene = 'hub';
  state = 'hub';
  rift = null; bossRef = null;
  enemies = []; projectiles = []; pickups = []; glyphs = [];
  createPlayer();
  persist();
  buildHub();
  showOverlay('hub');
}

function buildHub() {
  const C = CLASSES[S.cls];
  const nx = xpNext(S.level);
  S.faille = clamp(S.faille, 1, S.maxFaille);
  $('hubChar').innerHTML = `
    <div class="hubName">${C.name} <span>nivel ${S.level}</span></div>
    <div class="xpbar"><div style="width:${Math.min(100, (S.xp / nx) * 100)}%"></div></div>
    <div class="hubRow"><span>🪙 ${S.kamas} kamas</span><span>🍞 ${S.pan}/5</span><span>🎒 ${S.bag.length}/${BAG_MAX}</span></div>
    <div class="dofusRow">${Object.keys(GEMS).map((k) => `<span class="egg ${S.dofus.includes(k) ? 'got' : ''}" style="--c:${GEMS[k].color}" title="${GEMS[k].name}"></span>`).join('')}</div>`;
  $('fLabel').innerHTML = `Grieta ${S.faille}<small>Monstruos nivel ${1 + (S.faille - 1) * 3}–${5 + (S.faille - 1) * 3} · Guardián: ${S.faille % 2 ? 'Colmillo Ancestral' : 'Garra Ígnea'}</small>`;
  $('fMinus').disabled = S.faille <= 1;
  $('fPlus').disabled = S.faille >= S.maxFaille;
  $('btnInv').innerHTML = '🎒 Personaje' + (S.points > 0 ? ` <span class="badge">${S.points}</span>` : '');
  $('btnBakery').disabled = S.kamas < 40 || S.pan >= 5;
}

$('btnStart').addEventListener('click', () => {
  if (!selectedClass) return;
  if (!SAVE.slots[selectedClass]) SAVE.slots[selectedClass] = newSlot(selectedClass);
  SAVE.last = selectedClass;
  S = SAVE.slots[selectedClass];
  goHub();
});
$('fMinus').addEventListener('click', () => { S.faille--; SFX.play('click'); buildHub(); });
$('fPlus').addEventListener('click', () => { S.faille++; SFX.play('click'); buildHub(); });
$('btnZaap').addEventListener('click', () => startRift(S.faille));
$('btnInv').addEventListener('click', () => openInventory('hub'));
$('btnBakery').addEventListener('click', () => {
  if (S.kamas < 40 || S.pan >= 5) return;
  S.kamas -= 40; S.pan++;
  SFX.play('coin');
  persist(); buildHub();
});
$('btnChange').addEventListener('click', () => { state = 'menu'; S = null; buildMenu(); showOverlay('menu'); });

// ---------- Inventario / características ----------
let invSel = null; // {from:'bag'|'equip', idx|slot}

function openInventory(from) {
  if (from === 'play' && state !== 'play') return;
  invReturn = from === 'play' ? 'play' : from === 'pause' ? 'pause' : 'hub';
  state = 'inv';
  clearInput();
  invSel = null;
  buildInventory();
  showOverlay('inv');
}
function closeInventory() {
  persist();
  if (invReturn === 'hub') { state = 'hub'; buildHub(); showOverlay('hub'); }
  else if (invReturn === 'pause') { state = 'pause'; buildPause(); showOverlay('pause'); }
  else { state = 'play'; last = performance.now(); showOverlay(null); }
}

function statLines(stats, cmp) {
  const keys = new Set([...Object.keys(stats), ...Object.keys(cmp || {})]);
  const order = ['dmg', ...CORE_STATS, 'crit', 'res', 'pros'];
  return order.filter((k) => keys.has(k)).map((k) => {
    const v = stats[k] || 0;
    let diff = '';
    if (cmp) {
      const dlt = v - (cmp[k] || 0);
      if (dlt) diff = ` <em class="${dlt > 0 ? 'up' : 'down'}">(${dlt > 0 ? '+' : ''}${dlt})</em>`;
    }
    return v || diff ? `<div>${v >= 0 ? '+' : ''}${v} ${STAT_INFO[k].name}${diff}</div>` : '';
  }).join('');
}

function itemCell(it, extra = '') {
  if (!it) return `<div class="cell empty">${extra}</div>`;
  return `<div class="cell r${it.rarity}"><span>${it.icon}</span>${extra}</div>`;
}

function buildInventory() {
  const d = derived();
  const t = d.t;
  // equipo
  $('equipGrid').innerHTML = SLOTS.map((slot) => {
    const it = S.equip[slot];
    return `<div class="eqslot" data-slot="${slot}">${itemCell(it, it ? '' : `<small>${SLOT_INFO[slot].name}</small>`)}</div>`;
  }).join('');
  for (const el of $('equipGrid').querySelectorAll('.eqslot')) {
    el.addEventListener('click', () => { if (S.equip[el.dataset.slot]) { invSel = { from: 'equip', slot: el.dataset.slot }; SFX.play('click'); buildInventory(); } });
  }
  // características
  $('charStats').innerHTML = `
    <div class="pts">${S.points > 0 ? `<b>${S.points}</b> puntos por repartir` : `Nivel ${S.level}`}</div>
    ${CORE_STATS.map((k) => `<div class="statrow"><span title="${STAT_INFO[k].desc}">${STAT_INFO[k].name}</span><b>${t[k]}</b>
      <button class="mini" data-stat="${k}" data-n="1" ${S.points < 1 ? 'disabled' : ''}>+1</button>
      <button class="mini" data-stat="${k}" data-n="5" ${S.points < 5 ? 'disabled' : ''}>+5</button></div>`).join('')}
    <div class="derived">
      <span>PV</span><b>${d.maxHp}</b><span>Potencia</span><b>${Math.round(d.power)}</b>
      <span>Daño</span><b>+${Math.round((d.dmgMul - 1) * 100)}%</b><span>Hechizos</span><b>+${Math.round((d.skillMul - 1) * 100)}%</b>
      <span>Crítico</span><b>${Math.round(d.crit * 100)}%</b><span>Vel. ataque</span><b>${d.atkSpeed.toFixed(2)}</b>
      <span>Resistencia</span><b>${Math.round(d.armor * 100)}%</b><span>Prospección</span><b>${Math.round(100 * d.kamaMul)}</b>
    </div>
    <div class="dofusRow">${Object.keys(GEMS).map((k) => `<span class="egg ${S.dofus.includes(k) ? 'got' : ''}" style="--c:${GEMS[k].color}" title="${GEMS[k].name}: ${GEMS[k].desc}"></span>`).join('')}</div>`;
  for (const b of $('charStats').querySelectorAll('button[data-stat]')) {
    b.addEventListener('click', () => {
      const n = Math.min(S.points, +b.dataset.n);
      if (n <= 0) return;
      S.stats[b.dataset.stat] += n;
      S.points -= n;
      recalc();
      SFX.play('click');
      buildInventory();
    });
  }
  // bolsa
  $('bagTitle').textContent = `Bolsa ${S.bag.length}/${BAG_MAX} · ${S.kamas} ámbar`;
  const cells = [];
  for (let i = 0; i < BAG_MAX; i++) {
    const it = S.bag[i];
    const up = it && itemPower(it) > itemPower(S.equip[it.slot]) ? '<i class="upArrow">▲</i>' : '';
    cells.push(`<div class="bagslot ${invSel && invSel.from === 'bag' && invSel.idx === i ? 'sel' : ''}" data-i="${i}">${itemCell(it, up)}</div>`);
  }
  $('bagGrid').innerHTML = cells.join('');
  for (const el of $('bagGrid').querySelectorAll('.bagslot')) {
    el.addEventListener('click', () => { const i = +el.dataset.i; if (S.bag[i]) { invSel = { from: 'bag', idx: i }; SFX.play('click'); buildInventory(); } });
  }
  // detalle
  const det = $('itemDetail');
  let it = null;
  if (invSel && invSel.from === 'bag') it = S.bag[invSel.idx];
  if (invSel && invSel.from === 'equip') it = S.equip[invSel.slot];
  if (!it) { det.innerHTML = '<p class="small">Toca un objeto para ver sus características. ▲ = mejor que lo equipado.</p>'; return; }
  const R = RARITY[it.rarity];
  const eq = invSel.from === 'bag' ? S.equip[it.slot] : null;
  det.innerHTML = `
    <div class="itname" style="color:${R.color}">${it.icon} ${it.name}</div>
    <div class="small">${R.name} · ${SLOT_INFO[it.slot].name} · nivel ${it.level}</div>
    <div class="itstats">${statLines(it.stats, eq ? eq.stats : null)}</div>
    ${eq ? `<div class="small">Comparado con: <span style="color:${RARITY[eq.rarity].color}">${eq.name}</span></div>` : ''}
    <div class="itbtns">
      ${invSel.from === 'bag' ? '<button class="btn" id="btnEquip">Equipar</button>' : '<button class="btn" id="btnUnequip">Quitar</button>'}
      <button class="btn ghost" id="btnSell">Vender (+${it.value} K)</button>
    </div>`;
  const eqBtn = $('btnEquip'), unBtn = $('btnUnequip');
  if (eqBtn) eqBtn.addEventListener('click', () => {
    const old = S.equip[it.slot];
    S.equip[it.slot] = it;
    S.bag.splice(invSel.idx, 1);
    if (old) S.bag.push(old);
    invSel = null; recalc(); SFX.play('loot'); buildInventory();
  });
  if (unBtn) unBtn.addEventListener('click', () => {
    if (S.bag.length >= BAG_MAX) return;
    S.bag.push(it);
    delete S.equip[it.slot];
    invSel = null; recalc(); SFX.play('click'); buildInventory();
  });
  $('btnSell').addEventListener('click', () => {
    if (invSel.from === 'bag') S.bag.splice(invSel.idx, 1);
    else delete S.equip[it.slot];
    S.kamas += it.value;
    invSel = null; recalc(); SFX.play('coin'); buildInventory();
  });
}
$('btnInvClose').addEventListener('click', closeInventory);
$('btnSellCommons').addEventListener('click', () => {
  let gain = 0;
  S.bag = S.bag.filter((it) => { if (it.rarity === 0) { gain += it.value; return false; } return true; });
  S.kamas += gain;
  if (gain) SFX.play('coin');
  invSel = null;
  buildInventory();
});

// ---------- Pausa, fin de Faille, muerte ----------
function riftRows(extra = []) {
  return [
    ['Tiempo', fmtTime(rift.elapsed)],
    ['Monstruos derrotados', rift.kills],
    ['Objetos encontrados', rift.items + (rift.legendaries ? ` (${rift.legendaries} legendario${rift.legendaries > 1 ? 's' : ''})` : '')],
    ['Ámbar ganado', S.kamas - rift.kamas0],
    ['Experiencia', '+' + Math.round(rift.xp) + (rift.levels ? ` (+${rift.levels} niv.)` : '')],
    ...extra,
  ].map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('');
}

function buildPause() { $('pauseStats').innerHTML = riftRows([['Progreso', Math.floor((rift.progress / rift.goal) * 100) + '%']]); }

function pauseGame() {
  if (state !== 'play') return;
  state = 'pause';
  clearInput();
  buildPause();
  showOverlay('pause');
}
function resumeGame() {
  if (state !== 'pause') return;
  state = 'play';
  last = performance.now();
  showOverlay(null);
}

function finishRift() {
  if (state !== 'play') return;
  state = 'end';
  S.rifts++;
  SFX.play('zaap');
  persist();
  $('endTitle').textContent = `Grieta ${rift.level} cerrada`;
  $('endStats').innerHTML = riftRows([
    ['Bonus de tiempo', rift.bonus ? '+' + rift.bonus + ' ámbar' : '—'],
    ...(rift.dofus ? [[GEMS[rift.dofus].name, '★']] : []),
  ]);
  showOverlay('end');
}

function playerDied() {
  if (state !== 'play') return;
  state = 'dead';
  SFX.play('die');
  persist();
  setTimeout(() => {
    $('deadStats').innerHTML = riftRows();
    showOverlay('dead');
  }, 900);
}

$('btnResume').addEventListener('click', resumeGame);
$('btnPauseInv').addEventListener('click', () => { state = 'play'; openInventory('pause'); });
$('btnQuit').addEventListener('click', () => { persist(); goHub(); });
$('btnEndHub').addEventListener('click', goHub);
$('btnDeadHub').addEventListener('click', goHub);
$('btnMute').addEventListener('click', () => {
  SFX.muted = !SFX.muted;
  $('btnMute').textContent = 'Sonido: ' + (SFX.muted ? 'OFF' : 'ON');
});

function enterFullscreen() {
  const el = document.documentElement;
  if (window.Capacitor) return;
  if (isTouch && el.requestFullscreen && !document.fullscreenElement) {
    el.requestFullscreen().then(() => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    }).catch(() => {});
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pauseGame(); persist(); }
});

// Botón "atrás" de Android (Capacitor)
try {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App) {
    App.addListener('backButton', () => {
      if (state === 'play') pauseGame();
      else if (state === 'pause') resumeGame();
      else if (state === 'inv') closeInventory();
      else if (state === 'hub') { state = 'menu'; S = null; buildMenu(); showOverlay('menu'); }
      else if (state === 'menu') App.exitApp();
    });
  }
} catch (e) { /* entorno web */ }

// Arranque
selectedClass = SAVE.last;
buildMenu();
if (selectedClass) $('btnStart').textContent = `Continuar con ${CLASSES[selectedClass].name}`;
showOverlay('menu');
requestAnimationFrame(frame);

// Gancho para pruebas automatizadas
window.__game = {
  get state() { return state; }, get P() { return P; }, get S() { return S; }, get rift() { return rift; }, get enemies() { return enemies; },
  input, startRift, useSkill, spawnGuardian, goHub, openInventory, spawnEnemy,
  get fps() { return QUALITY; },
};
