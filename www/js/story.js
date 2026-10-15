/* Fendaria — trama principal y cuadros de diálogo.
 * Acto I «El Cerrajero»: hace trescientos años la Orden de las Runas encerró a Morvhal tras cinco Sellos, uno en cada
 * tierra que hoy está al otro lado de las Grietas. Morvhal está forzándolos desde dentro y ha corrompido a sus guardianes
 * (los Súper Jefes). Cada Súper Jefe vencido libera un Sello; con los cinco, Morvhal huye a la Mazmorra (contenido final).
 *
 * Retratos: si existe img/portraits/<id>.webp (y está en PORTRAITS) se usa; si no, se recorta el sprite del personaje.
 */
'use strict';

// Retratos pintados disponibles en img/portraits (ver PORTRAIT_IDS en art.js)
const PORTRAITS = PORTRAIT_IDS;

const CHAPTERS = [
  { title: 'Ceniza y juramento', goal: 'Cierra las Grietas del Bosque Ceniciento y derrota al Rey Ceniza' },
  { title: 'La ciénaga que susurra', goal: 'Atraviesa la Ciénaga Sombría y libera a la Madre de la Ciénaga' },
  { title: 'El invierno que no termina', goal: 'Sube al Glaciar Rúnico y vence al Titán del Invierno Eterno' },
  { title: 'Las arenas de ámbar', goal: 'Cruza el Desierto de Ámbar y apaga al Fénix corrompido' },
  { title: 'El Cerrajero', goal: 'Desciende al Abismo del Vacío y derrota al Archimago' },
  { title: 'La Cámara del Cerrajero', goal: 'Persigue a Morvhal piso a piso en la Mazmorra' },
];

// Voz de cada héroe en los momentos clave
const HERO_LINES = {
  iop: { intro: 'Entonces habrá más yelmos que partir. ¿Qué hay al otro lado, Ivo?', defy: 'Tengo un hacha y muy poca paciencia. Sal de las sombras y lo hablamos.', boss: 'Mi padre forjaba yelmos. Yo los parto. ¡Ven aquí!', final: 'Partiré el último yelmo de Morvhal. Por la herrería de mi padre.' },
  cra: { intro: 'He seguido rastros peores. ¿Adónde lleva este?', defy: 'Mi halcón ya sabe dónde estás. Solo es cuestión de tiempo.', boss: 'Quieto. Así. Una flecha basta.', final: 'Por el bosque que fue mi casa. Una última flecha.' },
  feca: { intro: 'Las runas del borde de la Grieta… son una cerradura. Lo sabía.', defy: 'Conozco tus runas, Cerrajero. Y sé cómo cerrarlas.', boss: 'Égida arriba. Esto va a doler… a ti.', final: 'La Torre cayó por tu culpa, Morvhal. Yo cerraré la última puerta.' },
  sombra: { intro: '¿Y cuánto paga la villa por cerrar Grietas? Pregunto por curiosidad.', defy: 'Las voces en la oscuridad no me asustan. Yo vivo ahí.', boss: 'No me verás venir. Nadie lo hace.', final: 'Tres días a oscuras me enseñaron una cosa: la sombra también corta.' },
  domadora: { intro: 'La manada está inquieta desde anoche. Ahora sé por qué.', defy: 'Mis lobos huelen tu miedo, voz. Y les gusta.', boss: '¡Manada, conmigo! ¡A por él!', final: 'La loba gris aulló toda la noche. Sabe que es la última cacería.' },
  artificiera: { intro: '¿Una cerradura gigante? Me encantan las cerraduras. Sobre todo volarlas.', defy: 'Tengo una bomba con tu nombre. Literalmente: lo he grabado.', boss: '¡Cubríos! …Ah, que estoy sola. ¡Pues cúbrete tú!', final: 'Siempre dije que cerraría una Grieta con la explosión adecuada. Hoy la tengo.' },
  berserker: { intro: 'Huelo sangre al otro lado. Bien.', defy: 'Tus palabras no sangran. Tus monstruos sí.', boss: '¡LA FURIA ROJA! ¡VEN!', final: 'Mi clan cayó ante un monstruo. Morvhal no tendrá esa suerte.' },
};
const heroLine = (k) => (HERO_LINES[S.cls] || HERO_LINES.iop)[k];

