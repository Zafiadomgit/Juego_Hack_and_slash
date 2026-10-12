/* Fendaria — Villa Candela: pueblo caminable al estilo HD-2D.
 * El héroe pasea por la plaza; Brunilda (Mercader) vende equipo y Maese Ivo (Alquimista)
 * vende elixires y mejoras. El Portal Rúnico lleva a la Grieta elegida en el mapa.
 */
'use strict';

const VB = { x0: -640, x1: 640, y0: -400, y1: 440 }; // zona caminable
const VG = { x0: -760, y0: -540, w: 1520, h: 1120 }; // suelo pre-renderizado
const VILLAGE = { built: false, props: [], solids: [], npcs: [], lamps: [], windows: [], smoke: [], fx: [], ground: null, groundScale: 0 };
const vHero = { x: 0, y: 40, dir: Math.PI / 2, walkT: 0, moving: false, target: null, pending: null };
let vNear = null, vNearShown = undefined, vCam = { x: 0, y: 0 };

const NPCS = [
  { id: 'merchant', name: 'Brunilda', title: 'Mercader', x: -212, y: 132, prompt: '💬 Hablar con Brunilda · Equipo', color: '#ffcf7a' },
  { id: 'alchemist', name: 'Maese Ivo', title: 'Alquimista', x: 214, y: 132, prompt: '💬 Hablar con Maese Ivo · Elixires y mejoras', color: '#d9a8ff' },
];
const PORTAL = { x: 0, y: -80 };

