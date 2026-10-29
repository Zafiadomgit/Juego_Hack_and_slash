/* Fendaria — barra de Ruptura de los jefes y Súper Jefes.
 * Debajo de la vida del jefe hay una barra de Ruptura: cada golpe la vacía (más los fuertes, los críticos y las
 * habilidades) y se rellena sola si dejas de golpear. Al romperla: estallido de cristales, «¡RUPTURA!», cámara lenta
 * y el jefe queda aturdido unos segundos (estrellas sobre la cabeza) recibiendo un 50% más de daño.
 * Después vuelve llena y un poco más dura.
 */
'use strict';

const BRK = { dur: 5, superDur: 4.2, bonus: 1.5, regenDelay: 2.5, regen: 0.06 };
const isBossE = (e) => e && (e.boss || e.superDef) && !e.child && scene === 'rift';
function brkInit(e) {
  if (e.brkMax) return;
  e.brkMax = e.superDef ? 140 : 100; e.brk = e.brkMax; e.brkT = 0; e.broken = 0; e.brkN = 0;
}

const _damageEnemyBrk = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (!isBossE(e) || e.dead) return _damageEnemyBrk(e, base, o);
  brkInit(e);
  // aturdido por la Ruptura: recibe más daño
  const b = e.broken > 0 ? base * BRK.bonus : base;
  const hp0 = e.hp;
  const r = _damageEnemyBrk(e, b, o);
  const dealt = Math.max(0, hp0 - e.hp);
  if (e.broken > 0 && dealt > 0 && !o.quiet) addText(e.x + rand(-12, 12), e.y - e.r * 2.6, '¡' + Math.round(dealt) + '!', '#bfe8ff', 1.25);
  if (e.broken <= 0 && dealt > 0) {
    // cuánto rompe: proporcional al daño, con mínimo por golpe; más si es fuerte o habilidad
    let k = clamp(dealt / e.maxHp * 520, 1.2, 14);
    if (o.heavy) k *= 1.6;
    if ((o.src || (typeof curSrc !== 'undefined' ? curSrc : '')) === 'skill') k *= 1.4;
    e.brk = Math.max(0, e.brk - k);
    e.brkT = 0;
    if (e.brk <= 0) brkBreak(e);
  }
  return r;
};

function brkBreak(e) {
  e.brkN++;
  e.broken = e.superDef ? BRK.superDur : BRK.dur;
  e.stunT = Math.max(e.stunT || 0, e.broken);
  e.atkT = 0; e.slamT = 0; e.st = 0;
  if (e.state && e.state !== 'move') e.state = 'move';
  // estallido de cristales
  for (let i = 0; i < 34; i++) {
    const a = rand(0, TAU), sp = rand(180, 520);
    particles.push({ kind: 'spark', x: e.x, y: e.y - e.r * 1.2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: rand(0.5, 0.9), max: 0.9, color: pick(['#e8f8ff', '#9fd8ff', '#ffffff', '#c8b8ff']), size: rand(2, 4), grav: 520 });
  }
  rings.push({ x: e.x, y: e.y, r0: e.r, r1: e.r * 7, life: 0.6, max: 0.6, color: 'rgba(170,220,255,' });
  rings.push({ x: e.x, y: e.y, r0: e.r * 0.5, r1: e.r * 4, life: 0.4, max: 0.4, color: 'rgba(255,255,255,' });
  hitFlash(e.x, e.y - e.r, e.r * 3, '190,230,255');
  shake(16); zoomPunch = Math.max(zoomPunch, 0.1);
  if (typeof slowT !== 'undefined') slowT = Math.max(slowT, 0.5);
  hitStop(0.12);
  SFX.play('crit'); SFX.play('shield');
  if (typeof buzz === 'function') buzz('break', [40, 30, 80], 0);
  subBanner = { text: '¡RUPTURA! · Aturdido y recibe un 50% más de daño', t: 2.6, max: 2.6 };
  addText(e.x, e.y - e.r * 3, '¡RUPTURA!', '#bfe8ff', 1.8);
}

