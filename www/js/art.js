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
  const ns = Math.max(HD2D.on ? 0.25 : 1, Math.min(2.5, s));
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
    if (HD2D.on) pixelize(c);
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
// Arte pintado de los héroes (si existe la imagen se usa en lugar del dibujo vectorial)
const HERO_ART = {};
['iop'].forEach((id) => {
  const img = new Image();
  img.onload = () => { HERO_ART[id] = img; if (typeof onHeroArtLoaded === 'function') onHeroArtLoaded(); };
  img.src = 'img/heroes/' + id + '.png';
});
// Sprites pixel art de los héroes (estilo HD-2D); miran a su derecha
const HERO_PX = {};
['iop', 'cra', 'feca'].forEach((id) => {
  const img = new Image();
  img.onload = () => { HERO_PX[id] = img; if (typeof onHeroArtLoaded === 'function') onHeroArtLoaded(); };
  img.src = 'img/heroes/px/' + id + '.png';
});
// Animaciones dibujadas fotograma a fotograma (img/heroes/anim, ver tools/art/build_anims.py)
const HERO_ANIM_IMG = {};
const HERO_ANIM_FR = new Map(); // fotograma recortado en su propio canvas (para pixelImage)
Object.keys(typeof HERO_ANIM !== 'undefined' ? HERO_ANIM : {}).forEach((id) => {
  const img = new Image();
  img.onload = () => { HERO_ANIM_IMG[id] = img; };
  img.src = 'img/heroes/anim/' + id + '.webp';
});
function heroAnimFrame(cls, pose, f) {
  const A = HERO_ANIM[cls], list = A[pose] || A.idle, fr = list[f % list.length], key = cls + '|' + pose + '|' + (f % list.length);
  let c = HERO_ANIM_FR.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = fr[2]; c.height = fr[3];
    c.getContext('2d').drawImage(HERO_ANIM_IMG[cls], fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]);
    c.ax = fr[4]; c.ay = fr[5]; c.key = key;
    HERO_ANIM_FR.set(key, c);
  }
  return c;
}
// Elige pose y fotograma según lo que hace el héroe
function heroAnimPose(cls, o) {
  const A = HERO_ANIM[cls];
  if (o.hurt > 0) return ['hurt', 0];
  const atk = o.swing > 0 ? 1 - o.swing / 0.2 : o.shot > 0 ? 1 - o.shot / 0.15 : -1;
  if (atk >= 0) return ['attack', Math.min(A.attack.length - 1, Math.floor(atk * A.attack.length))];
  if (o.moving) return ['walk', Math.floor(o.walkT * Math.max(8, A.walk.length * 1.45)) % A.walk.length];
  return ['idle', Math.floor(o.t * 4) % A.idle.length];
}
// Dibuja un fotograma con los pies en (o.x, o.y); true si se ha podido
function drawHeroAnim(g, o) {
  const cls = o.cls;
  if (!cls || typeof HERO_ANIM === 'undefined' || !HERO_ANIM[cls] || !HERO_ANIM_IMG[cls]) return false;
  const [pose, f] = heroAnimPose(cls, o);
  const c = heroAnimFrame(cls, pose, f);
  const k = HERO_H * 0.95 / HERO_ANIM[cls].bh; // unidades de mundo por píxel del atlas
  const face = Math.cos(o.dir) >= 0 ? 1 : -1;
  g.save();
  // zancada: pequeño rebote y balanceo encima de los fotogramas de caminar
  const stride = pose === 'walk' ? o.walkT * 12 : 0;
  g.translate(o.x, o.y - (pose === 'walk' ? Math.abs(Math.sin(stride)) * 1.2 : 0));
  g.globalAlpha = o.alpha ?? 1;
  if (pose === 'walk') g.rotate(Math.sin(stride) * 0.015 + face * 0.03);
  g.scale(face, 1);
  if (HD2D.active && g === ctx) {
    const hpx = Math.max(8, Math.round(c.height * k * SPR.scale));
    const pi = smoothImage(c, hpx, c.key + '|' + hpx + '|r', true);
    const kk = (c.height * k) / hpx; // mundo por píxel pixelado
    g.drawImage(pi, -c.ax * k - kk, -c.ay * k - kk, pi.width * kk, pi.height * kk);
  } else {
    const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
    g.drawImage(c, -c.ax * k, -c.ay * k, c.width * k, c.height * k);
    g.imageSmoothingEnabled = sm;
  }
  g.restore();
  return true;
}

// Retratos pintados (img/portraits/<id>.webp): diálogos, HUD, jefes y selección de héroe
const PORTRAIT_IDS = ['hero_iop', 'hero_cra', 'hero_feca', 'hero_sombra', 'hero_domadora', 'hero_artificiera', 'hero_berserker',
  'ivo', 'brunilda', 'tobias', 'morvhal', 'boss_ceniza', 'boss_pantano', 'boss_glaciar', 'boss_desierto', 'boss_abismo'];
const portraitUrl = (id) => 'img/portraits/' + id + '.webp';
const PORTRAIT_IMG = {};
for (const id of PORTRAIT_IDS) { const im = new Image(); im.onload = () => { PORTRAIT_IMG[id] = im; }; im.src = portraitUrl(id); }

// Arte del héroe a usar: pixel art en HD-2D; si no, el pintado (o el pixel art si no hay pintado)
function heroArt(cls) {
  const px = HERO_PX[cls], pa = HERO_ART[cls];
  if (px && (HD2D.on || !pa)) return { img: px, right: true, px: true, url: 'img/heroes/px/' + cls + '.png' };
  if (pa) return { img: pa, right: false, px: false, url: 'img/heroes/' + cls + '.png' };
  return null;
}
const HERO_H = 84; // altura en unidades de mundo

// ---------- "Rig" de los héroes: torso + dos piernas, para animar a partir de una sola imagen ----------
// hip: altura de la cadera (fracción de la imagen); cx: separación entre piernas
const HERO_RIG = { iop: { hip: 0.6, cx: 0.5, stride: 0.24 }, cra: { hip: 0.6, cx: 0.52, stride: 0.22 }, feca: { hip: 0.72, cx: 0.5, stride: 0.16 } };
const POSE_FRAMES = { walk: 8, idle: 4, attack: 4, hurt: 1 };
const POSE_SRC = new Map();
// Compone una pose a resolución original: las piernas giran desde la cadera y el torso se inclina/rebota
function heroPoseSource(cls, img, pose, f) {
  const key = cls + '|' + pose + '|' + f;
  let c = POSE_SRC.get(key);
  if (c) return c;
  const W0 = img.width, H0 = img.height, R = HERO_RIG[cls] || HERO_RIG.iop;
  const pad = Math.round(H0 * 0.1);
  c = document.createElement('canvas');
  c.width = W0 + pad * 2; c.height = H0 + pad;
  const g = c.getContext('2d');
  const hipY = H0 * R.hip, cx = W0 * R.cx;
  let legL = 0, legR = 0, liftL = 0, liftR = 0, upY = 0, upRot = 0, upX = 0;
  const ph = (f / (POSE_FRAMES[pose] || 1)) * TAU;
  if (pose === 'walk') {
    const s = Math.sin(ph);
    legL = s * R.stride; legR = -s * R.stride;
    liftL = Math.max(0, -s) * H0 * 0.035; liftR = Math.max(0, s) * H0 * 0.035;
    upY = -Math.abs(Math.cos(ph)) * H0 * 0.025; upRot = 0.04;
  } else if (pose === 'idle') {
    upY = [0, 1, 2, 1][f] * H0 * 0.006;
  } else if (pose === 'attack') {
    upRot = [-0.14, 0.3, 0.2, 0.06][f]; upX = [-0.025, 0.06, 0.04, 0.01][f] * H0;
    legL = -0.1; legR = 0.12;
  } else if (pose === 'hurt') {
    upRot = -0.2; upX = -0.035 * H0; legL = 0.06; legR = -0.04;
  }
  // piernas (cada una gira desde su cadera; el recorte gira con ella)
  for (const [side, ang, lift] of [[-1, legL, liftL], [1, legR, liftR]]) {
    g.save();
    const px = pad + cx + side * W0 * 0.1, py = pad + hipY;
    g.translate(px, py - lift); g.rotate(ang); g.translate(-px, -py);
    g.beginPath();
    if (side < 0) g.rect(pad, pad + hipY, cx, H0 - hipY + 2); else g.rect(pad + cx, pad + hipY, W0 - cx, H0 - hipY + 2);
    g.clip();
    g.drawImage(img, pad, pad);
    g.restore();
  }
  // torso (se solapa un poco con la cadera para no dejar huecos)
  g.save();
  const px = pad + cx, py = pad + hipY;
  g.translate(px + upX, py + upY); g.rotate(upRot); g.translate(-px, -py);
  g.beginPath(); g.rect(0, 0, c.width, pad + hipY + H0 * 0.04); g.clip();
  g.drawImage(img, pad, pad);
  g.restore();
  c.pad = pad; c.H0 = H0; c.W0 = W0;
  POSE_SRC.set(key, c);
  return c;
}
// Elige la pose y el fotograma según lo que hace el héroe
function heroPoseFor(o) {
  if (o.hurt > 0) return ['hurt', 0];
  const atk = o.swing > 0 ? 1 - o.swing / 0.2 : o.shot > 0 ? 1 - o.shot / 0.15 : -1;
  if (atk >= 0) return ['attack', Math.min(3, Math.floor(atk * 4))];
  if (o.moving) return ['walk', Math.floor((o.walkT * 9) % 8)];
  return ['idle', Math.floor((o.t * 2.5) % 4)];
}