// Escenas: [quién, texto]. {hero} = nombre del héroe
const SCENES = {
  prologo: [
    ['ivo', '¡{hero}! Por fin. Ven, acércate… y no pises mis raíces de mandrágora.'],
    ['ivo', 'Anoche la Grieta del Portal Rúnico volvió a abrirse. Más grande. Y esta vez no se cerró al amanecer.'],
    ['hero', () => heroLine('intro')],
    ['ivo', 'El Bosque Ceniciento. Era un bosque de verdad, ¿sabes? Hace trescientos años, antes de que la Orden de las Runas sellara aquella tierra.'],
    ['ivo', 'Los libros viejos hablan de cinco Sellos. Si las Grietas se abren… es que alguien los está forzando desde dentro.'],
    ['brunilda', 'Y mientras los sabios discuten, los monstruos se comen mis gallinas. Si vas a cruzar, llévate algo decente: mi puesto está abierto.'],
    ['tobias', 'Y si lo decente se te queda corto, tráemelo. Mi yunque lo convertirá en algo que asuste a un dragón.'],
    ['ivo', 'Cruza el Portal, llena la Grieta de luz y derrota a su Guardián. Y {hero}… si oyes una voz ahí dentro, no le contestes.'],
  ],
  enter0: [
    ['voz', 'Vaya, vaya. Una lucecita de Villa Candela.'],
    ['voz', 'Llevo trescientos años girando esta cerradura. No vas a detenerme tú.'],
    ['hero', () => heroLine('defy')],
    ['voz', 'Ya veremos. Mi Rey Ceniza tiene hambre.'],
  ],
  boss0: [
    ['boss', '¡GRRAAH! ¡El bosque ardió… y yo ardí con él! ¡El Cerrajero prometió devolverme mis árboles!'],
    ['hero', () => heroLine('boss')],
    ['boss', '¡Entonces arderás tú también!'],
  ],
  win0: [
    ['ivo', '¿Lo notas? El aire de la villa huele menos a humo. Has liberado el primer Sello: el Sello de Ceniza.'],
    ['ivo', 'El Rey Ceniza no era malvado. Era el guardián del Sello… y alguien lo corrompió.'],
    ['hero', 'Una voz me habló ahí dentro. Dijo que llevaba trescientos años girando una cerradura.'],
    ['ivo', '…El Cerrajero. Morvhal. Creía que era una leyenda para asustar a los aprendices.'],
    ['ivo', 'Si es él, irá a por el segundo Sello, en la Ciénaga Sombría. No le des tiempo, {hero}.'],
  ],
  enter1: [
    ['morvhal', 'Has roto mi primera cerradura. Qué grosero.'],
    ['morvhal', '¿Sabes por qué la Orden me encerró? Porque yo quería abrir puertas, y ellos solo sabían cerrarlas.'],
    ['hero', 'Sé lo que hacen tus monstruos a este lado. Con eso me basta.'],
    ['morvhal', 'La Madre de la Ciénaga cuida mi segundo Sello. Tiene… muchos hijos.'],
  ],
  boss1: [
    ['boss', 'Shhh… mis niños duermen bajo el agua. Tú también dormirás, pequeña luz.'],
    ['hero', () => heroLine('boss')],
  ],
  win1: [
    ['brunilda', '¡Ha vuelto! ¡Y entero! Ivo, págame: te dije que volvería.'],
    ['ivo', 'Dos Sellos… Morvhal estará furioso. La Orden escondió el tercero en lo alto del Glaciar Rúnico.'],
    ['tobias', 'El frío de ahí arriba parte el acero. Pásate por la forja antes de subir. Lo digo en serio.'],
    ['hero', 'Iré. Pero cuando vuelva quiero la verdad entera, Ivo. ¿Cómo sabes tanto de Morvhal?'],
    ['ivo', '…Cuando vuelvas. Te lo prometo.'],
  ],
  enter2: [
    ['morvhal', 'Hace frío, ¿verdad? Aquí me encerraron. Doce runistas, una noche entera cantando.'],
    ['morvhal', 'Uno de ellos era un muchacho asustado que se llamaba Ivo. ¿No te lo ha contado?'],
    ['hero', '¿Ivo…? Mientes.'],
    ['morvhal', 'Pregúntale por qué no envejece.'],
  ],
  boss2: [
    ['boss', 'EL INVIERNO… NO TERMINA. EL SELLO… ME QUEMA.'],
    ['hero', () => heroLine('boss')],
    ['boss', 'LIBÉRAME… O MUERE.'],
  ],
  win2: [
    ['hero', 'Ivo. Morvhal dice que tú estabas allí la noche en que lo encerraron.'],
    ['ivo', '…Era el aprendiz más joven de la Orden. Sostuve la última runa mientras los demás morían congelados.'],
    ['ivo', 'Bebí un elixir para vivir lo bastante como para vigilar los Sellos. Llevo trescientos años en esta villa, esperando que este día no llegara.'],
    ['brunilda', 'Trescientos años y sigues regateándome el precio de las hierbas. Increíble.'],
    ['ivo', 'El cuarto Sello está en el Desierto de Ámbar. Su guardián es un Fénix: si renace corrompido, renacerá así para siempre.'],
  ],
  enter3: [
    ['morvhal', 'Ahora ya lo sabes. El viejo Ivo te usa como me usaron a mí: para cerrar puertas.'],
    ['morvhal', 'Únete a mí, {hero}. Al otro lado de la Puerta del Vacío está la Fendaria Antigua. Sin hambre. Sin muerte.'],
    ['hero', 'Ivo me contó la verdad. Tú solo me ofreces otra cerradura.'],
    ['morvhal', 'Entonces arde con mi Fénix.'],
  ],
  boss3: [
    ['boss', 'Muero y renazco… muero y renazco… ¡Haz que pare!'],
    ['hero', () => heroLine('boss')],
  ],
  win3: [
    ['ivo', 'Cuatro Sellos. Solo queda el quinto, en el Abismo del Vacío, junto a la Puerta misma.'],
    ['tobias', 'He forjado armas toda mi vida para gente que no volvió. Tú vas a volver, ¿me oyes?'],
    ['brunilda', 'Y me traerás algo brillante del Abismo. Para la tienda. Por favor.'],
    ['hero', () => heroLine('final')],
    ['ivo', 'El Archimago del Vacío guarda el último Sello. Fue el maestro de la Orden… y el primero en caer ante Morvhal.'],
  ],
  enter4: [
    ['morvhal', 'Bienvenido a mi casa.'],
    ['morvhal', 'Mi Archimago te espera. Cuando caiga, el último Sello será tuyo… o mío.'],
    ['hero', 'Será de Villa Candela.'],
  ],
  boss4: [
    ['boss', '¿{hero}? No… otra vez no. Morvhal está DENTRO de mí. ¡Acaba conmigo antes de que abra la Puerta!'],
    ['hero', () => heroLine('boss')],
  ],
  win4: [
    ['ivo', 'Lo has conseguido. Los cinco Sellos brillan otra vez. Las Grietas… se están calmando.'],
    ['hero', 'Morvhal no murió. Lo sentí escapar hacia abajo, más hondo que el Abismo.'],
    ['ivo', 'La Cámara del Cerrajero. Una prisión bajo las prisiones, piso tras piso. La Orden la llamaba la Mazmorra.'],
    ['ivo', 'Allí guardaba las reliquias que robó a los reyes antiguos. Y allí se esconde ahora, recuperando fuerzas.'],
    ['tobias', 'Reliquias de reyes, ¿eh? Tráemelas y verás de lo que es capaz este yunque.'],
    ['brunilda', 'Villa Candela te debe la vida, {hero}. Aunque te lo seguiré cobrando todo.'],
    ['ivo', 'Descansa. Cuando estés listo, el Portal te llevará a la Mazmorra. Morvhal te estará esperando.'],
  ],
  dungeon: [
    ['ivo', 'Esto es la Cámara del Cerrajero. Cada piso es más hondo… y más peligroso que el anterior.'],
    ['ivo', 'Lo que caiga ahí abajo no existe en ningún otro sitio: reliquias únicas y Esencias para romper tus límites.'],
  ],
};

