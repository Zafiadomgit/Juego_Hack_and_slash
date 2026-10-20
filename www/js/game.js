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
// nivel 0: todo; 1: sin desenfoque de maqueta; 2: resolución 1x y luces más baratas; 3: píxel más grande
const QUALITY = { maxDpr: 1.25, level: 0, samples: [], checkT: 0 };
// unidades de mundo visibles en el lado corto de la pantalla (look.js las cambia según la escena)
const VIEW = { units: 420 };
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, QUALITY.maxDpr);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  zoom = Math.min(W, H) / VIEW.units;
  ui = clamp(Math.min(W, H) / 400, 0.8, 1.6);
  spriteScaleUpdate(HD2D.on ? zoom / hd2dPixSize() : zoom * DPR);
  SPR.cache.clear();
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
// Efectos grabados (www/audio/sfx/*.ogg, generados con tools/audio/sfx.py). Si un archivo aún no ha cargado
// se usa el sonido sintetizado de respaldo.
const SFX_FILES = ['fireshot', 'arrowrain', 'blades', 'turret', 'web', 'swing2', 'swing3', 'hit2', 'hit3', 'shoot2', 'shoot3', 'swing', 'hit', 'crit', 'boom', 'coin', 'xp', 'hurt', 'level', 'dash', 'shield', 'baa', 'piou', 'boss', 'die', 'heal', 'click', 'loot', 'legend', 'zaap', 'shoot', 'magic', 'step'];
// variantes que se alternan para que los sonidos repetidos no cansen
const SFX_VAR = { swing: 3, hit: 3, shoot: 3 };
const SFX_GAIN = { fireshot: 0.5, arrowrain: 0.45, blades: 0.45, turret: 0.22, web: 0.35, swing2: 0.3, swing3: 0.3, hit2: 0.3, hit3: 0.3, shoot2: 0.24, shoot3: 0.24, swing: 0.3, hit: 0.3, crit: 0.6, boom: 0.6, coin: 0.18, xp: 0.07, hurt: 0.65, level: 0.8, dash: 0.35, shield: 0.55, baa: 0.3, piou: 0.25, boss: 0.8, die: 0.8, heal: 0.55, click: 0.4, loot: 0.5, legend: 0.8, zaap: 0.65, shoot: 0.24, magic: 0.32, step: 0.18 };
// Separación mínima (s) entre dos reproducciones del mismo efecto: en una pelea hay decenas de golpes,
// monedas y orbes por segundo, y sonando todos a la vez el resultado es un ruido desagradable
const SFX_GAP = { turret: 0.12, arrowrain: 0.25, hit: 0.06, crit: 0.08, swing: 0.07, coin: 0.09, xp: 0.12, boom: 0.12, shoot: 0.06, magic: 0.07, baa: 0.4, piou: 0.35, hurt: 0.15, dash: 0.1, loot: 0.15 };
const SFX = {
  ac: null,
  muted: false,
  budget: 0,
  bufs: {}, lastT: {},
  master: null, sfxGain: null,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ac = null; return; }
    this.master = this.ac.createGain(); this.master.connect(this.ac.destination);
    this.master.gain.value = this.muted ? 0 : 1;
    // compresor suave: evita que los golpes amontonados saturen
    this.comp = this.ac.createDynamicsCompressor();
    this.comp.threshold.value = -18; this.comp.knee.value = 12; this.comp.ratio.value = 4; this.comp.attack.value = 0.003; this.comp.release.value = 0.15;
    this.comp.connect(this.master);
    this.sfxGain = this.ac.createGain(); this.sfxGain.gain.value = 0.9; this.sfxGain.connect(this.comp);
    for (const n of SFX_FILES) loadAudio('audio/sfx/' + n + '.ogg').then((b) => { this.bufs[n] = b; }).catch(() => {});
    MUSIC.attach(this.ac, this.master);
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ac.currentTime, 0.05);
  },
  sample(name, rate = 1, vol = 1) {
    const b = this.bufs[name];
    if (!b) return false;
    const c = this.ac, src = c.createBufferSource(), g = c.createGain();
    src.buffer = b; src.playbackRate.value = rate;
    g.gain.value = (SFX_GAIN[name] || 0.6) * vol;
    src.connect(g); g.connect(this.sfxGain);
    src.start();
    return true;
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
    if (this.budget > 3) return;
    const t = this.ac.currentTime, last = this.lastT[name] || -1;
    if (t - last < (SFX_GAP[name] || 0.03)) return;
    this.lastT[name] = t;
    this.budget++;
    // muestra grabada con una ligera variación de tono para que los golpes no suenen idénticos
    const v = SFX_VAR[name] ? Math.floor(Math.random() * SFX_VAR[name]) : 0;
    const file = v ? name + (v + 1) : name;
    if (this.sample(this.bufs[file] ? file : name, name === 'click' || name === 'level' || name === 'legend' ? 1 : 0.9 + Math.random() * 0.2)) return;
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

// Carga y decodifica un archivo de audio (Capacitor sirve www/ como archivos locales)
const AUDIO_CACHE = new Map();
function loadAudio(url) {
  if (AUDIO_CACHE.has(url)) return AUDIO_CACHE.get(url);
  const p = fetch(url).then((r) => r.arrayBuffer()).then((ab) => new Promise((res, rej) => SFX.ac.decodeAudioData(ab, res, rej)));
  AUDIO_CACHE.set(url, p);
  return p;
}

// ============================================================
// Música: pistas en bucle con fundido cruzado (www/audio/music, generadas con tools/audio/compose.py)
// ============================================================
// mundos sin pista propia: usan la de un mundo parecido
const MUSIC_ALIAS = {};
const MUSIC = {
  ac: null, out: null, cur: null, want: null, vol: 0.55, duck: 1,
  attach(ac, master) {
    this.ac = ac;
    this.out = ac.createGain(); this.out.gain.value = this.vol; this.out.connect(master);
    if (this.want) { const w = this.want; this.want = null; this.play(w.name, w.opts); }
  },
  play(name, opts = {}) {
    if (!this.ac) { this.want = { name, opts }; return; }
    if (this.cur && this.cur.name === name && !opts.restart) return;
    const token = {};
    this.token = token;
    loadAudio('audio/music/' + (MUSIC_ALIAS[name] || name) + '.ogg').then((buf) => {
      if (this.token !== token) return; // llegó otra petición mientras cargaba
      const c = this.ac, fade = opts.fade ?? 1.2, now = c.currentTime;
      const src = c.createBufferSource(), g = c.createGain();
      src.buffer = buf; src.loop = opts.loop !== false;
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(1, now + fade);
      src.connect(g); g.connect(this.out); src.start();
      this.fadeOut(fade);
      this.cur = { name, src, g };
      if (opts.loop === false && opts.then) src.onended = () => { if (this.cur && this.cur.src === src) this.play(opts.then, { fade: 2 }); };
    }).catch(() => {});
  },
  fadeOut(t = 1) {
    const c = this.cur;
    if (!c) return;
    const now = this.ac.currentTime;
    c.g.gain.cancelScheduledValues(now);
    c.g.gain.setValueAtTime(Math.max(0.0001, c.g.gain.value), now);
    c.g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    try { c.src.stop(now + t + 0.05); } catch (e) { /* ya parada */ }
    this.cur = null;
  },
  stop(t = 0.8) { this.token = {}; this.want = null; if (this.ac) this.fadeOut(t); },
  setDuck(k) { this.duck = k; if (this.out) this.out.gain.setTargetAtTime(this.vol * k, this.ac.currentTime, 0.2); },
};

// ============================================================
// Guardado (localStorage)
// ============================================================
const SAVE_KEY = 'astrubSlash.v2';
const bagMax = () => 36 + 6 * ((S && S.up && S.up.bolsa) || 0);
const panMax = () => 5 + ((S && S.up && S.up.cinto) || 0);
// Asegura los campos nuevos en partidas antiguas
function migrateSlot(s) {
  s.up = Object.assign(Object.fromEntries(Object.keys(UPGRADES).map((k) => [k, 0])), s.up || {});
  s.boosts = Object.assign({ furia: 0, piedra: 0, sabio: 0, fortuna: 0 }, s.boosts || {});
  if (!s.shop) s.shop = null;
  // gemas engarzadas (antes estaban todas activas): se engarzan las primeras que tuviera
  if (!Array.isArray(s.gemSlots)) s.gemSlots = (s.dofus || []).slice(0, GEM_SLOTS);
  while (s.gemSlots.length < GEM_SLOTS + ((s.lb || 0) >= 3 ? 1 : 0)) s.gemSlots.push(null);
  s.seals = s.seals || 0; s.trans = s.trans || 0; s.frag = s.frag || 0; s.ess = s.ess || 0; s.lb = s.lb || 0;
  if (!s.dungeon) s.dungeon = { max: 0 };
  s.forge = Object.assign({}, s.forge || {});
  migrateMap(s);
  return s;
}
const boostOn = (k) => !!(rift && rift.boost && rift.boost[k]);
let SAVE = loadSave();
let S = null; // personaje activo

function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.slots) { if (s.muted) SFX.muted = true; return s; }
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
let obstacles = [], decos = [], motes = [], pools = [], fog = [];
let hazards = [], corpses = [], ghosts = [];
let zoomPunch = 0;
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
  const b = curBiome();
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
  const nTrees = b.tree === 'spire' ? 34 : b.tree === 'willow' ? 50 : 60;
  for (let i = 0; i < nTrees; i++) {
    const pos = tryPlace(24, 260);
    if (pos) obstacles.push({ kind: 'tree', tk: b.tree, x: pos.x, y: pos.y, r: b.tree === 'spire' ? 20 : 22, s: rand(0.9, 1.35), hue: Math.random() < 0.6 ? 1 : 0 });
  }
  for (let i = 0; i < 40; i++) {
    const r = rand(12, 22);
    const pos = tryPlace(r, 200);
    if (pos) obstacles.push({ kind: 'rock', x: pos.x, y: pos.y, r, s: r / 16 });
  }
  // ruinas, cristales y braseros (obstáculos con luz)
  for (let i = 0; i < b.props.pillar; i++) {
    const pos = tryPlace(16, 240);
    if (pos) obstacles.push({ kind: 'pillar', x: pos.x, y: pos.y, r: 16, s: rand(0.9, 1.2), v: randi(0, 2) });
  }
  for (let i = 0; i < b.props.crystal; i++) {
    const pos = tryPlace(13, 200);
    if (pos) obstacles.push({ kind: 'crystal', x: pos.x, y: pos.y, r: 13, s: rand(0.8, 1.3), hue: b.crystalHue ?? (Math.random() < 0.55 ? 0 : 1), ph: rand(0, 6) });
  }
  for (let i = 0; i < b.props.brazier; i++) {
    const pos = tryPlace(11, 180);
    if (pos) obstacles.push({ kind: 'brazier', x: pos.x, y: pos.y, r: 11, ph: rand(0, 6) });
  }
  // charcos del bioma (lava, agua, hielo, arenas movedizas)
  pools = [];
  for (let i = 0; i < b.pools; i++) {
    const x = rand(150, WORLD.w - 150), y = rand(150, WORLD.h - 150);
    if (dist(x, y, cx, cy) < 260 || obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + 70)) continue;
    pools.push({ x, y, rx: rand(38, 76), ry: rand(18, 32), ph: rand(0, 6), type: b.pool });
  }
  const kinds = Object.entries(b.deco).filter((k) => k[1] > 0);
  for (let i = 0; i < 950; i++) {
    decos.push({
      x: rand(0, WORLD.w), y: rand(0, WORLD.h),
      kind: weightedPick(kinds),
      c: pick(b.decoCol),
      s: rand(0.8, 1.6),
      r: rand(0, Math.PI * 2),
    });
  }
  fog = [];
  for (let i = 0; i < 8; i++) fog.push({ x: rand(0, WORLD.w), y: rand(0, WORLD.h), r: rand(260, 440), vx: rand(6, 16) * (Math.random() < 0.5 ? -1 : 1), vy: rand(-5, 5) });
  motes = [];
  const nm = b.mote === 'snow' ? 70 : b.mote === 'sand' ? 60 : 40;
  for (let i = 0; i < nm; i++) motes.push({ x: rand(0, 1), y: rand(0, 1), s: rand(1, 2.5), v: rand(0.004, 0.015), p: rand(0, 6) });
}

// ============================================================
// Entrada (táctil + teclado)
// ============================================================
const input = {
  mx: 0, my: 0,
  attack: false,
  pressed: { s0: false, s1: false, dash: false, pan: false, ult: false },
  joy: null,
  touches: new Map(),
  keys: new Set(),
};

function buttonLayout() {
  const s = ui;
  const m = 16 * s;
  const ax = W - m - 48 * s, ay = H - m - 48 * s;
  // dos arcos alrededor del ataque (estilo Hades): habilidades y esquiva cerca, el resto por fuera
  const at = (deg, R, r) => ({ x: ax + Math.cos(deg * Math.PI / 180) * R * s, y: ay + Math.sin(deg * Math.PI / 180) * R * s, r: r * s });
  return {
    attack: { x: ax, y: ay, r: 46 * s },
    s0: at(186, 104, 30),
    s1: at(223, 104, 30),
    dash: at(260, 104, 27),
    pan: at(190, 176, 22),
    ult: at(218, 178, 27),
    cast: at(247, 176, 23),
    pause: { x: W - 28 * s, y: 28 * s, r: 20 * s },
    bag: { x: W - 76 * s, y: 28 * s, r: 20 * s },
  };
}

function hitButton(x, y) {
  const L = buttonLayout();
  for (const k of ['attack', 's0', 's1', 'dash', 'pan', 'ult', 'pause', 'bag']) {
    const b = L[k];
    if (dist(x, y, b.x, b.y) < b.r * 1.25) return k;
  }
  return null;
}

function clearInput() {
  input.attack = false; input.joy = null; input.mx = input.my = 0; input.touches.clear();
  input.pressed.s0 = input.pressed.s1 = input.pressed.dash = input.pressed.pan = input.pressed.ult = false;
}

canvas.addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  SFX.init();
  if (state === 'hub' && scene === 'hub') {
    // pueblo: joystick a la izquierda; un toque sin arrastrar mueve al héroe (o habla con quien toques)
    const x = ev.clientX, y = ev.clientY;
    input.touches.set(ev.pointerId, { tap: true, x0: x, y0: y });
    if (x < W * 0.45 && !input.joy) input.joy = { id: ev.pointerId, ox: x, oy: y, x, y };
    return;
  }
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
  if (b && b.tap) {
    input.touches.delete(ev.pointerId);
    if (input.joy && input.joy.id === ev.pointerId) { input.joy = null; input.mx = 0; input.my = 0; }
    if (state === 'hub' && Math.hypot(ev.clientX - b.x0, ev.clientY - b.y0) < 12) villageTap(ev.clientX, ev.clientY);
    return;
  }
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
    if (k === 'u' || k === '4') input.pressed.ult = true;
    if (k === 'b' || k === 'c') openInventory('play');
    if (k === 'escape' || k === 'p') pauseGame();
  } else if (state === 'pause' && (k === 'escape' || k === 'p')) resumeGame();
  else if (state === 'inv' && (k === 'escape' || k === 'b' || k === 'c')) closeInventory();
  else if (state === 'shop' && k === 'escape') closeShop();
  else if (state === 'quests' && k === 'escape') closeQuests();
  else if (state === 'hub' && (k === 'e' || k === 'enter')) villageInteract(vNear);
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
    const fm = forgeMul(slot);
    for (const [k, v] of Object.entries(it.stats)) t[k] = (t[k] || 0) + Math.round(v * fm);
  }
  return t;
}

function derived() {
  const t = totalStats();
  const C = CLASSES[S.cls];
  const has = (d) => gemOn(d);
  const sb = activeSetBonus();
  const um = uniqueMods();
  return {
    maxHp: Math.round((C.hp + (S.level - 1) * 8 + t.vit * 2) * (has('esmeralda') ? 1.2 : 1) * (has('titan') ? 1.1 : 1) * (uniqueOn('corona') ? 1.3 : 1) * (1 + (um.hp || 0)) * (1 + 0.12 * lbRank()) * (1 + 0.05 * (S.up.vigor || 0)) * (1 + (sb.hpP || 0)) * (1 + 0.05 * transRank())),
    power: 8 + S.level * 1.2 + t.dmg,
    dmgMul: (1 + t.fue * 0.01) * (has('purpura') ? 1.15 : 1) * (has('titan') ? 1.1 : 1) * (uniqueOn('eclipse') ? 1.25 : 1) * (1 + (um.dmg || 0)) * (1 + 0.12 * lbRank()) * (1 + 0.05 * (S.up.afilador || 0)) * (boostOn('furia') ? 1.3 : 1) * (1 + (sb.dmgP || 0)) * (1 + 0.05 * transRank()) * (P && P.altarT > 0 ? 1.5 : 1),
    skillMul: (1 + t.int * 0.015) * (has('obsidiana') ? 1.25 : 1),
    critDmg: (has('vacio') ? 1.4 : 1) * (uniqueOn('verdugo') ? 1.6 : 1) * (1 + (um.critDmg || 0)),
    cdMul: (uniqueOn('eco') ? 0.7 : 1) * (1 - (um.cd || 0)),
    hpRegen: has('musgo') ? 0.01 : 0,
    crit: Math.min(0.75, 0.05 + t.sue * 0.0015 + t.crit * 0.01 + (has('turquesa') ? 0.1 : 0) + (sb.critP || 0) + (C.critBonus || 0) + (transRank() >= 7 ? 0.05 : 0) + (uniqueOn('eclipse') ? 0.08 : 0) + (um.crit || 0)),
    atkSpeed: (1 + t.agi * 0.006) * (1 + (sb.spdP || 0)) * (has('brasa') ? 1.12 : 1),
    speed: C.speed * (1 + Math.min(0.35, t.agi * 0.002)) * (P && P.altarT > 0 ? 1.15 : 1) * (uniqueOn('manto') ? 1.12 : 1) * (uniqueOn('viento') ? 1.2 : 1) * (1 + (um.speed || 0)),
    xpMul: (1 + t.sab * 0.01) * (boostOn('sabio') ? 1.5 : 1) * (uniqueOn('avaro') ? 1.4 : 1) * (1 + (sb.xpP || 0)),
    paRegen: (1 / 1.25) * (1 + t.sab * 0.005) * (has('ocre') ? 1.3 : 1) * (1 + (sb.regenP || 0)) * (1 + 0.06 * (S.up.energia || 0)),
    armor: Math.min(0.75, t.res * 0.01 + (boostOn('piedra') ? 0.25 : 0) + (sb.armorP || 0) + 0.02 * (S.up.piel || 0) + (has('escarcha') ? 0.12 : 0) + (uniqueOn('manto') ? 0.15 : 0) + (um.armor || 0)),
    kamaMul: (1 + (t.pros + t.sue * 0.5) * 0.01) * (boostOn('fortuna') ? 1.5 : 1) * (1 + (sb.kamaP || 0)) * (1 + 0.05 * (S.up.fortuna || 0)) * (has('ambar') ? 1.4 : 1) * (uniqueOn('avaro') ? 1.6 : 1),
    magnet: 80 * (1 + Math.min(1.5, t.pros * 0.004)) * (1 + 0.25 * (S.up.iman || 0)) * (has('ambar') ? 1.3 : 1),
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
    pm: 3 + (S.up.reflejos || 0) + (uniqueOn('viento') ? 1 : 0), maxPm: 3 + (S.up.reflejos || 0) + (uniqueOn('viento') ? 1 : 0), pmRegen: 1 / 2.2,
    atkCd: 0, skillCd: [0, 0], panCd: 0,
    invul: 0, shield: 0, shieldT: 0,
    dashT: 0, dashVx: 0, dashVy: 0,
    lock: 0, jump: null, cast: null,
    walkT: 0, moving: false, hurtFlash: 0,
    swingT: 0, swingSide: 1, shotT: 0,
    slowT: 0, sq: 0, lean: 0, recoil: 0, stepT: 0, ghostT: 0,
    ult: transRank() >= 5 ? 50 : 0, spinT: 0, frenzyT: 0, warcryT: 0, danceT: 0, spinTick: 0, altarT: 0,
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

const basicDmg = () => P.power * P.C.basicMul * P.dmgMul * classDmgMul();
const skillDmg = (mul) => P.power * mul * P.dmgMul * P.skillMul * classDmgMul();

function basicAttack() {
  const cls = P.cls;
  if (CLASS_KIT[cls]) { CLASS_KIT[cls].basic(); return; }
  if (cls === 'iop') {
    const a = aimAt(170);
    P.dir = a; P.aimHold = 0.3;
    P.swingT = 0.2; P.swingSide *= -1; P.sq = 0.35;
    const range = 80;
    slashes.push({ x: P.x, y: P.y, dir: a, arc: 2.3, range, life: 0.18, max: 0.18, color: weaponFxColor(), side: P.swingSide, width: 24, follow: true });
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

// Color del efecto del arma según su rareza (el equipo se nota en combate)
function weaponFxColor() {
  const w = S.equip.arma;
  return ['#fff6d0', '#a8e2ff', '#e6c0ff', '#ffc860'][w ? w.rarity : 0];
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
  P.skillCd[i] = sk.cd * (P.cdMul || 1);
  const cls = P.cls;
  if (CLASS_KIT[cls]) { CLASS_KIT[cls].skill(i); return; }

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
      hitFlash(P.x + Math.cos(a) * 70, P.y + Math.sin(a) * 70 - 10, 50, '255,150,40');
      for (let k = 0; k < 7; k++) {
        const dd = 40 + k * 18, aa = a + rand(-0.6, 0.6);
        const fx = P.x + Math.cos(aa) * dd, fy = P.y + Math.sin(aa) * dd;
        embers(fx, fy, 3, k % 2 ? '255,120,30' : '255,200,80', 14);
        addDecal('scorch', fx, fy, 22, 2.5, '255,110,30');
      }
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
    SFX.play('fireshot');
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
        SFX.play('arrowrain');
      });
    }
  } else if (cls === 'feca' && i === 0) {
    P.shield = Math.round(P.maxHp * 0.45);
    P.shieldT = 6;
    rings.push({ x: P.x, y: P.y, r0: 20, r1: 120, life: 0.35, max: 0.35, color: 'rgba(130,200,255,' });
    aoe(P.x, P.y, 110, skillDmg(1.3), 480);
    addDecal('rune', P.x, P.y, 95, 1.3, '130,200,255');
    spawnVfx('runeBlue', P.x, P.y, 250, { dur: 1.1, flat: true, layer: 'ground' });
    hitFlash(P.x, P.y - 20, 34, '140,210,255');
    sparks(P.x, P.y - 16, 14, '#bfe8ff', 320);
    SFX.play('shield');
    shake(5);
  } else if (cls === 'feca' && i === 1) {
    const t = nearestEnemy(P.x, P.y, 320);
    const gx = t ? t.x : P.x, gy = t ? t.y : P.y;
    glyphs.push({ x: gx, y: gy, r: 115, life: 4.5, max: 4.5, tick: 0 });
    addDecal('rune', gx, gy, 118, 4.5, '255,140,60');
    hitFlash(gx, gy - 10, 36, '255,150,60');
    SFX.play('magic');
  }
}

