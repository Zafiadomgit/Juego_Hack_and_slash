/* Fendaria — los primeros minutos: tutorial jugado, sin textos largos.
 * Solo la primera vez (S.tut). En la villa señala el Portal; en la primera Grieta enseña, paso a paso,
 * a moverse, atacar, esquivar, usar habilidades, tomar una bendición y enfrentarse al Guardián,
 * resaltando el botón que toca. Mientras dura, esa primera Grieta es algo más suave.
 */
'use strict';

document.body.insertAdjacentHTML('beforeend', '<div id="tutHint" class="tut-hint"><i></i><span></span></div>');
// las partidas que ya habían empezado a jugar no repiten el tutorial
const tutOn = () => {
  if (!S) return false;
  if (!S.tut && ((S.rifts || 0) > 0 || (S.level || 1) > 2)) S.tut = { done: 1 };
  return !(S.tut && S.tut.done);
};
const tutS = () => (S.tut = S.tut || { step: 0 });
let tutCur = null; // paso visible

const TUT = [
  { id: 'move', icon: '🕹', txt: () => (isTouch ? 'Arrastra el dedo en la <b>mitad izquierda</b> para moverte' : 'Muévete con <b>WASD</b> o las flechas'), btn: null, done: (s) => s.walk > 120 || s.mvT > 1.4 },
  { id: 'attack', icon: '⚔', txt: () => (isTouch ? 'Mantén pulsado <b>⚔</b> para atacar a los monstruos' : 'Mantén <b>J</b> o <b>espacio</b> para atacar'), btn: 'attack', done: (s) => rift.kills - s.k0 >= 4 },
  { id: 'dash', icon: '»', txt: () => 'Pulsa <b>»</b> para <b>esquivar</b>: mientras ruedas no te pueden golpear', btn: 'dash', done: (s) => s.dashed },
  { id: 'skill', icon: '✸', txt: () => 'Tus <b>habilidades</b> gastan energía (<b>EN</b>), que se recarga sola. ¡Prueba una!', btn: 's0', done: (s) => s.cast },
  { id: 'bar', icon: '▰', txt: () => 'Derrota monstruos para <b>llenar la barra</b> de la Grieta (arriba a la derecha)', btn: null, done: (s) => rift.bossSpawned || (rift.bn && (rift.bn.altars.length || rift.bn.doors.length || rift.bn.lull)) || s.t > 25 },
  { id: 'boon', icon: '✦', txt: () => 'Cuando termine la oleada, <b>acércate al altar</b> y pulsa el botón: los dioses te dan <b>bendiciones</b>', btn: null, done: (s) => rift.bn && Object.keys(rift.bn.owned).length > 0 },
  { id: 'boss', icon: '☠', txt: () => '¡El <b>Guardián</b>! Fíjate en el <b style="color:#ff6a5a">!</b> y en las zonas rojas: <b>esquiva</b> en el momento justo', btn: 'dash', done: (s) => rift.bossDead || (s.bossT && s.t - s.bossT > 9), wait: (s) => rift.bossSpawned },
];