// Charla de los vecinos según el capítulo (0…5)
const CHATTER = {
  merchant: [
    'Equipo nuevo cada vez que vuelves de una Grieta. Los monstruos traen cosas raras… y yo las vendo más raras todavía.',
    'Dicen que en la Ciénaga hay ranas del tamaño de un carro. Si me traes una piel, te hago descuento. Mentira, no te lo hago.',
    'Arriba en el Glaciar se vende muy bien el ámbar caliente. Bueno, se vendería, si alguien volviera de allí.',
    'Trescientos años… y yo pensando que Ivo se teñía la barba.',
    'Si vuelves del Abismo, prometo ponerle tu nombre a una espada. A una barata, pero con tu nombre.',
    'Desde que los Sellos brillan, vienen mercaderes de todo el reino. ¡La competencia! Compra ahora, antes de que me arruine.',
  ],
  alchemist: [
    'El ámbar de las Grietas es luz cristalizada. Con él preparo elixires… y otras cosas que es mejor no preguntar.',
    'La Orden de las Runas eran doce. Los libros nunca dicen qué fue de ellos. Yo… prefiero no hablar de eso todavía.',
    'Si oyes a Morvhal, recuerda: miente con la verdad. Es lo que mejor sabe hacer.',
    'Gracias por no mirarme raro desde que lo sabes. Bueno, menos raro que antes.',
    'El Archimago me enseñó a leer runas. Era un buen hombre. Libéralo, {hero}.',
    'He vivido trescientos años esperando este final. Ahora resulta que solo era el principio.',
  ],
  smith: [
    'Tráeme lo que no uses: lo fundo en Fragmentos. Con Fragmentos refino tus armas. Así funciona el mundo.',
    'Un arma refinada a +10 corta cosas que ni deberían existir. Lo sé porque lo he visto.',
    'El acero se parte con ese frío. Lleva el arma bien refinada o no la lleves.',
    'Kara, la de la herrería del este… su padre me enseñó todo lo que sé. Gente de hierro, aquella.',
    'Si vuelves del Abismo con el arma rota, te forjo otra gratis. Si no vuelves… bueno, no pienso en eso.',
    'Las reliquias de la Mazmorra no se pueden ascender ni reforjar. Pero refinarlas… eso sí. Tráemelas.',
  ],
};

