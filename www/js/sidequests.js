/* Fendaria — misiones secundarias de los vecinos de Villa Candela.
 * Cada aldeano que pasea por la plaza tiene una cadena de 3 encargos que se abren según el capítulo de la trama.
 * Un «!» sobre su cabeza indica un encargo nuevo y un «?» que ya lo has cumplido. El progreso usa los mismos
 * eventos que las misiones diarias (trackDaily) y puede exigir un mundo concreto (b).
 */
'use strict';

// Los aldeanos de village.js (VILLAGERS) en el mismo orden
const NEIGHBORS = [
  { id: 'rufo', name: 'Rufo el granjero', color: '#e8c070' },
  { id: 'matilde', name: 'Abuela Matilde', color: '#ff9a8a' },
  { id: 'bertin', name: 'Sargento Bertín', color: '#a8c0d8' },
  { id: 'pip', name: 'Pip', color: '#9be070' },
];
Object.assign(SPEAKERS, Object.fromEntries(NEIGHBORS.map((n) => [n.id, { name: n.name, color: n.color }])));

const SIDE_EV = {
  kill: (g, b) => `Derrota ${g} monstruos${b != null ? ' en ' + BIOMES[b].name : ''}`,
  elite: (g) => `Derrota ${g} élites`,
  boss: (g, b) => `Vence a ${g} Guardián${g > 1 ? 'es' : ''}${b != null ? ' en ' + BIOMES[b].name : ''}`,
  rift: (g, b) => `Cierra ${g} Grieta${g > 1 ? 's' : ''}${b != null ? ' en ' + BIOMES[b].name : ''}`,
  hard: (g) => `Cierra ${g} Grieta${g > 1 ? 's' : ''} en Medio o Difícil`,
  amber: (g) => `Recoge ${g} de ámbar`,
  event: (g) => `Completa ${g} evento${g > 1 ? 's' : ''} de Grieta`,
  ult: (g) => `Usa tu definitiva ${g} veces`,
};

