/* Fendaria — Campo de entrenamiento: la primera vez que se cruza el Portal se entra aquí, no en la Grieta 1.
 * Sin reloj, sin oleadas y sin poder morir. Se aprende, paso a paso y con monstruos de prácticas:
 * moverse, atacar, esquivar, usar una habilidad, la definitiva y la poción. Al terminar se vuelve a la villa.
 * Se puede saltar con el botón «Saltar entrenamiento».
 */
'use strict';

const TRAIN = { on: false, step: 0, t: 0, walk: 0, spawned: false, dashed: false, cast: false, ult: false, drank: false, endT: 0 };
const trainNeeded = () => S && tutOn() && !(S.tut && S.tut.train);

const TRAIN_STEPS = [
  { icon: '🕹', txt: () => (isTouch ? 'Arrastra el dedo en la <b>mitad izquierda</b> de la pantalla para moverte' : 'Muévete con <b>WASD</b> o las flechas'), btn: null,
    done: () => TRAIN.walk > 260 },
  { icon: '⚔', txt: () => (isTouch ? 'Mantén pulsado <b>⚔</b> para atacar. Acaba con los tres monstruos de prácticas' : 'Mantén <b>J</b> o <b>espacio</b> para atacar. Acaba con los tres monstruos de prácticas'), btn: 'attack',
    spawn: () => trainSpawn(3, 'tofu', 190), done: () => trainAlive() === 0 },
  { icon: '»', txt: () => 'Pulsa <b>»</b> para <b>esquivar</b>: mientras ruedas, nada te hace daño', btn: 'dash',
    done: () => TRAIN.dashed },
  { icon: '✸', txt: () => 'Las <b>habilidades</b> gastan energía (<b>EN</b>), que se recarga sola. Lanza una contra el grupo', btn: 's0',
    spawn: () => { P.pa = P.maxPa; trainSpawn(5, 'tofu', 170, true); }, done: () => TRAIN.cast && trainAlive() === 0 },
  { icon: '★', txt: () => '¡Tu <b>definitiva</b> está cargada! Se llena derrotando monstruos. Púlsala', btn: 'ult',
    spawn: () => { P.ult = 100; trainSpawn(6, 'arakne', 200); }, done: () => TRAIN.ult && trainAlive() === 0 },
  { icon: '🧪', txt: () => 'Si te queda poca vida, bebe una <b>poción</b>. Pruébalo ahora', btn: 'pan',
    spawn: () => { P.hp = Math.round(P.maxHp * 0.35); P.panCd = 0; S.pan = Math.max(S.pan || 0, 1); },
    // hasta beberla, la vida se queda baja (la regeneración no debe adelantarse a la lección)
    tick: () => { if (!TRAIN.drank) P.hp = Math.min(P.hp, Math.round(P.maxHp * 0.4)); }, done: () => TRAIN.drank },
];

function trainAlive() { return enemies.filter((e) => !e.dead && e.training).length; }
function trainSpawn(n, type, dist0, group) {
  const a0 = rand(0, TAU);
  for (let i = 0; i < n; i++) {
    const a = group ? P.dir + (i - (n - 1) / 2) * 0.22 : a0 + (i / n) * TAU, d = dist0 + (group ? (i % 2) * 30 : 0);
    const e = spawnEnemy(type, clamp(P.x + Math.cos(a) * d, 60, WORLD.w - 60), clamp(P.y + Math.sin(a) * d, 60, WORLD.h - 60));
    if (!e) continue;
    e.training = true; e.hp = e.maxHp = Math.max(4, Math.round(e.maxHp * 0.35)); e.dmg = 1; e.speed *= 0.6;
  }
}