function dash() {
  if (P.pm < 1 || P.dashT > 0 || P.jump || P.lock > 0) return;
  P.pm -= 1;
  const a = P.moving ? Math.atan2(input.my, input.mx) : P.dir;
  P.dashT = 0.17;
  P.dashVx = Math.cos(a) * 720; P.dashVy = Math.sin(a) * 720;
  P.sq = 0.7; P.ghostT = 0;
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
  if (P.hpRegen && P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * P.hpRegen * dt);
  P.pa = Math.min(P.maxPa, P.pa + P.paRegen * dt);
  if (P.pm < P.maxPm) P.pm = Math.min(P.maxPm, P.pm + P.pmRegen * dt);
  P.atkCd -= dt; P.skillCd[0] -= dt; P.skillCd[1] -= dt; P.panCd -= dt;
  P.invul -= dt; P.lock -= dt; P.aimHold -= dt; P.hurtFlash -= dt;
  P.swingT -= dt; P.shotT -= dt; P.slowT -= dt;
  P.sq *= Math.exp(-10 * dt); P.recoil *= Math.exp(-9 * dt);
  P.lean = lerp(P.lean, P.moving && P.lock <= 0 ? input.mx * 0.11 : 0, 1 - Math.exp(-10 * dt));
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
      P.sq = 1; zoomPunch = Math.max(zoomPunch, 0.035);
      rings.push({ x: P.x, y: P.y, r0: 10, r1: 105, life: 0.3, max: 0.3, color: 'rgba(255,220,150,' });
      aoe(P.x, P.y, 100, skillDmg(2.4), 380, true);
      shake(11); SFX.play('boom');
      dust(P.x, P.y, 16);
      addDecal('crack', P.x, P.y, 115, 2.6, '255,140,50');
      hitFlash(P.x, P.y - 10, 42, '255,200,120');
      sparks(P.x, P.y, 18, '#ffd27a', 380, 0, TAU, 520);
      embers(P.x, P.y, 10, '255,150,60', 40);
    }
    return;
  }

  if (P.dashT > 0) {
    P.dashT -= dt;
    P.x += P.dashVx * dt; P.y += P.dashVy * dt;
    if (Math.random() < 0.8) particles.push({ x: P.x + rand(-6, 6), y: P.y + rand(-4, 4), vx: 0, vy: -20, life: 0.25, max: 0.25, color: 'rgba(255,255,255,0.7)', size: rand(3, 6), grav: 0 });
    P.ghostT -= dt;
    if (P.ghostT <= 0) { P.ghostT = 0.03; ghosts.push({ x: P.x, y: P.y, dir: P.dir, walkT: P.walkT, life: 0.22, max: 0.22 }); }
  } else if (P.lock <= 0 && P.moving) {
    const spd = P.speed * (P.slowT > 0 ? 0.55 : 1);
    P.x += input.mx * spd * dt;
    P.y += input.my * spd * dt;
    P.walkT += dt;
    P.stepT -= dt;
    if (P.stepT <= 0) {
      P.stepT = 0.24;
      SFX.play('step');
      for (let i = 0; i < 2; i++) particles.push({ x: P.x + rand(-5, 5), y: P.y + 2, vx: -input.mx * rand(20, 50) + rand(-15, 15), vy: rand(-25, -8), life: 0.4, max: 0.4, color: curBiome().id === 'glaciar' ? 'rgba(240,248,255,0.7)' : 'rgba(200,180,140,0.55)', size: rand(3, 5), grav: 0 });
    }
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
  if (input.pressed.ult) useUltimate();
  input.pressed.s0 = input.pressed.s1 = input.pressed.dash = input.pressed.pan = input.pressed.ult = false;
}

function heal(n) {
  if (!P) return;
  const before = P.hp;
  P.hp = Math.min(P.maxHp, P.hp + n);
  const got = Math.round(P.hp - before);
  if (got > 0) addText(P.x, P.y - 34, '+' + got, '#5cff6b', 1);
  if (got > 0 && scene === 'rift') spawnVfx('heal', P.x, P.y - 34, 84, { dur: 0.9, follow: () => ({ x: P.x, y: P.y - 34 }) });
}

function hurtPlayer(dmg, sx, sy, src) {
  if (state !== 'play' || P.invul > 0 || P.dashT > 0 || P.jump) return;
  dmg = Math.max(1, Math.round(dmg * (1 - P.armor) * classDefMul() * rand(0.9, 1.1)));
  if (P.shield > 0) {
    const a = Math.min(P.shield, dmg);
    P.shield -= a; dmg -= a;
    addText(P.x, P.y - 40, '-' + a, '#8fd0ff', 0.9);
    if (dmg <= 0) { P.invul = 0.25; SFX.play('hit'); return; }
  }
  P.hp -= dmg;
  texts.push({ x: P.x, y: P.y - 44, txt: '-' + dmg, color: '#ff4a3d', scale: 1.25, life: 0.9, max: 0.9, vx: rand(-30, 30), vy: -150 });
  hitFlash(P.x, P.y - 22, 20, '255,80,60');
  P.invul = 0.55; P.hurtFlash = 0.25;
  shake(7); SFX.play('hurt');
  if (src && src.elite && src.elite.vampire) { src.hp = Math.min(src.maxHp, src.hp + dmg * 2); addText(src.x, src.y - src.r * 2, '+' + dmg * 2, '#ce93d8', 0.9); }
  if (sx !== undefined) {
    const a = Math.atan2(P.y - sy, P.x - sx);
    P.x += Math.cos(a) * 12; P.y += Math.sin(a) * 12;
    P.recoil = Math.cos(a) >= 0 ? 0.35 : -0.35;
  }
  if (P.hp <= 0) { P.hp = 0; playerDied(); }
}

// ============================================================
// Enemigos
// ============================================================
function spawnEnemy(type, x, y, o = {}) {
  const D = ENEMIES[type];
  const F = rift ? rift.level : 1;
  const DF = rift ? rift.D : DIFFS[0];
  const threat = rift ? rift.threat : 0;
  const sup = o.super || null;
  let lvl = o.lvl ?? ((D.boss ? (F - 1) * 2 + 4 : D.lvl + (F - 1) * 2) + DF.lvl + (sup ? 3 : 0));
  const elite = o.elite ? pick(ELITES.filter((x) => !x.minF || threat >= x.minF)) : null;
  if (elite) lvl += 2;
  // dificultad ajustada al equipo que se consigue en esa dificultad: un Jabalí aguanta DF.hits golpes
  // del héroe de referencia y el héroe aguanta DF.die golpes de Jabalí (ver refPlayer)
  const ref = refPlayer(S ? S.cls : 'iop', F, rift ? rift.d : 0);
  const hpMul = (DF.hits * ref.hit / ENEMIES.bouftou.hp) * (sup ? 3.2 : 1) * rand(0.95, 1.05);
  const dmgMul = (ref.ehp / DF.die / ENEMIES.bouftou.dmg) * (sup ? 1.3 : 1);
  const hp = Math.round(D.hp * hpMul * (elite ? 3.5 : 1));
  const e = {
    type, D, x, y, r: D.r * (elite ? elite.size || 1.15 : 1) * (sup ? 1.45 : 1),
    hp, maxHp: hp, lvl, elite, boss: !!D.boss, superDef: sup,
    name: sup ? sup.name : elite ? `${D.name} ${elite.suffix}` : D.name,
    speed: D.speed * rand(0.92, 1.08) * (elite && elite.speed ? elite.speed : 1) * (1 + Math.min(0.3, threat * 0.03)) * (sup ? 1.1 : 1),
    dmg: D.dmg * dmgMul * (elite ? 1.4 : 1),
    ai: D.ai, state: 'move', st: D.boss ? 1.5 : 0, cd: rand(0.5, 2), t: rand(0, 10), seed: rand(0, 10),
    kvx: 0, kvy: 0, flash: 0, hitCd: 0, slowT: 0, z: 0, face: 1, spawnT: 0.35,
    dead: false, cycle: 0, enraged: false,
  };
  enemies.push(e);
  if (e.boss) bossRef = e;
  else addDecal('rune', x, y, e.r * 1.8, 0.7, elite ? hexRgb(elite.color) : '255,90,60');
  return e;
}

function damageEnemy(e, base, o = {}) {
  if (e.dead) return;
  const crit = !o.quiet && (o.crit || Math.random() < P.crit);
  const armor = e.elite && e.elite.armor ? e.elite.armor : 0;
  const dmg = Math.max(1, Math.round(base * (crit ? (P.C.critMul || 1.8) * (P.critDmg || 1) : 1) * rand(0.9, 1.1) * (1 - armor)));
  e.hp -= dmg;
  e.flash = 0.1;
  if (o.poison) e.dot = { t: o.poison.t, dps: o.poison.dps, tick: 0.5 };
  stealLife(dmg);
  if (o.quiet) {
    texts.push({ x: e.x + rand(-6, 6), y: e.y - e.r * 1.4, txt: String(dmg), color: o.color || '#cfcfcf', scale: 0.85, life: 0.7, max: 0.7, vx: rand(-20, 20), vy: -110 });
    if (e.hp <= 0) killEnemy(e);
    return;
  }
  if (o.kb) {
    const a = Math.atan2(e.y - o.fy, e.x - o.fx);
    const k = o.kb * e.D.kbRes;
    e.kvx += Math.cos(a) * k; e.kvy += Math.sin(a) * k;
  }
  const hx = e.x + rand(-e.r * 0.4, e.r * 0.4), hy = e.y - e.r * 0.8 - e.z;
  texts.push({ x: hx, y: hy - e.r * 0.5, txt: String(dmg), color: crit ? '#ffb43a' : '#ffffff', scale: crit ? 1.7 : 1.05, life: 0.85, max: 0.85, vx: rand(-55, 55), vy: -175, crit });
  hitFlash(hx, hy, crit ? 26 : 14, crit ? '255,170,50' : '255,235,190');
  const hitDir = o.fx !== undefined ? Math.atan2(e.y - o.fy, e.x - o.fx) : rand(0, TAU);
  sparks(hx, hy, crit ? 12 : 6, crit ? '#ffcf6a' : '#fff1c8', crit ? 380 : 260, hitDir, 1.7);
  if (crit) { shake(4); zoomPunch = Math.max(zoomPunch, 0.018); }
  for (let i = 0; i < (crit ? 6 : 3); i++) {
    const a = rand(0, Math.PI * 2), sp = rand(60, 200);
    particles.push({ x: e.x, y: e.y - e.r * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.4, max: 0.4, color: e.D.blood, size: rand(2, 4), grav: 500 });
  }
  SFX.play(crit ? 'crit' : 'hit');
  if (crit || o.heavy) hitStop(o.heavy ? 0.06 : 0.035);
  if (e.boss && !e.enraged && e.hp > 0 && e.hp < e.maxHp * 0.5) {
    e.enraged = true;
    showBanner(`¡${e.name} entra en furia!`, '#ff5252');
    SFX.play('boss');
  }
  if (e.hp <= 0) killEnemy(e);
}

function itemLevel() { return Math.max(1, (rift.level - 1) * 2 + 3 + rift.D.lvl + randi(-1, 1)); }

function killEnemy(e) {
  e.dead = true;
  rift.kills++;
  S.kills++;
  gainUlt(e.boss ? ULT_GAIN.boss : e.elite ? ULT_GAIN.elite : ULT_GAIN.normal);
  trackDaily('kill');
  if (e.elite) trackDaily('elite');
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
  const nK = Math.max(1, Math.round(randi(D.kamas[0], D.kamas[1]) * lvlK * eliteK * P.kamaMul * rift.D.reward));
  const coins = Math.min(8, Math.ceil(nK / 4));
  for (let i = 0; i < coins; i++) dropPickup(e.x, e.y, 'kama', { val: Math.max(1, Math.round(nK / coins)) });
  const xp = D.xp * (1 + (e.lvl - 1) * 0.3) * (e.elite ? 4 : 1) * rift.D.reward;
  const orbs = Math.min(10, Math.ceil(xp / 4));
  for (let i = 0; i < orbs; i++) dropPickup(e.x, e.y, 'xp', { val: xp / orbs });
  if (Math.random() < 0.025) dropPickup(e.x, e.y, 'pain', { val: 25 });
  if (e.elite) {
    dropPickup(e.x, e.y, 'item', { item: makeItem(S.cls, itemLevel(), rollDiffRarity(rift.D, 0.25)) });
    if (Math.random() < rift.D.eliteSet) dropPickup(e.x, e.y, 'item', { item: makeSetItem(S.cls, itemLevel(), rift.biome.id) });
  } else if (!e.boss && Math.random() < 0.035 * (boostOn('fortuna') ? 1.7 : 1)) dropPickup(e.x, e.y, 'item', { item: makeItem(S.cls, itemLevel(), rollDiffRarity(rift.D, boostOn('fortuna') ? 0.15 : 0)) });

  for (let i = 0; i < 12; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(40, 160);
    particles.push({ x: e.x, y: e.y - e.r * 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, max: 0.5, color: i % 2 ? '#ffffff' : D.blood, size: rand(3, 7), grav: 0 });
  }
  hitFlash(e.x, e.y - e.r * 0.6, e.r * 1.4 + 10, '255,220,160');
  sparks(e.x, e.y - e.r * 0.6, 10, '#ffd9a0', 300);
  embers(e.x, e.y - e.r * 0.6, e.elite || e.boss ? 16 : 5, '255,190,110', e.r);
  rings.push({ x: e.x, y: e.y, r0: 5, r1: e.r * 2.4, life: 0.3, max: 0.3, color: 'rgba(255,220,160,' });
  addDecal('scorch', e.x, e.y, e.r * 1.3, 3, '255,120,40');
  // el cuerpo sale despedido, se vuelca y se deshace
  const c = Object.assign({}, e);
  c.ct = 0; c.cmax = e.boss ? 1.6 : 0.65; c.flash = 0.07; c.spawnT = 0; c.z = 0;
  c.fall = (e.kvx >= 0 ? 1 : -1);
  if (!e.kvx && !e.kvy) { const a = Math.atan2(e.y - P.y, e.x - P.x); c.kvx = Math.cos(a) * 160; c.kvy = Math.sin(a) * 160; c.fall = c.kvx >= 0 ? 1 : -1; }
  c.style = e.boss ? 'boss' : DEATH_STYLE[e.type] || 'tip';
  if (c.style === 'burst') { c.cmax = 0.32; for (let i = 0; i < 14; i++) { const a = rand(0, TAU), sp = rand(80, 220); particles.push({ kind: 'glowdot', x: e.x, y: e.y - e.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.5, max: 0.5, rgb: '255,170,60', size: 6, grav: 0 }); } }
  if (c.style === 'crumble') { c.cmax = 0.9; for (let i = 0; i < 16; i++) { const a = rand(0, TAU), sp = rand(60, 200); particles.push({ x: e.x + rand(-e.r, e.r) * 0.6, y: e.y - rand(0, e.r * 1.6), vx: Math.cos(a) * sp, vy: -rand(120, 260), life: 0.8, max: 0.8, color: pick(['#4d4544', '#5c5352', '#3b3534', '#6b6260']), size: rand(4, 8), grav: 700 }); } }
  if (c.style === 'deflate') for (let i = 0; i < 10; i++) particles.push({ kind: 'glowdot', x: e.x + rand(-8, 8), y: e.y - rand(10, 24), vx: rand(-40, 40), vy: rand(-80, -30), life: 0.9, max: 0.9, rgb: '127,224,232', size: 4, grav: 0 });
  if (c.style === 'boss') c.cmax = 1.9;
  corpses.push(c);
  if (corpses.length > 40) corpses.shift();
  if (e.elite || e.boss) { zoomPunch = Math.max(zoomPunch, e.boss ? 0.12 : 0.04); hitStop(e.boss ? 0.25 : 0.06); }
  // Chispines inestables y élites explosivos estallan al morir
  if ((e.type === 'tofu' && rift.threat >= 3) || (e.elite && e.elite.explode)) {
    const big = e.elite && e.elite.explode;
    addHazard('boom', e.x, e.y, big ? 90 : 46, big ? 0.7 : 0.55, e.dmg * (big ? 1.6 : 1.1), { src: e });
  }
  if (e.boss) guardianDefeated(e);
}

function dropPickup(x, y, type, o = {}) {
  const a = rand(0, Math.PI * 2), sp = type === 'item' || type === 'dofus' ? rand(60, 160) : rand(40, 140);
  pickups.push({ x, y, type, val: o.val || 0, item: o.item, id: o.id, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, z: 0, vz: rand(140, 220) });
  if ((type === 'item' && o.item.rarity >= 2) || type === 'dofus') {
    const rgb = type === 'dofus' ? '120,220,255' : RARITY_RGB[o.item.rarity];
    hitFlash(x, y - 10, 30, rgb);
    embers(x, y, 12, rgb, 20);
  }
}

function enemyShoot(e, a, speed, dmg, kind = 'seed', r = 6, life = 2.4) {
  if (!e.boss) { e.atkT = 0.18; e.atkA = a; e.atkDir = -0.6; } // retroceso del disparo
  projectiles.push({ team: 'e', kind, x: e.x, y: e.y - 14 - (e.boss ? e.r * 0.5 : 0), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r, dmg, life, pierce: 0, hit: [], src: e, sp: speed });
}

