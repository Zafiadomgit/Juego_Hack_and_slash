/* Fendaria — combate legible.
 *  · El héroe nunca se pierde: si queda detrás de monstruos u objetos, su silueta translúcida se dibuja encima.
 *  · Los avisos de logro esperan a que no haya otro cartel, carta de mundo o de jefe en pantalla.
 */
'use strict';

// ---------- silueta del héroe cuando algo lo tapa ----------
function heroCovered() {
  if (!P || scene !== 'rift') return false;
  for (const e of enemies) if (!e.dead && e.y > P.y && e.y - P.y < 90 && Math.abs(e.x - P.x) < Math.max(40, (e.hTop || e.r * 3) * 0.5)) return true;
  for (const o of obstacles) if (o.y > P.y && o.y - P.y < 120 && Math.abs(o.x - P.x) < (o.r || 30) * 1.6 + 20) return true;
  return false;
}
let heroCoverK = 0;
const _drawFlashesRead = drawFlashes;
drawFlashes = function () {
  if (P && scene === 'rift' && state === 'play') {
    heroCoverK += ((heroCovered() ? 1 : 0) - heroCoverK) * 0.25;
    if (heroCoverK > 0.03) {
      ctx.save();
      ctx.globalAlpha = 0.42 * heroCoverK;
      drawHero(ctx, P.cls, { x: P.x, y: P.y, dir: P.dir, walkT: P.walkT, moving: P.moving && P.lock <= 0, swing: P.swingT, swingSide: P.swingSide, shot: P.shotT, hurt: 0, t: now, alpha: 1 });
      ctx.restore();
    }
  }
  _drawFlashesRead();
};

// ---------- un aviso cada vez ----------
const screenBusy = () => scene === 'rift' && state === 'play' && ((banner && banner.t > 0.3) || $('worldCard').classList.contains('show') || $('bossCard').classList.contains('show') || (typeof ultCine !== 'undefined' && ultCine));
const _achShowRead = achShow;
achShow = function () {
  if (achQ.length && screenBusy()) { achBusy = true; setTimeout(achShow, 900); return; }
  return _achShowRead();
};
