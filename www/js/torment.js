/* Fendaria — Niveles de Tormento (final de partida).
 *  · Se abren al vencer a Morvhal (todos los Súper Jefes). En el mapa de Grietas se elige el nivel (I, II, III…).
 *  · Cada nivel: monstruos con más vida (×1,3 por nivel) y daño (×1,12), más nivel de objetos, y más botín
 *    (+25% de ámbar y XP por nivel, más legendarios; desde el III, botín épico o legendario).
 *  · Vencer al Guardián (o Súper Jefe) del nivel más alto abre el siguiente y da Sellos de Gesta.
 *  · El nivel más alto superado va al ranking mundial de Tormento (ranking.js).
 *  (No aplica a la Mazmorra ni a la Grieta del Día.)
 */
'use strict';

const ROMAN = (n) => { let s = ''; for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; } return s; };
const tormentOpen = () => !!S && storyChapter() >= BIOMES.length;
const torMax = () => Math.max(1, (S && S.tormentMax) || 1);          // nivel más alto que se puede elegir
const torBest = () => Math.max(0, torMax() - 1);                    // nivel más alto superado
const torSel = () => (tormentOpen() ? Math.min(Math.max(0, (S && S.torment) || 0), torMax()) : 0);
const TOR = {
  hp: (T) => Math.pow(1.3, T), dmg: (T) => Math.pow(1.12, T), reward: (T) => 1 + 0.25 * T,
};
const tormentName = (T) => 'Tormento ' + ROMAN(T);
function tormentDiff(T) {
  return Object.assign({}, HARD, {
    id: 'tormento', name: tormentName(T), color: '#d36bff', torment: T,
    lvl: HARD.lvl + 2 * T, threat: HARD.threat + Math.ceil(T / 2), reward: +(HARD.reward * TOR.reward(T)).toFixed(2),
    hi: Math.min(0.9, HARD.hi + 0.06 * T), rar: T >= 3 ? [2, 3] : [1, 2], set: Math.min(0.8, HARD.set + 0.04 * T),
  });
}

// ---------- al entrar en una Grieta ----------
let torDungeon = false;
const _startDungeonTor = startDungeon;
startDungeon = function (tier) { torDungeon = true; try { _startDungeonTor(tier); } finally { torDungeon = false; } };
const _startNodeTor = startNode;
startNode = function (b, n, d) {
  const T = !window._dailyStart && !torDungeon ? torSel() : 0;
  if (!T) return _startNodeTor(b, n, d);
  // la Grieta se monta con la dificultad del Tormento (cartel, amenaza, botín) y luego se devuelve la normal
  const old = DIFFS.slice(), TD = tormentDiff(T);
  for (let i = 0; i < DIFFS.length; i++) DIFFS[i] = TD;
  try { _startNodeTor(b, n, d); } finally { for (let i = 0; i < DIFFS.length; i++) DIFFS[i] = old[i]; }
  rift.torment = T;
};

// ---------- monstruos ----------
const _spawnEnemyTor = spawnEnemy;
spawnEnemy = function (type, x, y, o = {}) {
  const e = _spawnEnemyTor(type, x, y, o);
  const T = e && scene === 'rift' && rift && rift.torment;
  if (!T) return e;
  e.hp = e.maxHp = Math.round(e.maxHp * TOR.hp(T));
  e.dmg *= TOR.dmg(T);
  return e;
};

// ---------- el jefe del nivel más alto abre el siguiente ----------
const _killEnemyTor = killEnemy;
killEnemy = function (e) {
  const was = e.dead;
  _killEnemyTor(e);
  const T = !was && scene === 'rift' && rift && rift.torment;
  if (!T || !(e.boss || e.superDef) || e.child || rift.torDone) return;
  rift.torDone = true;
  if (T < torMax()) return;
  S.tormentMax = T + 1;
  persist();
  later(2.6, () => {
    showBanner(`¡${tormentName(T + 1)} desbloqueado!`, '#d36bff', `Has superado ${tormentName(T)} · elige el siguiente en el mapa`);
    gainSeals(2 + T, tormentName(T));
  });
  if (typeof rankSubmitTorment === 'function') setTimeout(rankSubmitTorment, 3000);
};

// ---------- mapa: selector de nivel ----------
const _buildMapInfoTor = buildMapInfo;
buildMapInfo = function () {
  _buildMapInfoTor();
  const go = $('btnMapGo');
  if (!go || !tormentOpen()) return;
  const T = torSel(), mx = torMax();
  const info = T
    ? `Monstruos: vida ×${TOR.hp(T).toFixed(1)} · daño ×${TOR.dmg(T).toFixed(1)} · Ámbar y XP ×${TOR.reward(T).toFixed(2)}${T >= 3 ? ' · botín épico o legendario' : ''}`
    : `Historia normal · has superado hasta ${torBest() ? tormentName(torBest()) : 'ningún Tormento'}`;
  go.insertAdjacentHTML('beforebegin', `<div class="tor-row ${T ? 'on' : ''}">
    <span class="tor-lbl">☠ Tormento</span>
    <button type="button" data-tor="-1" ${T ? '' : 'disabled'}>◀</button><b>${T ? ROMAN(T) : '—'}</b><button type="button" data-tor="1" ${T < mx ? '' : 'disabled'}>▶</button>
    <small>${info}</small></div>`);
};
$('mapInfo').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-tor]');
  if (!b || !S) return;
  ev.stopPropagation();
  S.torment = Math.max(0, Math.min(torMax(), torSel() + +b.dataset.tor));
  SFX.play('click'); persist(); buildMapInfo();
});

// ---------- aviso al abrirse ----------
document.body.insertAdjacentHTML('beforeend', '<div id="torToast" class="ach-toast tor"><img src="img/talents/trophy.png" alt=""><span><small>Final de partida</small><b>¡Niveles de Tormento!</b><em>Elígelos en el mapa de Grietas: monstruos más duros, mejor botín y ranking mundial</em></span></div>');
const _goHubTor = goHub;
goHub = function () {
  _goHubTor();
  if (!tormentOpen() || S.tormentSeen) return;
  S.tormentSeen = 1; persist();
  setTimeout(() => {
    const el = $('torToast');
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    SFX.play('legend');
    setTimeout(() => el.classList.remove('show'), 6000);
  }, 4000);
};

// ---------- cartel en la Grieta ----------
const _riftRowsTor = riftRows;
riftRows = function (extra = []) {
  if (!rift || !rift.torment) return _riftRowsTor(extra);
  return _riftRowsTor([['Tormento', `<span style="color:#d36bff">${ROMAN(rift.torment)}</span>${rift.torDone ? ' ✔' : ''}`], ...extra]);
};
