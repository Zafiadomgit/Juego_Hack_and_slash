/* Fendaria — la historia cambia cómo se juega.
 *  · Tres decisiones que se recuerdan (por héroe) y dan un efecto permanente:
 *      Glaciar: perdonar a Ivo (más vida y energía) o echárselo en cara (su diario: más daño a jefes).
 *      Desierto: rechazar a Morvhal (la mirada de los Doce: crítico) o escucharlo (más ámbar, pero recibes más daño).
 *      Ciudadela: Tobías funde la llave (más daño) o se la das a los Doce (más vida y velocidad de ataque).
 *  · Al vencer al Carcelero vuelven los doce runistas: Runas de la Orden.
 *  · Morir también cuenta (estilo Hades): al volver, la villa comenta la derrota; si caes 2 o 4 veces en la misma
 *    Grieta, la villa te da ánimo (más daño y vida allí hasta que la superes). Morvhal se burla al volver a entrar.
 *  · Cada Súper Jefe liberado se despide.
 *  · La tarjeta de la historia en la villa muestra los efectos activos.
 */
'use strict';

function sagaState() {
  const st = storyState();
  if (!st.flags) st.flags = {};
  if (!st.deaths) st.deaths = {};
  if (!st.mercy) st.mercy = {};
  return st;
}
function sagaFlag(k) { return S && S.story && S.story.flags ? S.story.flags[k] : undefined; }

SPEAKERS.runista = { name: 'Elden, runista de la Orden', color: '#9fd8ff', aura: '150,210,255' };

// ---------- efectos de la historia ----------
const SAGA_FX = [
  { flag: 'ivo', on: () => sagaFlag('ivo') === 'trust', name: 'Confianza de Ivo', desc: '+10% de vida y de energía' },
  { flag: 'ivo', on: () => sagaFlag('ivo') === 'doubt', name: 'Diario de la Orden', desc: '+15% de daño a Guardianes y Súper Jefes' },
  { flag: 'morvhal', on: () => sagaFlag('morvhal') === 'refuse', name: 'Mirada de los Doce', desc: '+5% de golpe crítico' },
  { flag: 'morvhal', on: () => sagaFlag('morvhal') === 'listen', name: 'Susurro del Cerrajero', desc: '+20% de ámbar · recibes un 10% más de daño' },
  { flag: 'key', on: () => sagaFlag('key') === 'forge', name: 'Filo de la Llave', desc: '+12% de daño' },
  { flag: 'key', on: () => sagaFlag('key') === 'gods', name: 'Bendición de los Doce', desc: '+12% de vida y +10% de velocidad de ataque' },
  { flag: 'runas', on: () => superDone(BIOMES.length - 1), name: 'Runas de la Orden', desc: '+5% de daño y de vida' },
];
const riftKey = () => (rift && !rift.training && !rift.isDungeon && !rift.daily ? rift.b + ':' + rift.n : null);
const mercyLvl = (key) => { const n = (S && S.story && S.story.deaths && S.story.deaths[key]) || 0; return n >= 4 ? 2 : n >= 2 ? 1 : 0; };
{
  const _derivedSaga = derived;
  derived = function () {
    const d = _derivedSaga();
    if (!S || !S.story) return d;
    const f = (k) => sagaFlag(k);
    if (f('ivo') === 'trust') { d.maxHp = Math.round(d.maxHp * 1.1); d.paRegen *= 1.1; }
    if (f('morvhal') === 'refuse') d.crit = Math.min(0.75, d.crit + 0.05);
    if (f('morvhal') === 'listen') d.kamaMul *= 1.2;
    if (f('key') === 'forge') d.dmgMul *= 1.12;
    if (f('key') === 'gods') { d.maxHp = Math.round(d.maxHp * 1.12); d.atkSpeed *= 1.1; }
    if (superDone(BIOMES.length - 1)) { d.dmgMul *= 1.05; d.maxHp = Math.round(d.maxHp * 1.05); }
    const key = riftKey(), m = key ? mercyLvl(key) : 0;
    if (m) { d.dmgMul *= 1 + 0.1 * m; d.maxHp = Math.round(d.maxHp * (1 + 0.1 * m)); }
    return d;
  };
}
const _damageEnemySaga = damageEnemy;
damageEnemy = function (e, base, o) {
  if (e && (e.boss || e.superDef) && sagaFlag('ivo') === 'doubt') base *= 1.15;
  return _damageEnemySaga(e, base, o);
};
const _hurtPlayerSaga = hurtPlayer;
hurtPlayer = function (dmg, sx, sy, src) {
  if (sagaFlag('morvhal') === 'listen') dmg *= 1.1;
  return _hurtPlayerSaga(dmg, sx, sy, src);
};

