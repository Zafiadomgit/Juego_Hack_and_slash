/* Fendaria — arte procedural (personajes, monstruos, escenario). */
'use strict';

// ============================================================
// Dibujo: personajes y monstruos
// ============================================================
function ellipse(x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
function circle(x, y, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function shadow(x, y, rx) { ellipse(x, y, rx, rx * 0.38, 'rgba(0,0,0,0.25)'); }

const OUTLINE = '#2a1a0c';

// ============================================================
// Caché de sprites: cada monstruo/árbol se dibuja una vez por fotograma
// de animación en un canvas y luego solo se copia (muy barato en móvil).
// ============================================================
const SPR = { cache: new Map(), scale: 1.5 };
function spriteScaleUpdate(s) {
  const ns = Math.max(1, Math.min(2.5, s));
  if (Math.abs(ns - SPR.scale) > 0.01) { SPR.scale = ns; SPR.cache.clear(); }
}
// Dibuja (o crea) el sprite `key` con el origen en la posición actual de ctx.
function sprite(key, w, h, ax, ay, fn) {
  let c = SPR.cache.get(key);
  if (!c) {
    const sc = SPR.scale;
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * sc));
    c.height = Math.max(1, Math.ceil(h * sc));
    const g = c.getContext('2d');
    g.scale(sc, sc);
    g.translate(ax, ay);
    const saved = ctx;
    ctx = g;
    try { fn(g); } finally { ctx = saved; }
    if (SPR.cache.size > 2500) SPR.cache.clear();
    SPR.cache.set(key, c);
  }
  ctx.drawImage(c, -ax, -ay, w, h);
}
function tintSprite(g, w, h, ax, ay, tint) {
  if (tint === 'n') return;
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = tint === 'f' ? 'rgba(255,255,255,0.85)' : 'rgba(255,50,0,0.38)';
  g.fillRect(-ax, -ay, w, h);
  g.globalCompositeOperation = 'source-over';
}

const TAU = Math.PI * 2;
function blob(g, fill, stroke) { if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.stroke(); } }