// ============================================================
// Personajes y retratos
// ============================================================
const SPEAKERS = {
  ivo: { name: 'Maese Ivo', color: '#d9a8ff', sprite: 'alchemist' },
  brunilda: { name: 'Brunilda', color: '#ffcf7a', sprite: 'merchant' },
  tobias: { name: 'Tobías', color: '#ffb070', sprite: 'smith' },
  morvhal: { name: 'Morvhal, el Cerrajero', color: '#c77dff', aura: '200,90,255' },
  voz: { name: '???', color: '#c77dff', aura: '200,90,255', hidden: true },
};
const NPC_SPEAKER = { merchant: 'brunilda', alchemist: 'ivo', smith: 'tobias' };

function speakerInfo(who, ctx) {
  if (who === 'hero') { const L = CLASS_LORE[S.cls]; return { id: 'hero_' + S.cls, name: L.hero, color: CLASSES[S.cls].color === '#3a2a5a' ? '#b49cff' : '#ecd18a', hero: true }; }
  if (who === 'boss') {
    const b = BIOMES[ctx.b], sb = SUPER_BOSSES[b.id];
    return { id: 'boss_' + b.id, name: sb.name, color: `rgb(${sb.aura})`, aura: sb.aura };
  }
  return Object.assign({ id: who }, SPEAKERS[who]);
}

