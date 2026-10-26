/* Fendaria — Grieta del Día.
 * Cada día (semilla = fecha) se elige la Grieta de tu frontera y dos reglas raras. Se puede repetir
 * cuantas veces quieras: cuenta la mejor puntuación del día y el récord personal; el premio
 * (Sellos de Gesta y un objeto legendario) se cobra una vez al día, al vencer al Guardián.
 */
'use strict';

const DAILY_MODS = {
  crits: { name: 'Solo críticos', icon: '✦', d: 'Todos tus golpes son críticos, pero haces un 40% menos de daño' },
  boom: { name: 'Polvorín', icon: '✹', d: 'Todos los monstruos explotan al morir' },
  glass: { name: 'Cañón de cristal', icon: '◇', d: '+80% de daño, pero la mitad de vida' },
  swarm: { name: 'Enjambre', icon: '⁂', d: 'El doble de monstruos, con la mitad de vida' },
  giants: { name: 'Gigantes', icon: '⛰', d: 'Monstruos enormes y lentos con el triple de vida' },
  vampire: { name: 'Sed vampírica', icon: '🩸', d: 'Sin pociones: cada baja te cura un 3%' },
  haste: { name: 'Frenesí', icon: '»', d: 'Todo va más rápido: monstruos +30%, tus ataques +30%' },
  elites: { name: 'Nido de élites', icon: '♛', d: 'Un tercio de los monstruos son élites' },
  blessed: { name: 'Bendecido', icon: '☀', d: 'Empiezas con tres bendiciones al azar' },
  dark: { name: 'Noche eterna', icon: '☾', d: 'Oscuridad permanente: solo ves cerca de ti' },
};
const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function dayRng(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
// la Grieta más avanzada que tienes abierta (sin Súper Jefes)
function frontierNode() {
  let best = { b: 0, n: 1 };
  for (let b = 0; b < BIOMES.length; b++) for (let n = 1; n <= LEVELS_PER_BIOME; n++) if (nodeUnlocked(b, n)) best = { b, n };
  return best;
}
function todayDaily() {
  const key = dayKey(), r = dayRng('fendaria' + key), ks = Object.keys(DAILY_MODS);
  const a = ks[Math.floor(r() * ks.length)];
  let b = a; while (b === a) b = ks[Math.floor(r() * ks.length)];
  return { key, mods: [a, b], node: frontierNode() };
}
const dailySave = () => {
  const t = dayKey();
  if (!S.daily2 || S.daily2.key !== t) S.daily2 = { key: t, best: 0, claimed: false, tries: 0 };
  return S.daily2;
};
const dmod = (k) => !!(rift && rift.daily && rift.daily.mods.includes(k));

// ---------- puntuación ----------
function dailyScore() {
  const d = rift && rift.daily;
  if (!d) return 0;
  const tb = rift.bossDead ? Math.max(0, 300 - (d.bossT || rift.elapsed)) * 6 : 0;
  return Math.round(d.kills * 10 + d.elites * 60 + (rift.bossDead ? 1500 : 0) + tb);
}
function dailyEnd(won) {
  const d = rift && rift.daily;
  if (!d || d.ended) return;
  d.ended = true;
  const sc = dailyScore(), sv = dailySave();
  d.final = sc; d.newBest = sc > sv.best; d.newRecord = sc > (S.dailyRecord || 0);
  sv.best = Math.max(sv.best, sc);
  S.dailyRecord = Math.max(S.dailyRecord || 0, sc);
  if (won && !sv.claimed) {
    sv.claimed = true; d.reward = true;
    gainSeals(10, 'Grieta del Día');
    S.bag.push(makeItem(S.cls, itemLevel() + 2, 3)); // directo a la bolsa: se cobra al cruzar el Portal
  }
  persist();
}

// ---------- panel en la villa ----------
document.body.insertAdjacentHTML('beforeend', `<div id="dailyPick" class="run-pick">
  <div class="rp-box daily-box">
    <div class="rp-head"><b>Grieta del Día</b><small id="dlyInfo"></small></div>
    <div id="dlyMods" class="dly-mods"></div>
    <div id="dlyStats" class="dly-stats"></div>
    <button id="dlyGo" class="rp-opt go" type="button"><i>⚔</i><span><b>Entrar</b><small>Puedes repetirla las veces que quieras: cuenta tu mejor puntuación</small></span></button>
    <button id="dlyClose" class="rp-opt" type="button"><i>✕</i><span><b>Ahora no</b></span></button>
  </div>
</div>`);
function openDaily() {
  if (state !== 'hub') return;
  const T = todayDaily(), sv = dailySave(), B = BIOMES[T.node.b];
  $('dlyInfo').textContent = `${B.name} · Grieta ${T.node.n} · hoy, ${T.key.split('-').reverse().join('/')}`;
  $('dlyMods').innerHTML = T.mods.map((k) => `<div class="dly-mod"><i>${DAILY_MODS[k].icon}</i><span><b>${DAILY_MODS[k].name}</b><small>${DAILY_MODS[k].d}</small></span></div>`).join('');
  $('dlyStats').innerHTML = `<span>Tu mejor hoy</span><b>${fmtNum(sv.best)} pts</b><span>Récord personal</span><b>${fmtNum(S.dailyRecord || 0)} pts</b>
    <span>Premio del día</span><b>${sv.claimed ? '<span style="color:#7cff8a">✔ cobrado</span>' : '10 Sellos + un legendario a la bolsa (vence al Guardián)'}</b>`;
  $('dailyPick').classList.add('show');
  SFX.play('click');
}
const closeDaily = () => $('dailyPick').classList.remove('show');
$('dlyClose').addEventListener('click', () => { SFX.play('click'); closeDaily(); });
$('dailyPick').addEventListener('click', (ev) => { if (ev.target.id === 'dailyPick') closeDaily(); });
$('dlyGo').addEventListener('click', () => {
  closeDaily();
  const T = todayDaily();
  dailySave().tries++;
  window._dailyStart = T;
  startNode(T.node.b, T.node.n, 0);
});
(function () {
  const slots = document.querySelector('#dofusBar .db-slots');
  if (!slots) return;
  slots.insertAdjacentHTML('beforeend', '<button id="dbDaily" class="db-slot" type="button"><img src="img/icons/gem.png" alt=""><span>Del día</span></button>');
  $('dbDaily').addEventListener('click', openDaily);
})();
// el botón avisa si el premio de hoy sigue sin cobrar
const _buildHubD = buildHub;
buildHub = function () {
  _buildHubD();
  const b = $('dbDaily');
  if (b) { const free = !dailySave().claimed; b.classList.toggle('glow', free); const old = b.querySelector('.badge'); if (old) old.remove(); if (free) b.insertAdjacentHTML('beforeend', '<i class="badge">!</i>'); }
};

// ---------- inicio de la Grieta del Día ----------
const _startNodeD = startNode;
startNode = function (b, n, d) {
  const T = window._dailyStart; window._dailyStart = null;
  _startNodeD(b, n, d);
  if (!T) return;
  rift.daily = { mods: T.mods, key: T.key, kills: 0, elites: 0 };
  later(0.5, () => {
    showBanner('Grieta del Día', '#ffd54f', T.mods.map((k) => DAILY_MODS[k].icon + ' ' + DAILY_MODS[k].name).join('  ·  '));
    if (dmod('blessed') && rift.bn) {
      const pool = Object.keys(BOONS).filter((id) => BOONS[id].slot !== 'duo' && !BOONS[id].req);
      for (let i = 0; i < 3; i++) {
        const free = pool.filter((id) => !rift.bn.owned[id] && (BOONS[id].slot === 'pas' || !rift.bn.slots[BOONS[id].slot]));
        if (!free.length) break;
        const id = pick(free);
        rift.bn.owned[id] = { r: 1, lvl: 1 };
        if (BOONS[id].slot !== 'pas') rift.bn.slots[BOONS[id].slot] = id;
      }
      recalc(); if (typeof buildBoonBar === 'function') buildBoonBar();
    }
    recalc();
  });
};

// ---------- reglas ----------
const _spawnEnemyD = spawnEnemy;
spawnEnemy = function (type, x, y, o = {}) {
  if (dmod('elites') && !o.elite && !o.super && !ENEMIES[type].boss && Math.random() < 0.33) o = Object.assign({}, o, { elite: true });
  const e = _spawnEnemyD(type, x, y, o);
  if (!e || !rift || !rift.daily || e.boss || e.superDef) return e;
  if (dmod('boom')) e.mut = 'volatil';
  if (dmod('swarm')) { e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * 0.5)); }
  if (dmod('giants')) { e.hp = e.maxHp = Math.round(e.maxHp * 3); e.r *= 1.45; e.speed *= 0.7; e.dmg *= 1.3; }
  if (dmod('haste')) e.speed *= 1.3;
  return e;
};
const _spawnPackD = spawnPack;
spawnPack = function () { _spawnPackD(); if (dmod('swarm')) _spawnPackD(); };
const _damageEnemyD = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (rift && rift.daily && !o.quiet) {
    if (dmod('crits')) { o = Object.assign({}, o, { crit: true }); base *= 0.6; }
    if (dmod('glass')) base *= 1.8;
  }
  return _damageEnemyD(e, base, o);
};
const _recalcD = recalc;
recalc = function () {
  _recalcD();
  if (!P || !rift || !rift.daily) return;
  if (dmod('glass')) { const r = P.hp / P.maxHp; P.maxHp = Math.round(P.maxHp * 0.5); P.hp = Math.max(1, Math.round(P.maxHp * r)); }
  if (dmod('haste')) P.atkSpeed *= 1.3;
};
const _eatBreadD = eatBread;
eatBread = function () { if (dmod('vampire')) { addText(P.x, P.y - 50, 'Sin pociones hoy', '#ff6a6a', 0.8); return; } _eatBreadD(); };
const _killEnemyD = killEnemy;
killEnemy = function (e) {
  const was = e.dead;
  _killEnemyD(e);
  if (was || !rift || !rift.daily) return;
  rift.daily.kills++;
  if (e.elite) rift.daily.elites++;
  if (e.boss) rift.daily.bossT = rift.elapsed;
  if (dmod('vampire') && P) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.03);
};

