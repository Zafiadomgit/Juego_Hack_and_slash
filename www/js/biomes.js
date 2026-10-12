/* Fendaria — mundos (biomas) de las Grietas.
 * Cada bioma tiene su terreno (textura de ruido pintada), vegetación,
 * charcos, partículas, luz, niebla, enemigos favoritos y Guardián.
 */
'use strict';

const BIOMES = [
  {
    id: 'ceniza', name: 'Bosque Ceniciento',
    ground: [[74, 42, 30], [92, 54, 38], [52, 30, 22]], grain: [150, 100, 70], patch: ['rgba(120,60,30,0.25)', 'rgba(30,14,8,0.3)'],
    deco: { fern: 30, bones: 8, grass: 14, crackline: 8, pebble: 20, blotch: 20 }, decoCol: ['#4d6b30', '#3e5a2a', '#5b6e2c'],
    tree: 'dead', props: { pillar: 18, crystal: 10, brazier: 16 }, pool: 'lava', pools: 14,
    ambient: 0.5, shade: '92,70,120', fog: '120,90,110', mote: 'ember', tint: null,
    weights: { tofu: 4, bouftou: 4, arakne: 3, pissenlit: 2, craqueleur: 1 }, boss: 'bouftouRoyal',
  },
  {
    id: 'pantano', mfilter: 'hue-rotate(70deg) saturate(0.85)', name: 'Pantano Sombrío',
    ground: [[38, 52, 40], [50, 66, 48], [26, 36, 30]], grain: [90, 120, 80], patch: ['rgba(20,60,40,0.35)', 'rgba(70,90,40,0.22)'],
    deco: { reeds: 26, lily: 0, glowshroom: 10, grass: 20, pebble: 10, blotch: 24, bones: 4 }, decoCol: ['#4f7a3a', '#3d6630', '#6a8a3a'],
    tree: 'willow', props: { pillar: 10, crystal: 14, brazier: 6 }, pool: 'water', pools: 20, crystalHue: 2,
    ambient: 0.58, shade: '50,100,96', fog: '90,140,110', mote: 'spore', tint: 'rgba(40,120,80,0.16)',
    weights: { tofu: 2, bouftou: 2, arakne: 5, pissenlit: 5, craqueleur: 1 }, boss: 'reinaTeje',
  },
  {
    id: 'glaciar', mfilter: 'hue-rotate(170deg) saturate(0.8) brightness(1.1)', name: 'Glaciar Rúnico',
    ground: [[198, 212, 226], [178, 194, 212], [222, 232, 242]], grain: [255, 255, 255], patch: ['rgba(120,160,210,0.25)', 'rgba(255,255,255,0.35)'],
    deco: { snowdrift: 18, iceshard: 10, pebble: 12, crackline: 4, bones: 4, blotch: 10 }, decoCol: ['#9fb8cc', '#c8dcea', '#7f9ab0'],
    tree: 'pine', props: { pillar: 14, crystal: 24, brazier: 10 }, pool: 'ice', pools: 12, crystalHue: 0,
    ambient: 0.46, shade: '100,130,215', fog: '210,225,245', mote: 'snow', tint: 'rgba(150,200,255,0.2)',
    weights: { tofu: 2, bouftou: 3, arakne: 2, pissenlit: 2, craqueleur: 4 }, boss: 'colosoHielo',
  },
  {
    id: 'desierto', mfilter: 'hue-rotate(18deg) saturate(1.1)', name: 'Desierto de Ámbar',
    ground: [[196, 154, 90], [214, 176, 108], [170, 130, 72]], grain: [240, 210, 150], patch: ['rgba(150,100,40,0.25)', 'rgba(255,230,170,0.25)'],
    deco: { ripple: 30, bones: 12, pebble: 14, blotch: 14, crackline: 4 }, decoCol: ['#a8844a', '#8a6a38', '#c09a5a'],
    tree: 'spire', props: { pillar: 22, crystal: 12, brazier: 12 }, pool: 'quicksand', pools: 12, crystalHue: 3,
    ambient: 0.44, shade: '175,105,115', fog: '235,195,135', mote: 'sand', tint: 'rgba(255,190,90,0.14)',
    weights: { tofu: 5, bouftou: 4, arakne: 2, pissenlit: 1, craqueleur: 2 }, boss: 'tofuRoyal',
  },
  {
    id: 'abismo', mfilter: 'hue-rotate(-22deg) saturate(1.3) brightness(0.9)', name: 'Abismo Volcánico',
    ground: [[34, 28, 28], [46, 38, 36], [20, 16, 16]], grain: [120, 90, 80], patch: ['rgba(120,30,10,0.3)', 'rgba(0,0,0,0.35)'],
    deco: { crackline: 26, obsidian: 14, pebble: 14, bones: 6, blotch: 14 }, decoCol: ['#3a2a28', '#2a1a18', '#5a3a30'],
    tree: 'dead', props: { pillar: 16, crystal: 8, brazier: 22 }, pool: 'lava', pools: 26, crystalHue: 4,
    ambient: 0.6, shade: '96,40,60', fog: '170,60,40', mote: 'ember', tint: 'rgba(255,60,20,0.14)',
    weights: { tofu: 4, bouftou: 2, arakne: 2, pissenlit: 2, craqueleur: 4 }, boss: 'hechicero',
  },
];