function drawHeroImage(g, img, o, right = false) {
  const face = Math.cos(o.dir) >= 0 ? 1 : -1;
  const flip = right ? face : -face;
  const run = o.moving ? o.walkT * 12 : 0;
  const breath = Math.sin(o.t * 3);
  const hop = o.moving ? Math.abs(Math.sin(run)) * 3 : 0;
  let tilt = o.moving ? Math.sin(run) * 0.05 + face * 0.06 : breath * 0.012;
  let sx = 1 + (o.moving ? 0 : breath * 0.012), sy = 1 - (o.moving ? 0 : breath * 0.012);
  let lunge = 0;
  if (o.swing > 0) {
    const k = 1 - o.swing / 0.2;
    tilt = face * Math.sin(k * Math.PI) * 0.22 * (o.swingSide || 1);
    lunge = Math.sin(k * Math.PI) * 5;
    sx *= 1 + Math.sin(k * Math.PI) * 0.06;
    sy *= 1 - Math.sin(k * Math.PI) * 0.05;
  }
  const h = HERO_H, w = h * img.width / img.height;
  g.save();
  g.translate(o.x + Math.cos(o.dir) * lunge, o.y + Math.sin(o.dir) * lunge * 0.5 - hop);
  g.globalAlpha = o.alpha ?? 1;
  if (HD2D.active && g === ctx) {
    // HD-2D: sprite pixelado y animado por poses (caminar, respirar, atacar, recibir daño)
    if (right && o.cls) {
      const [pose, f] = heroPoseFor(o);
      const src = heroPoseSource(o.cls, img, pose, f);
      const hpx = Math.max(8, Math.round(h * SPR.scale * src.height / src.H0));
      const pi = pixelImage(src, hpx, o.cls + '|' + pose + '|' + f + '|' + hpx);
      const k = h / src.H0; // unidades de mundo por píxel de la imagen original
      g.translate(-Math.cos(o.dir) * lunge, -Math.sin(o.dir) * lunge * 0.5 + hop); // la pose ya incluye el movimiento
      g.scale(flip, 1);
      g.drawImage(pi, -(src.W0 / 2 + src.pad) * k - 1 / SPR.scale, -src.height * k - 1 / SPR.scale, pi.width / SPR.scale, pi.height / SPR.scale);
      g.restore();
      return;
    }
    const pi = pixelImage(img, Math.max(8, Math.round(h * SPR.scale)));
    g.scale(flip * (sx > 1.03 ? 1.08 : 1), sy < 0.97 ? 0.94 : 1);
    g.drawImage(pi, -w / 2 - 1 / SPR.scale, -h - 1 / SPR.scale, pi.width / SPR.scale, pi.height / SPR.scale);
    g.restore();
    return;
  }
  g.rotate(tilt);
  g.scale(sx * flip, sy);
  const sm = g.imageSmoothingEnabled;
  if (right) g.imageSmoothingEnabled = false; // pixel art nítido también en estilo clásico
  g.drawImage(img, -w / 2, -h, w, h);
  g.imageSmoothingEnabled = sm;
  g.restore();
}

// Dibuja al personaje (también usado en las tarjetas del menú y el retrato)
function drawHero(g, clsId, o) {
  const art = heroArt(clsId);
  o.cls = clsId;
  if (drawHeroAnim(g, o)) return;
  if (art) { drawHeroImage(g, art.img, o, art.right); return; }
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

function bestRarity() {
  let b = -1;
  for (const s of SLOTS) if (S.equip[s]) b = Math.max(b, S.equip[s].rarity);
  return b;
}

function drawPlayer() {
  let jumpH = 0;
  if (P.jump) { const k = P.jump.t / P.jump.dur; jumpH = Math.sin(k * Math.PI) * 55; }
  shadow(P.x, P.y + 1, 13 * (1 - jumpH / 150));
  // aura de Trascendencia (rango 10)
  if (typeof transRank === 'function' && transRank() >= 10) {
    glow(P.x, P.y - 22, 46, '255,214,110', 0.35 + Math.sin(now * 3) * 0.1);
    if (Math.random() < 0.25) particles.push({ kind: 'glowdot', x: P.x + rand(-12, 12), y: P.y - rand(0, 36), vx: 0, vy: -30, life: 0.7, max: 0.7, rgb: '255,214,110', size: 3, grav: 0 });
  }
  glow(P.x, P.y - 34, 50, '255,226,180', 0.12); // halo muy suave
  if (typeof lbRank === 'function' && lbRank() >= 5) glow(P.x, P.y - 30, 64, '255,90,210', 0.3 + Math.sin(now * 3) * 0.1); // aura de Ruptura
  const br = bestRarity();
  if (br >= 1) {
    const rgb = RARITY_RGB[br];
    ctx.save();
    ctx.translate(P.x, P.y);
    ctx.scale(1, 0.4);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45 + Math.sin(now * 4) * 0.15;
    circle(0, 0, 22, null, `rgba(${rgb},0.9)`, 2.5);
    ctx.restore();
    glow(P.x, P.y - 4, 34, rgb, 0.35);
    if (br >= 2 && Math.random() < (br === 3 ? 0.35 : 0.15)) {
      particles.push({ kind: 'glowdot', x: P.x + rand(-12, 12), y: P.y - rand(0, 30), vx: 0, vy: -50, life: 0.8, max: 0.8, rgb, size: 4, grav: 0 });
    }
  }
  if (P.shield > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(now * 6) * 0.08;
    circle(P.x, P.y - 18 - jumpH, 26, 'rgba(120,200,255,0.35)', '#8fd0ff', 2);
    ctx.restore();
  }
  const blink = P.invul > 0 && P.dashT <= 0 && Math.floor(now * 22) % 2 === 0;
  // aplastar/estirar, inclinarse al correr y retroceder al recibir golpes
  const sq = P.sq || 0;
  ctx.save();
  ctx.translate(P.x, P.y - jumpH);
  ctx.rotate((P.lean || 0) + (P.recoil || 0));
  ctx.scale(1 + sq * 0.16, 1 - sq * 0.14);
  drawHero(ctx, P.cls, {
    x: 0, y: 0, dir: P.dir, walkT: P.walkT, moving: P.moving && P.lock <= 0,
    swing: P.swingT, swingSide: P.swingSide, shot: P.shotT, hurt: P.hurtFlash, t: now, alpha: blink ? 0.45 : 1,
  });
  ctx.restore();
  if (P.hurtFlash > 0) {
    ctx.save();
    ctx.globalAlpha = P.hurtFlash * 2;
    circle(P.x, P.y - 20, 18, 'rgba(255,60,60,0.5)');
    ctx.restore();
  }
}

// Estelas del esquive
function drawGhosts() {
  if (!ghosts.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const g of ghosts) {
    const a = g.life / g.max;
    drawHero(ctx, P.cls, { x: g.x, y: g.y, dir: g.dir, walkT: g.walkT, moving: true, swing: 0, swingSide: 1, shot: 0, t: now, alpha: a * 0.35 });
  }
  ctx.restore();
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

const GOLEM_PAL = {
  lava: { leg: '#3b3534', body: '#4d4544', hi: '#5c5352', head: '#5a5150', arm: '#433c3b', ln: '#120c0a', cracks: [['rgba(255,110,30,0.35)', 5], ['#ff8a3d', 2.2], ['#ffd27a', 0.8]], eye: '#ffc24a', moss: '#4f7a2f', glow: '255,140,40' },
  ice: { leg: '#4a6278', body: '#6f8fa8', hi: '#a8c8e0', head: '#7f9fb8', arm: '#5a7890', ln: '#0e1a28', cracks: [['rgba(120,220,255,0.35)', 5], ['#7fe0ff', 2.2], ['#ffffff', 0.8]], eye: '#c8f4ff', moss: '#e8f4ff', glow: '140,220,255' },
};
function artGolem(p, face, v, windK, palName) {
  const P_ = GOLEM_PAL[palName || 'lava'];
  const g = ctx;
  g.save();
  g.scale(face, 1);
  g.lineWidth = 2; g.strokeStyle = P_.ln; g.lineJoin = 'round';
  const stomp = v === 'move' ? Math.sin(p * TAU) * 2 : 0;
  g.fillStyle = P_.leg;
  g.beginPath(); g.roundRect(-14, -12 + stomp, 10, 12, 3); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(4, -12 - stomp, 10, 12, 3); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-20, -44); g.lineTo(20, -46); g.lineTo(21, -12); g.lineTo(-21, -11); g.closePath();
  blob(g, P_.body, P_.ln);
  g.fillStyle = P_.hi; g.beginPath(); g.moveTo(-17, -42); g.lineTo(-2, -43); g.lineTo(-4, -30); g.lineTo(-17, -28); g.closePath(); g.fill();
  // grietas de lava (resplandor + núcleo)
  for (const [col, w] of P_.cracks) {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-10, -40); g.lineTo(-4, -32); g.lineTo(-8, -24); g.lineTo(-2, -15); g.moveTo(8, -42); g.lineTo(12, -34); g.lineTo(6, -28); g.stroke();
  }
  g.lineWidth = 2; g.strokeStyle = P_.ln;
  // musgo (o escarcha) en hombros
  g.fillStyle = P_.moss; g.beginPath(); g.ellipse(-16, -45, 7, 3, -0.2, 0, TAU); g.fill();
  if (palName === 'ice') {
    // cristales de hielo sobre los hombros
    for (const [x, h, a] of [[-16, 18, -0.4], [-9, 24, -0.1], [14, 20, 0.35], [8, 14, 0.1]]) {
      g.save(); g.translate(x, -45); g.rotate(a);
      g.beginPath(); g.moveTo(-3.5, 0); g.lineTo(0, -h); g.lineTo(3.5, 0); g.closePath(); blob(g, '#bfe8ff', P_.ln);
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(-1.8, -1); g.lineTo(0, -h + 3); g.lineTo(0, -1); g.closePath(); g.fill();
      g.restore();
    }
  }
  // cabeza
  g.beginPath(); g.roundRect(-8, -60, 22, 16, 5); blob(g, P_.head, P_.ln);
  g.fillStyle = P_.eye; g.fillRect(3, -55, 4, 3); g.fillRect(9, -55, 3, 3);
  // brazos: se elevan al cargar el golpe
  const armY = -36 - windK * 22;
  g.beginPath(); g.arc(-25, armY, 9.5, 0, TAU); blob(g, P_.arm, P_.ln);
  g.beginPath(); g.arc(25, armY, 9.5, 0, TAU); blob(g, P_.arm, P_.ln);
  if (windK > 0) {
    g.fillStyle = `rgba(${P_.glow},${0.25 + windK * 0.4})`;
    g.beginPath(); g.arc(-25, armY, 5, 0, TAU); g.arc(25, armY, 5, 0, TAU); g.fill();
  }
  g.restore();
}