// carteles de capítulo en fila (cada uno dura ~4 s)
function sagaCards(list, then) {
  if (!list.length) { if (then) then(); return; }
  const [t, s] = list[0];
  showStoryCard(t, s);
  setTimeout(() => sagaCards(list.slice(1), then), 4300);
}

// ---------- decisiones ----------
const SAGA_CHOICES = {
  win2: {
    flag: 'ivo',
    options: [
      { val: 'trust', label: 'Te perdono, Ivo. Seguimos juntos.', lines: [
        ['hero', 'Cargaste con eso trescientos años tú solo. Ya no tendrás que hacerlo.'],
        ['ivo', 'Yo… gracias. Toma mi mejor elixir: lo guardaba para el fin del mundo. Parece que ha llegado.'],
        ['ivo', 'El cuarto Sello está en el Desierto de Ámbar. Su guardián es un Fénix: si renace corrompido, renacerá así para siempre.'],
      ] },
      { val: 'doubt', label: 'Me mentiste. ¿Qué más me ocultas?', lines: [
        ['hero', 'Me mandaste a ciegas contra el hombre al que encerraste. ¿Qué más me ocultas?'],
        ['ivo', 'Mucho. Y te lo debo todo. Aquí tienes el diario de la Orden: cada Sello, cada guardián, cada punto débil.'],
        ['tobias', 'El diario no te hará menos culpable, Ivo. Pero a {hero} lo hará más letal. Me vale.'],
        ['ivo', 'El cuarto Sello está en el Desierto de Ámbar. Su guardián es un Fénix: si renace corrompido, renacerá así para siempre.'],
      ] },
    ],
  },
  enter3: {
    flag: 'morvhal',
    options: [
      { val: 'refuse', label: 'Nunca.', lines: [
        ['hero', 'Ivo me contó la verdad. Tú solo me ofreces otra cerradura.'],
        ['morvhal', 'Entonces arde con mi Fénix.'],
        ['god_escudo', 'Aldemar lo ha visto, {hero}. Los Doce no olvidan a quien le dice que no al Cerrajero.'],
      ] },
      { val: 'listen', label: '¿Qué es la Fendaria Antigua?', lines: [
        ['morvhal', 'La tierra que había antes de las Grietas. Ciudades, bosques, gente. La Orden la selló con ellos dentro.'],
        ['morvhal', 'Yo era uno de los doce. Me negué a cantar. Por eso me encerraron a mí también.'],
        ['hero', 'Aunque fuera verdad, tus monstruos están matando a gente de este lado.'],
        ['morvhal', 'Escucha un poco más, lucecita. El ámbar de mis Grietas brillará para ti… y mis criaturas también.'],
      ] },
    ],
  },
  win7: {
    flag: 'key',
    options: [
      { val: 'forge', label: 'Fúndela, Tobías: un arma para la villa.', lines: [
        ['tobias', 'Una forja más grande, eso necesito. ¡Ja! Con esto ningún monstruo volverá a cruzar el Portal.'],
        ['ivo', 'La llave que lo abría todo, convertida en algo que protege. A Morvhal le habría dolido. O quizá le habría gustado.'],
      ] },
      { val: 'gods', label: 'Que la guarden los Doce, para abrir las puertas algún día.', lines: [
        ['god_tiempo', 'La guardaremos, {hero}. Y el día que la Fendaria Antigua esté lista, abriremos con ella. Como él quería, pero bien.'],
        ['ivo', 'Algún día, Nereth. Algún día.'],
      ] },
    ],
  },
};
const _playSceneSaga = playScene;
playScene = function (id, ctx, o = {}) {
  const C = SAGA_CHOICES[id];
  if (!C || !SCENES[id] || storyState().seen[id]) return _playSceneSaga(id, ctx, o);
  const after = o.onEnd;
  let picked = false;
  const pick = (op) => {
    if (picked) return;
    picked = true;
    sagaState().flags[C.flag] = op.val;
    persist(); if (P) recalc();
    playDialog(op.lines, {
      ctx,
      onEnd: () => {
        const got = SAGA_FX.filter((x) => (x.flag === C.flag || (x.flag === 'runas' && id === 'win7')) && x.on());
        sagaCards(got.map((x) => [x.name, x.desc]), () => { if (state === 'hub') buildHub(); if (after) after(); });
      },
    });
  };
  return _playSceneSaga(id, ctx, Object.assign({}, o, {
    onEnd: () => pick(C.options[0]), // si se cierra el diálogo sin elegir, cuenta la primera opción
    choices: C.options.map((op) => ({ label: op.label, fn: () => pick(op) })),
  }));
};

