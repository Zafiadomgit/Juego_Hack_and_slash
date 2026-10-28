/* Fendaria — Herrería de Tobías: refinar (+1…+10), ascender de calidad, reforjar y desguazar.
 * Los objetos guardan sus stats originales en `base`; los stats efectivos se recalculan con el refinado,
 * así que fichas, comparaciones, Poder y equipamiento rápido funcionan sin cambios.
 * Moneda: ámbar + Fragmentos de mineral (S.frag), que salen de desguazar equipo.
 */
'use strict';

const REFINE_MAX = 10;
const REFINE_STEP = 0.1;                                   // +10% de stats por nivel de refinado
const REFINE_CHANCE = [1, 1, 1, 1, 1, 0.85, 0.7, 0.55, 0.42, 0.3, 0.25, 0.22, 0.2, 0.18, 0.15]; // probabilidad de pasar de +n a +n+1
const FRAG_SALVAGE = [1, 3, 8, 20, 60]; // el último: reliquias únicas                        // fragmentos al desguazar según calidad
const FRAG_SVG = '<img class="pico-ui cur" src="img/icons/frag.png" width="18" height="18" alt="" aria-hidden="true">';
const frags = () => (S && S.frag) || 0;

// ---------- Modelo ----------
function itemBase(it) {
  if (!it.base) it.base = { ...it.stats };
  return it.base;
}
function applyRefine(it) {
  const b = itemBase(it), k = 1 + REFINE_STEP * (it.refine || 0);
  it.stats = {};
  for (const [s, v] of Object.entries(b)) it.stats[s] = Math.max(1, Math.round(v * k));
  it.name = it.name.replace(/ \+\d+$/, '') + (it.refine ? ' +' + it.refine : '');
}
const refineCost = (it) => {
  const r = it.refine || 0;
  return { amber: Math.round((40 + it.level * 8) * (1 + it.rarity) * Math.pow(r + 1, 1.45) / 10) * 10, frag: (r + 1) * (1 + it.rarity) };
};
const ascendCost = (it) => ({ amber: Math.round((150 + it.level * 25) * Math.pow(it.rarity + 1, 2) / 10) * 10, frag: 12 * Math.pow(it.rarity + 1, 2) });
const reforgeCost = (it) => ({ amber: Math.round((30 + it.level * 5) * (1 + it.rarity) / 10) * 10, frag: 4 * (1 + it.rarity) });
const canPay = (c) => S.kamas >= c.amber && frags() >= c.frag;
function payCost(c) {
  if (!canPay(c)) { showToast('shopToast', S.kamas < c.amber ? "You don't have enough amber" : "You're missing Shards: salvage gear you don't use", false); SFX.play('hurt'); return false; }
  S.kamas -= c.amber; S.frag = frags() - c.frag;
  return true;
}
const costHTML = (c) => `${AMBER_SVG} ${fmtNum(c.amber)} · ${FRAG_SVG} ${c.frag}`;

// Objetos con los que se puede trabajar: primero lo equipado, después la bolsa
function forgeItems() {
  const out = [];
  for (const s of SLOTS) if (S.equip[s]) out.push({ ref: 'e:' + s, it: S.equip[s], where: "Equipped" });
  S.bag.forEach((it, i) => out.push({ ref: 'b:' + i, it, where: "Bag" }));
  return out;
}
function forgeGet(ref) {
  const [w, k] = ref.split(':');
  return w === 'e' ? S.equip[k] : S.bag[+k];
}
function forgeDone(msg, good = true, sfx = 'level') {
  if (P) recalc();
  persist();
  showToast('shopToast', msg, good);
  SFX.play(sfx);
  buildShop();
}