// Reina Tejeceniza: araña enorme con corona de quitina y abdomen venenoso
function artSpiderQueen(p, face, v) {
  const g = ctx;
  g.save();
  g.scale(face, 1);
  g.translate(0, -8);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const crouch = v === 'wind' ? 4 : 0;
  // patas segmentadas
  for (let i = 0; i < 4; i++) {
    const wig = Math.sin(p * TAU * 2 + i * 1.3) * 4;
    for (const side of [-1, 1]) {
      const bx = -8 + i * 7;
      const kx = bx + (i - 1.5) * 9 + wig * 0.5, ky = -14 + side * 16 - 10 + crouch;
      const fx = bx + (i - 1.5) * 16 + wig, fy = 8 + side * 4;
      g.strokeStyle = '#0c0a10'; g.lineWidth = 5.5;
      g.beginPath(); g.moveTo(bx, -14 + crouch); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
      g.strokeStyle = '#3a3448'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(bx, -14 + crouch); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
      g.fillStyle = '#9be05a'; g.beginPath(); g.arc(kx, ky, 1.6, 0, TAU); g.fill();
    }
  }
  g.lineWidth = 2; g.strokeStyle = '#0c0a10';
  // abdomen con marcas que brillan
  g.beginPath(); g.ellipse(-18, -20 + crouch, 22, 17, -0.15, 0, TAU); blob(g, '#2c2636', '#0c0a10');
  g.fillStyle = '#3d3550'; g.beginPath(); g.ellipse(-22, -28 + crouch, 13, 7, -0.2, 0, TAU); g.fill();
  const pulse = 0.6 + Math.sin(p * TAU) * 0.4;
  g.fillStyle = `rgba(155,224,90,${0.55 + pulse * 0.45})`;
  g.beginPath(); g.moveTo(-30, -22 + crouch); g.lineTo(-20, -30 + crouch); g.lineTo(-10, -22 + crouch); g.lineTo(-20, -14 + crouch); g.closePath(); g.fill();
  g.beginPath(); g.arc(-32, -14 + crouch, 2.5, 0, TAU); g.arc(-8, -14 + crouch, 2.5, 0, TAU); g.fill();
  // tórax
  g.beginPath(); g.ellipse(6, -18 + crouch, 12, 10, 0, 0, TAU); blob(g, '#3a3448', '#0c0a10');
  // cabeza con corona
  g.beginPath(); g.arc(18, -20 + crouch, 8, 0, TAU); blob(g, '#4a4258', '#0c0a10');
  g.beginPath(); g.moveTo(12, -26 + crouch); g.lineTo(13, -36 + crouch); g.lineTo(16, -30 + crouch); g.lineTo(19, -38 + crouch); g.lineTo(21, -30 + crouch); g.lineTo(25, -35 + crouch); g.lineTo(24, -25 + crouch); g.closePath();
  blob(g, '#6a5a2a', '#0c0a10');
  g.fillStyle = '#9be05a'; g.beginPath(); g.arc(19, -31 + crouch, 1.6, 0, TAU); g.fill();
  // ojos
  g.fillStyle = v === 'wind' || v === 'web' ? '#ffef5a' : '#ff4a3d';
  for (const [x, y, r] of [[20, -22, 1.8], [24, -21, 1.6], [21, -18, 1.3], [24.5, -17.5, 1.2], [17, -19, 1.1]]) { g.beginPath(); g.arc(x, y + crouch, r, 0, TAU); g.fill(); }
  // quelíceros
  g.strokeStyle = '#d8d0b0'; g.lineWidth = 2.2;
  const bite = v === 'web' ? 2 : Math.sin(p * TAU * 2);
  g.beginPath(); g.moveTo(24, -14 + crouch); g.quadraticCurveTo(28, -10, 25 + bite, -6 + crouch); g.moveTo(20, -13 + crouch); g.quadraticCurveTo(22, -8, 19 - bite, -6 + crouch); g.stroke();
  g.restore();
}

