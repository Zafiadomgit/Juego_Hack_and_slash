/* Fendaria — guardado en la nube (Supabase, sin cuentas).
 *  · Cada partida tiene un código secreto (XXXX-XXXX-XXXX-XXXX-XXXX) que se crea solo la primera vez.
 *  · La partida se sube sola unos segundos después de cada guardado y al salir de la app.
 *  · En un móvil nuevo: Ajustes (o la pantalla de héroes) → «Recuperar partida» con el código.
 *  · Si otro móvil con el mismo código guardó algo más nuevo, se pregunta cuál conservar.
 * La nube guarda solo el hash del código: sin el código no se puede leer ni encontrar una partida.
 */
'use strict';

const CLOUD_ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin 0/O ni 1/I para que se copie a mano sin errores
function cloudNewCode() {
  const b = new Uint8Array(20);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach((_, i) => { b[i] = Math.random() * 256; });
  const s = Array.from(b, (x) => CLOUD_ABC[x & 31]).join('');
  return s.match(/.{4}/g).join('-');
}
// lo que escribe el jugador: mayúsculas, sin espacios, con los guiones en su sitio
function cloudNorm(t) {
  const s = String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length === 20 ? s.match(/.{4}/g).join('-') : null;
}
const CLOUD = () => (SAVE.cloud = SAVE.cloud || { code: cloudNewCode(), sent: 0, at: 0, dirty: 1 });
// la partida que se sube: todo menos los datos de la propia nube
function cloudPayload() {
  const o = Object.assign({}, SAVE);
  delete o.cloud;
  return o;
}

let cloudBusy = false, cloudTimer = 0, cloudErr = '';
const _persistC = persist;
// cada guardado marca la partida para subirla dentro de unos segundos (agrupa muchos guardados seguidos)
persist = function () {
  const c = CLOUD();
  c.dirty = Date.now();
  _persistC();
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(cloudPush, 12000);
};

async function cloudPush(force) {
  const c = CLOUD();
  if (cloudBusy || (!c.dirty && !force) || c.conflict) return;
  if (navigator.onLine === false) { cloudErr = 'offline'; return; }
  cloudBusy = true;
  const rev = Math.max(Date.now(), (c.sent || 0) + 1), mark = c.dirty;
  try {
    const body = JSON.stringify({ p_code: c.code, p_data: cloudPayload(), p_rev: rev });
    const r = await fetch(`${RANK_API.url}/rest/v1/rpc/cloud_put`, {
      method: 'POST', headers: { apikey: RANK_API.key, 'Content-Type': 'application/json' }, body, keepalive: body.length < 60000,
    });
    if (!r.ok) throw new Error('cloud ' + r.status);
    const res = await r.json();
    if (res.ok) {
      c.sent = rev; c.at = Date.now(); cloudErr = '';
      if (c.dirty === mark) c.dirty = 0; // si se guardó algo mientras subía, queda pendiente
      _persistC();
    } else { c.conflict = res.rev; _persistC(); cloudConflict(); }
  } catch (e) { cloudErr = 'net'; } finally { cloudBusy = false; cloudStatus(); }
}

