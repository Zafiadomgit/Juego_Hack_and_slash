/* Fendaria — minicinemática de la definitiva (≈1 s).
 * El mundo se congela, entran franjas de cine, el héroe cruza la pantalla en grande sobre una banda de su color
 * con líneas de velocidad y el nombre de la definitiva; destello, y la definitiva se desata con una onda expansiva.
 * Se puede quitar en Ajustes («Cinemática de la definitiva»).
 */
'use strict';

const ULT_CINE = { dur: 1.05, release: 0.88, label: 'Definitiva' };
const ULT_RGB = { iop: '255,96,64', cra: '90,230,210', feca: '150,170,255', sombra: '200,110,255', domadora: '130,235,110', artificiera: '255,190,70', berserker: '255,70,50' };
const ULT_ART = {};
for (const c of Object.keys(ULT_RGB)) { const im = new Image(); im.src = `img/heroes/px/${c}.png`; ULT_ART[c] = im; }
let ultCine = null;

OPT_DEF.ultCine = true;
$('optClose').insertAdjacentHTML('beforebegin', '<label class="opt-row"><span><b>Cinemática de la definitiva</b><small>Una pausa de un segundo con tu héroe al lanzar la definitiva</small></span><input type="checkbox" data-o="ultCine"></label>');

const _useUltimateC = useUltimate;
useUltimate = function () {
  if (ultCine || !P || P.ult < 100 || P.lock > 0 || P.jump || P.cast) return;
  if (!OPT().ultCine) { _useUltimateC(); ultBlast(); return; }
  ultCine = { t: 0, cls: P.cls, rgb: ULT_RGB[P.cls] || '255,214,110', name: ULTIMATES[P.cls].name, fired: false, last: performance.now() };
  hitStop(ULT_CINE.dur); // el mundo se congela; se sigue dibujando
  SFX.play('magic'); SFX.play('zaap');
  if (typeof buzz === 'function') buzz('ult', [30, 40, 60], 0);
};

// al desatarse: onda, destello del color del héroe y temblor
function ultBlast() {
  if (!P) return;
  const rgb = ULT_RGB[P.cls] || '255,214,110';
  rings.push({ x: P.x, y: P.y, r0: 20, r1: 320, life: 0.55, max: 0.55, color: `rgba(${rgb},` });
  rings.push({ x: P.x, y: P.y, r0: 10, r1: 190, life: 0.35, max: 0.35, color: 'rgba(255,255,255,' });
  hitFlash(P.x, P.y - 30, 140, rgb);
  if (typeof embers === 'function') embers(P.x, P.y - 20, 40, rgb, 60);
  if (typeof sparks === 'function') sparks(P.x, P.y - 20, 26, '#ffffff', 520);
  shake(18); zoomPunch = Math.max(zoomPunch, 0.1);
  SFX.play('boom');
}