// ---------- Peligros en el suelo (telegrafiados: primero se avisan, luego golpean) ----------
const HAZ_COL = { meteor: '255,90,30', ice: '140,210,255', slam: '255,200,120', boom: '255,140,30', fire: '255,90,20', web: '230,240,220' };
function addHazard(kind, x, y, r, t, dmg, o = {}) {
  hazards.push({ kind, x, y, r, t, max: t, dmg, linger: o.linger || 0, tick: 0, post: o.post ?? 0.5, src: o.src, fired: false });
}
function triggerHazard(h) {
  h.fired = true;
  const inside = dist(P.x, P.y, h.x, h.y) < h.r + P.r * 0.6;
  const col = HAZ_COL[h.kind];
  if (h.kind === 'ice') {
    spawnVfx('ice', h.x, h.y - 14, h.r * 1.9, { dur: 0.5 });
    sparks(h.x, h.y - 10, 6, '#e6f6ff', 260, -Math.PI / 2, 1.2, 600);
    if (Math.random() < 0.5) SFX.play('hit');
  } else if (h.kind === 'web') {
    // telaraña: no hace daño, ralentiza mientras dure
  } else {
    rings.push({ x: h.x, y: h.y, r0: h.r * 0.3, r1: h.r * 1.1, life: 0.35, max: 0.35, color: `rgba(${col},` });
    hitFlash(h.x, h.y - 8, h.r * 0.7, col);
    embers(h.x, h.y, h.kind === 'slam' ? 6 : 12, col, h.r * 0.6);
    if (h.kind === 'slam') dust(h.x, h.y, 18); else sparks(h.x, h.y, 10, '#ffcf8a', 320);
    addDecal(h.kind === 'slam' ? 'crack' : 'scorch', h.x, h.y, h.r * (h.kind === 'slam' ? 0.55 : 0.9), 2.5, col);
    shake(h.r > 120 ? 14 : 6); SFX.play('boom');
  }
  if (inside && h.dmg > 0) hurtPlayer(h.dmg, h.x, h.y, h.src);
}
function updateHazards(dt) {
  for (const h of hazards) {
    if (!h.fired) { h.t -= dt; if (h.t <= 0) triggerHazard(h); continue; }
    if (h.linger > 0) {
      h.linger -= dt; h.tick -= dt;
      const inside = dist(P.x, P.y, h.x, h.y) < h.r;
      if (inside && h.kind === 'web') P.slowT = Math.max(P.slowT, 0.2);
      if (inside && h.kind === 'fire' && h.tick <= 0) { h.tick = 0.5; hurtPlayer(h.dmg * 0.3, h.x, h.y, h.src); }
      if (h.kind === 'fire' && Math.random() < 0.25) particles.push({ kind: 'glowdot', x: h.x + rand(-h.r, h.r) * 0.7, y: h.y + rand(-h.r, h.r) * 0.35, vx: 0, vy: -50, life: 0.6, max: 0.6, rgb: '255,120,40', size: 4, grav: 0 });
    } else h.post -= dt;
  }
  hazards = hazards.filter((h) => !h.fired || h.linger > 0 || h.post > 0);
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
        if (e.st <= 0) {
          // en Grietas altas encadenan una segunda embestida
          if (!e.second && rift.threat >= 4) { e.second = true; e.state = 'wind'; e.st = 0.35; }
          else { e.second = false; e.state = 'rest'; e.st = 0.7; }
        }
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
        if (rift.threat >= 2) { enemyShoot(e, a - 0.25, 240, e.dmg); enemyShoot(e, a + 0.25, 240, e.dmg); }
        if (rift.threat >= 6) { enemyShoot(e, a - 0.5, 240, e.dmg); enemyShoot(e, a + 0.5, 240, e.dmg); }
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
          addDecal('crack', e.x, e.y, R * 0.9, 2, '255,140,50');
          e.slamT = 0.3;
          // desde la Grieta 4 deja el suelo ardiendo
          if (rift.threat >= 4) addHazard('fire', e.x, e.y, 70, 0.01, e.dmg, { linger: 2.5, src: e });
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
    case 'bossSpider':
      updateBossSpider(e, dt, d, ux, uy, sp);
      mvx = e.mvx; mvy = e.mvy;
      break;
    case 'bossGolem':
      updateBossGolem(e, dt, d, ux, uy, sp);
      mvx = e.mvx; mvy = e.mvy;
      contactMul = 1.3;
      break;
    case 'bossMage':
      updateBossMage(e, dt, d, ux, uy, sp);
      mvx = e.mvx; mvy = e.mvy;
      contactMul = 0.6;
      break;
  }

  if (e.superDef) updateSuper(e, dt);
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
    e.atkT = 0.25; e.atkA = Math.atan2(P.y - e.y, P.x - e.x); e.atkDir = 1; // se lanza a morder
  }
  if (e.atkT > 0) e.atkT -= dt;
  if (e.slamT > 0) e.slamT -= dt;
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
        const m = spawnEnemy(rift.biome.id === 'ceniza' || !rift.biome.minion ? (Math.random() < 0.3 ? 'tofu' : 'bouftou') : rift.biome.minion, e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70);
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
        const m = spawnEnemy(rift.biome.minion || 'tofu', e.x + Math.cos(a) * 60, e.y + Math.sin(a) * 60);
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


// Salto con caída en área (lo comparten varios Guardianes)
function bossLeap(e, dt, R, onLand) {
  e.st -= dt;
  const k = 1 - e.st / e.max;
  if (k < 0.45) { e.tx = lerp(e.tx, P.x, 0.08); e.ty = lerp(e.ty, P.y, 0.08); }
  e.x = lerp(e.sx, e.tx, k); e.y = lerp(e.sy, e.ty, k);
  e.z = Math.sin(k * Math.PI) * 120;
  e.kvx = e.kvy = 0;
  if (e.st <= 0) {
    e.z = 0;
    rings.push({ x: e.x, y: e.y, r0: 30, r1: R, life: 0.4, max: 0.4, color: 'rgba(255,240,200,' });
    dust(e.x, e.y, 24); shake(16); SFX.play('boom'); zoomPunch = Math.max(zoomPunch, 0.05);
    addDecal('crack', e.x, e.y, R * 0.8, 3, '255,160,80');
    if (dist(P.x, P.y, e.x, e.y) < R + P.r) hurtPlayer(e.dmg * 1.6, e.x, e.y, e);
    onLand();
  }
}
function startLeap(e, t) { e.state = 'leap'; e.st = e.max = t; e.tx = P.x; e.ty = P.y; e.sx = e.x; e.sy = e.y; }
function summonAround(e, type, n, rr) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const m = spawnEnemy(type, e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr);
    poof(m.x, m.y);
  }
}

// Reina Tejeceniza: telarañas que ralentizan, saltos y crías
function updateBossSpider(e, dt, d, ux, uy, sp) {
  const spd = sp * (e.enraged ? 1.3 : 1);
  e.mvx = 0; e.mvy = 0;
  if (e.state === 'move') {
    const side = Math.sin(e.t * 0.6 + e.seed) > 0 ? 1 : -1;
    const k = d > 260 ? 1 : d < 160 ? -0.5 : 0.2;
    e.mvx = (ux * k - uy * side * 0.9) * spd; e.mvy = (uy * k + ux * side * 0.9) * spd;
    e.st -= dt;
    if (e.st <= 0) {
      const next = ['web', 'leap', 'summon', 'web', 'leap'][e.cycle++ % 5];
      if (next === 'web') { e.state = 'web'; e.st = 1.2; e.cd = 0.2; }
      else if (next === 'leap') { e.state = 'wind'; e.st = 0.5; e.after = 'leap'; }
      else { e.state = 'summon'; e.st = 0.9; }
    }
  } else if (e.state === 'wind') {
    e.st -= dt;
    if (e.st <= 0) startLeap(e, 1.0);
  } else if (e.state === 'leap') {
    bossLeap(e, dt, 150, () => {
      addHazard('web', e.x, e.y, 110, 0.01, 0, { linger: 4, src: e });
      e.state = 'move'; e.st = e.enraged ? 1.2 : 2;
    });
  } else if (e.state === 'web') {
    e.st -= dt; e.cd -= dt;
    if (e.cd <= 0) {
      const a = Math.atan2(uy, ux), n = e.enraged ? 5 : 3;
      for (let i = 0; i < n; i++) enemyShoot(e, a + (i - (n - 1) / 2) * 0.28, 250, e.dmg * 0.6, 'web', 9, 2.6);
      e.cd = 0.4; SFX.play('web');
    }
    if (e.st <= 0) { e.state = 'move'; e.st = 1.6; }
  } else if (e.state === 'summon') {
    e.st -= dt;
    if (e.st <= 0) { summonAround(e, 'arakne', e.enraged ? 6 : 4, 60); e.state = 'move'; e.st = 2; }
  }
}

// Coloso de Escarcha: golpe enorme, líneas de estacas de hielo, rocas
function updateBossGolem(e, dt, d, ux, uy, sp) {
  const spd = sp * (e.enraged ? 1.25 : 1);
  e.mvx = 0; e.mvy = 0;
  if (e.state === 'move') {
    e.mvx = ux * spd; e.mvy = uy * spd;
    e.st -= dt;
    if (e.st <= 0) {
      const next = ['slam', 'spikes', 'boulders', 'spikes', 'slam'][e.cycle++ % 5];
      if (next === 'slam') {
        e.state = 'wind'; e.st = e.max = 1.1;
        addHazard('slam', e.x, e.y, 200, 1.1, e.dmg * 1.7, { src: e });
      } else if (next === 'spikes') {
        const a = Math.atan2(uy, ux), lines = e.enraged ? 5 : 3;
        for (let l = 0; l < lines; l++) {
          const al = a + (l - (lines - 1) / 2) * 0.38;
          for (let j = 1; j <= 9; j++) addHazard('ice', e.x + Math.cos(al) * (30 + j * 44), e.y + Math.sin(al) * (30 + j * 44), 30, 0.6 + j * 0.07, e.dmg, { src: e, post: 0.7 });
        }
        e.state = 'rest'; e.st = 1.3; SFX.play('magic');
      } else {
        e.state = 'throw'; e.st = 1.0; e.cd = 0.15;
      }
    }
  } else if (e.state === 'wind') {
    e.st -= dt;
    if (e.st <= 0) {
      zoomPunch = Math.max(zoomPunch, 0.06); hitStop(0.05);
      if (e.enraged) for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; addHazard('ice', e.x + Math.cos(a) * 250, e.y + Math.sin(a) * 250, 34, 0.5, e.dmg, { src: e, post: 0.7 }); }
      e.state = 'rest'; e.st = 0.9;
    }
  } else if (e.state === 'throw') {
    e.st -= dt; e.cd -= dt;
    if (e.cd <= 0) {
      const a = Math.atan2(P.y - e.y, P.x - e.x) + rand(-0.15, 0.15);
      enemyShoot(e, a, 290, e.dmg * 1.2, 'boulder', 14, 2.6);
      e.cd = e.enraged ? 0.22 : 0.32; SFX.play('swing');
    }
    if (e.st <= 0) { e.state = 'move'; e.st = 1.6; }
  } else {
    e.st -= dt;
    if (e.st <= 0) { e.state = 'move'; e.st = e.enraged ? 1.2 : 1.9; }
  }
}

// Hechicero del Abismo: se teletransporta, espirales de proyectiles, orbes que persiguen y meteoros
function updateBossMage(e, dt, d, ux, uy, sp) {
  e.mvx = 0; e.mvy = 0;
  if (e.state === 'move') {
    const side = Math.sin(e.t * 0.5 + e.seed) > 0 ? 1 : -1;
    const k = d > 320 ? 1 : d < 220 ? -0.8 : 0;
    e.mvx = (ux * k - uy * side * 0.7) * sp; e.mvy = (uy * k + ux * side * 0.7) * sp;
    e.st -= dt;
    if (e.st <= 0) {
      const next = ['spiral', 'blink', 'orbs', 'meteor', 'blink', 'summon'][e.cycle++ % 6];
      if (next === 'spiral') { e.state = 'spiral'; e.st = e.enraged ? 2.4 : 1.8; e.cd = 0; e.spin = rand(0, TAU); }
      else if (next === 'blink') { e.state = 'wind'; e.st = 0.45; e.after = 'blink'; }
      else if (next === 'orbs') { e.state = 'cast'; e.st = 0.6; e.after = 'orbs'; }
      else if (next === 'meteor') { e.state = 'cast'; e.st = 0.5; e.after = 'meteor'; }
      else { e.state = 'cast'; e.st = 0.6; e.after = 'summon'; }
    }
  } else if (e.state === 'wind') {
    e.st -= dt;
    if (e.st <= 0) {
      poof(e.x, e.y); hitFlash(e.x, e.y - 20, 30, '192,124,240');
      for (let k = 0; k < 10; k++) {
        const a = rand(0, TAU), r = rand(200, 300);
        const x = clamp(P.x + Math.cos(a) * r, 60, WORLD.w - 60), y = clamp(P.y + Math.sin(a) * r, 60, WORLD.h - 60);
        if (obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + e.r + 10)) continue;
        e.x = x; e.y = y; break;
      }
      poof(e.x, e.y); hitFlash(e.x, e.y - 20, 36, '192,124,240'); SFX.play('zaap');
      e.state = 'move'; e.st = 0.5;
    }
  } else if (e.state === 'spiral') {
    e.st -= dt; e.cd -= dt;
    if (e.cd <= 0) {
      const arms = e.enraged ? 4 : 3;
      for (let i = 0; i < arms; i++) enemyShoot(e, e.spin + (i / arms) * TAU, 190, e.dmg * 0.55, 'bolt', 7, 3);
      e.spin += 0.32; e.cd = 0.11;
    }
    if (e.st <= 0) { e.state = 'move'; e.st = 1.4; }
  } else if (e.state === 'cast') {
    e.st -= dt;
    if (e.st <= 0) {
      if (e.after === 'orbs') {
        const n = e.enraged ? 5 : 3;
        for (let i = 0; i < n; i++) enemyShoot(e, (i / n) * TAU, 150, e.dmg * 0.9, 'homing', 10, 4.5);
        SFX.play('magic');
      } else if (e.after === 'meteor') {
        const n = e.enraged ? 8 : 5;
        for (let i = 0; i < n; i++) {
          const a = rand(0, TAU), r = i === 0 ? 0 : rand(50, 170);
          addHazard('meteor', P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, 62, 1.0 + i * 0.12, e.dmg * 1.3, { src: e });
        }
      } else summonAround(e, 'tofu', e.enraged ? 6 : 4, 50);
      e.state = 'move'; e.st = 1.5;
    }
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

// Cómo muere cada monstruo: se vuelca (por defecto), estalla, se desmorona, se desinfla o se encoge
const DEATH_STYLE = { tofu: 'burst', craqueleur: 'crumble', colosoHielo: 'crumble', pissenlit: 'deflate', arakne: 'curl' };

// ============================================================
// La Grieta
// ============================================================
const RIFT_TIME = 300;

function riftTypes(F) {
  const w = curBiome().weights;
  return Object.keys(w).map((k) => [k, w[k] + (k === 'craqueleur' && F >= 3 ? 1 : 0)]);
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
  const n = randi(3 + Math.floor(rift.threat / 3), 5 + Math.floor(rift.threat / 2));
  const types = riftTypes(rift.level);
  // los primeros segundos sin crujidores
  const early = rift.elapsed < 20;
  const eliteIdx = rift.isDungeon ? (Math.random() < 0.8 ? 0 : -1) : rift.elapsed > 15 && Math.random() < Math.min(0.45, 0.12 + rift.threat * 0.03) ? 0 : -1;
  for (let i = 0; i < n; i++) {
    let type = weightedPick(types);
    if (early && ENEMIES[type].hp > 100) type = Object.keys(rift.biome.weights).find((k) => ENEMIES[k].hp <= 100) || type;
    const e = spawnEnemy(type, p.x + rand(-50, 50), p.y + rand(-50, 50), { elite: i === eliteIdx });
    poof(e.x, e.y);
  }
}

// Atajo (pruebas): nivel global -> nodo del mapa en Fácil
function startRift(level, d = 0) {
  const b = Math.min(BIOMES.length - 1, Math.floor((level - 1) / LEVELS_PER_BIOME));
  startNode(b, Math.min(LEVELS_PER_BIOME, level - b * LEVELS_PER_BIOME), d);
}
function startNode(b, n, d) {
  SFX.init();
  scene = 'rift';
  const level = globalLevel(b, n), isSuper = n === 'S';
  const DF = DIFFS[isSuper ? 2 : d];
  rift = {
    level, b, n, d: isSuper ? 2 : d, D: DF, isSuper,
    threat: Math.floor((level - 1) / 3) + DF.threat,
    biome: BIOMES[b], progress: 0, goal: 70 + level * 2, time: isSuper ? RIFT_TIME + 60 : RIFT_TIME, elapsed: 0,
    bossSpawned: false, bossDead: false, zaap: null, spawnT: 1, kills: 0,
    items: 0, legendaries: 0, kamas0: S.kamas, xp: 0, levels: 0, bonus: 0, dofus: null,
    boost: {},
  };
  genRift();
  groundChunks.clear();
  resetFx(); resetVfx();
  MUSIC.setDuck(1);
  MUSIC.play(rift.biome.id, { fade: 1.5 });
  // los elixires comprados se beben al entrar
  for (const k of Object.keys(ELIXIRS)) if (S.boosts[k] > 0) { S.boosts[k]--; rift.boost[k] = true; }
  createPlayer();
  enemies = []; projectiles = []; pickups = []; particles = []; texts = []; slashes = []; rings = []; glyphs = []; timers = [];
  hazards = []; corpses = []; ghosts = []; zoomPunch = 0;
  cam.x = P.x; cam.y = P.y;
  bossRef = null; banner = null; subBanner = null;
  streak = { n: 0, t: -10 };
  resetRiftEvents();
  resetClassState();
  clearInput();
  state = 'play';
  showOverlay(null);
  if (isSuper) {
    rift.bossSpawned = true;
    showBanner(SUPER_BOSSES[rift.biome.id].name, '#ff5a3d', 'Súper Jefe de ' + rift.biome.name + ' · ¡Prepárate!');
    later(2.2, spawnSuperBoss);
  } else showBanner(rift.biome.name, DF.color, `Grieta ${n} · ${DF.name} · Llena la barra para invocar al Guardián`);
  SFX.play('zaap');
  enterFullscreen();
}

function spawnSuperBoss() {
  const sd = SUPER_BOSSES[rift.biome.id];
  MUSIC.play('superboss', { fade: 0.6 });
  const p = spawnPos();
  const b = spawnEnemy(sd.base, p.x, p.y, { super: sd });
  b.sCd = 4; b.phase = 0;
  poof(b.x, b.y); embers(b.x, b.y, 30, sd.aura, 60);
  showBanner('¡' + sd.name + '!', '#ff5a3d', 'niv. ' + b.lvl + ' · Súper Jefe');
  SFX.play('boss'); shake(16); zoomPunch = 0.1;
}
// Mecánicas extra de los Súper Jefes (se suman a las del Guardián base)
function updateSuper(e, dt) {
  const sd = e.superDef;
  const k = e.hp / e.maxHp;
  const ph = k < 0.33 ? 2 : k < 0.66 ? 1 : 0;
  if (ph > e.phase) {
    e.phase = ph;
    showBanner(ph === 1 ? '¡Segunda fase!' : '¡Fase final!', '#ff5a3d', e.name + ' se vuelve más peligroso');
    SFX.play('boss'); shake(14); zoomPunch = Math.max(zoomPunch, 0.08);
    for (let i = 0; i < 2; i++) { const a = rand(0, TAU); const m = spawnEnemy(pick(Object.keys(rift.biome.weights)), e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90, { elite: true }); poof(m.x, m.y); }
    e.speed *= 1.12;
  }
  e.sCd -= dt;
  if (e.sCd > 0 || e.spawnT > 0) return;
  e.sCd = [7, 5.5, 4][e.phase];
  const n = 5 + e.phase * 3;
  if (typeof SUPER_MOVES !== 'undefined' && SUPER_MOVES[sd.move]) { SUPER_MOVES[sd.move](e, 1 + e.phase); return; }
  if (sd.move === 'meteor') {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), r = i === 0 ? 0 : rand(60, 220); addHazard('meteor', P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, 64, 1.0 + i * 0.1, e.dmg * 1.2, { src: e }); }
  } else if (sd.move === 'brood') {
    for (let i = 0; i < 2 + e.phase; i++) { const a = rand(0, TAU); addHazard('web', P.x + Math.cos(a) * rand(0, 160), P.y + Math.sin(a) * rand(0, 160), 90, 0.4, 0, { linger: 5, src: e }); }
    for (let i = 0; i < 3 + e.phase * 2; i++) { const a = (i / 5) * TAU; const m = spawnEnemy(rift.biome.id === 'pantano' ? 'arakne' : rift.biome.minion || 'arakne', e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70); poof(m.x, m.y); }
  } else if (sd.move === 'nova') {
    for (const [R, t] of [[150, 0.7], [270, 1.0], [390, 1.3]].slice(0, 1 + e.phase)) {
      const cnt = Math.round(R / 22);
      for (let i = 0; i < cnt; i++) { const a = (i / cnt) * TAU; addHazard('ice', e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, 32, t, e.dmg, { src: e, post: 0.7 }); }
    }
  } else if (sd.move === 'firelines') {
    const base = Math.atan2(P.y - e.y, P.x - e.x);
    for (let l = 0; l < 2 + e.phase; l++) {
      const al = base + (l - (1 + e.phase) / 2) * 0.5;
      for (let j = 1; j <= 10; j++) addHazard('fire', e.x + Math.cos(al) * j * 46, e.y + Math.sin(al) * j * 46, 30, 0.6 + j * 0.06, e.dmg * 0.9, { src: e, linger: 2.2 });
    }
  } else {
    for (let i = 0; i < 3 + e.phase; i++) { const a = rand(0, TAU), r = rand(40, 200); addHazard('meteor', P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, 70, 1.1 + i * 0.15, e.dmg * 1.3, { src: e }); }
    for (let i = 0; i < 2 + e.phase; i++) enemyShoot(e, (i / (2 + e.phase)) * TAU, 160, e.dmg * 0.9, 'homing', 10, 5);
  }
}