// ---------- morir también cuenta ----------
const DEATH_TALK = {
  first: [
    ['ivo', 'Te trajeron los aldeanos, sin sentido junto al Portal. Morir allí dentro no es el final: el Portal devuelve a quien lleva la luz de Candela.'],
    ['ivo', 'Pero cada vez le cuesta un poco más. Descansa, cambia lo que haga falta y vuelve.'],
  ],
  generic: [
    ['brunilda', 'Vuelves sin botín y con la ropa chamuscada. Mal negocio, cielo. Pásate por mi puesto.'],
    ['tobias', 'Esa abolladura en la armadura es de Grieta. Tráemela y te la dejo como nueva.'],
    ['ivo', 'Morir enseña lo que la victoria esconde. ¿Qué te tumbó? Piénsalo antes de volver.'],
    ['brunilda', 'Si sigues muriendo voy a tener que subirte los precios. Por el riesgo. El mío, no el tuyo.'],
    ['ivo', 'Los dioses ofrecen bendiciones distintas cada vez. Si una combinación no funciona, prueba otra.'],
    ['tobias', 'Un arma refinada aguanta lo que una nueva no. La forja está abierta.'],
    ['ivo', 'El Cerrajero se reirá esta noche. Que se ría: mañana volverás.'],
    ['brunilda', 'Te he guardado un caldo. No es gratis, pero está caliente.'],
  ],
  boss: [
    ['ivo', 'Un Guardián no es un monstruo más: cuando veas el «!» rojo, apártate. Y si rompes su barra de Ruptura, quedará aturdido.'],
    ['tobias', 'Contra un jefe, el arma importa más que el valor. Refínala antes de volver a intentarlo.'],
    ['ivo', 'Los jefes cambian al llegar a la mitad de su vida. Guarda la definitiva para ese momento.'],
  ],
  mercy: [
    ['tobias', 'Otra vez esa Grieta, ¿eh? Dame el arma. Te la afilo gratis, y Brunilda te mete algo de comer en la bolsa.'],
    ['brunilda', 'Gratis no. …Bueno, esta vez sí. Que no se entere nadie.'],
  ],
};
const TAUNTS = [
  'Otra vez tú. Me encanta: cada vez que caes, mis cerraduras ceden un poco.',
  '¿Has vuelto? La luz de Candela es terca. Igual que Ivo.',
  'Te vi caer. Desde aquí se ve todo.',
  'Mis criaturas recuerdan tu olor. Hoy te esperan.',
  'Cada vez que mueres, el Portal tarda más en traerte. ¿No lo has notado?',
];
const _playerDiedSaga = playerDied;
playerDied = function () {
  const was = state, key = riftKey(), boss = !!(bossRef && !bossRef.dead);
  _playerDiedSaga();
  if (was !== 'play' || state !== 'dead' || !key) return; // revivió (Desafío a la Muerte) o no cuenta
  const st = sagaState();
  st.deaths[key] = (st.deaths[key] || 0) + 1;
  st.deathsTotal = (st.deathsTotal || 0) + 1;
  st.pendingDeath = { key, boss };
  st.taunt = 1;
  persist();
};
function deathTalk(tries = 0) {
  const st = S && S.story;
  if (!st || !st.pendingDeath) return;
  if (dlg || state !== 'hub') { if (tries < 12) setTimeout(() => deathTalk(tries + 1), 700); return; }
  const { key, boss } = st.pendingDeath;
  st.pendingDeath = null;
  const m = mercyLvl(key);
  if (!st.seen.firstDeath) {
    st.seen.firstDeath = 1; persist();
    playDialog(DEATH_TALK.first);
  } else if (m > (st.mercy[key] || 0)) {
    st.mercy[key] = m; persist();
    playDialog(DEATH_TALK.mercy, { onEnd: () => sagaCards([['Ánimo de la villa', `+${m * 10}% de daño y vida en esa Grieta hasta que la superes`]]) });
  } else {
    const pool = boss ? DEATH_TALK.boss : DEATH_TALK.generic;
    let i = randi(0, pool.length - 1);
    if (i === st.lastTalk && pool.length > 1) i = (i + 1) % pool.length;
    st.lastTalk = i; persist();
    playDialog([pool[i]]);
  }
}
const _goHubSaga = goHub;
goHub = function () { _goHubSaga(); setTimeout(deathTalk, 1100); };