const ultEase = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
function drawUltCine() {
  const c = ultCine;
  if (!c) return;
  const tNow = performance.now();
  c.t += Math.min(0.05, (tNow - c.last) / 1000); c.last = tNow;
  const t = c.t, D = ULT_CINE.dur, R = ULT_CINE.release;
  if (!c.fired && t >= R) {
    c.fired = true;
    hitStopT = 0;
    _useUltimateC(); ultBlast();
    banner = null; // el nombre ya salió en la cinemática
  }
  if (t >= D) { ultCine = null; return; }
  const inA = ultEase(t / 0.14), outA = t > R ? 1 - (t - R) / (D - R) : 1, a = inA * outA;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // oscurecer y franjas de cine
  ctx.fillStyle = `rgba(4,3,10,${0.55 * a})`; ctx.fillRect(0, 0, W, H);
  const bar = H * 0.13 * ultEase(t / 0.18) * outA;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  // banda diagonal del color del héroe
  const cy = H * 0.52, bh = H * 0.34 * ultEase(t / 0.16);
  ctx.save();
  ctx.translate(W / 2, cy); ctx.rotate(-0.12);
  const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
  g.addColorStop(0, `rgba(${c.rgb},0)`); g.addColorStop(0.2, `rgba(${c.rgb},${0.75 * a})`); g.addColorStop(0.5, `rgba(255,255,255,${0.35 * a})`); g.addColorStop(0.8, `rgba(${c.rgb},${0.75 * a})`); g.addColorStop(1, `rgba(${c.rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(-W, -bh / 2, W * 2, bh);
  // líneas de velocidad que cruzan la banda
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const s = (i * 97.13) % 1, y = (s - 0.5) * bh * 0.95, len = W * (0.12 + ((i * 31.7) % 1) * 0.25);
    const x = ((t * (1.6 + s * 2.2) + i * 0.137) % 1.4 - 0.2) * W * 2 - W;
    ctx.fillStyle = `rgba(255,255,255,${(0.25 + s * 0.4) * a})`;
    ctx.fillRect(-x, y, len, Math.max(1, H * 0.004 * (1 + s)));
  }
  ctx.restore();
  // el héroe entra desde la izquierda y se queda casi quieto (deriva lenta)
  const im = ULT_ART[c.cls];
  if (im && im.complete && im.naturalWidth) {
    const hh = H * 0.62, ww = hh * im.naturalWidth / im.naturalHeight;
    const hx = W * 0.3 - ww / 2 + (1 - ultEase(t / 0.22)) * -W * 0.5 + t * W * 0.03 - (t > R ? (t - R) * W * 2.5 : 0);
    const hy = cy - hh * 0.55;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.imageSmoothingEnabled = false;
    // aura del color del héroe
    ctx.shadowColor = `rgba(${c.rgb},0.95)`; ctx.shadowBlur = H * 0.05;
    ctx.drawImage(im, hx, hy, ww, hh);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  // nombre de la definitiva desde la derecha
  const fs = Math.round(H * 0.105), tx = W * 0.62 + (1 - ultEase((t - 0.1) / 0.2)) * W * 0.5 + (t > R ? (t - R) * W * 2.5 : 0);
  ctx.globalAlpha = a;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = `700 ${Math.round(fs * 0.36)}px Cinzel, serif`;
  ctx.fillStyle = `rgb(${c.rgb})`; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = fs * 0.08;
  const lbl = ULT_CINE.label.toUpperCase(); ctx.strokeText(lbl, tx, cy - fs * 0.85); ctx.fillText(lbl, tx, cy - fs * 0.85);
  ctx.font = `900 ${fs}px Cinzel, serif`;
  const tg = ctx.createLinearGradient(0, cy - fs / 2, 0, cy + fs / 2);
  tg.addColorStop(0, '#fff6d2'); tg.addColorStop(0.55, '#ffd76a'); tg.addColorStop(1, '#c8892c');
  ctx.lineWidth = fs * 0.14; ctx.strokeText(c.name, tx, cy, W * 0.6);
  ctx.fillStyle = tg; ctx.fillText(c.name, tx, cy, W * 0.6);
  // destello final
  if (t > R - 0.06) { ctx.globalAlpha = Math.max(0, 1 - Math.abs(t - R) / 0.06) * 0.55; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
const _renderUlt = render;
render = function () { _renderUlt(); if (ultCine) drawUltCine(); };
// si se sale de la Grieta en mitad de la cinemática, se descarta
const _goHubUlt = goHub;
goHub = function () { ultCine = null; _goHubUlt(); };

// ============================================================
// Habilidades con más impacto: al lanzar una, aura y runa del color del héroe bajo sus pies, luz de color que
// ilumina la escena y un pulso en los bordes de la pantalla. Las más caras pegan más fuerte.
// ============================================================
let skillFx = null;
const _useSkillC = useSkill;
useSkill = function (i) {
  const pa = P && P.pa;
  _useSkillC(i);
  if (!P || P.pa >= pa) return; // no se lanzó (sin energía, en enfriamiento…)
  const sk = P.C.skills[i], k = clamp((sk.cost || 3) / 4, 0.6, 1.4), rgb = ULT_RGB[P.cls] || '255,214,110';
  skillFx = { t: 0, max: 0.45 + 0.15 * k, k, rgb };
  rings.push({ x: P.x, y: P.y, r0: 16, r1: 90 + 60 * k, life: 0.4, max: 0.4, color: `rgba(${rgb},` });
  rings.push({ x: P.x, y: P.y, r0: 8, r1: 50 + 30 * k, life: 0.25, max: 0.25, color: 'rgba(255,255,255,' });
  hitFlash(P.x, P.y - 30, 40 + 30 * k, rgb);
  if (typeof addDecal === 'function') addDecal('rune', P.x, P.y, 50 + 30 * k, 0.7, rgb);
  if (typeof embers === 'function') embers(P.x, P.y - 24, Math.round(8 + 10 * k), rgb, 26);
  zoomPunch = Math.max(zoomPunch, 0.015 + 0.025 * k);
  shake(2 + 4 * k);
};
const _boonLightsS = boonLights;
boonLights = function (lights, toS) {
  _boonLightsS(lights, toS);
  if (skillFx && P) {
    const q = toS(P.x, P.y - 24), f = 1 - skillFx.t / skillFx.max;
    lights.push({ x: q.x, y: q.y, r: (360 + 160 * skillFx.k) * zoom, a: 0.95 * f, rgb: skillFx.rgb, haze: 0.3 * f });
  }
};
function drawSkillPulse() {
  const s = skillFx;
  if (!s) return;
  s.t += 1 / 60;
  if (s.t >= s.max) { skillFx = null; return; }
  const f = 1 - s.t / s.max, R = Math.hypot(W, H) / 2;
  const g = ctx.createRadialGradient(W / 2, H / 2, R * 0.55, W / 2, H / 2, R);
  g.addColorStop(0, `rgba(${s.rgb},0)`); g.addColorStop(1, `rgba(${s.rgb},${0.28 * s.k * f})`);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
const _renderSkill = render;
render = function () { _renderSkill(); if (skillFx && scene === 'rift' && state === 'play') drawSkillPulse(); else if (skillFx && state !== 'play') skillFx = null; };