function spawnGuardian() {
  if (rift.isDungeon) { rift.bossSpawned = true; spawnSuperBoss(); return; }
  MUSIC.play('boss', { fade: 0.8 });
  rift.bossSpawned = true;
  const type = curBiome().boss;
  const p = spawnPos();
  const b = spawnEnemy(type, p.x, p.y);
  poof(b.x, b.y);
  showBanner('¡El Guardián aparece!', '#ff7043', ENEMIES[type].name + ' · niv. ' + b.lvl);
  SFX.play('boss');
  shake(10);
}

const BOSS_LOOT_NAME = { bouftouRoyal: 'del Colmillo Ancestral', tofuRoyal: 'de la Garra Ígnea', reinaTeje: 'de la Reina Tejeceniza', colosoHielo: 'del Coloso de Escarcha', hechicero: 'del Hechicero del Abismo' };
function guardianDefeated(e) {
  bossRef = null;
  trackDaily('boss');
  rift.bossDead = true;
  shake(20); hitStop(0.2);
  SFX.play('boom');
  // limpiar invocaciones
  for (const m of enemies) if (!m.dead && m !== e) { m.dead = true; poof(m.x, m.y); }
  hazards = [];
  projectiles = projectiles.filter((p) => p.team === 'p');
  // botín del guardián
  const n = Math.min(10, 4 + Math.floor(rift.level / 5) + rift.d + (rift.isSuper ? 3 : 0));
  for (let i = 0; i < n; i++) {
    let r = rollDiffRarity(rift.D, 0.15);
    if (i === 0) r = rift.D.rar[1]; // la primera pieza del Guardián siempre es de la calidad alta
    const named = r === 3 ? { name: e.superDef ? 'de ' + e.superDef.name.split(',')[0] : BOSS_LOOT_NAME[e.type] } : {};
    dropPickup(e.x, e.y, 'item', { item: makeItem(S.cls, itemLevel() + 1, r, named) });
  }
  for (let i = 0; i < 3; i++) dropPickup(e.x, e.y, 'pain', { val: 30 });
  // piezas del conjunto de la zona: más probables cuanto más difícil
  const setRolls = rift.isSuper ? [1, 0.5] : [rift.D.set];
  for (const ch of setRolls) if (Math.random() < ch) { dropPickup(e.x, e.y, 'item', { item: makeSetItem(S.cls, itemLevel() + 2, rift.biome.id) }); rift.setDrop = true; }
  // ¿Gema Ancestral?
  const missing = gemsFor(rift.biome.id, rift.isSuper).filter((k) => !S.dofus.includes(k));
  if (missing.length && Math.random() < gemChance(rift.level, rift.d, rift.isSuper)) dropPickup(e.x, e.y, 'dofus', { id: pick(missing) });
  // bonus de tiempo
  if (rift.time > 0) {
    rift.bonus = Math.round(40 * rift.level * P.kamaMul * rift.D.reward);
    for (let i = 0; i < 6; i++) dropPickup(e.x, e.y, 'kama', { val: Math.round(rift.bonus / 6) });
    dropPickup(e.x, e.y, 'item', { item: makeItem(S.cls, itemLevel(), rollDiffRarity(rift.D, 0.1)) });
  }
  showBanner(`¡${e.name} derrotado!`, '#ffd76a', 'Recoge el botín y cruza el Portal para volver a Villa Candela');
  // zaap de salida
  const zx = clamp(e.x + 140, 80, WORLD.w - 80), zy = clamp(e.y - 60, 80, WORLD.h - 80);
  for (const o of obstacles) if (dist(o.x, o.y, zx, zy) < 90) o.gone = true;
  obstacles = obstacles.filter((o) => !o.gone);
  later(1.2, () => { rift.zaap = { x: zx, y: zy }; poof(zx, zy - 30); SFX.play('zaap'); });
  MUSIC.play('victory', { loop: false, fade: 0.3, then: rift.biome.id });
  if (rift.isDungeon) dungeonVictory(e);
  else {
    // Sellos de Gesta por primeras victorias importantes
    const prevC = mapProg().c[nodeKey(rift.b, rift.n)] || 0;
    if (rift.isSuper && !prevC) later(2, () => gainSeals(5, 'primer Súper Jefe'));
    else if (!rift.isSuper && rift.d === 2 && prevC < 3) later(2, () => gainSeals(2, 'primera victoria en Difícil'));
    markCleared(rift.b, rift.n, rift.d);
    S.maxFaille = Math.max(S.maxFaille, highestLevel());
    autoAdvance();
    if (rift.isSuper && rift.b + 1 < BIOMES.length) later(3, () => showBanner('¡Nuevo mundo desbloqueado!', '#7cff8a', BIOMES[rift.b + 1].name));
  }
  persist();
}

function updateRift(dt) {
  rift.elapsed += dt;
  updateRiftEvents(dt);
  if (!rift.bossDead) rift.time -= dt;
  if (!rift.bossSpawned) {
    rift.spawnT -= dt;
    const cap = Math.min(60, 26 + rift.threat * 3);
    if (rift.spawnT <= 0 && enemies.length < cap) {
      spawnPack();
      rift.spawnT = rand(1.3, 2.3) * Math.max(0.45, 1 - rift.threat * 0.05);
    }
  }
  if (rift.zaap && dist(P.x, P.y, rift.zaap.x, rift.zaap.y - 10) < 34) finishRift();
  // fin de racha
  if (streak.n >= 10 && gameTime - streak.t > 1.6) {
    const bonus = Math.round(streak.n * 2 * P.kamaMul);
    S.kamas += bonus;
    gainXp(streak.n * (2 + rift.threat));
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
          damageEnemy(e, p.dmg, { kb: p.kb, fx: p.x - p.vx, fy: p.y - p.vy, poison: p.poison, src: p.src });
          p.pierce--;
          if (p.pierce < 0) { p.life = -1; break; }
        }
      }
      if (p.life <= 0 && p.kind === 'explo' && !p.exploded) explode(p);
    } else {
      if (p.kind === 'homing' && P) {
        const want = Math.atan2(P.y - p.y, P.x - p.x), cur = Math.atan2(p.vy, p.vx);
        const na = cur + clamp(angDiff(want, cur), -2.2 * dt, 2.2 * dt);
        p.vx = Math.cos(na) * p.sp; p.vy = Math.sin(na) * p.sp;
      }
      if (dist(p.x, p.y, P.x, P.y - 8) < p.r + P.r) {
        if (p.kind === 'web') P.slowT = Math.max(P.slowT, 1.8);
        hurtPlayer(p.dmg, p.x, p.y, p.src);
        p.life = -1;
      }
      if (p.kind === 'boulder' && p.life <= 0) { dust(p.x, p.y, 6); addDecal('crack', p.x, p.y, 26, 1.5, '200,220,255'); }
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
  spawnVfx('explosion', p.x, p.y - 20, 160, { dur: 0.45 });
  const R = 88;
  aoe(p.x, p.y, R, p.dmg, 300, true);
  rings.push({ x: p.x, y: p.y, r0: 10, r1: R, life: 0.3, max: 0.3, color: 'rgba(255,160,40,' });
  for (let i = 0; i < 20; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(80, 280);
    particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.45, max: 0.45, color: pick(['#ffb300', '#ff5722', '#fff3e0']), size: rand(3, 6), grav: 0 });
  }
  shake(6); SFX.play('boom');
  addDecal('scorch', p.x, p.y, 60, 3, '255,120,30');
  hitFlash(p.x, p.y - 6, 40, '255,150,50');
  embers(p.x, p.y, 10, '255,140,40', 30);
}

