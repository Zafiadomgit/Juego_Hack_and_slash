/* Fendaria — Edición Completa, tienda de cosméticos y guardado en la nube.
 * - Gratis: el Bosque Ceniciento entero (hasta el primer Súper Jefe). La Edición Completa (pago único) abre los otros
 *   cuatro mundos y la Mazmorra, e incluye el Aura del Fundador.
 * - Pagos con RevenueCat (@revenuecat/purchases-capacitor) sobre Google Play Billing. Sin clave configurada, o en el
 *   navegador, la tienda se muestra pero no cobra (con ?devstore en la URL las compras se simulan para probar).
 * - Nube: Supabase (inicio de sesión con código por email + tabla public.saves protegida con RLS).
 * Las compras y los cosméticos son de la cuenta (SAVE.premium), no de cada héroe.
 */
'use strict';

const STORE_CFG = {
  revenuecatKey: '', // clave pública de Android de RevenueCat (goog_…)
  fullId: 'fendaria_full', // producto de pago único (y entitlement «full»)
};
const CLOUD_CFG = {
  url: '', // https://<proyecto>.supabase.co
  key: '', // clave publicable de Supabase (pública por diseño; los datos los protege RLS). Vacía: nube desactivada
};

const COSMETICS = [
  { id: 'aura_founder', kind: 'aura', name: 'Aura del Fundador', rgb: '120,230,255', full: true },
  { id: 'aura_ember', kind: 'aura', name: 'Aura de Brasas', rgb: '255,120,40' },
  { id: 'aura_frost', kind: 'aura', name: 'Aura de Escarcha', rgb: '170,225,255' },
  { id: 'aura_void', kind: 'aura', name: 'Aura del Vacío', rgb: '190,90,255' },
  { id: 'trail_petals', kind: 'trail', name: 'Estela de Pétalos', rgb: '255,150,200' },
  { id: 'trail_stars', kind: 'trail', name: 'Estela de Estrellas', rgb: '255,230,120' },
  { id: 'trail_embers', kind: 'trail', name: 'Estela de Ascuas', rgb: '255,110,40' },
];
const cosProduct = (c) => 'cos_' + c.id;

function premium() {
  if (!SAVE.premium) SAVE.premium = { full: false, owned: [], aura: null, trail: null };
  return SAVE.premium;
}
const isFull = () => !!premium().full;
const ownsCos = (c) => (c.full ? isFull() : premium().owned.includes(c.id));

// ============================================================
// Pagos (RevenueCat)
// ============================================================
const DEV_STORE = /[?&]devstore\b/.test(location.search);
const RC = (() => {
  try { const C = window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins.Purchases; } catch (e) { return null; }
})();
const STORE = { ready: false, prices: {}, products: {}, busy: false };
const storeAvailable = () => DEV_STORE || STORE.ready;

