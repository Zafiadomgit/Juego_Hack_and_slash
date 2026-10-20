/* Fendaria — Herrería 2: que valga la pena ir a Tobías.
 *  · Forjar: armas épicas o legendarias por encima de tu nivel con una Runa de forja (efecto que nunca cae en las Grietas).
 *  · Las runas crecen con el refinado (+10% por nivel) y «despiertan» a +10 (×1,5).
 *  · Transferir: el refinado pasa de una pieza a otra del mismo hueco (lo invertido no se pierde).
 *  · Reforjar: ves el resultado y eliges quedártelo o conservar el anterior.
 */
'use strict';

const FORGE_RUNES = {
  brasa: { name: 'Runa de Brasa', icon: '🔥', color: '#ff7a3a', d: (k) => `Tus golpes queman: ${Math.round(30 * k)}% del daño extra en 3 s` },
  escarcha: { name: 'Runa de Escarcha', icon: '❄', color: '#9fe0ff', d: (k) => `${Math.round(20 * k)}% de probabilidad de congelar (ralentiza 2 s)` },
  sangre: { name: 'Runa de Sangre', icon: '🩸', color: '#ff4a5a', d: (k) => `Robas un ${(3 * k).toFixed(1)}% del daño como vida` },
  eco: { name: 'Runa del Eco', icon: '✦', color: '#d7b4ff', d: (k) => `${Math.round(12 * k)}% de probabilidad de golpear dos veces` },
  tormenta: { name: 'Runa de Tormenta', icon: '⚡', color: '#ffe46a', d: (k) => `Cada 6 golpes, un rayo salta a 3 enemigos (${Math.round(60 * k)}% del daño)` },
  verdugo: { name: 'Runa del Verdugo', icon: '💀', color: '#e0d6a8', d: (k) => `+${Math.round(40 * k)}% de daño a enemigos con menos del 30% de vida` },
};
const runeK = (it) => (1 + 0.1 * (it.refine || 0)) * ((it.refine || 0) >= 10 ? 1.5 : 1);
const runeLine = (it) => { const R = FORGE_RUNES[it.rune]; return `<span style="color:${R.color}">${R.icon} <b>${R.name}</b>${(it.refine || 0) >= 10 ? ' · despierta' : ''}</span>: ${R.d(runeK(it))}`; };

// ---------- Efectos en combate (solo el arma equipada) ----------
let runeHits = 0;
const _damageEnemyR = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  const w = S && S.equip && S.equip.arma, rn = w && w.rune && !o.rune ? w.rune : null;
  if (!rn || e.dead || !P) return _damageEnemyR(e, base, o);
  const k = runeK(w);
  if (rn === 'verdugo' && e.hp < e.maxHp * 0.3) base *= 1 + 0.4 * k;
  const hp0 = e.hp;
  const r = _damageEnemyR(e, base, o);
  const dealt = Math.max(0, hp0 - Math.max(0, e.hp));
  if (rn === 'sangre') P.hp = Math.min(P.maxHp, P.hp + dealt * 0.03 * k);
  else if (rn === 'brasa' && !e.dead) { e.dot = { t: 3, dps: Math.max(1, dealt * 0.3 * k / 3), tick: 0.5 }; if (Math.random() < 0.3) sparks(e.x, e.y - 14, 4, '#ff8a3a', 120); }
  else if (rn === 'escarcha' && !e.dead && Math.random() < 0.2 * k) { e.slowT = Math.max(e.slowT || 0, 2); sparks(e.x, e.y - 14, 8, '#bfefff', 160); }
  else if (rn === 'eco' && !e.dead && Math.random() < 0.12 * k) later(0.09, () => { if (!e.dead) { _damageEnemyR(e, base * 0.8, Object.assign({}, o, { rune: 1 })); sparks(e.x, e.y - 16, 6, '#d7b4ff', 180); } });
  else if (rn === 'tormenta' && ++runeHits % 6 === 0) {
    const near = enemies.filter((q) => !q.dead && q !== e && dist(q.x, q.y, e.x, e.y) < 240).sort((a, b) => dist(a.x, a.y, e.x, e.y) - dist(b.x, b.y, e.x, e.y)).slice(0, 3);
    let px = e.x, py = e.y;
    for (const q of near) {
      bolts.push({ x0: px, y0: py - 16, x1: q.x, y1: q.y - 16, life: 0.18, max: 0.18 });
      _damageEnemyR(q, base * 0.6 * k, { quiet: true, color: '#ffe46a', rune: 1 });
      px = q.x; py = q.y;
    }
    if (near.length) SFX.play('magic');
  }
  return r;
};
// rayos de la Runa de Tormenta (se dibujan con los destellos)
const bolts = [];
const _drawFlashesR = drawFlashes;
drawFlashes = function () {
  _drawFlashesR();
  if (!bolts.length) return;
  const dt = 1 / 60;
  ctx.save(); ctx.lineCap = 'round';
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i]; b.life -= dt;
    if (b.life <= 0) { bolts.splice(i, 1); continue; }
    const a = b.life / b.max, n = 6;
    for (const [w, col] of [[6, `rgba(255,230,110,${0.35 * a})`], [2.2, `rgba(255,255,230,${a})`]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(b.x0, b.y0);
      for (let j = 1; j < n; j++) { const t = j / n; ctx.lineTo(b.x0 + (b.x1 - b.x0) * t + rand(-9, 9), b.y0 + (b.y1 - b.y0) * t + rand(-9, 9)); }
      ctx.lineTo(b.x1, b.y1); ctx.stroke();
    }
  }
  ctx.restore();
};
// el Poder (y «Equipar lo mejor») tiene en cuenta la runa
const _itemPowerR = itemPower;
itemPower = function (it) { const p = _itemPowerR(it); return it && it.rune ? Math.round(p * (1.25 + 0.03 * (it.refine || 0))) : p; };