function updateGlyphs(dt) {
  for (const g of glyphs) {
    g.life -= dt;
    g.tick -= dt;
    for (const e of enemies) if (!e.dead && dist(g.x, g.y, e.x, e.y) < g.r + e.r * 0.5) e.slowT = 0.2;
    if (g.tick <= 0) { g.tick = 0.35; aoe(g.x, g.y, g.r, skillDmg(0.75 * (g.mul || 1)), 0); }
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
  if (k.type === 'kama') { S.kamas += k.val; trackDaily('amber', k.val); SFX.play('coin'); }
  else if (k.type === 'xp') { gainXp(k.val); SFX.play('xp'); }
  else if (k.type === 'pain') {
    if (P.hp >= P.maxHp && S.pan < panMax()) { S.pan++; addText(P.x, P.y - 40, '+1 🧪', '#b5f28a', 0.9); }
    else heal(Math.round(P.maxHp * 0.25));
    SFX.play('heal');
  } else if (k.type === 'item') {
    if (S.bag.length >= bagMax()) {
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
    // si hay un hueco libre se engarza sola
    const free = S.gemSlots.indexOf(null);
    if (free >= 0) S.gemSlots[free] = k.id;
    recalc();
    showBanner(GEMS[k.id].name.toUpperCase(), GEMS[k.id].color, GEMS[k.id].desc + (free >= 0 ? ' · ¡Engarzada!' : ' · Engárzala en Personaje → Gemas'));
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
    levelUpPillar(P.x, P.y);
    shake(5);
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
  for (const t of texts) {
    t.life -= dt;
    if (t.vy !== undefined) { t.vy += 300 * dt; t.x += t.vx * dt; t.y += t.vy * dt; }
    else t.y -= 38 * dt;
  }
  texts = texts.filter((t) => t.life > 0);
  for (const s of slashes) {
    s.life -= dt;
    if (s.follow && P) { s.x = P.x; s.y = P.y; }
  }
  slashes = slashes.filter((s) => s.life > 0);
  for (const r of rings) r.life -= dt;
  rings = rings.filter((r) => r.life > 0);
  for (const c of corpses) {
    c.ct += dt; c.flash -= dt;
    c.x += c.kvx * dt; c.y += c.kvy * dt;
    const fr = Math.exp(-6 * dt); c.kvx *= fr; c.kvy *= fr;
    if (c.ct > c.cmax * 0.55 && Math.random() < (c.boss ? 0.9 : 0.35)) particles.push({ kind: 'glowdot', x: c.x + rand(-c.r, c.r) * 0.8, y: c.y - rand(0, c.r * 1.2), vx: 0, vy: rand(-70, -30), life: 0.6, max: 0.6, rgb: hexRgb(c.D.blood.length === 7 ? c.D.blood : '#ffaa66'), size: 4, grav: 0 });
  }
  corpses = corpses.filter((c) => c.ct < c.cmax);
  for (const g of ghosts) g.life -= dt;
  ghosts = ghosts.filter((g) => g.life > 0);
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
  spawnVfx('smoke', x, y - 22, 66, { dur: 0.6 });
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

function text(str, x, y, size, color, align = 'left', weight = 800, stroke = true, family = 'Garamond, Georgia, serif') {
  if (HD2D.active && ctx === HD2D.g) { hd2dDeferText([str, x, y, size, color, align, weight, stroke, family]); return; }
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = Math.max(2, size / 6); ctx.strokeStyle = 'rgba(6,8,18,0.85)'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// iconos pintados de la interfaz (img/ui)
const UI_ICON = {};
for (const n of ['bag', 'pause', 'potion']) { const im = new Image(); im.onload = () => { UI_ICON[n] = im; }; im.src = 'img/ui/' + n + '.png'; }
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
  circle(px, py, 26 * s, '#1f2a4a', '#c9b27a', 3 * s);
  ctx.save();
  ctx.beginPath(); ctx.arc(px, py, 24 * s, 0, Math.PI * 2); ctx.clip();
  const art = heroArt(P.cls);
  if (art) {
    // retrato: la cabeza del arte del héroe
    const img = art.img, fc = art.px && HERO_FACE[P.cls];
    const sw = fc ? fc[2] * 1.15 : img.width * 0.5, sx0 = fc ? fc[0] - sw / 2 : img.width * 0.25, sy0 = fc ? fc[1] - sw * 0.45 : 0;
    ctx.imageSmoothingEnabled = !art.px;
    ctx.drawImage(img, sx0, sy0, sw, sw, px - 24 * s, py - 24 * s, 48 * s, 48 * s);
    ctx.imageSmoothingEnabled = true;
  } else {
    ctx.translate(px, py + 30 * s);
    ctx.scale(s * 1.15, s * 1.15);
    drawHero(ctx, P.cls, { x: 0, y: 0, dir: 0.2, walkT: 0, moving: false, swing: 0, swingSide: 1, shot: 0, t: now });
  }
  ctx.restore();
  roundRect(px - 13 * s, py + 17 * s, 26 * s, 15 * s, 6 * s, '#c9b27a');
  text(String(S.level), px, py + 25 * s, 12 * s, '#151d34', 'center', 900, false);

  // PV
  const bx = px + 34 * s, bw = Math.min(190 * s, W * 0.28), bh = 16 * s;
  let by = pad + 8 * s;
  roundRect(bx, by, bw, bh, bh / 2, 'rgba(0,0,0,0.6)', '#151d34', 2);
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
  // elixires activos en esta Grieta
  const active = Object.keys(ELIXIRS).filter((k) => rift.boost && rift.boost[k]);
  active.forEach((k, i) => {
    const ex = bx + 8 * s + i * 22 * s, ey = by + 30 * s;
    circle(ex, ey, 9 * s, ELIXIRS[k].color, '#2a1a0c', 2);
    circle(ex - 2.5 * s, ey - 2.5 * s, 2.5 * s, ELIXIRS[k].hi);
  });

  // botones pausa / bolsa
  circle(L.pause.x, L.pause.y, L.pause.r, 'rgba(10,14,30,0.6)', '#c9b27a', 2);
  if (UI_ICON.pause) ctx.drawImage(UI_ICON.pause, L.pause.x - L.pause.r * 0.8, L.pause.y - L.pause.r * 0.8, L.pause.r * 1.6, L.pause.r * 1.6);
  else { ctx.fillStyle = '#efece2'; ctx.fillRect(L.pause.x - 6 * s, L.pause.y - 7 * s, 4 * s, 14 * s); ctx.fillRect(L.pause.x + 2 * s, L.pause.y - 7 * s, 4 * s, 14 * s); }
  circle(L.bag.x, L.bag.y, L.bag.r, 'rgba(10,14,30,0.6)', '#c9b27a', 2);
  if (UI_ICON.bag) ctx.drawImage(UI_ICON.bag, L.bag.x - L.bag.r * 0.85, L.bag.y - L.bag.r * 0.85, L.bag.r * 1.7, L.bag.r * 1.7);
  else text('🎒', L.bag.x, L.bag.y + 1, 18 * s, '#fff', 'center', 400, false);
  if (S.points > 0) {
    circle(L.bag.x + L.bag.r * 0.75, L.bag.y - L.bag.r * 0.7, 8 * s, '#e53935');
    text(String(S.points), L.bag.x + L.bag.r * 0.75, L.bag.y - L.bag.r * 0.7, 9 * s, '#fff', 'center', 900, false);
  }

  // panel de la Faille (arriba a la derecha)
  const rx = W - pad, ry = 66 * s;
  text(rift.isDungeon ? `Mazmorra · Piso ${rift.tier}` : rift.isSuper ? 'Súper Jefe' : `Grieta ${rift.n} · ${rift.D.name}`, rx - 150 * s, ry, 13 * s, rift.isSuper ? '#ff5a3d' : rift.D.color, 'left', 900);
  const tcol = rift.time > 30 ? '#efece2' : '#ff8a80';
  text(rift.bossSpawned ? (rift.bossDead ? '✔' : '☠') : fmtTime(rift.time), rx, ry, (rift.bossSpawned ? 15 : 12) * s, rift.bossSpawned ? '#ff7043' : tcol, 'right', 900);
  const pw = 150 * s;
  roundRect(rx - pw, ry + 9 * s, pw, 8 * s, 4 * s, 'rgba(0,0,0,0.6)', '#6f6a5a', 1.5);
  const pk = rift.progress / rift.goal;
  if (pk > 0) roundRect(rx - pw + 1.5, ry + 10.5 * s, (pw - 3) * pk, 5 * s, 3 * s, rift.bossSpawned ? '#ff7043' : '#ffb300');

  // minimapa (radar)
  const mr = 26 * s, mx = rx - mr, my = ry + 44 * s + mr;
  text('☠ ' + rift.kills, rx, ry + 29 * s, 11 * s, '#efece2', 'right', 800);
  text('◆ ' + fmtNum(S.kamas), rx - pw, ry + 29 * s, 11 * s, '#ecd18a', 'left', 900);
  circle(mx, my, mr, 'rgba(10,14,28,0.6)', '#c9b27a', 2);
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
  if (riftEvent && !riftEvent.done && (riftEvent.kind === 'chest' || riftEvent.kind === 'altar')) { const ex = mx + (riftEvent.x - P.x) * ms, ey = my + (riftEvent.y - P.y) * ms; circle(clamp(ex, mx - mr + 5, mx + mr - 5), clamp(ey, my - mr + 5, my + mr - 5), 3.5 * s, RIFT_EVENTS[riftEvent.kind].color, '#fff', 1.5); }
  ctx.restore();
  drawStar(mx, my, 3.5 * s, '#fff');

  // jefe
  if (bossRef && !bossRef.dead) {
    const w = Math.min(W * 0.42, 340 * s), x = W / 2 - w / 2, y = pad + 18 * s;
    text(bossRef.name + ' · niv. ' + bossRef.lvl, W / 2, y - 6 * s, 13 * s, bossRef.enraged ? '#ff5252' : '#ecd18a', 'center', 900);
    roundRect(x, y + 2 * s, w, 12 * s, 6 * s, 'rgba(0,0,0,0.65)', '#c9b27a', 2);
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
    text(banner.text, W / 2, y, Math.min(28 * s * sc, (W * 0.9) / Math.max(8, banner.text.length) * 1.8), banner.color, 'center', 900, true, 'Cinzel, serif');
    if (banner.sub) text(banner.sub, W / 2, y + 26 * s, 12 * s, '#efece2', 'center', 700);
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
    circle(b.x, b.y, b.r, held ? 'rgba(255,220,140,0.55)' : 'rgba(12,16,32,0.6)', color, 3);
    if (cdk > 0) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdk);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fill();
    }
    if (label && typeof label === 'object') ctx.drawImage(label, b.x - b.r * 0.62, b.y - b.r * 0.78, b.r * 1.24, b.r * 1.24);
    else text(label, b.x, b.y - (sub ? 4 * s : 0), b.r * 0.75, '#fff', 'center', 900);
    if (sub) text(sub, b.x, b.y + b.r * 0.5, 10 * s, '#81d4fa', 'center', 900);
    ctx.restore();
  };

  const atkIcon = ATK_ICON[P.cls] || '⚔';
  btn(L.attack, atkIcon, null, '#ecd18a', 0, true, input.attack);
  for (let i = 0; i < 2; i++) {
    const sk = P.C.skills[i];
    const cdk = clamp(P.skillCd[i] / sk.cd, 0, 1);
    btn(L['s' + i], sk.icon, sk.cost + ' EN', '#29b6f6', cdk, P.pa >= sk.cost && cdk <= 0, false);
  }
  const pmk = P.pm >= 1 ? 0 : 1 - (P.pm % 1);
  btn(L.dash, '»', String(Math.floor(P.pm)), '#66bb6a', pmk, P.pm >= 1, false);
  btn(L.pan, UI_ICON.potion || '🧪', String(S.pan), '#7cc457', 0, S.pan > 0, false);
  // definitiva: anillo de carga y brillo cuando está lista
  const uk = clamp((P.ult || 0) / 100, 0, 1), ub = L.ult;
  if (uk >= 1) { ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(now * 6) * 0.2; circle(ub.x, ub.y, ub.r + 7 * s, 'rgba(255,214,110,0.5)'); ctx.restore(); }
  btn(ub, ULTIMATES[P.cls].icon, uk >= 1 ? '¡YA!' : Math.floor(uk * 100) + '%', uk >= 1 ? '#ffd54f' : '#b08a3a', 1 - uk, uk >= 1, false);
}

// ============================================================
// Render
// ============================================================
function renderRift() {
  const B = curBiome();
  const sx = shakeMag > 0 ? rand(-shakeMag, shakeMag) : 0;
  const sy = shakeMag > 0 ? rand(-shakeMag, shakeMag) : 0;
  const zr = zoom * (1 + zoomPunch);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zr, zr);
  // HD-2D: la cámara se ajusta a la rejilla de píxeles para que el pixel art no "tiemble"
  const snap = HD2D.active ? HD2D.pix / zr : 0;
  ctx.translate(snap ? -Math.round((cam.x - sx) / snap) * snap : -cam.x + sx, snap ? -Math.round((cam.y - sy) / snap) * snap : -cam.y + sy);

  const vw = W / zr / 2 + 80, vh = H / zr / 2 + 100;
  const vl = cam.x - vw, vr = cam.x + vw, vt = cam.y - vh, vb = cam.y + vh;
  const inView = (x, y, m = 0) => x > vl - m && x < vr + m && y > vt - m && y < vb + m;

  // suelo pre-renderizado por trozos (una sola copia de imagen por trozo visible)
  const c0x = Math.max(0, Math.floor(vl / CHUNK)), c1x = Math.min(Math.ceil(WORLD.w / CHUNK) - 1, Math.floor(vr / CHUNK));
  const c0y = Math.max(0, Math.floor(vt / CHUNK)), c1y = Math.min(Math.ceil(WORLD.h / CHUNK) - 1, Math.floor(vb / CHUNK));
  for (let cy = c0y; cy <= c1y; cy++) {
    for (let cx = c0x; cx <= c1x; cx++) { const ov = HD2D.active ? 2 : 0.5; ctx.drawImage(groundChunk(cx, cy), cx * CHUNK - ov, cy * CHUNK - ov, CHUNK + ov * 2, CHUNK + ov * 2); }
  }
  ctx.strokeStyle = 'rgb(' + B.ground[2].map((v) => v * 0.4 | 0).join(',') + ')'; ctx.lineWidth = 24;
  ctx.strokeRect(-12, -12, WORLD.w + 24, WORLD.h + 24);

  for (const pl of pools) if (inView(pl.x, pl.y, 80)) drawLavaPool(pl);
  drawDecals();
  for (const h of hazards) if (inView(h.x, h.y, h.r + 40)) drawHazard(h);
  for (const g of glyphs) drawGlyph(g);
  drawVfxState('ground'); drawVfxLayer('ground');
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
  for (const c of corpses) if (inView(c.x, c.y, 60)) drawList.push(c);
  if (riftEvent) drawList.push({ kind: 'riftEvent', y: riftEvent.y });
  for (const m of minions) drawList.push({ kind: 'minion', y: m.kind === 'bomb' ? m.y + 1000 : m.y, m });
  drawList.push(P);
  drawList.sort((a, b) => a.y - b.y);
  for (const o of drawList) {
    if (o === P) { drawGhosts(); drawPlayer(); }
    else if (o.kind === 'riftEvent') drawRiftEvents();
    else if (o.kind === 'minion') drawMinion(o.m);
    else if (o.kind === 'tree') drawTree(o);
    else if (o.kind === 'rock') drawRock(o);
    else if (o.kind === 'pillar') drawPillar(o);
    else if (o.kind === 'crystal') drawCrystal(o);
    else if (o.kind === 'brazier') drawBrazier(o);
    else if (o.ct !== undefined) drawCorpse(o);
    else drawEnemy(o);
  }

  for (const p of projectiles) {
    if (!inView(p.x, p.y)) continue;
    if (p.kind === 'orb') glow(p.x, p.y, 34, '120,200,255', 0.9);
    else if (p.kind === 'explo') glow(p.x, p.y, 30, '255,140,40', 0.9);
    else if (p.kind === 'seed') glow(p.x, p.y, 16, '200,255,80', 0.6);
    else if (p.kind === 'bolt' || p.kind === 'homing') glow(p.x, p.y, p.r * 3.2, '200,110,255', 0.85);
    else if (p.kind === 'web') glow(p.x, p.y, 20, '210,255,190', 0.4);
    drawProjectile(p);
  }
  for (const s of slashes) { drawSlash(s); drawVfxSlash(s); }
  drawVfxLayer('top'); drawVfxState('top');
  drawFlashes();
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
      glow(p.x, p.y, 10, '255,200,120', 0.5 * (1 - a));
    } else if (p.kind === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (p.kind === 'glowdot') {
      glow(p.x, p.y, p.size * (0.6 + a * 0.6), p.rgb, a);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2.5);
    const age = t.max - t.life;
    const pop = age < 0.08 ? 0.6 + age * 12 : age < 0.18 ? 1.56 - (age - 0.08) * 5.6 : 1;
    if (t.crit) {
      glow(t.x, t.y, 30 * t.scale, '255,170,40', 0.55 * Math.min(1, t.life * 3));
      text('¡CRÍTICO!', t.x, t.y - 15 * t.scale * pop, 8 * t.scale, '#fff1b8', 'center', 900);
    }
    text(t.txt, t.x, t.y, 15 * t.scale * pop, t.color, 'center', 900);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  hd2dEndWorld();

  // luz: la escena se oscurece salvo alrededor del héroe y de las fuentes de luz
  const toS = (x, y) => ({ x: (x - cam.x + sx) * zr + W / 2, y: (y - cam.y + sy) * zr + H / 2 });
  const lights = [];
  const ps = toS(P.x, P.y - 20);
  lights.push({ x: ps.x, y: ps.y, r: 480 * zoom, a: 0.9, rgb: '255,236,208' });
  lights.push({ x: ps.x, y: ps.y, r: 820 * zoom, a: 0.28, rgb: '255,226,200' }); // luz de relleno suave
  for (const p of projectiles) if (p.kind !== 'arrow' && p.kind !== 'dagger') { const q = toS(p.x, p.y); lights.push({ x: q.x, y: q.y, r: 90 * zoom, a: 0.8, rgb: p.team === 'p' ? '255,200,140' : '210,140,255' }); }
  for (const g of glyphs) { const q = toS(g.x, g.y); lights.push({ x: q.x, y: q.y, r: g.r * 2 * zoom, a: 0.9, rgb: '255,150,80', haze: 0.25 }); }
  for (const f of flashes) { const q = toS(f.x, f.y); lights.push({ x: q.x, y: q.y, r: f.size * 5 * zoom, a: 0.8, rgb: f.rgb }); }
  for (const k of pickups) if (k.type === 'item' && k.item.rarity >= 2) { const q = toS(k.x, k.y); lights.push({ x: q.x, y: q.y, r: 110 * zoom, a: 0.7, rgb: RARITY_RGB[k.item.rarity] }); }
  for (const e of enemies) if (e.boss || e.elite) { const q = toS(e.x, e.y - e.r); lights.push({ x: q.x, y: q.y, r: e.r * 4 * zoom, a: 0.55, rgb: e.boss ? '255,120,90' : hexRgb(e.elite.color) }); }
  if (rift.zaap) { const q = toS(rift.zaap.x, rift.zaap.y - 40); lights.push({ x: q.x, y: q.y, r: 240 * zoom, a: 1, rgb: '120,200,255', haze: 0.35 }); }
  if (typeof boonLights === 'function') boonLights(lights, toS);
  for (const pl of pillars) { const q = toS(pl.x, pl.y - 40); lights.push({ x: q.x, y: q.y, r: 260 * zoom, a: 1, rgb: '255,220,140', haze: 0.3 }); }
  if (riftEvent && !riftEvent.done && (riftEvent.kind === 'chest' || riftEvent.kind === 'altar')) { const q = toS(riftEvent.x, riftEvent.y - 30); lights.push({ x: q.x, y: q.y, r: 170 * zoom, a: 0.9, rgb: riftEvent.kind === 'chest' ? '255,210,110' : '120,200,255', haze: 0.3 }); }
  for (const m of minions) if (m.kind === 'turret' || m.kind === 'spirit' || m.kind === 'shell') { const q = toS(m.x, m.y - 16); lights.push({ x: q.x, y: q.y, r: 110 * zoom, a: 0.7, rgb: m.kind === 'spirit' ? '140,200,255' : '255,180,90' }); }
  for (const o of obstacles) {
    if ((o.kind !== 'crystal' && o.kind !== 'brazier') || !inView(o.x, o.y, 200)) continue;
    const q = toS(o.x, o.y - 24);
    const fl = o.kind === 'brazier' ? 0.85 + Math.sin(now * 13 + o.ph) * 0.08 + Math.sin(now * 7.3) * 0.05 : 0.75 + Math.sin(now * 2 + o.ph) * 0.12;
    lights.push({ x: q.x, y: q.y, r: (o.kind === 'brazier' ? 230 : 160) * zoom * fl, a: 0.95, rgb: o.kind === 'brazier' ? '255,150,70' : CRYSTAL_COLS[o.hue][3], haze: o.kind === 'brazier' ? 0.35 : 0.25 });
  }
  if (POOL_STYLE[B.pool].light) for (const pl of pools) if (inView(pl.x, pl.y, 200)) { const q = toS(pl.x, pl.y); lights.push({ x: q.x, y: q.y, r: pl.rx * 3 * zoom, a: 0.85, rgb: B.pool === 'lava' ? '255,110,40' : '160,220,255', haze: 0.2 }); }
  for (const h of hazards) if (h.kind === 'fire' || h.kind === 'meteor' || h.kind === 'boom') { const q = toS(h.x, h.y); lights.push({ x: q.x, y: q.y, r: h.r * 2.2 * zoom, a: 0.8, rgb: '255,130,60', haze: 0.2 }); }
  renderLighting(lights, rift && rift.isDungeon ? DUNGEON_LIGHT.ambient : B.ambient, rift && rift.isDungeon ? DUNGEON_LIGHT.shade : B.shade);
  // gradación de color propia de cada mundo
  if (B.tint) { ctx.fillStyle = B.tint; ctx.fillRect(0, 0, W, H); }
  // niebla que se desplaza
  for (const f of fog) {
    f.x += f.vx * 0.016; f.y += f.vy * 0.016;
    if (f.x < -400) f.x = WORLD.w + 400; if (f.x > WORLD.w + 400) f.x = -400;
    const q = toS(f.x, f.y), rr = f.r * zoom;
    if (q.x < -rr || q.x > W + rr || q.y < -rr || q.y > H + rr) continue;
    ctx.globalAlpha = 0.16;
    ctx.drawImage(glowTex(B.fog), q.x - rr, q.y - rr * 0.6, rr * 2, rr * 1.2);
  }
  ctx.globalAlpha = 1;

  // atmósfera: motas flotantes y viñeta
  drawMotes(B.mote);
  drawVignette(P.hp / P.maxHp < 0.3);
  hd2dFlushText();

  if (!window.TRAILER) drawHUD(); // TRAILER: sin interfaz para grabar el video de presentación
}

// césped pintado de Villa Candela (ruido, sin rombos)
const HUB_GROUND = { id: 'hub', ground: [[86, 118, 56], [104, 138, 66], [62, 92, 44]], grain: [170, 200, 120] };
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bg = scene === 'rift' && rift ? 'rgb(' + rift.biome.ground[2].join(',') + ')' : '#3d6b25';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // HD-2D: el mundo va a un búfer pixelado; luces, interfaz y textos se pintan nítidos encima
  if (hd2dBegin()) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
  if (scene === 'rift' && P && rift) renderRift();
  else renderVillage();
  if (HD2D.active) hd2dEndWorld();
  hd2dFlushText();
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
  updateUltimates(dt);
  updateClassKits(dt);
  updateAltarBuff(dt);
  updateHazards(dt);
  updatePickups(dt);
  updateEffects(dt);
  updateFx(dt);
  updateVfx(dt);
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
  } else if (state === 'hub' && scene === 'hub') updateVillage(raw);
  else if (scene === 'hub') villageLife(raw);
  shakeMag = Math.max(0, shakeMag - raw * 40);
  zoomPunch *= Math.exp(-7 * raw);
  render();
  adaptQuality(raw);
  requestAnimationFrame(frame);
}

// Calidad automática: si el móvil no llega a ~50 FPS se van quitando efectos, de uno en uno
function adaptQuality(dt) {
  if ((state !== 'play' && state !== 'hub') || QUALITY.level >= 3) return;
  QUALITY.samples.push(dt);
  QUALITY.checkT += dt;
  if (QUALITY.checkT < 2.5) return;
  const avg = QUALITY.samples.reduce((a, b) => a + b, 0) / QUALITY.samples.length;
  QUALITY.samples = []; QUALITY.checkT = 0;
  if (avg <= 1 / 50) return;
  QUALITY.level++;
  if (QUALITY.level === 1) HD2D.dof = false;
  if (QUALITY.level === 2) { QUALITY.maxDpr = 1; LIGHT.div = 4; resize(); }
  if (QUALITY.level === 3) { HD2D.pixMul = 1.3; resize(); }
}

