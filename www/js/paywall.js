/* Fendaria — juego completo (compra única, producto de Google Play «juego_completo»).
 *  · Gratis: el entrenamiento, los 3 primeros héroes, los mundos 1 y 2 (con sus Súper Jefes) y la Grieta del Día.
 *  · Juego completo: los otros 4 héroes, los mundos 3 a 8, la Mazmorra y el Tormento.
 *  · El desbloqueo se guarda en la partida (SAVE.full) y viaja con el guardado en la nube; «Restaurar compra» lo recupera
 *    desde Google Play. Para la revisión de Google hay un código en Ajustes → «Canjear código».
 */
'use strict';

const FULL = { product: 'juego_completo', freeWorlds: 2, freeHeroes: ['iop', 'cra', 'feca'], price: '4,99 $' };
// huella (SHA-256) de los códigos válidos: el código no está en el juego
const FULL_CODES = ['50b62457e3654601d80a86d4c0a17481f38cd59ba65223a9880837c39d23861c'];
const fullOwned = () => !!(SAVE && SAVE.full) || (navigator.webdriver && !window.__paywallTest);
const billing = () => { const c = window.Capacitor; return c && c.isNativePlatform && c.isNativePlatform() && c.Plugins && c.Plugins.NativePurchases; };

function fullGrant(how) {
  SAVE.full = true; SAVE.fullBy = how; SAVE.fullAt = Date.now();
  persist();
  paywallHide();
  if (typeof buildHub === 'function' && state === 'hub') buildHub();
  if (typeof buildMap === 'function' && state === 'map') buildMap();
  if (state === 'menu') buildMenu();
  fullCelebrate();
}

// ---------- pantalla ----------
const PW_WORLDS = ['glaciar', 'desierto', 'abismo', 'hundida', 'cristal', 'ciudadela'];
document.body.insertAdjacentHTML('beforeend', `<div id="paywall" class="pw-ov" role="dialog" aria-modal="true">
  <div class="pw-box">
    <div class="pw-art">${PW_WORLDS.map((w) => `<i style="background-image:url(img/worlds/art_${w}.webp)"></i>`).join('')}</div>
    <button class="pw-x sh-close" data-pw="close" aria-label="Cerrar">✕</button>
    <div class="pw-body">
      <small class="pw-kick">Fendaria · juego completo</small>
      <h2 class="pw-title">Las Grietas no terminan aquí</h2>
      <ul class="pw-list">
        <li><b>4 héroes más</b> · la Sombra, la Domadora, la Artificiera y el Berserker</li>
        <li><b>6 mundos más</b> · del Glaciar Rúnico a la Ciudadela del Cerrajero</li>
        <li><b>6 Súper Jefes</b> y sus Guardianes, con la historia completa</li>
        <li><b>La Mazmorra</b> · reliquias únicas y el Despertar de tus héroes</li>
        <li><b>El Tormento</b> · dificultad sin techo y ranking mundial</li>
      </ul>
      <p class="pw-note">Un único pago, para siempre y sin anuncios. Tu progreso actual se conserva.</p>
      <button class="btn big pw-buy" data-pw="buy">Desbloquear · <span id="pwPrice">${FULL.price}</span></button>
      <div class="pw-msg" id="pwMsg"></div>
      <div class="pw-links"><button data-pw="restore">Restaurar compra</button><button data-pw="code">Canjear código</button></div>
    </div>
  </div>
</div>`);
function paywallShow(reason) {
  if (fullOwned()) return false;
  $('pwMsg').textContent = reason || '';
  $('paywall').classList.add('show');
  SFX.play('legend');
  fullPrice();
  return true;
}
function paywallHide() { $('paywall').classList.remove('show'); }
async function fullPrice() {
  const B = billing();
  if (!B) return;
  try {
    const { products } = await B.getProducts({ productIdentifiers: [FULL.product], productType: 'inapp' });
    if (products && products[0] && products[0].priceString) $('pwPrice').textContent = products[0].priceString;
  } catch (e) { /* sin conexión: se queda el precio de referencia */ }
}
async function fullBuy() {
  const B = billing(), msg = $('pwMsg');
  if (!B) { msg.textContent = 'La compra está disponible en la app de Google Play.'; return; }
  msg.textContent = 'Abriendo Google Play…';
  try {
    const t = await B.purchaseProduct({ productIdentifier: FULL.product, productType: 'inapp' });
    if (t && (t.productIdentifier === FULL.product || t.transactionId)) fullGrant('play');
    else msg.textContent = 'La compra no se completó.';
  } catch (e) {
    msg.textContent = /cancel/i.test(String(e && (e.message || e))) ? '' : 'No se pudo completar la compra. Inténtalo de nuevo.';
  }
}
async function fullRestore(quiet) {
  const B = billing(), msg = $('pwMsg');
  if (!B) { if (!quiet) msg.textContent = 'Restaurar está disponible en la app de Google Play.'; return; }
  if (!quiet) msg.textContent = 'Buscando tu compra…';
  try {
    const { purchases } = await B.getPurchases({ productType: 'inapp' });
    const ok = (purchases || []).some((p) => p.productIdentifier === FULL.product && !/pending/i.test(String(p.purchaseState || '')));
    if (ok) fullGrant('restore');
    else if (!quiet) msg.textContent = 'No encontramos una compra con esta cuenta de Google.';
  } catch (e) { if (!quiet) msg.textContent = 'Sin conexión. Prueba otra vez en un momento.'; }
}
async function sha256(t) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
}
async function fullRedeem() {
  const raw = prompt('Escribe tu código:');
  if (!raw) return;
  const code = raw.trim().toUpperCase().replace(/\s+/g, '');
  try {
    if (FULL_CODES.includes(await sha256(code))) { fullGrant('code'); return; }
  } catch (e) { /* sin cifrado disponible */ }
  const m = $('pwMsg'); if (m) m.textContent = 'Código no válido.';
  showToast('questToast', 'Código no válido', false);
}
$('paywall').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-pw]');
  if (ev.target.id === 'paywall' || (b && b.dataset.pw === 'close')) { paywallHide(); return; }
  if (!b) return;
  SFX.play('click');
  if (b.dataset.pw === 'buy') fullBuy();
  else if (b.dataset.pw === 'restore') fullRestore(false);
  else if (b.dataset.pw === 'code') fullRedeem();
});