// Hechicero del Abismo: túnica flotante, capucha con ojos ardientes y bastón con orbe
function artMage(p, face, v) {
  const g = ctx;
  g.save();
  g.scale(face, 1);
  const hover = Math.sin(p * TAU) * 3;
  g.translate(0, -10 - hover);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.lineWidth = 2; g.strokeStyle = '#0a0610';
  // jirones de la túnica
  const fl = Math.sin(p * TAU * 2) * 3;
  g.beginPath();
  g.moveTo(-16, -24); g.quadraticCurveTo(-22, -6, -18 + fl, 8); g.lineTo(-10, 2); g.lineTo(-5 - fl, 10); g.lineTo(0, 3); g.lineTo(6 + fl, 10); g.lineTo(10, 2); g.lineTo(18 - fl, 7); g.quadraticCurveTo(20, -8, 14, -24); g.closePath();
  blob(g, '#2a1838', '#0a0610');
  g.fillStyle = '#3e2452'; g.beginPath(); g.moveTo(-4, -24); g.lineTo(-8, 4); g.lineTo(0, 2); g.lineTo(4, -24); g.closePath(); g.fill();
  // ribete rúnico
  g.strokeStyle = '#c07cf0'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-17, 2); g.lineTo(-10, 0); g.moveTo(10, 0); g.lineTo(17, 3); g.moveTo(-1, -16); g.lineTo(-1, -2); g.stroke();
  g.lineWidth = 2; g.strokeStyle = '#0a0610';
  // hombreras
  g.beginPath(); g.ellipse(-12, -26, 8, 5, -0.3, 0, TAU); blob(g, '#4a3060', '#0a0610');
  g.beginPath(); g.ellipse(12, -26, 8, 5, 0.3, 0, TAU); blob(g, '#4a3060', '#0a0610');
  // capucha
  g.beginPath(); g.moveTo(-11, -26); g.quadraticCurveTo(-12, -44, 0, -50); g.quadraticCurveTo(10, -46, 13, -26); g.quadraticCurveTo(0, -22, -11, -26); g.closePath();
  blob(g, '#33204a', '#0a0610');
  g.fillStyle = '#05030a'; g.beginPath(); g.ellipse(3, -33, 7, 7.5, 0, 0, TAU); g.fill();
  const hot = v === 'cast' || v === 'wind' || v === 'spiral';
  g.fillStyle = hot ? '#fff0ff' : '#e080ff';
  g.beginPath(); g.ellipse(1, -34, 1.6, 1.1, 0, 0, TAU); g.ellipse(6, -34, 1.6, 1.1, 0, 0, TAU); g.fill();
  // bastón con orbe
  const lift = hot ? -8 : 0;
  g.strokeStyle = '#1a0e08'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(20, 6 + lift); g.lineTo(22, -40 + lift); g.stroke();
  g.strokeStyle = '#5a3a24'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(20, 6 + lift); g.lineTo(22, -40 + lift); g.stroke();
  g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(22, -40 + lift); g.quadraticCurveTo(28, -46 + lift, 24, -52 + lift); g.moveTo(22, -40 + lift); g.quadraticCurveTo(16, -46 + lift, 20, -52 + lift); g.stroke();
  g.fillStyle = 'rgba(200,110,255,0.35)'; g.beginPath(); g.arc(22, -48 + lift, 9, 0, TAU); g.fill();
  g.fillStyle = '#c07cf0'; g.beginPath(); g.arc(22, -48 + lift, 5, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(20.5, -49.5 + lift, 1.8, 0, TAU); g.fill();
  // mano
  g.fillStyle = '#6a5a7a'; g.beginPath(); g.arc(19, -20 + lift * 0.5, 3, 0, TAU); g.fill();
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
  reinaTeje:    { r0: 30, w: 110, h: 76, ax: 55, ay: 62, rate: 1.3, vary: (e) => (e.state === 'wind' || e.state === 'web' ? e.state : 'move'), draw: (p, f, v) => artSpiderQueen(p, f, v) },
  colosoHielo:  { r0: 25, w: 78, h: 92, ax: 39, ay: 88, rate: 0.7, vary: (e) => (e.state === 'wind' ? 'w' + Math.min(3, Math.floor((1 - e.st / (e.max || 1.1)) * 4)) : e.state === 'move' ? 'move' : 'rest'),
                  draw: (p, f, v) => artGolem(p, f, v, v[0] === 'w' ? (+v[1] + 1) / 4 : 0, 'ice') },
  hechicero:    { r0: 22, w: 70, h: 84, ax: 33, ay: 76, rate: 0.8, vary: (e) => (e.state === 'cast' || e.state === 'wind' || e.state === 'spiral' ? e.state : 'move'), draw: (p, f, v) => artMage(p, f, v) },
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
  if ((e.type === 'bouftouRoyal' || e.type === 'reinaTeje') && e.state === 'leap') {
    const k = 1 - e.st / e.max, R = e.type === 'reinaTeje' ? 150 : 170;
    circle(e.tx, e.ty, R, 'rgba(255,60,30,0.12)', 'rgba(255,60,30,0.7)', 3);
    circle(e.tx, e.ty, R * k, 'rgba(255,60,30,0.22)');
  }
  if (e.type === 'hechicero' && (e.state === 'cast' || e.state === 'spiral')) {
    ctx.save();
    ctx.translate(e.x, e.y); ctx.scale(1, 0.45); ctx.rotate(now * 2);
    ctx.globalCompositeOperation = 'lighter';
    circle(0, 0, e.r * 2.2, null, 'rgba(192,124,240,0.7)', 3);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; circle(Math.cos(a) * e.r * 2.2, Math.sin(a) * e.r * 2.2, 4, 'rgba(230,180,255,0.9)'); }
    ctx.restore();
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

  // estela de la embestida
  if (e.state === 'charge' && (e.cdx || e.cdy)) {
    for (let i = 3; i >= 1; i--) {
      const gh = Object.assign({}, e, { x: e.x - (e.cdx || 0) * i * e.r * 0.9, y: e.y - (e.cdy || 0) * i * e.r * 0.9, alpha: 0.32 - i * 0.08, flash: 0, atkT: 0 });
      drawMonsterBody(gh);
    }
    ctx.globalAlpha = 1;
  }
  shadow(e.x, e.y + 1, e.r * (1 - Math.min(0.6, e.z / 200)));
  if (e.elite) glow(e.x, e.y - e.r * 0.8 - e.z, e.r * 2.6, hexRgb(e.elite.color), 0.45 + Math.sin(now * 5) * 0.12);
  if (e.superDef) {
    // aura del Súper Jefe: anillos que giran y chispas oscuras
    const au = e.superDef.aura;
    glow(e.x, e.y - e.r - e.z, e.r * 4, au, 0.55 + Math.sin(now * 3) * 0.15);
    ctx.save();
    ctx.translate(e.x, e.y); ctx.scale(1, 0.4);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++) {
      ctx.rotate(now * (i ? -1.3 : 0.9));
      ctx.setLineDash([e.r * 0.5, e.r * 0.35]);
      circle(0, 0, e.r * (1.5 + i * 0.35), null, `rgba(${au},0.7)`, 3);
    }
    ctx.setLineDash([]);
    ctx.restore();
    if (Math.random() < 0.5) particles.push({ kind: 'glowdot', x: e.x + rand(-e.r, e.r), y: e.y - rand(0, e.r * 2), vx: 0, vy: -70, life: 0.7, max: 0.7, rgb: au, size: 5, grav: 0 });
  } else if (e.boss) glow(e.x, e.y - e.r - e.z, e.r * 3, e.enraged ? '255,60,20' : '255,170,80', 0.4 + Math.sin(now * 3) * 0.1);
  drawMonsterBody(e);
  if (e.enraged && e.flash <= 0 && Math.random() < 0.3) particles.push({ x: e.x + rand(-e.r, e.r), y: e.y - rand(0, e.r * 2), vx: 0, vy: -60, life: 0.4, max: 0.4, color: '#ff3d00', size: rand(3, 5), grav: 0 });
  if (e.slowT > 0) circle(e.x, e.y - e.r, 3, '#ff7043');

  // barra de vida
  // ojos que brillan cuando va a atacar
  if (e.state === 'wind' || e.state === 'charge' || e.enraged) glow(e.x + e.face * e.r * 0.5, e.y - e.r * 1.3 - e.z, e.r * 0.9, '255,60,30', 0.7);
  const y = e.y - e.r * 2 - 18 - e.z;
  if ((e.hp < e.maxHp || e.elite) && !e.boss) {
    const bw = Math.max(26, e.r * 2.2);
    const k = Math.max(0, e.hp / e.maxHp);
    e.hpShow = e.hpShow === undefined ? k : Math.max(k, e.hpShow - 0.012);
    ctx.fillStyle = 'rgba(10,4,2,0.75)'; ctx.fillRect(e.x - bw / 2 - 1.5, y - 1.5, bw + 3, 7);
    ctx.fillStyle = '#fff3c4'; ctx.fillRect(e.x - bw / 2, y, bw * e.hpShow, 4);
    ctx.fillStyle = e.elite ? e.elite.color : '#e53935'; ctx.fillRect(e.x - bw / 2, y, bw * k, 4);
  }
  if (e.elite) text(e.name + ' · nv. ' + e.lvl, e.x, y - 9, 10, '#9fd3ff', 'center', 800);
  if (e.spawnT > 0) ctx.restore();
}