// Trozo de suelo: textura + manchas + helechos + guijarros, dibujado una vez
const CHUNK = 520;
function groundChunk(cx, cy) {
  const key = cx + ',' + cy;
  let c = groundChunks.get(key);
  if (c) return c;
  const gs = HD2D.on ? zoom / hd2dPixSize() : Math.min(1.4, Math.max(0.8, zoom * DPR));
  c = document.createElement('canvas');
  c.width = c.height = Math.ceil(CHUNK * gs);
  const g = c.getContext('2d', { alpha: false });
  g.scale(gs, gs);
  g.translate(-cx * CHUNK, -cy * CHUNK);
  const B = curBiome();
  // textura de ruido pintada del bioma (a escala 2:1 para que no se note la repetición); la Mazmorra tiene su propio suelo
  const DG = rift && rift.isDungeon && GROUND_IMG.dungeon;
  const tex = biomeGroundTex(DG ? DUNGEON_GROUND : B);
  const pat = g.createPattern(tex, 'repeat');
  if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(tex.patScale || 2.2));
  g.fillStyle = pat;
  g.fillRect(cx * CHUNK, cy * CHUNK, CHUNK, CHUNK);
  const painted = !!tex.painted;
  let seed = (cx * 73856093) ^ (cy * 19349663);
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  // grandes manchas de color (deterministas en coordenadas de mundo para que no haya cortes entre trozos)
  for (let gx = cx - 1; gx <= cx + 1; gx++) {
    for (let gy = cy - 1; gy <= cy + 1; gy++) {
      let s2 = (gx * 92821 + gy * 68917 + 7) | 0;
      const r2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
      for (let i = 0; i < (painted ? 2 : 4); i++) {
        const px = (gx + r2()) * CHUNK, py = (gy + r2()) * CHUNK, pr = 120 + r2() * 200;
        const gr = g.createRadialGradient(px, py, 0, px, py, pr);
        const col = (DG ? DUNGEON_GROUND : B).patch[i % 2];
        gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
        g.fillStyle = gr;
        g.beginPath(); g.ellipse(px, py, pr, pr * 0.6, 0, 0, TAU); g.fill();
      }
    }
  }
  if (typeof riftPatches === 'function') riftPatches(g, cx, cy, DG ? DUNGEON_GROUND : B); // manchas de suelo (look.js)
  for (let i = 0; i < (painted ? 0 : 500); i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.12)' : `rgba(${B.grain.join(',')},0.08)`;
    const sz = 1 + rnd() * 2;
    g.fillRect(cx * CHUNK + rnd() * CHUNK, cy * CHUNK + rnd() * CHUNK, sz, sz);
  }
  const saved = ctx;
  ctx = g;
  try {
    for (const d of decos) {
      if (d.x < cx * CHUNK - 40 || d.x > (cx + 1) * CHUNK + 40 || d.y < cy * CHUNK - 40 || d.y > (cy + 1) * CHUNK + 40) continue;
      if (painted && (d.kind === 'blotch' || d.kind === 'pebble')) continue; // la textura pintada ya los trae
      if (DG) { drawPropDeco(d); continue; }
      if (drawPropDeco(d)) continue;
      if (drawBiomeDeco(d)) continue;
      if (d.kind === 'fern') drawFern(d);
      else if (d.kind === 'blotch') {
        // mancha suave (sin bordes duros)
        const gr = g.createRadialGradient(d.x, d.y, 0, d.x, d.y, 30 * d.s);
        gr.addColorStop(0, B.patch[1]); gr.addColorStop(1, B.patch[1].replace(/[\d.]+\)$/, '0)'));
        g.fillStyle = gr;
        g.beginPath(); g.ellipse(d.x, d.y, 30 * d.s, 15 * d.s, 0, 0, TAU); g.fill();
      }
      else if (d.kind === 'bones') drawBones(d);
      else if (d.kind === 'grass') drawGrassTuft(d);
      else if (d.kind === 'crackline') drawCrackLine(d);
      else ellipse(d.x, d.y, 3 * d.s, 2 * d.s, d.c);
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
    vignetteCache = { dark: mk('rgba(6,4,16,0.72)'), red: mk('rgba(170,0,0,0.6)') };
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
const overlays = ['title', 'start', 'menu', 'hub', 'map', 'inv', 'shop', 'quests', 'dungeon', 'pause', 'end', 'dead'];
function showOverlay(id) {
  for (const o of overlays) $(o).classList.toggle('show', o === id);
}

// ---------- Menú de personajes ----------
function buildMenu() {
  const list = $('classList');
  list.innerHTML = '';
  if (!selectedClass) selectedClass = 'iop';
  for (const id of Object.keys(CLASSES)) {
    const C = CLASSES[id], slot = SAVE.slots[id];
    const art = heroArt(id);
    const b = document.createElement('button');
    b.className = selectedClass === id ? 'on' : '';
    b.innerHTML = `${art ? `<img src="${art.url}" alt="">` : ''}<span>${C.name}<small>${slot ? `Nivel ${slot.level}` : C.role}</small></span>`;
    b.addEventListener('click', () => { SFX.init(); SFX.play('click'); selectedClass = id; confirmNew = false; buildMenu(); });
    list.appendChild(b);
  }
  showClassInfo(selectedClass);
}

function showClassInfo(id) {
  const C = CLASSES[id], L = CLASS_LORE[id], slot = SAVE.slots[id];
  const art = heroArt(id);
  const img = $('hsArt');
  if (art) { img.src = art.url; img.style.display = ''; img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; } else img.style.display = 'none';
  const bar = (n) => `<span class="bar">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= n ? 'f' : ''}"></i>`).join('')}</span>`;
  $('hsInfo').innerHTML = `
    <h3>${C.name}</h3>
    <div class="ep">${L.hero}, ${L.epithet} · ${C.role} · Dificultad ${'★'.repeat(L.difficulty)}${'☆'.repeat(3 - L.difficulty)}</div>
    ${slot ? `<span class="hs-save">Partida guardada · nivel ${slot.level}</span>` : ''}
    <p class="sum">${L.summary}</p>
    <p class="hs-story">${L.story}</p>
    <p class="ps">${L.playstyle}</p>
    <div class="hs-stats">${Object.entries(L.stats).map(([k, v]) => `<span>${k}</span>${bar(v)}`).join('')}</div>
    <div class="hs-skills">${C.skills.map((sk) => `<div><b>${sk.icon} ${sk.name}</b> <span>· ${sk.cost} energía — ${sk.desc}</span></div>`).join('')}<div><b>${ULTIMATES[id].icon} ${ULTIMATES[id].name}</b> <span>· definitiva — ${ULTIMATES[id].desc}</span></div></div>`;
  $('btnStart').disabled = false;
  $('btnStart').textContent = slot ? (menuMode === 'new' ? `Empezar de nuevo con ${C.name}` : `Continuar con ${C.name}`) : `Comenzar con ${C.name}`;
}

function goHub() {
  scene = 'hub';
  state = 'hub';
  rift = null; bossRef = null;
  enemies = []; projectiles = []; pickups = []; glyphs = []; hazards = []; corpses = []; ghosts = [];
  createPlayer();
  villageReset();
  MUSIC.setDuck(1);
  MUSIC.play('village');
  clearInput();
  persist();
  buildHub();
  showOverlay('hub');
}

function buildHub() {
  const C = CLASSES[S.cls];
  const nx = xpNext(S.level);
  const face = typeof heroFaceURL === 'function' ? heroFaceURL(S.cls, 1.3) : null;
  const boosts = Object.keys(ELIXIRS).filter((k) => S.boosts[k] > 0);
  $('hubChar').innerHTML = `
    <div class="hc-face" style="${face ? `background-image:url(${face})` : ''}"><b>${S.level}</b></div>
    <div class="hc-main">
      <div class="hc-name">${C.name}${transRank() ? ` <i>✦${transRank()}</i>` : ''}<span class="hc-gems">${S.gemSlots.map((k) => k && typeof gemImg === 'function' ? `<span class="hgem" title="${GEMS[k].name}: ${GEMS[k].desc}">${gemImg(k, 16)}</span>` : `<span class="egg ${k ? 'got' : ''}" style="--c:${k ? GEMS[k].color : '#3a4668'}" title="${k ? GEMS[k].name + ': ' + GEMS[k].desc : 'Hueco de gema libre'}"></span>`).join('')}</span></div>
      <div class="xpbar"><div style="width:${Math.min(100, (S.xp / nx) * 100)}%"></div></div>
      <div class="hc-res"><span>${AMBER_SVG}${fmtNum(S.kamas)}</span><span>${SEAL_SVG}${fmtNum(seals())}</span><span>🧪${S.pan}/${panMax()}</span><span>🎒${S.bag.length}/${bagMax()}</span>${boosts.length ? `<span title="Elixires para la próxima Grieta: ${boosts.map((k) => ELIXIRS[k].name).join(', ')}" style="color:${ELIXIRS[boosts[0]].hi}">⚗${boosts.length}</span>` : ''}</div>
    </div>`;
  const sel = mapSel();
  const fb = BIOMES[sel.b], rec = recLevel(sel.b, sel.n, sel.d), DF = DIFFS[sel.n === 'S' ? 2 : sel.d];
  $('fLabel').innerHTML = (sel.n === 'S' ? `☠ ${SUPER_BOSSES[fb.id].name}` : `Grieta ${sel.n} · <span style="color:${DF.color}">${DF.name}</span>`) +
    `<small>${fb.name} · Recomendado nivel ${rec}</small>` +
    (S.level + 2 < rec ? `<small class="warn">⚠ Tu nivel (${S.level}) es bajo para esta Grieta</small>` : '');
  $('btnInv').innerHTML = '<img src="img/ui/bag.png" alt=""><span>Personaje</span>' + (S.points > 0 ? `<i class="badge">${S.points}</i>` : '');
  updateHubPrompt();
}

$('btnStart').addEventListener('click', () => {
  if (!selectedClass) return;
  // "Nuevo juego" sobre un héroe con partida: pide confirmación antes de borrarla
  if (menuMode === 'new' && SAVE.slots[selectedClass]) {
    if (!confirmNew) { confirmNew = true; $('btnStart').textContent = `¿Seguro? Se perderá el progreso de ${CLASSES[selectedClass].name} · Pulsa otra vez`; SFX.play('hurt'); return; }
    SAVE.slots[selectedClass] = null;
  }
  confirmNew = false;
  if (!SAVE.slots[selectedClass]) SAVE.slots[selectedClass] = newSlot(selectedClass);
  SAVE.last = selectedClass;
  S = migrateSlot(SAVE.slots[selectedClass]);
  goHub();
});
$('btnMap').addEventListener('click', () => openMap());
$('btnMapClose').addEventListener('click', () => closeMap());
$('btnPortalGo').addEventListener('click', () => villageInteract('portal'));
$('hubPrompt').addEventListener('click', () => villageInteract(vNear));
// Botón contextual de la villa: hablar con un vecino o cruzar el Portal
// junto a un vecino: botón para hablar; junto al Portal: panel para elegir Grieta y entrar
function updateHubPrompt() {
  const b = $('hubPrompt'), pp = $('portalPanel');
  if (!b || !S) return;
  const atPortal = vNear === 'portal';
  pp.classList.toggle('show', atPortal);
  $('hubHint').classList.toggle('hide', !!vNear);
  if (atPortal) {
    const s2 = mapSel();
    $('btnPortalGo').textContent = s2.n === 'S' ? '☠ Desafiar' : '⚔ Entrar';
  }
  if (!vNear || atPortal) { b.classList.remove('show'); return; }
  b.textContent = vNear.prompt;
  b.classList.add('show');
}

// ---------- Mapa de Grietas ----------
const MAP_POS = [[9, 72], [21, 40], [33, 68], [45, 34], [57, 66], [68, 34], [79, 64], [91, 38]];
let mapView = 0; // bioma que se está mirando
// Selección guardada, corregida si apunta a algo bloqueado
function mapSel() {
  const m = mapProg();
  let { b, n, d } = m.sel;
  if (!biomeUnlocked(b)) b = 0;
  if (!nodeUnlocked(b, n)) n = 1;
  if (!diffUnlocked(b, n, d)) d = 0;
  m.sel = { b, n, d };
  return m.sel;
}
// Tras vencer, el mapa apunta a lo siguiente por hacer
function autoAdvance() {
  const m = mapProg();
  const { b, n } = rift;
  if (n === 'S') { if (b + 1 < BIOMES.length) m.sel = { b: b + 1, n: 1, d: 0 }; }
  else if (n < LEVELS_PER_BIOME) m.sel = { b, n: n + 1, d: 0 };
  else m.sel = { b, n: 'S', d: 0 };
}
const MAP_BG = new Map();
function mapBackground(B) {
  if (MAP_BG.has(B.id)) return MAP_BG.get(B.id);
  const c = document.createElement('canvas');
  c.width = 900; c.height = 420;
  const g = c.getContext('2d');
  const pat = g.createPattern(biomeGroundTex(B), 'repeat');
  if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1.6));
  g.fillStyle = pat; g.fillRect(0, 0, 900, 420);
  let seed = B.id.length * 777;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 10; i++) {
    const x = rnd() * 900, y = rnd() * 420, r = 80 + rnd() * 160, col = B.patch[i % 2];
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const st = POOL_STYLE[B.pool];
  const saved = ctx;
  ctx = g;
  try {
    for (let i = 0; i < 6; i++) {
      const x = rnd() * 900, y = 60 + rnd() * 320, rx = 30 + rnd() * 40;
      const gr = g.createRadialGradient(x, y, 2, x, y, rx);
      gr.addColorStop(0, st.stops[0]); gr.addColorStop(0.4, st.stops[1]); gr.addColorStop(0.8, st.stops[2]); gr.addColorStop(1, st.stops[3]);
      g.fillStyle = st.rim; g.beginPath(); g.ellipse(x, y, rx + 5, rx * 0.45 + 4, 0, 0, TAU); g.fill();
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, rx * 0.45, 0, 0, TAU); g.fill();
    }
    const trees = [];
    for (let i = 0; i < 46; i++) trees.push([rnd() * 900, rnd() * 440, 0.55 + rnd() * 0.4]);
    trees.sort((a, b) => a[1] - b[1]);
    for (const [x, y, sc] of trees) {
      g.save(); g.translate(x, y); g.scale(sc, sc);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, 2, 22, 8, 0, 0, TAU); g.fill();
      treeArt(B.tree, rnd() < 0.5 ? 1 : 0, 0);
      g.restore();
    }
  } finally { ctx = saved; }
  const v = g.createRadialGradient(450, 210, 120, 450, 210, 520);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = v; g.fillRect(0, 0, 900, 420);
  const url = c.toDataURL('image/jpeg', 0.85);
  MAP_BG.set(B.id, url);
  return url;
}
function openMap() {
  mapView = mapSel().b;
  buildMap();
  state = 'map';
  showOverlay('map');
  SFX.play('click');
}
function closeMap() {
  state = 'hub';
  buildHub();
  showOverlay('hub');
}
function buildMap() {
  const sel = mapSel();
  const b = mapView, B = BIOMES[b];
  $('mapTabs').innerHTML = BIOMES.map((x, i) => `<button data-b="${i}" class="${i === b ? 'on' : ''} ${biomeUnlocked(i) ? '' : 'lock'}">${biomeUnlocked(i) ? '' : '🔒 '}${x.name}</button>`).join('');
  const nodes = [];
  for (let i = 1; i <= LEVELS_PER_BIOME + 1; i++) nodes.push(i > LEVELS_PER_BIOME ? 'S' : i);
  const pts = MAP_POS;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    d += ` C${x0 + (x1 - x0) * 0.5},${y0} ${x0 + (x1 - x0) * 0.5},${y1} ${x1},${y1}`;
  }
  const html = [`<svg class="mf-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="${d}" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="11" vector-effect="non-scaling-stroke" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#e8c88a" stroke-width="4" stroke-dasharray="2 9" vector-effect="non-scaling-stroke" stroke-linecap="round"/>
    </svg>`, `<div class="mf-title">${B.name}</div>`];
  nodes.forEach((n, i) => {
    const un = nodeUnlocked(b, n), cd = clearedDiffs(b, n), isS = n === 'S';
    const on = sel.b === b && sel.n === n;
    const pips = isS ? '' : `<span class="pips">${DIFFS.map((D, k) => `<i style="${cd > k ? `background:${D.color};border-color:${D.color}` : ''}"></i>`).join('')}</span>`;
    html.push(`<button class="mnode ${isS ? 'boss' : ''} ${un ? '' : 'lock'} ${on ? 'sel' : ''} ${isS && cd ? 'done' : ''}" data-n="${n}" style="left:${pts[i][0]}%;top:${pts[i][1]}%">${un ? (isS ? '☠' : n) : '🔒'}${pips}</button>`);
  });
  const cnt = setCounts()[B.id] || 0;
  html.push(`<div class="mf-set" style="color:${SETS[B.id].color}">Conjunto ${SETS[B.id].name}: ${cnt}/${SLOTS.length} equipadas</div>`);
  const field = $('mapField');
  field.style.setProperty('--mbg', `rgb(${B.ground[2].join(',')})`);
  field.style.backgroundImage = `url(${mapBackground(B)})`;
  field.style.backgroundSize = 'cover';
  field.innerHTML = html.join('');
  buildMapInfo();
}
function buildMapInfo() {
  const sel = mapSel(), b = mapView, B = BIOMES[b];
  const box = $('mapInfo');
  if (!biomeUnlocked(b)) {
    box.innerHTML = `<h3>${B.name}</h3><div class="mi-lock">🔒 Derrota al Súper Jefe de ${BIOMES[b - 1].name} para abrir este mundo.</div>`;
    return;
  }
  if (sel.b !== b) { box.innerHTML = `<h3>${B.name}</h3><div class="mi-sub">Elige una Grieta en el mapa.</div>`; return; }
  const n = sel.n, isS = n === 'S', d = isS ? 2 : sel.d, DF = DIFFS[d], SD = SETS[B.id];
  const L = globalLevel(b, n), rec = recLevel(b, n, isS ? 2 : sel.d);
  const mlo = 1 + (L - 1) * 2 + DF.lvl;
  const boss = isS ? SUPER_BOSSES[B.id].name : ENEMIES[B.boss].name;
  const setCh = isS ? 100 : Math.round(DF.set * 100);
  const cnt = setCounts()[B.id] || 0;
  const diffs = isS ? '' : `<div class="diffs">${DIFFS.map((D, k) => {
    const un = diffUnlocked(b, n, k), done = clearedDiffs(b, n) > k;
    return `<button data-d="${k}" style="--dc:${D.color}" class="${k === d ? 'on' : ''}" ${un ? '' : 'disabled'}>${un ? '' : '🔒 '}${D.name}${done ? ' <span class="ck">✔</span>' : ''}</button>`;
  }).join('')}</div>`;
  box.innerHTML = `
    <h3>${isS ? '☠ Súper Jefe' : 'Grieta ' + n}</h3>
    <div class="mi-sub">${B.name}${isS ? '' : ` · <b style="color:${DF.color}">${DF.name}</b>`}</div>
    ${diffs}
    ${!isS && clearedDiffs(b, n) < 2 ? `<div class="mi-sub">Supera una dificultad para desbloquear la siguiente.</div>` : ''}
    <div class="mi-gl">Gemas que puedes conseguir aquí</div>
    <div class="mi-gems">${gemsFor(B.id, isS).map((k) => `<span class="${S.dofus.includes(k) ? 'have' : ''}" style="--c:${GEMS[k].color}" title="${GEMS[k].desc}">${gemImg(k, 26)}<b>${GEMS[k].name}</b><small>${S.dofus.includes(k) ? '✔ ya la tienes' : GEMS[k].desc}</small></span>`).join('')}</div>
    <div class="mi-rows">
      <span>Monstruos</span><b>nivel ${mlo}–${mlo + 4}</b>
      <span>Recomendado</span><b class="${S.level + 2 < rec ? 'bad' : ''}">nivel ${rec}+ (tú ${S.level})</b>
      <span>${isS ? 'Súper Jefe' : 'Guardián'}</span><b>${boss}</b>
      <span>Pensada para equipo</span><b>${['<span style="color:' + RARITY[0].color + '">Común</span>', '<span style="color:' + RARITY[1].color + '">Raro</span> o mejor', '<span style="color:' + RARITY[3].color + '">Legendario</span>'][d]}</b>
      <span>Ámbar y XP</span><b>×${DF.reward}</b>
      <span>Calidad del botín</span><b>${rarityRangeText(DF)}</b>
      <span>Pieza de conjunto</span><b style="color:${SD.color}">${setCh}%${isS ? ' (+50%)' : ''}</b>
      <span>Gema Ancestral</span><b>${Math.round(gemChance(L, d, isS) * 100)}% si te falta alguna</b>
    </div>

    <div class="mi-set" style="--sc:${SD.color}"><div class="t">Conjunto ${SD.name} (${cnt}/${SLOTS.length})</div>
      ${[2, 4, 6].map((k) => `<div class="${cnt >= k ? 'on' : 'off'}">${k} piezas: ${setBonusLine(SD.bonus[k])}</div>`).join('')}</div>
    <button id="btnMapGo" class="btn big">${isS ? '☠ Desafiar al Súper Jefe' : '🌀 Entrar en la Grieta'}</button>`;
}
$('mapTabs').addEventListener('click', (ev) => {
  const t = ev.target.closest('button[data-b]');
  if (!t) return;
  mapView = +t.dataset.b;
  SFX.play('click');
  buildMap();
});
$('mapField').addEventListener('click', (ev) => {
  const t = ev.target.closest('.mnode');
  if (!t || t.classList.contains('lock')) return;
  const n = t.dataset.n === 'S' ? 'S' : +t.dataset.n;
  const m = mapProg();
  // al cambiar de Grieta se propone la dificultad más alta disponible
  const best = n === 'S' ? 0 : Math.min(2, clearedDiffs(mapView, n));
  m.sel = { b: mapView, n, d: m.sel.b === mapView && m.sel.n === n ? m.sel.d : best };
  SFX.play('click');
  buildMap();
});
$('mapInfo').addEventListener('click', (ev) => {
  const db = ev.target.closest('button[data-d]');
  if (db && !db.disabled) { mapProg().sel.d = +db.dataset.d; SFX.play('click'); buildMap(); return; }
  if (ev.target.closest('#btnMapGo')) { const s2 = mapSel(); persist(); startNode(s2.b, s2.n, s2.d); }
});
$('btnInv').addEventListener('click', () => openInventory('hub'));
$('btnChange').addEventListener('click', () => { persist(); S = null; openClassMenu('switch'); });

// ---------- Inventario / características ----------
let invSel = null; // objeto abierto en la ficha: {from:'bag'|'equip', idx|slot}
let invTab = 'all';
let invPrev = null; // valores anteriores, para animar lo que sube

const fmtNum = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const AMBER_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 L14 6 L11.5 15 L4.5 15 L2 6 Z" fill="#f0a030" stroke="#7a4a10" stroke-width="1.2"/></svg>';
const SLOT_POS = {
  arma: 'left: 8px; top: 8px', sombrero: 'left: 8px; top: 66px', amuleto: 'left: 8px; top: 124px', anillo: 'left: 8px; top: 182px',
  capa: 'right: 8px; top: 8px', cinturon: 'right: 8px; top: 66px', botas: 'right: 8px; top: 124px',
};
const BAG_TABS = [['all', 'Todo'], ['weapon', 'Armas'], ['armor', 'Ropa'], ['jewel', 'Joyas']];
const tabMatch = (tab, it) => tab === 'all' || (tab === 'weapon' ? it.slot === 'arma' : tab === 'jewel' ? it.slot === 'amuleto' || it.slot === 'anillo' : it.slot !== 'arma' && it.slot !== 'amuleto' && it.slot !== 'anillo');

// ---------- Gemas Ancestrales ----------
const gemOn = (k) => !!(S && S.gemSlots && S.gemSlots.includes(k));
const gemChance = (level, d, isSuper) => (isSuper ? 0.6 : Math.min(0.6, 0.15 + level * 0.01 + d * 0.1));
let gemSel = 0; // hueco que se está cambiando
function openGems(slot) {
  if (slot !== undefined) gemSel = slot;
  const card = $('itemCard');
  const where = (k) => (GEMS[k].src === 'super' ? 'cualquier Súper Jefe' : 'el Guardián de ' + BIOMES.find((b) => b.id === GEMS[k].src).name);
  card.innerHTML = `<div class="gem-panel" role="dialog">
    <header><b>Gemas Ancestrales</b><span>${S.dofus.length}/${Object.keys(GEMS).length}</span><button class="sh-close" id="gpClose">✕</button></header>
    <p class="gp-help">Engarza hasta ${S.gemSlots.length} gemas: solo las engarzadas dan su bonus y puedes cambiarlas cuando quieras. Se consiguen al vencer al Guardián del mundo de cada gema (mira en el mapa la probabilidad).</p>
    <div class="gp-slots">${S.gemSlots.map((k, i) => `<button data-gs="${i}" class="${i === gemSel ? 'on' : ''}" style="--c:${k ? GEMS[k].color : '#3a4668'}">${k ? gemImg(k, 26) + '<small>' + GEMS[k].name + '</small>' : '<small>Hueco libre</small>'}</button>`).join('')}</div>
    <div class="gp-list">${Object.keys(GEMS).map((k) => {
      const own = S.dofus.includes(k), on = S.gemSlots.includes(k);
      return `<div class="gp-gem ${own ? '' : 'locked'} ${on ? 'on' : ''}" style="--c:${GEMS[k].color}">
        ${gemImg(k, 34, own)}
        <div><b>${GEMS[k].name}</b><span>${GEMS[k].desc}</span><small>${own ? (on ? 'Engarzada' : 'En tu colección') : 'Se consigue con ' + where(k)}</small></div>
        ${own ? `<button data-g="${k}" class="btn">${on ? 'Quitar' : 'Engarzar'}</button>` : ''}
      </div>`;
    }).join('')}</div></div>`;
  card.classList.add('show');
  card.onclick = (e) => { if (e.target === card) closeGems(); };
  $('gpClose').onclick = closeGems;
  for (const b of card.querySelectorAll('.gp-slots button')) b.onclick = () => { gemSel = +b.dataset.gs; SFX.play('click'); openGems(); };
  for (const b of card.querySelectorAll('button[data-g]')) b.onclick = () => {
    const k = b.dataset.g, i = S.gemSlots.indexOf(k);
    if (i >= 0) S.gemSlots[i] = null;
    else {
      const free = S.gemSlots.indexOf(null);
      S.gemSlots[S.gemSlots[gemSel] === null || free < 0 ? gemSel : free] = k;
    }
    recalc(); persist(); SFX.play(i >= 0 ? 'click' : 'legend');
    openGems();
  };
}
function closeGems() { $('itemCard').classList.remove('show'); buildInventory(); }

function powerScore(d) {
  return Math.round(d.maxHp * 0.6 + d.power * d.dmgMul * 8 + d.crit * 400 + d.armor * 600 + d.atkSpeed * 60 + (d.skillMul - 1) * 200);
}
function derivedRows(d) {
  return [
    ['hp', 'PV', d.maxHp, '#ff8a80', String(d.maxHp)],
    ['dmg', 'Daño', Math.round((d.dmgMul - 1) * 100), '#f0b070', '+' + Math.round((d.dmgMul - 1) * 100) + '%'],
    ['crit', 'Crítico', Math.round(d.crit * 100), '#ffc04a', Math.round(d.crit * 100) + '%'],
    ['spell', 'Hechizos', Math.round((d.skillMul - 1) * 100), '#ffa070', '+' + Math.round((d.skillMul - 1) * 100) + '%'],
    ['aspd', 'Vel. ataque', Math.round(d.atkSpeed * 100), '#a0e890', d.atkSpeed.toFixed(2)],
    ['res', 'Resist.', Math.round(d.armor * 100), '#9fb6c8', Math.round(d.armor * 100) + '%'],
  ];
}

function openInventory(from) {
  if (from === 'play' && state !== 'play') return;
  invReturn = from === 'play' ? 'play' : from === 'pause' ? 'pause' : 'hub';
  state = 'inv';
  clearInput();
  invSel = null;
  invPrev = null;
  $('itemCard').classList.remove('show');
  buildInventory();
  showOverlay('inv');
}
function closeInventory() {
  $('itemCard').classList.remove('show');
  persist();
  if (invReturn === 'hub') { state = 'hub'; buildHub(); showOverlay('hub'); }
  else if (invReturn === 'pause') { state = 'pause'; buildPause(); showOverlay('pause'); }
  else { state = 'play'; last = performance.now(); showOverlay(null); }
}

let heroDollURL = {};
function heroDollHTML() {
  const art = heroArt(S.cls);
  if (art) return `<img class="hero${art.px ? ' px' : ''}" src="${art.url}" alt="">`;
  if (!heroDollURL[S.cls]) {
    const c = document.createElement('canvas');
    c.width = 180; c.height = 260;
    const g = c.getContext('2d');
    g.translate(90, 236); g.scale(3.6, 3.6);
    drawHero(g, S.cls, { x: 0, y: 0, dir: 0.3, walkT: 0, moving: false, swing: 0, swingSide: 1, shot: 0, t: 0 });
    heroDollURL[S.cls] = c.toDataURL();
  }
  return `<img class="hero" src="${heroDollURL[S.cls]}" alt="">`;
}

function slotHTML(slot, style, size = 40) {
  const it = S.equip[slot];
  return `<button class="slot ${it ? 'r' + it.rarity : ''}" data-slot="${slot}" style="${style}" aria-label="${SLOT_INFO[slot].name}">${it ? itemSVG(it, size) : slotSVG(slot, size - 4)}</button>`;
}

function floater(el, txt) {
  if (!el) return;
  const f = document.createElement('span');
  f.className = 'floater';
  f.textContent = txt;
  el.appendChild(f);
  setTimeout(() => f.remove(), 950);
}

function buildInventory(justEquipped) {
  const d = derived();
  const t = d.t;
  const pw = powerScore(d);
  const prev = invPrev;
  invPrev = { t: { ...t }, rows: Object.fromEntries(derivedRows(d).map((r) => [r[0], r[2]])), power: pw };
  const C = CLASSES[S.cls];

  // cabecera
  $('shName').textContent = C.name;
  $('shLevel').textContent = 'Nv. ' + S.level;
  $('shXp').style.width = Math.min(100, (S.xp / xpNext(S.level)) * 100) + '%';
  $('shPower').innerHTML = statIcon('dmg', 18) + ' Poder ' + fmtNum(pw);
  $('shAmber').innerHTML = AMBER_SVG + ' ' + fmtNum(S.kamas);

  // muñeco con las ranuras de equipo
  let best = -1;
  for (const s of SLOTS) if (S.equip[s]) best = Math.max(best, S.equip[s].rarity);
  const aura = best >= 0 ? `rgba(${RARITY_RGB[best]},.6)` : 'rgba(255,170,60,.45)';
  $('shDoll').innerHTML = `
    <div class="pedestal" style="--aura:${aura}"></div>
    ${heroDollHTML()}
    ${Object.keys(SLOT_POS).map((s) => slotHTML(s, SLOT_POS[s])).join('')}
    <div class="bottom">
      <button class="gems-label" id="btnGems">GEMAS ${S.dofus.length}/${Object.keys(GEMS).length}</button>
      ${S.gemSlots.map((k, i) => k
        ? `<button class="gem got" data-gs="${i}" style="--c:${GEMS[k].color}" title="${GEMS[k].name}: ${GEMS[k].desc}">${gemImg(k, 22)}</button>`
        : `<button class="gem" data-gs="${i}" title="Hueco libre: toca para engarzar una gema">+</button>`).join('')}
    </div>`;
  $('btnGems').onclick = () => openGems();
  for (const el of $('shDoll').querySelectorAll('.gem')) el.onclick = () => openGems(+el.dataset.gs);
  for (const el of $('shDoll').querySelectorAll('.slot')) {
    el.addEventListener('click', () => { if (S.equip[el.dataset.slot]) { SFX.play('click'); showItemCard('equip', el.dataset.slot); } });
  }
  if (justEquipped) {
    const el = $('shDoll').querySelector(`.slot[data-slot="${justEquipped}"]`);
    if (el) el.classList.add('new');
    const hero = $('shDoll').querySelector('.hero');
    if (hero) hero.classList.add('flash');
  }

  // botón de equipamiento rápido: avisa cuántas mejoras hay en la bolsa
  { const n = bestGearPlan().changes.length, b = $('btnAutoEquip'); if (b) { b.textContent = n ? `⚡ Equipar lo mejor (${n})` : '⚡ Equipar lo mejor'; b.classList.toggle('ready', n > 0); } }

  // características
  const pts = $('shPoints');
  pts.textContent = S.points > 0 ? S.points + ' pts' : 'Nv. ' + S.level;
  pts.classList.toggle('none', S.points <= 0);
  $('shStatRows').innerHTML = CORE_STATS.map((k) => {
    const base = S.stats[k], bonus = t[k] - base, col = STAT_COLOR[k];
    const rec = (STAT_REC[S.cls] || []).includes(k);
    return `<div class="stat" data-k="${k}" style="background:${col}14">
      ${statIcon(k)}<span class="nm">${STAT_INFO[k].name}${rec ? '<i class="rec" title="Recomendada para tu clase">★</i>' : ''}<small class="eff">Da <b style="color:${col};font-size:10.5px">${STAT_HELP[k].now(t)}</b></small></span>
      <b style="color:${col}">${base}${bonus ? ` <small>+${bonus}</small>` : ''}</b>
      <button class="plus" data-stat="${k}" ${S.points < 1 ? 'disabled' : ''} aria-label="Subir ${STAT_INFO[k].name}">+</button>
    </div>`;
  }).join('');
  for (const b of $('shStatRows').querySelectorAll('.plus')) bindStatButton(b);
  $('shDerived').innerHTML = derivedRows(d).map(([k, name, , col, txt]) => `<span data-k="${k}">${name} <b style="color:${col}">${txt}</b></span>`).join('');

  if (!$('shHelpBtn')) {
    const h2 = document.querySelector('.sh-sub h2');
    h2.insertAdjacentHTML('beforeend', '<button id="shHelpBtn" class="sh-help" aria-label="¿Qué hace cada característica?">?</button>');
    $('shHelpBtn').addEventListener('click', showStatHelp);
  }

  // animar lo que ha subido
  if (prev) {
    for (const k of CORE_STATS) {
      const diff = t[k] - prev.t[k];
      if (diff > 0) {
        const row = $('shStatRows').querySelector(`.stat[data-k="${k}"]`);
        row.classList.add('up');
        floater(row, '+' + diff);
      }
    }
    for (const [k, , v] of derivedRows(d)) {
      if (v > prev.rows[k]) {
        const el = $('shDerived').querySelector(`span[data-k="${k}"]`);
        el.classList.add('up');
      }
    }
    if (pw > prev.power) {
      const el = $('shPower');
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
  }

  // bolsa
  $('shTabs').innerHTML = BAG_TABS.map(([id, label]) => `<button data-tab="${id}" class="${invTab === id ? 'on' : ''}">${label}</button>`).join('') + `<span class="count">${S.bag.length}/${bagMax()}</span>`;
  for (const b of $('shTabs').querySelectorAll('button')) b.addEventListener('click', () => { invTab = b.dataset.tab; SFX.play('click'); buildInventory(); });
  const cells = [];
  S.bag.forEach((it, i) => {
    if (!tabMatch(invTab, it)) return;
    const better = itemPower(it) > itemPower(S.equip[it.slot]);
    cells.push(`<button class="cell r${it.rarity}${it.set ? ' set' : ''}" ${it.set ? `style="--sc:${SETS[it.set].color}"` : ''} data-i="${i}" aria-label="${it.name}">${itemSVG(it, 36)}${better ? '<i class="up">▲</i>' : ''}</button>`);
  });
  const fill = invTab === 'all' ? bagMax() - S.bag.length : Math.max(0, 10 - cells.length);
  for (let i = 0; i < fill; i++) cells.push('<div class="cell empty"></div>');
  $('bagGrid').innerHTML = cells.join('');
  for (const el of $('bagGrid').querySelectorAll('button.cell')) {
    el.addEventListener('click', () => { SFX.play('click'); showItemCard('bag', +el.dataset.i); });
  }
}

function iconSVGColor(color, size) {
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><path d="M24 4 L38 16 L33 40 L15 40 L10 16 Z" fill="${color}" stroke="#2a1a0c" stroke-width="2"/><path d="M24 4 L38 16 L24 20 L10 16 Z" fill="#fff" opacity="0.5"/></svg>`;
}