function vRand(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

function buildVillage() {
  if (VILLAGE.built) return;
  VILLAGE.built = true;
  const P_ = VILLAGE.props, SL = VILLAGE.solids;
  const add = (o, r, oy = 0) => { P_.push(o); if (r) SL.push({ x: o.x, y: o.y + oy, r }); };
  const houses = [
    [-470, -250, 0], [-205, -320, 1], [215, -315, 2], [480, -245, 0], [-560, 245, 1], [565, 250, 2],
  ];
  for (const [x, y, v] of houses) { add({ kind: 'house', x, y, v }, 72, -22); VILLAGE.windows.push({ x: x - 36, y: y - 58 }, { x: x + 36, y: y - 58 }); VILLAGE.smoke.push({ x: x + 38, y: y - 150, t: Math.random() * 3 }); }
  add({ kind: 'stall', x: -300, y: 92 }, 58, -12);
  add({ kind: 'alchemy', x: 300, y: 92 }, 58, -12);
  add({ kind: 'cauldron', x: 372, y: 118 }, 20);
  add({ kind: 'well', x: -405, y: -40 }, 30);
  add({ kind: 'sign', x: 70, y: 235 }, 8);
  for (const [x, y] of [[-390, 110], [-372, 132], [-250, 150], [380, 150], [395, 128]]) add({ kind: 'barrel', x, y, v: (x * 7) & 1 }, 13);
  for (const [x, y] of [[-238, -40], [238, -40], [-130, 120], [130, 120], [-150, -205], [150, -205]]) { add({ kind: 'lamp', x, y }, 7); VILLAGE.lamps.push({ x, y: y - 62 }); }
  add({ kind: 'portalbase', x: PORTAL.x, y: PORTAL.y + 2 }, 42, -6);
  // vallas con flores al sur
  for (let x = -640; x <= -200; x += 44) add({ kind: 'fence', x, y: 310 });
  for (let x = 200; x <= 640; x += 44) add({ kind: 'fence', x, y: 310 });
  for (const [x, y] of [[-60, 280], [60, 330], [-470, 120], [470, 115], [-120, -300], [120, -290]]) add({ kind: 'bush', x, y, v: (x & 3) }, 16);
  // bosque alrededor
  const r = vRand(77);
  for (let i = 0; i < 60; i++) {
    const side = i % 4;
    let x, y;
    if (side === 0) { x = -760 + r() * 1520; y = -560 + r() * 130; }
    else if (side === 1) { x = -760 + r() * 1520; y = 450 + r() * 140; }
    else if (side === 2) { x = -790 + r() * 130; y = -500 + r() * 1000; }
    else { x = 660 + r() * 130; y = -500 + r() * 1000; }
    add({ kind: 'tree', tk: 'oak', x, y, s: 0.9 + r() * 0.45, hue: r() < 0.5 ? 1 : 0 }, 18);
  }
  for (const n of NPCS) { P_.push({ kind: 'npc', x: n.x, y: n.y, npc: n }); SL.push({ x: n.x, y: n.y, r: 14 }); }
}

// ---------- Suelo pintado (una sola vez) ----------
function villageGround() {
  const gs = HD2D.on ? zoom / hd2dPixSize() : Math.min(1.2, zoom * DPR);
  if (VILLAGE.ground && Math.abs(VILLAGE.groundScale - gs) < 0.01) return VILLAGE.ground;
  const c = document.createElement('canvas');
  c.width = Math.ceil(VG.w * gs); c.height = Math.ceil(VG.h * gs);
  const g = c.getContext('2d', { alpha: false });
  g.scale(gs, gs); g.translate(-VG.x0, -VG.y0);
  const pat = g.createPattern(biomeGroundTex(HUB_GROUND), 'repeat');
  if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(2.2));
  g.fillStyle = pat; g.fillRect(VG.x0, VG.y0, VG.w, VG.h);
  const r = vRand(1234);
  // manchas de césped claro y oscuro
  for (let i = 0; i < 40; i++) {
    const x = VG.x0 + r() * VG.w, y = VG.y0 + r() * VG.h, rr = 60 + r() * 140;
    const col = i % 2 ? 'rgba(150,190,80,0.22)' : 'rgba(30,60,25,0.25)';
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rr, rr * 0.6, 0, 0, TAU); g.fill();
  }
  // caminos de tierra
  const road = (pts, w) => {
    for (const [col, lw] of [['#5e4630', w + 10], ['#8a6a46', w], ['#9c7a52', w * 0.55]]) {
      g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
    }
  };
  road([[0, 60], [10, 220], [-10, 380], [0, 600]], 84);
  road([[-120, 60], [-300, 110], [-520, 140], [-800, 160]], 70);
  road([[120, 60], [300, 110], [520, 150], [800, 170]], 70);
  road([[-80, -150], [-200, -250], [-470, -200]], 50);
  road([[80, -150], [215, -255], [480, -200]], 50);
  for (let i = 0; i < 420; i++) { // piedrecitas del camino
    const x = -760 + r() * 1520, y = -540 + r() * 1120;
    g.fillStyle = r() < 0.5 ? 'rgba(60,40,24,0.35)' : 'rgba(200,170,120,0.25)';
    g.fillRect(x, y, 2 + r() * 3, 2 + r() * 2);
  }
  // plaza empedrada
  g.save();
  g.beginPath(); g.ellipse(0, -40, 270, 175, 0, 0, TAU); g.closePath();
  g.fillStyle = '#4a4238'; g.fill();
  g.clip();
  for (let y = -230; y < 150; y += 16) {
    const off = ((y / 16) & 1) * 13;
    for (let x = -300 + off; x < 300; x += 26) {
      const v = r();
      g.fillStyle = v < 0.33 ? '#a59a86' : v < 0.66 ? '#968a76' : '#b3a892';
      g.beginPath(); g.roundRect(x + 1.5, y + 1.5, 23 - r() * 3, 13 - r() * 2, 4); g.fill();
      g.fillStyle = 'rgba(255,255,240,0.18)'; g.fillRect(x + 4, y + 3, 12, 2);
    }
  }
  // musgo entre piedras
  for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(80,120,50,0.45)'; g.beginPath(); g.ellipse(-280 + r() * 560, -210 + r() * 350, 4 + r() * 8, 2 + r() * 3, 0, 0, TAU); g.fill(); }
  g.restore();
  g.lineWidth = 6; g.strokeStyle = '#6e6252';
  g.beginPath(); g.ellipse(0, -40, 272, 177, 0, 0, TAU); g.stroke();
  g.lineWidth = 2; g.strokeStyle = 'rgba(30,24,18,0.6)';
  g.beginPath(); g.ellipse(0, -40, 276, 181, 0, 0, TAU); g.stroke();
  // círculo rúnico bajo el portal
  g.strokeStyle = 'rgba(120,200,255,0.35)'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(0, -76, 92, 46, 0, 0, TAU); g.stroke();
  g.beginPath(); g.ellipse(0, -76, 70, 34, 0, 0, TAU); g.stroke();
  // flores y matas de hierba
  const flowers = ['#ff6b6b', '#ffd54f', '#ffffff', '#ce93d8', '#81d4fa'];
  for (let i = 0; i < 70; i++) {
    const cx = VG.x0 + 60 + r() * (VG.w - 120), cy = VG.y0 + 60 + r() * (VG.h - 120);
    if (Math.abs(cx) < 300 && cy > -230 && cy < 150) continue;
    const col = flowers[(r() * flowers.length) | 0];
    for (let k = 0; k < 7; k++) {
      const x = cx + (r() - 0.5) * 40, y = cy + (r() - 0.5) * 22;
      g.fillStyle = '#3e6b2a'; g.fillRect(x - 1, y - 1, 2, 5);
      g.fillStyle = col; g.beginPath(); g.arc(x, y - 2, 2.6, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x - 1, y - 3, 1.5, 1.5);
    }
  }
  const saved = ctx; ctx = g;
  try {
    for (let i = 0; i < 260; i++) {
      const x = VG.x0 + r() * VG.w, y = VG.y0 + r() * VG.h;
      if (Math.abs(x) < 290 && y > -225 && y < 145) continue;
      drawGrassTuft({ x, y, s: 0.8 + r() * 0.7, c: r() < 0.5 ? '#4f8a34' : '#3e7228', r: r() * 6 });
    }
  } finally { ctx = saved; }
  VILLAGE.ground = c; VILLAGE.groundScale = gs;
  return c;
}