// Cadáver: destello, sale despedido, se vuelca y se deshace en ascuas
function drawCorpse(c) {
  const k = c.ct / c.cmax;
  c.dsx = 1; c.dsy = 1; c.rot = 0;
  let sink = 0, jx = 0;
  if (c.style === 'burst') {
    // el Chispín se infla y revienta en llamas
    c.dsx = c.dsy = 1 + k * 0.8; c.alpha = 1 - k;
    glow(c.x, c.y - c.r, c.r * 3 * (1 + k), '255,150,50', 0.8 * (1 - k));
  } else if (c.style === 'crumble') {
    // el gólem tiembla y se hunde en el suelo mientras se desmorona
    c.dsy = 1 - k * 0.55; c.dsx = 1 + k * 0.15; sink = k * c.r * 0.4;
    jx = Math.sin(c.ct * 70) * 1.5 * (1 - k);
    c.alpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
  } else if (c.style === 'deflate') {
    // la seta se desinfla soltando esporas
    c.dsy = Math.max(0.15, 1 - k * 1.2); c.dsx = 1 + k * 0.5; c.alpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
  } else if (c.style === 'curl') {
    // la araña se da la vuelta y encoge las patas
    c.dsy = Math.cos(Math.min(1, k * 2.5) * Math.PI) * 0.85; c.dsx = 1 - k * 0.3; c.alpha = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
  } else if (c.style === 'boss') {
    // el Guardián parpadea en blanco, se encoge y estalla en luz
    c.flash = Math.sin(c.ct * 30) > 0 && k < 0.75 ? 0.05 : 0;
    jx = Math.sin(c.ct * 55) * 2.5 * (1 - k);
    c.dsx = 1 + Math.sin(c.ct * 12) * 0.05; c.dsy = 1 - k * 0.3;
    c.alpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
    glow(c.x, c.y - c.r, c.r * (2 + k * 6), '255,240,200', 0.25 + k * 0.6);
    if (k > 0.74 && !c.blown) {
      c.blown = true;
      hitFlash(c.x, c.y - c.r, c.r * 3, '255,240,200');
      rings.push({ x: c.x, y: c.y, r0: 20, r1: c.r * 6, life: 0.5, max: 0.5, color: 'rgba(255,230,180,' });
      embers(c.x, c.y - c.r, 30, '255,200,120', c.r * 1.5);
      shake(16); SFX.play('boom'); zoomPunch = Math.max(zoomPunch, 0.1);
    }
  } else {
    const fall = Math.min(1, k * 3.2);
    c.rot = c.fall * (fall * (2 - fall)) * 1.45;
    c.alpha = k < 0.5 ? 1 : Math.max(0, 1 - (k - 0.5) / 0.5);
    sink = k > 0.5 ? (k - 0.5) * c.r * 0.6 : 0;
  }
  shadow(c.x, c.y + 1, c.r * (1 - k * 0.6));
  ctx.save();
  ctx.translate(jx, sink);
  drawMonsterBody(c);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Peligros telegrafiados en el suelo
function drawHazard(h) {
  const col = HAZ_COL[h.kind];
  if (!h.fired) {
    const k = 1 - h.t / h.max;
    ctx.save();
    ctx.translate(h.x, h.y); ctx.scale(1, h.kind === 'meteor' || h.kind === 'slam' ? 0.75 : 0.8);
    circle(0, 0, h.r, `rgba(${col},0.12)`, `rgba(${col},${0.5 + k * 0.4})`, 2.5);
    circle(0, 0, h.r * k, `rgba(${col},0.28)`);
    ctx.restore();
    if (h.kind === 'meteor') {
      // la roca ardiente cae del cielo
      const fz = (1 - k) * 260;
      glow(h.x + fz * 0.4, h.y - fz, 26, '255,130,40', 0.9);
      circle(h.x + fz * 0.4, h.y - fz, 9, '#3a1a10', '#ffb040', 2);
    }
    return;
  }
  if (h.kind === 'ice') {
    const a = Math.max(0, h.post / 0.7);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(h.x, h.y);
    const grow = Math.min(1, (0.7 - h.post) * 12);
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#2a4a6a';
    for (const [x, hh, an] of [[-10, 30, -0.35], [0, 42, 0], [10, 28, 0.4], [-4, 20, -0.7], [6, 18, 0.7]]) {
      ctx.save(); ctx.translate(x, 4); ctx.rotate(an);
      ctx.fillStyle = '#bfe8ff';
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -hh * grow); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.moveTo(-2.5, -1); ctx.lineTo(0, -hh * grow + 4); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    glow(h.x, h.y - 16, 30, col, 0.5 * a);
  } else if (h.kind === 'fire' && h.linger > 0) {
    const a = Math.min(1, h.linger);
    glow(h.x, h.y, h.r * 1.1, '255,90,20', 0.55 * a);
    ctx.save();
    ctx.globalAlpha = 0.5 * a;
    ctx.translate(h.x, h.y); ctx.scale(1, 0.5);
    circle(0, 0, h.r * 0.85, 'rgba(120,20,0,0.5)');
    ctx.restore();
    ctx.globalAlpha = 1;
  } else if (h.kind === 'web' && h.linger > 0) {
    const a = Math.min(1, h.linger);
    ctx.save();
    ctx.globalAlpha = 0.6 * a;
    ctx.translate(h.x, h.y); ctx.scale(1, 0.6);
    ctx.strokeStyle = '#e8f0e0'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * h.r, Math.sin(an) * h.r); ctx.stroke(); }
    for (const rr of [0.3, 0.55, 0.8, 1]) {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) { const an = (i / 8) * TAU; const x = Math.cos(an) * h.r * rr, y = Math.sin(an) * h.r * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Cuerpo animado del monstruo (desde la caché de sprites)
// ---------- Monstruos con animación pintada (img/monsters, ver tools/art/build_monsters.py) ----------
const MON_IMG = {};
Object.keys(typeof MON_ANIM !== 'undefined' ? MON_ANIM : {}).forEach((id) => {
  const img = new Image();
  img.onload = () => { MON_IMG[id] = img; };
  img.src = 'img/monsters/' + id + '.webp';
});
const MON_FR = new Map();
const monAnimId = (e) => (e.superDef ? 'S_' + Object.keys(SUPER_BOSSES).find((k) => SUPER_BOSSES[k] === e.superDef) : e.type);
const ATTACK_STATES = { wind: 1, charge: 1, cast: 1, spiral: 1, summon: 1, throw: 1, volley: 1, web: 1, leap: 1 };
function monPose(e, A) {
  if (e.flash > 0.04 && A.hurt) return ['hurt', 0];
  if (ATTACK_STATES[e.state] || e.atkT > 0 || e.slamT > 0) {
    const n = A.attack.length;
    const k = e.atkT > 0 ? 1 - e.atkT / 0.25 : e.slamT > 0 ? 0.75 + (1 - e.slamT / 0.3) * 0.25 : e.max ? clamp(1 - e.st / e.max, 0, 0.7) : (e.t * 1.6) % 1;
    return ['attack', Math.min(n - 1, Math.floor(k * n))];
  }
  if (e.state === 'rest' && A.idle) return ['idle', Math.floor(e.t * 5) % A.idle.length];
  return ['move', Math.floor(e.t * (e.boss ? 9 : 11) + e.seed * 3) % A.move.length];
}
// Fotograma recortado (con el filtro del bioma horneado) para pixelar y cachear
function monFrame(id, pose, i, filt, bid) {
  const A = MON_ANIM[id], list = A[pose] || A.move, fr = list[i % list.length];
  const key = id + '|' + pose + '|' + (i % list.length) + '|' + (filt ? bid : '');
  let c = MON_FR.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = fr[2]; c.height = fr[3];
    const g = c.getContext('2d');
    if (filt) g.filter = filt;
    g.drawImage(MON_IMG[id], fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]);
    c.ax = fr[4]; c.ay = fr[5]; c.key = key;
    MON_FR.set(key, c);
  }
  return c;
}
function drawMonsterAnim(e, A0, k, ox, oy) {
  const id = monAnimId(e), A = MON_ANIM[id];
  const [pose, i] = monPose(e, A);
  const B = scene === 'rift' && rift ? rift.biome : null;
  const filt = !e.boss && !e.superDef && B && B.mfilter ? B.mfilter : null;
  const c = monFrame(id, pose, i, filt, B && B.id);
  const hw = A0.h * k * (e.boss ? 1.25 : 1.1); // altura en mundo similar a la del dibujo procedural
  const s = hw / A.bh;
  ctx.save();
  ctx.scale(e.face || 1, 1);
  if (HD2D.active) {
    const hpx = Math.max(8, Math.round(c.height * s * SPR.scale));
    const pi = smoothImage(c, hpx, c.key + '|' + hpx);
    const kk = (c.height * s) / hpx;
    ctx.drawImage(pi, -c.ax * s - kk, -c.ay * s - kk, pi.width * kk, pi.height * kk);
  } else ctx.drawImage(c, -c.ax * s, -c.ay * s, c.width * s, c.height * s);
  // destello al recibir daño y brillo rojo en furia
  if (e.flash > 0 || e.enraged) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha *= e.flash > 0 ? 0.55 : 0.18 + Math.sin(now * 8) * 0.08;
    ctx.filter = e.flash > 0 ? 'brightness(2.2) saturate(0)' : 'sepia(1) saturate(6) hue-rotate(-30deg)';
    ctx.drawImage(c, -c.ax * s, -c.ay * s, c.width * s, c.height * s);
    ctx.filter = 'none';
  }
  ctx.restore();
}