// Botón "+" de característica: toque = +1, mantener = sube seguido
function bindStatButton(b) {
  let hold = null, rep = null;
  const addOne = () => {
    if (S.points < 1) return stop();
    S.stats[b.dataset.stat] += 1;
    S.points -= 1;
    recalc();
    SFX.play('click');
    buildInventory();
  };
  const stop = () => { clearTimeout(hold); clearInterval(rep); hold = rep = null; };
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    addOne();
    hold = setTimeout(() => {
      rep = setInterval(() => {
        const nb = $('shStatRows').querySelector(`.plus[data-stat="${b.dataset.stat}"]`);
        if (!nb || S.points < 1) return stop();
        S.stats[b.dataset.stat] += 1; S.points -= 1; recalc(); buildInventory();
      }, 90);
    }, 420);
    window.addEventListener('pointerup', stop, { once: true });
  });
}

function showItemCard(from, key) {
  const it = from === 'bag' ? S.bag[key] : S.equip[key];
  if (!it) return;
  invSel = from === 'bag' ? { from, idx: key } : { from, slot: key };
  const R = RARITY[it.rarity];
  const rgb = RARITY_RGB[it.rarity];
  const eq = from === 'bag' ? S.equip[it.slot] : null;
  const keys = ['dmg', ...CORE_STATS, 'crit', 'res', 'pros'].filter((k) => (it.stats[k] || 0) || (eq && eq.stats[k]));
  const lines = keys.map((k) => {
    const v = it.stats[k] || 0;
    let cmp = '';
    if (eq) {
      const dlt = v - (eq.stats[k] || 0);
      if (dlt) cmp = `<em class="${dlt > 0 ? 'up' : 'down'}">${dlt > 0 ? '▲' : '▼'} ${Math.abs(dlt)}</em>`;
    }
    const unit = k === 'crit' || k === 'res' ? '% ' : ' ';
    const name = STAT_INFO[k].name.replace('% ', '');
    return `<li>${statIcon(k)}<span style="color:${v ? STAT_COLOR[k] : '#7d6a52'}">${v >= 0 ? '+' : ''}${v}${unit}${name}</span>${cmp}</li>`;
  }).join('');
  const card = $('itemCard');
  card.innerHTML = itemCardHTML(it, eq, from === 'bag' ? '<button class="pri" id="icEquip">Equipar</button>' : '<button class="pri" id="icUnequip">Quitar</button>', `<button class="sec" id="icSell">Vender · ${it.value}</button>`, lines);
  card.classList.add('show');
  const close = () => { card.classList.remove('show'); invSel = null; };
  card.onclick = (e) => { if (e.target === card) close(); };
  const eqBtn = $('icEquip'), unBtn = $('icUnequip');
  if (eqBtn) eqBtn.onclick = () => {
    const before = derived();
    const old = S.equip[it.slot];
    S.equip[it.slot] = it;
    S.bag.splice(key, 1);
    if (old) S.bag.push(old);
    recalc();
    close();
    SFX.play(it.rarity >= 2 ? 'legend' : 'loot');
    equipToast(before, derived());
    buildInventory(it.slot);
  };
  if (unBtn) unBtn.onclick = () => {
    if (S.bag.length >= bagMax()) return;
    S.bag.push(it);
    delete S.equip[it.slot];
    recalc(); close(); SFX.play('click'); buildInventory();
  };
  $('icSell').onclick = () => {
    if (from === 'bag') S.bag.splice(key, 1); else delete S.equip[it.slot];
    S.kamas += it.value;
    recalc(); close(); SFX.play('coin'); buildInventory();
  };
}