// who: índice en NEIGHBORS · ch: capítulo mínimo · req: encargo previo
// reward: { amber, frag, seals, elixir, item: calidad (0-3) }
const SIDE_QUESTS = [
  { id: 'rufo1', who: 0, ch: 0, title: 'Ovejas negras', ev: 'kill', b: 0, goal: 40, reward: { amber: 250, elixir: 1 },
    ask: [['rufo', '¡Eh, {hero}! Desde que se abrió la Grieta, mis ovejas vuelven del pasto negras de ceniza… y con colmillos.'],
      ['rufo', 'Algo las cambia al otro lado. Limpia el Bosque Ceniciento de bichos y a lo mejor dejan de cruzar.']],
    done: [['rufo', '¡Ni una oveja con colmillos esta semana! Bueno, una. Pero era mi suegra disfrazada.'], ['rufo', 'Toma, es todo lo que he ahorrado. Y un frasquito que me dio Ivo «para emergencias».']] },
  { id: 'rufo2', who: 0, ch: 1, req: 'rufo1', title: 'Semillas de la ciénaga', ev: 'elite', goal: 8, reward: { amber: 300, item: 1 },
    ask: [['rufo', 'Planté unas semillas que encontré junto al Portal. Han salido… cosas. Cosas grandes, con armadura.'],
      ['rufo', 'Mi abuelo decía que las bestias fuertes de las Grietas guardan las semillas buenas. Tráeme las de 8 élites.']],
    done: [['rufo', '¡Ocho! Las he plantado lejos de la casa, por si acaso.'], ['rufo', 'Esto lo encontré enterrado en el huerto. A mí no me sirve para cavar, a ti seguro que sí.']] },
  { id: 'rufo3', who: 0, ch: 3, req: 'rufo2', title: 'Cosecha de ámbar', ev: 'amber', goal: 2000, reward: { seals: 10, item: 2 },
    ask: [['rufo', 'Dicen que en el Desierto el ámbar sale de la arena como patatas. ¡Patatas de luz, {hero}!'],
      ['rufo', 'No te pido que me lo des, ¿eh? Solo quiero saber que es verdad. Recoge 2.000 y vuelve a contármelo.']],
    done: [['rufo', '¡Dos mil! Entonces es verdad… Me retiro de las patatas.'], ['rufo', 'Te guardaba esto por si volvías con buenas noticias. Lo forjó Tobías con el arado de mi padre.']] },

  { id: 'mati1', who: 1, ch: 0, title: 'Hierbas para el caldo', ev: 'event', goal: 2, reward: { amber: 150, elixir: 2 },
    ask: [['matilde', 'Ay, criatura, qué delgado te veo. Con lo que peleas ahí dentro…'],
      ['matilde', 'Si encuentras cofres o altares en las Grietas, mira si hay hierbas raras. Haré un caldo que levanta muertos. Casi literalmente.']],
    done: [['matilde', '¡Estas hierbas brillan! Eso es buena señal. Creo.'], ['matilde', 'Toma, dos frascos de mi caldo. No preguntes qué lleva.']] },
  { id: 'mati2', who: 1, ch: 2, req: 'mati1', title: 'Mantas para el invierno', ev: 'rift', b: 2, goal: 3, reward: { amber: 400, frag: 20 },
    ask: [['matilde', 'Desde que se abrió la Grieta del Glaciar, las noches en la villa son de escarcha. Los niños tiritan.'],
      ['matilde', 'Cierra tres Grietas del Glaciar Rúnico, a ver si el frío deja de colarse. Yo tejeré mientras tanto.']],
    done: [['matilde', 'Anoche Pip durmió destapado. ¡Ha funcionado!'], ['matilde', 'Tobías me dio estos fragmentos por una bufanda. Mejor para ti, que yo no sé qué hacer con ellos.']] },
  { id: 'mati3', who: 1, ch: 4, req: 'mati2', title: 'La receta de la abuela', ev: 'boss', goal: 3, reward: { seals: 15, item: 3 },
    ask: [['matilde', 'Mi abuela decía que su receta secreta necesitaba «el valor de tres guardianes». Yo creía que era una forma de hablar.'],
      ['matilde', 'Ahora que te conozco, ya no estoy tan segura. Vence a tres Guardianes y probamos.']],
    done: [['matilde', 'No era una forma de hablar. El caldo ha salido dorado.'], ['matilde', 'Y esto era de mi marido. Fue héroe, ¿sabes? Como tú. Úsala bien.']] },

  { id: 'bert1', who: 2, ch: 0, title: 'Ronda nocturna', ev: 'elite', goal: 6, reward: { amber: 300, frag: 10 },
    ask: [['bertin', 'Sargento Bertín, de la guardia de Villa Candela. Bueno, soy toda la guardia de Villa Candela.'],
      ['bertin', 'Por las noches cruzan bestias grandes, de las que llevan armadura. Seis élites menos y podré dormir.']],
    done: [['bertin', 'Ni un rugido en toda la noche. Dormí ocho horas. ¡Ocho!'], ['bertin', 'Paga de la guardia. No es mucho, pero es honrado.']] },
  { id: 'bert2', who: 2, ch: 1, req: 'bert1', title: 'Los hijos de la ciénaga', ev: 'kill', b: 1, goal: 80, reward: { item: 2 },
    ask: [['bertin', 'Las arañas de la Ciénaga ponen huevos en el pozo. En el POZO, {hero}.'],
      ['bertin', 'Ve a la Ciénaga Sombría y acaba con ochenta de esas criaturas. Yo vigilo el pozo con una antorcha.']],
    done: [['bertin', 'El agua del pozo vuelve a saber a agua. Y no a patas.'], ['bertin', 'Me la dio mi capitán cuando me nombró sargento. Contigo hará más bien que colgada en mi pared.']] },
  { id: 'bert3', who: 2, ch: 3, req: 'bert2', title: 'Guardia de honor', ev: 'hard', goal: 2, reward: { seals: 20, frag: 30 },
    ask: [['bertin', 'La villa quiere nombrarte Guardia de Honor. Pero el reglamento exige una prueba.'],
      ['bertin', 'Cierra dos Grietas en Medio o Difícil. El reglamento lo escribí yo, así que no te quejes.']],
    done: [['bertin', 'Por la autoridad que me otorgo a mí mismo… ¡{hero}, Guardia de Honor de Villa Candela!'], ['bertin', 'Viene con sellos y fragmentos. Y con mi respeto, que vale más.']] },

  { id: 'pip1', who: 3, ch: 0, title: '¡Quiero verlo!', ev: 'ult', goal: 3, reward: { amber: 100, seals: 5 },
    ask: [['pip', '¡Hala! ¿Tú eres {hero}? ¿Es verdad que puedes hacer un ataque ENORME que brilla?'],
      ['pip', '¡Úsalo tres veces y me lo cuentas! Toma, te pago por adelantado… bueno, te pago luego.']],
    done: [['pip', '¿Tres veces? ¿Y brillaba mucho? ¡Lo sabía!'], ['pip', 'Aquí tienes mis ahorros. Y unos sellos que encontré en el tablón. No se lo digas a Bertín.']] },
  { id: 'pip2', who: 3, ch: 2, req: 'pip1', title: 'El tesoro del Glaciar', ev: 'event', goal: 3, reward: { amber: 500, elixir: 1 },
    ask: [['pip', 'He hecho un mapa del tesoro. Lo dibujé yo, pero seguro que es verdad.'],
      ['pip', 'Dice que en las Grietas hay cofres escondidos y altares mágicos. ¡Encuentra tres y seremos ricos!']],
    done: [['pip', '¡TRES! ¡Mi mapa funciona! Voy a dibujar otro.'], ['pip', 'La mitad del tesoro es tuya. Es lo justo entre piratas.']] },
  { id: 'pip3', who: 3, ch: 4, req: 'pip2', title: 'Pip, el héroe', ev: 'boss', b: 4, goal: 1, reward: { seals: 25, item: 3 },
    ask: [['pip', 'Cuando sea mayor quiero ser como tú. Pero mi madre dice que el Abismo da miedo.'],
      ['pip', 'Vence a un Guardián en el Abismo y así le demuestro que se puede volver. ¡Porfa!']],
    done: [['pip', '¡Has vuelto del Abismo! Mi madre ya no tiene excusa.'], ['pip', 'Esto me lo dio Ivo «para cuando sea un héroe». Creo que tú lo eres más.']] },
];

