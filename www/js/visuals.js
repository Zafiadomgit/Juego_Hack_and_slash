/* Fendaria — impacto visual.
 *  · Ambiente por mundo: gradación de color cinematográfica, viñeta y clima propio (nieve, brasas,
 *    esporas, arena, burbujas, polvo de cristal, ceniza, chispas rúnicas).
 *  · Proyectiles enemigos con la paleta de cada mundo (adiós a las bolas verde neón).
 *  · Presentaciones: carta de título al entrar en un mundo y entrada de jefe con franjas de cine y retrato.
 */
'use strict';

const WORLD_FX = {
  ceniza: { top: '255,140,60', bot: '20,8,4', vig: 0.55, fx: 'ash', col: ['255,170,90', '200,190,180'], n: 38, shot: ['#ffb347', '255,140,40'], sub: 'El bosque que ardió' },
  pantano: { top: '120,200,120', bot: '4,16,10', vig: 0.6, fx: 'spore', col: ['170,255,140', '120,220,200'], n: 34, shot: ['#b6f08a', '120,230,120'], sub: 'Donde el agua guarda secretos' },
  glaciar: { top: '190,225,255', bot: '6,14,30', vig: 0.5, fx: 'snow', col: ['255,255,255', '210,235,255'], n: 70, shot: ['#bfe8ff', '140,200,255'], sub: 'Runas bajo el hielo eterno' },
  desierto: { top: '255,210,140', bot: '30,16,4', vig: 0.5, fx: 'sand', col: ['255,220,160', '230,180,110'], n: 55, shot: ['#ffd27a', '255,170,60'], sub: 'Arenas que esconden templos' },
  abismo: { top: '255,90,40', bot: '24,4,4', vig: 0.65, fx: 'ember', col: ['255,140,50', '255,90,30'], n: 50, shot: ['#ff7a3a', '255,90,30'], sub: 'El corazón ardiente de la Grieta' },
  hundida: { top: '90,200,230', bot: '2,12,24', vig: 0.6, fx: 'bubble', col: ['170,240,255', '120,210,255'], n: 30, shot: ['#8fe8ff', '80,200,255'], sub: 'Ruinas bajo la marea' },
  cristal: { top: '210,150,255', bot: '12,4,26', vig: 0.55, fx: 'shard', col: ['230,180,255', '150,230,255'], n: 40, shot: ['#e6b8ff', '200,140,255'], sub: 'Luz atrapada en piedra' },
  ciudadela: { top: '200,120,255', bot: '10,4,20', vig: 0.65, fx: 'rune', col: ['200,140,255', '255,214,110'], n: 32, shot: ['#d8a8ff', '180,110,255'], sub: 'La fortaleza del Cerrajero' },
};
const wfx = () => (scene === 'rift' && rift && rift.biome && WORLD_FX[rift.biome.id]) || null;

