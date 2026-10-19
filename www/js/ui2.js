/* Fendaria — interfaz 2.ª generación: iconos pintados (equipo, gemas, mundos), venta en lote y mapa.
 * Iconos: img/items/<tipo>.png (común/raro) y <tipo>_b.png (épico/legendario), img/gems/<gema>.png, img/worlds/<mundo>.png.
 * Si un icono no existe se usa el dibujo vectorial de siempre.
 */
'use strict';

const ITEM_ICONS = ['axe', 'bow', 'staff', 'dagger', 'druid', 'launcher', 'greatsword', 'helm', 'cape', 'amulet', 'ring', 'boots', 'belt'];
const ITEM_KIND_ICON = { axe: 'axe', bow: 'bow', staff: 'staff', dagger: 'dagger', launcher: 'launcher', greatsword: 'greatsword', helm: 'helm', cape: 'cape', amulet: 'amulet', ring: 'ring', boots: 'boots', belt: 'belt' };
const iconOK = {};
function probe(url) { if (url in iconOK) return iconOK[url]; iconOK[url] = false; const im = new Image(); im.onload = () => { iconOK[url] = true; }; im.src = url; return false; }
for (const k of ITEM_ICONS) { probe(`img/items/${k}.png`); probe(`img/items/${k}_b.png`); }
for (const k of Object.keys(GEMS)) probe(`img/gems/${k}.png`);
for (const b of BIOMES) probe(`img/worlds/${b.id}.png`);

function itemIconURL(it) {
  let k = ITEM_KIND_ICON[itemKind(it)];
  if (it.slot === 'arma' && S && S.cls === 'domadora') k = 'druid';
  if (!k) return null;
  const hi = it.rarity >= 2 && iconOK[`img/items/${k}_b.png`];
  const url = `img/items/${k}${hi ? '_b' : ''}.png`;
  return iconOK[url] ? url : null;
}
const _itemSVG = itemSVG;
itemSVG = function (it, size = 48) {
  const html = _itemSVG(it, size);
  if (it.unique && html.startsWith('<img')) return html; // reliquias: icono propio
  const url = itemIconURL(it);
  if (!url) return html;
  return `<img class="pico" src="${url}" width="${size}" height="${size}" alt="" aria-hidden="true">`;
};
const _slotSVG = slotSVG;
slotSVG = function (slot, size = 40) {
  const k = slot === 'arma' ? (S.cls === 'domadora' ? 'druid' : ITEM_KIND_ICON[WEAPON_KIND[S.cls]]) : ITEM_KIND_ICON[SLOT_KIND[slot]];
  const url = `img/items/${k}.png`;
  if (!iconOK[url]) return _slotSVG(slot, size);
  return `<img class="pico ghost" src="${url}" width="${size}" height="${size}" alt="" aria-hidden="true">`;
};
function gemImg(k, size, owned = true) {
  const url = `img/gems/${k}.png`;
  if (!iconOK[url]) return iconSVGColor(owned ? GEMS[k].color : '#3a3f55', size);
  return `<img class="pico${owned ? '' : ' ghost'}" src="${url}" width="${size}" height="${size}" alt="" aria-hidden="true">`;
}
const worldImg = (b, size) => (iconOK[`img/worlds/${b.id}.png`] ? `<img class="wmed" src="img/worlds/${b.id}.png" width="${size}" height="${size}" alt="">` : '');