// ---------- Forjar ----------
const masterLevel = () => Math.max(S.level + 3, ((S.maxFaille || 1) - 1) * 2 + 9);
const masterCost = (rar) => {
  const L = masterLevel();
  return rar === 3 ? { amber: Math.round((1200 + L * 90) / 10) * 10, frag: 60 + L * 2 } : { amber: Math.round((450 + L * 40) / 10) * 10, frag: 22 + L };
};
function doForge(rar) {
  const c = masterCost(rar);
  if (!canPay(c)) { payCost(c); return; }
  const opts = Object.keys(FORGE_RUNES).sort(() => Math.random() - 0.5).slice(0, 3);
  openChoice({ icon: '⚒', title: 'Elige la runa', sub: rar === 3 ? 'Arma legendaria de Tobías' : 'Arma épica de Tobías', quote: 'Una runa por arma, chaval. Elige bien: no se cambia.', color: '#ffb070' },
    opts.map((k) => ({ id: k, tag: 'Runa de forja', icon: FORGE_RUNES[k].icon, name: FORGE_RUNES[k].name, d: FORGE_RUNES[k].d(1), color: FORGE_RUNES[k].color })),
    (o) => {
      if (!payCost(c)) return;
      const it = makeItem(S.cls, masterLevel(), rar, { slot: 'arma', name: 'de Tobías' });
      for (const s of Object.keys(it.stats)) it.stats[s] = Math.max(1, Math.round(it.stats[s] * 1.15)); // obra maestra: +15%
      it.base = { ...it.stats }; it.rune = o.id; it.forged = true; it.refine = 0;
      it.value = Math.round(it.value * 1.5);
      S.bag.push(it);
      forgeDone(`¡${it.name} forjada! Está en tu bolsa (${FORGE_RUNES[o.id].name})`, true, 'legend');
    });
}

// ---------- Transferir refinado ----------
function transferPairs() {
  const out = [];
  for (const s of SLOTS) {
    const eq = S.equip[s];
    S.bag.forEach((b, i) => {
      if (b.slot !== s) return;
      if (eq && (eq.refine || 0) > (b.refine || 0)) out.push({ from: 'e:' + s, to: 'b:' + i, a: eq, b });
      if (eq && (b.refine || 0) > (eq.refine || 0)) out.push({ from: 'b:' + i, to: 'e:' + s, a: b, b: eq });
    });
  }
  return out;
}
const transferCost = (r) => ({ amber: 60 * r, frag: 2 * r });
function doTransfer(from, to) {
  const a = forgeGet(from), b = forgeGet(to);
  if (!a || !b || (a.refine || 0) <= (b.refine || 0)) return;
  const r = a.refine || 0;
  if (!payCost(transferCost(r))) return;
  b.refine = r; a.refine = 0;
  applyRefine(a); applyRefine(b);
  forgeDone(`Refinado +${r} trasladado a ${b.name}`, true, 'legend');
}