function applyCustomerInfo(ci) {
  if (!ci) return;
  const ids = ci.allPurchasedProductIdentifiers || [];
  const pr = premium();
  pr.full = !!(ci.entitlements && ci.entitlements.active && ci.entitlements.active.full) || ids.includes(STORE_CFG.fullId);
  pr.owned = COSMETICS.filter((c) => !c.full && ids.includes(cosProduct(c))).map((c) => c.id);
  if (pr.aura && !ownsCos(COSMETICS.find((c) => c.id === pr.aura))) pr.aura = null;
  if (pr.trail && !ownsCos(COSMETICS.find((c) => c.id === pr.trail))) pr.trail = null;
  persist();
}
async function storeInit() {
  if (!RC || !STORE_CFG.revenuecatKey) return;
  try {
    await RC.configure({ apiKey: STORE_CFG.revenuecatKey });
    STORE.ready = true;
    const ids = [STORE_CFG.fullId, ...COSMETICS.filter((c) => !c.full).map(cosProduct)];
    const { products } = await RC.getProducts({ productIdentifiers: ids, type: 'inapp' });
    for (const p of products || []) { STORE.products[p.identifier] = p; STORE.prices[p.identifier] = p.priceString; }
    const { customerInfo } = await RC.getCustomerInfo();
    applyCustomerInfo(customerInfo);
  } catch (e) { console.warn('Tienda no disponible', e); }
  if (state === 'premium') buildPremium();
}
async function storeBuy(productId) {
  if (STORE.busy) return;
  if (DEV_STORE && !STORE.ready) { // compra simulada para probar en el navegador
    const pr = premium();
    if (productId === STORE_CFG.fullId) pr.full = true;
    else { const c = COSMETICS.find((x) => cosProduct(x) === productId); if (c && !pr.owned.includes(c.id)) pr.owned.push(c.id); }
    persist(); purchaseDone(productId); return;
  }
  const product = STORE.products[productId];
  if (!product) { premiumMsg('Este producto aún no está disponible en la tienda.', false); return; }
  STORE.busy = true; buildPremium();
  try {
    const { customerInfo } = await RC.purchaseStoreProduct({ product });
    applyCustomerInfo(customerInfo);
    purchaseDone(productId);
  } catch (e) {
    if (!(e && (e.userCancelled || e.code === '1'))) premiumMsg('No se pudo completar la compra. Inténtalo de nuevo.', false);
  }
  STORE.busy = false; buildPremium();
}
async function storeRestore() {
  if (!STORE.ready) { premiumMsg('Las compras se restauran desde la app de Android.', false); return; }
  STORE.busy = true; buildPremium();
  try { const { customerInfo } = await RC.restorePurchases(); applyCustomerInfo(customerInfo); premiumMsg('Compras restauradas.'); }
  catch (e) { premiumMsg('No se pudieron restaurar las compras.', false); }
  STORE.busy = false; buildPremium();
}
function purchaseDone(productId) {
  SFX.play('legend');
  if (productId === STORE_CFG.fullId) {
    if (!premium().aura) premium().aura = 'aura_founder';
    persist();
    premiumMsg('¡Gracias! La Edición Completa ya es tuya: los cinco mundos y la Mazmorra están abiertos.');
  } else {
    const c = COSMETICS.find((x) => cosProduct(x) === productId);
    if (c) { premium()[c.kind] = c.id; persist(); premiumMsg(`${c.name} desbloqueada y equipada.`); }
  }
  buildPremium();
}
const priceOf = (id) => STORE.prices[id] || (DEV_STORE ? 'prueba' : '');

// ============================================================
// Nube (Supabase): código por email y una fila por cuenta en public.saves
// ============================================================
const CLOUD_KEY = 'fendaria.cloud';
let cloud = (() => { try { return JSON.parse(localStorage.getItem(CLOUD_KEY) || 'null'); } catch (e) { return null; } })() || {};
const cloudOn = () => !!(cloud.session && cloud.session.access_token);
const cloudReady = () => !!CLOUD_CFG.key;
function cloudSave() { try { localStorage.setItem(CLOUD_KEY, JSON.stringify(cloud)); } catch (e) { /* ignorar */ } }

