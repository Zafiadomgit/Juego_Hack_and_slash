/* Astrub Slash — arte procedural (personajes, monstruos, escenario). */
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

// Dibuja al personaje (también usado en las tarjetas del menú)
function drawHero(g, clsId, o) {
  // o: {x, y, dir, walkT, moving, swing, swingSide, shot, t, alpha, flash}
  const C = CLASSES[clsId];
  const face = Math.cos(o.dir) >= 0 ? 1 : -1;
  const bob = o.moving ? Math.abs(Math.sin(o.walkT * 12)) * 2.5 : Math.sin(o.t * 3) * 0.7;
  const step = o.moving ? Math.sin(o.walkT * 12) * 3 : 0;
  g.save();
  g.translate(o.x, o.y);
  g.globalAlpha = o.alpha ?? 1;
  g.lineJoin = 'round';
  g.lineWidth = 2;
  g.strokeStyle = OUTLINE;

  const weaponBehind = Math.sin(o.dir) < -0.2;
  if (weaponBehind) drawWeapon(g, clsId, o, -bob);

  // piernas
  g.fillStyle = '#4e342e';
  g.beginPath(); g.roundRect(-6 + step * 0.5, -9, 5, 9, 2); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(1 - step * 0.5, -9, 5, 9, 2); g.fill(); g.stroke();

  g.translate(0, -bob);
  // capa / cuerpo
  g.fillStyle = C.color;
  g.beginPath();
  g.moveTo(-10, -8); g.quadraticCurveTo(-11, -22, 0, -24); g.quadraticCurveTo(11, -22, 10, -8);
  g.closePath(); g.fill(); g.stroke();
  // cinturón
  g.fillStyle = '#5d4037'; g.fillRect(-9, -12, 18, 3);
  if (clsId === 'feca') {
    // caparazón de tortuga en la espalda
    g.fillStyle = '#c5a46d';
    g.beginPath(); g.ellipse(-face * 7, -16, 6, 8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(80,50,20,0.6)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-face * 7, -23); g.lineTo(-face * 7, -9); g.stroke();
    g.strokeStyle = OUTLINE; g.lineWidth = 2;
  }

  // cabeza
  const hx = face * 1, hy = -34;
  g.fillStyle = '#ffd9b3';
  g.beginPath(); g.arc(hx, hy, 11, 0, Math.PI * 2); g.fill(); g.stroke();

  // pelo / capucha por clase
  if (clsId === 'iop') {
    g.fillStyle = C.hair;
    g.beginPath();
    g.moveTo(hx - 12 * face, hy - 1);
    const spikes = [[-13, -12], [-7, -9], [-6, -20], [0, -11], [4, -21], [7, -10], [14, -14], [11, -3], [12, 1]];
    g.lineTo(hx - 11 * face, hy - 6);
    for (const [sx, sy] of spikes) g.lineTo(hx + sx * face, hy + sy);
    g.lineTo(hx + 11 * face, hy + 2);
    g.quadraticCurveTo(hx, hy - 6, hx - 12 * face, hy - 1);
    g.closePath(); g.fill(); g.stroke();
  } else if (clsId === 'cra') {
    // capucha verde con orejas puntiagudas
    g.fillStyle = '#2e7d32';
    g.beginPath();
    g.moveTo(hx - 12, hy + 3);
    g.quadraticCurveTo(hx - 14, hy - 14, hx - 2 * face, hy - 16);
    g.lineTo(hx - 8 * face, hy - 24);
    g.quadraticCurveTo(hx + 10 * face, hy - 16, hx + 12, hy + 2);
    g.quadraticCurveTo(hx + 4 * face, hy - 7, hx - 12, hy + 3);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.hair;
    g.beginPath(); g.moveTo(hx - 10 * face, hy - 2); g.lineTo(hx - 15 * face, hy + 10); g.lineTo(hx - 6 * face, hy + 3); g.fill(); g.stroke();
  } else {
    // sombrero de mago Feca
    g.fillStyle = '#e3f2fd';
    g.beginPath(); g.ellipse(hx, hy - 7, 14, 4, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#1565c0';
    g.beginPath(); g.moveTo(hx - 10, hy - 8); g.quadraticCurveTo(hx - 2 * face, hy - 30, hx + 9 * face, hy - 26); g.quadraticCurveTo(hx + 4 * face, hy - 18, hx + 10, hy - 8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffd54f'; g.beginPath(); g.arc(hx + 9 * face, hy - 26, 2.5, 0, Math.PI * 2); g.fill();
  }

  // ojos
  g.fillStyle = OUTLINE;
  g.beginPath(); g.ellipse(hx + face * 3, hy + 1, 1.6, 2.4, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(hx + face * 8, hy + 1, 1.4, 2.2, 0, 0, Math.PI * 2); g.fill();
  if (clsId === 'iop') {
    g.beginPath(); g.moveTo(hx + face * 1, hy - 3); g.lineTo(hx + face * 6, hy - 2); g.stroke();
  }

  if (!weaponBehind) drawWeapon(g, clsId, o, 0);

  if (o.flash) {
    g.globalCompositeOperation = 'source-atop';
  }
  g.restore();
}

function drawWeapon(g, clsId, o, yoff) {
  g.save();
  g.translate(0, -18 + yoff);
  if (clsId === 'iop') {
    let a = o.dir;
    if (o.swing > 0) {
      const k = 1 - o.swing / 0.2;
      a = o.dir + o.swingSide * lerp(-1.6, 1.4, k);
    } else a = o.dir + 0.9 * (Math.cos(o.dir) >= 0 ? 1 : -1) * -0.6;
    g.rotate(a);
    g.fillStyle = '#6d4c41'; g.fillRect(4, -2, 8, 4);
    g.fillStyle = '#ffca28'; g.fillRect(11, -6, 3, 12);
    g.fillStyle = '#e0e0e0';
    g.beginPath(); g.moveTo(14, -3); g.lineTo(38, -2); g.lineTo(42, 0); g.lineTo(38, 2); g.lineTo(14, 3); g.closePath(); g.fill(); g.stroke();
  } else if (clsId === 'cra') {
    g.rotate(o.dir);
    const pull = o.shot > 0 ? 4 : 0;
    g.strokeStyle = '#6d4c41'; g.lineWidth = 3;
    g.beginPath(); g.arc(8, 0, 13, -1.2, 1.2); g.stroke();
    g.strokeStyle = '#eee'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(8 + 13 * Math.cos(-1.2), 13 * Math.sin(-1.2)); g.lineTo(6 - pull, 0); g.lineTo(8 + 13 * Math.cos(1.2), 13 * Math.sin(1.2)); g.stroke();
    if (o.shot <= 0) { g.strokeStyle = '#5d4037'; g.lineWidth = 2; g.beginPath(); g.moveTo(6, 0); g.lineTo(24, 0); g.stroke(); }
  } else {
    g.rotate(o.dir * 0.3 + (Math.cos(o.dir) >= 0 ? 0 : Math.PI * 0.3) - 1.2);
    g.strokeStyle = '#8d6e63'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(10, 14); g.lineTo(10, -16); g.stroke();
    const glow = o.shot > 0 ? 6 : 4;
    g.fillStyle = '#4fc3f7';
    g.beginPath(); g.arc(10, -18, glow, 0, Math.PI * 2); g.fill();
    g.strokeStyle = OUTLINE; g.lineWidth = 1.5; g.stroke();
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

function drawBouftou(e, royal) {
  const s = e.r / 17;
  const moving = e.state !== 'wind' && e.state !== 'rest';
  const hop = moving ? Math.abs(Math.sin(e.t * 9)) * 3 : 0;
  const shake = e.state === 'wind' ? rand(-1.5, 1.5) : 0;
  ctx.save();
  ctx.translate(e.x + shake, e.y - hop - e.z);
  ctx.scale(s * e.face, s);
  ctx.lineWidth = 1.6; ctx.strokeStyle = OUTLINE;
  // patas
  ctx.fillStyle = '#4e342e';
  for (const lx of [-9, -3, 4, 10]) { ctx.fillRect(lx - 1.5, -6, 3, 7); }
  // lana
  const wool = royal ? '#efe6cf' : '#f6f3ea';
  const woolS = royal ? '#b9a77e' : '#cfc8b6';
  const blobs = [[-11, -14, 9], [-2, -20, 10], [8, -16, 9], [-13, -7, 8], [10, -8, 8], [-2, -9, 11]];
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fillStyle = wool; ctx.fill(); ctx.strokeStyle = woolS; ctx.stroke(); }
  ctx.fillStyle = wool;
  ctx.beginPath(); ctx.arc(-2, -13, 11, 0, Math.PI * 2); ctx.fill();
  // cara
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = royal ? '#5d4037' : '#795548';
  ctx.beginPath(); ctx.ellipse(13, -11, 7, 8, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // ojos enfadados
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(12, -13, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(17, -12.5, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = e.state === 'wind' || e.state === 'charge' ? '#d50000' : '#000';
  ctx.beginPath(); ctx.arc(13, -12.5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(17.5, -12, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(9.5, -17); ctx.lineTo(14.5, -15); ctx.moveTo(15.5, -15.5); ctx.lineTo(19, -16.5); ctx.stroke();
  // cuernos
  ctx.strokeStyle = royal ? '#ffca28' : '#d7b98e'; ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.arc(7, -19, 5, Math.PI * 0.9, Math.PI * 2.3); ctx.stroke();
  ctx.beginPath(); ctx.arc(17, -18, 4, Math.PI * 1.1, Math.PI * 2.5); ctx.stroke();
  if (royal) {
    // corona
    ctx.lineWidth = 1.5; ctx.strokeStyle = OUTLINE;
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.moveTo(-10, -26); ctx.lineTo(-10, -36); ctx.lineTo(-5, -30); ctx.lineTo(0, -39); ctx.lineTo(5, -30); ctx.lineTo(10, -36); ctx.lineTo(10, -26); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(0, -30, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawTofu(e, royal) {
  const s = e.r / 11;
  const hop = e.state === 'wind' ? 0 : Math.abs(Math.sin(e.t * 14)) * 4;
  ctx.save();
  ctx.translate(e.x + (e.state === 'wind' ? rand(-1.5, 1.5) : 0), e.y - hop - e.z);
  ctx.scale(s * e.face, s);
  ctx.lineWidth = 1.5; ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = '#ff8f00';
  ctx.fillRect(-4, -3, 2, 4); ctx.fillRect(2, -3, 2, 4);
  ctx.fillStyle = '#fdd835';
  ctx.beginPath(); ctx.arc(0, -11, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // alas
  const flap = Math.sin(e.t * 30) * 0.6;
  ctx.fillStyle = '#fbc02d';
  ctx.save(); ctx.translate(-6, -11); ctx.rotate(-0.6 + flap); ctx.beginPath(); ctx.ellipse(-4, 0, 6, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  // cresta
  ctx.fillStyle = '#fdd835';
  ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-4, -26); ctx.lineTo(0, -22); ctx.lineTo(2, -27); ctx.lineTo(3, -20); ctx.fill(); ctx.stroke();
  // pico
  ctx.fillStyle = '#ff6f00';
  ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(15, -10); ctx.lineTo(8, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  // ojo
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(4, -14, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1, -18); ctx.lineTo(6, -16.5); ctx.stroke();
  if (royal) {
    ctx.lineWidth = 1; ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.moveTo(-6, -19); ctx.lineTo(-6, -26); ctx.lineTo(-3, -22); ctx.lineTo(0, -28); ctx.lineTo(3, -22); ctx.lineTo(6, -26); ctx.lineTo(6, -19); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(0, -22, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawArakne(e) {
  const s = e.r / 13;
  ctx.save();
  ctx.translate(e.x, e.y - 4);
  ctx.scale(s * e.face, s);
  ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const wig = Math.sin(e.t * 18 + i * 1.7) * 3;
    for (const side of [-1, 1]) {
      const bx = -4 + i * 3.5;
      ctx.beginPath();
      ctx.moveTo(bx, -6);
      ctx.lineTo(bx + side * 2 + wig * 0.4, -6 + side * 9);
      ctx.lineTo(bx + side * 1 - 3 + wig, -6 + side * 13 + 3);
      ctx.stroke();
    }
  }
  ctx.lineWidth = 1.5; ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = '#4a2c5a';
  ctx.beginPath(); ctx.ellipse(-6, -8, 10, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a3f80';
  ctx.beginPath(); ctx.arc(6, -7, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath(); ctx.ellipse(-7, -10, 4, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff1744';
  ctx.beginPath(); ctx.arc(8, -9, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.5, -7.5, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPissenlit(e) {
  const s = e.r / 13;
  const pulse = e.st > 0 ? 1.15 : 1;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(s * e.face, s);
  ctx.lineWidth = 1.5; ctx.strokeStyle = OUTLINE;
  // hojas
  ctx.fillStyle = '#388e3c';
  ctx.beginPath(); ctx.ellipse(-7, -3, 8, 3, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(7, -3, 8, 3, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // tallo
  ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3;
  const sway = Math.sin(e.t * 3) * 3;
  ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(sway, -12, sway * 0.6, -22); ctx.stroke();
  ctx.translate(sway * 0.6, -26);
  ctx.scale(pulse, pulse);
  ctx.lineWidth = 1.2; ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = '#ffeb3b';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + e.t * 0.5;
    ctx.beginPath(); ctx.ellipse(Math.cos(a) * 8, Math.sin(a) * 8, 5, 2.6, a, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#8d6e63';
  ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-2, -1, 1.2, 0, Math.PI * 2); ctx.arc(2.5, -1, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-3, 2.5); ctx.lineTo(3, 2.5); ctx.stroke();
  ctx.restore();
}

function drawCraqueleur(e) {
  const s = e.r / 25;
  const wind = e.state === 'wind' ? (1 - e.st / (e.max || 0.9)) : 0;
  const stomp = e.state === 'move' ? Math.sin(e.t * 5) * 2 : 0;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(s * e.face, s);
  ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE;
  // piernas
  ctx.fillStyle = '#757575';
  ctx.beginPath(); ctx.roundRect(-14, -12 + stomp, 10, 12, 3); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(4, -12 - stomp, 10, 12, 3); ctx.fill(); ctx.stroke();
  // cuerpo
  ctx.fillStyle = '#9e9e9e';
  ctx.beginPath(); ctx.roundRect(-20, -46, 40, 36, 10); ctx.fill(); ctx.stroke();
  // grietas
  ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 2;
  ctx.shadowColor = '#ff8f00'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(-4, -32); ctx.lineTo(-8, -24); ctx.lineTo(-2, -16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -42); ctx.lineTo(12, -34); ctx.lineTo(6, -28); ctx.stroke();
  ctx.shadowBlur = 0;
  // cabeza
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = '#8a8a8a';
  ctx.beginPath(); ctx.roundRect(-8, -60, 22, 16, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffca28';
  ctx.fillRect(4, -55, 4, 3); ctx.fillRect(9, -55, 3, 3);
  // brazos (se elevan al cargar el golpe)
  ctx.fillStyle = '#7e7e7e';
  const armY = -36 - wind * 22;
  ctx.beginPath(); ctx.arc(-24, armY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(24, armY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawEnemy(e) {
  if (e.spawnT > 0) {
    ctx.save();
    ctx.globalAlpha = 1 - e.spawnT / 0.35;
  }
  // telegrafías en el suelo
  if (e.type === 'craqueleur' && e.state === 'wind') {
    const k = 1 - e.st / e.max;
    ctx.save();
    circle(e.x, e.y, 110, 'rgba(255,80,40,0.12)', 'rgba(255,80,40,0.6)', 2);
    circle(e.x, e.y, 110 * k, 'rgba(255,80,40,0.25)');
    ctx.restore();
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
  if (e.flash > 0) ctx.filter = 'brightness(2.6)';
  else if (e.enraged) ctx.filter = 'sepia(0.6) saturate(3) hue-rotate(-30deg)';
  switch (e.type) {
    case 'bouftou': drawBouftou(e, false); break;
    case 'bouftouRoyal': drawBouftou(e, true); break;
    case 'tofu': drawTofu(e, false); break;
    case 'tofuRoyal': drawTofu(e, true); break;
    case 'arakne': drawArakne(e); break;
    case 'pissenlit': drawPissenlit(e); break;
    case 'craqueleur': drawCraqueleur(e); break;
  }
  if (e.flash > 0 || e.enraged) ctx.filter = 'none';
  if (e.enraged && e.flash <= 0 && Math.random() < 0.3) particles.push({ x: e.x + rand(-e.r, e.r), y: e.y - rand(0, e.r * 2), vx: 0, vy: -60, life: 0.4, max: 0.4, color: '#ff3d00', size: rand(3, 5), grav: 0 });
  if (e.slowT > 0) circle(e.x, e.y - e.r, 3, '#ff7043');

  // barra de vida
  const y = e.y - e.r * 2 - 18 - e.z;
  if ((e.hp < e.maxHp || e.elite) && !e.boss) {
    const w = Math.max(24, e.r * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 6);
    ctx.fillStyle = e.elite ? e.elite.color : '#e53935'; ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }
  if (e.elite) text(e.name + ' · niv. ' + e.lvl, e.x, y - 9, 10, '#9fd3ff', 'center', 800);
  if (e.spawnT > 0) ctx.restore();
}

function drawTree(o) {
  const s = o.s;
  shadow(o.x, o.y + 2, 24 * s);
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(s, s);
  ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = o.hue === 3 ? '#4e342e' : '#6d4c41';
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-4, -30); ctx.lineTo(4, -30); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  const greens = [['#2e7d32', '#43a047', '#66bb6a'], ['#33691e', '#558b2f', '#7cb342'], ['#1b5e20', '#2e7d32', '#4caf50'], ['#5b2a2a', '#7a3b2e', '#a0522d']][o.hue];
  const sway = Math.sin(now * 1.2 + o.x) * 1.2;
  ctx.fillStyle = greens[0];
  ctx.beginPath(); ctx.arc(-14 + sway, -38, 16, 0, Math.PI * 2); ctx.arc(14 + sway, -38, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = greens[1];
  ctx.beginPath(); ctx.arc(sway, -54, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-14 + sway, -38, 15, 0, Math.PI * 2); ctx.arc(14 + sway, -38, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = greens[2];
  ctx.beginPath(); ctx.arc(-5 + sway, -60, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawRock(o) {
  shadow(o.x, o.y + 2, o.r * 1.1);
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = '#9e9e9e';
  ctx.beginPath(); ctx.ellipse(0, -o.r * 0.45, o.r * 1.1, o.r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#bdbdbd';
  ctx.beginPath(); ctx.ellipse(-o.r * 0.3, -o.r * 0.7, o.r * 0.45, o.r * 0.25, -0.3, 0, Math.PI * 2); ctx.fill();
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
    ctx.fillStyle = '#4fc3f7';
    ctx.shadowColor = '#81d4fa'; ctx.shadowBlur = 8;
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
    const D = DOFUS[k.id];
    const g = ctx.createLinearGradient(0, k.y - 200, 0, k.y);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, D.color + 'aa');
    ctx.fillStyle = g;
    ctx.fillRect(k.x - 8, k.y - 200, 16, 200);
    shadow(k.x, k.y, 9);
    drawDofusEgg(ctx, k.x, y - 6, 1, D.color, k.t);
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
    ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 14;
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


function drawDofusEgg(g, x, y, s, color, t) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.shadowColor = color; g.shadowBlur = 16;
  const grd = g.createRadialGradient(-3, -6, 1, 0, 0, 14);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.35, color);
  grd.addColorStop(1, '#1a1a2e');
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(0, -14);
  g.bezierCurveTo(10, -14, 11, 4, 9, 8);
  g.bezierCurveTo(6, 14, -6, 14, -9, 8);
  g.bezierCurveTo(-11, 4, -10, -14, 0, -14);
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1;
  g.beginPath(); g.ellipse(-3, -6, 2, 4, 0.3, 0, Math.PI * 2); g.stroke();
  g.restore();
}

function drawZaap(x, y, t) {
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
