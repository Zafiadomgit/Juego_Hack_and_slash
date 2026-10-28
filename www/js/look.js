/* Fendaria — aspecto «mundo abierto» al estilo Dofus:
 *  · cámara más alejada (personajes pequeños, mucho mundo alrededor),
 *  · ciclo de día y noche en Villa Candela con charcos de luz cálida,
 *  · suelo por manchas (tierra, pasto seco, empedrado, pasto oscuro) con borde irregular,
 *  · arbolitos de otoño repartidos por el pueblo.
 */
'use strict';

// ============================================================
// Cámara por escena
// ============================================================
const VIEW_UNITS = { hub: 560, rift: 380 }; // en las Grietas, más cerca: héroes y monstruos se leen mejor en el móvil
function setView(kind) {
  const u = VIEW_UNITS[kind];
  if (VIEW.units === u) return;
  VIEW.units = u;
  resize();
  VILLAGE.ground = null;
}
const _goHubL = goHub;
goHub = function () { setView('hub'); return _goHubL(); };
const _startNodeL = startNode;
startNode = function (b, n, d) { setView('rift'); return _startNodeL(b, n, d); };
setView('hub');

// ============================================================
// Día y noche en la villa (ciclo de 8 min; se empieza al atardecer)
// ============================================================
const DAY_CYCLE = 480, DAY_T0 = performance.now() / 1000 - 170;
// 0 = pleno día, 1 = noche cerrada
function nightK() {
  if (window.__nightK != null) return window.__nightK; // pruebas
  const t = ((performance.now() / 1000 - DAY_T0) % DAY_CYCLE) / DAY_CYCLE; // 0..1
  const k = t < 0.36 ? 0 : t < 0.48 ? (t - 0.36) / 0.12 : t < 0.86 ? 1 : 1 - (t - 0.86) / 0.14;
  return k * k * (3 - 2 * k);
}
const mixRGB = (a, b, k) => a.split(',').map((v, i) => Math.round(+v + (b.split(',')[i] - v) * k)).join(',');
const _renderLightingL = renderLighting;
renderLighting = function (lights, ambient, shade) {
  if (scene !== 'hub') return _renderLightingL(lights, ambient, shade);
  const k = nightK();
  const warm = (rgb) => rgb && rgb.startsWith('255,1') || (rgb && rgb.startsWith('255,2') && !rgb.startsWith('255,238'));
  const L = lights.map((l) => (warm(l.rgb)
    ? Object.assign({}, l, { a: Math.min(1, l.a * (0.55 + 0.75 * k)), r: l.r * (1 + 0.3 * k), haze: (l.haze || 0.15) * (0.6 + 1.2 * k) })
    : l));
  _renderLightingL(L, 0.4 + 0.76 * k, mixRGB('96,104,150', '30,42,104', k));
  if (k > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(70,90,170,${0.32 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } // tinte azul de noche
  // charcos de luz cálida sobre el suelo (lo que hace «Dofus de noche»)
  if (k > 0.05) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const l of L) if (warm(l.rgb) && l.r > 120 * zoom * 0.5) glow(l.x, l.y + l.r * 0.12, l.r * 0.55, '255,170,80', 0.22 * k * l.a);
    ctx.restore();
  }
};