const portraitCache = {};
function silhouette(aura, hidden) {
  const key = 'sil' + aura + (hidden ? 'h' : '');
  if (portraitCache[key]) return portraitCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(64, 70, 6, 64, 70, 80);
  bg.addColorStop(0, `rgba(${aura},0.55)`); bg.addColorStop(1, 'rgba(8,4,16,0)');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  // capucha y hombros
  g.fillStyle = '#0c0814';
  g.beginPath(); g.moveTo(64, 14); g.bezierCurveTo(98, 18, 104, 58, 96, 84); g.lineTo(124, 128); g.lineTo(4, 128); g.lineTo(32, 84);
  g.bezierCurveTo(24, 58, 30, 18, 64, 14); g.fill();
  g.fillStyle = '#05030a';
  g.beginPath(); g.ellipse(64, 60, 20, 25, 0, 0, Math.PI * 2); g.fill();
  if (!hidden) { g.strokeStyle = `rgba(${aura},0.7)`; g.lineWidth = 2; g.beginPath(); g.moveTo(64, 92); g.lineTo(64, 128); g.stroke(); g.beginPath(); g.arc(64, 104, 6, 0, Math.PI * 2); g.stroke(); }
  // ojos
  g.shadowColor = `rgb(${aura})`; g.shadowBlur = 10; g.fillStyle = '#fff2ff';
  g.fillRect(53, 56, 7, 3); g.fillRect(68, 56, 7, 3);
  return (portraitCache[key] = c.toDataURL());
}
function spritePortrait(kind) {
  const key = 'spr' + kind;
  if (portraitCache[key]) return portraitCache[key];
  const img = PROP_IMG.villa, f = PROP_ATLAS.villa && PROP_ATLAS.villa[kind] && PROP_ATLAS.villa[kind][0];
  if (!img || !f) return null;
  const c = document.createElement('canvas'); c.width = f[2]; c.height = Math.round(f[3] * 0.62);
  c.getContext('2d').drawImage(img, f[0], f[1], f[2], c.height, 0, 0, f[2], c.height);
  return (portraitCache[key] = c.toDataURL());
}
// devuelve { src, mode }: mode 'paint' (retrato pintado), 'hero' (arte de cuerpo entero, encuadrado arriba), 'pixel' o 'sil'
function portraitFor(sp) {
  if (PORTRAITS.includes(sp.id)) return { src: portraitUrl(sp.id), mode: 'paint' };
  if (sp.hero) { const a = heroArt(S.cls); if (a) return { src: a.url, mode: 'hero' }; }
  if (sp.sprite) { const s = spritePortrait(sp.sprite); if (s) return { src: s, mode: 'pixel' }; }
  return { src: silhouette(sp.aura || '200,200,220', sp.hidden), mode: 'sil' };
}

// ============================================================
// Cuadro de diálogo
// ============================================================
const dlgEl = document.createElement('div');
dlgEl.id = 'dlg';
dlgEl.className = 'dlg';
dlgEl.innerHTML = `<div class="dlg-dim"></div>
  <div class="dlg-box">
    <div class="dlg-port"><img alt=""></div>
    <div class="dlg-body"><div class="dlg-name"></div><div class="dlg-text"></div><div class="dlg-choices"></div><div class="dlg-next">▼</div></div>
    <button class="dlg-skip" type="button">Saltar ⏭</button>
  </div>`;