// ---------- Reforjar con elección ----------
doReforge = function (ref) {
  const it = forgeGet(ref);
  if (!it || it.set || it.unique) return;
  if (!payCost(reforgeCost(it))) return;
  const old = { ...itemBase(it) };
  const fresh = makeItem(S.cls, it.level, it.rarity, { slot: it.slot });
  const k = 1 + REFINE_STEP * (it.refine || 0), show = (b) => Object.entries(b).map(([s, v]) => `+${Math.round(v * k)} ${STAT_INFO[s].name.replace('% ', '')}`).join(' · ');
  const pw = (b) => _itemPowerR({ stats: b });
  persist();
  openChoice({ icon: '⚒', title: 'Reforja', sub: it.name, quote: 'Mira el metal, chaval. ¿Te lo quedas?', color: '#ffb070' }, [
    { id: 'new', tag: pw(fresh.stats) >= pw(old) ? '▲ Nueva' : '▼ Nueva', icon: '✨', name: 'Quedarme la nueva', d: show(fresh.stats), color: pw(fresh.stats) >= pw(old) ? '#7cff8a' : '#ff8a65' },
    { id: 'old', tag: 'Anterior', icon: '↩', name: 'Conservar la anterior', d: show(old), color: '#8d90a8' },
  ], (o) => {
    if (o.id === 'new') { it.base = { ...fresh.stats }; applyRefine(it); forgeDone('Propiedades reforjadas', true, 'loot'); }
    else forgeDone('Te quedas con las propiedades anteriores', true, 'click');
  });
};