// ============================================================
// Suelo por manchas
// ============================================================
// mancha de forma orgánica: contorno con ruido, relleno con textura y un borde algo más oscuro
function groundBlob(g, x, y, rx, ry, rnd) {
  const n = 16, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, j = 0.72 + rnd() * 0.42;
    pts.push([x + Math.cos(a) * rx * j, y + Math.sin(a) * ry * j]);
  }
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    if (i === 0) g.moveTo(mx, my); else g.quadraticCurveTo(p[0], p[1], mx, my);
  }
  const p0 = pts[0], q0 = pts[1];
  g.quadraticCurveTo(p0[0], p0[1], (p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2);
  g.closePath();
}
const texPat = (g, img, size) => {
  if (!img) return null;
  const p = g.createPattern(img, 'repeat');
  if (p.setTransform) p.setTransform(new DOMMatrix().scale(size / img.width));
  return p;
};
// kinds: [relleno, tinte, alfa del tinte, borde]
function paintPatches(g, rnd, area, count, kinds) {
  for (let i = 0; i < count; i++) {
    const K = kinds[Math.floor(rnd() * kinds.length)];
    const x = area.x0 + rnd() * area.w, y = area.y0 + rnd() * area.h;
    if (area.skip && area.skip(x, y)) continue;
    const rx = K.r[0] + rnd() * (K.r[1] - K.r[0]), ry = rx * (0.5 + rnd() * 0.2);
    g.save();
    groundBlob(g, x, y, rx, ry, rnd);
    if (K.rim) { g.strokeStyle = K.rim; g.lineWidth = 5; g.stroke(); }
    g.clip();
    if (K.fill) { g.fillStyle = K.fill; g.fillRect(x - rx * 1.3, y - ry * 1.3, rx * 2.6, ry * 2.6); }
    if (K.tint) {
      g.globalCompositeOperation = K.op || 'source-over';
      g.fillStyle = K.tint; g.fillRect(x - rx * 1.3, y - ry * 1.3, rx * 2.6, ry * 2.6);
      g.globalCompositeOperation = 'source-over';
    }
    // sombra interior en el borde de arriba: da relieve, como un hundimiento
    const sh = g.createLinearGradient(0, y - ry, 0, y - ry * 0.4);
    sh.addColorStop(0, 'rgba(20,14,8,0.28)'); sh.addColorStop(1, 'rgba(20,14,8,0)');
    g.fillStyle = sh; g.fillRect(x - rx * 1.3, y - ry * 1.3, rx * 2.6, ry);
    g.restore();
  }
}
// la villa: se llama desde villageGround antes de pintar caminos y plaza
function villagePatches(g) {
  const r = vRand(4242);
  const grass = texPat(g, GROUND_IMG.grass, 520), dirt = texPat(g, GROUND_IMG.path, 300), cob = texPat(g, GROUND_IMG.plaza, 280);
  const area = { x0: VG.x0, y0: VG.y0, w: VG.w, h: VG.h, skip: (x, y) => vInPlaza(x, y, 30) };
  paintPatches(g, r, area, 90, [
    { fill: dirt, rim: 'rgba(60,40,22,0.45)', r: [60, 140] },
    { fill: grass, tint: 'rgba(222,190,84,0.62)', rim: 'rgba(120,100,40,0.3)', r: [70, 170] }, // pasto seco
    { fill: grass, tint: 'rgba(190,166,66,0.5)', r: [50, 130] },
    { fill: dirt, tint: 'rgba(90,70,40,0.2)', rim: 'rgba(50,34,18,0.4)', r: [30, 80] },
    { fill: grass, tint: 'rgba(16,40,14,0.32)', r: [70, 170] }, // pasto oscuro
  ]);
  if (cob) paintPatches(g, r, area, 9, [{ fill: cob, rim: 'rgba(40,34,28,0.4)', r: [30, 70] }]); // restos de empedrado
}
// las Grietas: manchas deterministas por celda del mundo (sin cortes entre trozos)
function riftPatches(g, cx, cy, B) {
  if (rift && rift.isDungeon) return;
  // manchas suaves de color (claras y oscuras), difuminadas y sin borde: variación del suelo sin «pegatinas»
  for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
    let s = (gx * 48611 + gy * 96769 + 13) | 0;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < 4; i++) {
      const x = gx * CHUNK + rnd() * CHUNK, y = gy * CHUNK + rnd() * CHUNK, r = 90 + rnd() * 170, k = rnd() < 0.5 ? 0 : 1;
      const col = B.patch[k], a0 = k ? 0.32 : 0.26;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, col.replace(/[\d.]+\)$/, a0 + ')')); gr.addColorStop(0.6, col.replace(/[\d.]+\)$/, (a0 * 0.45).toFixed(3) + ')')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
      g.save(); g.translate(x, y); g.scale(1, 0.62); g.translate(-x, -y);
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      g.restore();
    }
  }
}

// ============================================================
// Arbolitos de otoño y bosque exterior de la villa
// ============================================================
const TINTS = { o: 'hue-rotate(-62deg) saturate(1.5) brightness(1.08)', r: 'hue-rotate(-92deg) saturate(1.6)', y: 'hue-rotate(-38deg) saturate(1.35) brightness(1.15)', p: 'hue-rotate(-128deg) saturate(1.1) brightness(1.1)' };
const tintedAtlas = {};
function villaTinted(t) {
  if (tintedAtlas[t] !== undefined) return tintedAtlas[t];
  const img = PROP_IMG.villa;
  if (!img) return null;
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  if (!('filter' in g)) return (tintedAtlas[t] = null);
  g.filter = TINTS[t]; g.drawImage(img, 0, 0);
  return (tintedAtlas[t] = c);
}
const _villaFrameL = villaFrame;
let frameTint = null;
villaFrame = function (kind, x, y) {
  const fr = _villaFrameL(kind, x, y);
  if (fr && frameTint) { const ti = villaTinted(frameTint); if (ti) fr.img = ti; }
  return fr;
};
const _drawVillaSpriteL = drawVillaSprite;
drawVillaSprite = function (o) {
  frameTint = o.tint || null;
  try { return _drawVillaSpriteL(o); } finally { frameTint = null; }
};
function lookProps() {
  const P_ = VILLAGE.props, SL = VILLAGE.solids, r = vRand(909);
  const ROOM = { house: 300, stall: 190, alchemy: 190, forge: 170, well: 120, lamp: 90 };
  const free = (x, y, d) => !P_.some((o) => o.kind !== 'tree' && dist(o.x, o.y, x, y) < Math.max(d, ROOM[o.kind] || 0)) && !NPCS.some((n) => dist(n.x, n.y, x, y) < 200);
  // bosque denso alrededor del pueblo: fuera de la zona caminable, sin tapar las calles que salen
  for (let k = 0, n = 0; k < 900 && n < 110; k++) {
    const x = VG.x0 + r() * VG.w, y = VG.y0 + 60 + r() * (VG.h - 60);
    const out = x < VB.x0 - 40 || x > VB.x1 + 40 || y < VB.y0 - 470 || y > VB.y1 + 200;
    if (!out || vRoadDist(x, y) < 40) continue;
    if (P_.some((o) => o.kind === 'tree' && dist(o.x, o.y, x, y) < 110)) continue;
    const tint = r() < 0.35 ? 'oyrp'[Math.floor(r() * 4)] : null;
    P_.push({ kind: 'tree', tk: 'oak', x, y, s: 0.9 + r() * 0.4, tint });
    n++;
  }
  // árboles sueltos dentro del pueblo, con color de otoño; nunca en calles ni en la plaza
  let placed = 0;
  for (let k = 0; k < 1200 && placed < 16; k++) {
    const x = VB.x0 + r() * (VB.x1 - VB.x0), y = VB.y0 - 380 + r() * (VB.y1 - VB.y0 + 380);
    if (vInPlaza(x, y, 120) || vRoadDist(x, y) < 70) continue;
    if (!free(x, y, 120)) continue;
    if (P_.some((o) => o.kind === 'tree' && dist(o.x, o.y, x, y) < 220)) continue;
    const tint = r() < 0.7 ? 'oyrp'[Math.floor(r() * 4)] : null;
    P_.push({ kind: 'tree', tk: 'oak', x, y, s: 0.55 + r() * 0.3, tint });
    SL.push({ x, y, r: 22 });
    placed++;
  }
}
const _buildVillageL = buildVillage;
buildVillage = function () {
  if (VILLAGE.built) return;
  _buildVillageL();
  lookProps();
};
if (VILLAGE.built) lookProps(); // la villa ya se construyó para el fondo del menú