// ---------- Acciones ----------
function doRefine(ref) {
  const it = forgeGet(ref);
  if (!it || (it.refine || 0) >= refineMax()) return;
  const c = refineCost(it), r = it.refine || 0;
  if (!payCost(c)) return;
  if (Math.random() < REFINE_CHANCE[r]) {
    it.refine = r + 1; applyRefine(it);
    forgeDone(`${it.name}! (+${Math.round(REFINE_STEP * 100 * it.refine)}% stats)`, true, it.refine >= 7 ? 'legend' : 'level');
  } else forgeDone(`The refine failed… (${Math.round(REFINE_CHANCE[r] * 100)}% success). The item wasn't damaged`, false, 'hurt');
}
function doAscend(ref) {
  const it = forgeGet(ref);
  if (!it || it.rarity >= 3 || it.set || it.unique) return;
  if (!payCost(ascendCost(it))) return;
  const b = itemBase(it), k = RARITY[it.rarity + 1].mul / RARITY[it.rarity].mul;
  for (const s of Object.keys(b)) b[s] = Math.max(1, Math.round(b[s] * (s === 'crit' || s === 'res' ? Math.min(k, 1.35) : k)));
  // una propiedad nueva si la calidad superior tiene más
  const need = RARITY[it.rarity + 1].affixes - RARITY[it.rarity].affixes;
  const free = AFFIX_POOL.filter((s) => !(s in b));
  for (let i = 0; i < need && free.length; i++) {
    const s = free.splice(Math.floor(Math.random() * free.length), 1)[0];
    b[s] = Math.max(1, Math.round(STAT_INFO[s].base * (1 + it.level * 0.45) * RARITY[it.rarity + 1].mul * (s === 'crit' || s === 'res' ? 0.5 : 1)));
  }
  it.rarity++;
  it.value = Math.round(it.value * k);
  applyRefine(it);
  forgeDone(`${it.name} is now ${RARITY[it.rarity].name}`, true, 'legend');
}
function doReforge(ref) {
  const it = forgeGet(ref);
  if (!it || it.set || it.unique) return;
  if (!payCost(reforgeCost(it))) return;
  const fresh = makeItem(S.cls, it.level, it.rarity, { slot: it.slot });
  it.base = { ...fresh.stats };
  applyRefine(it);
  forgeDone("Properties reforged", true, 'loot');
}
function doSalvage(ref) {
  const [w, k] = ref.split(':');
  if (w !== 'b') return;
  const it = S.bag[+k];
  if (!it) return;
  S.bag.splice(+k, 1);
  const n = FRAG_SALVAGE[it.unique ? 4 : it.rarity] * (1 + (it.refine || 0) * 0.5);
  S.frag = frags() + Math.round(n);
  forgeDone(`+${Math.round(n)} Shards`, true, 'coin');
}
function salvageUpTo(maxRarity) {
  let n = 0, got = 0;
  S.bag = S.bag.filter((it) => {
    if (it.rarity > maxRarity || it.set || it.unique) return true;
    n++; got += FRAG_SALVAGE[it.rarity] * (1 + (it.refine || 0) * 0.5);
    return false;
  });
  if (!n) { showToast('shopToast', "No items of that quality in the bag", false); return; }
  S.frag = frags() + Math.round(got);
  forgeDone(`${n} items salvaged · +${Math.round(got)} Shards`, true, 'coin');
}

// ---------- Interfaz (se integra en la tienda) ----------
const SMITH_TABS = { refine: 1, ascend: 1, reforge: 1, salvage: 1 };
function smithOffer(o, it, extra) {
  const R = RARITY[it.rarity], rgb = RARITY_RGB[it.rarity];
  return offerHTML(Object.assign({ icon: itemSVG(it, 40), rc: R.color, rb: `rgba(${rgb},.45)`, rg: it.rarity >= 3 ? `rgba(${rgb},.6)` : '',
    name: it.name, nameColor: it.rarity === 3 ? '#ffc37a' : R.color, subColor: R.color }, o, extra));
}
function buildSmith() {
  const offers = [];
  const items = forgeItems();
  if (shopTab === 'refine') {
    for (const { ref, it, where } of items) {
      const r = it.refine || 0, maxed = r >= refineMax(), c = refineCost(it);
      offers.push(smithOffer({ act: 'refine:' + ref, sold: maxed }, it, {
        sub: `${where} · ${RARITY[it.rarity].name} · +${r}/${refineMax()}`,
        desc: maxed ? "Fully refined" : `+${r} → <b style="color:#ffd76a">+${r + 1}</b>: +${Math.round(REFINE_STEP * 100)}% to all its properties · ${Math.round(REFINE_CHANCE[r] * 100)}% success`,
        price: c.amber, can: !maxed && canPay(c), priceHTML: costHTML(c) }));
    }
    $('shopNote').innerHTML = "Up to +5 refining never fails; after that it can fail, but the item is never lost.";
  } else if (shopTab === 'ascend') {
    for (const { ref, it, where } of items) {
      if (it.set || it.unique) continue;
      const maxed = it.rarity >= 3, c = ascendCost(it);
      offers.push(smithOffer({ act: 'ascend:' + ref, sold: maxed }, it, {
        sub: `${where} · ${RARITY[it.rarity].name}`,
        desc: maxed ? "Already Legendary" : `${RARITY[it.rarity].name} → <b style="color:${RARITY[it.rarity + 1].color}">${RARITY[it.rarity + 1].name}</b>: stats ×${(RARITY[it.rarity + 1].mul / RARITY[it.rarity].mul).toFixed(2)}${RARITY[it.rarity + 1].affixes > RARITY[it.rarity].affixes ? " and a new property" : ''}`,
        price: c.amber, can: !maxed && canPay(c), priceHTML: costHTML(c) }));
    }
    $('shopNote').innerHTML = "Raise the quality of your favorite weapons and pieces without waiting for better ones to drop. (Set pieces can't be ascended.)";
  } else if (shopTab === 'reforge') {
    for (const { ref, it, where } of items) {
      if (it.set || it.unique) continue;
      const c = reforgeCost(it);
      const top = Object.entries(it.stats).slice(0, 3).map(([k, v]) => `+${v} ${STAT_INFO[k].name.replace('% ', '')}`).join(' · ');
      offers.push(smithOffer({ act: 'reforge:' + ref }, it, { sub: `${where} · ${RARITY[it.rarity].name}`, desc: `Now: ${top}. All its properties are rerolled (keeps quality, level and refine)`, price: c.amber, can: canPay(c), priceHTML: costHTML(c) }));
    }
    $('shopNote').innerHTML = "Useful for getting the properties that suit your hero best.";
  } else {
    S.bag.forEach((it, i) => {
      const n = Math.round(FRAG_SALVAGE[it.rarity] * (1 + (it.refine || 0) * 0.5));
      offers.push(smithOffer({ act: 'salvage:b:' + i, sold: !!it.set }, it, { sub: `${RARITY[it.rarity].name} · Lv ${it.level}`, desc: it.set ? "Set pieces can't be salvaged" : `Salvage → ${FRAG_SVG} ${n} Shards`, price: 0, can: !it.set, priceHTML: `${FRAG_SVG} +${n}` }));
    });
    if (!S.bag.length) offers.push("<div class=\"smith-empty\">Your bag is empty. Salvage gear you won't use here to get Shards.</div>");
    $('shopNote').innerHTML = "Salvage gear you don't use to get Ore Shards.";
  }
  $('shopAmber').innerHTML = AMBER_SVG + ' ' + fmtNum(S.kamas) + ' &nbsp; ' + FRAG_SVG + ' ' + fmtNum(frags());
  $('btnRestock').style.display = shopTab === 'salvage' ? '' : 'none';
  $('btnRestock').innerHTML = "Salvage commons and rares";
  $('btnRestock').disabled = false;
  $('shopGrid').innerHTML = offers.join('');
  for (const el of $('shopGrid').querySelectorAll('.offer')) el.addEventListener('click', () => shopAction(el.dataset.act));
}

