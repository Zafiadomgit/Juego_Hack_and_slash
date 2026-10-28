/* Fendaria — logros, títulos y bestiario (comunes a todos los héroes).
 * Cada logro da Sellos de Gesta al héroe con el que se consigue; muchos dan además un título que se luce
 * bajo el nombre en la villa. El bestiario cuenta cuántos de cada monstruo has derrotado.
 */
'use strict';

const ACH = () => {
  SAVE.ach = SAVE.ach || {};
  const a = SAVE.ach;
  a.got = a.got || {}; a.best = a.best || {}; a.heroes = a.heroes || {};
  a.st = Object.assign({ kills: 0, elites: 0, bosses: 0, supers: 0, muts: 0, rifts: 0, deaths: 0, legend: 0, ults: 0, events: 0, amber: 0, bestRun: 0, maxLvl: 1, maxBoons: 0, noHit: 0 }, a.st || {});
  return a;
};
const st = () => ACH().st;
// [id, nombre, descripción, valor actual, meta, sellos, título]
const ACHS = [
  ['k1', 'Primera sangre', 'Derrota 50 monstruos', () => st().kills, 50, 2],
  ['k2', 'Cazador', 'Derrota 1.000 monstruos', () => st().kills, 1000, 5, 'el Cazador'],
  ['k3', 'Azote de las Grietas', 'Derrota 10.000 monstruos', () => st().kills, 10000, 15, 'Azote de las Grietas'],
  ['e1', 'Matagigantes', 'Derrota 25 élites', () => st().elites, 25, 3],
  ['e2', 'Verdugo de élites', 'Derrota 250 élites', () => st().elites, 250, 8, 'el Verdugo'],
  ['m1', 'Contra natura', 'Derrota 100 monstruos mutados', () => st().muts, 100, 4],
  ['b1', 'Guardián caído', 'Vence a tu primer Guardián', () => st().bosses, 1, 2],
  ['b2', 'Rompeguardianes', 'Vence a 25 Guardianes', () => st().bosses, 25, 6, 'Rompeguardianes'],
  ['b3', 'Intocable', 'Vence a un Guardián sin recibir daño', () => st().noHit, 1, 8, 'el Intocable'],
  ['s1', 'Sello liberado', 'Vence a tu primer Súper Jefe', () => st().supers, 1, 5, 'Portador del Sello'],
  ['s2', 'Liberador', 'Vence a 4 Súper Jefes', () => st().supers, 4, 10, 'el Liberador'],
  ['s3', 'Fin del Cerrajero', 'Vence a 8 Súper Jefes', () => st().supers, 8, 20, 'Azote de Morvhal'],
  ['r1', 'Explorador', 'Cierra 10 Grietas', () => st().rifts, 10, 3],
  ['r2', 'Andarríos', 'Cierra 100 Grietas', () => st().rifts, 100, 10, 'el Andarríos'],
  ['x1', 'Expedición', 'Llega a la 3.ª Grieta de una expedición', () => st().bestRun, 3, 3],
  ['x2', 'Sin mirar atrás', 'Llega a la 7.ª Grieta de una expedición', () => st().bestRun, 7, 8, 'el Incansable'],
  ['x3', 'Leyenda viva', 'Llega a la 12.ª Grieta de una expedición', () => st().bestRun, 12, 15, 'Leyenda Viva'],
  ['g1', 'Favorito de los Doce', 'Ten 10 bendiciones a la vez', () => st().maxBoons, 10, 6, 'Favorito de los Doce'],
  ['l1', 'Brillo dorado', 'Encuentra 10 objetos legendarios', () => st().legend, 10, 5],
  ['l2', 'Coleccionista', 'Encuentra 50 objetos legendarios', () => st().legend, 50, 10, 'el Coleccionista'],
  ['u1', 'Poder desatado', 'Usa la definitiva 50 veces', () => st().ults, 50, 4],
  ['v1', 'Imprevistos', 'Completa 20 eventos de Grieta', () => st().events, 20, 4],
  ['a1', 'Bolsillos llenos', 'Recoge 50.000 de ámbar', () => st().amber, 50000, 5, 'el Acaudalado'],
  ['h1', 'Compañeros', 'Entra en una Grieta con 3 héroes distintos', () => Object.keys(ACH().heroes).length, 3, 3],
  ['h2', 'Los Siete', 'Entra en una Grieta con los 7 héroes', () => Object.keys(ACH().heroes).length, 7, 10, 'Maestro de los Siete'],
  ['n1', 'Veterano', 'Alcanza el nivel 30 con un héroe', () => st().maxLvl, 30, 5],
  ['n2', 'Héroe de Fendaria', 'Alcanza el nivel 60 con un héroe', () => st().maxLvl, 60, 12, 'Héroe de Fendaria'],
  ['d1', 'Madrugador', 'Consigue 3.000 puntos en la Grieta del Día', () => S && S.dailyRecord || 0, 3000, 4],
  ['d2', 'Campeón del día', 'Consigue 10.000 puntos en la Grieta del Día', () => S && S.dailyRecord || 0, 10000, 10, 'Campeón del Día'],
  ['z1', 'Levántate', 'Cae en combate 10 veces', () => st().deaths, 10, 2, 'el Testarudo'],
  ['c1', 'Bestiario', 'Derrota a 20 tipos de monstruo distintos', () => Object.keys(ACH().best).length, 20, 6, 'el Naturalista'],
];

