/* Fendaria — los menús aparecen poco a poco: un jugador nuevo ve solo lo que necesita.
 * Cada botón de la villa se muestra cuando tiene sentido (primera Grieta, primer punto de característica…)
 * y entonces sale un aviso «¡Nuevo!» y el botón brilla hasta que se pulsa.
 */
'use strict';

const FEATS = [
  { id: 'stats', el: 'dbStats', icon: 'img/icons/stats.png', name: 'Características', desc: 'Reparte los puntos que ganas al subir de nivel', on: () => (S.level || 1) >= 2 },
  { id: 'heroes', el: 'btnChange', icon: 'img/ui/heroes.png', name: 'Héroes', desc: 'Prueba otros héroes: cada uno guarda su progreso', on: () => (S.rifts || 0) >= 1 },
  { id: 'map', el: 'dbMap', icon: 'img/ui/map.png', name: 'Mapa de Grietas', desc: 'Elige qué Grieta jugar y repite las que ya cerraste', on: () => (S.rifts || 0) >= 1, also: ['btnMap'] },
  { id: 'quests', el: 'dbQuests', icon: 'img/ui/quest.png', name: 'Misiones', desc: 'Tres misiones al día que dan Sellos de Gesta', on: () => (S.rifts || 0) >= 2 },
  { id: 'ach', el: 'dbAch', icon: 'img/talents/trophy.png', name: 'Logros', desc: 'Retos con premio para toda tu partida', on: () => (S.rifts || 0) >= 3 },
  { id: 'daily', el: 'dbDaily', icon: 'img/icons/gem.png', name: 'Grieta del Día', desc: 'Una Grieta igual para todos con ranking mundial', on: () => (S.rifts || 0) >= 4 },
  { id: 'dungeon', el: 'btnDungeon', icon: 'img/ui/key.png', name: 'Mazmorra', desc: 'Pisos llenos de élites con reliquias únicas', on: () => typeof dungeonOpen === 'function' && dungeonOpen() },
];
const featSeen = () => (S.feats = S.feats || {});
// partidas que ya llevaban tiempo jugando: todo lo que ya tienen, sin avisos
function featMigrate() {
  if (!S || S.featsInit) return;
  S.featsInit = 1;
  if ((S.rifts || 0) >= 2 || (S.level || 1) >= 5) for (const f of FEATS) if (f.on()) featSeen()[f.id] = 2;
}

let featQ = [], featBusy = false;
function featApply(announce) {
  if (!S) return;
  featMigrate();
  const seen = featSeen();
  for (const f of FEATS) {
    const ok = f.on();
    for (const id of [f.el, ...(f.also || [])]) { const el = $(id); if (el) el.style.display = ok ? '' : 'none'; }
    if (!ok) continue;
    if (!seen[f.id]) { seen[f.id] = 1; if (announce) featQ.push(f); }
    const el = $(f.el);
    if (el) el.classList.toggle('feat-new', seen[f.id] === 1);
  }
  if (featQ.length) featNext();
}
function featNext() {
  if (featBusy || !featQ.length || state !== 'hub') return;
  const f = featQ.shift();
  featBusy = true;
  const el = $('featToast');
  el.innerHTML = `<img src="${f.icon}" alt=""><span><small>¡Nuevo!</small><b>${f.name}</b><em>${f.desc}</em></span>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  SFX.play('legend');
  setTimeout(() => { el.classList.remove('show'); featBusy = false; setTimeout(featNext, 400); }, 3600);
}
document.body.insertAdjacentHTML('beforeend', '<div id="featToast" class="feat-toast"></div>');
// al pulsar el botón nuevo deja de brillar
document.addEventListener('click', (ev) => {
  if (!S) return;
  for (const f of FEATS) {
    const el = $(f.el);
    if (el && el.contains(ev.target) && featSeen()[f.id] === 1) { featSeen()[f.id] = 2; el.classList.remove('feat-new'); persist(); }
  }
}, true);

const _buildHubF = buildHub;
buildHub = function () { const r = _buildHubF(); featApply(true); return r; };
const _goHubF = goHub;
goHub = function () { const r = _goHubF(); setTimeout(() => featApply(true), 1200); return r; };
setInterval(() => { if (state === 'hub') featApply(true); }, 3000);