// ============================================================
// Venta en lote
// ============================================================
let sellMode = false;
const sellSel = new Set();
const isProtected = (it) => !!(it.unique || it.set);
const sellTotal = () => [...sellSel].reduce((s, i) => s + (S.bag[i] ? S.bag[i].value : 0), 0);
function selectBy(fn) {
  sellSel.clear();
  S.bag.forEach((it, i) => { if (!isProtected(it) && fn(it)) sellSel.add(i); });
  SFX.play('click');
  buildInventory();
}
const _buildInventoryU = buildInventory;
buildInventory = function (justEquipped) {
  _buildInventoryU(justEquipped);
  const acts = document.querySelector('#inv .bag-actions');
  if (!acts) return;
  if (!sellMode) {
    if (!$('btnSellMode')) {
      acts.innerHTML = `<button id="btnAutoEquip" class="sh-sell auto">⚡ Equipar lo mejor</button><button id="btnSellMode" class="sh-sell">🪙 Vender varios</button>`;
      $('btnAutoEquip').onclick = autoEquip;
      _buildInventoryU(justEquipped); // repinta el aviso de mejoras en el botón nuevo
    }
    $('btnSellMode').onclick = () => { sellMode = true; sellSel.clear(); SFX.play('click'); buildInventory(); };
    return;
  }
  // modo venta: tocar selecciona en vez de abrir la ficha
  for (const el of $('bagGrid').querySelectorAll('button.cell')) {
    const i = +el.dataset.i, nel = el.cloneNode(true);
    nel.classList.toggle('picked', sellSel.has(i));
    if (isProtected(S.bag[i])) nel.classList.add('prot');
    nel.insertAdjacentHTML('beforeend', '<i class="chk">✔</i>');
    nel.onclick = () => { if (sellSel.has(i)) sellSel.delete(i); else sellSel.add(i); SFX.play('click'); buildInventory(); };
    el.replaceWith(nel);
  }
  const n = sellSel.size, tot = sellTotal();
  acts.innerHTML = `<button id="btnAutoEquip" hidden></button><div class="sell-bar">
      <div class="sell-chips"><span>Elegir:</span>
        <button data-q="0">Comunes</button><button data-q="1">Raros o menos</button><button data-q="w">Peores que lo mío</button><button data-q="all">Todo</button><button data-q="none">Ninguno</button></div>
      <div class="sell-go"><button id="btnSellCancel" class="sh-sell">Cancelar</button>
        <button id="btnSellDo" class="sh-sell auto" ${n ? '' : 'disabled'}>Vender ${n} · ${AMBER_SVG} ${fmtNum(tot)}</button></div>
    </div>`;
  for (const b of acts.querySelectorAll('[data-q]')) b.onclick = () => {
    const q = b.dataset.q;
    if (q === 'none') { sellSel.clear(); buildInventory(); }
    else if (q === 'all') selectBy(() => true);
    else if (q === 'w') selectBy((it) => itemPower(it) <= itemPower(S.equip[it.slot]));
    else selectBy((it) => it.rarity <= +q);
  };
  $('btnSellCancel').onclick = () => { sellMode = false; sellSel.clear(); SFX.play('click'); acts.innerHTML = ''; buildInventory(); };
  $('btnSellDo').onclick = () => {
    if (!sellSel.size) return;
    const gain = sellTotal(), cnt = sellSel.size;
    S.bag = S.bag.filter((it, i) => !sellSel.has(i));
    S.kamas += gain;
    sellSel.clear(); sellMode = false; acts.innerHTML = '';
    SFX.play('coin');
    persist();
    buildInventory();
    showToast('shToast', `Vendidos ${cnt} objetos · +${fmtNum(gain)} ámbar`);
  };
};
const _closeInventoryU = closeInventory;
closeInventory = function () { sellMode = false; sellSel.clear(); return _closeInventoryU(); };
$('btnInvClose').removeEventListener('click', _closeInventoryU); $('btnInvClose').addEventListener('click', () => closeInventory());

// ============================================================
// Mapa: medallones de los mundos y retratos de los jefes
// ============================================================
const _buildMapU = buildMap;
buildMap = function () {
  _buildMapU();
  const tabs = $('mapTabs');
  for (const t of tabs.querySelectorAll('button[data-b]')) {
    const b = BIOMES[+t.dataset.b], un = biomeUnlocked(+t.dataset.b);
    t.innerHTML = `${worldImg(b, 30)}<span>${un ? b.name : '🔒 ' + b.name}</span>`;
    t.classList.add('wtab');
  }
  const B = BIOMES[mapView];
  const boss = $('mapField').querySelector('.mnode.boss');
  if (boss && !boss.classList.contains('lock')) boss.innerHTML = `<img src="img/portraits/boss_${B.id}.webp" alt="">` + (boss.querySelector('.pips') ? boss.querySelector('.pips').outerHTML : '');
  const sel = tabs.querySelector('.on'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
};