// ---------- Edificios y objetos (sprites en caché) ----------
const ROOF = [['#a8452e', '#7a2e1c', '#c85a3c'], ['#41557a', '#2c3b58', '#5a72a0'], ['#4f6e3a', '#344d26', '#6a8c4c']];
function artHouse(v) {
  const g = ctx;
  g.lineJoin = 'round';
  const [rf, rd, rh] = ROOF[v];
  // base de piedra
  g.fillStyle = '#6b6258'; g.fillRect(-70, -18, 140, 18);
  for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#7d7468' : '#5e564c'; g.fillRect(-70 + i * 20, -18 + (i % 2) * 9, 19, 8); }
  // paredes de yeso con entramado
  g.fillStyle = '#e8dcc2'; g.fillRect(-64, -96, 128, 78);
  g.fillStyle = 'rgba(160,140,110,0.35)'; g.fillRect(-64, -96, 128, 8);
  g.fillStyle = '#5a3a22';
  for (const x of [-64, -22, 18, 58]) g.fillRect(x, -96, 6, 78);
  g.fillRect(-64, -60, 128, 5);
  g.save(); g.strokeStyle = '#5a3a22'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-58, -92); g.lineTo(-24, -62); g.moveTo(58, -92); g.lineTo(24, -62); g.stroke(); g.restore();
  // puerta
  g.fillStyle = '#3a2416'; g.beginPath(); g.moveTo(-14, -18); g.lineTo(-14, -48); g.quadraticCurveTo(0, -60, 14, -48); g.lineTo(14, -18); g.fill();
  g.fillStyle = '#6e4628'; g.beginPath(); g.moveTo(-11, -18); g.lineTo(-11, -46); g.quadraticCurveTo(0, -56, 11, -46); g.lineTo(11, -18); g.fill();
  g.fillStyle = '#4a2e1a'; g.fillRect(-1, -52, 2, 34);
  g.fillStyle = '#e8b64c'; g.fillRect(6, -34, 3, 3);
  // ventanas con luz cálida
  for (const x of [-44, 30]) {
    g.fillStyle = '#3a2416'; g.fillRect(x - 3, -55, 22, 24);
    g.fillStyle = '#ffd27a'; g.fillRect(x, -52, 16, 18);
    g.fillStyle = '#fff1c0'; g.fillRect(x + 2, -50, 5, 6);
    g.fillStyle = '#3a2416'; g.fillRect(x + 7, -52, 2, 18); g.fillRect(x, -44, 16, 2);
    g.fillStyle = '#4a7a3a'; g.fillRect(x - 2, -32, 20, 6);
    g.fillStyle = '#ff7a8a'; for (let k = 0; k < 4; k++) g.fillRect(x + k * 5, -35, 3, 3);
  }
  // tejado de tejas a dos aguas
  g.fillStyle = rd;
  g.beginPath(); g.moveTo(-84, -90); g.lineTo(0, -168); g.lineTo(84, -90); g.closePath(); g.fill();
  g.fillStyle = rf;
  g.beginPath(); g.moveTo(-78, -94); g.lineTo(0, -162); g.lineTo(78, -94); g.closePath(); g.fill();
  g.strokeStyle = rd; g.lineWidth = 2;
  for (let k = 1; k < 7; k++) {
    const y = -94 - k * 10, hw = 78 - k * 11.5;
    g.beginPath(); g.moveTo(-hw, y); g.lineTo(hw, y); g.stroke();
    for (let x = -hw + 6; x < hw; x += 12) { g.beginPath(); g.moveTo(x + ((k & 1) ? 6 : 0), y); g.lineTo(x + ((k & 1) ? 6 : 0), y + 10); g.stroke(); }
  }
  g.fillStyle = rh; g.beginPath(); g.moveTo(-20, -142); g.lineTo(0, -162); g.lineTo(6, -156); g.lineTo(-14, -136); g.closePath(); g.fill();
  // aleros
  g.fillStyle = '#3a2416'; g.fillRect(-86, -92, 172, 5);
  // chimenea
  g.fillStyle = '#6b6258'; g.fillRect(30, -150, 16, 36);
  g.fillStyle = '#857a6c'; g.fillRect(28, -154, 20, 6);
  g.fillStyle = '#4a4238'; g.fillRect(30, -140, 16, 3);
  // ventanuco del desván
  g.fillStyle = '#3a2416'; g.beginPath(); g.arc(0, -118, 10, 0, TAU); g.fill();
  g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(0, -118, 7, 0, TAU); g.fill();
  g.fillStyle = '#3a2416'; g.fillRect(-1, -125, 2, 14); g.fillRect(-7, -119, 14, 2);
}

function artStall() {
  const g = ctx;
  // postes
  g.fillStyle = '#4a2e1a'; for (const x of [-62, 58]) g.fillRect(x, -96, 6, 96);
  // mostrador
  g.fillStyle = '#6e4628'; g.fillRect(-66, -36, 132, 36);
  g.fillStyle = '#8a5a34'; for (let i = 0; i < 6; i++) g.fillRect(-66, -36 + i * 6, 132, 3);
  g.fillStyle = '#a8784a'; g.fillRect(-70, -40, 140, 6);
  g.fillStyle = '#3a2416'; g.fillRect(-70, -34, 140, 2);
  // género: cajas de manzanas, espada, escudo, pociones
  g.fillStyle = '#7a5230'; g.fillRect(-58, -54, 30, 14);
  g.fillStyle = '#d83a2e'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-54 + i * 6, -55, 3.4, 0, TAU); g.fill(); }
  g.fillStyle = '#ffe6a0'; g.fillRect(-52, -58, 2, 2);
  g.fillStyle = '#9aa4ae'; g.save(); g.translate(-8, -44); g.rotate(-0.5); g.fillRect(-2, -26, 4, 28); g.fillStyle = '#e8b64c'; g.fillRect(-7, 0, 14, 3); g.fillStyle = '#5a3a22'; g.fillRect(-2, 3, 4, 7); g.restore();
  g.fillStyle = '#41557a'; g.beginPath(); g.moveTo(14, -58); g.lineTo(34, -58); g.lineTo(34, -46); g.quadraticCurveTo(24, -36, 14, -46); g.closePath(); g.fill();
  g.fillStyle = '#e8b64c'; g.fillRect(22, -56, 4, 14);
  for (const [x, c] of [[44, '#d83a2e'], [52, '#4fc3f7'], [60, '#7cc457']]) { g.fillStyle = c; g.fillRect(x - 3, -50, 6, 10); g.fillStyle = '#e8dcc2'; g.fillRect(x - 1.5, -53, 3, 3); }
  // toldo a rayas
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#efe6d0' : '#c0392b';
    g.beginPath(); g.moveTo(-78 + i * 19.5, -96); g.lineTo(-74 + i * 19.5, -128); g.lineTo(-54.5 + i * 19.5, -128); g.lineTo(-58.5 + i * 19.5, -96); g.closePath(); g.fill();
    g.beginPath(); g.arc(-68.25 + i * 19.5, -96, 9.75, 0, Math.PI); g.fill();
  }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-74, -128, 148, 5);
  g.fillStyle = '#4a2e1a'; g.fillRect(-80, -131, 160, 4);
  // cartel colgante
  g.fillStyle = '#3a2416'; g.fillRect(-18, -150, 36, 18);
  g.fillStyle = '#e8b64c'; g.beginPath(); g.moveTo(-6, -137); g.lineTo(0, -146); g.lineTo(6, -137); g.closePath(); g.fill();
  g.fillRect(-1, -140, 2, 5);
}