// ============================================================
// Héroes
// ============================================================
// Dibuja al personaje (también usado en las tarjetas del menú y el retrato)
function drawHero(g, clsId, o) {
  // o: {x, y, dir, walkT, moving, swing, swingSide, shot, t, alpha}
  const face = Math.cos(o.dir) >= 0 ? 1 : -1;
  const run = o.moving ? o.walkT * 12 : 0;
  const bob = o.moving ? Math.abs(Math.sin(run)) * 2.2 : Math.sin(o.t * 3) * 0.6;
  const step = o.moving ? Math.sin(run) * 3.2 : 0;
  g.save();
  g.translate(o.x, o.y);
  g.globalAlpha = o.alpha ?? 1;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = 2;
  g.strokeStyle = OUTLINE;
  const weaponBehind = Math.sin(o.dir) < -0.2;
  const hx = face * 1, hy = -34;

  // --- piezas traseras ---
  if (clsId === 'iop') {
    // bufanda carmesí al viento
    const wave = Math.sin(o.t * 6 + run) * 2;
    g.beginPath();
    g.moveTo(-face * 4, -25);
    g.quadraticCurveTo(-face * 14, -22 + wave, -face * 20, -14 + wave);
    g.lineTo(-face * 15, -12 + wave);
    g.quadraticCurveTo(-face * 10, -18, -face * 2, -21);
    g.closePath();
    blob(g, '#9c2a22', OUTLINE);
  } else if (clsId === 'cra') {
    // carcaj a la espalda
    g.save();
    g.translate(-face * 8, -24);
    g.rotate(-face * 0.35);
    g.beginPath(); g.roundRect(-3.5, -6, 7, 16, 2); blob(g, '#6b4528', OUTLINE);
    g.fillStyle = '#efe3c8';
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 2.2, -6); g.lineTo(i * 2.2 - 1.5, -11); g.lineTo(i * 2.2 + 1.5, -11); g.closePath(); g.fill(); }
    g.restore();
  } else {
    // piedras rúnicas detrás
    for (let i = 0; i < 2; i++) {
      const a = o.t * 1.6 + i * Math.PI;
      if (Math.sin(a) < 0) drawRuneStone(g, Math.cos(a) * 18, -26 + Math.sin(a) * 5 + Math.sin(o.t * 3 + i) * 1.5);
    }
  }
  if (weaponBehind) drawWeapon(g, clsId, o, -bob);

  // --- piernas ---
  if (clsId === 'feca') {
    g.fillStyle = '#3a2a4a';
    g.beginPath(); g.roundRect(-6 + step * 0.5, -5, 5, 5, 2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(1 - step * 0.5, -5, 5, 5, 2); g.fill(); g.stroke();
  } else {
    g.fillStyle = clsId === 'cra' ? '#4a3424' : '#3f2a1c';
    g.beginPath(); g.roundRect(-6 + step * 0.5, -10, 5, 10, 2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(1 - step * 0.5, -10, 5, 10, 2); g.fill(); g.stroke();
  }

  g.translate(0, -bob);

  // --- cuerpo ---
  if (clsId === 'iop') {
    g.beginPath(); g.moveTo(-10, -8); g.quadraticCurveTo(-11, -23, 0, -25); g.quadraticCurveTo(11, -23, 10, -8); g.closePath();
    blob(g, '#b8322a', OUTLINE);
    // peto de acero
    g.beginPath(); g.moveTo(-8, -22); g.lineTo(8, -22); g.lineTo(7, -13); g.quadraticCurveTo(0, -10, -7, -13); g.closePath();
    blob(g, '#9aa7b4', OUTLINE);
    g.fillStyle = '#c9d3dc'; g.beginPath(); g.moveTo(-6, -21); g.lineTo(-1, -21); g.lineTo(-2, -14); g.lineTo(-6, -15); g.closePath(); g.fill();
    g.fillStyle = '#5a3a22'; g.fillRect(-9, -12, 18, 3);
    g.fillStyle = '#e8b64c'; g.fillRect(-2, -12.5, 4, 4);
    // hombreras
    g.beginPath(); g.ellipse(-9, -22, 4.5, 3.5, -0.3, 0, TAU); blob(g, '#9aa7b4', OUTLINE);
    g.beginPath(); g.ellipse(9, -22, 4.5, 3.5, 0.3, 0, TAU); blob(g, '#9aa7b4', OUTLINE);
  } else if (clsId === 'cra') {
    g.beginPath(); g.moveTo(-10, -7); g.quadraticCurveTo(-11, -23, 0, -25); g.quadraticCurveTo(11, -23, 10, -7); g.closePath();
    blob(g, '#2f7f86', OUTLINE);
    g.fillStyle = '#4aa3a8'; g.beginPath(); g.moveTo(-face * 6, -22); g.quadraticCurveTo(-face * 8, -14, -face * 6, -8); g.lineTo(-face * 3, -8); g.quadraticCurveTo(-face * 4, -16, -face * 6, -22); g.fill();
    // correa cruzada y cinturón
    g.strokeStyle = '#6b4528'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-face * 7, -22); g.lineTo(face * 6, -12); g.stroke();
    g.strokeStyle = OUTLINE; g.lineWidth = 2;
    g.fillStyle = '#6b4528'; g.fillRect(-9, -12, 18, 3);
    g.fillStyle = '#e8b64c'; g.beginPath(); g.arc(0, -10.5, 1.8, 0, TAU); g.fill();
  } else {
    // túnica larga violeta con runas
    g.beginPath(); g.moveTo(-11, -2); g.quadraticCurveTo(-12, -23, 0, -25); g.quadraticCurveTo(12, -23, 11, -2); g.closePath();
    blob(g, '#5b3f8f', OUTLINE);
    g.fillStyle = '#7a5bb0'; g.beginPath(); g.moveTo(-face * 7, -21); g.quadraticCurveTo(-face * 9, -12, -face * 8, -3); g.lineTo(-face * 4, -3); g.quadraticCurveTo(-face * 5, -14, -face * 7, -21); g.fill();
    g.strokeStyle = '#e8b64c'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(face * 1, -21); g.lineTo(face * 1, -3); g.moveTo(face * -2, -8); g.lineTo(face * 4, -8); g.moveTo(face * -1, -15); g.lineTo(face * 3, -15); g.stroke();
    g.strokeStyle = OUTLINE; g.lineWidth = 2;
    g.fillStyle = '#e8b64c'; g.fillRect(-10, -13, 20, 2.5);
  }

  // --- cabeza ---
  g.fillStyle = '#f2c49b';
  g.beginPath(); g.arc(hx, hy, 11, 0, TAU); g.fill(); g.stroke();

  if (clsId === 'iop') {
    // trenzas cobrizas
    g.fillStyle = '#c0562a';
    for (const sx of [-1, 1]) {
      g.beginPath(); g.roundRect(hx + sx * 10 - 2.5, hy - 2, 5, 15, 2.5); g.fill(); g.stroke();
      g.fillStyle = '#e8b64c'; g.fillRect(hx + sx * 10 - 2.5, hy + 9, 5, 2); g.fillStyle = '#c0562a';
    }
    // yelmo con cuernos
    g.fillStyle = '#efe3c8';
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.moveTo(hx + sx * 9, hy - 6);
      g.quadraticCurveTo(hx + sx * 19, hy - 9, hx + sx * 17, hy - 21);
      g.quadraticCurveTo(hx + sx * 14, hy - 12, hx + sx * 7, hy - 10);
      g.closePath(); g.fill(); g.stroke();
    }
    g.beginPath(); g.moveTo(hx - 12, hy - 1); g.arc(hx, hy - 1, 12, Math.PI, 0); g.closePath();
    blob(g, '#9aa7b4', OUTLINE);
    g.fillStyle = '#c9d3dc'; g.beginPath(); g.arc(hx - face * 4, hy - 7, 4, Math.PI, 1.8 * Math.PI); g.fill();
    g.fillStyle = '#7d8a96'; g.fillRect(hx - 12, hy - 3, 24, 3);
    g.fillStyle = '#9aa7b4'; g.beginPath(); g.roundRect(hx + face * 5 - 1.5, hy - 2, 3, 7, 1); g.fill(); g.stroke();
  } else if (clsId === 'cra') {
    // capucha con pluma
    g.beginPath();
    g.moveTo(hx - 13, hy + 4);
    g.quadraticCurveTo(hx - 15, hy - 15, hx - face * 1, hy - 16);
    g.lineTo(hx - face * 9, hy - 24);
    g.quadraticCurveTo(hx + face * 12, hy - 16, hx + 13, hy + 3);
    g.quadraticCurveTo(hx + face * 4, hy - 8, hx - 13, hy + 4);
    g.closePath();
    blob(g, '#2f7f86', OUTLINE);
    g.save(); g.translate(hx - face * 10, hy - 12); g.rotate(-face * 0.9);
    g.beginPath(); g.ellipse(0, -7, 2.6, 8, 0, 0, TAU); blob(g, '#efe3c8', OUTLINE);
    g.strokeStyle = '#8a5a32'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 1); g.lineTo(0, -14); g.stroke();
    g.restore();
    g.strokeStyle = OUTLINE; g.lineWidth = 2;
    // pañuelo
    g.beginPath(); g.moveTo(hx - 10, hy + 3); g.quadraticCurveTo(hx, hy + 9, hx + 10, hy + 3); g.lineTo(hx + 9, hy + 8); g.quadraticCurveTo(hx, hy + 13, hx - 9, hy + 8); g.closePath();
    blob(g, '#6b4528', OUTLINE);
  } else {
    // capucha violeta con gema
    g.beginPath();
    g.moveTo(hx - 13, hy + 6);
    g.quadraticCurveTo(hx - 16, hy - 16, hx, hy - 17);
    g.quadraticCurveTo(hx + 16, hy - 16, hx + 13, hy + 6);
    g.quadraticCurveTo(hx + face * 5, hy - 9, hx - 13, hy + 6);
    g.closePath();
    blob(g, '#5b3f8f', OUTLINE);
    g.beginPath(); g.moveTo(hx + face * 3, hy - 15); g.lineTo(hx + face * 6, hy - 11); g.lineTo(hx + face * 3, hy - 7); g.lineTo(hx, hy - 11); g.closePath();
    blob(g, '#3f9cc4', OUTLINE);
  }

  // ojos
  g.fillStyle = OUTLINE;
  g.beginPath(); g.ellipse(hx + face * 3, hy + 1, 1.6, 2.4, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(hx + face * 8, hy + 1, 1.4, 2.2, 0, 0, TAU); g.fill();
  g.fillStyle = clsId === 'cra' ? '#ffd27a' : clsId === 'feca' ? '#bfe8ff' : '#ffffff';
  g.beginPath(); g.arc(hx + face * 3.4, hy, 0.7, 0, TAU); g.arc(hx + face * 8.3, hy, 0.6, 0, TAU); g.fill();
  if (clsId === 'iop') { g.beginPath(); g.moveTo(hx + face * 1, hy - 3); g.lineTo(hx + face * 5, hy - 2); g.moveTo(hx + face * 7, hy - 2); g.lineTo(hx + face * 10, hy - 3); g.stroke(); }

  if (!weaponBehind) drawWeapon(g, clsId, o, 0);
  if (clsId === 'feca') {
    for (let i = 0; i < 2; i++) {
      const a = o.t * 1.6 + i * Math.PI;
      if (Math.sin(a) >= 0) drawRuneStone(g, Math.cos(a) * 18, -26 + Math.sin(a) * 5 + Math.sin(o.t * 3 + i) * 1.5);
    }
  }
  g.restore();
}