// enganches en la tienda existente
Object.assign(SHOPS, { smith: { title: "Tobias · Blacksmith", tabs: [['refine', "Refine"], ['ascend', "Ascend"], ['reforge', "Reforge"], ['salvage', "Salvage"]] } });
const _buildShop = buildShop;
buildShop = function () {
  if (!SMITH_TABS[shopTab]) { $('btnRestock').onclick = null; return _buildShop(); }
  $('shopTabs').innerHTML = SHOP_TABS.map(([id, label]) => `<button data-tab="${id}" class="${shopTab === id ? 'on' : ''}">${label}</button>`).join('');
  for (const b of $('shopTabs').querySelectorAll('button')) b.addEventListener('click', () => { shopTab = b.dataset.tab; SFX.play('click'); buildShop(); });
  buildSmith();
};
const _shopAction = shopAction;
shopAction = function (act) {
  const i = act.indexOf(':'), kind = act.slice(0, i), ref = act.slice(i + 1);
  if (kind === 'refine') return doRefine(ref);
  if (kind === 'ascend') return doAscend(ref);
  if (kind === 'reforge') return doReforge(ref);
  if (kind === 'salvage') return doSalvage(ref);
  return _shopAction(act);
};
// el botón inferior de la herrería desguaza en bloque (en las otras tiendas renueva existencias)
$('btnRestock').addEventListener('click', (ev) => {
  if (shopKind === 'smith') { ev.stopImmediatePropagation(); salvageUpTo(1); }
}, true);

// precio con icono propio (ámbar + fragmentos)
const _offerHTML = offerHTML;
offerHTML = function (o) {
  const h = _offerHTML(o);
  return o.priceHTML ? h.replace(/<span class="buy([^"]*)">[\s\S]*?<\/span>\s*<\/button>$/, `<span class="buy$1">${o.sold ? "Max" : o.priceHTML}</span>\n  </button>`) : h;
};

// ---------- NPC en Villa Candela ----------
NPCS.push({ id: 'smith', name: "Tobias", title: "Blacksmith", x: 190, y: 380, prompt: "⚒ Talk to Tobias · Refine and upgrade weapons", color: '#ffb070' });
// la villa puede estar ya construida (fondo del menú): Tobías entra también en su lista de objetos
if (VILLAGE.built) { const n = NPCS[NPCS.length - 1]; VILLAGE.props.push({ kind: 'npc', x: n.x, y: n.y, npc: n }); VILLAGE.solids.push({ x: n.x, y: n.y, r: 16 }); }