// ---------- clima (capa de pantalla, delante del mundo y detrás de la interfaz) ----------
let WX = [], wxId = null;
function wxSpawn(F, any) {
  const s = ui;
  const p = { x: rand(0, W), y: any ? rand(0, H) : (F.fx === 'bubble' || F.fx === 'ember' || F.fx === 'spore' || F.fx === 'rune' ? H + 10 : -10), ph: rand(0, TAU), c: pick(F.col), z: rand(0.5, 1.3) };
  if (F.fx === 'snow') { p.vx = rand(-20, 10) * s; p.vy = rand(25, 55) * s * p.z; p.r = rand(1, 2.6) * s * p.z; }
  else if (F.fx === 'sand') { p.x = any ? p.x : -10; p.y = rand(0, H); p.vx = rand(140, 260) * s * p.z; p.vy = rand(-10, 15) * s; p.r = rand(0.8, 1.8) * s; }
  else if (F.fx === 'ash') { p.vx = rand(-15, 15) * s; p.vy = rand(14, 32) * s * p.z; p.r = rand(1, 2.2) * s * p.z; }
  else if (F.fx === 'bubble') { p.vx = rand(-6, 6) * s; p.vy = -rand(18, 42) * s * p.z; p.r = rand(2, 5) * s * p.z; }
  else { p.vx = rand(-12, 12) * s; p.vy = -rand(12, 34) * s * p.z; p.r = rand(1.2, 2.6) * s * p.z; } // brasas, esporas, cristal, runas
  return p;
}
function wxDraw(F, dt) {
  if (wxId !== rift.biome.id) { wxId = rift.biome.id; WX = []; for (let i = 0; i < F.n; i++) WX.push(wxSpawn(F, true)); }
  ctx.save();
  for (let i = 0; i < WX.length; i++) {
    const p = WX[i];
    p.ph += dt * 2;
    p.x += (p.vx + Math.sin(p.ph) * 8 * ui) * dt; p.y += p.vy * dt;
    if (p.y < -20 || p.y > H + 20 || p.x < -20 || p.x > W + 20) { WX[i] = wxSpawn(F, false); continue; }
    const tw = 0.55 + 0.45 * Math.sin(p.ph * 1.7);
    if (F.fx === 'bubble') { ctx.globalAlpha = 0.5; ctx.strokeStyle = `rgba(${p.c},0.8)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke(); continue; }
    if (F.fx === 'shard' || F.fx === 'rune') {
      ctx.globalAlpha = 0.4 + 0.5 * tw; ctx.fillStyle = `rgba(${p.c},1)`;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - p.r * 1.8); ctx.lineTo(p.x + p.r, p.y); ctx.lineTo(p.x, p.y + p.r * 1.8); ctx.lineTo(p.x - p.r, p.y); ctx.closePath(); ctx.fill();
      continue;
    }
    const glowy = F.fx === 'ember' || F.fx === 'spore';
    if (glowy) { ctx.globalAlpha = 0.25 * tw; ctx.fillStyle = `rgba(${p.c},1)`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = (F.fx === 'sand' ? 0.45 : 0.75) * (glowy ? tw : 1);
    ctx.fillStyle = `rgba(${p.c},1)`;
    if (F.fx === 'sand') ctx.fillRect(p.x, p.y, p.r * 6, p.r * 0.8);
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
// gradación: luz cálida/fría desde arriba, sombra abajo y viñeta
const GRADE = new Map();
function gradeLayer(F) {
  const key = rift.biome.id + '|' + W + 'x' + H;
  let c = GRADE.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = Math.max(1, Math.round(W / 4)); c.height = Math.max(1, Math.round(H / 4));
    const g = c.getContext('2d'), w = c.width, h = c.height;
    let gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, `rgba(${F.top},0.10)`); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(${F.bot},0.28)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    gr = g.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.32, w / 2, h * 0.48, Math.max(w, h) * 0.72);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(${F.bot},${F.vig})`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    GRADE.clear(); GRADE.set(key, c);
  }
  return c;
}
let wxLast = 0;
const _drawHUDW = drawHUD;
drawHUD = function () {
  const F = wfx();
  if (F && QUALITY.level < 3) {
    const t = performance.now() / 1000, dt = Math.min(0.05, wxLast ? t - wxLast : 0); wxLast = t;
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(gradeLayer(F), 0, 0, W, H); ctx.restore();
    wxDraw(F, state === 'play' ? dt : 0);
  }
  _drawHUDW();
};

// ---------- proyectiles enemigos con la paleta del mundo ----------
const _drawProjectileW = drawProjectile;
drawProjectile = function (p) {
  const F = wfx();
  if (!F || p.team !== 'e' || p.look || p.kind !== 'seed') return _drawProjectileW(p);
  const a = Math.atan2(p.vy, p.vx);
  glow(p.x, p.y, p.r * 3.2, F.shot[1], 0.5);
  ctx.save();
  ctx.translate(p.x, p.y); ctx.rotate(a);
  const g = ctx.createLinearGradient(-p.r * 4, 0, 0, 0);
  g.addColorStop(0, `rgba(${F.shot[1]},0)`); g.addColorStop(1, `rgba(${F.shot[1]},0.7)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-p.r * 4, 0); ctx.lineTo(0, -p.r * 0.8); ctx.lineTo(0, p.r * 0.8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = F.shot[0]; ctx.strokeStyle = 'rgba(10,8,16,0.85)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, p.r * 0.85, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(-p.r * 0.2, -p.r * 0.25, p.r * 0.3, 0, TAU); ctx.fill();
  ctx.restore();
};

// ---------- presentaciones ----------
document.body.insertAdjacentHTML('beforeend', `<div id="cineBars" class="cine-bars"><i></i><i></i></div>
<div id="worldCard" class="world-card"><small></small><b></b><em></em><span></span></div>
<div id="bossCard" class="boss-card"><canvas width="220" height="220"></canvas><div><small></small><b></b><em></em></div></div>`);
let cardTimer = 0;
function bars(on) { $('cineBars').classList.toggle('show', on); }
function worldCard(B, sub, kicker) {
  const el = $('worldCard');
  $('bossCard').classList.remove('show');
  el.style.setProperty('--wc', WORLD_FX[B.id] ? `rgb(${WORLD_FX[B.id].shot[1]})` : '#ffd27a');
  el.querySelector('small').textContent = kicker;
  el.querySelector('b').textContent = B.name;
  el.querySelector('em').textContent = sub;
  el.querySelector('span').textContent = (WORLD_FX[B.id] && WORLD_FX[B.id].sub) || '';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  bars(true);
  clearTimeout(cardTimer);
  cardTimer = setTimeout(() => { el.classList.remove('show'); bars(false); }, 2900);
}
function bossCard(e) {
  $('worldCard').classList.remove('show'); subBanner = null;
  const el = $('bossCard'), cv = el.querySelector('canvas'), g = cv.getContext('2d');
  g.clearRect(0, 0, cv.width, cv.height);
  try {
    const id = monAnimId(e);
    if (typeof MON_ANIM !== 'undefined' && MON_ANIM[id]) {
      const c = monFrame(id, MON_ANIM[id].idle ? 'idle' : 'move', 0, null, rift.biome.id); // los jefes no llevan el filtro del mundo
      const k = Math.min(200 / c.width, 200 / c.height);
      g.imageSmoothingEnabled = false;
      g.drawImage(c, (cv.width - c.width * k) / 2, cv.height - c.height * k - 6, c.width * k, c.height * k);
    }
  } catch (err) { /* sin retrato */ }
  el.style.setProperty('--bc', e.superDef ? '#ff5a3d' : '#ffb347');
  el.querySelector('small').textContent = e.superDef ? 'Súper Jefe' : 'Guardián de la Grieta';
  el.querySelector('b').textContent = e.name;
  el.querySelector('em').textContent = 'niv. ' + e.lvl + ' · ' + rift.biome.name;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  bars(true);
  clearTimeout(cardTimer);
  cardTimer = setTimeout(() => { el.classList.remove('show'); bars(false); }, 2600);
  if (typeof slowT !== 'undefined') slowT = Math.max(slowT, 0.7);
  shake(10); zoomPunch = Math.max(zoomPunch, 0.06);
}
const _startNodeW = startNode;
startNode = function (b, n, d) {
  _startNodeW(b, n, d);
  if (rift.isDungeon) return;
  later(0.15, () => {
    if (!rift || rift.daily) return;
    banner = null; // la carta sustituye al cartel de texto
    worldCard(rift.biome, rift.isSuper ? 'Súper Jefe' : `Grieta ${n}`, `Capítulo ${rift.b + 1}`);
  });
};
const _spawnEnemyW = spawnEnemy;
spawnEnemy = function (type, x, y, o = {}) {
  const e = _spawnEnemyW(type, x, y, o);
  if (e && scene === 'rift' && (e.boss || e.superDef) && !e.child) later(0.05, () => { if (!e.dead) { banner = null; bossCard(e); } });
  return e;
};
const _goHubW = goHub;
goHub = function () { _goHubW(); $('worldCard').classList.remove('show'); $('bossCard').classList.remove('show'); bars(false); };