function drawRuneStone(g, x, y) {
  g.save();
  g.translate(x, y);
  g.rotate(0.6);
  g.globalAlpha *= 0.9;
  g.fillStyle = 'rgba(80,180,230,0.25)';
  g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill();
  g.beginPath(); g.roundRect(-3, -3, 6, 6, 1.2); blob(g, '#7fc6e4', OUTLINE);
  g.strokeStyle = '#ffffff'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-1, -1.5); g.lineTo(1, 1.5); g.stroke();
  g.restore();
}

function drawWeapon(g, clsId, o, yoff) {
  g.save();
  g.translate(0, -18 + yoff);
  g.lineWidth = 2; g.strokeStyle = OUTLINE;
  if (clsId === 'iop') {
    // hacha de doble filo
    let a;
    if (o.swing > 0) {
      const k = 1 - o.swing / 0.2;
      a = o.dir + o.swingSide * lerp(-1.6, 1.4, k);
    } else a = o.dir - 0.55 * (Math.cos(o.dir) >= 0 ? 1 : -1);
    g.rotate(a);
    g.strokeStyle = OUTLINE; g.lineWidth = 5; g.beginPath(); g.moveTo(2, 0); g.lineTo(34, 0); g.stroke();
    g.strokeStyle = '#8a5a32'; g.lineWidth = 3; g.beginPath(); g.moveTo(2, 0); g.lineTo(34, 0); g.stroke();
    g.lineWidth = 2; g.strokeStyle = OUTLINE;
    g.beginPath(); g.moveTo(26, -2); g.quadraticCurveTo(30, -14, 39, -15); g.quadraticCurveTo(35, -6, 36, 0); g.quadraticCurveTo(35, 6, 39, 15); g.quadraticCurveTo(30, 14, 26, 2); g.closePath();
    blob(g, '#c9d3dc', OUTLINE);
    g.fillStyle = '#eef3f7'; g.beginPath(); g.moveTo(36, -13); g.quadraticCurveTo(33, -6, 34, 0); g.lineTo(31, 0); g.quadraticCurveTo(31, -8, 36, -13); g.fill();
    g.fillStyle = '#e8b64c'; g.fillRect(25, -2.5, 4, 5);
  } else if (clsId === 'cra') {
    g.rotate(o.dir);
    const pull = o.shot > 0 ? 4 : 0;
    g.strokeStyle = OUTLINE; g.lineWidth = 5; g.beginPath(); g.arc(6, 0, 15, -1.25, 1.25); g.stroke();
    g.strokeStyle = '#8a5a32'; g.lineWidth = 3; g.beginPath(); g.arc(6, 0, 15, -1.25, 1.25); g.stroke();
    g.fillStyle = '#e8b64c';
    g.beginPath(); g.arc(6 + 15 * Math.cos(-1.25), 15 * Math.sin(-1.25), 2, 0, TAU); g.arc(6 + 15 * Math.cos(1.25), 15 * Math.sin(1.25), 2, 0, TAU); g.fill();
    g.strokeStyle = '#f1e2c2'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(6 + 15 * Math.cos(-1.25), 15 * Math.sin(-1.25)); g.lineTo(4 - pull, 0); g.lineTo(6 + 15 * Math.cos(1.25), 15 * Math.sin(1.25)); g.stroke();
    if (o.shot <= 0) { g.strokeStyle = '#5d4037'; g.lineWidth = 2; g.beginPath(); g.moveTo(4, 0); g.lineTo(24, 0); g.stroke(); g.fillStyle = '#c9d3dc'; g.beginPath(); g.moveTo(27, 0); g.lineTo(22, -2.5); g.lineTo(22, 2.5); g.closePath(); g.fill(); }
  } else {
    g.rotate(o.dir * 0.3 + (Math.cos(o.dir) >= 0 ? 0 : Math.PI * 0.3) - 1.2);
    g.strokeStyle = OUTLINE; g.lineWidth = 5; g.beginPath(); g.moveTo(10, 15); g.lineTo(10, -14); g.stroke();
    g.strokeStyle = '#8a5a32'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 15); g.lineTo(10, -14); g.stroke();
    const glow = o.shot > 0 ? 9 : 6.5;
    g.fillStyle = 'rgba(255,170,60,0.28)'; g.beginPath(); g.arc(10, -19, glow + 3, 0, TAU); g.fill();
    g.lineWidth = 1.6; g.strokeStyle = OUTLINE;
    g.beginPath(); g.moveTo(10, -27); g.lineTo(15, -19); g.lineTo(10, -12); g.lineTo(5, -19); g.closePath();
    blob(g, '#f0962e', OUTLINE);
    g.fillStyle = '#ffd27a'; g.beginPath(); g.moveTo(10, -24); g.lineTo(12.5, -19); g.lineTo(10, -15); g.closePath(); g.fill();
  }
  g.restore();
}

function drawPlayer() {
  let jumpH = 0;
  if (P.jump) { const k = P.jump.t / P.jump.dur; jumpH = Math.sin(k * Math.PI) * 55; }
  shadow(P.x, P.y + 1, 13 * (1 - jumpH / 150));
  if (P.shield > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(now * 6) * 0.08;
    circle(P.x, P.y - 18 - jumpH, 26, 'rgba(120,200,255,0.35)', '#8fd0ff', 2);
    ctx.restore();
  }
  const blink = P.invul > 0 && P.dashT <= 0 && Math.floor(now * 22) % 2 === 0;
  drawHero(ctx, P.cls, {
    x: P.x, y: P.y - jumpH, dir: P.dir, walkT: P.walkT, moving: P.moving && P.lock <= 0,
    swing: P.swingT, swingSide: P.swingSide, shot: P.shotT, t: now, alpha: blink ? 0.45 : 1,
  });
  if (P.hurtFlash > 0) {
    ctx.save();
    ctx.globalAlpha = P.hurtFlash * 2;
    circle(P.x, P.y - 20, 18, 'rgba(255,60,60,0.5)');
    ctx.restore();
  }
}