function biomeFor(level) { return BIOMES[(level - 1) % BIOMES.length]; }
function curBiome() { return rift ? rift.biome : BIOMES[0]; }

// ---------- Textura de terreno: ruido de valor en mosaico (sin costuras) ----------
const BIOME_TEX = new Map();
// Texturas de suelo pintadas (pixel art HD-2D, 256 px, ya repetibles). Si existe la del bioma se usa en lugar
// del ruido procedural. GROUND_TILE = unidades de mundo que ocupa una repetición de la textura.
const GROUND_TILE = 420;
const GROUND_IMG = {};
['ceniza', 'pantano', 'glaciar', 'desierto', 'abismo', 'plaza'].forEach((id) => {
  const img = new Image();
  img.onload = () => {
    GROUND_IMG[id] = img;
    BIOME_TEX.delete(id);
    if (typeof groundChunks !== 'undefined') groundChunks.clear();
    if (typeof VILLAGE !== 'undefined') VILLAGE.ground = null;
  };
  img.src = 'img/ground/' + id + '.png';
});
function biomeGroundTex(b) {
  let c = BIOME_TEX.get(b.id);
  if (c) return c;
  if (GROUND_IMG[b.id]) {
    const img = GROUND_IMG[b.id];
    c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    c.painted = true; c.patScale = GROUND_TILE / img.width;
    BIOME_TEX.set(b.id, c);
    return c;
  }
  const N = 256;
  c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  let seed = b.id.length * 9301 + 49297;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const octave = (period) => {
    const grid = new Float32Array(period * period);
    for (let i = 0; i < grid.length; i++) grid[i] = rnd();
    return (x, y) => {
      const fx = (x / N) * period, fy = (y / N) * period;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
      const a = grid[y0 * period + x0], bb = grid[y0 * period + x1], cc = grid[y1 * period + x0], d = grid[y1 * period + x1];
      return a + (bb - a) * sx + (cc - a) * sy + (a - bb - cc + d) * sx * sy;
    };
  };
  const o1 = octave(4), o2 = octave(8), o3 = octave(16), o4 = octave(48);
  const [c0, c1, c2] = b.ground;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const n = o1(x, y) * 0.45 + o2(x, y) * 0.3 + o3(x, y) * 0.17 + o4(x, y) * 0.08;
      let r, gg, bl;
      if (n < 0.5) { const k = n / 0.5; r = c2[0] + (c0[0] - c2[0]) * k; gg = c2[1] + (c0[1] - c2[1]) * k; bl = c2[2] + (c0[2] - c2[2]) * k; }
      else { const k = (n - 0.5) / 0.5; r = c0[0] + (c1[0] - c0[0]) * k; gg = c0[1] + (c1[1] - c0[1]) * k; bl = c0[2] + (c1[2] - c0[2]) * k; }
      const grain = (rnd() - 0.5) * 14;
      const i = (y * N + x) * 4;
      img.data[i] = r + grain; img.data[i + 1] = gg + grain; img.data[i + 2] = bl + grain; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  // piedrecitas y granos sueltos (también en mosaico)
  for (let i = 0; i < 140; i++) {
    const x = rnd() * N, y = rnd() * N, s = 0.6 + rnd() * 1.8;
    g.fillStyle = `rgba(${b.grain[0]},${b.grain[1]},${b.grain[2]},${0.12 + rnd() * 0.2})`;
    g.beginPath(); g.ellipse(x, y, s * 1.4, s, rnd() * 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath(); g.ellipse(x + s * 0.4, y + s * 0.5, s * 1.3, s * 0.7, 0, 0, Math.PI * 2); g.fill();
  }
  BIOME_TEX.set(b.id, c);
  return c;
}

// ---------- Decoración horneada por bioma ----------
function drawReeds(d) {
  const g = ctx;
  g.save(); g.translate(d.x, d.y); g.scale(d.s, d.s);
  g.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    g.strokeStyle = i % 2 ? '#3d6630' : '#557a38'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(i * 2, 0); g.quadraticCurveTo(i * 3, -10, i * 4 + Math.sin(i) * 3, -20 - Math.abs(i) * 2); g.stroke();
    if (i === 0 || i === 2) { g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(i * 4 + Math.sin(i) * 3, -20 - Math.abs(i) * 2, 1.6, 4, 0, 0, Math.PI * 2); g.fill(); }
  }
  g.restore();
}
function drawGlowShroom(d) {
  const g = ctx;
  g.save(); g.translate(d.x, d.y); g.scale(d.s * 0.8, d.s * 0.8);
  for (const [x, h, r] of [[-4, 8, 4], [3, 11, 5], [7, 6, 3]]) {
    g.fillStyle = '#d8d0b0'; g.fillRect(x - 0.8, -h, 1.6, h);
    g.fillStyle = '#5fe0b0'; g.beginPath(); g.ellipse(x, -h, r, r * 0.6, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(160,255,220,0.8)'; g.beginPath(); g.arc(x - r * 0.3, -h - r * 0.25, r * 0.22, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
function drawSnowDrift(d) {
  const g = ctx;
  g.save(); g.translate(d.x, d.y); g.rotate(d.r * 0.2); g.scale(d.s, d.s * 0.5);
  const gr = g.createRadialGradient(0, -4, 2, 0, 0, 26);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}
function drawIceShard(d) {
  const g = ctx;
  g.save(); g.translate(d.x, d.y); g.scale(d.s * 0.7, d.s * 0.7);
  g.lineWidth = 1; g.strokeStyle = 'rgba(40,70,100,0.6)';
  for (const [x, h, a] of [[-4, 12, -0.3], [2, 16, 0.1], [7, 9, 0.5]]) {
    g.save(); g.translate(x, 0); g.rotate(a);
    g.fillStyle = '#bfe4ff'; g.beginPath(); g.moveTo(-2.5, 0); g.lineTo(0, -h); g.lineTo(2.5, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(-1.5, -1); g.lineTo(0, -h + 2); g.lineTo(0, -1); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();
}
function drawRipple(d) {
  const g = ctx;
  g.save(); g.translate(d.x, d.y); g.rotate(-0.25); g.scale(d.s, d.s * 0.55);
  g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = 'rgba(120,80,30,0.28)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-24, i * 7); g.quadraticCurveTo(0, i * 7 - 6, 24, i * 7); g.stroke();
    g.strokeStyle = 'rgba(255,235,190,0.3)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-22, i * 7 - 1.5); g.quadraticCurveTo(0, i * 7 - 7.5, 22, i * 7 - 1.5); g.stroke();
  }
  g.restore();
}
function drawObsidian(d) {
  const g = ctx;
  g.save(); g.translate(d.x, d.y); g.rotate(d.r * 0.3); g.scale(d.s * 0.7, d.s * 0.7);
  g.fillStyle = '#0e0a10'; g.strokeStyle = '#4a3a50'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(-6, 0); g.lineTo(-2, -12); g.lineTo(4, -9); g.lineTo(7, 0); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(180,140,220,0.5)'; g.beginPath(); g.moveTo(-2, -11); g.lineTo(0, -2); g.stroke();
  g.restore();
}

function drawBiomeDeco(d) {
  switch (d.kind) {
    case 'reeds': drawReeds(d); break;
    case 'glowshroom': drawGlowShroom(d); break;
    case 'snowdrift': drawSnowDrift(d); break;
    case 'iceshard': drawIceShard(d); break;
    case 'ripple': drawRipple(d); break;
    case 'obsidian': drawObsidian(d); break;
    default: return false;
  }
  return true;
}

// ---------- Árboles por bioma (en caché) ----------
function treeArt(kind, hue, sway) {
  const g = ctx;
  g.lineJoin = 'round'; g.lineCap = 'round';
  if (kind === 'dead') {
    // árbol retorcido sin hojas, con brasas en las grietas
    g.strokeStyle = '#1c1210'; g.lineWidth = 9;
    const trunk = () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-4, -18, 6, -30, 2, -48); g.stroke(); };
    trunk();
    g.strokeStyle = hue ? '#3a2a26' : '#4a3226'; g.lineWidth = 6.5; trunk();
    const branches = [[2, -36, -22 + sway, -58], [2, -42, 20 + sway, -66], [1, -30, 16 + sway, -44], [2, -48, -6 + sway, -74], [0, -24, -16 + sway, -36]];
    for (const [x0, y0, x1, y1] of branches) {
      g.strokeStyle = '#1c1210'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 4, (y0 + y1) / 2, x1, y1); g.stroke();
      g.strokeStyle = hue ? '#3a2a26' : '#4a3226'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 4, (y0 + y1) / 2, x1, y1); g.stroke();
    }
    g.strokeStyle = '#ff8a3d'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(1, -12); g.lineTo(-1, -20); g.lineTo(2, -26); g.stroke();
  } else if (kind === 'oak') {
    // roble frondoso del pueblo: copa de muchas masas con luz arriba a la izquierda
    g.fillStyle = '#3a2618'; g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(-5, -20, -6, -40); g.lineTo(6, -40); g.quadraticCurveTo(5, -20, 10, 0); g.closePath(); g.fill();
    g.fillStyle = '#5a3a24'; g.fillRect(-4, -38, 4, 36);
    g.fillStyle = '#2a1a10'; g.fillRect(-12, -3, 7, 3); g.fillRect(6, -3, 8, 3);
    const greens = hue ? ['#1f3f22', '#2d5a2c', '#3f7a36', '#62a046'] : ['#223a1a', '#33562a', '#4a7a34', '#78a848'];
    const blobs = [[-26, -52, 20], [24, -54, 20], [0, -68, 26], [-16, -78, 18], [16, -80, 18], [0, -50, 22], [-30, -66, 14], [30, -68, 14]];
    for (const [x, y, r] of blobs) { g.fillStyle = greens[0]; g.beginPath(); g.arc(x + sway * 0.4, y + 3, r, 0, TAU); g.fill(); }
    for (const [x, y, r] of blobs) { g.fillStyle = greens[1]; g.beginPath(); g.arc(x + sway * 0.5, y, r - 2, 0, TAU); g.fill(); }
    for (const [x, y, r] of blobs) { g.fillStyle = greens[2]; g.beginPath(); g.arc(x - r * 0.25 + sway * 0.6, y - r * 0.3, r * 0.62, 0, TAU); g.fill(); }
    g.fillStyle = greens[3];
    for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x - r * 0.4 + sway * 0.6, y - r * 0.5, r * 0.28, 0, TAU); g.fill(); }
  } else if (kind === 'willow') {
    g.fillStyle = '#2a2018'; g.beginPath(); g.moveTo(-6, 0); g.quadraticCurveTo(-2, -26, -3, -44); g.lineTo(5, -44); g.quadraticCurveTo(3, -24, 7, 0); g.closePath(); g.fill();
    const greens = ['#1f3a28', '#2c4f34', '#3d6a40'];
    for (let i = 0; i < 3; i++) {
      g.fillStyle = greens[i];
      g.beginPath(); g.ellipse(sway * (i + 1) * 0.3, -54 - i * 4, 30 - i * 7, 18 - i * 4, 0, 0, Math.PI * 2); g.fill();
    }
    // ramas colgantes
    g.strokeStyle = '#2c4f34'; g.lineWidth = 2;
    for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * 6, -50); g.quadraticCurveTo(i * 7 + sway, -30, i * 7.5 + sway * 1.4, -12 - Math.abs(i) * 2); g.stroke(); }
    g.fillStyle = 'rgba(160,255,200,0.12)'; g.beginPath(); g.ellipse(-8, -62, 12, 6, 0, 0, Math.PI * 2); g.fill();
  } else if (kind === 'pine') {
    g.fillStyle = '#3a2a20'; g.fillRect(-3.5, -14, 7, 14);
    const layers = [[-14, 24], [-28, 20], [-42, 15], [-54, 10]];
    for (const [y, w] of layers) {
      g.fillStyle = '#1f3a3a';
      g.beginPath(); g.moveTo(-w + sway * 0.3, y); g.lineTo(sway * 0.6, y - 22); g.lineTo(w + sway * 0.3, y); g.closePath(); g.fill();
      g.fillStyle = '#f2f8ff';
      g.beginPath(); g.moveTo(-w * 0.8 + sway * 0.3, y - 3); g.quadraticCurveTo(sway * 0.5, y - 20, w * 0.6 + sway * 0.3, y - 6); g.quadraticCurveTo(0, y - 8, -w * 0.8, y - 3); g.fill();
    }
  } else {
    // aguja de arenisca erosionada
    g.fillStyle = '#9a6a3a';
    g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-20, -30, -8, -46); g.quadraticCurveTo(-12, -60, -4, -76); g.lineTo(6, -72); g.quadraticCurveTo(12, -50, 9, -40); g.quadraticCurveTo(20, -22, 16, 0); g.closePath(); g.fill();
    g.fillStyle = '#c4945a';
    g.beginPath(); g.moveTo(-12, -2); g.quadraticCurveTo(-15, -28, -5, -44); g.quadraticCurveTo(-8, -58, -2, -72); g.lineTo(0, -40); g.quadraticCurveTo(-4, -20, 0, -2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(80,50,20,0.5)'; g.lineWidth = 1.5;
    for (const y of [-14, -30, -52]) { g.beginPath(); g.moveTo(-14, y); g.quadraticCurveTo(0, y - 3, 14, y + 1); g.stroke(); }
  }
}