// celebración al desbloquear
function fullCelebrate() {
  const el = $('featToast');
  if (!el) return;
  el.innerHTML = '<img src="img/talents/crown.png" alt=""><span><small>¡Gracias!</small><b>Juego completo desbloqueado</b><em>Los 7 héroes, los 8 mundos, la Mazmorra y el Tormento ya son tuyos</em></span>';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  SFX.play('level');
  setTimeout(() => el.classList.remove('show'), 4200);
}

// ---------- dónde se pide ----------
const _startNodePW = startNode;
startNode = function (b, n, d) {
  if (!window._dailyStart && b >= FULL.freeWorlds && !fullOwned()) { paywallShow(); return; }
  return _startNodePW(b, n, d);
};
const _openDungeonPW = openDungeon;
openDungeon = function () { if (!fullOwned()) { paywallShow(); return; } return _openDungeonPW(); };
$('btnDungeon').addEventListener('click', (ev) => { if (!fullOwned()) { ev.stopImmediatePropagation(); paywallShow(); } }, true);
// héroes del juego completo: candado en la selección (un héroe que ya tenía partida se conserva)
const heroLocked = (id) => !fullOwned() && !FULL.freeHeroes.includes(id) && !(SAVE.slots && SAVE.slots[id]);
const _buildMenuPW = buildMenu;
buildMenu = function () {
  const r = _buildMenuPW();
  const ids = Object.keys(CLASSES);
  $('classList').querySelectorAll('button').forEach((b, i) => {
    if (!heroLocked(ids[i])) return;
    b.classList.add('pw-lock');
    const sm = b.querySelector('small'); if (sm) sm.textContent = '★ Juego completo';
  });
  return r;
};
const _showClassInfoPW = showClassInfo;
showClassInfo = function (id) {
  const r = _showClassInfoPW(id);
  if (heroLocked(id)) {
    $('hsInfo').insertAdjacentHTML('afterbegin', '<div class="pw-mapnote">★ Este héroe es del <b>juego completo</b></div>');
    $('btnStart').textContent = '★ Desbloquear juego completo';
  }
  return r;
};
$('btnStart').addEventListener('click', (ev) => {
  if (selectedClass && heroLocked(selectedClass)) { ev.stopImmediatePropagation(); SFX.play('click'); paywallShow(); }
}, true);
// el mapa marca los mundos del juego completo
const _buildMapPW = buildMap;
buildMap = function () {
  const r = _buildMapPW();
  if (!fullOwned()) {
    document.querySelectorAll('#mapTabs button[data-b]').forEach((t) => { if (+t.dataset.b >= FULL.freeWorlds) t.classList.add('pw-tab'); });
    if (mapView >= FULL.freeWorlds) {
      const box = $('mapInfo');
      box.insertAdjacentHTML('afterbegin', '<div class="pw-mapnote">★ Este mundo es del <b>juego completo</b></div>');
      const go = $('btnMapGo');
      if (go) go.textContent = '★ Desbloquear juego completo';
    }
  }
  return r;
};
// al vencer al Súper Jefe del mundo 2 se ofrece una vez
const _goHubPW = goHub;
goHub = function () {
  const r = _goHubPW();
  if (!fullOwned() && S && typeof superDone === 'function' && superDone(FULL.freeWorlds - 1) && !SAVE.pwOffered) {
    SAVE.pwOffered = 1; persist();
    setTimeout(() => paywallShow('¡Has completado los mundos gratuitos! Sigue la historia con el juego completo.'), 2200);
  }
  return r;
};

// ---------- en Ajustes ----------
$('optClose').insertAdjacentHTML('beforebegin', '<div class="opt-row pw-row"><span><b>Juego completo</b><small id="pwState"></small></span><span class="pw-acts"><button class="btn" id="pwRedeem" type="button">Canjear código</button><button class="btn" id="pwOpen" type="button"></button></span></div>');
function pwRow() {
  const own = fullOwned();
  $('pwState').textContent = own ? '✔ Desbloqueado · gracias por apoyar a Lumen' : '4 héroes, mundos 3–8, Mazmorra y Tormento';
  $('pwOpen').textContent = own ? 'Restaurar' : 'Ver';
}
$('pwOpen').addEventListener('click', () => { SFX.play('click'); if (fullOwned()) fullRestore(true); else paywallShow(); });
$('pwRedeem').addEventListener('click', () => { SFX.play('click'); fullRedeem(); });
const _openOptionsPW = openOptions;
openOptions = function () { _openOptionsPW(); pwRow(); };

// al arrancar, si se compró en otro móvil con la misma cuenta de Google, se recupera solo
setTimeout(() => { if (!(SAVE && SAVE.full)) fullRestore(true); }, 5000);