// el tiempo de aturdimiento y la recarga de la barra
const _updateEnemyBrk = updateEnemy;
updateEnemy = function (e, dt) {
  if (isBossE(e) && !e.dead) {
    brkInit(e);
    if (e.broken > 0) {
      e.broken -= dt;
      e.stunT = Math.max(e.stunT || 0, Math.min(e.broken, 0.2));
      if (e.broken <= 0) { e.brkMax = Math.round(e.brkMax * 1.25); e.brk = e.brkMax; addText(e.x, e.y - e.r * 2.6, 'Se recupera', '#ffcf9a', 1); }
    } else {
      e.brkT += dt;
      if (e.brkT > BRK.regenDelay) e.brk = Math.min(e.brkMax, e.brk + e.brkMax * BRK.regen * dt);
    }
  }
  return _updateEnemyBrk(e, dt);
};

// estrellas que giran sobre la cabeza y brillo frío intermitente mientras está roto
const _drawEnemyBrk = drawEnemy;
drawEnemy = function (e) {
  _drawEnemyBrk(e);
  if (!(e.broken > 0) || e.dead) return;
  const top = e.y - Math.max(e.r * 2.2, (e.hTop || 0) + 6) - (e.z || 0);
  glow(e.x, e.y - e.r, e.r * 2.6, '160,210,255', 0.25 + Math.sin(now * 10) * 0.12);
  for (let i = 0; i < 5; i++) {
    const a = now * 4 + i / 5 * TAU, sx = e.x + Math.cos(a) * e.r * 0.9, sy = top + Math.sin(a) * e.r * 0.25;
    drawStar(sx, sy, 5 + (Math.sin(a) + 1) * 1.5, i % 2 ? '#fff4b0' : '#ffd54f');
  }
  // grietas de luz en el cuerpo
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(190,230,255,${0.5 + Math.sin(now * 14) * 0.25})`; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a0 = i * 1.7 + 0.4; ctx.beginPath(); ctx.moveTo(e.x, e.y - e.r);
    ctx.lineTo(e.x + Math.cos(a0) * e.r * 0.7, e.y - e.r + Math.sin(a0) * e.r * 0.6);
    ctx.lineTo(e.x + Math.cos(a0 + 0.5) * e.r * 1.1, e.y - e.r + Math.sin(a0 + 0.5) * e.r * 0.9); ctx.stroke();
  }
  ctx.restore();
};

// barra de Ruptura bajo la vida del jefe
const _drawHUDBrk = drawHUD;
drawHUD = function () {
  _drawHUDBrk();
  const e = bossRef;
  if (!e || e.dead || scene !== 'rift' || state !== 'play') return;
  brkInit(e);
  const s = ui, w = Math.min(W * 0.34, 300 * s), x = W / 2 - w / 2, y = 12 * s + 18 * s + 22 * s; // justo debajo de la barra de vida del jefe (drawHUD: pad = 12)
  const h = 6 * s, k = e.broken > 0 ? e.broken / (e.superDef ? BRK.superDur : BRK.dur) : e.brk / e.brkMax;
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,20,0.75)'; ctx.beginPath(); ctx.roundRect(x - 2 * s, y - 2 * s, w + 4 * s, h + 4 * s, 4 * s); ctx.fill();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  if (e.broken > 0) { g.addColorStop(0, '#9fd8ff'); g.addColorStop(1, '#e8f8ff'); } else { g.addColorStop(0, '#ffcf5a'); g.addColorStop(1, '#fff2b0'); }
  ctx.fillStyle = g; ctx.fillRect(x, y, w * clamp(k, 0, 1), h);
  // marcas de segmentos
  ctx.fillStyle = 'rgba(8,10,20,0.6)';
  for (let i = 1; i < 10; i++) ctx.fillRect(x + w * i / 10 - 0.5, y, 1, h);
  if (e.broken > 0) { ctx.globalAlpha = 0.5 + Math.sin(now * 12) * 0.3; ctx.strokeStyle = '#e8f8ff'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(x - 1, y - 1, w + 2, h + 2); ctx.globalAlpha = 1; }
  ctx.restore();
  text(e.broken > 0 ? '¡ROTO!' : 'Ruptura', x + w / 2, y + h / 2 + 0.5 * s, 8 * s, e.broken > 0 ? '#0b2238' : '#3a2604', 'center', 900, false);
};