async function sb(path, o = {}) {
  const headers = Object.assign({ apikey: CLOUD_CFG.key, 'content-type': 'application/json' }, o.headers || {});
  if (o.auth) headers.Authorization = 'Bearer ' + cloud.session.access_token;
  const r = await fetch(CLOUD_CFG.url + path, { method: o.method || 'GET', headers, body: o.body ? JSON.stringify(o.body) : undefined });
  const txt = await r.text();
  const data = txt ? JSON.parse(txt) : null;
  if (!r.ok) throw new Error((data && (data.msg || data.message || data.error_description)) || 'HTTP ' + r.status);
  return data;
}
function setSession(s) {
  cloud.session = { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600) };
  cloud.user = { id: s.user.id, email: s.user.email };
  cloudSave();
}
async function ensureToken() {
  if (cloud.session.expires_at * 1000 > Date.now() + 60000) return;
  setSession(await sb('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: cloud.session.refresh_token } }));
}
async function cloudSendCode(email) {
  await sb('/auth/v1/otp', { method: 'POST', body: { email, create_user: true } });
  cloud.pending = email; cloudSave();
}
async function cloudVerify(code) {
  setSession(await sb('/auth/v1/verify', { method: 'POST', body: { type: 'email', email: cloud.pending, token: code } }));
  delete cloud.pending; cloud.linked = false; cloudSave();
  cloud.remote = await cloudFetch();
  if (!cloud.remote) await cloudUpload(); // primera vez: la partida de este móvil pasa a la nube
}
async function cloudFetch() {
  await ensureToken();
  const rows = await sb(`/rest/v1/saves?select=data,updated_at&user_id=eq.${cloud.user.id}`, { auth: true });
  return rows && rows[0] ? rows[0] : null;
}
async function cloudUpload() {
  await ensureToken();
  persistLocal();
  await sb('/rest/v1/saves', { method: 'POST', auth: true, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { user_id: cloud.user.id, data: SAVE, updated_at: new Date().toISOString() } });
  cloud.linked = true; cloud.last = Date.now(); delete cloud.remote; cloudSave();
}
async function cloudDownload() {
  const row = cloud.remote || await cloudFetch();
  if (!row) throw new Error('No hay ninguna partida en la nube');
  const pr = premium(); // las compras de este dispositivo no se pierden al cargar
  SAVE = row.data;
  if (!SAVE.slots) SAVE.slots = {};
  const p2 = premium();
  p2.full = p2.full || pr.full; p2.owned = [...new Set([...(p2.owned || []), ...pr.owned])];
  persistLocal();
  cloud.linked = true; cloud.last = Date.now(); delete cloud.remote; cloudSave();
}
function cloudLogout() { cloud = {}; cloudSave(); }

// guardado automático: cada cambio se sube a la nube (como mucho una vez cada 30 s) si la cuenta está vinculada
const persistLocal = persist;
let cloudTimer = null;
persist = function () {
  persistLocal();
  if (!cloudReady() || !cloudOn() || !cloud.linked || cloudTimer) return;
  cloudTimer = setTimeout(() => { cloudTimer = null; cloudUpload().catch(() => { /* sin conexión: se reintenta en el próximo guardado */ }); }, 30000);
};

// ============================================================
// Contenido de pago: mundos 2-5 y la Mazmorra
// ============================================================
// (biomeUnlocked en progress.js y dungeonOpen en dungeon.js ya exigen isFull)
const fullLockHTML = (what) => `<div class="mi-lock full-lock">⭐ ${what} forma parte de la <b>Edición Completa</b>.<br><button class="btn" onclick="openPremium('full')">Ver la Edición Completa</button></div>`;
const _buildMapInfo = buildMapInfo;
buildMapInfo = function () {
  const b = mapView;
  if (b > 0 && superDone(b - 1) && !isFull()) { $('mapInfo').innerHTML = `<h3>${BIOMES[b].name}</h3>${fullLockHTML('Este mundo')}`; return; }
  _buildMapInfo();
};
const _buildDungeon = buildDungeon;
buildDungeon = function () {
  _buildDungeon();
  if (S && S.maxFaille >= 8 && !isFull()) $('dgList').innerHTML = fullLockHTML('La Mazmorra del Cerrajero');
};

// ============================================================
// Cosméticos en el héroe: aura bajo los pies y estela al moverse
// ============================================================
const COS_FX = [];
let cosT = 0;
function drawCosmetics(x, y, moving) {
  if (!SAVE.premium) return;
  const pr = SAVE.premium, dt = Math.min(0.05, Math.max(0, now - cosT)); cosT = now;
  const aura = pr.aura && COSMETICS.find((c) => c.id === pr.aura);
  if (aura) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.42);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = 0.5 + Math.sin(now * 3 + i) * 0.2;
      ctx.rotate(now * (i ? -1.2 : 0.8));
      ctx.setLineDash([10, 7]);
      circle(0, 0, 24 + i * 6, null, `rgba(${aura.rgb},0.95)`, 2.2);
    }
    ctx.restore();
    glow(x, y - 10, 46, aura.rgb, 0.35 + Math.sin(now * 2.5) * 0.08);
    if (Math.random() < 0.3) COS_FX.push({ k: 'dot', x: x + rand(-16, 16), y: y - rand(0, 10), vx: 0, vy: -36, life: 0.9, max: 0.9, rgb: aura.rgb });
  }
  const trail = pr.trail && COSMETICS.find((c) => c.id === pr.trail);
  if (trail && moving && Math.random() < 0.6) {
    const k = trail.id === 'trail_petals' ? 'petal' : trail.id === 'trail_stars' ? 'star' : 'dot';
    COS_FX.push({ k, x: x + rand(-8, 8), y: y - rand(2, 16), vx: rand(-10, 10), vy: k === 'petal' ? rand(4, 14) : rand(-30, -10), life: 1.1, max: 1.1, rgb: trail.rgb, r: rand(0, 6) });
  }
  for (let i = COS_FX.length - 1; i >= 0; i--) {
    const f = COS_FX[i];
    f.life -= dt; if (f.life <= 0) { COS_FX.splice(i, 1); continue; }
    f.x += f.vx * dt; f.y += f.vy * dt;
    const a = f.life / f.max;
    if (f.k === 'petal') {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.r + now * 2); ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${f.rgb})`; ctx.beginPath(); ctx.ellipse(0, 0, 3.2, 1.6, 0, 0, TAU); ctx.fill(); ctx.restore();
    } else if (f.k === 'star') {
      ctx.globalAlpha = a; ctx.strokeStyle = `rgb(${f.rgb})`; ctx.lineWidth = 1.4;
      const s = 2 + Math.sin(now * 12 + f.r) * 1.2;
      ctx.beginPath(); ctx.moveTo(f.x - s, f.y); ctx.lineTo(f.x + s, f.y); ctx.moveTo(f.x, f.y - s); ctx.lineTo(f.x, f.y + s); ctx.stroke();
      glow(f.x, f.y, 7, f.rgb, a * 0.8);
    } else glow(f.x, f.y, 7, f.rgb, a);
  }
  ctx.globalAlpha = 1;
}

// ============================================================
// Pantalla de la tienda: Edición Completa · Cosméticos · Nube
// ============================================================
const premEl = document.createElement('div');
premEl.id = 'premium';
premEl.className = 'overlay sheet-ov';
premEl.innerHTML = `<div class="sheet prem">
  <header class="sh-head"><span class="sh-name">⭐ Tienda</span><div id="premTabs" class="sh-tabs"></div>
    <button id="premClose" class="sh-close" style="margin-left:auto" aria-label="Cerrar">✕</button></header>
  <div id="premBody" class="prem-body"></div>
  <div id="premMsg" class="prem-msg"></div>