// ============================================================
// Monstruos (dibujados en el origen; los usa la caché de sprites)
// p: fase de animación 0..1, face: ±1, v: variante de estado
// ============================================================
function artBoar(p, face, v, royal) {
  const g = ctx;
  g.save();
  g.scale(face, 1);
  g.lineWidth = 1.6; g.strokeStyle = OUTLINE; g.lineJoin = 'round'; g.lineCap = 'round';
  const angry = v === 'wind' || v === 'charge';
  const hop = v === 'move' || v === 'charge' ? Math.abs(Math.sin(p * TAU * 2)) * 1.5 : 0;
  const fur = royal ? '#5e3820' : '#7a4a2c';
  const furHi = royal ? '#7a4b2c' : '#94603a';
  // patas
  g.fillStyle = '#3f2616';
  [[-12, 0], [-5, Math.PI], [6, Math.PI * 0.5], [12, Math.PI * 1.5]].forEach(([lx, ph]) => {
    const sw = v === 'wind' ? 0 : Math.sin(p * TAU * 2 + ph) * 2.5;
    g.beginPath(); g.roundRect(lx - 2 + sw, -8, 4, 8, 1.5); g.fill(); g.stroke();
  });
  g.translate(0, -hop);
  // cola
  g.beginPath(); g.moveTo(-17, -14); g.quadraticCurveTo(-23, -18, -20, -22); g.stroke();
  // cuerpo
  g.beginPath(); g.ellipse(0, -13, 18, 11, 0, 0, TAU); blob(g, fur, OUTLINE);
  g.fillStyle = furHi; g.beginPath(); g.ellipse(2, -9, 12, 5, 0, 0, TAU); g.fill();
  // musgo en el lomo
  g.beginPath();
  g.moveTo(-16, -15);
  for (let i = 0; i <= 6; i++) { const x = -16 + i * 4.5; g.quadraticCurveTo(x + 2.2, -27 + (i % 2) * 2, x + 4.5, -21 + Math.sin(i) * 1.5); }
  g.quadraticCurveTo(8, -16, -16, -15);
  g.closePath();
  blob(g, royal ? '#4f7a2f' : '#6f9a3f', OUTLINE);
  g.fillStyle = royal ? '#6c9c42' : '#8fbf55'; g.beginPath(); g.ellipse(-4, -23, 7, 2, -0.1, 0, TAU); g.fill();
  // setas diminutas
  for (const [mx, my] of [[-9, -25], [3, -26]]) {
    g.fillStyle = '#efe3c8'; g.fillRect(mx - 0.8, my - 1, 1.6, 3);
    g.beginPath(); g.ellipse(mx, my - 1.5, 2.6, 1.6, 0, Math.PI, 0); blob(g, '#e8692c', OUTLINE);
  }
  if (royal) {
    g.strokeStyle = '#7fd4f0'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-10, -20); g.lineTo(-7, -17); g.lineTo(-10, -14); g.moveTo(0, -21); g.lineTo(3, -18); g.lineTo(0, -15); g.stroke();
    g.lineWidth = 1.6; g.strokeStyle = OUTLINE;
  }
  // cabeza
  g.beginPath(); g.ellipse(15, -12, 8.5, 7.5, 0.15, 0, TAU); blob(g, fur, OUTLINE);
  g.beginPath(); g.moveTo(11, -18); g.lineTo(12, -24); g.lineTo(16, -18.5); g.closePath(); blob(g, '#5a3520', OUTLINE);
  g.beginPath(); g.ellipse(22.5, -9.5, 4, 3.4, 0, 0, TAU); blob(g, '#e09a86', OUTLINE);
  g.fillStyle = OUTLINE; g.beginPath(); g.arc(21.6, -9.6, 0.8, 0, TAU); g.arc(23.6, -9.6, 0.8, 0, TAU); g.fill();
  // colmillos
  g.beginPath(); g.moveTo(19, -6.5); g.quadraticCurveTo(21, -2, 24.5, -6); g.quadraticCurveTo(21.5, -4.5, 20.5, -7.5); g.closePath();
  blob(g, royal ? '#e8b64c' : '#efe3c8', OUTLINE);
  // ojo
  g.fillStyle = OUTLINE; g.beginPath(); g.arc(16.5, -14, 1.9, 0, TAU); g.fill();
  g.fillStyle = angry ? '#ff3d20' : '#ffd27a'; g.beginPath(); g.arc(16.9, -14.4, 0.8, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(13.5, -17.5); g.lineTo(18.5, -15.5); g.stroke();
  if (royal) {
    // corona de piedra
    g.beginPath(); g.moveTo(9, -18); g.lineTo(9, -26); g.lineTo(12, -22); g.lineTo(15, -29); g.lineTo(18, -22); g.lineTo(21, -26); g.lineTo(20, -17.5); g.closePath();
    blob(g, '#8d8478', OUTLINE);
    g.fillStyle = '#7fd4f0'; g.beginPath(); g.arc(15, -21, 1.5, 0, TAU); g.fill();
  }
  g.restore();
}

function artWisp(p, face, v) {
  const g = ctx;
  g.save();
  g.scale(face, 1);
  g.lineWidth = 1.5; g.strokeStyle = OUTLINE; g.lineJoin = 'round';
  const hop = v === 'wind' ? 0 : Math.abs(Math.sin(p * TAU * 2)) * 4;
  const wob = Math.sin(p * TAU * 3) * 0.12;
  g.translate(0, -hop);
  const tipX = Math.sin(p * TAU * 2) * 3, tipY = -27 * (1 + wob);
  g.beginPath();
  g.moveTo(tipX, tipY);
  g.bezierCurveTo(6, -20, 11, -15, 10, -9);
  g.bezierCurveTo(9, -2, -9, -2, -10, -9);
  g.bezierCurveTo(-11, -15, -4, -17, tipX, tipY);
  blob(g, '#e8692c', OUTLINE);
  g.fillStyle = '#ff9a3d';
  g.beginPath(); g.moveTo(tipX * 0.6, tipY * 0.7); g.bezierCurveTo(5, -16, 7, -12, 6.5, -8); g.bezierCurveTo(5.5, -4, -5.5, -4, -6.5, -8); g.bezierCurveTo(-7, -12, -3, -13, tipX * 0.6, tipY * 0.7); g.fill();
  g.fillStyle = '#ffd27a'; g.beginPath(); g.ellipse(0, -8.5, 4, 3.4, 0, 0, TAU); g.fill();
  g.fillStyle = OUTLINE;
  g.beginPath(); g.ellipse(1.5, -12, 1.8, 2.6, 0, 0, TAU); g.ellipse(5.5, -12, 1.6, 2.4, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(2, -13, 0.7, 0, TAU); g.arc(6, -13, 0.6, 0, TAU); g.fill();
  g.restore();
}

function artFireBird(p, face, v) {
  const g = ctx;
  g.save();
  g.scale(face, 1);
  g.lineWidth = 2; g.strokeStyle = OUTLINE; g.lineJoin = 'round'; g.lineCap = 'round';
  const flap = Math.sin(p * TAU * 2) * (v === 'charge' ? 0.2 : 0.55);
  const hover = v === 'charge' ? 0 : Math.sin(p * TAU) * 2;
  g.translate(0, -hover);
  // patas
  g.strokeStyle = '#e8b64c'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(-5, -6); g.lineTo(-6, 0); g.moveTo(5, -6); g.lineTo(6, 0); g.stroke();
  g.lineWidth = 2; g.strokeStyle = OUTLINE;
  // ala trasera
  g.save(); g.translate(-6, -32); g.rotate(-0.4 - flap);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-26, -4, -32, -20); g.quadraticCurveTo(-20, -14, -14, -16); g.quadraticCurveTo(-18, -6, 0, 6); g.closePath();
  blob(g, '#9c2a22', OUTLINE); g.restore();
  // cuerpo
  g.beginPath(); g.ellipse(0, -28, 22, 21, 0, 0, TAU); blob(g, '#e8692c', OUTLINE);
  g.fillStyle = '#ffc24a'; g.beginPath(); g.ellipse(4, -22, 13, 12, 0, 0, TAU); g.fill();
  // cresta de fuego
  const fl = Math.sin(p * TAU * 4) * 2;
  g.beginPath(); g.moveTo(-8, -46); g.quadraticCurveTo(-12, -58 + fl, -4, -64); g.quadraticCurveTo(-3, -56, 1, -55); g.quadraticCurveTo(2, -64 - fl, 9, -66); g.quadraticCurveTo(6, -56, 9, -47); g.closePath();
  blob(g, '#ffc24a', OUTLINE);
  g.fillStyle = '#fff3c4'; g.beginPath(); g.ellipse(1, -52, 2.5, 4, 0, 0, TAU); g.fill();
  // ala delantera
  g.save(); g.translate(6, -30); g.rotate(0.3 + flap);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-24, 2, -28, -14); g.quadraticCurveTo(-16, -10, -10, -12); g.quadraticCurveTo(-12, -2, 0, 6); g.closePath();
  blob(g, '#b8322a', OUTLINE); g.restore();
  // pico y ojo
  g.beginPath(); g.moveTo(19, -34); g.lineTo(31, -30); g.lineTo(19, -26); g.closePath(); blob(g, '#e8b64c', OUTLINE);
  g.fillStyle = OUTLINE; g.beginPath(); g.arc(13, -36, 2.6, 0, TAU); g.fill();
  g.fillStyle = v === 'wind' || v === 'charge' ? '#ff3d20' : '#fff'; g.beginPath(); g.arc(13.6, -36.8, 1, 0, TAU); g.fill();
  g.lineWidth = 2.6; g.beginPath(); g.moveTo(8, -41); g.lineTo(17, -38); g.stroke();
  g.restore();
}