function equipToast(a, b) {
  const parts = [];
  const add = (label, x, y, fmt) => { const dlt = y - x; if (Math.abs(dlt) >= 0.5) parts.push(`${label} ${dlt > 0 ? '+' : ''}${fmt(dlt)}`); };
  add('PV', a.maxHp, b.maxHp, Math.round);
  add('Daño', (a.dmgMul - 1) * 100, (b.dmgMul - 1) * 100, (v) => Math.round(v) + '%');
  add('Crít', a.crit * 100, b.crit * 100, (v) => Math.round(v) + '%');
  add('Potencia', a.power, b.power, Math.round);
  add('Poder', powerScore(a), powerScore(b), Math.round);
  if (!parts.length) return;
  const el = $('shToast');
  const up = powerScore(b) >= powerScore(a);
  el.style.borderColor = up ? '#8fe36a' : '#ff8a80';
  el.style.color = up ? '#d6ffc4' : '#ffd0cc';
  el.textContent = parts.join('  ·  ');
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

$('btnInvClose').addEventListener('click', closeInventory);
// Equipamiento rápido: para cada ranura prueba las piezas de la bolsa y se queda con la que más sube
// el Poder total (cuenta vida, daño, crítico, defensa, velocidad, hechizos y bonus de conjunto).
// Dos pasadas, para que los conjuntos que se completan con varias piezas también se aprovechen.
function bestGearPlan() {
  const saved = { ...S.equip }, bag = S.bag.slice();
  const changes = [];
  for (let pass = 0; pass < 2; pass++) {
    for (const slot of SLOTS) {
      let best = null, bestScore = powerScore(derived());
      for (const it of bag) {
        if (it.slot !== slot) continue;
        const cur = S.equip[slot];
        S.equip[slot] = it;
        const sc = powerScore(derived());
        S.equip[slot] = cur;
        if (sc > bestScore + 0.5) { bestScore = sc; best = it; }
      }
      if (best) {
        const cur = S.equip[slot];
        S.equip[slot] = best;
        bag.splice(bag.indexOf(best), 1);
        if (cur) bag.push(cur);
        changes.push(slot);
      }
    }
  }
  const plan = { equip: { ...S.equip }, bag, changes: [...new Set(changes)] };
  for (const k of SLOTS) { if (saved[k]) S.equip[k] = saved[k]; else delete S.equip[k]; }
  return plan;
}
function autoEquip() {
  const plan = bestGearPlan();
  if (!plan.changes.length) { showToast('shToast', 'Ya llevas lo mejor de tu bolsa'); SFX.play('click'); return; }
  const before = derived();
  for (const k of SLOTS) { if (plan.equip[k]) S.equip[k] = plan.equip[k]; else delete S.equip[k]; }
  S.bag = plan.bag;
  recalc();
  const best = Math.max(...plan.changes.map((k) => S.equip[k].rarity));
  SFX.play(best >= 2 ? 'legend' : 'loot');
  equipToast(before, derived());
  persist();
  buildInventory(plan.changes[0]);
  for (const k of plan.changes) { const el = $('shDoll').querySelector(`.slot[data-slot="${k}"]`); if (el) el.classList.add('new'); }
}
$('btnAutoEquip').addEventListener('click', autoEquip);
$('btnSellCommons').addEventListener('click', () => {
  let gain = 0;
  S.bag = S.bag.filter((it) => { if (it.rarity === 0) { gain += it.value; return false; } return true; });
  S.kamas += gain;
  if (gain) SFX.play('coin');
  invSel = null;
  buildInventory();
});

function itemCardHTML(it, eq, priBtn, secBtn, lines) {
  const R = RARITY[it.rarity];
  const rgb = RARITY_RGB[it.rarity];
  const SD = it.set ? SETS[it.set] : null;
  const nSet = SD ? setCounts()[it.set] || 0 : 0;
  const setBox = SD ? `<div class="setbox" style="--sc:${SD.color}"><div class="t">Conjunto ${SD.name} (${nSet}/${SLOTS.length} equipadas)</div>${[2, 4, 6].map((k) => `<div class="${nSet >= k ? 'on' : 'off'}">${k} piezas: ${setBonusLine(SD.bonus[k])}</div>`).join('')}</div>` : '';
  return `<article class="icard" style="--rc:${SD ? SD.color : R.color};--rg:rgba(${rgb},.5);--rt:${SD ? SD.color : it.rarity === 3 ? '#ffc37a' : R.color}">
    <div class="bar"></div>
    <div class="top">
      <div class="big" style="background:radial-gradient(circle at 50% 40%, rgba(${rgb},.45), #1a0f08)">${itemSVG(it, 52)}</div>
      <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
        <h2>${it.name}</h2>
        <span class="rar">${SD ? 'Pieza de conjunto' : it.unique ? '<b style="color:' + UNIQUES[it.unique].color + '">★ Reliquia única</b>' : R.name}</span>${it.unique ? `<span class="uniq" style="color:${UNIQUES[it.unique].color}">${UNIQUES[it.unique].desc}</span>` : ''}
        <span class="meta">${SLOT_INFO[it.slot].name} · Nivel ${it.level}</span>
      </div>
    </div>
    <div class="sep"></div>
    <ul>${lines}</ul>
    ${setBox}
    ${eq ? `<p class="cmp">Comparado con <b style="color:${RARITY[eq.rarity].color}">${eq.name}</b> (equipado)</p>` : ''}
    <div class="btns">${priBtn}${secBtn}</div>
  </article>`;
}

function itemStatLines(it, eq) {
  const keys = ['dmg', ...CORE_STATS, 'crit', 'res', 'pros'].filter((k) => (it.stats[k] || 0) || (eq && eq.stats[k]));
  return keys.map((k) => {
    const v = it.stats[k] || 0;
    let cmp = '';
    if (eq) {
      const dlt = v - (eq.stats[k] || 0);
      if (dlt) cmp = `<em class="${dlt > 0 ? 'up' : 'down'}">${dlt > 0 ? '▲' : '▼'} ${Math.abs(dlt)}</em>`;
    }
    const unit = k === 'crit' || k === 'res' ? '% ' : ' ';
    const name = STAT_INFO[k].name.replace('% ', '');
    return `<li>${statIcon(k)}<span style="color:${v ? STAT_COLOR[k] : '#7d6a52'}">${v >= 0 ? '+' : ''}${v}${unit}${name}</span>${cmp}</li>`;
  }).join('');
}

// Explicación de todas las características
function showStatHelp() {
  SFX.play('click');
  const t = derived().t;
  const rec = STAT_REC[S.cls] || [];
  const rows = CORE_STATS.map((k) => `<li>${statIcon(k)}<div><b style="color:${STAT_COLOR[k]}">${STAT_INFO[k].name}${rec.includes(k) ? ' <small style="color:#ffd76a">★ recomendada para ' + CLASSES[S.cls].name + '</small>' : ''}</b><span>${STAT_HELP[k].what}. Ahora: ${STAT_HELP[k].now(t)}.</span></div></li>`).join('')
    + `<li>${statIcon('dmg')}<div><b>Daños</b><span>Se suma a la potencia de cada golpe (sobre todo en armas).</span></div></li>`
    + `<li>${statIcon('crit')}<div><b>% Crítico</b><span>Probabilidad de golpe crítico (×1,8 de daño).</span></div></li>`
    + `<li>${statIcon('res')}<div><b>% Resistencia</b><span>Reduce el daño que recibes.</span></div></li>`
    + `<li>${statIcon('pros')}<div><b>Prospección</b><span>Más ámbar y mayor radio para recoger botín.</span></div></li>`;
  const card = $('itemCard');
  card.innerHTML = `<article class="icard" style="--rc:#e8b64c;--rg:rgba(232,182,76,.4);--rt:#ffd76a;width:360px">
    <div class="bar"></div>
    <div class="top"><div style="display:flex;flex-direction:column;gap:2px"><h2>¿Qué hace cada característica?</h2><span class="meta">Cada nivel te da 5 puntos. Mantén pulsado «+» para repartir rápido.</span></div></div>
    <div class="sep"></div>
    <ul class="help-list">${rows}</ul>
    <div class="btns"><button class="pri" id="helpOk">Entendido</button></div>
  </article>`;
  card.classList.add('show');
  card.onclick = (e) => { if (e.target === card) card.classList.remove('show'); };
  $('helpOk').onclick = () => card.classList.remove('show');
}

function showToast(id, msg, good = true) {
  const el = $(id);
  el.style.borderColor = good ? '#8fe36a' : '#ff8a80';
  el.style.color = good ? '#d6ffc4' : '#ffd0cc';
  el.textContent = msg;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

// ---------- Mercader ----------
let shopTab = 'gear';
// Cada vecino tiene su tienda: Brunilda vende equipo; Maese Ivo, elixires y mejoras
const SHOPS = {
  merchant: { title: 'Brunilda · Mercader', tabs: [['gear', 'Equipo']] },
  alchemist: { title: 'Maese Ivo · Alquimista', tabs: [['elixir', 'Elixires'], ['upgrade', 'Mejoras']] },
};
let shopKind = 'merchant';
let SHOP_TABS = SHOPS.merchant.tabs;
const elixirPrice = (k) => Math.round(ELIXIRS[k].base * (1 + (S.maxFaille - 1) * 0.35));
const restockPrice = () => 30 * S.maxFaille;
const UPGRADE_ICON = { bolsa: ['bag', '#6fd05a', '#d6ffc4'], cinto: ['potion', '#7cc457', '#e0ffd0'], afilador: ['whetstone', '#ffb040', '#fff3c4'], vigor: ['talisman', '#ff5a4e', '#ffd0cc'], piel: ['shield', '#a0784a', '#f0d8b0'], energia: ['crystal', '#4fc3f7', '#e0f6ff'], fortuna: ['clover', '#5cc45a', '#e0ffd0'], reflejos: ['boots', '#66bb6a', '#d6ffc4'], iman: ['magnet', '#e04a3a', '#ffd0cc'] };

function genStock() {
  const lvl = Math.max(1, (S.maxFaille - 2) * 2 + 3);
  // el Mercader solo vende legendarios si ya has superado alguna Grieta en Difícil
  const hard = Object.values(mapProg().c).some((v) => v >= 3);
  const rar = [1, 1, 2, 2, hard && Math.random() < 0.4 ? 3 : 2, Math.random() < 0.5 ? 2 : 1];
  const stock = rar.map((r, i) => {
    const it = makeItem(S.cls, lvl + randi(0, 1), r, i === 0 ? { slot: 'arma' } : {});
    it.price = Math.round(it.value * 4 * (1 + r * 0.25));
    return it;
  });
  S.shop = { stock, rifts: S.rifts };
}

function openShop(kind = 'merchant') {
  shopKind = kind;
  SHOP_TABS = SHOPS[kind].tabs;
  if (!SHOP_TABS.some((t) => t[0] === shopTab)) shopTab = SHOP_TABS[0][0];
  $('shopTitle').textContent = SHOPS[kind].title;
  if (!S.shop || S.shop.rifts !== S.rifts) genStock();
  state = 'shop';
  $('shopCard').classList.remove('show');
  buildShop();
  showOverlay('shop');
  SFX.play('click');
}
function closeShop() {
  $('shopCard').classList.remove('show');
  persist();
  state = 'hub';
  buildHub();
  showOverlay('hub');
}

function offerHTML(o) {
  return `<button class="offer${o.sold ? ' sold' : ''}" data-act="${o.act}" style="--rc:${o.rc};--rb:${o.rb};--rg:${o.rg || 'transparent'}" ${o.sold ? 'disabled' : ''}>
    <div class="row"><div class="ico">${o.icon}</div>
      <div style="min-width:0"><span class="nm" style="color:${o.nameColor}">${o.name}</span><span class="sub" style="color:${o.subColor}">${o.sub}</span></div></div>
    <span class="desc">${o.desc}</span>
    <span class="buy${o.can ? '' : ' no'}">${o.sold ? 'Vendido' : AMBER_SVG + ' ' + fmtNum(o.price)}</span>
  </button>`;
}

function buildShop() {
  $('shopTabs').innerHTML = SHOP_TABS.map(([id, label]) => `<button data-tab="${id}" class="${shopTab === id ? 'on' : ''}">${label}</button>`).join('');
  for (const b of $('shopTabs').querySelectorAll('button')) b.addEventListener('click', () => { shopTab = b.dataset.tab; SFX.play('click'); buildShop(); });
  $('shopAmber').innerHTML = AMBER_SVG + ' ' + fmtNum(S.kamas);
  const offers = [];
  if (shopTab === 'gear') {
    S.shop.stock.forEach((it, i) => {
      const R = RARITY[it.rarity], rgb = RARITY_RGB[it.rarity];
      const eq = S.equip[it.slot];
      const top = Object.entries(it.stats).sort((a, b) => (b[0] === 'dmg') - (a[0] === 'dmg') || b[1] - a[1]).slice(0, 2)
        .map(([k, v]) => `+${v}${k === 'crit' || k === 'res' ? '%' : ''} ${STAT_INFO[k].name.replace('% ', '')}`).join(' · ');
      const better = itemPower(it) > itemPower(eq);
      offers.push(offerHTML({ act: 'gear:' + i, sold: it.sold, icon: itemSVG(it, 40), rc: R.color, rb: `rgba(${rgb},.45)`, rg: it.rarity >= 3 ? `rgba(${rgb},.6)` : '',
        name: it.name, nameColor: it.rarity === 3 ? '#ffc37a' : R.color, sub: `${R.name} · Nv ${it.level}`, subColor: R.color,
        desc: top + (better ? ' <b style="color:#8fe36a">▲ mejor que el tuyo</b>' : ''), price: it.price, can: S.kamas >= it.price }));
    });
    $('shopNote').textContent = 'Existencias nuevas tras cada Grieta cerrada. El ámbar se gana con monstruos, Guardianes, rachas y vendiendo objetos.';
    $('btnRestock').style.display = '';
    $('btnRestock').innerHTML = 'Renovar existencias · ' + AMBER_SVG + ' ' + restockPrice();
    $('btnRestock').disabled = S.kamas < restockPrice();
  } else if (shopTab === 'elixir') {
    for (const k of Object.keys(ELIXIRS)) {
      const E = ELIXIRS[k], price = elixirPrice(k), have = S.boosts[k] || 0;
      offers.push(offerHTML({ act: 'elixir:' + k, icon: tintIcon('potion', E.color, E.hi, 40), rc: E.color, rb: E.color + '66',
        name: E.name, nameColor: E.hi, sub: have ? `Tienes ${have} · Próxima Grieta` : 'Próxima Grieta', subColor: '#cdb58a',
        desc: E.desc, price, can: S.kamas >= price && have < 3 }));
    }
    offers.push(offerHTML({ act: 'potion', icon: tintIcon('potion', '#7cc457', '#e0ffd0', 40), rc: '#7cc457', rb: '#7cc45766',
      name: 'Poción de Savia', nameColor: '#b5f28a', sub: `Tienes ${S.pan}/${panMax()}`, subColor: '#cdb58a',
      desc: 'Cura el 40% de tus PV en combate (botón 🧪).', price: 40, can: S.kamas >= 40 && S.pan < panMax() }));
    $('shopNote').textContent = 'Los elixires se beben solos al cruzar el Portal y duran toda la Grieta.';
    $('btnRestock').style.display = 'none';
  } else {
    for (const k of Object.keys(UPGRADES)) {
      const U = UPGRADES[k], lv = S.up[k] || 0, maxed = lv >= U.max, price = U.cost(lv);
      const [kind, col, hi] = UPGRADE_ICON[k];
      offers.push(offerHTML({ act: 'up:' + k, sold: maxed, icon: tintIcon(kind, col, hi, 40), rc: col, rb: col + '55',
        name: U.name, nameColor: hi, sub: `Mejora permanente · ${lv}/${U.max}`, subColor: '#cdb58a',
        desc: maxed ? 'Nivel máximo alcanzado' : U.desc(lv), price, can: !maxed && S.kamas >= price }));
    }
    $('shopNote').textContent = 'Las mejoras son permanentes para este personaje.';
    $('btnRestock').style.display = 'none';
  }
  $('shopGrid').innerHTML = offers.join('');
  for (const el of $('shopGrid').querySelectorAll('.offer')) el.addEventListener('click', () => shopAction(el.dataset.act));
}

function pay(price) {
  if (S.kamas < price) { showToast('shopToast', 'No tienes suficiente ámbar', false); SFX.play('hurt'); return false; }
  S.kamas -= price;
  SFX.play('coin');
  return true;
}

function shopAction(act) {
  const [kind, key] = act.split(':');
  if (kind === 'gear') {
    const it = S.shop.stock[+key];
    if (!it || it.sold) return;
    SFX.play('click');
    const card = $('shopCard');
    const eq = S.equip[it.slot];
    card.innerHTML = itemCardHTML(it, eq, `<button class="pri" id="scBuy">Comprar · ${fmtNum(it.price)}</button>`, '<button class="sec" id="scClose">Cerrar</button>', itemStatLines(it, eq));
    card.classList.add('show');
    card.onclick = (e) => { if (e.target === card) card.classList.remove('show'); };
    $('scClose').onclick = () => card.classList.remove('show');
    $('scBuy').onclick = () => {
      if (S.bag.length >= bagMax()) { showToast('shopToast', '¡Bolsa llena! Vende algo primero', false); return; }
      if (!pay(it.price)) return;
      const bought = { ...it };
      delete bought.price; delete bought.sold;
      S.bag.push(bought);
      it.sold = true;
      card.classList.remove('show');
      showToast('shopToast', `${it.name} está en tu bolsa · ábrela en Personaje para equipártelo`);
      SFX.play(it.rarity >= 2 ? 'legend' : 'loot');
      persist(); buildShop();
    };
  } else if (kind === 'elixir') {
    if ((S.boosts[key] || 0) >= 3) { showToast('shopToast', 'Máximo 3 de cada elixir', false); return; }
    if (!pay(elixirPrice(key))) return;
    S.boosts[key] = (S.boosts[key] || 0) + 1;
    showToast('shopToast', `${ELIXIRS[key].name} listo para la próxima Grieta`);
    persist(); buildShop();
  } else if (kind === 'potion') {
    if (S.pan >= panMax()) { showToast('shopToast', 'Ya llevas el máximo de pociones', false); return; }
    if (!pay(40)) return;
    S.pan++;
    showToast('shopToast', `Poción de Savia comprada (${S.pan}/${panMax()})`);
    persist(); buildShop();
  } else if (kind === 'up') {
    const U = UPGRADES[key], lv = S.up[key] || 0;
    if (lv >= U.max) return;
    if (!pay(U.cost(lv))) return;
    S.up[key] = lv + 1;
    if (P) recalc();
    SFX.play('level');
    showToast('shopToast', `${U.name} mejorada a nivel ${lv + 1}`);
    persist(); buildShop();
  }
}

$('btnShopClose').addEventListener('click', closeShop);
$('btnQuestClose').addEventListener('click', closeQuests);
$('questList').addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-q]');
  if (b && !b.disabled) { claimQuest(b.dataset.q === 'bonus' ? 'bonus' : +b.dataset.q); return; }
  const g = ev.target.closest('button[data-g]');
  if (g && !g.disabled) gestaAction(g.dataset.g);
});
$('questTabs').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-tab]'); if (b) { questTab = b.dataset.tab; SFX.play('click'); buildQuests(); } });
$('btnRestock').addEventListener('click', () => {
  if (!pay(restockPrice())) return;
  genStock();
  showToast('shopToast', 'Existencias renovadas');
  persist(); buildShop();
});

// ---------- Pausa, fin de Grieta, muerte ----------
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
  MUSIC.setDuck(0.35);
}
function resumeGame() {
  if (state !== 'pause') return;
  state = 'play';
  last = performance.now();
  showOverlay(null);
  MUSIC.setDuck(1);
}

function finishRift() {
  if (state !== 'play') return;
  state = 'end';
  S.rifts++;
  trackDaily('rift');
  if (rift.d >= 1) trackDaily('hard');
  SFX.play('zaap');
  persist();
  $('endTitle').textContent = rift.isDungeon ? `Mazmorra · Piso ${rift.tier} superado` : rift.isSuper ? `¡${SUPER_BOSSES[rift.biome.id].name.split(',')[0]} derrotado!` : `Grieta ${rift.n} (${rift.D.name}) cerrada`;
  $('endStats').innerHTML = riftRows([
    ['Bonus de tiempo', rift.bonus ? '+' + rift.bonus + ' ámbar' : '—'],
    ...(rift.dofus ? [[GEMS[rift.dofus].name, '★']] : []),
    ...(rift.dungeonEss ? [['Esencias de Ruptura', '+' + rift.dungeonEss]] : []),
    ...(rift.setDrop ? [['Pieza de conjunto', SETS[rift.biome.id].name]] : []),
  ]);
  showOverlay('end');
}

function playerDied() {
  if (state !== 'play') return;
  state = 'dead';
  SFX.play('die');
  MUSIC.play('defeat', { loop: false, fade: 0.6 });
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
  SFX.setMuted(!SFX.muted); SAVE.muted = SFX.muted; persist();
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
  if (document.hidden) { pauseGame(); persist(); if (SFX.ac) SFX.ac.suspend(); }
  else if (SFX.ac && state !== 'title') SFX.ac.resume();
});

// Botón "atrás" de Android (Capacitor)
try {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App) {
    App.addListener('backButton', () => {
      if (state === 'play') pauseGame();
      else if (state === 'pause') resumeGame();
      else if (state === 'inv') closeInventory();
      else if (state === 'shop') closeShop();
      else if (state === 'quests') closeQuests();
      else if (state === 'map') closeMap();
      else if (state === 'hub') { persist(); S = null; showStart(); }
      else if (state === 'menu') showStart();
      else if (state === 'start') showTitle();
      else if (state === 'title') App.exitApp();
    });
  }
} catch (e) { /* entorno web */ }

// Arranque
if (document.fonts && document.fonts.load) ['900 20px Cinzel', '800 20px Garamond', '700 20px Garamond'].forEach((f) => document.fonts.load(f).catch(() => {}));
function onHeroArtLoaded() { if (state === 'menu') buildMenu(); }

// ---------- Toca para empezar → Menú principal → Elegir héroe ----------
let menuMode = 'new', confirmNew = false;
function showTitle() { state = 'title'; scene = 'hub'; S = null; showOverlay('title'); MUSIC.play('title'); }
function showStart() {
  state = 'start'; scene = 'hub'; S = null;
  const last = SAVE.last && SAVE.slots[SAVE.last];
  $('stContinue').disabled = !last;
  $('stContinueSub').textContent = last ? `${CLASSES[SAVE.last].name} · nivel ${last.level}` : 'Aún no hay partidas';
  for (const b of document.querySelectorAll('.s-menu button')) b.classList.remove('sel');
  (last ? $('stContinue') : $('stNew')).classList.add('sel');
  showOverlay('start');
  MUSIC.play('title');
}
function openClassMenu(mode) {
  menuMode = mode; confirmNew = false;
  state = 'menu'; scene = 'hub';
  selectedClass = mode === 'switch' ? SAVE.last : null;
  $('menuTitle').textContent = mode === 'new' ? 'Nuevo juego · Elige tu héroe' : 'Elige con quién jugar';
  $('menuSub').textContent = mode === 'new' ? 'Cada héroe tiene su propia partida.' : 'Cambia de héroe; cada uno conserva su progreso.';
  buildMenu();
  showOverlay('menu');
}
$('title').addEventListener('click', () => { SFX.init(); SFX.play('zaap'); enterFullscreen(); showStart(); });
$('stContinue').addEventListener('click', () => { if (!SAVE.last || !SAVE.slots[SAVE.last]) return; SFX.init(); SFX.play('click'); S = migrateSlot(SAVE.slots[SAVE.last]); goHub(); });
$('stNew').addEventListener('click', () => { SFX.init(); SFX.play('click'); openClassMenu('new'); });
$('stIntro').addEventListener('click', () => { SFX.init(); SFX.play('click'); playCine('prologo', null); }); // cine.js
$('btnMenuBack').addEventListener('click', () => { SFX.play('click'); showStart(); });
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (state === 'title' && (k === 'enter' || k === ' ')) $('title').click();
  else if (state === 'start') {
    const btns = [...document.querySelectorAll('.s-menu button')].filter((b) => !b.disabled);
    let i = btns.findIndex((b) => b.classList.contains('sel'));
    if (k === 'arrowdown' || k === 'arrowup') { btns.forEach((b) => b.classList.remove('sel')); i = (i + (k === 'arrowdown' ? 1 : btns.length - 1)) % btns.length; btns[i].classList.add('sel'); }
    else if (k === 'enter' && btns[i]) btns[i].click();
    else if (k === 'escape') showTitle();
  } else if (state === 'menu' && k === 'escape') showStart();
});

// Arranque: directo a la pantalla de título (el prólogo se ve como cinemática al empezar partida)
if (location.hash === '#test') openClassMenu('switch');
else showTitle();
requestAnimationFrame(frame);
$('btnMute').textContent = 'Sonido: ' + (SFX.muted ? 'OFF' : 'ON');

// Gancho para pruebas automatizadas
window.__game = {
  get state() { return state; }, get P() { return P; }, get S() { return S; }, get rift() { return rift; }, get enemies() { return enemies; },
  input, startRift, startNode, useSkill, spawnGuardian, goHub, openInventory, spawnEnemy,
  get fps() { return QUALITY; }, get music() { return MUSIC.cur ? MUSIC.cur.name : null; },
};