async function cloudRpc(fn, body) {
  const r = await fetch(`${RANK_API.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: RANK_API.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('cloud ' + r.status);
  return r.json();
}

// ¿otro móvil con este código guardó algo después que nosotros?
async function cloudCheck() {
  const c = CLOUD();
  if (!c.sent || navigator.onLine === false) return;
  try {
    const rev = await cloudRpc('cloud_rev', { p_code: c.code });
    if (rev && rev > c.sent) { c.conflict = rev; _persistC(); cloudConflict(); }
  } catch (e) { /* sin red */ }
}

// ---------- resumen de una partida (para decidir cuál conservar) ----------
function cloudSummary(data) {
  const slots = Object.values((data && data.slots) || {}).sort((a, b) => b.level - a.level);
  if (!slots.length) return "No heroes yet";
  return slots.slice(0, 4).map((s) => `${(CLASSES[s.cls] || {}).name || s.cls} · Lv. ${s.level}`).join('<br>');
}
const cloudWhen = (t) => {
  if (!t) return '';
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

// ---------- ventana ----------
document.body.insertAdjacentHTML('beforeend', `<div id="cloudPanel" class="run-pick"><div class="rp-box cloud-box" id="cloudBox"></div></div>`);
function cloudShow(html) { $('cloudBox').innerHTML = html; $('cloudPanel').classList.add('show'); }
function cloudHide() { $('cloudPanel').classList.remove('show'); }
$('cloudPanel').addEventListener('click', (ev) => { if (ev.target.id === 'cloudPanel') cloudHide(); });

function cloudOpenRestore() {
  SFX.play('click');
  cloudShow(`<div class="rp-head"><b>☁ Recover save</b><small>Type your save code. You'll find it in Settings on your other phone.</small></div>
    <input id="cloudIn" class="cloud-in" maxlength="29" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX">
    <div id="cloudMsg" class="cloud-msg"></div>
    <div class="cloud-acts"><button class="btn" data-c="close">Cancel</button><button class="btn big" data-c="find">Search</button></div>`);
  setTimeout(() => $('cloudIn') && $('cloudIn').focus(), 50);
}
let cloudFound = null;
async function cloudFind() {
  const code = cloudNorm($('cloudIn').value), msg = $('cloudMsg');
  if (!code) { msg.textContent = "The code has 20 letters and numbers."; return; }
  msg.textContent = "Searching…";
  try {
    const res = await cloudRpc('cloud_get', { p_code: code });
    if (!res || !res.data || !res.data.slots) { msg.textContent = "There's no save with that code."; return; }
    cloudFound = { code, res };
    cloudShow(`<div class="rp-head"><b>☁ Save found</b><small>Saved ${cloudWhen(res.at)}</small></div>
      <div class="cloud-sum">${cloudSummary(res.data)}</div>
      <p class="cloud-warn">It will be loaded on this phone and replace the save that's here now:<br><small>${cloudSummary(SAVE)}</small></p>
      <div class="cloud-acts"><button class="btn" data-c="close">Cancel</button><button class="btn big" data-c="load">Load this save</button></div>`);
  } catch (e) { msg.textContent = "No connection. Try again in a moment."; }
}
function cloudLoad(code, res) {
  const data = res.data;
  data.cloud = { code, sent: res.rev, at: Date.now(), dirty: 0 };
  // la partida en memoria pasa a ser la recuperada: así cualquier guardado durante la recarga escribe la buena
  SAVE = data;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { return; }
  location.reload();
}

// otro móvil guardó algo más nuevo con el mismo código
async function cloudConflict() {
  const c = CLOUD();
  if (!c.conflict || $('cloudPanel').classList.contains('show')) return;
  if (state !== 'hub' && state !== 'menu' && state !== 'title') return; // nunca en mitad de una Grieta
  let res = null;
  try { res = await cloudRpc('cloud_get', { p_code: c.code }); } catch (e) { return; }
  if (!res || !res.data) { c.conflict = 0; return; }
  cloudFound = { code: c.code, res };
  cloudShow(`<div class="rp-head"><b>☁ There's a newer save</b><small>Another phone saved with your code ${cloudWhen(res.at)}</small></div>
    <div class="cloud-two"><div><small>In the cloud</small>${cloudSummary(res.data)}</div><div><small>On this phone</small>${cloudSummary(SAVE)}</div></div>
    <div class="cloud-acts"><button class="btn" data-c="keep">Keep this one</button><button class="btn big" data-c="load">Load the cloud save</button></div>`);
}

$('cloudBox').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-c]');
  if (!b) return;
  const k = b.dataset.c;
  SFX.play('click');
  if (k === 'close') cloudHide();
  else if (k === 'find') cloudFind();
  else if (k === 'load' && cloudFound) cloudLoad(cloudFound.code, cloudFound.res);
  else if (k === 'keep') { const c = CLOUD(); c.sent = c.conflict; c.conflict = 0; c.dirty = Date.now(); _persistC(); cloudHide(); cloudPush(true); }
  else if (k === 'copy') {
    const code = CLOUD().code;
    (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => { b.textContent = "✔ Copied"; }, () => { $('cloudCode').classList.add('show'); });
  } else if (k === 'reveal') $('cloudCode').classList.toggle('show');
  else if (k === 'restore') cloudOpenRestore();
});
$('cloudBox').addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.id === 'cloudIn') cloudFind(); });

// ---------- en Ajustes ----------
$('optClose').insertAdjacentHTML('beforebegin', `<div class="opt-row cloud-row"><span><b>☁ Cloud save</b><small id="cloudState"></small></span><button id="cloudMore" class="btn" type="button">Your code</button></div>`);
function cloudStatus() {
  const el = $('cloudState'), c = CLOUD();
  if (!el) return;
  el.textContent = c.conflict ? "There's a newer save on another phone"
    : cloudErr === 'offline' ? "Offline: it will upload when you're back"
    : c.at ? `Saved ${cloudWhen(c.at)}` : cloudErr ? "Waiting to upload" : "Uploads automatically while you play";
}
$('cloudMore').addEventListener('click', (ev) => {
  ev.preventDefault();
  SFX.play('click');
  cloudStatus();
  cloudShow(`<div class="rp-head"><b>☁ Cloud save</b><small>Your save uploads automatically. Write down this code: it lets you recover your save on another phone.</small></div>
    <div id="cloudCode" class="cloud-code" data-c="reveal">${CLOUD().code}<i>Tap to show</i></div>
    <div class="cloud-acts"><button class="btn" data-c="copy">Copy code</button><button class="btn" data-c="restore">Recover another save</button></div>
    <button class="rp-opt go" data-c="close" type="button"><i>✔</i><span><b>Done</b></span></button>`);
  cloudPush(true);
});
const _openOptionsC = openOptions;
openOptions = function () { _openOptionsC(); cloudStatus(); };

// ---------- en la pantalla de héroes: quien instala en un móvil nuevo ----------
(function () {
  const foot = document.querySelector('#menu .hs-foot');
  if (!foot) return;
  foot.insertAdjacentHTML('afterbegin', "<button id=\"btnCloudRestore\" class=\"cloud-link\" type=\"button\">☁ Played on another phone? Recover your save</button>");
  $('btnCloudRestore').addEventListener('click', cloudOpenRestore);
})();

// ---------- cuándo subir ----------
document.addEventListener('visibilitychange', () => { if (document.hidden) cloudPush(); else cloudCheck(); });
window.addEventListener('online', () => cloudPush());
try { const App = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App; if (App) App.addListener('pause', () => cloudPush()); } catch (e) { /* navegador */ }
setInterval(() => { if (CLOUD().dirty && (state === 'hub' || state === 'menu')) cloudPush(); }, 60000);
setTimeout(() => { CLOUD(); cloudCheck(); cloudPush(); }, 4000);
// el enlace solo hace falta mientras este móvil no tenga partida
const _buildMenuC = buildMenu;
buildMenu = function (...a) { const r = _buildMenuC(...a); const l = $('btnCloudRestore'); if (l) l.style.display = Object.keys(SAVE.slots || {}).length ? 'none' : ''; return r; };