function drawMonsterBody(e) {
  const A = MONSTER_ART[e.type];
  const k = (e.r / A.r0) * 1.15;
  const ph = ((e.t * A.rate) % 1 + 1) % 1;
  const fi = Math.floor(ph * ANIM_FRAMES);
  const v = A.vary(e);
  const tint = e.flash > 0 ? 'f' : e.enraged ? 'e' : 'n';
  const B = scene === 'rift' && rift ? rift.biome : null;
  const filt = e.superDef ? e.superDef.filter : B && B.mfilter && !e.boss ? B.mfilter : null;
  const key = e.type + '|' + fi + '|' + e.face + '|' + v + '|' + Math.round(k * 20) + '|' + tint + (e.superDef ? '|S' + e.superDef.name.length : filt ? '|' + B.id : '');
  const w = A.w * k, h = A.h * k, ax = A.ax * k, ay = A.ay * k;
  const jitter = e.state === 'wind' ? rand(-1.5, 1.5) : 0;
  // ataque: se lanza hacia el héroe (o retrocede al disparar)
  let lx = 0, ly = 0;
  if (e.atkT > 0) { const kk = Math.sin((1 - e.atkT / 0.25) * Math.PI) * e.r * 0.55 * (e.atkDir || 1); lx = Math.cos(e.atkA) * kk; ly = Math.sin(e.atkA) * kk * 0.6; }
  // flotar (espíritus) y corretear (arañas)
  if (e.ct === undefined) {
    if (e.type === 'tofu') ly -= 3 + Math.sin(e.t * 6 + e.seed) * 3;
    if (e.type === 'hechicero') ly -= 6 + Math.sin(e.t * 2) * 5;
  }
  ctx.save();
  ctx.translate(e.x + jitter + lx, e.y - e.z + ly);
  if (e.dsx) ctx.scale(e.dsx, e.dsy);
  if (e.slamT > 0) { const ks = e.slamT / 0.3; ctx.scale(1 + ks * 0.25, 1 - ks * 0.22); }
  if (e.atkT > 0 && (e.atkDir || 1) > 0) { const ks = Math.sin((1 - e.atkT / 0.25) * Math.PI); ctx.scale(1 + ks * 0.12, 1 - ks * 0.08); }
  if (e.type === 'arakne' && e.ct === undefined && e.state === 'move') ctx.rotate(Math.sin(e.t * 22) * 0.06);
  // al aparecer sube desde el suelo; al recibir un golpe se aplasta
  if (e.rot) ctx.rotate(e.rot);
  else if (e.kvx) ctx.rotate(clamp(e.kvx * 0.0007, -0.35, 0.35));
  if (e.alpha !== undefined) ctx.globalAlpha = e.alpha;
  if (e.spawnT > 0) { const k2 = 1 - e.spawnT / 0.35; ctx.scale(0.7 + k2 * 0.3, 0.3 + k2 * 0.7); }
  else if (e.flash > 0) ctx.scale(1.12, 0.9);
  else if (e.state === 'wind' && e.ct === undefined) { const kw = clamp(1 - e.st / (e.max || 0.6), 0, 1); ctx.scale(1 + kw * 0.1, 1 - kw * 0.12); }
  else if (e.state === 'charge') ctx.scale(1.12, 0.9);
  else if (e.state === 'move' && !e.boss && e.ai === 'chase') { const b = Math.sin(e.t * 14); ctx.scale(1 - b * 0.04, 1 + b * 0.05); }
  if (typeof MON_ANIM !== 'undefined' && MON_IMG[monAnimId(e)]) { drawMonsterAnim(e, A, k); ctx.restore(); return; }
  sprite(key, w, h, ax, ay, (g) => {
    g.scale(k, k);
    if (filt) g.filter = filt;
    A.draw(fi / ANIM_FRAMES, e.face, v);
    g.filter = 'none';
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.scale(SPR.scale, SPR.scale);
    g.translate(ax, ay);
    // volumen: luz arriba, sombra abajo (se hornea una vez en la caché)
    g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(0, -ay, 0, h - ay);
    sh.addColorStop(0, 'rgba(255,236,200,0.28)');
    sh.addColorStop(0.5, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(10,0,10,0.38)');
    g.fillStyle = sh;
    g.fillRect(-ax, -ay, w, h);
    g.globalCompositeOperation = 'source-over';
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
  if (drawPropSprite(o, 'tree')) return;
  const s = o.s;
  shadow(o.x, o.y + 2, 24 * s);
  const fi = Math.floor((((now * 0.19 + o.x * 0.001) % 1) + 1) % 1 * 8);
  const sway = Math.sin(fi / 8 * TAU) * (o.tk === 'willow' ? 2.5 : 1.2);
  const qs = Math.round(s * 20) / 20;
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.tk) {
    // árboles pintados de cada bioma, con volumen horneado
    sprite('btree|' + o.tk + '|' + o.hue + '|' + qs + '|' + fi, 100 * qs, 104 * qs, 50 * qs, 98 * qs, (g) => {
      g.scale(qs, qs);
      treeArt(o.tk, o.hue, sway);
      g.globalCompositeOperation = 'source-atop';
      const sh = g.createLinearGradient(-30, -80, 30, 0);
      sh.addColorStop(0, 'rgba(255,240,210,0.22)'); sh.addColorStop(0.55, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,10,0.35)');
      g.fillStyle = sh; g.fillRect(-50, -98, 100, 104);
      g.globalCompositeOperation = 'source-over';
    });
  } else sprite('tree|' + o.hue + '|' + qs + '|' + fi, 76 * qs, 84 * qs, 38 * qs, 80 * qs, (g) => { g.scale(qs, qs); treeShape(o.hue, sway); });
  ctx.restore();
}

function drawRock(o) {
  if (drawPropSprite(o, 'rock')) return;
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
    if (k.item.rarity >= 1) glow(k.x, y, 26, RARITY_RGB[k.item.rarity], 0.55 + Math.sin(k.t * 5) * 0.15);
    ctx.translate(k.x, y);
    circle(0, 0, 12, 'rgba(30,20,8,0.85)', R.color, 2);
    const icon = itemIconImage(itemKind(k.item), k.item.rarity);
    if (icon.complete) ctx.drawImage(icon, -11, -11, 22, 22);
    ctx.restore();
    // etiqueta con el nombre
    ctx.font = '800 9px Garamond, Georgia, serif';
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
  if (p.look) { drawProjLook(p); return; }
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
  } else if (p.kind === 'bolt' || p.kind === 'homing') {
    ctx.globalCompositeOperation = 'lighter';
    circle(p.x, p.y, p.r * 1.6, 'rgba(160,70,230,0.45)');
    circle(p.x, p.y, p.r, '#d49cff');
    circle(p.x, p.y, p.r * 0.45, '#ffffff');
    if (p.kind === 'homing' && Math.random() < 0.5) particles.push({ kind: 'glowdot', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.35, max: 0.35, rgb: '200,120,255', size: 5, grav: 0 });
  } else if (p.kind === 'web') {
    ctx.translate(p.x, p.y); ctx.rotate(now * 6);
    ctx.strokeStyle = '#eef6e0'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; ctx.beginPath(); ctx.moveTo(-Math.cos(a) * p.r, -Math.sin(a) * p.r); ctx.lineTo(Math.cos(a) * p.r, Math.sin(a) * p.r); ctx.stroke(); }
    circle(0, 0, p.r * 0.6, null, '#eef6e0', 1.2);
    circle(0, 0, 2.5, '#9be05a');
  } else if (p.kind === 'boulder') {
    // roca helada lanzada en parábola
    const k = Math.max(0, p.life / 2.6), arc = Math.sin(Math.min(1, (1 - k) * 2.2) * Math.PI) * 26;
    shadow(p.x, p.y + 6, p.r * 0.9);
    ctx.translate(p.x, p.y - arc); ctx.rotate(now * 5);
    ctx.fillStyle = '#7f9fb8'; ctx.strokeStyle = '#0e1a28'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-p.r, -2); ctx.lineTo(-p.r * 0.4, -p.r); ctx.lineTo(p.r * 0.7, -p.r * 0.7); ctx.lineTo(p.r, p.r * 0.3); ctx.lineTo(0, p.r); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8e8ff'; ctx.beginPath(); ctx.moveTo(-p.r * 0.5, -p.r * 0.5); ctx.lineTo(p.r * 0.3, -p.r * 0.6); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
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
  ctx.globalCompositeOperation = 'lighter';
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
  const tipA = a0 + sweep;
  const rgb = s.color === '#ffcc33' ? '255,180,60' : hexRgb(s.color);
  glow(s.x + Math.cos(tipA) * (R - s.width / 2), s.y - 16 + Math.sin(tipA) * (R - s.width / 2) * 0.85, s.width * 1.6, rgb, alpha * 0.9);
}

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
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
  glow(g.x, g.y, g.r * 1.2, '255,110,30', 0.35 * fade);
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