// ---------- seguimiento ----------
const _killEnemyL = killEnemy;
killEnemy = function (e) {
  const was = e.dead;
  _killEnemyL(e);
  if (was || scene !== 'rift' || !rift) return;
  const a = ACH(), s = a.st;
  s.kills++;
  if (e.elite) s.elites++;
  if (e.mut) s.muts++;
  const id = e.superDef ? monAnimId(e) : e.type;
  a.best[id] = (a.best[id] || 0) + 1;
  if (e.superDef) s.supers++;
  else if (e.boss && !rift.isDungeon) { s.bosses++; if (rift.bossClean) s.noHit++; }
};
const _spawnGuardianL = spawnGuardian;
spawnGuardian = function () { _spawnGuardianL(); if (rift) rift.bossClean = true; };
const _hurtPlayerL = hurtPlayer;
hurtPlayer = function (dmg, sx, sy, src) {
  const hp0 = P ? P.hp : 0;
  const r = _hurtPlayerL(dmg, sx, sy, src);
  if (rift && rift.bossSpawned && !rift.bossDead && P && P.hp < hp0) rift.bossClean = false;
  return r;
};
const _finishRiftL = finishRift;
finishRift = function () { const was = state; _finishRiftL(); if (was === 'play' && state === 'end' && !rift.isDungeon) st().rifts++; };
const _playerDiedL = playerDied;
playerDied = function () { const was = state; _playerDiedL(); if (was === 'play' && state === 'dead') st().deaths++; };
const _collectL = collect;
collect = function (k) {
  const n = S.bag.length;
  _collectL(k);
  if (k.type === 'item' && S.bag.length > n && k.item.rarity === 3) st().legend++;
  if (k.type === 'kama') st().amber += k.val || 0;
};
const _useUltimateL = useUltimate;
useUltimate = function () { const u = P && P.ult; _useUltimateL(); if (P && u >= 100 && P.ult < 100) st().ults++; };
const _finishRiftEventL = finishRiftEvent;
finishRiftEvent = function (ok) { const ev = riftEvent; _finishRiftEventL(ok); if (ok && ev && ev.done) st().events++; };
const _startNodeL2 = startNode;
startNode = function (b, n, d) { _startNodeL2(b, n, d); ACH().heroes[S.cls] = 1; };

// ---------- comprobación periódica y desbloqueo ----------
document.body.insertAdjacentHTML('beforeend', '<div id="achToast" class="ach-toast"><img src="img/talents/trophy.png" alt=""><span><small>¡Logro desbloqueado!</small><b></b><em></em></span></div>');
let achQ = [], achBusy = false;
function achCheck() {
  if (!S || !SAVE) return;
  const a = ACH(), s = a.st;
  s.maxLvl = Math.max(s.maxLvl, S.level || 1);
  if (scene === 'rift' && rift) {
    if (rift.bn) s.maxBoons = Math.max(s.maxBoons, Object.keys(rift.bn.owned || {}).length);
    s.bestRun = Math.max(s.bestRun, rift.run ? rift.run.depth + 1 : 1);
  }
  for (const [id, name, , val, goal, seals, title] of ACHS) {
    if (a.got[id] || val() < goal) continue;
    a.got[id] = Date.now();
    S.seals = (S.seals || 0) + seals;
    achQ.push({ name, txt: `+${seals} Sellos de Gesta` + (title ? ` · título «${title}»` : '') });
    persist();
  }
  if (achQ.length && !achBusy) achShow();
}
function achShow() {
  const t = achQ.shift();
  if (!t) { achBusy = false; return; }
  achBusy = true;
  const el = $('achToast');
  el.querySelector('b').textContent = t.name; el.querySelector('em').textContent = t.txt;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  SFX.play('legend');
  if (typeof buzz === 'function') buzz('ach', [20, 40, 20], 0.5);
  setTimeout(() => { el.classList.remove('show'); setTimeout(achShow, 400); }, 3200);
}
setInterval(achCheck, 1000);

