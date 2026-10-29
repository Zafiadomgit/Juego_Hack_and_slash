/* Fendaria — capa visual común (con css/ui.css).
 *  · Esquinas ornamentadas en todas las ventanas (también en las que se crean después).
 *  · Las cifras de Grieta cerrada, caída y pausa se muestran como fichas con icono pintado.
 *  · Blasón en las pantallas de victoria y derrota, y botones en rejilla.
 */
'use strict';

// ---------- esquinas ----------
const UI_FRAMES = '.panel, .sheet, .rp-box, .ach-box';
function uiCorners(el) {
  if (!el || el.querySelector(':scope > .ui-corners')) return;
  el.insertAdjacentHTML('afterbegin', '<div class="ui-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>');
}
document.querySelectorAll(UI_FRAMES).forEach(uiCorners);
new MutationObserver((ms) => {
  for (const m of ms) for (const n of m.addedNodes) {
    if (n.nodeType !== 1) continue;
    if (n.matches(UI_FRAMES)) uiCorners(n);
    n.querySelectorAll && n.querySelectorAll(UI_FRAMES).forEach(uiCorners);
  }
}).observe(document.body, { childList: true, subtree: true });

// ---------- fichas de cifras ----------
// [rótulo, icono]: los rótulos son los mismos textos que usa el juego (en inglés se traducen solos)
const UI_STAT_ICONS = [
  ["Time", 'talents/hourglass'], ["Monsters defeated", 'talents/skull'], ["Items found", 'icons/chest'],
  ["Amber earned", 'icons/amber'], ["Experience", 'icons/xp'], ["Progress", 'icons/level'], ["Time bonus", 'talents/hourglass'],
  ["Expedition", 'talents/mountain'], ["Torment", 'talents/skull'], ['Puntuación', 'talents/crown'], ['Récord personal', 'talents/trophy'],
  ["Awakening Essences", 'icons/seal'], ["Awakening Essences", 'icons/gem'], ["Set piece", 'icons/chest'],
  ['Tu mejor hoy', 'talents/crown'],
];
const uiIcon = (label) => {
  const k = String(label).replace(/<[^>]+>/g, '').trim();
  const hit = UI_STAT_ICONS.find(([l]) => l === k);
  return 'img/' + (hit ? hit[1] : 'icons/gem') + '.png';
};
const UI_HI = ['Puntuación', "Torment", "Expedition"];
function uiTiles(el) {
  if (!el || el.dataset.uiBusy) return;
  const kids = [...el.children];
  if (!kids.some((c) => c.tagName === 'SPAN')) return;
  el.dataset.uiBusy = 1;
  const out = [];
  for (let i = 0; i < kids.length; i++) {
    const c = kids[i];
    if (c.tagName === 'SPAN' && kids[i + 1] && kids[i + 1].tagName === 'B') {
      const k = c.textContent.trim();
      out.push(`<div class="st${UI_HI.includes(k) ? ' hi' : ''}"><img src="${uiIcon(k)}" alt=""><span>${c.innerHTML}</span><b>${kids[i + 1].innerHTML}</b></div>`);
      i++;
    } else out.push(c.outerHTML);
  }
  el.innerHTML = out.join('');
  el.classList.add('tiles');
  delete el.dataset.uiBusy;
}
for (const id of ['endStats', 'deadStats', 'pauseStats', 'dlyStats']) {
  const el = $(id);
  if (!el) continue;
  new MutationObserver(() => uiTiles(el)).observe(el, { childList: true });
}

// ---------- victoria, derrota y pausa ----------
(function () {
  const crest = (id, img) => { const p = document.querySelector('#' + id + ' .panel'); if (p) p.insertAdjacentHTML('afterbegin', `<div class="ui-crest"><img src="img/talents/${img}.png" alt=""></div>`); };
  crest('end', 'trophy'); crest('dead', 'skull');
  const group = (id, ids) => {
    const els = ids.map((x) => $(x)).filter(Boolean);
    if (!els.length) return;
    const g = document.createElement('div');
    g.className = 'ui-btns';
    els[0].before(g);
    for (const e of els) g.appendChild(e);
  };
  group('end', ['btnShareEnd', 'btnEndHub']);
  group('dead', ['btnShareDead', 'btnDeadHub']);
  group('pause', ['btnResume', 'btnPauseInv', 'btnPauseStats', 'btnOpts', 'btnMute', 'btnQuit']);
  const r = $('btnResume'); if (r) r.style.gridColumn = '1 / -1';
  const q = $('btnQuit'); if (q) q.style.gridColumn = '1 / -1';
})();

// ---------- fondo del héroe en la pantalla de elección: su mundo ----------
const UI_HERO_WORLD = { iop: 'ceniza', cra: 'cristal', feca: 'abismo', sombra: 'ciudadela', domadora: 'pantano', artificiera: 'desierto', berserker: 'glaciar' };
const _showClassInfoUI = showClassInfo;
showClassInfo = function (id) {
  _showClassInfoUI(id);
  const art = document.querySelector('.hs-art');
  if (art && UI_HERO_WORLD[id]) art.style.setProperty('--hsbg', `url(img/worlds/art_${UI_HERO_WORLD[id]}.webp)`);
};