const _startNodeSaga = startNode;
startNode = function (b, n, d) {
  _startNodeSaga(b, n, d);
  if (P) recalc(); // el ánimo de la villa depende de la Grieta
  const st = S && S.story;
  if (!st || !st.taunt || !rift || rift.training || rift.isDungeon) return;
  st.taunt = 0;
  later(4.2, () => {
    if (!rift || state !== 'play' || dlg) return; // si hay escena de historia, la burla sobra
    playDialog([[st.seen.win0 ? 'morvhal' : 'voz', pick(TAUNTS)]]);
  });
};

// ---------- jefes: superar la Grieta borra el ánimo; cada Súper Jefe liberado se despide ----------
const FAREWELL = [
  'El fuego… se apaga. Huelo hojas nuevas bajo la ceniza. Gracias, pequeña luz.',
  'Mis niños… por fin duermen tranquilos. El agua vuelve a estar limpia.',
  'El frío ya no quema. Hacía trescientos años que no sentía el sol.',
  'Esta vez… renaceré como fui. Gracias por romper la rueda.',
  '{hero}… gracias. Dile a Ivo que su maestro está orgulloso de él.',
  'Dile a mi hermano… que ya no tengo frío. Que la barca llegó a puerto.',
  'El bosque vuelve a marchitarse… y es precioso. Lo había olvidado.',
];
const _killEnemySaga = killEnemy;
killEnemy = function (e) {
  const key = riftKey(), b = rift && rift.b;
  const r = _killEnemySaga(e);
  if (!e.boss || !key || !S || !S.story) return r;
  const st = sagaState();
  if (st.deaths[key]) { delete st.deaths[key]; delete st.mercy[key]; }
  if (rift.isSuper && FAREWELL[b] && !st.seen['free' + b]) {
    st.seen['free' + b] = 1;
    later(3.2, () => { if (rift && state === 'play') playDialog([['boss', FAREWELL[b]]], { ctx: { b } }); });
  }
  persist();
  return r;
};

// ---------- crónica: la tarjeta de la historia muestra los efectos activos ----------
const _buildHubSaga = buildHub;
buildHub = function () {
  _buildHubSaga();
  const el = document.querySelector('#hubChar .hubStory');
  if (!el || !S) return;
  const fx = SAGA_FX.filter((x) => x.on()).map((x) => `✦ <b>${x.name}</b>: ${x.desc}`);
  const mercy = S.story && S.story.deaths ? Object.keys(S.story.deaths).filter((k) => mercyLvl(k)).length : 0;
  if (mercy) fx.push(`✦ <b>Ánimo de la villa</b>: más daño y vida en ${mercy} ${mercy === 1 ? 'Grieta' : 'Grietas'} donde caíste`);
  if (!fx.length) return;
  el.insertAdjacentHTML('beforeend', `<small class="hs-fx">${fx.join('<br>')}</small>`);
  el.querySelector('b').insertAdjacentHTML('beforeend', ` <i class="hs-n">✦${fx.length}</i>`);
};
