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

SPEAKERS.runista = { name: "Elden, runecaster of the Order", color: '#9fd8ff', aura: '150,210,255' };

// ---------- efectos de la historia ----------
const SAGA_FX = [
  { flag: 'ivo', on: () => sagaFlag('ivo') === 'trust', name: "Ivo's Trust", desc: "+10% health and energy" },
  { flag: 'ivo', on: () => sagaFlag('ivo') === 'doubt', name: "Journal of the Order", desc: "+15% damage to Guardians and Super Bosses" },
  { flag: 'morvhal', on: () => sagaFlag('morvhal') === 'refuse', name: "Gaze of the Twelve", desc: "+5% critical chance" },
  { flag: 'morvhal', on: () => sagaFlag('morvhal') === 'listen', name: "Whisper of the Locksmith", desc: "+20% amber · you take 10% more damage" },
  { flag: 'key', on: () => sagaFlag('key') === 'forge', name: "Edge of the Key", desc: "+12% damage" },
  { flag: 'key', on: () => sagaFlag('key') === 'gods', name: "Blessing of the Twelve", desc: "+12% health and +10% attack speed" },
  { flag: 'runas', on: () => superDone(BIOMES.length - 1), name: "Runes of the Order", desc: "+5% damage and health" },
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
      { val: 'trust', label: "I forgive you, Ivo. We go on together.", lines: [
        ['hero', "You carried that alone for three hundred years. You won't have to anymore."],
        ['ivo', "I… thank you. Take my best elixir: I was saving it for the end of the world. Looks like it's here."],
        ['ivo', "The fourth Seal is in the Amber Desert. Its guardian is a Phoenix: if it is reborn corrupted, it will be reborn that way forever."],
      ] },
      { val: 'doubt', label: "You lied to me. What else are you hiding?", lines: [
        ['hero', "You sent me in blind against the man you locked away. What else are you hiding?"],
        ['ivo', "A lot. And I owe you everything. Here is the Order's journal: every Seal, every guardian, every weak spot."],
        ['tobias', "The journal won't make you any less guilty, Ivo. But it will make {hero} deadlier. Good enough for me."],
        ['ivo', "The fourth Seal is in the Amber Desert. Its guardian is a Phoenix: if it is reborn corrupted, it will be reborn that way forever."],
      ] },
    ],
  },
  enter3: {
    flag: 'morvhal',
    options: [
      { val: 'refuse', label: "Never.", lines: [
        ['hero', "Ivo told me the truth. All you offer me is another lock."],
        ['morvhal', "Then burn with my Phoenix."],
        ['god_escudo', "Aldemar has seen it, {hero}. The Twelve do not forget who says no to the Locksmith."],
      ] },
      { val: 'listen', label: "What is Ancient Fendaria?", lines: [
        ['morvhal', "The land that existed before the Rifts. Cities, forests, people. The Order sealed it with them inside."],
        ['morvhal', "I was one of the twelve. I refused to chant. That's why they locked me up too."],
        ['hero', "Even if that's true, your monsters are killing people on this side."],
        ['morvhal', "Listen a little longer, little light. The amber of my Rifts will shine for you… and so will my creatures."],
      ] },
    ],
  },
  win7: {
    flag: 'key',
    options: [
      { val: 'forge', label: "Melt it down, Tobias: a weapon for the village.", lines: [
        ['tobias', "A bigger forge, that's what I need. Ha! With this, no monster will ever cross the Portal again."],
        ['ivo', "The key that opened everything, turned into something that protects. It would have hurt Morvhal. Or maybe he'd have liked it."],
      ] },
      { val: 'gods', label: "Let the Twelve keep it, to open the doors one day.", lines: [
        ['god_tiempo', "We will keep it, {hero}. And the day Ancient Fendaria is ready, we will open it with this. As he wanted, but done right."],
        ['ivo', "Someday, Nereth. Someday."],
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
    ['ivo', "The villagers brought you back, unconscious by the Portal. Dying in there is not the end: the Portal returns whoever carries the light of Candela."],
    ['ivo', "But each time it costs it a little more. Rest, change whatever you need to, and go back."],
  ],
  generic: [
    ['brunilda', "Back with no loot and your clothes singed. Bad business, dear. Stop by my stall."],
    ['tobias', "That dent in your armour is from a Rift. Bring it to me and I'll make it good as new."],
    ['ivo', "Dying teaches what victory hides. What knocked you down? Think about it before you go back."],
    ['brunilda', "If you keep dying I'll have to raise your prices. For the risk. Mine, not yours."],
    ['ivo', "The gods offer different blessings every time. If one combination doesn't work, try another."],
    ['tobias', "A refined weapon holds up where a new one won't. The forge is open."],
    ['ivo', "The Locksmith will laugh tonight. Let him laugh: tomorrow you'll be back."],
    ['brunilda', "I saved you some broth. It's not free, but it's hot."],
  ],
  boss: [
    ['ivo', "A Guardian is not just another monster: when you see the red «!», get out of the way. And if you break its Break bar, it will be stunned."],
    ['tobias', "Against a boss, your weapon matters more than your courage. Refine it before you try again."],
    ['ivo', "Bosses change when they reach half their health. Save your ultimate for that moment."],
  ],
  mercy: [
    ['tobias', "That Rift again, eh? Give me your weapon. I'll sharpen it for free, and Brunilda will slip some food into your bag."],
    ['brunilda', "Not for free. …Well, this time, yes. Don't tell anyone."],
  ],
};
const TAUNTS = [
  "You again. I love it: every time you fall, my locks give a little more.",
  "Back already? The light of Candela is stubborn. Just like Ivo.",
  "I watched you fall. You can see everything from here.",
  "My creatures remember your scent. Today they're waiting for you.",
  "Every time you die, the Portal takes longer to bring you back. Haven't you noticed?",
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
    playDialog(DEATH_TALK.mercy, { onEnd: () => sagaCards([["Village's Courage", `+${m * 10}% damage and health in that Rift until you clear it`]]) });
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
  "The fire… is going out. I smell new leaves under the ash. Thank you, little light.",
  "My children… are finally sleeping peacefully. The water is clean again.",
  "The cold no longer burns. I hadn't felt the sun in three hundred years.",
  "This time… I'll be reborn as I was. Thank you for breaking the wheel.",
  "{hero}… thank you. Tell Ivo his master is proud of him.",
  "Tell my brother… that I'm not cold anymore. That the boat made it to harbour.",
  "The forest is wilting again… and it's beautiful. I had forgotten.",
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
  if (mercy) fx.push(`✦ <b>Village's Courage</b>: more damage and health in ${mercy} ${mercy === 1 ? 'Rift' : 'Rifts'} where you fell`);
  if (!fx.length) return;
  el.insertAdjacentHTML('beforeend', `<small class="hs-fx">${fx.join('<br>')}</small>`);
  el.querySelector('b').insertAdjacentHTML('beforeend', ` <i class="hs-n">✦${fx.length}</i>`);
};

// ---------- partidas que ya pasaron esas escenas antes de las decisiones: Ivo las ofrece en la villa ----------
const SAGA_RETRO = [
  { scene: 'win2', ask: ['ivo', "I never asked what you thought about what I told you on the Glacier, {hero}. Do you forgive me?"],
    reply: { trust: ['ivo', "Thank you, {hero}. Truly."], doubt: ['ivo', "I understand. Take the Order's journal: it will serve you better than my apologies."] } },
  { scene: 'enter3', ask: ['ivo', "In the Desert, Morvhal told you about Ancient Fendaria. What did you answer him?"],
    reply: { refuse: ['ivo', "Well said. The Twelve will have heard it."], listen: ['ivo', "You listened… Be careful: his words weigh heavy, and so do his creatures."] } },
  { scene: 'win7', ask: ['ivo', "Tobias is still staring at Morvhal's broken key on his anvil. What do we do with it?"],
    reply: { forge: ['tobias', "At last! Into the forge with it."], gods: ['ivo', "The Twelve will keep it. Someday we'll open those doors."] } },
];
const _villageInteractSaga = villageInteract;
villageInteract = function (what) {
  const st = S && S.story;
  const R = st && what && what.id === 'alchemist' && state === 'hub' && !dlg && SAGA_RETRO.find((r) => st.seen[r.scene] && !sagaFlag(SAGA_CHOICES[r.scene].flag));
  if (!R) return _villageInteractSaga(what);
  const C = SAGA_CHOICES[R.scene];
  vHero.target = null; vHero.pending = null;
  let picked = false;
  const pick = (op) => {
    if (picked) return;
    picked = true;
    sagaState().flags[C.flag] = op.val; persist(); if (P) recalc();
    playDialog([R.reply[op.val]], { onEnd: () => {
      const got = SAGA_FX.filter((x) => x.flag === C.flag && x.on());
      sagaCards(got.map((x) => [x.name, x.desc]), () => { if (state === 'hub') buildHub(); });
    } });
  };
  playDialog([R.ask], { choices: C.options.map((op) => ({ label: op.label, fn: () => pick(op) })), onEnd: () => pick(C.options[0]) });
};