// Portal Rúnico: arco de piedra pintado (img/props/portal.webp) con un vórtice animado en el hueco
const PORTAL_IMG = new Image();
PORTAL_IMG.src = 'img/props/portal.webp';
const PORTAL_H = 230; // altura en unidades de mundo
// hueco del arco, en fracciones de la imagen (x0, y0, x1, y1)
const PORTAL_HOLE = [166 / 507, 281 / 891, 341 / 507, 598 / 891];
function drawPortal(x, y, t) {
  const im = PORTAL_IMG, k = PORTAL_H / 891, w = 507 * k;
  const left = x - w / 2, top = y + PORTAL_H * 0.06 - PORTAL_H;
  const hx0 = left + PORTAL_HOLE[0] * w, hx1 = left + PORTAL_HOLE[2] * w;
  const hy0 = top + PORTAL_HOLE[1] * PORTAL_H, hy1 = top + PORTAL_HOLE[3] * PORTAL_H;
  const hw = (hx1 - hx0) / 2, cx = x, cy = (hy0 + hy1) / 2 + 6;
  const g = ctx;
  shadow(x, y + 4, 70);
  // vórtice (detrás del marco)
  g.save();
  g.beginPath(); g.moveTo(hx0 - 2, hy1 + 4); g.lineTo(hx0 - 2, hy0 + hw); g.arc(cx, hy0 + hw, hw + 2, Math.PI, 0); g.lineTo(hx1 + 2, hy1 + 4); g.closePath();
  g.clip();
  const R = (hy1 - hy0) * 0.75;
  let gr = g.createRadialGradient(cx, cy, 2, cx, cy, R);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.12, '#b8f0ff'); gr.addColorStop(0.4, '#3aa8f0'); gr.addColorStop(0.75, '#2a3fb8'); gr.addColorStop(1, '#1a0f4a');
  g.fillStyle = gr; g.fillRect(hx0 - 4, hy0 - 4, hw * 2 + 8, hy1 - hy0 + 10);
  // brazos en espiral que giran hacia dentro
  g.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < 4; arm++) {
    g.beginPath();
    for (let s = 0; s <= 1.0001; s += 0.04) {
      const a = t * 2.4 + arm * (Math.PI / 2) + s * 5.5, r = R * (1 - s) * 0.95;
      const px = cx + Math.cos(a) * r * 0.62, py = cy + Math.sin(a) * r;
      if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.strokeStyle = arm % 2 ? 'rgba(170,140,255,0.55)' : 'rgba(150,230,255,0.6)'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.6; g.stroke();
  }
  // motas absorbidas por el vórtice
  for (let i = 0; i < 14; i++) {
    const ph = (t * 0.45 + i / 14) % 1, a = i * 2.4 + t * 1.5 + ph * 4, r = R * (1 - ph);
    g.globalAlpha = Math.sin(ph * Math.PI);
    circle(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r, 1.4 + (1 - ph) * 1.6, '#e8fbff');
  }
  g.globalAlpha = 1;
  const core = 0.75 + Math.sin(t * 3) * 0.15;
  gr = g.createRadialGradient(cx, cy, 0, cx, cy, hw * 0.9);
  gr.addColorStop(0, `rgba(255,255,255,${core})`); gr.addColorStop(1, 'rgba(120,200,255,0)');
  g.fillStyle = gr; g.fillRect(cx - hw, cy - hw, hw * 2, hw * 2);
  g.restore();
  // marco de piedra (los cristales flotan un poco)
  if (im.complete && im.naturalWidth) g.drawImage(im, left, top + Math.sin(t * 1.2) * 0.6, w, PORTAL_H);
  // brillo de la gema de la clave y de las runas
  g.save();
  g.globalCompositeOperation = 'lighter';
  const pulse = 0.55 + Math.sin(t * 2.2) * 0.25;
  gr = g.createRadialGradient(x, top + 0.235 * PORTAL_H, 0, x, top + 0.235 * PORTAL_H, 34);
  gr.addColorStop(0, `rgba(140,230,255,${pulse})`); gr.addColorStop(1, 'rgba(140,230,255,0)');
  g.fillStyle = gr; g.fillRect(x - 34, top + 0.235 * PORTAL_H - 34, 68, 68);
  // haz de luz hacia el cielo
  gr = g.createLinearGradient(0, top - 140, 0, top + 0.24 * PORTAL_H);
  gr.addColorStop(0, 'rgba(120,200,255,0)'); gr.addColorStop(1, `rgba(140,220,255,${0.22 + pulse * 0.12})`);
  g.fillStyle = gr; g.fillRect(x - 5, top - 140, 10, 140 + 0.24 * PORTAL_H);
  g.restore();
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

// ============================================================
// Entorno de la Grieta: decoración horneada en el suelo
// ============================================================
function drawBones(d) {
  const g = ctx;
  g.save();
  g.translate(d.x, d.y);
  g.rotate(d.r);
  g.scale(d.s * 0.8, d.s * 0.8);
  g.fillStyle = '#d8ccb4'; g.strokeStyle = '#3a2a1c'; g.lineWidth = 1.2;
  // hueso largo
  g.beginPath(); g.roundRect(-9, -1.5, 18, 3, 1.5); g.fill(); g.stroke();
  for (const sx of [-9, 9]) { g.beginPath(); g.arc(sx, -1.8, 2, 0, TAU); g.arc(sx, 1.8, 2, 0, TAU); g.fill(); }
  // calavera pequeña
  g.translate(8, 6);
  g.beginPath(); g.arc(0, 0, 4.5, 0, TAU); g.fill(); g.stroke();
  g.fillRect(-2.5, 3, 5, 2.5);
  g.fillStyle = '#2a1a0c'; g.beginPath(); g.arc(-1.6, -0.4, 1.1, 0, TAU); g.arc(1.6, -0.4, 1.1, 0, TAU); g.fill();
  g.restore();
}

function drawGrassTuft(d) {
  const g = ctx;
  g.save();
  g.translate(d.x, d.y);
  g.scale(d.s, d.s);
  g.strokeStyle = d.c; g.lineWidth = 1.6; g.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {
    g.beginPath(); g.moveTo(i * 1.6, 0); g.quadraticCurveTo(i * 2.4, -6, i * 3.4 + Math.sin(i) * 2, -11 + Math.abs(i)); g.stroke();
  }
  g.restore();
}

function drawCrackLine(d) {
  const g = ctx;
  g.save();
  g.translate(d.x, d.y);
  g.rotate(d.r);
  g.scale(d.s, d.s * 0.6);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(15,6,2,0.8)'; g.lineWidth = 3.5;
  g.beginPath(); g.moveTo(-22, 0); g.lineTo(-10, 3); g.lineTo(-2, -2); g.lineTo(8, 2); g.lineTo(20, -1); g.stroke();
  g.strokeStyle = 'rgba(255,120,40,0.75)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-18, 1); g.lineTo(-10, 3); g.lineTo(-2, -2); g.lineTo(6, 1.5); g.stroke();
  g.restore();
}

// ============================================================
// Entorno de la Grieta: objetos (con caché + luz dinámica)
// ============================================================
function drawLavaPool(pl) {
  const type = pl.type || 'lava';
  const st = POOL_STYLE[type];
  const pulse = 0.85 + Math.sin(now * 2 + pl.ph) * 0.15;
  ctx.save();
  ctx.translate(pl.x, pl.y);
  sprite('pool|' + type + '|' + Math.round(pl.rx) + '|' + Math.round(pl.ry), pl.rx * 2 + 16, pl.ry * 2 + 16, pl.rx + 8, pl.ry + 8, (g) => {
    // borde irregular
    g.fillStyle = st.rim;
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * TAU, w = 1 + Math.sin(i * 2.7 + pl.rx) * 0.08;
      const x = Math.cos(a) * (pl.rx + 6) * w, y = Math.sin(a) * (pl.ry + 5) * w;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.fill();
    const gr = g.createRadialGradient(0, 0, 2, 0, 0, pl.rx);
    gr.addColorStop(0, st.stops[0]); gr.addColorStop(0.35, st.stops[1]); gr.addColorStop(0.75, st.stops[2]); gr.addColorStop(1, st.stops[3]);
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(0, 0, pl.rx, pl.ry, 0, 0, TAU); g.fill();
    g.fillStyle = st.crust;
    if (type === 'ice') {
      // reflejos y grietas en el hielo
      g.strokeStyle = 'rgba(80,120,160,0.6)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-pl.rx * 0.6, -2); g.lineTo(-pl.rx * 0.1, 3); g.lineTo(pl.rx * 0.3, -4); g.lineTo(pl.rx * 0.6, 2); g.moveTo(-pl.rx * 0.1, 3); g.lineTo(0, pl.ry * 0.6); g.stroke();
      g.beginPath(); g.ellipse(-pl.rx * 0.35, -pl.ry * 0.35, pl.rx * 0.3, 3, -0.15, 0, TAU); g.fill();
    } else if (type === 'water') {
      // nenúfares
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(Math.cos(i * 2.1) * pl.rx * 0.5, Math.sin(i * 2.9) * pl.ry * 0.45, 5, 0.3, TAU - 0.3); g.lineTo(Math.cos(i * 2.1) * pl.rx * 0.5, Math.sin(i * 2.9) * pl.ry * 0.45); g.fill(); }
    } else {
      for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(Math.cos(i * 1.7) * pl.rx * 0.55, Math.sin(i * 2.3) * pl.ry * 0.5, 6, 3, i, 0, TAU); g.fill(); }
    }
  });
  ctx.restore();
  if (st.light) glow(pl.x, pl.y, pl.rx * 1.6, st.glow, (type === 'lava' ? 0.45 : 0.25) * pulse);
  if (type === 'lava' && Math.random() < 0.06) particles.push({ kind: 'glowdot', x: pl.x + rand(-pl.rx, pl.rx) * 0.6, y: pl.y + rand(-pl.ry, pl.ry) * 0.5, vx: 0, vy: -30, life: 0.9, max: 0.9, rgb: '255,150,50', size: 4, grav: 0 });
  if (type === 'water' && Math.random() < 0.02) particles.push({ kind: 'glowdot', x: pl.x + rand(-pl.rx, pl.rx) * 0.6, y: pl.y + rand(-pl.ry, pl.ry) * 0.5, vx: rand(-10, 10), vy: -12, life: 1.4, max: 1.4, rgb: '140,255,200', size: 3, grav: 0 });
}