// ---------- Charcos por bioma ----------
const POOL_STYLE = {
  lava: { rim: '#1c0c06', stops: ['#fff0a0', '#ffb030', '#e0480c', '#7a1c04'], glow: '255,110,30', light: true, crust: 'rgba(60,20,8,0.6)' },
  water: { rim: '#14201a', stops: ['#8ff0d0', '#2a8a7a', '#14504a', '#0a2a26'], glow: '90,220,180', light: true, crust: 'rgba(60,110,40,0.7)' },
  ice: { rim: '#7f9ab0', stops: ['#ffffff', '#d8f0ff', '#9cc8ea', '#6a9ac0'], glow: '160,210,255', light: false, crust: 'rgba(255,255,255,0.5)' },
  quicksand: { rim: '#6a4a24', stops: ['#d8b070', '#b88a4a', '#8a6230', '#5a3e1c'], glow: '255,200,120', light: false, crust: 'rgba(80,50,20,0.4)' },
};

// ---------- Partículas ambientales en pantalla ----------
function drawMotes(type) {
  for (const m of motes) {
    if (type === 'snow') { m.y += m.v * 0.03; m.x += Math.sin(now * 0.8 + m.p) * 0.0009; if (m.y > 1.02) { m.y = -0.02; m.x = Math.random(); } }
    else if (type === 'sand') { m.x += m.v * 0.06; m.y += Math.sin(now + m.p) * 0.0006; if (m.x > 1.02) { m.x = -0.02; m.y = Math.random(); } }
    else { m.y -= m.v * 0.016; m.x += Math.sin(now + m.p) * 0.0004; if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); } }
    const col = type === 'snow' ? '#ffffff' : type === 'sand' ? '#f0d098' : type === 'spore' ? '#a8ffcf' : '#ffe9b0';
    ctx.globalAlpha = (type === 'snow' ? 0.75 : 0.35) + Math.sin(now * 2 + m.p) * 0.2;
    if (type === 'sand') { ctx.fillStyle = col; ctx.fillRect(m.x * W, m.y * H, m.s * ui * 3, m.s * ui * 0.7); }
    else circle(m.x * W, m.y * H, m.s * ui * (type === 'snow' ? 1.3 : 1), col);
  }
  ctx.globalAlpha = 1;
}