document.body.appendChild(dlgEl);
const dlgQ = [];
let dlg = null;

function hasText(s) { return typeof s === 'function' ? s() : s; }
function fillText(s) { return hasText(s).replace(/\{hero\}/g, CLASS_LORE[S.cls].hero); }

// lines: [[quién, texto]], o: { ctx, choices: [{label, fn}], onEnd }
function playDialog(lines, o = {}) {
  if (dlg) { dlgQ.push([lines, o]); return; }
  dlg = { lines, o, i: -1, prev: state, typing: false, full: '', shown: 0 };
  state = 'dialog';
  clearInput();
  dlgEl.classList.add('show');
  nextLine();
}
function nextLine() {
  dlg.i++;
  if (dlg.i >= dlg.lines.length) { endDialog(); return; }
  const [who, text] = dlg.lines[dlg.i];
  const sp = speakerInfo(who, dlg.o.ctx || {});
  const pt = portraitFor(sp);
  const box = dlgEl.querySelector('.dlg-box');
  box.classList.toggle('right', !!sp.hero);
  const port = dlgEl.querySelector('.dlg-port');
  port.className = 'dlg-port ' + pt.mode;
  port.style.setProperty('--c', sp.color);
  port.querySelector('img').src = pt.src;
  const nm = dlgEl.querySelector('.dlg-name');
  nm.textContent = sp.name; nm.style.color = sp.color;
  dlg.full = fillText(text); dlg.shown = 0; dlg.typing = true;
  dlgEl.querySelector('.dlg-text').textContent = '';
  dlgEl.querySelector('.dlg-choices').innerHTML = '';
  dlgEl.querySelector('.dlg-next').style.visibility = 'hidden';
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}
function typeTick() {
  if (dlg && dlg.typing) {
    dlg.shown = Math.min(dlg.full.length, dlg.shown + 2);
    dlgEl.querySelector('.dlg-text').textContent = dlg.full.slice(0, dlg.shown);
    if (dlg.shown >= dlg.full.length) finishTyping();
  }
}
setInterval(typeTick, 28);
function finishTyping() {
  dlg.typing = false;
  dlgEl.querySelector('.dlg-text').textContent = dlg.full;
  const last = dlg.i === dlg.lines.length - 1;
  if (last && dlg.o.choices) {
    dlgEl.querySelector('.dlg-choices').innerHTML = dlg.o.choices.map((c, k) => `<button class="btn" data-k="${k}">${c.label}</button>`).join('');
  } else dlgEl.querySelector('.dlg-next').style.visibility = 'visible';
}
function advanceDialog() {
  if (!dlg) return;
  if (dlg.typing) { finishTyping(); return; }
  if (dlg.i === dlg.lines.length - 1 && dlg.o.choices) return; // hay que elegir
  SFX.play('click');
  nextLine();
}
function endDialog(choice) {
  const d = dlg;
  dlg = null;
  dlgEl.classList.remove('show');
  if (state === 'dialog') state = d.prev;
  clearInput();
  if (choice && choice.fn) choice.fn();
  if (d.o.onEnd) d.o.onEnd();
  if (dlgQ.length) { const [l, o] = dlgQ.shift(); setTimeout(() => playDialog(l, o), 250); }
}
dlgEl.addEventListener('pointerdown', (ev) => {
  ev.stopPropagation();
  const ch = ev.target.closest('.dlg-choices button');
  if (ch) { SFX.play('click'); endDialog(dlg.o.choices[+ch.dataset.k]); return; }
  if (ev.target.closest('.dlg-skip')) { SFX.play('click'); if (dlg.o.choices) { dlg.i = dlg.lines.length - 2; nextLine(); finishTyping(); } else endDialog(); return; }
  advanceDialog();
});
window.addEventListener('keydown', (e) => {
  if (!dlg) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'enter' || k === 'e') advanceDialog();
  else if (k === 'escape') endDialog();
});
try {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App) App.addListener('backButton', () => { if (dlg) endDialog(); });
} catch (e) { /* entorno web */ }