function tutShow(step) {
  const el = $('tutHint');
  if (!step) { el.classList.remove('show'); tutCur = null; return; }
  if (tutCur === step) return;
  tutCur = step;
  el.querySelector('i').textContent = step.icon;
  el.querySelector('span').innerHTML = step.txt();
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function tutNext() {
  const s = tutS();
  s.step++; s.t = 0; s.k0 = rift ? rift.kills : 0;
  SFX.play('click');
  if (s.step >= TUT.length) {
    s.done = 1; tutShow(null); persist();
    later(1.2, () => showBanner('¡Ya sabes lo básico!', '#7cff8a', 'El resto lo descubrirás peleando. Suerte, Portador.'));
    return;
  }
  persist();
}

// ---------- seguimiento ----------
const _updatePlayerTut = updatePlayer;
updatePlayer = function (dt) {
  const x0 = P.x, y0 = P.y;
  _updatePlayerTut(dt);
  if (!tutOn() || scene !== 'rift' || !rift || rift.isDungeon) return;
  const s = tutS(), st = TUT[s.step];
  if (!st) return;
  s.t = (s.t || 0) + dt;
  s.walk = (s.walk || 0) + Math.hypot(P.x - x0, P.y - y0);
  if (P.moving) s.mvT = (s.mvT || 0) + dt;
  if (rift.bossSpawned && !s.bossT) s.bossT = s.t;
  // la poción se enseña cuando hace falta, sea cual sea el paso
  if (!s.potion && P.hp < P.maxHp * 0.45 && S.pan > 0 && state === 'play') {
    s.potion = 1;
    tutShow({ icon: '🧪', txt: () => 'Te queda poca vida: pulsa la <b>poción</b> para curarte', btn: 'pan' });
    later(6, () => { if (tutCur && tutCur.btn === 'pan') tutCur = null; });
    return;
  }
  if (tutCur && tutCur.btn === 'pan') return;
  if (st.wait && !st.wait(s)) { tutShow(null); return; }
  tutShow(st);
  if (s.t > 1.2 && st.done(s)) { tutShow(null); tutNext(); }
};
const _dashTut = dash;
dash = function () { const w = P.dashT; _dashTut(); if (P.dashT > 0 && w <= 0 && S.tut) S.tut.dashed = 1; };
const _useSkillTut = useSkill;
useSkill = function (i) { const b = P.skillCd[i]; _useSkillTut(i); if (P.skillCd[i] !== b && S.tut) S.tut.cast = 1; };
const _eatBreadTut = eatBread;
eatBread = function () { const n = S.pan; _eatBreadTut(); if (S.pan < n && tutCur && tutCur.btn === 'pan') { tutCur = null; tutShow(null); } };

// al entrar en una Grieta durante el tutorial: el paso vuelve a mostrarse (si se salió a medias, se retoma)
const _startNodeTut = startNode;
startNode = function (b, n, d) {
  _startNodeTut(b, n, d);
  if (!tutOn()) return;
  const s = tutS(); s.t = 0; s.k0 = rift.kills; s.bossT = 0;
};
const _goHubTut = goHub;
goHub = function () { _goHubTut(); tutShow(null); hubHint(); };

// ---------- botón resaltado ----------
const _drawControlsTut = drawControls;
drawControls = function () {
  _drawControlsTut();
  if (!tutCur || !tutCur.btn || scene !== 'rift' || state !== 'play') return;
  const b = buttonLayout()[tutCur.btn];
  if (!b) return;
  const k = (now * 1.6) % 1;
  ctx.save();
  ctx.strokeStyle = `rgba(255,224,138,${1 - k})`; ctx.lineWidth = 4 * ui;
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 6 * ui + k * 18 * ui, 0, TAU); ctx.stroke();
  ctx.restore();
};

// ---------- primera Grieta más suave mientras se aprende ----------
const _spawnEnemyTut = spawnEnemy;
spawnEnemy = function (type, x, y, o = {}) {
  const e = _spawnEnemyTut(type, x, y, o);
  if (e && tutOn() && scene === 'rift' && rift && rift.b === 0 && rift.n === 1) {
    const k = e.boss ? 0.7 : 0.6;
    e.hp = e.maxHp = Math.round(e.maxHp * k); e.dmg *= 0.6;
  }
  return e;
};
const _spawnPackTut = spawnPack;
spawnPack = function () {
  // sin avalanchas hasta saber atacar y esquivar
  if (tutOn() && rift && rift.b === 0 && rift.n === 1 && (tutS().step < 3) && enemies.filter((e) => !e.dead).length >= 6) return;
  return _spawnPackTut();
};

// ---------- en la villa: ve al Portal ----------
function hubHint() {
  if (!tutOn() || (S.rifts || 0) > 0) return;
  setTimeout(() => {
    if (state !== 'hub' || (typeof dlg !== 'undefined' && dlg)) { if (scene === 'hub') setTimeout(hubHint, 1500); return; }
    tutShow({ icon: '🌀', txt: () => 'Camina hasta el <b>Portal</b> del centro de la plaza para entrar en tu primera <b>Grieta</b>', btn: null });
    setTimeout(() => { if (state === 'hub' && tutCur && tutCur.icon === '🌀') tutShow(null); }, 9000);
  }, 1200);
}
const _buildHubTut = buildHub;
buildHub = function () { _buildHubTut(); if (state === 'hub' && !tutCur) hubHint(); };

// la pista «camina hasta el Portal» se quita en cuanto hay algo cerca con su propio aviso
(function hubHintWatch() {
  requestAnimationFrame(hubHintWatch);
  if (!tutCur || tutCur.icon !== '🌀') return;
  if (state !== 'hub' || (typeof vNear !== 'undefined' && vNear)) tutShow(null); // junto al Portal (o a un vecino) ya sale su propio aviso
})();
