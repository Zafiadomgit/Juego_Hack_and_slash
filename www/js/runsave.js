/* Fendaria — la expedición sobrevive al cierre de la app.
 * Mientras estás en una Grieta se guarda un punto de control (cada pocos segundos, al elegir bendición y al
 * pasar la app a segundo plano): mundo, Grieta, profundidad de la expedición, bendiciones, martillos, vidas,
 * vida y definitivo. Si la app se cierra, al volver a Villa Candela se ofrece continuar: la Grieta empieza
 * de nuevo, pero con todo lo ganado en la expedición. Al morir, al cruzar el Portal o al abandonar, se borra.
 * (No aplica a la Mazmorra ni a la Grieta del Día.)
 */
'use strict';

function runSnapshot() {
  if (!S || scene !== 'rift' || !rift || !rift.bn || !P || rift.isDungeon || rift.daily) return;
  if (state === 'dead' || state === 'end' || rift.bossDead) return;
  const keep = {};
  for (const k of RUN_KEEP) if (rift.bn[k] !== undefined) keep[k] = JSON.parse(JSON.stringify(rift.bn[k]));
  S.runSave = { b: rift.b, n: rift.n, d: rift.d, run: rift.run ? Object.assign({}, rift.run) : null, keep,
    hpK: P.maxHp ? P.hp / P.maxHp : 1, ult: P.ult || 0, t: Date.now() };
}
const clearRunSave = () => { if (S && S.runSave) { delete S.runSave; persist(); } };

// cuándo se guarda
const _startNodeRS = startNode;
startNode = function (b, n, d) {
  _startNodeRS(b, n, d);
  later(1.5, () => { runSnapshot(); persist(); });
};
let rsT = 0;
const _updatePlayerRS = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerRS(dt);
  rsT += dt;
  if (rsT > 5) { rsT = 0; runSnapshot(); persist(); }
};
const _chooseBoonRS = chooseBoon;
chooseBoon = function (k) { const r = _chooseBoonRS(k); runSnapshot(); persist(); return r; };
document.addEventListener('visibilitychange', () => { if (document.hidden) { runSnapshot(); persist(); } });
window.addEventListener('pagehide', () => { runSnapshot(); persist(); });

// cuándo se borra: la expedición terminó de verdad
const _finishRiftRS = finishRift;
finishRift = function () { const was = state; _finishRiftRS(); if (was === 'play' && state === 'end') clearRunSave(); };
const _playerDiedRS = playerDied;
playerDied = function () { const was = state; _playerDiedRS(); if (was === 'play' && state === 'dead') clearRunSave(); };
$('btnQuit').addEventListener('click', clearRunSave);

// ---------- al volver a la villa con una expedición pendiente ----------
document.body.insertAdjacentHTML('beforeend', `<div id="resumePick" class="run-pick">
  <div class="rp-box">
    <div class="rp-head"><b>Expedición en curso</b><small id="rsInfo"></small></div>
    <button id="rsGo" class="rp-opt go" type="button"><i>⚔</i><span><b>Continuar la expedición</b><small>La Grieta empieza de nuevo, con todas tus bendiciones</small></span></button>
    <button id="rsDrop" class="rp-opt" type="button"><i>✕</i><span><b>Abandonarla</b><small>Pierdes las bendiciones; el botín y el ámbar ya son tuyos</small></span></button>
  </div>
</div>`);
const _goHubRS = goHub;
goHub = function () {
  _goHubRS();
  setTimeout(() => {
    const rs = S && S.runSave;
    if (!rs || state !== 'hub' || !BIOMES[rs.b]) return;
    if (typeof dlg !== 'undefined' && dlg) { setTimeout(() => goHubResumeCheck(), 1500); return; }
    goHubResumeCheck();
  }, 1200);
};
function goHubResumeCheck() {
  const rs = S && S.runSave;
  if (!rs || state !== 'hub') return;
  const nb = Object.keys((rs.keep && rs.keep.owned) || {}).length, depth = rs.run ? rs.run.depth + 1 : 1;
  $('rsInfo').textContent = `${BIOMES[rs.b].name} · ${rs.n === 'S' ? 'Súper Jefe' : 'Grieta ' + rs.n} · ${depth} Grieta${depth > 1 ? 's' : ''} · ${nb} bendicion${nb === 1 ? '' : 'es'}`;
  $('resumePick').classList.add('show');
}
$('rsDrop').addEventListener('click', () => { SFX.play('click'); $('resumePick').classList.remove('show'); clearRunSave(); });
$('rsGo').addEventListener('click', () => {
  const rs = S && S.runSave;
  $('resumePick').classList.remove('show');
  if (!rs) return;
  SFX.play('click');
  state = 'play';
  startNode(rs.b, rs.n, rs.d);
  if (rs.run) { rift.run = rs.run; rift.threat += rs.run.depth; }
  const b = rift.bn;
  for (const k of RUN_KEEP) {
    if (rs.keep[k] === undefined) continue;
    if (k === 'owned' || k === 'slots' || k === 'hammers') b[k] = Object.assign({}, rs.keep[k], b[k]);
    else b[k] = rs.keep[k];
  }
  recalc();
  P.hp = Math.max(1, Math.round(P.maxHp * Math.max(0.5, rs.hpK)));
  P.ult = rs.ult;
  buildBoonBar();
  later(1.1, () => { recalc(); buildBoonBar(); });
  later(3.4, () => showBanner('Expedición recuperada', '#ff9a6a', `${Object.keys(b.owned).length} bendiciones contigo`));
});