// ============================================================
// Progreso de la trama
// ============================================================
function storyState() {
  if (!S.story) {
    S.story = { seen: {} };
    // partidas anteriores a la trama: se dan por vistas las escenas de lo ya superado
    for (let b = 0; b < BIOMES.length; b++) {
      if (superDone(b)) ['enter', 'boss', 'win'].forEach((k) => { S.story.seen[k + b] = 1; });
      else if (b === 0 && clearedDiffs(0, 1)) S.story.seen.enter0 = 1;
    }
    if (superDone(0)) S.story.seen.prologo = 1;
  }
  return S.story;
}
const storyChapter = () => { let b = 0; while (b < BIOMES.length && superDone(b)) b++; return b; };
function playScene(id, ctx, o = {}) {
  const st = storyState();
  if (st.seen[id] || !SCENES[id]) return false;
  st.seen[id] = 1;
  persist();
  playDialog(SCENES[id], Object.assign({ ctx }, o));
  return true;
}

// Al volver a la villa: prólogo y cierre de capítulo
const _goHub = goHub;
goHub = function () {
  _goHub();
  setTimeout(() => {
    if (state !== 'hub' || !S) return;
    if (playScene('prologo', {})) return;
    for (let b = 0; b < BIOMES.length; b++) {
      if (superDone(b) && playScene('win' + b, { b }, {
        onEnd: () => {
          buildHub();
          if (b === BIOMES.length - 1) showStoryCard('Fin del Acto I', 'La Mazmorra del Cerrajero te espera bajo el Portal Rúnico');
          else showStoryCard('Capítulo ' + (b + 2), CHAPTERS[b + 1].title);
        },
      })) return;
    }
  }, 700);
};

// Al entrar en una Grieta: presentación del bioma o del Súper Jefe (la Mazmorra tiene la suya)
const _startNode = startNode;
startNode = function (b, n, d) {
  _startNode(b, n, d);
  later(2.6, () => { // después del cartel del bioma
    if (!rift || state !== 'play') return;
    if (rift.isDungeon) { playScene('dungeon', { b }); return; }
    if (n === 'S') playScene('boss' + b, { b });
    else playScene('enter' + b, { b });
  });
};

// Hablar con los vecinos: una frase del capítulo y luego la tienda
const _villageInteract = villageInteract;
villageInteract = function (what) {
  const who = what && what.id && NPC_SPEAKER[what.id];
  if (!who) return _villageInteract(what);
  vHero.target = null; vHero.pending = null;
  const ch = Math.min(storyChapter(), 5);
  playDialog([[who, CHATTER[what.id][ch]]], {
    choices: [
      { label: what.id === 'smith' ? '⚒ Herrería' : what.id === 'alchemist' ? '⚗ Elixires y mejoras' : '🛒 Comerciar', fn: () => _villageInteract(what) },
      { label: 'Adiós', fn: null },
    ],
  });
};

// Objetivo actual en la tarjeta del pueblo
const _buildHub = buildHub;
buildHub = function () {
  _buildHub();
  const ch = Math.min(storyChapter(), CHAPTERS.length - 1);
  const card = $('hubChar');
  const old = card.querySelector('.hubStory'); if (old) old.remove();
  card.insertAdjacentHTML('beforeend', `<div class="hubStory"><b>📖 ${ch < 5 ? 'Capítulo ' + (ch + 1) : 'Epílogo'} · ${CHAPTERS[ch].title}</b><span>${CHAPTERS[ch].goal}</span></div>`);
};

// Cartel grande de capítulo
function showStoryCard(title, sub) {
  const el = document.createElement('div');
  el.className = 'story-card';
  el.innerHTML = `<small>Fendaria · Acto I</small><b>${title}</b><span>${sub}</span>`;
  document.body.appendChild(el);
  SFX.play('legend');
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 4200);
}