function artAlchemy() {
  const g = ctx;
  // carpa morada con estrellas
  g.fillStyle = '#3a2350';
  g.beginPath(); g.moveTo(-78, -40); g.lineTo(0, -150); g.lineTo(78, -40); g.closePath(); g.fill();
  g.fillStyle = '#5a3478';
  g.beginPath(); g.moveTo(-70, -42); g.lineTo(0, -144); g.lineTo(70, -42); g.closePath(); g.fill();
  g.fillStyle = '#7a4aa0'; g.beginPath(); g.moveTo(-8, -134); g.lineTo(0, -144); g.lineTo(-30, -60); g.lineTo(-40, -60); g.closePath(); g.fill();
  g.fillStyle = '#ffe08a';
  for (const [x, y] of [[-30, -80], [18, -100], [30, -64], [-8, -116], [-46, -54]]) { g.fillRect(x - 1, y - 3, 2, 6); g.fillRect(x - 3, y - 1, 6, 2); }
  // abertura oscura y estantería
  g.fillStyle = '#1a1024'; g.beginPath(); g.moveTo(-34, -40); g.lineTo(0, -108); g.lineTo(34, -40); g.closePath(); g.fill();
  g.fillStyle = '#5a3a22'; g.fillRect(-26, -70, 52, 3); g.fillRect(-20, -52, 40, 3);
  const cols = ['#7cc457', '#ff5a8a', '#4fc3f7', '#ffd54f', '#c07cf0', '#ff8a3d'];
  for (let i = 0; i < 6; i++) { g.fillStyle = cols[i]; g.fillRect(-22 + i * 8, -80, 5, 10); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-21 + i * 8, -78, 1.5, 4); }
  for (let i = 0; i < 4; i++) { g.fillStyle = cols[5 - i]; g.beginPath(); g.arc(-14 + i * 9, -58, 4, 0, TAU); g.fill(); }
  // mesa
  g.fillStyle = '#6e4628'; g.fillRect(-60, -34, 120, 34);
  g.fillStyle = '#8a5a34'; for (let i = 0; i < 5; i++) g.fillRect(-60, -34 + i * 7, 120, 3);
  g.fillStyle = '#4a2e5a'; g.fillRect(-64, -40, 128, 8);
  g.fillStyle = '#e8b64c'; for (let x = -60; x < 64; x += 12) g.fillRect(x, -33, 6, 4);
  // libros y cristal sobre la mesa
  g.fillStyle = '#8a2e2e'; g.fillRect(-52, -50, 18, 10); g.fillStyle = '#2e4a8a'; g.fillRect(-50, -56, 16, 6);
  g.fillStyle = '#e8dcc2'; g.fillRect(-50, -48, 14, 2);
  g.fillStyle = '#7fd4f0'; g.beginPath(); g.moveTo(40, -40); g.lineTo(46, -58); g.lineTo(52, -40); g.closePath(); g.fill();
  g.fillStyle = '#e0f8ff'; g.fillRect(44, -52, 2, 6);
  // banderín
  g.fillStyle = '#4a2e1a'; g.fillRect(-1, -168, 2, 22);
  g.fillStyle = '#7cc457'; g.beginPath(); g.moveTo(1, -168); g.lineTo(18, -162); g.lineTo(1, -156); g.closePath(); g.fill();
}

