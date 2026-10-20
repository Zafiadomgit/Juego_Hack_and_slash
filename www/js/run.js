/* Fendaria — Expedición continua.
 *  · Al cruzar el Portal del campamento eliges: seguir a la siguiente Grieta o volver a Villa Candela.
 *  · Si sigues, conservas todo lo ganado en la expedición: bendiciones, martillos, Corazón de Grieta,
 *    vidas extra, la vida que te quede y la carga del definitivo.
 *  · La expedición sólo termina al morir (o al volver a la villa). Después eliges en el mapa desde dónde empezar.
 *  · Los monstruos crecen con la profundidad de la expedición y con cuántas bendiciones llevas.
 */
'use strict';

const RUN_KEEP = ['owned', 'slots', 'hammers', 'vigor', 'lastGod', 'revived', 'lives', 'rerolls'];
function nextRunNode(b, n) {
  if (n === 'S') return null; // el Súper Jefe cierra la expedición: a la villa, a ver su cinemática
  return { b, n: n < LEVELS_PER_BIOME ? n + 1 : 'S' };
}
const runDepth = () => (rift && rift.run ? rift.run.depth : 0);
const boonWeight = () => {
  const b = rift && rift.bn;
  if (!b) return 0;
  let w = 0;
  for (const o of Object.values(b.owned || {})) w += 1 + 0.5 * ((o.lvl || 1) - 1);
  return w + Object.keys(b.hammers || {}).length;
};

// ============================================================
// Elección en el Portal
// ============================================================
document.body.insertAdjacentHTML('beforeend', `<div id="runPick" class="run-pick">
  <div class="rp-box">
    <div class="rp-head"><b>El Portal se abre</b><small id="rpInfo"></small></div>
    <button id="rpGo" class="rp-opt go" type="button"><i>⚔</i><span><b>Seguir la expedición</b><small id="rpNext"></small></span></button>
    <button id="rpHome" class="rp-opt" type="button"><i>🏡</i><span><b>Volver a Villa Candela</b><small>Terminas la expedición: las bendiciones se pierden, el botín y el ámbar se quedan</small></span></button>
  </div>
</div>`);
let runPrev = null, runT = 0;
function openRunPick() {
  const nx = nextRunNode(rift.b, rift.n);
  const d = runDepth() + 1, nb = Object.keys(rift.bn.owned).length;
  $('rpInfo').textContent = `Expedición · ${d} Grieta${d > 1 ? 's' : ''} superada${d > 1 ? 's' : ''} · ${nb} bendicion${nb === 1 ? '' : 'es'}`;
  const B = BIOMES[nx.b];
  $('rpNext').innerHTML = (nx.n === 'S' ? `<b style="color:#ff7a5a">Súper Jefe</b> de ${B.name}` : `${B.name} · Grieta ${nx.n}`) +
    ' · conservas bendiciones, vida y definitivo. <span style="color:#ff9a7a">Los monstruos serán más duros</span>' +
    (nx.n === 'S' ? '<br><span style="color:#ffe08a">Vencer al Súper Jefe cierra la expedición y vuelves a la villa</span>' : '');
  runPrev = state; state = 'runpick'; runT = performance.now();
  clearInput();
  $('runPick').classList.add('show');
}
function closeRunPick() {
  $('runPick').classList.remove('show');
  if (state === 'runpick') state = runPrev || 'play';
  if (rift && rift.camp) rift.camp.leaving = false;
}
const runOk = () => performance.now() - runT > 350;
$('runPick').addEventListener('pointerdown', (ev) => ev.stopPropagation());
$('runPick').addEventListener('click', (ev) => { ev.stopPropagation(); if (ev.target.id === 'runPick' && runOk()) { SFX.play('click'); closeRunPick(); } });
$('rpGo').addEventListener('click', (ev) => { ev.stopPropagation(); if (!runOk()) return; SFX.play('click'); continueRun(); });
$('rpHome').addEventListener('click', (ev) => {
  ev.stopPropagation(); if (!runOk()) return;
  SFX.play('click');
  $('runPick').classList.remove('show');
  state = runPrev || 'play';
  if (rift && rift.camp) rift.camp.leaving = false;
  _leaveRiftR();
});
window.addEventListener('keydown', (e) => { if (state === 'runpick' && e.key === 'Escape') closeRunPick(); });

const _leaveRiftR = leaveRift;
leaveRift = function () {
  if (!rift || !rift.camp || rift.camp.leaving) return;
  if (rift.isDungeon || !nextRunNode(rift.b, rift.n)) return _leaveRiftR();
  rift.camp.leaving = true;
  openRunPick();
};

// ============================================================
// Siguiente Grieta sin salir
// ============================================================
function continueRun() {
  $('runPick').classList.remove('show');
  const old = rift, ob = old.bn, nx = nextRunNode(old.b, old.n);
  const keep = {};
  for (const k of RUN_KEEP) if (ob[k] !== undefined) keep[k] = ob[k];
  const hpK = P.maxHp ? P.hp / P.maxHp : 1, ult = P.ult || 0;
  const run = {
    depth: runDepth() + 1, start: (old.run && old.run.start) || { b: old.b, n: old.n },
    kills: (old.run ? old.run.kills : 0) + old.kills, kamas: (old.run ? old.run.kamas : 0) + (S.kamas - old.kamas0),
  };
  // lo que haría el final de la Grieta, sin pasar por la villa
  S.rifts++;
  trackDaily('rift');
  if (old.d >= 1) trackDaily('hard');
  S.bestRun = Math.max(S.bestRun || 0, run.depth + 1);
  persist();
  state = 'play';
  startNode(nx.b, nx.n, old.d);
  rift.run = run;
  rift.threat += run.depth;
  const b = rift.bn;
  for (const k of RUN_KEEP) {
    if (keep[k] === undefined) continue;
    if (k === 'owned' || k === 'slots' || k === 'hammers') b[k] = Object.assign({}, keep[k], b[k]); // la ofrenda recién traída manda
    else b[k] = keep[k];
  }
  recalc();
  P.hp = Math.max(1, Math.round(P.maxHp * Math.max(0.35, hpK)));
  P.ult = ult;
  buildBoonBar();
  later(1.1, () => { recalc(); buildBoonBar(); });
  later(3.4, () => showBanner(`Expedición · Grieta ${run.depth + 1}`, '#ff9a6a', `${Object.keys(b.owned).length} bendiciones contigo · los monstruos se endurecen`));
}

// la expedición termina al volver o al morir
const _riftRowsR = riftRows;
riftRows = function (extra = []) {
  if (!rift || !rift.run) return _riftRowsR(extra);
  return _riftRowsR([['Expedición', `${rift.run.depth + 1} Grietas (récord ${Math.max(S.bestRun || 0, rift.run.depth + 1)})`], ...extra]);
};

// ============================================================
// Monstruos: más duros siempre, y mucho más a medida que la expedición avanza
// ============================================================
const _spawnEnemyR = spawnEnemy;
spawnEnemy = function (type, x, y, o = {}) {
  const e = _spawnEnemyR(type, x, y, o);
  if (!e || scene !== 'rift' || !rift) return e;
  const dp = runDepth(), bw = boonWeight();
  const hk = 1.3 * (1 + 0.22 * dp + 0.035 * bw), dk = 1.2 * (1 + 0.1 * dp + 0.015 * bw);
  e.hp = e.maxHp = Math.round(e.maxHp * hk);
  e.dmg *= dk;
  if (dp) e.speed *= 1 + Math.min(0.2, dp * 0.025);
  return e;
};