</div>`;
$('hub').parentNode.appendChild(premEl);
overlays.push('premium');
let premTab = 'full', premPrev = null, premMsgT = null;
const PREM_TABS = [['full', 'Edición Completa'], ['cos', 'Cosméticos'], ['cloud', 'Nube']];

function openPremium(tab) {
  if (state !== 'premium') premPrev = { state, ov: overlays.find((o) => $(o).classList.contains('show')) };
  if (tab) premTab = tab;
  state = 'premium';
  $('premMsg').textContent = '';
  buildPremium();
  showOverlay('premium');
  SFX.play('click');
}
function closePremium() {
  const p = premPrev || { state: 'hub', ov: 'hub' };
  state = p.state;
  if (p.ov === 'map') buildMap(); else if (p.ov === 'hub') buildHub(); else if (p.ov === 'dungeon') buildDungeon();
  showOverlay(p.ov || 'hub');
}
function premiumMsg(t, good = true) {
  const el = $('premMsg');
  el.textContent = t; el.classList.toggle('bad', !good);
  clearTimeout(premMsgT); premMsgT = setTimeout(() => { el.textContent = ''; }, 6000);
}

function buildPremium() {
  $('premTabs').innerHTML = PREM_TABS.map(([k, n]) => `<button data-t="${k}" class="${k === premTab ? 'on' : ''}">${n}</button>`).join('');
  const body = $('premBody'), busy = STORE.busy ? 'disabled' : '';
  if (premTab === 'full') {
    const owned = isFull(), price = priceOf(STORE_CFG.fullId);
    body.innerHTML = `<div class="prem-hero">
      <div class="ph-text"><small>Fendaria · Las Grietas Rúnicas</small><h2>Edición Completa</h2>
        <ul>
          <li>🌍 <b>Cuatro mundos más</b>: Ciénaga Sombría, Glaciar Rúnico, Desierto de Ámbar y Abismo del Vacío, con sus 28 Grietas y sus Súper Jefes</li>
          <li>📖 <b>El Acto I completo</b>: la verdad sobre Maese Ivo y el enfrentamiento con Morvhal</li>
          <li>🗝 <b>La Mazmorra del Cerrajero</b>: 20 pisos, reliquias únicas y la Ruptura de Límite</li>
          <li>✨ <b>Aura del Fundador</b>, exclusiva</li>
          <li>💎 Pago único para todos tus héroes. Sin anuncios ni suscripciones.</li>
        </ul>
        ${owned ? '<div class="prem-owned">✔ Ya tienes la Edición Completa. ¡Gracias por apoyar Fendaria!</div>'
    : `<div class="prem-buy">${storeAvailable() ? `<button class="btn big gold" data-buy="${STORE_CFG.fullId}" ${busy}>Comprar${price ? ' · ' + price : ''}</button>` : '<div class="prem-na">La compra está disponible en la app de Android.</div>'}
            <button class="btn" data-restore ${busy}>Restaurar compras</button></div>`}
      </div>
      <div class="ph-art">${['boss_pantano', 'boss_glaciar', 'boss_desierto', 'boss_abismo'].map((id) => `<img src="${portraitUrl(id)}" alt="">`).join('')}</div>
    </div>`;
  } else if (premTab === 'cos') {
    const pr = premium();
    const card = (c) => {
      const own = ownsCos(c), on = pr[c.kind] === c.id, price = priceOf(cosProduct(c));
      const act = own ? `<button class="btn ${on ? 'on' : ''}" data-equip="${c.id}">${on ? '✔ Equipada' : 'Equipar'}</button>`
        : c.full ? '<span class="cos-tag">Edición Completa</span>'
          : storeAvailable() ? `<button class="btn gold" data-buy="${cosProduct(c)}" ${busy}>${price || 'Comprar'}</button>` : '<span class="cos-tag">En la app</span>';
      return `<div class="cos-card ${on ? 'on' : ''}"><div class="cos-sw ${c.kind}" style="--c:${c.rgb}"></div><b>${c.name}</b>${act}</div>`;
    };
    const sect = (kind, title) => `<h4>${title} <button class="btn mini" data-unequip="${kind}" ${pr[kind] ? '' : 'disabled'}>Quitar</button></h4>
      <div class="cos-grid">${COSMETICS.filter((c) => c.kind === kind).map(card).join('')}</div>`;
    body.innerHTML = `<p class="prem-sub">Solo apariencia: los cosméticos no dan ventaja en combate y los comparten todos tus héroes.</p>${sect('aura', 'Auras')}${sect('trail', 'Estelas')}
      ${storeAvailable() ? `<button class="btn" data-restore ${busy}>Restaurar compras</button>` : ''}`;
  } else {
    let inner;
    if (!cloudReady()) inner = '<p class="prem-sub">El guardado en la nube aún no está configurado en esta versión.</p>';
    else if (!cloudOn()) {
      inner = cloud.pending
        ? `<p>Te hemos enviado un código a <b>${cloud.pending}</b>. Escríbelo aquí:</p>
          <div class="cl-row"><input id="clCode" inputmode="numeric" maxlength="8" placeholder="Código" autocomplete="one-time-code"><button class="btn gold" data-cl="verify">Entrar</button></div>
          <button class="btn mini" data-cl="restart">Usar otro email</button>`
        : `<p>Guarda tus héroes en la nube y continúa en otro móvil. Escribe tu email y te mandaremos un código para entrar (sin contraseña).</p>
          <div class="cl-row"><input id="clEmail" type="email" placeholder="tu@email.com" autocomplete="email"><button class="btn gold" data-cl="send">Enviar código</button></div>`;
    } else if (cloud.remote) {
      const d = new Date(cloud.remote.updated_at), n = Object.values(cloud.remote.data.slots || {}).filter(Boolean).length;
      inner = `<p>Ya hay una partida en la nube para <b>${cloud.user.email}</b> (${n} héroe${n === 1 ? '' : 's'}, guardada el ${d.toLocaleString()}).</p>
        <div class="cl-row"><button class="btn gold" data-cl="down">Cargar la de la nube</button><button class="btn" data-cl="up">Subir la de este móvil</button></div>
        <p class="prem-sub">La que no elijas se sobrescribe.</p>`;
    } else {
      inner = `<p>Conectado como <b>${cloud.user.email}</b>.</p>
        <p class="prem-sub">${cloud.linked ? `Tu partida se guarda sola en la nube.${cloud.last ? ' Última copia: ' + new Date(cloud.last).toLocaleString() + '.' : ''}` : 'Elige qué partida conservar.'}</p>
        <div class="cl-row"><button class="btn gold" data-cl="up">Guardar ahora</button><button class="btn" data-cl="check">Cargar de la nube</button><button class="btn mini" data-cl="out">Cerrar sesión</button></div>`;
    }
    body.innerHTML = `<div class="cloud">${inner}</div>`;
  }
}

premEl.addEventListener('click', async (ev) => {
  const t = ev.target.closest('button');
  if (!t) return;
  if (t.id === 'premClose') { SFX.play('click'); closePremium(); return; }
  if (t.dataset.t) { premTab = t.dataset.t; SFX.play('click'); buildPremium(); return; }
  if (t.dataset.buy) { storeBuy(t.dataset.buy); return; }
  if ('restore' in t.dataset) { storeRestore(); return; }
  const pr = premium();
  if (t.dataset.equip) { const c = COSMETICS.find((x) => x.id === t.dataset.equip); pr[c.kind] = pr[c.kind] === c.id ? null : c.id; persist(); SFX.play('click'); buildPremium(); return; }
  if (t.dataset.unequip) { pr[t.dataset.unequip] = null; persist(); SFX.play('click'); buildPremium(); return; }
  const cl = t.dataset.cl;
  if (!cl) return;
  t.disabled = true;
  try {
    if (cl === 'send') { const e = $('clEmail').value.trim(); if (!/^\S+@\S+\.\S+$/.test(e)) throw new Error('Escribe un email válido'); await cloudSendCode(e); }
    else if (cl === 'verify') await cloudVerify($('clCode').value.trim());
    else if (cl === 'restart') { delete cloud.pending; cloudSave(); }
    else if (cl === 'up') { await cloudUpload(); premiumMsg('Partida guardada en la nube.'); }
    else if (cl === 'check') { cloud.remote = await cloudFetch(); if (!cloud.remote) premiumMsg('Aún no hay ninguna partida en la nube.', false); }
    else if (cl === 'down') { await cloudDownload(); premiumMsg('Partida cargada desde la nube.'); premPrev = { state: 'title', ov: 'title' }; setTimeout(() => { closePremium(); showTitle(); }, 900); }
    else if (cl === 'out') cloudLogout();
  } catch (e) { premiumMsg(e.message || 'Error de conexión', false); }
  buildPremium();
});
window.addEventListener('keydown', (e) => { if (state === 'premium' && e.key === 'Escape') closePremium(); });
try {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App) App.addListener('backButton', () => { if (state === 'premium') closePremium(); });
} catch (e) { /* entorno web */ }

// Botón de la tienda en la villa
$('btnChange').insertAdjacentHTML('afterend', '<button id="btnPremium" class="hbtn">⭐<span>Tienda</span></button>');
$('btnPremium').addEventListener('click', () => openPremium(isFull() ? 'cos' : 'full'));

storeInit();