// ============================================================
// Grietas con la densidad de la villa: muro de bosque en los bordes, arboledas y más luces cálidas
// ============================================================
const _genRiftL = genRift;
genRift = function () {
  _genRiftL();
  if (rift && rift.isDungeon) return;
  const b = curBiome(), cx = WORLD.w / 2, cy = WORLD.h / 2;
  const free = (x, y, d) => !obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + d);
  const tree = (x, y, s, r) => obstacles.push({ kind: 'tree', tk: b.tree, x, y, r, s, hue: Math.random() < 0.6 ? 1 : 0 });
  // muro de bosque en el borde (dos filas al tresbolillo; apenas estorban)
  for (let t = 0; t < WORLD.w; t += 95) for (const row of [0, 1]) {
    const o = 20 + row * 70, j = () => rand(-25, 25), s = () => rand(1.0, 1.5);
    tree(t + j() + row * 45, o + j(), s(), 10); tree(t + j() + row * 45, WORLD.h - o + j(), s(), 10);
    tree(o + j(), t + j() + row * 45, s(), 10); tree(WORLD.w - o + j(), t + j() + row * 45, s(), 10);
  }
  // arboledas: grupos apretados con un brasero o un cristal al lado (luz cálida como los faroles de la villa)
  const nG = b.tree === 'spire' ? 7 : 11;
  for (let g = 0; g < nG; g++) {
    let gx = 0, gy = 0, ok = false;
    for (let k = 0; k < 30 && !ok; k++) { gx = rand(300, WORLD.w - 300); gy = rand(300, WORLD.h - 300); ok = dist(gx, gy, cx, cy) > 420 && free(gx, gy, 160); }
    if (!ok) continue;
    const n = randi(5, 9);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), d = rand(0, 120), x = gx + Math.cos(a) * d, y = gy + Math.sin(a) * d * 0.7;
      if (free(x, y, 20)) tree(x, y, rand(0.85, 1.35), 20);
    }
    const a = rand(0, TAU), lx = gx + Math.cos(a) * 165, ly = gy + Math.sin(a) * 110;
    if (free(lx, ly, 30)) obstacles.push(Math.random() < 0.65 ? { kind: 'brazier', x: lx, y: ly, r: 11, ph: rand(0, 6) } : { kind: 'crystal', x: lx, y: ly, r: 13, s: rand(0.9, 1.3), hue: b.crystalHue ?? 0, ph: rand(0, 6) });
  }
};

// ============================================================
// Monstruos a la escala del héroe (≈104): cada uno según lo que es. «r» agranda dibujo y zona de golpe;
// «vis» agranda solo el dibujo (los humanoides son altos pero no anchos)
// ============================================================
const MON_SIZE = {
  tofu: [1.2], bouftou: [1.45], arakne: [1.35], pissenlit: [1.35], craqueleur: [1.25],
  cangrejo: [1.3], medusa: [1.35, 1.1], triton: [1.35, 1.3], duende: [1.35, 1.1], polilla: [1.35],
  golemC: [1.25], guardiaR: [1.4, 1.45], ojo: [1.3], sombraC: [1.35, 1.35],
};
for (const [t, [r, vis]] of Object.entries(MON_SIZE)) {
  const D = ENEMIES[t];
  if (!D || D.boss) continue;
  if (D.r) D.r = Math.round(D.r * r); else if (D.size) D.size = Math.round(D.size * r);
  if (vis) D.vis = vis;
}
