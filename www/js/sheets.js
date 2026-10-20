/* Fendaria — Inventario y Características como ventanas separadas (pestañas en la cabecera).
 * Inventario: equipo + bolsa. Características: equipo + puntos y estadísticas.
 */
'use strict';

let invMode = 'bag';
$('shLevel').insertAdjacentHTML('afterend', `<div class="sh-modes" id="shModes">
  <button data-m="bag" type="button">🎒 Inventario</button><button data-m="stats" type="button">📊 Características</button></div>`);
function setInvMode(m) {
  invMode = m;
  const inv = $('inv');
  inv.classList.toggle('mode-bag', m === 'bag');
  inv.classList.toggle('mode-stats', m === 'stats');
  for (const b of $('shModes').querySelectorAll('button')) b.classList.toggle('on', b.dataset.m === m);
  $('itemCard').classList.remove('show');
}
$('shModes').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-m]'); if (b) { SFX.play('click'); setInvMode(b.dataset.m); } });
const _openInventoryS = openInventory;
openInventory = function (from, mode) {
  _openInventoryS(from);
  if (state === 'inv') setInvMode(mode || (S.points > 0 && from !== 'play' ? invMode : 'bag'));
};
// tecla C: características (la B sigue abriendo la bolsa)
window.addEventListener('keydown', (e) => { if (state === 'inv' && e.key.toLowerCase() === 'c' && !e.repeat && invMode !== 'stats') setInvMode('stats'); });

// accesos separados en la villa y en la pausa
(function () {
  const slots = document.querySelector('#dofusBar .db-slots');
  if (slots) {
    $('btnInv').insertAdjacentHTML('afterend', '<button id="dbStats" class="db-slot" type="button"><img src="img/ui/gear.png" alt=""><span>Caract.</span></button>');
    $('dbStats').addEventListener('click', () => { if (state === 'hub') openInventory('hub', 'stats'); });
  }
  $('btnPauseInv').textContent = '🎒 Inventario';
  $('btnPauseInv').insertAdjacentHTML('afterend', '<button id="btnPauseStats" class="btn">📊 Características</button>');
  $('btnPauseStats').addEventListener('click', () => { state = 'play'; openInventory('pause', 'stats'); });
})();
// el botón de la villa se llama Inventario; el aviso de puntos sin gastar va en Características
const _buildHubS = buildHub;
buildHub = function () {
  _buildHubS();
  $('btnInv').innerHTML = '<img src="img/ui/bag.png" alt=""><span>Inventario</span>';
  const st = $('dbStats');
  if (st) st.innerHTML = '<img src="img/ui/gear.png" alt=""><span>Caract.</span>' + (S.points > 0 ? `<i class="badge">${S.points}</i>` : '');
};