function artSpider(p, face) {
  const g = ctx;
  g.save();
  g.scale(face, 1);
  g.translate(0, -4);
  g.strokeStyle = '#1a1014'; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 4; i++) {
    const wig = Math.sin(p * TAU * 3 + i * 1.7) * 3;
    for (const side of [-1, 1]) {
      const bx = -4 + i * 3.5;
      g.beginPath();
      g.moveTo(bx, -6);
      g.lineTo(bx + side * 2 + wig * 0.4, -6 + side * 9);
      g.lineTo(bx + side * 1 - 3 + wig, -6 + side * 13 + 3);
      g.stroke();
    }
  }
  g.lineWidth = 1.5; g.strokeStyle = OUTLINE;
  g.beginPath(); g.ellipse(-6, -8, 10, 8, 0, 0, TAU); blob(g, '#3d3640', OUTLINE);
  g.strokeStyle = '#ff8a3d'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-11, -11); g.lineTo(-7, -7); g.lineTo(-10, -3); g.moveTo(-4, -14); g.lineTo(-5, -9); g.lineTo(-1, -6); g.stroke();
  g.lineWidth = 1.5; g.strokeStyle = OUTLINE;
  g.beginPath(); g.arc(6, -7, 6, 0, TAU); blob(g, '#4a4250', OUTLINE);
  g.fillStyle = '#ff4a3d';
  g.beginPath(); g.arc(7.5, -9, 1.3, 0, TAU); g.arc(10.5, -8, 1.2, 0, TAU); g.arc(8, -5.5, 1, 0, TAU); g.arc(10.8, -5, 0.9, 0, TAU); g.fill();
  g.restore();
}

function artMushroom(p, face, v) {
  const g = ctx;
  g.save();
  g.scale(face, 1);
  g.lineWidth = 1.5; g.strokeStyle = OUTLINE; g.lineJoin = 'round';
  const waddle = Math.sin(p * TAU * 2);
  // pies
  g.fillStyle = '#d8c8a8';
  g.beginPath(); g.ellipse(-4 + waddle * 1.5, -1.5, 3.5, 2, 0, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(4 - waddle * 1.5, -1.5, 3.5, 2, 0, 0, TAU); g.fill(); g.stroke();
  g.rotate(waddle * 0.06);
  // tallo
  g.beginPath(); g.moveTo(-7, -2); g.quadraticCurveTo(-8, -14, -5, -18); g.lineTo(5, -18); g.quadraticCurveTo(8, -14, 7, -2); g.closePath();
  blob(g, '#efe3c8', OUTLINE);
  // cara
  g.fillStyle = OUTLINE;
  g.beginPath(); g.arc(-0.5, -11, 1.5, 0, TAU); g.arc(4, -11, 1.5, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(-2.5, -14); g.lineTo(1, -12.5); g.moveTo(6, -14); g.lineTo(2.8, -12.5); g.stroke();
  g.beginPath(); g.ellipse(1.8, -6.5, 2, 1.3, 0, 0, TAU); g.fill();
  // sombrero
  const sc = v === 'shoot' ? 1.12 : 1;
  g.save(); g.translate(0, -18); g.scale(sc, sc);
  g.beginPath(); g.moveTo(-15, 1); g.bezierCurveTo(-15, -14, 15, -14, 15, 1); g.quadraticCurveTo(0, 5, -15, 1); g.closePath();
  blob(g, '#5b3f8f', OUTLINE);
  g.fillStyle = '#7a5bb0'; g.beginPath(); g.ellipse(-4, -7, 6, 2.5, -0.3, 0, TAU); g.fill();
  g.fillStyle = v === 'shoot' ? '#c8ffff' : '#7fe0e8';
  g.beginPath(); g.arc(-8, -3, 2.3, 0, TAU); g.arc(1, -8, 2, 0, TAU); g.arc(8, -3, 1.8, 0, TAU); g.fill();
  g.restore();
  g.restore();
}

function artGolem(p, face, v, windK) {
  const g = ctx;
  g.save();
  g.scale(face, 1);
  g.lineWidth = 2; g.strokeStyle = '#120c0a'; g.lineJoin = 'round';
  const stomp = v === 'move' ? Math.sin(p * TAU) * 2 : 0;
  g.fillStyle = '#3b3534';
  g.beginPath(); g.roundRect(-14, -12 + stomp, 10, 12, 3); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(4, -12 - stomp, 10, 12, 3); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-20, -44); g.lineTo(20, -46); g.lineTo(21, -12); g.lineTo(-21, -11); g.closePath();
  blob(g, '#4d4544', '#120c0a');
  g.fillStyle = '#5c5352'; g.beginPath(); g.moveTo(-17, -42); g.lineTo(-2, -43); g.lineTo(-4, -30); g.lineTo(-17, -28); g.closePath(); g.fill();
  // grietas de lava (resplandor + núcleo)
  for (const [col, w] of [['rgba(255,110,30,0.35)', 5], ['#ff8a3d', 2.2], ['#ffd27a', 0.8]]) {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-10, -40); g.lineTo(-4, -32); g.lineTo(-8, -24); g.lineTo(-2, -15); g.moveTo(8, -42); g.lineTo(12, -34); g.lineTo(6, -28); g.stroke();
  }
  g.lineWidth = 2; g.strokeStyle = '#120c0a';
  // musgo en hombros
  g.fillStyle = '#4f7a2f'; g.beginPath(); g.ellipse(-16, -45, 7, 3, -0.2, 0, TAU); g.fill();
  // cabeza
  g.beginPath(); g.roundRect(-8, -60, 22, 16, 5); blob(g, '#5a5150', '#120c0a');
  g.fillStyle = '#ffc24a'; g.fillRect(3, -55, 4, 3); g.fillRect(9, -55, 3, 3);
  // brazos: se elevan al cargar el golpe
  const armY = -36 - windK * 22;
  g.beginPath(); g.arc(-25, armY, 9.5, 0, TAU); blob(g, '#433c3b', '#120c0a');
  g.beginPath(); g.arc(25, armY, 9.5, 0, TAU); blob(g, '#433c3b', '#120c0a');
  if (windK > 0) {
    g.fillStyle = `rgba(255,140,40,${0.25 + windK * 0.4})`;
    g.beginPath(); g.arc(-25, armY, 5, 0, TAU); g.arc(25, armY, 5, 0, TAU); g.fill();
  }
  g.restore();
}