function artWell() {
  const g = ctx;
  g.fillStyle = '#4a2e1a'; g.fillRect(-26, -78, 5, 60); g.fillRect(21, -78, 5, 60);
  g.fillStyle = '#7a3a2a'; g.beginPath(); g.moveTo(-36, -74); g.lineTo(0, -98); g.lineTo(36, -74); g.closePath(); g.fill();
  g.fillStyle = '#a8452e'; g.beginPath(); g.moveTo(-30, -76); g.lineTo(0, -94); g.lineTo(30, -76); g.closePath(); g.fill();
  g.fillStyle = '#5a3a22'; g.fillRect(-22, -62, 44, 4);
  g.strokeStyle = '#8a7a5a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -60); g.lineTo(0, -46); g.stroke();
  g.fillStyle = '#6e4628'; g.fillRect(-5, -46, 10, 8);
  g.fillStyle = '#6b6258'; g.beginPath(); g.ellipse(0, -16, 30, 12, 0, 0, TAU); g.fill();
  g.fillRect(-30, -16, 60, 16);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#857a6c' : '#5e564c'; g.fillRect(-30 + i * 10, -14 + (i % 2) * 7, 9, 6); }
  g.fillStyle = '#857a6c'; g.beginPath(); g.ellipse(0, -18, 30, 11, 0, 0, TAU); g.fill();
  g.fillStyle = '#1a2a3a'; g.beginPath(); g.ellipse(0, -18, 22, 7, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(140,200,255,0.4)'; g.fillRect(-8, -20, 10, 2);
}

function artLamp() {
  const g = ctx;
  g.fillStyle = '#2a2a30'; g.fillRect(-2, -58, 4, 58); g.fillRect(-6, -4, 12, 4);
  g.fillRect(-2, -62, 14, 3);
  g.fillStyle = '#3a3a44'; g.fillRect(6, -66, 10, 3);
  g.fillStyle = '#ffd27a'; g.fillRect(7, -62, 8, 10);
  g.fillStyle = '#fff3c4'; g.fillRect(9, -60, 3, 5);
  g.fillStyle = '#2a2a30'; g.fillRect(7, -52, 8, 2); g.fillRect(10, -62, 2, 10);
}

function artBarrel(v) {
  const g = ctx;
  if (v) { // caja de madera
    g.fillStyle = '#8a5a34'; g.fillRect(-14, -24, 28, 24);
    g.fillStyle = '#6e4628'; g.fillRect(-14, -24, 28, 3); g.fillRect(-14, -3, 28, 3); g.fillRect(-14, -24, 3, 24); g.fillRect(11, -24, 3, 24);
    g.save(); g.strokeStyle = '#6e4628'; g.lineWidth = 3; g.beginPath(); g.moveTo(-12, -22); g.lineTo(12, -2); g.stroke(); g.restore();
    return;
  }
  g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(0, -14, 13, 15, 0, 0, TAU); g.fill();
  g.fillRect(-13, -26, 26, 24);
  g.fillStyle = '#9a6a3a'; g.fillRect(-6, -27, 6, 26);
  g.fillStyle = '#3a3a44'; g.fillRect(-13, -22, 26, 3); g.fillRect(-13, -8, 26, 3);
  g.fillStyle = '#5a3a22'; g.beginPath(); g.ellipse(0, -27, 12, 4, 0, 0, TAU); g.fill();
}

function artFence() {
  const g = ctx;
  g.fillStyle = '#6e4628';
  g.fillRect(-23, -24, 46, 4); g.fillRect(-23, -13, 46, 4);
  g.fillStyle = '#5a3a22'; g.fillRect(-22, -30, 6, 30);
  g.fillStyle = '#8a5a34'; g.fillRect(-21, -31, 4, 2);
}

function artBush(v) {
  const g = ctx;
  const c = [['#2f5a24', '#3e7a2e', '#5a9a3a'], ['#2a5030', '#38703e', '#52944e']][v & 1];
  for (const [x, y, r, k] of [[-12, -12, 13, 0], [12, -12, 13, 0], [0, -20, 15, 1], [-6, -16, 9, 2], [8, -22, 7, 2]]) { g.fillStyle = c[k]; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  if (v & 2) { g.fillStyle = '#ff6b8a'; for (const [x, y] of [[-10, -18], [6, -26], [12, -12], [-2, -10]]) g.fillRect(x, y, 3, 3); }
}

function artSign() {
  const g = ctx;
  g.fillStyle = '#5a3a22'; g.fillRect(-3, -60, 6, 60);
  g.fillStyle = '#8a5a34'; g.beginPath(); g.moveTo(-34, -58); g.lineTo(26, -58); g.lineTo(36, -50); g.lineTo(26, -42); g.lineTo(-34, -42); g.closePath(); g.fill();
  g.fillStyle = '#3a2416'; g.fillRect(-26, -51, 40, 2);
}

function artCauldronBase() {
  const g = ctx;
  g.fillStyle = '#3a3a44'; g.fillRect(-14, -6, 4, 6); g.fillRect(10, -6, 4, 6);
  g.fillStyle = '#22222a'; g.beginPath(); g.ellipse(0, -16, 20, 15, 0, 0, TAU); g.fill();
  g.fillStyle = '#3a3a48'; g.beginPath(); g.ellipse(-6, -20, 7, 5, 0, 0, TAU); g.fill();
  g.fillStyle = '#2a2a34'; g.beginPath(); g.ellipse(0, -28, 20, 6, 0, 0, TAU); g.fill();
}

function artPortalBase() {
  const g = ctx;
  for (const [ry, col] of [[30, '#5e564c'], [26, '#857a6c'], [22, '#9a9080']]) { g.fillStyle = col; g.beginPath(); g.ellipse(0, -(30 - ry) * 0.8, ry * 2.3, ry, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#6b6258';
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; g.fillRect(Math.cos(a) * 62 - 5, -4 + Math.sin(a) * 25 - 3, 10, 6); }
}

// ---------- Personajes no jugables ----------
function artMerchant(p) {
  const g = ctx;
  const bob = Math.sin(p * TAU) * 1.2;
  const wave = Math.max(0, Math.sin(p * TAU * 2)) * (p > 0.5 ? 1 : 0);
  g.translate(0, -bob);
  // falda y delantal
  g.fillStyle = '#7a3a2a'; g.beginPath(); g.moveTo(-14, -26); g.lineTo(-16, 0); g.lineTo(16, 0); g.lineTo(14, -26); g.closePath(); g.fill();
  g.fillStyle = '#efe6d0'; g.beginPath(); g.moveTo(-9, -30); g.lineTo(-10, -2); g.lineTo(10, -2); g.lineTo(9, -30); g.closePath(); g.fill();
  g.fillStyle = '#d8ccb2'; g.fillRect(-9, -18, 18, 2);
  // cuerpo
  g.fillStyle = '#4a7a3a'; g.beginPath(); g.ellipse(0, -34, 14, 12, 0, 0, TAU); g.fill();
  g.fillStyle = '#efe6d0'; g.fillRect(-6, -44, 12, 8);
  // brazos (uno saluda)
  g.fillStyle = '#f0c8a0';
  g.save(); g.translate(-13, -38); g.rotate(0.25); g.fillStyle = '#4a7a3a'; g.fillRect(-3, 0, 6, 12); g.fillStyle = '#f0c8a0'; g.fillRect(-3, 11, 6, 5); g.restore();
  g.save(); g.translate(13, -38); g.rotate(-0.3 - wave * 2.2); g.fillStyle = '#4a7a3a'; g.fillRect(-3, 0, 6, 12); g.fillStyle = '#f0c8a0'; g.fillRect(-3, 11, 6, 5); g.restore();
  // cabeza
  g.fillStyle = '#f0c8a0'; g.beginPath(); g.ellipse(0, -54, 10, 11, 0, 0, TAU); g.fill();
  g.fillStyle = '#e89a8a'; g.fillRect(-7, -51, 3, 2); g.fillRect(4, -51, 3, 2);
  g.fillStyle = '#2a1a10'; g.fillRect(-5, -56, 2, 3); g.fillRect(3, -56, 2, 3);
  g.fillStyle = '#8a3a2a'; g.fillRect(-3, -48, 6, 1.5);
  // pelo y pañuelo
  g.fillStyle = '#8a4a2a'; g.beginPath(); g.ellipse(0, -60, 11, 7, 0, Math.PI, 0); g.fill();
  g.fillRect(-11, -60, 4, 10); g.fillRect(7, -60, 4, 10);
  g.fillStyle = '#c0392b'; g.beginPath(); g.ellipse(0, -63, 11, 5, 0, Math.PI, 0); g.fill();
  g.fillRect(-11, -63, 22, 3);
  g.fillStyle = '#efe6d0'; for (let x = -8; x < 10; x += 5) g.fillRect(x, -65, 2, 2);
  g.fillStyle = '#8a4a2a'; g.beginPath(); g.arc(11, -60, 5, 0, TAU); g.fill(); // moño
}

function artAlchemist(p) {
  const g = ctx;
  const bob = Math.sin(p * TAU) * 1.2;
  g.translate(0, -bob);
  // túnica
  g.fillStyle = '#3a2350'; g.beginPath(); g.moveTo(-12, -40); g.lineTo(-18, 0); g.lineTo(18, 0); g.lineTo(12, -40); g.closePath(); g.fill();
  g.fillStyle = '#5a3478'; g.beginPath(); g.moveTo(-6, -40); g.lineTo(-8, 0); g.lineTo(8, 0); g.lineTo(6, -40); g.closePath(); g.fill();
  g.fillStyle = '#e8b64c'; g.fillRect(-16, -4, 32, 3); g.fillRect(-12, -30, 24, 3);
  // brazo con matraz brillante
  const glow = 0.6 + Math.sin(p * TAU * 2) * 0.4;
  g.fillStyle = '#5a3478'; g.save(); g.translate(12, -36); g.rotate(-0.6); g.fillRect(-3, 0, 7, 14); g.restore();
  g.fillStyle = '#e8d0b0'; g.fillRect(18, -30, 5, 5);
  g.fillStyle = `rgba(140,255,120,${0.35 * glow})`; g.beginPath(); g.arc(22, -34, 9, 0, TAU); g.fill();
  g.fillStyle = '#9dff7a'; g.beginPath(); g.arc(22, -34, 5, 0, TAU); g.fill();
  g.fillStyle = '#e0f8ff'; g.fillRect(21, -42, 3, 5);
  g.fillStyle = '#5a3478'; g.save(); g.translate(-12, -36); g.rotate(0.3); g.fillRect(-4, 0, 7, 14); g.restore();
  // cara y barba
  g.fillStyle = '#e8d0b0'; g.beginPath(); g.ellipse(0, -50, 9, 9, 0, 0, TAU); g.fill();
  g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(-8, -48); g.quadraticCurveTo(0, -18, 8, -48); g.closePath(); g.fill();
  g.fillStyle = '#d0d0d8'; g.fillRect(-1, -44, 2, 16);
  g.fillStyle = '#2a1a10'; g.fillRect(-5, -53, 2, 2); g.fillRect(3, -53, 2, 2);
  g.fillStyle = '#ffe08a'; g.fillRect(-7, -54, 5, 1); g.fillRect(2, -54, 5, 1); // gafas
  g.fillStyle = '#f2f2f2'; g.fillRect(-7, -56, 5, 2); g.fillRect(2, -56, 5, 2); // cejas
  // sombrero puntiagudo
  g.fillStyle = '#3a2350'; g.beginPath(); g.ellipse(0, -58, 16, 4, 0, 0, TAU); g.fill();
  g.fillStyle = '#5a3478'; g.beginPath(); g.moveTo(-10, -58); g.quadraticCurveTo(-2, -78, 10, -92); g.quadraticCurveTo(4, -76, 10, -58); g.closePath(); g.fill();
  g.fillStyle = '#e8b64c'; g.fillRect(-10, -62, 20, 3);
  g.fillStyle = '#ffe08a'; g.fillRect(0, -76, 2, 2); g.fillRect(4, -84, 2, 2);
}

const V_ART = {
  house: (o) => ['vh' + o.v, 176, 180, 88, 172, () => artHouse(o.v)],
  stall: () => ['vstall', 172, 160, 86, 154, artStall],
  alchemy: () => ['valch', 172, 176, 86, 170, artAlchemy],
  well: () => ['vwell', 80, 104, 40, 100, artWell],
  lamp: () => ['vlamp', 30, 72, 10, 70, artLamp],
  barrel: (o) => ['vbar' + o.v, 32, 34, 16, 31, () => artBarrel(o.v)],
  fence: () => ['vfence', 50, 36, 25, 33, artFence],
  bush: (o) => ['vbush' + o.v, 46, 40, 23, 37, () => artBush(o.v)],
  sign: () => ['vsign', 76, 66, 38, 63, artSign],
  cauldron: () => ['vcaul', 46, 40, 23, 37, artCauldronBase],
  portalbase: () => ['vpbase', 150, 70, 75, 40, artPortalBase],
};

function drawVillageProp(o) {
  if (o.kind === 'tree') { drawTree(o); return; }
  if (o.kind === 'npc') { drawNpc(o.npc); return; }
  const A = V_ART[o.kind](o);
  if (o.kind !== 'portalbase' && o.kind !== 'fence') shadow(o.x, o.y + 1, A[1] * 0.35);
  ctx.save();
  ctx.translate(o.x, o.y);
  sprite(A[0], A[1], A[2], A[3], A[4], A[5]);
  ctx.restore();
  if (o.kind === 'cauldron') {
    // burbujas verdes (animadas)
    const t = now * 3;
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = '#7dff5a'; ctx.beginPath(); ctx.ellipse(0, -28, 16, 4, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) { const k = (t + i * 0.7) % 2; ctx.fillStyle = `rgba(170,255,140,${1 - k / 2})`; ctx.beginPath(); ctx.arc(-8 + i * 8, -30 - k * 12, 2.5, 0, TAU); ctx.fill(); }
    ctx.restore();
    glow(o.x, o.y - 30, 40, '120,255,100', 0.45 + Math.sin(t) * 0.1);
  }
  if (o.kind === 'lamp') glow(o.x + 11, o.y - 57, 34, '255,200,110', 0.55 + Math.sin(now * 5 + o.x) * 0.05);
}

function drawNpc(n) {
  const fi = Math.floor(((now * 0.35 + n.x * 0.01) % 1 + 1) % 1 * 8);
  shadow(n.x, n.y + 1, 15);
  ctx.save();
  ctx.translate(n.x, n.y);
  if (vHero.x > n.x + 20) ctx.scale(-1, 1); // mira hacia el héroe
  sprite('npc|' + n.id + '|' + fi, 60, 100, 30, 96, () => (n.id === 'merchant' ? artMerchant : artAlchemist)(fi / 8));
  ctx.restore();
  // nombre e indicador flotante
  const bob = Math.sin(now * 3 + n.x) * 3;
  const near = vNear === n;
  text(n.name, n.x, n.y - 94 + bob, near ? 13 : 11, n.color, 'center', 800);
  text(n.title, n.x, n.y - 82 + bob, 9, '#efece2', 'center', 700);
  if (!near) { ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(n.x, n.y - 110 + bob, 6, 0, TAU); ctx.fill(); text('!', n.x, n.y - 110 + bob, 10, '#2a1a0c', 'center', 900, false); }
}

// ---------- Lógica ----------
function villageReset() {
  vHero.x = 0; vHero.y = 40; vHero.dir = Math.PI / 2; vHero.target = null; vHero.pending = null; vHero.moving = false;
  vCam.x = 0; vCam.y = -20;
  vNear = null; vNearShown = undefined;
}

function villageTap(sx, sy) {
  const hz = zoom;
  const wx = (sx - W / 2) / hz + vCam.x, wy = (sy - H / 2) / hz + vCam.y;
  for (const n of NPCS) if (Math.abs(wx - n.x) < 34 && wy > n.y - 100 && wy < n.y + 14) { vHero.target = { x: n.x + (vHero.x < n.x ? -34 : 34), y: n.y + 26 }; vHero.pending = n; return; } // se coloca a su lado
  if (dist(wx, wy, PORTAL.x, PORTAL.y - 40) < 50) { vHero.target = { x: PORTAL.x, y: PORTAL.y + 44 }; vHero.pending = 'portal'; return; }
  vHero.target = { x: clamp(wx, VB.x0, VB.x1), y: clamp(wy, VB.y0, VB.y1) }; vHero.pending = null;
}

function villageInteract(what) {
  if (!what) return;
  vHero.target = null; vHero.pending = null;
  if (what === 'portal') { const s2 = mapSel(); persist(); startNode(s2.b, s2.n, s2.d); return; }
  openShop(what.id);
}

function updateVillage(dt) {
  buildVillage();
  readKeyboard();
  let mx = input.mx, my = input.my;
  if (mx || my) { vHero.target = null; vHero.pending = null; }
  else if (vHero.target) {
    const dx = vHero.target.x - vHero.x, dy = vHero.target.y - vHero.y, d = Math.hypot(dx, dy);
    if (d < 6) {
      const p = vHero.pending; vHero.target = null; vHero.pending = null;
      if (p) { villageInteract(p); return; }
    } else { mx = dx / d; my = dy / d; }
  }
  vHero.moving = !!(mx || my);
  if (vHero.moving) {
    const sp = 175;
    vHero.x += mx * sp * dt; vHero.y += my * sp * dt;
    vHero.walkT += dt;
    vHero.dir = Math.atan2(my, mx);
    for (const s of VILLAGE.solids) {
      const dx = vHero.x - s.x, dy = vHero.y - s.y, rr = s.r + 12, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr) { const d = Math.sqrt(d2) || 0.01; vHero.x = s.x + (dx / d) * rr; vHero.y = s.y + (dy / d) * rr; }
    }
    vHero.x = clamp(vHero.x, VB.x0, VB.x1); vHero.y = clamp(vHero.y, VB.y0, VB.y1);
  }
  // ¿junto a alguien?
  vNear = null;
  for (const n of NPCS) if (dist(vHero.x, vHero.y, n.x, n.y + 10) < 80) vNear = n;
  if (!vNear && dist(vHero.x, vHero.y, PORTAL.x, PORTAL.y + 30) < 80) vNear = 'portal';
  if (vNear !== vNearShown) { vNearShown = vNear; updateHubPrompt(); }
  vCam.x = lerp(vCam.x, clamp(vHero.x, VB.x0 + 200, VB.x1 - 200), 1 - Math.exp(-6 * dt));
  vCam.y = lerp(vCam.y, clamp(vHero.y - 30, VB.y0 + 80, VB.y1 - 120), 1 - Math.exp(-6 * dt));
  // humo de chimeneas y luciérnagas
  for (const s of VILLAGE.smoke) {
    s.t -= dt;
    if (s.t <= 0) { s.t = 0.35 + Math.random() * 0.3; VILLAGE.fx.push({ k: 'smoke', x: s.x + rand(-3, 3), y: s.y, vx: rand(4, 14), vy: rand(-26, -18), life: 3, max: 3, r: rand(5, 8) }); }
  }
  if (Math.random() < dt * 3) VILLAGE.fx.push({ k: 'fly', x: rand(VB.x0, VB.x1), y: rand(VB.y0, VB.y1), vx: rand(-12, 12), vy: rand(-12, 12), life: 4, max: 4, r: 3 });
  for (const f of VILLAGE.fx) { f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.k === 'smoke') f.r += dt * 6; else { f.vx += rand(-30, 30) * dt; f.vy += rand(-30, 30) * dt; } }
  VILLAGE.fx = VILLAGE.fx.filter((f) => f.life > 0);
  if (VILLAGE.fx.length > 160) VILLAGE.fx.splice(0, VILLAGE.fx.length - 160);
}

// ---------- Render ----------
function renderVillage() {
  buildVillage();
  const hz = zoom;
  if (state === 'menu') { vCam.x = lerp(vCam.x, Math.sin(now * 0.05) * 200, 0.02); vCam.y = lerp(vCam.y, -60, 0.02); }
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(hz, hz);
  const snap = HD2D.active ? HD2D.pix / hz : 0;
  const cx = snap ? Math.round(vCam.x / snap) * snap : vCam.x, cy = snap ? Math.round(vCam.y / snap) * snap : vCam.y;
  ctx.translate(-cx, -cy);
  ctx.drawImage(villageGround(), VG.x0, VG.y0, VG.w, VG.h);
  const vw = W / hz / 2 + 120, vh = H / hz / 2 + 200;
  const list = [];
  for (const o of VILLAGE.props) if (Math.abs(o.x - cx) < vw && Math.abs(o.y - cy) < vh) list.push(o);
  const heroO = { kind: 'hero', y: vHero.y };
  const portalO = { kind: 'portal', y: PORTAL.y + 4 };
  if (S) list.push(heroO);
  list.push(portalO);
  list.sort((a, b) => a.y - b.y);
  for (const o of list) {
    if (o === heroO) {
      shadow(vHero.x, vHero.y + 1, 13);
      drawHero(ctx, S.cls, { x: vHero.x, y: vHero.y, dir: vHero.dir, walkT: vHero.walkT, moving: vHero.moving, swing: 0, swingSide: 1, shot: 0, t: now });
    } else if (o === portalO) drawPortal(PORTAL.x, PORTAL.y, now);
    else drawVillageProp(o);
  }
  // ventanas encendidas y chispas del portal
  for (const w of VILLAGE.windows) glow(w.x + 8, w.y + 9, 26, '255,190,90', 0.35);
  glow(PORTAL.x, PORTAL.y - 46, 70, '110,200,255', 0.5 + Math.sin(now * 2) * 0.1);
  for (const f of VILLAGE.fx) {
    const a = f.life / f.max;
    if (f.k === 'smoke') { ctx.globalAlpha = 0.35 * a; circle(f.x, f.y, f.r, '#c8c4c0'); }
    else glow(f.x, f.y, 10, '255,240,140', Math.min(1, a * 2) * (0.5 + Math.sin(now * 6 + f.x) * 0.3));
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  hd2dEndWorld(0.26);
  // luz de atardecer: faroles, ventanas, portal y caldero iluminan
  const toS = (x, y) => ({ x: (x - cx) * hz + W / 2, y: (y - cy) * hz + H / 2 });
  const lights = [];
  if (S) { const q = toS(vHero.x, vHero.y - 20); lights.push({ x: q.x, y: q.y, r: 220 * hz, a: 0.85 }); }
  for (const l of VILLAGE.lamps) { const q = toS(l.x + 11, l.y + 5); lights.push({ x: q.x, y: q.y, r: 190 * hz, a: 0.95 }); }
  for (const w of VILLAGE.windows) { const q = toS(w.x + 8, w.y + 20); lights.push({ x: q.x, y: q.y, r: 90 * hz, a: 0.7 }); }
  { const q = toS(PORTAL.x, PORTAL.y - 40); lights.push({ x: q.x, y: q.y, r: 260 * hz, a: 1 }); }
  { const q = toS(372, 90); lights.push({ x: q.x, y: q.y, r: 140 * hz, a: 0.9 }); }
  for (const n of NPCS) { const q = toS(n.x, n.y - 40); lights.push({ x: q.x, y: q.y, r: 170 * hz, a: 0.8 }); }
  renderLighting(lights, 0.42);
  ctx.fillStyle = 'rgba(255,150,80,0.08)'; ctx.fillRect(0, 0, W, H); // tono cálido de atardecer
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,0.45)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  hd2dFlushText();
  if (input.joy) {
    const j = input.joy;
    circle(j.ox, j.oy, 52 * ui, 'rgba(10,14,28,0.35)', 'rgba(236,209,138,0.5)', 2);
    circle(j.x, j.y, 22 * ui, 'rgba(236,209,138,0.45)');
  }
}
