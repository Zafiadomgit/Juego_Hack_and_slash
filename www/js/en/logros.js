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
  ['k1', "First blood", "Defeat 50 monsters", () => st().kills, 50, 2],
  ['k2', "Hunter", "Defeat 1,000 monsters", () => st().kills, 1000, 5, "the Hunter"],
  ['k3', "Scourge of the Rifts", "Defeat 10,000 monsters", () => st().kills, 10000, 15, "Scourge of the Rifts"],
  ['e1', "Giantslayer", "Defeat 25 elites", () => st().elites, 25, 3],
  ['e2', "Elite executioner", "Defeat 250 elites", () => st().elites, 250, 8, "the Executioner"],
  ['m1', "Against nature", "Defeat 100 mutated monsters", () => st().muts, 100, 4],
  ['b1', "Fallen Guardian", "Defeat your first Guardian", () => st().bosses, 1, 2],
  ['b2', "Guardbreaker", "Defeat 25 Guardians", () => st().bosses, 25, 6, "Guardbreaker"],
  ['b3', "Untouchable", "Defeat a Guardian without taking damage", () => st().noHit, 1, 8, "the Untouchable"],
  ['s1', "Seal freed", "Defeat your first Super Boss", () => st().supers, 1, 5, "Sealbearer"],
  ['s2', "Liberator", "Defeat 4 Super Bosses", () => st().supers, 4, 10, "the Liberator"],
  ['s3', "End of the Locksmith", "Defeat 8 Super Bosses", () => st().supers, 8, 20, "Bane of Morvhal"],
  ['r1', "Explorer", "Close 10 Rifts", () => st().rifts, 10, 3],
  ['r2', "Wanderer", "Close 100 Rifts", () => st().rifts, 100, 10, "the Wanderer"],
  ['x1', "Expedition", "Reach the 3rd Rift of an expedition", () => st().bestRun, 3, 3],
  ['x2', "No looking back", "Reach the 7th Rift of an expedition", () => st().bestRun, 7, 8, "the Tireless"],
  ['x3', "Living legend", "Reach the 12th Rift of an expedition", () => st().bestRun, 12, 15, "Living Legend"],
  ['g1', "Favorite of the Twelve", "Have 10 blessings at once", () => st().maxBoons, 10, 6, "Favorite of the Twelve"],
  ['l1', "Golden glow", "Find 10 legendary items", () => st().legend, 10, 5],
  ['l2', "Collector", "Find 50 legendary items", () => st().legend, 50, 10, "the Collector"],
  ['u1', "Power unleashed", "Use your ultimate 50 times", () => st().ults, 50, 4],
  ['v1', "Surprises", "Complete 20 Rift events", () => st().events, 20, 4],
  ['a1', "Deep pockets", "Collect 50,000 amber", () => st().amber, 50000, 5, "the Wealthy"],
  ['h1', "Companions", "Enter a Rift with 3 different heroes", () => Object.keys(ACH().heroes).length, 3, 3],
  ['h2', "The Seven", "Enter a Rift with all 7 heroes", () => Object.keys(ACH().heroes).length, 7, 10, "Master of the Seven"],
  ['n1', "Veteran", "Reach level 30 with a hero", () => st().maxLvl, 30, 5],
  ['n2', "Hero of Fendaria", "Reach level 60 with a hero", () => st().maxLvl, 60, 12, "Hero of Fendaria"],
  ['d1', "Early bird", "Score 3,000 points in the Daily Rift", () => S && S.dailyRecord || 0, 3000, 4],
  ['d2', "Champion of the day", "Score 10,000 points in the Daily Rift", () => S && S.dailyRecord || 0, 10000, 10, "Champion of the Day"],
  ['z1', "Get up", "Fall in combat 10 times", () => st().deaths, 10, 2, "the Stubborn"],
  ['c1', "Bestiary", "Defeat 20 different kinds of monster", () => Object.keys(ACH().best).length, 20, 6, "the Naturalist"],
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
document.body.insertAdjacentHTML('beforeend', "<div id=\"achToast\" class=\"ach-toast\"><img src=\"img/talents/trophy.png\" alt=\"\"><span><small>Achievement unlocked!</small><b></b><em></em></span></div>");
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
    achQ.push({ name, txt: `+${seals} Feat Seals` + (title ? ` · title «${title}»` : '') });
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
    <div class="ach-head"><b>Achievements</b><div class="ach-tabs"><button data-t="ach" class="on">Achievements</button><button data-t="best">Bestiary</button><button data-t="rank">Ranking</button></div><button class="ach-x" aria-label="Close">✕</button></div>
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
    $('achSub').innerHTML = `${n} / ${ACHS.length} earned${SAVE.title ? ` · Title: <b>«${SAVE.title}»</b>` : " · tap an earned title to wear it"}`;
    list.innerHTML = ACHS.map(([id, name, desc, val, goal, seals, title]) => {
      const got = !!a.got[id], v = Math.min(goal, val());
      return `<div class="ach ${got ? 'got' : ''}"><img src="img/talents/${got ? 'trophy' : 'crown'}.png" alt="">
        <div class="ach-txt"><b>${name}</b><small>${desc}</small>${got ? '' : `<div class="q-bar"><i style="width:${(v / goal) * 100}%"></i></div><small>${fmtNum(v)} / ${fmtNum(goal)}</small>`}</div>
        <div class="ach-rw">${SEAL_SVG} ${seals}${title ? (got ? `<button data-title="${title}" class="${SAVE.title === title ? 'on' : ''}">«${title}»</button>` : `<i>«${title}»</i>`) : ''}</div></div>`;
    }).join('');
  } else if (achTab === 'best') {
    const ids = [...new Set([...Object.keys(ENEMIES), ...Object.keys(SUPER_BOSSES).map((k) => 'S_' + k)])].filter((id) => MON_ANIM[id]);
    const seen = ids.filter((id) => a.best[id]).length;
    $('achSub').textContent = `${seen} / ${ids.length} monsters discovered`;
    list.innerHTML = '<div class="best-grid">' + ids.map((id) => {
      const k = a.best[id], sup = id.startsWith('S_'), name = sup ? SUPER_BOSSES[id.slice(2)].name : ENEMIES[id].name;
      return `<div class="best ${k ? '' : 'unk'} ${sup || (ENEMIES[id] && ENEMIES[id].boss) ? 'boss' : ''}"><img src="${bestPortrait(id)}" alt=""><b>${k ? name : '???'}</b><small>${k ? '× ' + fmtNum(k) : "Undiscovered"}</small></div>`;
    }).join('') + '</div>';
  } else if (typeof buildRanking === 'function') buildRanking(list);
}
(function () {
  const slots = document.querySelector('#dofusBar .db-slots');
  if (!slots) return;
  const opt = $('dbOpts');
  const html = "<button id=\"dbAch\" class=\"db-slot\" type=\"button\"><img src=\"img/talents/trophy.png\" alt=\"\"><span>Awards</span></button>";
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