// Tabla de arte por tipo: caja (en unidades del tamaño base r0), ritmo de animación y variante
const MONSTER_ART = {
  tofu:         { r0: 11, w: 30, h: 36, ax: 15, ay: 33, rate: 1.6, vary: (e) => (e.state === 'wind' ? 'wind' : 'move'), draw: (p, f, v) => artWisp(p, f, v) },
  tofuRoyal:    { r0: 30, w: 80, h: 76, ax: 40, ay: 70, rate: 1.1, vary: (e) => (e.state === 'wind' || e.state === 'charge' ? e.state : 'move'), draw: (p, f, v) => artFireBird(p, f, v) },
  bouftou:      { r0: 17, w: 56, h: 36, ax: 28, ay: 32, rate: 1.4, vary: (e) => (e.state === 'wind' || e.state === 'charge' ? e.state : e.state === 'rest' ? 'rest' : 'move'), draw: (p, f, v) => artBoar(p, f, v, false) },
  bouftouRoyal: { r0: 17, w: 56, h: 40, ax: 28, ay: 36, rate: 1.0, vary: (e) => (e.state === 'wind' || e.state === 'charge' ? e.state : 'move'), draw: (p, f, v) => artBoar(p, f, v, true) },
  arakne:       { r0: 13, w: 42, h: 34, ax: 21, ay: 28, rate: 1.5, vary: () => 'move', draw: (p, f) => artSpider(p, f) },
  pissenlit:    { r0: 13, w: 36, h: 40, ax: 18, ay: 37, rate: 0.9, vary: (e) => (e.st > 0 ? 'shoot' : 'move'), draw: (p, f, v) => artMushroom(p, f, v) },
  craqueleur:   { r0: 25, w: 78, h: 74, ax: 39, ay: 71, rate: 0.8, vary: (e) => (e.state === 'wind' ? 'w' + Math.min(3, Math.floor((1 - e.st / (e.max || 0.9)) * 4)) : e.state === 'move' ? 'move' : 'rest'),
                  draw: (p, f, v) => artGolem(p, f, v, v[0] === 'w' ? (+v[1] + 1) / 4 : 0) },
};
const ANIM_FRAMES = 12;

function drawEnemy(e) {
  if (e.spawnT > 0) {
    ctx.save();
    ctx.globalAlpha = 1 - e.spawnT / 0.35;
  }
  // telegrafías en el suelo
  if (e.type === 'craqueleur' && e.state === 'wind') {
    const k = 1 - e.st / e.max;
    circle(e.x, e.y, 110, 'rgba(255,80,40,0.12)', 'rgba(255,80,40,0.6)', 2);
    circle(e.x, e.y, 110 * k, 'rgba(255,80,40,0.25)');
  }
  if (e.type === 'bouftouRoyal' && e.state === 'leap') {
    const k = 1 - e.st / e.max;
    circle(e.tx, e.ty, 170, 'rgba(255,60,30,0.12)', 'rgba(255,60,30,0.7)', 3);
    circle(e.tx, e.ty, 170 * k, 'rgba(255,60,30,0.22)');
  }
  if (e.type === 'tofuRoyal' && e.state === 'wind') {
    const k = 1 - e.st / (e.max || 0.8);
    const L = 420, w = 56;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(Math.atan2(e.cdy || 0, e.cdx || 1));
    ctx.fillStyle = 'rgba(255,40,30,0.18)';
    ctx.fillRect(0, -w / 2, L, w);
    ctx.fillStyle = 'rgba(255,40,30,0.35)';
    ctx.fillRect(0, -w / 2, L * k, w);
    ctx.strokeStyle = 'rgba(255,80,60,0.8)'; ctx.lineWidth = 2;
    ctx.strokeRect(0, -w / 2, L, w);
    ctx.restore();
  }
  if (e.elite) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(1, 0.4);
    circle(0, 0, e.r + 10 + Math.sin(now * 6) * 2, null, e.elite.color, 4);
    ctx.restore();
  }
  if ((e.type === 'bouftou' || e.type === 'bouftouRoyal') && e.state === 'wind') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,50,50,0.5)';
    ctx.lineWidth = e.r * 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    const L = e.type === 'bouftouRoyal' ? 270 : 170;
    ctx.lineTo(e.x + (e.cdx || 0) * L, e.y + (e.cdy || 0) * L);
    ctx.stroke();
    ctx.restore();
  }

  shadow(e.x, e.y + 1, e.r * (1 - Math.min(0.6, e.z / 200)));
  drawMonsterBody(e);
  if (e.enraged && e.flash <= 0 && Math.random() < 0.3) particles.push({ x: e.x + rand(-e.r, e.r), y: e.y - rand(0, e.r * 2), vx: 0, vy: -60, life: 0.4, max: 0.4, color: '#ff3d00', size: rand(3, 5), grav: 0 });
  if (e.slowT > 0) circle(e.x, e.y - e.r, 3, '#ff7043');

  // barra de vida
  const y = e.y - e.r * 2 - 18 - e.z;
  if ((e.hp < e.maxHp || e.elite) && !e.boss) {
    const bw = Math.max(24, e.r * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - bw / 2 - 1, y - 1, bw + 2, 6);
    ctx.fillStyle = e.elite ? e.elite.color : '#e53935'; ctx.fillRect(e.x - bw / 2, y, bw * Math.max(0, e.hp / e.maxHp), 4);
  }
  if (e.elite) text(e.name + ' · nv. ' + e.lvl, e.x, y - 9, 10, '#9fd3ff', 'center', 800);
  if (e.spawnT > 0) ctx.restore();
}