// ---------- entrar: la primera vez, el Portal lleva al entrenamiento ----------
const _startNodeTr = startNode;
startNode = function (b, n, d) {
  if (scene === 'hub' && !TRAIN.on && trainNeeded() && !window._dailyStart) {
    Object.assign(TRAIN, { on: true, step: 0, t: 0, walk: 0, spawned: false, dashed: false, cast: false, ult: false, drank: false, endT: 0, setup: false });
    return _startNodeTr(0, 1, 0);
  }
  return _startNodeTr(b, n, d);
};
function trainSetup() {
  TRAIN.setup = true;
  rift.training = true;
  for (const e of enemies) e.dead = true;
  enemies = []; projectiles = [];
  rift.spawnT = 1e9; rift.eventT = 1e9; rift.goal = 1e9;
  banner = null;
  later(0.25, () => { if (rift && rift.training) { $('worldCard').classList.remove('show'); worldCard(rift.biome, 'Campo de entrenamiento', 'Primeros pasos'); } });
  $('trainSkip').classList.add('show');
}
// ni reloj, ni oleadas, ni eventos, ni escenas de historia mientras se entrena
const _updateRiftTr = updateRift;
updateRift = function (dt) {
  if (TRAIN.on && !TRAIN.setup && rift && scene === 'rift') trainSetup();
  if (rift && rift.training) { rift.elapsed += dt; return; }
  return _updateRiftTr(dt);
};
const _playSceneTr = playScene;
playScene = function (id, c, o) { if (TRAIN.on) return; return _playSceneTr(id, c, o); };
const _runSnapshotTr = runSnapshot;
runSnapshot = function () { if (TRAIN.on) return; return _runSnapshotTr(); };
// no se puede morir
const _hurtPlayerTr = hurtPlayer;
hurtPlayer = function (dmg, sx, sy, src) { _hurtPlayerTr(dmg, sx, sy, src); if (rift && rift.training && P) P.hp = Math.max(P.hp, Math.round(P.maxHp * 0.25)); };

// ---------- pasos ----------
const _updatePlayerTr = updatePlayer;
updatePlayer = function (dt) {
  const x0 = P.x, y0 = P.y;
  _updatePlayerTr(dt);
  if (!rift || !rift.training || state !== 'play') return;
  TRAIN.t += dt;
  TRAIN.walk += Math.hypot(P.x - x0, P.y - y0);
  if (TRAIN.endT) { if (TRAIN.t - TRAIN.endT > 2.6) trainEnd(true); return; }
  const st = TRAIN_STEPS[TRAIN.step];
  if (!TRAIN.spawned) { TRAIN.spawned = true; if (st.spawn) st.spawn(); }
  tutShow(st);
  if (st.tick) st.tick();
  if (TRAIN.t > 1 && st.done()) {
    SFX.play('loot');
    TRAIN.step++; TRAIN.t = 0; TRAIN.spawned = false;
    tutShow(null);
    if (TRAIN.step >= TRAIN_STEPS.length) {
      TRAIN.endT = 0.001; TRAIN.t = 0.001;
      showBanner('¡Entrenamiento completado!', '#7cff8a', 'Vuelve a la villa y cruza el Portal para tu primera Grieta');
    } else addText(P.x, P.y - 70, '✔', '#7cff8a', 1.2);
  }
};
const _dashTr = dash;
dash = function () { const w = P.dashT; _dashTr(); if (P.dashT > 0 && w <= 0) TRAIN.dashed = true; };
const _useSkillTr = useSkill;
useSkill = function (i) { const b = P.skillCd[i]; _useSkillTr(i); if (P.skillCd[i] !== b) TRAIN.cast = true; };
const _useUltimateTr = useUltimate;
useUltimate = function () { const u = P && P.ult; _useUltimateTr(); if (P && u >= 100) TRAIN.ult = true; };
const _eatBreadTr = eatBread;
eatBread = function () { const n = S.pan; _eatBreadTr(); if (S.pan < n) TRAIN.drank = true; };

function trainEnd(completed) {
  TRAIN.on = false;
  $('trainSkip').classList.remove('show');
  tutShow(null);
  const s = tutS();
  s.train = 1;
  if ((s.step || 0) < 4) s.step = 4; // en la primera Grieta solo quedan los consejos de la barra, las bendiciones y el Guardián
  S.pan = Math.max(S.pan || 0, 3);
  persist();
  goHub();
  setTimeout(() => tutShow({ icon: '🌀', txt: () => completed ? '¡Bien hecho! Cruza el <b>Portal</b> para entrar en tu primera <b>Grieta</b>' : 'Cruza el <b>Portal</b> para entrar en tu primera <b>Grieta</b>', btn: null }), 600);
}

// ---------- saltar ----------
document.body.insertAdjacentHTML('beforeend', '<button id="trainSkip" class="train-skip" type="button">Saltar entrenamiento ›</button>');
$('trainSkip').addEventListener('click', () => { SFX.play('click'); if (TRAIN.on) trainEnd(false); });
// salir a medias (pausa → volver a la villa): el entrenamiento se repite la próxima vez que se cruce el Portal
const _goHubTr = goHub;
goHub = function () { TRAIN.on = false; $('trainSkip').classList.remove('show'); _goHubTr(); };