function drawPillar(o) {
  if (drawPropSprite(o, 'pillar')) return;
  shadow(o.x, o.y + 2, 20 * o.s);
  const s = Math.round(o.s * 20) / 20;
  ctx.save();
  ctx.translate(o.x, o.y);
  sprite('pillar|' + o.v + '|' + s, 52 * s, 96 * s, 26 * s, 90 * s, (g) => {
    g.scale(s, s);
    g.lineWidth = 2; g.strokeStyle = OUTLINE; g.lineJoin = 'round';
    // base
    g.fillStyle = '#6e6560'; g.beginPath(); g.roundRect(-20, -12, 40, 12, 3); g.fill(); g.stroke();
    // fuste (roto a distinta altura según la variante)
    const top = [-78, -60, -44][o.v];
    g.fillStyle = '#8a8078';
    g.beginPath(); g.moveTo(-14, -12); g.lineTo(-14, top + 6); g.lineTo(-6, top); g.lineTo(2, top + 8); g.lineTo(9, top - 2); g.lineTo(14, top + 4); g.lineTo(14, -12); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#a59a90'; g.fillRect(-12, top + 8, 7, -top - 22);
    g.strokeStyle = 'rgba(40,30,25,0.6)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-1, top + 10); g.lineTo(-1, -14); g.moveTo(7, top + 10); g.lineTo(7, -14); g.stroke();
    g.beginPath(); g.moveTo(-8, -30); g.lineTo(-3, -36); g.lineTo(1, -33); g.stroke();
    // runa grabada que brilla
    g.strokeStyle = '#7fd4f0'; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(-4, top + 20); g.lineTo(0, top + 26); g.lineTo(-4, top + 32); g.moveTo(3, top + 20); g.lineTo(3, top + 32); g.stroke();
    // musgo
    g.fillStyle = '#4f7a2f'; g.beginPath(); g.ellipse(-8, -12, 9, 3, 0.2, 0, TAU); g.fill();
    // escombros
    g.fillStyle = '#7a7068'; g.strokeStyle = OUTLINE; g.lineWidth = 1.5;
    g.beginPath(); g.roundRect(14, -7, 9, 6, 2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(-25, -6, 7, 5, 2); g.fill(); g.stroke();
  });
  ctx.restore();
  const tops = [-78, -60, -44];
  glow(o.x - 2 * o.s, o.y + (tops[o.v] + 26) * o.s, 12, '120,210,255', 0.35 + Math.sin(now * 2 + o.x) * 0.15);
}

const CRYSTAL_COLS = [['#5fc8ff', '#c8f0ff', '#1e6a9a', '95,200,255'], ['#c07cf0', '#f0d8ff', '#5a2a8a', '192,124,240'], ['#4fe0a8', '#d0ffe8', '#1a7a5a', '80,224,168'], ['#ffb84a', '#fff0c8', '#9a5a10', '255,184,74'], ['#ff5a4a', '#ffd0c8', '#8a1a1a', '255,90,74']];
function drawCrystal(o) {
  if (drawPropSprite(o, 'crystal')) return;
  const [c, hi, dk, rgb] = CRYSTAL_COLS[o.hue];
  const s = Math.round(o.s * 20) / 20;
  const pulse = 0.75 + Math.sin(now * 2 + o.ph) * 0.25;
  glow(o.x, o.y - 18 * s, 46 * s, rgb, 0.5 * pulse);
  shadow(o.x, o.y + 2, 16 * s);
  ctx.save();
  ctx.translate(o.x, o.y);
  sprite('crystal|' + o.hue + '|' + s, 54 * s, 70 * s, 27 * s, 64 * s, (g) => {
    g.scale(s, s);
    g.lineWidth = 1.8; g.strokeStyle = '#140c1c'; g.lineJoin = 'round';
    g.fillStyle = '#4a4048'; g.beginPath(); g.ellipse(0, -3, 18, 6, 0, 0, TAU); g.fill(); g.stroke();
    const shards = [[-10, -4, 6, 34, -0.35], [10, -4, 6, 28, 0.4], [0, -6, 8, 52, 0.05], [-4, -2, 4, 18, -0.7]];
    for (const [x, y, w, h, a] of shards) {
      g.save(); g.translate(x, y); g.rotate(a);
      g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w * 0.8, -h * 0.75); g.lineTo(0, -h); g.lineTo(w * 0.8, -h * 0.75); g.lineTo(w, 0); g.closePath();
      g.fillStyle = c; g.fill(); g.stroke();
      g.fillStyle = dk; g.beginPath(); g.moveTo(0, -h); g.lineTo(w * 0.8, -h * 0.75); g.lineTo(w, 0); g.lineTo(0, 0); g.closePath(); g.fill();
      g.fillStyle = hi; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(-w * 0.55, -h * 0.1); g.lineTo(-w * 0.45, -h * 0.7); g.lineTo(-w * 0.1, -h * 0.85); g.lineTo(-w * 0.2, -h * 0.1); g.closePath(); g.fill(); g.globalAlpha = 1;
      g.restore();
    }
  });
  ctx.restore();
  if (Math.random() < 0.03) particles.push({ kind: 'glowdot', x: o.x + rand(-10, 10) * s, y: o.y - rand(10, 40) * s, vx: 0, vy: -18, life: 1, max: 1, rgb, size: 3, grav: 0 });
}

function drawBrazier(o) {
  if (drawPropSprite(o, 'brazier')) return;
  shadow(o.x, o.y + 2, 14);
  ctx.save();
  ctx.translate(o.x, o.y);
  sprite('brazier', 40, 44, 20, 40, (g) => {
    g.lineWidth = 2; g.strokeStyle = OUTLINE; g.lineCap = 'round';
    g.strokeStyle = '#2a2420'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-10, 0); g.lineTo(-4, -16); g.moveTo(10, 0); g.lineTo(4, -16); g.moveTo(0, 2); g.lineTo(0, -16); g.stroke();
    g.lineWidth = 2; g.strokeStyle = OUTLINE;
    g.fillStyle = '#4a4440';
    g.beginPath(); g.moveTo(-15, -26); g.lineTo(15, -26); g.lineTo(10, -14); g.lineTo(-10, -14); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#6e6560'; g.fillRect(-15, -28, 30, 3);
    g.fillStyle = '#1a0c06'; g.beginPath(); g.ellipse(0, -26, 13, 3, 0, 0, TAU); g.fill();
  });
  ctx.restore();
  // fuego animado (no se cachea)
  const t = now * 9 + o.ph;
  ctx.save();
  ctx.translate(o.x, o.y - 27);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const h = 18 + Math.sin(t + i * 2.1) * 5 - i * 3;
    const w = 9 - i * 2;
    ctx.fillStyle = ['rgba(255,90,20,0.85)', 'rgba(255,170,40,0.85)', 'rgba(255,240,170,0.9)'][i];
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(-w * 0.8 + Math.sin(t * 1.3 + i) * 2, -h * 0.6, Math.sin(t + i) * 2.5, -h);
    ctx.quadraticCurveTo(w * 0.8 + Math.sin(t * 1.7 + i) * 2, -h * 0.6, w, 0);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  glow(o.x, o.y - 36, 50, '255,140,40', 0.55 + Math.sin(t * 1.4) * 0.1);
  if (Math.random() < 0.15) particles.push({ kind: 'glowdot', x: o.x + rand(-5, 5), y: o.y - 40, vx: rand(-15, 15), vy: rand(-90, -50), life: 0.7, max: 0.7, rgb: '255,170,60', size: 3, grav: 0 });
}
