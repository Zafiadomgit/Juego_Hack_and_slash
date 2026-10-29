/* Fendaria — monstruos que caminan de verdad: los fotogramas de andar avanzan según la distancia recorrida
 * (no según el reloj), con un rebote en cada pisada; si no se mueven, reposo. Así no «patinan» por el suelo. */
'use strict';

function monStep(e) {
  const t = performance.now();
  if (e._mx === undefined) { e._mx = e.x; e._my = e.y; e._wd = 0; e._st = t; e._sp = 0; }
  const d = Math.hypot(e.x - e._mx, e.y - e._my), dt = Math.max(1, t - e._st) / 1000;
  if (d < 60) { e._wd += d; e._sp = e._sp * 0.8 + (d / dt) * 0.2; } // saltos grandes (empujones, teletransporte) no cuentan como pasos
  e._mx = e.x; e._my = e.y; e._st = t;
}
const _monPoseW = monPose;
monPose = function (e, A) {
  const r = _monPoseW(e, A);
  if (r[0] !== 'move' || !A.move) return r;
  if ((e._sp || 0) < 6 && A.idle) return ['idle', Math.floor(e.t * 5) % A.idle.length];
  const stride = Math.max(14, (e.hTop || e.r * 3) * 0.32), n = A.move.length;
  return ['move', Math.floor((e._wd || 0) / (stride * 2) * n + e.seed * 3) % n];
};
const _drawMonsterAnimW = drawMonsterAnim;
drawMonsterAnim = function (e, A0, k, ox, oy) {
  monStep(e);
  const stride = Math.max(14, (e.hTop || e.r * 3) * 0.32);
  const moving = (e._sp || 0) >= 6 && !e.boss && !e.superDef;
  const hop = moving ? Math.abs(Math.sin((e._wd || 0) / stride * Math.PI)) * Math.min(3, stride * 0.08) : 0;
  if (!hop) return _drawMonsterAnimW(e, A0, k, ox, oy);
  ctx.save(); ctx.translate(0, -hop);
  try { return _drawMonsterAnimW(e, A0, k, ox, oy); } finally { ctx.restore(); }
};