// ---------- Pestañas nuevas en la herrería ----------
SHOPS.smith.tabs = [['forge', 'Forjar'], ['refine', 'Refinar'], ['transfer', 'Pasar'], ['ascend', 'Ascender'], ['reforge', 'Reforjar'], ['salvage', 'Desguazar']];
Object.assign(SMITH_TABS, { forge: 1, transfer: 1 });
const _buildSmithR = buildSmith;
buildSmith = function () {
  if (shopTab !== 'forge' && shopTab !== 'transfer') { _buildSmithR(); decorateRunes(); return; }
  const offers = [];
  if (shopTab === 'forge') {
    const L = masterLevel(), cur = S.equip.arma;
    for (const rar of [2, 3]) {
      const c = masterCost(rar), R = RARITY[rar];
      const sample = { slot: 'arma', rarity: rar, level: L, stats: {}, name: '' };
      offers.push(offerHTML({ act: 'forge:' + rar, icon: itemSVG(sample, 40), rc: R.color, rb: `rgba(${RARITY_RGB[rar]},.45)`, rg: rar === 3 ? `rgba(${RARITY_RGB[3]},.6)` : '',
        name: `Arma ${rar === 3 ? 'legendaria' : 'épica'} de Tobías`, nameColor: rar === 3 ? '#ffc37a' : R.color, sub: `Nivel ${L} · obra maestra +15%`, subColor: R.color,
        desc: `Por encima de lo que cae en tus Grietas${cur ? ` (tu arma: nivel ${cur.level})` : ''}. <b style="color:#ffb070">Eliges 1 de 3 Runas de forja</b>: efectos que solo hace Tobías y que crecen con el refinado.`,
        price: c.amber, can: canPay(c), priceHTML: costHTML(c) }));
    }
    offers.push(`<div class="rune-list">${Object.values(FORGE_RUNES).map((R) => `<span style="--c:${R.color}"><i>${R.icon}</i><b>${R.name}</b><small>${R.d(1)}</small></span>`).join('')}</div>`);
    $('shopNote').innerHTML = 'Las runas suben un 10% por cada nivel de refinado y despiertan (×1,5) a +10. Si cambias de arma, pasa el refinado en «Transferir».';
  } else {
    const pairs = transferPairs();
    for (const p of pairs) {
      const r = p.a.refine || 0, c = transferCost(r);
      offers.push(smithOffer({ act: `transfer:${p.from}>${p.to}` }, p.b, { sub: `${p.to[0] === 'e' ? 'Equipado' : 'Bolsa'} · +${p.b.refine || 0} → +${r}`,
        desc: `Recibe el refinado <b style="color:#ffd76a">+${r}</b> de <b>${p.a.name}</b> (que vuelve a +0).`, price: c.amber, can: canPay(c), priceHTML: costHTML(c) }));
    }
    if (!pairs.length) offers.push('<div class="smith-empty">Nada que transferir: necesitas una pieza refinada y otra del mismo hueco (una equipada y otra en la bolsa).</div>');
    $('shopNote').innerHTML = 'Lo invertido en refinar no se pierde al cambiar de equipo.';
  }
  $('shopAmber').innerHTML = AMBER_SVG + ' ' + fmtNum(S.kamas) + ' &nbsp; ' + FRAG_SVG + ' ' + fmtNum(frags());
  $('btnRestock').style.display = 'none';
  $('shopGrid').innerHTML = offers.join('');
  for (const el of $('shopGrid').querySelectorAll('.offer')) el.addEventListener('click', () => shopAction(el.dataset.act));
};
// en Refinar/Reforjar se ve qué hace la runa de cada arma forjada
function decorateRunes() {
  for (const el of $('shopGrid').querySelectorAll('.offer')) {
    const ref = (el.dataset.act || '').split(':').slice(1).join(':'), it = ref && forgeGet(ref);
    if (it && it.rune) el.querySelector('.desc').insertAdjacentHTML('beforeend', `<span class="rune-desc">${runeLine(it)}</span>`);
  }
}
const _shopActionR = shopAction;
shopAction = function (act) {
  const i = act.indexOf(':'), kind = act.slice(0, i), ref = act.slice(i + 1);
  if (kind === 'forge') return doForge(+ref);
  if (kind === 'transfer') { const [a, b] = ref.split('>'); return doTransfer(a, b); }
  return _shopActionR(act);
};

// ---------- Ficha del objeto e iconos ----------
const _showItemCardR = showItemCard;
showItemCard = function (from, key) {
  _showItemCardR(from, key);
  const it = from === 'bag' ? S.bag[key] : S.equip[key], card = $('itemCard');
  if (it && it.rune && card) { const ul = card.querySelector('ul'); if (ul) ul.insertAdjacentHTML('afterend', `<div class="rune-desc">${runeLine(it)}</div>`); }
};
const _itemSVGR = itemSVG;
itemSVG = function (it, size = 48) {
  const h = _itemSVGR(it, size);
  return it && it.rune ? `<span class="runed" style="--c:${FORGE_RUNES[it.rune].color}">${h}<i>${FORGE_RUNES[it.rune].icon}</i></span>` : h;
};

// ---------- Mejoras de Ivo: progreso visible y una recomendada ----------
const _buildShopR = buildShop;
buildShop = function () {
  _buildShopR();
  if (shopKind !== 'alchemist' || shopTab !== 'upgrade') return;
  let best = null, bestP = Infinity;
  for (const el of $('shopGrid').querySelectorAll('.offer[data-act^="up:"]')) {
    const k = el.dataset.act.slice(3), U = UPGRADES[k];
    if (!U) continue;
    const lv = S.up[k] || 0, max = U.max;
    const pips = max <= 15 ? Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('') : `<b style="width:${(lv / max) * 100}%"></b>`;
    el.querySelector('.desc').insertAdjacentHTML('beforeend', `<span class="up-pips${max > 15 ? ' bar' : ''}">${pips}</span>`);
    const price = U.cost(lv);
    if (lv < max && S.kamas >= price && price < bestP) { best = el; bestP = price; }
  }
  if (best) { best.classList.add('reco'); best.insertAdjacentHTML('afterbegin', '<span class="reco-tag">★ Recomendada</span>'); }
};