const SIDE_ITEM_Q = ['Común', 'Rara', 'Épica', 'Legendaria'];

function sideState() {
  if (!S.side) S.side = {};
  return S.side;
}
const sideQuest = (id) => SIDE_QUESTS.find((q) => q.id === id);
const sideText = (q) => SIDE_EV[q.ev](q.goal, q.b);
// encargo que el vecino tiene ahora: { q, st: 'new' | 'active' | 'ready' } o null
function neighborQuest(who) {
  const st = sideState(), ch = storyChapter();
  for (const q of SIDE_QUESTS) {
    if (q.who !== who) continue;
    const s = st[q.id];
    if (s && s.claimed) continue;
    if (s) return { q, st: s.prog >= q.goal ? 'ready' : 'active' };
    if (q.ch <= ch && (!q.req || (st[q.req] && st[q.req].claimed))) return { q, st: 'new' };
    return null;
  }
  return null;
}
function rewardText(r) {
  const p = [];
  if (r.amber) p.push(r.amber + ' ámbar');
  if (r.frag) p.push(r.frag + ' Fragmentos');
  if (r.seals) p.push(r.seals + ' Sellos de Gesta');
  if (r.elixir) p.push(r.elixir > 1 ? r.elixir + ' elixires' : 'un elixir');
  if (r.item != null) p.push('una pieza ' + SIDE_ITEM_Q[r.item]);
  return p.join(' · ');
}

// progreso: los mismos eventos que las misiones diarias
const _trackDaily = trackDaily;
trackDaily = function (id, n = 1) {
  _trackDaily(id, n);
  if (!S) return;
  const st = sideState(), b = rift && !rift.isDungeon ? rift.b : -1;
  for (const q of SIDE_QUESTS) {
    const s = st[q.id];
    if (!s || s.claimed || q.ev !== id || s.prog >= q.goal || (q.b != null && q.b !== b)) continue;
    s.prog = Math.min(q.goal, s.prog + n);
    if (s.prog >= q.goal && state === 'play') { subBanner = { text: `✔ Encargo de ${NEIGHBORS[q.who].name}: ${q.title}`, t: 3, max: 3 }; SFX.play('loot'); }
  }
};

function giveSideReward(q) {
  const r = q.reward;
  if (r.item != null && S.bag.length >= bagMax()) return false;
  if (r.amber) S.kamas += r.amber;
  if (r.frag) S.frag = frags() + r.frag;
  if (r.seals) gainSeals(r.seals);
  for (let i = 0; i < (r.elixir || 0); i++) { const k = pick(Object.keys(ELIXIRS)); S.boosts[k] = (S.boosts[k] || 0) + 1; }
  if (r.item != null) S.bag.push(makeItem(S.cls, Math.max(1, (highestLevel() - 1) * 2 + 3 + DIFFS[Math.min(2, r.item)].lvl), r.item));
  return true;
}