// ---------- panel: Logros · Bestiario ----------
document.body.insertAdjacentHTML('beforeend', `<div id="achPanel" class="run-pick">
  <div class="rp-box ach-box">
    <div class="ach-head"><b>Logros</b><div class="ach-tabs"><button data-t="ach" class="on">Logros</button><button data-t="best">Bestiario</button><button data-t="rank">Ranking</button></div><button class="ach-x" aria-label="Cerrar">✕</button></div>
    <div id="achSub" class="ach-sub"></div>
    <div id="achList" class="ach-list"></div>
  </div>
</div>`);
let achTab = 'ach';
function openAch(tab) {
  if (state !== 'hub') return;
  if (tab) achTab = tab;
  achCheck(); buildAch();
  $('achPanel').classList.add('show'); SFX.play('click');
}
const closeAch = () => $('achPanel').classList.remove('show');
$('achPanel').addEventListener('click', (ev) => {
  if (ev.target.id === 'achPanel' || ev.target.closest('.ach-x')) { closeAch(); return; }
  const t = ev.target.closest('[data-t]');
  if (t) { achTab = t.dataset.t; SFX.play('click'); buildAch(); return; }
  const ti = ev.target.closest('[data-title]');
  if (ti) { SAVE.title = SAVE.title === ti.dataset.title ? '' : ti.dataset.title; persist(); SFX.play('click'); buildAch(); if (typeof buildHub === 'function') buildHub(); }
});
const BEST_PORTRAIT = new Map();
function bestPortrait(id) {
  if (BEST_PORTRAIT.has(id)) return BEST_PORTRAIT.get(id);
  let url = '';
  try {
    const A = MON_ANIM[id];
    if (A) {
      const c = monFrame(id, A.idle ? 'idle' : 'move', 0, null, null), cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const g = cv.getContext('2d'), k = Math.min(60 / c.width, 60 / c.height); g.imageSmoothingEnabled = false;
      g.drawImage(c, (64 - c.width * k) / 2, 62 - c.height * k, c.width * k, c.height * k);
      url = cv.toDataURL();
    }
  } catch (e) { url = ''; }
  BEST_PORTRAIT.set(id, url);
  return url;
}
function buildAch() {
  const a = ACH();
  for (const b of document.querySelectorAll('#achPanel [data-t]')) b.classList.toggle('on', b.dataset.t === achTab);
  const list = $('achList');
  if (achTab === 'ach') {
    const n = ACHS.filter((x) => a.got[x[0]]).length;
    $('achSub').innerHTML = `${n} / ${ACHS.length} conseguidos${SAVE.title ? ` · Título: <b>«${SAVE.title}»</b>` : ' · toca un título conseguido para lucirlo'}`;
    list.innerHTML = ACHS.map(([id, name, desc, val, goal, seals, title]) => {
      const got = !!a.got[id], v = Math.min(goal, val());
      return `<div class="ach ${got ? 'got' : ''}"><img src="img/talents/${got ? 'trophy' : 'crown'}.png" alt="">
        <div class="ach-txt"><b>${name}</b><small>${desc}</small>${got ? '' : `<div class="q-bar"><i style="width:${(v / goal) * 100}%"></i></div><small>${fmtNum(v)} / ${fmtNum(goal)}</small>`}</div>
        <div class="ach-rw">${SEAL_SVG} ${seals}${title ? (got ? `<button data-title="${title}" class="${SAVE.title === title ? 'on' : ''}">«${title}»</button>` : `<i>«${title}»</i>`) : ''}</div></div>`;
    }).join('');
  } else if (achTab === 'best') {
    const ids = [...new Set([...Object.keys(ENEMIES), ...Object.keys(SUPER_BOSSES).map((k) => 'S_' + k)])].filter((id) => MON_ANIM[id]);
    const seen = ids.filter((id) => a.best[id]).length;
    $('achSub').textContent = `${seen} / ${ids.length} monstruos descubiertos`;
    list.innerHTML = '<div class="best-grid">' + ids.map((id) => {
      const k = a.best[id], sup = id.startsWith('S_'), name = sup ? SUPER_BOSSES[id.slice(2)].name : ENEMIES[id].name;
      return `<div class="best ${k ? '' : 'unk'} ${sup || (ENEMIES[id] && ENEMIES[id].boss) ? 'boss' : ''}"><img src="${bestPortrait(id)}" alt=""><b>${k ? name : '???'}</b><small>${k ? '× ' + fmtNum(k) : 'Sin descubrir'}</small></div>`;
    }).join('') + '</div>';
  } else if (typeof buildRanking === 'function') buildRanking(list);
}
(function () {
  const slots = document.querySelector('#dofusBar .db-slots');
  if (!slots) return;
  const opt = $('dbOpts');
  const html = '<button id="dbAch" class="db-slot" type="button"><img src="img/talents/trophy.png" alt=""><span>Logros</span></button>';
  if (opt) opt.insertAdjacentHTML('beforebegin', html); else slots.insertAdjacentHTML('beforeend', html);
  $('dbAch').addEventListener('click', () => openAch());
})();

// título bajo el nombre en la ficha de la villa
const _buildHubL = buildHub;
buildHub = function () {
  _buildHubL();
  const nm = document.querySelector('#hubChar .hc-name');
  if (nm && SAVE.title) nm.insertAdjacentHTML('afterend', `<div class="hc-title">«${SAVE.title}»</div>`);
};