// ---------- final: puntuación en las pantallas de fin y de muerte ----------
const _finishRiftD = finishRift;
finishRift = function () {
  const daily = rift && rift.daily, was = state;
  _finishRiftD();
  if (daily && was === 'play' && state === 'end') {
    dailyEnd(true);
    $('endTitle').textContent = 'Grieta del Día superada';
    $('endStats').insertAdjacentHTML('afterbegin', dailyRows(daily));
  }
};
const _playerDiedD = playerDied;
playerDied = function () {
  const daily = rift && rift.daily, was = state;
  _playerDiedD();
  if (!daily || was !== 'play' || state !== 'dead') return;
  dailyEnd(false);
  setTimeout(() => { const el = $('deadStats'); if (el) el.insertAdjacentHTML('afterbegin', dailyRows(daily)); }, 950);
};
function dailyRows(d) {
  const tag = d.newRecord ? ' <span style="color:#ffd54f">¡RÉCORD!</span>' : d.newBest ? ' <span style="color:#7cff8a">¡mejor del día!</span>' : '';
  return `<span>Puntuación</span><b>${fmtNum(d.final)} pts${tag}</b><span>Récord personal</span><b>${fmtNum(S.dailyRecord || 0)} pts</b>` +
    (d.reward ? '<span>Premio del día</span><b style="color:#ffd54f">+10 Sellos y un legendario</b>' : '');
}

// ---------- marcador y noche eterna ----------
const _drawHUDD = drawHUD;
drawHUD = function () {
  if (scene === 'rift' && rift && rift.daily && P) {
    if (dmod('dark')) {
      const px = W / 2 + (P.x - cam.x) * zoom, py = H / 2 + (P.y - 20 - cam.y) * zoom;
      const g = ctx.createRadialGradient(px, py, 80 * zoom, px, py, 260 * zoom);
      g.addColorStop(0, 'rgba(4,2,16,0)'); g.addColorStop(1, 'rgba(4,2,16,0.85)');
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }
  _drawHUDD();
  if (scene === 'rift' && rift && rift.daily) {
    const s = ui;
    text(`☀ Del día · ${fmtNum(dailyScore())} pts`, W / 2, H - 14 * s, 12 * s, '#ffd54f', 'center', 900);
  }
};