// Cuerpo animado del monstruo (desde la caché de sprites)
function drawMonsterBody(e) {
  const A = MONSTER_ART[e.type];
  const k = e.r / A.r0;
  const ph = ((e.t * A.rate) % 1 + 1) % 1;
  const fi = Math.floor(ph * ANIM_FRAMES);
  const v = A.vary(e);
  const tint = e.flash > 0 ? 'f' : e.enraged ? 'e' : 'n';
  const key = e.type + '|' + fi + '|' + e.face + '|' + v + '|' + Math.round(k * 20) + '|' + tint;
  const w = A.w * k, h = A.h * k, ax = A.ax * k, ay = A.ay * k;
  const jitter = e.state === 'wind' ? rand(-1.5, 1.5) : 0;
  ctx.save();
  ctx.translate(e.x + jitter, e.y - e.z);
  sprite(key, w, h, ax, ay, (g) => {
    g.scale(k, k);
    A.draw(fi / ANIM_FRAMES, e.face, v);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.scale(SPR.scale, SPR.scale);
    g.translate(ax, ay);
    tintSprite(g, w, h, ax, ay, tint);
  });
  ctx.restore();
}

// ============================================================
// Escenario (también en caché)
// ============================================================
function treeShape(hue, sway) {
  const g = ctx;
  g.lineWidth = 2; g.strokeStyle = OUTLINE;
  g.fillStyle = hue === 3 ? '#4e342e' : '#6d4c41';
  g.beginPath(); g.moveTo(-6, 0); g.lineTo(-4, -30); g.lineTo(4, -30); g.lineTo(6, 0); g.closePath(); g.fill(); g.stroke();
  const greens = [['#2e7d32', '#43a047', '#66bb6a'], ['#33691e', '#558b2f', '#7cb342'], ['#1b5e20', '#2e7d32', '#4caf50'], ['#5b2a2a', '#7a3b2e', '#a0522d']][hue];
  g.fillStyle = greens[0];
  g.beginPath(); g.arc(-14 + sway, -38, 16, 0, TAU); g.arc(14 + sway, -38, 16, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = greens[1];
  g.beginPath(); g.arc(sway, -54, 20, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.arc(-14 + sway, -38, 15, 0, TAU); g.arc(14 + sway, -38, 15, 0, TAU); g.fill();
  g.fillStyle = greens[2];
  g.beginPath(); g.arc(-5 + sway, -60, 8, 0, TAU); g.fill();
}

function drawTree(o) {
  const s = o.s;
  shadow(o.x, o.y + 2, 24 * s);
  const fi = Math.floor((((now * 0.19 + o.x * 0.001) % 1) + 1) % 1 * 8);
  const sway = Math.sin(fi / 8 * TAU) * 1.2;
  const qs = Math.round(s * 20) / 20;
  ctx.save();
  ctx.translate(o.x, o.y);
  sprite('tree|' + o.hue + '|' + qs + '|' + fi, 76 * qs, 84 * qs, 38 * qs, 80 * qs, (g) => { g.scale(qs, qs); treeShape(o.hue, sway); });
  ctx.restore();
}

function drawRock(o) {
  shadow(o.x, o.y + 2, o.r * 1.1);
  const r = Math.round(o.r);
  ctx.save();
  ctx.translate(o.x, o.y);
  sprite('rock|' + r, r * 2.4 + 6, r * 1.8 + 6, r * 1.2 + 3, r * 1.3 + 3, (g) => {
    g.lineWidth = 2; g.strokeStyle = OUTLINE;
    g.fillStyle = '#8a8178';
    g.beginPath(); g.ellipse(0, -r * 0.45, r * 1.1, r * 0.8, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#a89e92';
    g.beginPath(); g.ellipse(-r * 0.3, -r * 0.7, r * 0.45, r * 0.25, -0.3, 0, TAU); g.fill();
  });
  ctx.restore();
}

function drawPickup(k) {
  const bob = Math.sin(k.t * 5 + k.x) * 2;
  const y = k.y - k.z - 6 + bob;
  if (k.type === 'kama') {
    shadow(k.x, k.y, 5);
    const spin = Math.abs(Math.cos(k.t * 4 + k.x));
    ellipse(k.x, y, 5.5 * (0.35 + spin * 0.65), 5.5, '#ffca28');
    ctx.strokeStyle = '#a66f00'; ctx.lineWidth = 1.2; ctx.stroke();
    ellipse(k.x - 1, y - 1.5, 1.6 * spin, 1.6, '#fff8e1');
  } else if (k.type === 'xp') {
    ctx.save();
    ctx.translate(k.x, y);
    ctx.rotate(k.t * 3);
    ctx.fillStyle = 'rgba(79,195,247,0.3)';
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (k.type === 'item') {
    const R = RARITY[k.item.rarity];
    if (k.item.rarity >= 2) {
      const h = k.item.rarity === 3 ? 170 : 90;
      const g = ctx.createLinearGradient(0, k.y - h, 0, k.y);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, R.beam);
      ctx.fillStyle = g;
      const bw = 10 + Math.sin(k.t * 4) * 2;
      ctx.fillRect(k.x - bw / 2, k.y - h, bw, h);
    }
    shadow(k.x, k.y, 9);
    ctx.save();
    ctx.translate(k.x, y);
    circle(0, 0, 10, 'rgba(30,20,8,0.8)', R.color, 2);
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(k.item.icon, 0, 1);
    ctx.restore();
    // etiqueta con el nombre
    ctx.font = '800 9px "Trebuchet MS", sans-serif';
    const tw = ctx.measureText(k.item.name).width + 8;
    roundRect(k.x - tw / 2, y - 27, tw, 13, 3, 'rgba(15,10,5,0.75)', R.color, 1);
    ctx.fillStyle = R.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(k.item.name, k.x, y - 20);
  } else if (k.type === 'dofus') {
    const D = GEMS[k.id];
    const g = ctx.createLinearGradient(0, k.y - 200, 0, k.y);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, D.color + 'aa');
    ctx.fillStyle = g;
    ctx.fillRect(k.x - 8, k.y - 200, 16, 200);
    shadow(k.x, k.y, 9);
    drawGem(ctx, k.x, y - 6, 1, D.color, k.t);
  } else {
    shadow(k.x, k.y, 8);
    ctx.save();
    ctx.translate(k.x, y);
    ctx.lineWidth = 1.5; ctx.strokeStyle = OUTLINE;
    ctx.fillStyle = '#d4a056';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8d5a1e';
    ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(-2, 3); ctx.moveTo(1, -5); ctx.lineTo(3, 3); ctx.stroke();
    ctx.restore();
  }
}

function drawProjectile(p) {
  ctx.save();
  if (p.kind === 'arrow' || p.kind === 'explo') {
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.fillStyle = p.kind === 'explo' ? '#ff5722' : '#cfd8dc';
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(3, -4); ctx.lineTo(3, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-18, -4); ctx.lineTo(-11, 0); ctx.lineTo(-18, 4); ctx.closePath(); ctx.fill();
    if (p.kind === 'explo') { circle(4, 0, 5, 'rgba(255,140,0,0.5)'); }
  } else if (p.kind === 'orb') {
    circle(p.x, p.y, p.r * 1.9, 'rgba(79,195,247,0.25)');
    circle(p.x, p.y, p.r, '#b3e5fc');
    circle(p.x, p.y, p.r * 0.55, '#ffffff');
  } else {
    circle(p.x, p.y, p.r, '#c6ff00', OUTLINE, 1.5);
    circle(p.x - 1.5, p.y - 1.5, 2, '#f4ff81');
  }
  ctx.restore();
}

function drawSlash(s) {
  const k = 1 - s.life / s.max;
  const alpha = 1 - k;
  const a0 = s.dir - (s.arc / 2) * s.side;
  const sweep = s.arc * Math.min(1, k * 2.2) * s.side;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = s.color;
  ctx.beginPath();
  const R = s.range, r = s.range - s.width;
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (sweep * i) / steps;
    const rr = R - (s.width * 0.6) * Math.abs(i / steps - 0.5) * 2 * 0.5;
    const px = s.x + Math.cos(a) * rr, py = s.y - 16 + Math.sin(a) * rr * 0.85;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + (sweep * i) / steps;
    const t = i / steps;
    const rr = r + s.width * 0.5 * (1 - Math.sin(t * Math.PI));
    ctx.lineTo(s.x + Math.cos(a) * rr, s.y - 16 + Math.sin(a) * rr * 0.85);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCast() {
  const c = P.cast;
  if (!c) return;
  const k = Math.min(1, c.t / c.max);
  ctx.save();
  ctx.fillStyle = `rgba(255,170,30,${0.12 + k * 0.2})`;
  ctx.strokeStyle = 'rgba(255,200,60,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(P.x, P.y);
  ctx.arc(P.x, P.y, c.range, c.dir - c.arc, c.dir + c.arc);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = `rgba(255,200,60,${0.25})`;
  ctx.beginPath();
  ctx.moveTo(P.x, P.y);
  ctx.arc(P.x, P.y, c.range * k, c.dir - c.arc, c.dir + c.arc);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  if (Math.random() < 0.6) particles.push({ x: P.x + rand(-12, 12), y: P.y - rand(0, 30), vx: 0, vy: -80, life: 0.4, max: 0.4, color: '#ffcc33', size: rand(2, 4), grav: 0 });
}

function drawGlyph(g) {
  const fade = Math.min(1, g.life / 0.5, (g.max - g.life) / 0.25);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(g.x, g.y);
  ctx.scale(1, 0.6);
  circle(0, 0, g.r, 'rgba(255,87,34,0.18)', 'rgba(255,140,60,0.9)', 3);
  ctx.rotate(now * 0.8);
  ctx.strokeStyle = 'rgba(255,200,80,0.85)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(a) * g.r * 0.82, y = Math.sin(a) * g.r * 0.82;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  circle(0, 0, g.r * 0.35, null, 'rgba(255,200,80,0.7)', 2);
  ctx.restore();
}


function drawGem(g, x, y, s, color, t) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  // gema tallada con halo
  const a0 = g.globalAlpha;
  g.globalAlpha = a0 * (0.35 + Math.sin(t * 4) * 0.1);
  g.fillStyle = color; g.beginPath(); g.arc(0, -2, 17, 0, Math.PI * 2); g.fill();
  g.globalAlpha = a0;
  g.lineJoin = 'round'; g.lineWidth = 1.4; g.strokeStyle = '#1a1020';
  const pts = [[0, -14], [9, -6], [6, 10], [-6, 10], [-9, -6]];
  g.fillStyle = color; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(0, -14); g.lineTo(9, -6); g.lineTo(0, -3); g.lineTo(-9, -6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(0, -3); g.lineTo(6, 10); g.lineTo(-6, 10); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(-9, -6); g.lineTo(0, -3); g.lineTo(9, -6); g.moveTo(0, -3); g.lineTo(0, 10); g.stroke();
  g.restore();
}

function drawPortal(x, y, t) {
  shadow(x, y + 4, 46);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE;
  // base de piedra
  ctx.fillStyle = '#9e9e9e';
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#bdbdbd';
  ctx.beginPath(); ctx.ellipse(0, -4, 38, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // anillo
  ctx.lineWidth = 9; ctx.strokeStyle = '#8d8d8d';
  ctx.beginPath(); ctx.ellipse(0, -46, 30, 40, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE;
  ctx.beginPath(); ctx.ellipse(0, -46, 34.5, 44.5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -46, 25.5, 35.5, 0, 0, Math.PI * 2); ctx.stroke();
  // portal
  const grd = ctx.createRadialGradient(0, -46, 2, 0, -46, 26);
  grd.addColorStop(0, 'rgba(255,255,255,0.95)');
  grd.addColorStop(0.5, 'rgba(110,200,255,0.75)');
  grd.addColorStop(1, 'rgba(40,120,220,0.4)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.ellipse(0, -46, 25, 35, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const a = t * 2 + i * 2.1;
    ctx.beginPath(); ctx.ellipse(0, -46, 8 + i * 6, 12 + i * 8, 0, a, a + 2.2); ctx.stroke();
  }
  // runas
  ctx.fillStyle = '#4fc3f7';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 0.3;
    circle(Math.cos(a) * 30, -46 + Math.sin(a) * 40, 2, '#b3e5fc');
  }
  ctx.restore();
}

function drawHouse(h) {
  shadow(h.x, h.y + 4, h.w * 0.7);
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE;
  const w = h.w, ht = h.h;
  ctx.fillStyle = '#f1e3c6';
  ctx.fillRect(-w / 2, -ht, w, ht); ctx.strokeRect(-w / 2, -ht, w, ht);
  // vigas
  ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-w / 2, -ht * 0.55); ctx.lineTo(w / 2, -ht * 0.55); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE;
  // puerta y ventana
  ctx.fillStyle = '#6d4c41';
  ctx.beginPath(); ctx.roundRect(-9, -26, 18, 26, [9, 9, 0, 0]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe082';
  ctx.fillRect(w / 2 - 24, -ht + 12, 14, 12); ctx.strokeRect(w / 2 - 24, -ht + 12, 14, 12);
  // tejado
  ctx.fillStyle = h.roof;
  ctx.beginPath();
  ctx.moveTo(-w / 2 - 12, -ht + 4);
  ctx.lineTo(0, -ht - h.w * 0.55);
  ctx.lineTo(w / 2 + 12, -ht + 4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  for (let i = 1; i < 4; i++) {
    const k = i / 4;
    ctx.beginPath();
    ctx.moveTo(lerp(-w / 2 - 12, 0, k), lerp(-ht + 4, -ht - h.w * 0.55, k));
    ctx.lineTo(lerp(w / 2 + 12, 0, k), lerp(-ht + 4, -ht - h.w * 0.55, k));
    ctx.stroke();
  }
  ctx.restore();
}

function drawFern(d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.scale(d.s, d.s);
  ctx.strokeStyle = d.c; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 8, Math.sin(a) * 12 - 2, Math.cos(a) * 14, Math.sin(a) * 10 + 2);
    ctx.stroke();
  }
  ctx.restore();
}