function talkNeighbor(who) {
  const nq = neighborQuest(who), N = NEIGHBORS[who];
  if (!nq) { playDialog([[N.id, pick(['¡Buen día, {hero}!', 'Gracias por cuidar de la villa.', 'Si necesito algo, ya te avisaré.'])]]); return; }
  const { q } = nq, st = sideState();
  if (nq.st === 'new') {
    playDialog(q.ask, {
      choices: [
        { label: '✔ Aceptar encargo', fn: () => { st[q.id] = { prog: 0 }; persist(); buildHub(); sideToast(`📜 Nuevo encargo: ${q.title}`, sideText(q)); } },
        { label: 'Ahora no', fn: null },
      ],
    });
  } else if (nq.st === 'active') {
    playDialog([[N.id, `¿Qué tal va lo mío? Recuerda: ${sideText(q).toLowerCase()}. Llevas ${st[q.id].prog} de ${q.goal}.`]]);
  } else {
    playDialog(q.done, {
      onEnd: () => {
        if (!giveSideReward(q)) { sideToast('🎒 Bolsa llena', 'Haz sitio en la bolsa y vuelve a hablar con ' + N.name, false); return; }
        st[q.id].claimed = true;
        SFX.play('legend');
        persist(); buildHub();
        sideToast(`✔ ${q.title}`, rewardText(q.reward));
      },
    });
  }
}

const sideToastEl = document.createElement('div');
sideToastEl.className = 'sq-toast';
document.body.appendChild(sideToastEl);
function sideToast(title, sub, good = true) {
  sideToastEl.innerHTML = `<b>${title}</b><span>${sub}</span>`;
  sideToastEl.classList.toggle('bad', !good);
  sideToastEl.classList.remove('show'); void sideToastEl.offsetWidth; sideToastEl.classList.add('show');
}

// ---------- En la villa: marcas sobre los aldeanos, acercarse y hablar ----------
const neighborPrompts = NEIGHBORS.map((n, i) => ({ id: 'neighbor', who: i, prompt: '💬 Hablar con ' + n.name }));
nearNeighbor = function () {
  if (state !== 'hub' || !S) return null;
  for (const w of LIFE.walkers) {
    if (dist(vHero.x, vHero.y, w.x, w.y) > 60) continue;
    w.wait = Math.max(w.wait, 0.6); w.moving = false; // se para a hablar
    w.face = vHero.x > w.x ? 1 : -1;
    return neighborPrompts[w.id];
  }
  return null;
};
const _villageTap = villageTap;
villageTap = function (sx, sy) {
  const wx = (sx - W / 2) / zoom + vCam.x, wy = (sy - H / 2) / zoom + vCam.y;
  for (const w of LIFE.walkers) {
    if (Math.abs(wx - w.x) < 26 && wy > w.y - 70 && wy < w.y + 10) { vHero.target = { x: w.x + (vHero.x < w.x ? -30 : 30), y: w.y + 18 }; vHero.pending = neighborPrompts[w.id]; return; }
  }
  _villageTap(sx, sy);
};
const _villageInteractSQ = villageInteract;
villageInteract = function (what) {
  if (what && what.id === 'neighbor') { vHero.target = null; vHero.pending = null; talkNeighbor(what.who); return; }
  _villageInteractSQ(what);
};
const _drawWalker = drawWalker;
drawWalker = function (w) {
  _drawWalker(w);
  if (!S) return;
  const nq = neighborQuest(w.id);
  if (!nq || nq.st === 'active') return;
  const bob = Math.sin(now * 4 + w.id) * 2, y = w.y - 74 + bob;
  ctx.fillStyle = nq.st === 'ready' ? '#8fe36a' : '#ffd54f';
  ctx.beginPath(); ctx.arc(w.x, y, 6, 0, TAU); ctx.fill();
  text(nq.st === 'ready' ? '?' : '!', w.x, y, 10, '#2a1a0c', 'center', 900, false);
};

// Encargos activos en la tarjeta del pueblo
const _buildHubSQ = buildHub;
buildHub = function () {
  _buildHubSQ();
  if (!S) return;
  const card = $('hubChar'), st = sideState();
  const old = card.querySelector('.hubSide'); if (old) old.remove();
  const act = SIDE_QUESTS.filter((q) => st[q.id] && !st[q.id].claimed);
  if (!act.length) return;
  card.insertAdjacentHTML('beforeend', `<div class="hubSide">${act.map((q) => {
    const p = st[q.id].prog, ok = p >= q.goal;
    return `<div class="${ok ? 'ok' : ''}"><b>${ok ? '✔' : '•'} ${q.title}</b> <small>${NEIGHBORS[q.who].name} · ${ok ? '¡Vuelve a hablarle!' : sideText(q) + ` (${p}/${q.goal})`}</small></div>`;
  }).join('')}</div>`);
};
