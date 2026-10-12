/* Fendaria — efectos visuales: brillos aditivos, destellos de impacto,
 * chispas, marcas en el suelo, rayos de subida de nivel e iluminación.
 * Todo usa texturas pre-generadas para ser barato en móvil.
 */
'use strict';

// ---------- Texturas de brillo (degradado radial en caché) ----------
const GLOW_TEX = new Map();
function glowTex(rgb) {
  let c = GLOW_TEX.get(rgb);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`);
  gr.addColorStop(0.22, `rgba(${rgb},0.6)`);
  gr.addColorStop(0.55, `rgba(${rgb},0.18)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  GLOW_TEX.set(rgb, c);
  return c;
}

// Brillo aditivo en coordenadas de mundo (rgb como "255,140,40")
function glow(x, y, r, rgb, a = 1) {
  if (a <= 0 || r <= 0) return;
  const op = ctx.globalCompositeOperation, ga = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = ga * Math.min(1, a);
  ctx.drawImage(glowTex(rgb), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = ga;
  ctx.globalCompositeOperation = op;
}

const RARITY_RGB = ['230,225,210', '79,195,247', '206,147,216', '255,167,38'];

// ---------- Destellos, chispas y marcas ----------
let flashes = [];
let decals = [];
let pillars = [];

function hitFlash(x, y, size, rgb) {
  flashes.push({ x, y, size, rgb, life: 0.16, max: 0.16, rot: Math.random() * Math.PI });
}

function sparks(x, y, n, color, speed = 280, dir = 0, spread = Math.PI * 2, grav = 380) {
  for (let i = 0; i < n; i++) {
    const a = dir + (Math.random() - 0.5) * spread;
    const sp = speed * (0.45 + Math.random() * 0.75);
    particles.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.32, max: 0.32, color, size: 1.5 + Math.random() * 1.8, grav });
  }
}

function embers(x, y, n, color, spread = 14) {
  for (let i = 0; i < n; i++) {
    particles.push({ kind: 'glowdot', x: x + (Math.random() - 0.5) * spread * 2, y: y - Math.random() * spread, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 70, life: 0.7, max: 0.7, rgb: color, size: 4 + Math.random() * 5, grav: 0 });
  }
}

// type: 'crack' | 'scorch' | 'rune'
function addDecal(type, x, y, r, life, rgb) {
  const d = { type, x, y, r, life, max: life, rgb: rgb || '255,120,40', seed: Math.random() * 1000, lines: null };
  if (type === 'crack') {
    d.lines = [];
    const n = 7 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      let px = 0, py = 0, aa = a;
      const pts = [[0, 0]];
      const steps = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < steps; k++) {
        aa += (Math.random() - 0.5) * 0.9;
        const len = (r / steps) * (0.7 + Math.random() * 0.6);
        px += Math.cos(aa) * len; py += Math.sin(aa) * len * 0.55;
        pts.push([px, py]);
      }
      d.lines.push(pts);
    }
  }
  decals.push(d);
}

function levelUpPillar(x, y) {
  pillars.push({ x, y, life: 1.4, max: 1.4 });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 26;
    particles.push({ kind: 'glowdot', x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.4, vx: 0, vy: -90 - Math.random() * 140, life: 1.1, max: 1.1, rgb: Math.random() < 0.5 ? '255,215,110' : '140,210,255', size: 4 + Math.random() * 6, grav: 0 });
  }
}

function updateFx(dt) {
  for (const f of flashes) f.life -= dt;
  flashes = flashes.filter((f) => f.life > 0);
  for (const d of decals) d.life -= dt;
  decals = decals.filter((d) => d.life > 0);
  for (const p of pillars) p.life -= dt;
  pillars = pillars.filter((p) => p.life > 0);
}

function resetFx() { flashes = []; decals = []; pillars = []; }

// Marcas en el suelo (se dibujan antes que las entidades)
function drawDecals() {
  for (const d of decals) {
    const k = d.life / d.max;
    if (d.type === 'crack') {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.strokeStyle = '#1a0a05'; ctx.lineWidth = 5;
      for (const pts of d.lines) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${d.rgb},${0.9 * k})`; ctx.lineWidth = 2.2;
      for (const pts of d.lines) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
      ctx.restore();
      glow(d.x, d.y, d.r * 0.9, d.rgb, 0.35 * k);
    } else if (d.type === 'scorch') {
      ctx.save();
      ctx.globalAlpha = 0.45 * Math.min(1, k * 2);
      ctx.fillStyle = '#140804';
      ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      glow(d.x, d.y, d.r * 0.7, d.rgb, 0.25 * k * k);
    } else if (d.type === 'rune') {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.scale(1, 0.5);
      ctx.rotate(now * 1.5 + d.seed);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, k * 2, (d.max - d.life) * 6);
      ctx.strokeStyle = `rgba(${d.rgb},0.85)`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, d.r, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, d.r * 0.78, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.save(); ctx.rotate(a); ctx.translate(d.r * 0.89, 0);
        ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(3, 0); ctx.lineTo(-3, 4); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }
}

// Destellos de impacto y columnas de luz (encima de las entidades)
function drawFlashes() {
  for (const f of flashes) {
    const k = 1 - f.life / f.max;
    const s = f.size * (0.6 + k * 0.9);
    const a = 1 - k;
    glow(f.x, f.y, s * 1.8, f.rgb, a);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fffbe8';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const rr = i % 2 ? s * 0.18 : s;
      ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  for (const p of pillars) {
    const k = p.life / p.max;
    const a = Math.min(1, (1 - k) * 8, k * 2.5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, p.y - 260, 0, p.y);
    g.addColorStop(0, 'rgba(255,220,120,0)');
    g.addColorStop(0.6, 'rgba(255,220,120,0.35)');
    g.addColorStop(1, 'rgba(255,240,190,0.75)');
    ctx.fillStyle = g;
    const w = 34 + Math.sin(now * 20) * 3;
    ctx.fillRect(p.x - w / 2, p.y - 260, w, 260);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(p.x - w / 8, p.y - 260, w / 4, 260);
    // rayos giratorios
    ctx.translate(p.x, p.y - 24);
    ctx.rotate(now * 1.2);
    ctx.fillStyle = 'rgba(255,215,110,0.22)';
    for (let i = 0; i < 10; i++) {
      ctx.rotate((Math.PI * 2) / 10);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(90, -7); ctx.lineTo(90, 7); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    glow(p.x, p.y - 20, 110, '255,210,110', a * 0.8);
  }
}

// ---------- Iluminación: oscurece la escena y "recorta" luces ----------
const LIGHT = { c: null, g: null, w: 0, h: 0 };
function renderLighting(lights, ambient) {
  const w = Math.ceil(W / 3), h = Math.ceil(H / 3);
  if (!LIGHT.c || LIGHT.w !== w || LIGHT.h !== h) {
    LIGHT.c = document.createElement('canvas');
    LIGHT.c.width = w; LIGHT.c.height = h;
    LIGHT.g = LIGHT.c.getContext('2d');
    LIGHT.w = w; LIGHT.h = h;
  }
  const g = LIGHT.g;
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.clearRect(0, 0, w, h);
  g.fillStyle = `rgba(14,5,10,${ambient})`;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-out';
  const tex = glowTex('255,255,255');
  for (const L of lights) {
    const r = L.r / 3;
    g.globalAlpha = L.a;
    g.drawImage(tex, L.x / 3 - r, L.y / 3 - r, r * 2, r * 2);
  }
  g.globalAlpha = 1;
  ctx.drawImage(LIGHT.c, 0, 0, W, H);
}
