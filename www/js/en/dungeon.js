/* Fendaria — Mazmorra, reliquias únicas y Despertar.
 * La Mazmorra tiene pisos (1…20) cada vez más duros: monstruos de nivel superior al de tu mejor Grieta,
 * muchas élites y un Súper Jefe al final. Allí caen Sellos de Gesta y cada piso abre un rango de Despertar de
 * los héroes, y las reliquias únicas: legendarias con un poder especial que no existe en ningún otro sitio.
 */
'use strict';

// ============================================================
// Reliquias únicas
// ============================================================
const UNIQUES = {
  eclipse: { slot: 'arma', name: "of the Eclipse", color: '#ff6a3d', desc: "+25% damage and +8% crit" },
  sangre: { slot: 'arma', name: "Bloody Fang", color: '#e0303a', desc: "Steal 6% of the damage you deal as health" },
  corona: { slot: 'sombrero', name: "Crown of the Ash King", color: '#ffb040', desc: "+30% max HP" },
  manto: { slot: 'capa', name: "Mantle of the Void", color: '#9c5bd8', desc: "-15% damage taken and +12% speed" },
  eco: { slot: 'amuleto', name: "Amulet of Echoes", color: '#5fd0ff', desc: "Your spells recharge 30% faster" },
  verdugo: { slot: 'anillo', name: "Executioner's Ring", color: '#ff4a6a', desc: "Crits deal 60% more damage" },
  viento: { slot: 'botas', name: "Boots of the Endless Wind", color: '#8fe8c0', desc: "+1 dodge and +20% speed" },
  avaro: { slot: 'cinturon', name: "Sash of the Greedy King", color: '#ffd54f', desc: "+60% amber and +40% experience" },
  // Armas legendarias de clase (solo caen para la clase que las usa); mods: dmg, hp, crit, critDmg, cd, armor, speed, ls
  volcan: { slot: 'arma', cls: 'iop', name: "Volcano Axe", color: '#ff5a1f', desc: "+30% damage and +20% max HP", mods: { dmg: 0.3, hp: 0.2 } },
  alba: { slot: 'arma', cls: 'cra', name: "Dawn Bow", color: '#ffe08a', desc: "+30% damage and +12% crit", mods: { dmg: 0.3, crit: 0.12 } },
  milrunas: { slot: 'arma', cls: 'feca', name: "Staff of a Thousand Runes", color: '#5fc8ff', desc: "+30% damage and 25% faster spells", mods: { dmg: 0.3, cd: 0.25 } },
  colmillos: { slot: 'arma', cls: 'sombra', name: "Eclipse Fangs", color: '#c04aff', desc: "+30% damage and 50% stronger crits", mods: { dmg: 0.3, critDmg: 0.5 } },
  cayado: { slot: 'arma', cls: 'domadora', name: "Staff of the Ancient Forest", color: '#7ad85a', desc: "+30% damage, +15% resistance and +10% speed", mods: { dmg: 0.3, armor: 0.15, speed: 0.1 } },
  solar: { slot: 'arma', cls: 'artificiera', name: "Solar Cannon", color: '#ffa23a', desc: "+45% damage", mods: { dmg: 0.45 } },
  mandoble: { slot: 'arma', cls: 'berserker', name: "Claymore of the Fallen King", color: '#e8e8f0', desc: "+30% damage and steal 5% of damage as health", mods: { dmg: 0.3, ls: 0.05 } },
};
// Suma de los modificadores de las reliquias equipadas
function uniqueMods() {
  const m = {};
  if (!S) return m;
  for (const s of SLOTS) {
    const U = S.equip[s] && UNIQUES[S.equip[s].unique];
    if (U && U.mods) for (const [k, v] of Object.entries(U.mods)) m[k] = (m[k] || 0) + v;
  }
  return m;
}
// Reliquias que puede encontrar la clase actual (las armas de otras clases no caen)
const uniquePool = () => Object.keys(UNIQUES).filter((k) => !UNIQUES[k].cls || UNIQUES[k].cls === S.cls);
const classUnique = () => Object.keys(UNIQUES).find((k) => UNIQUES[k].cls === S.cls);
const uniqueOn = (k) => !!(S && SLOTS.some((s) => S.equip[s] && S.equip[s].unique === k));
function makeUnique(lvl, key) {
  // el arma de la clase tiene más papeletas (un tercio de las veces)
  key = key || (classUnique() && Math.random() < 0.33 ? classUnique() : pick(uniquePool()));
  const U = UNIQUES[key];
  const it = makeItem(S.cls, lvl, 3, { slot: U.slot });
  for (const k of Object.keys(it.stats)) it.stats[k] = Math.max(1, Math.round(it.stats[k] * (k === 'crit' || k === 'res' ? 1.2 : 1.35)));
  it.base = { ...it.stats };
  it.name = U.slot === 'arma' && !U.cls ? `${pick(CLASSES[S.cls].weapon.names)} ${U.name}` : U.name;
  it.unique = key;
  it.value = Math.round(it.value * 2.5);
  return it;
}

// ============================================================
// Despertar
// ============================================================
const LB_MAX = 5;
const LB_COST = [30, 45, 60, 80, 100];     // Sellos de Gesta (antes, Esencias de Despertar)
const LB_FLOOR = [2, 4, 6, 8, 10];         // piso de la Mazmorra que hay que haber superado: la Mazmorra abre el Despertar
const LB_LEVEL = [15, 25, 35, 45, 55];     // nivel de héroe necesario
const LB_PERKS = ["+12% damage and HP", "+12% damage and HP · max refine +11", "+12% damage and HP · 4th gem socket!", "+12% damage and HP · max refine +13", "+12% damage and HP · max refine +15 and Awakening aura"];
const lbRank = () => (S && S.lb) || 0;
const essence = () => (S && S.ess) || 0;
const ESS_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 L12 6 L8 15 L4 6 Z" fill="#ff5ad0" stroke="#3a0a30" stroke-width="1.2"/><path d="M8 1 L10 6 L8 11 Z" fill="#ffd0f4" opacity="0.8"/></svg>';
const refineMax = () => 10 + [0, 1, 1, 3, 3, 5][lbRank()];

// ============================================================
// Mazmorra
// ============================================================
const DUNGEON_MAX = 20;
const dungeonOpen = () => S && S.maxFaille >= 8; // tras vencer al Súper Jefe del Bosque Ceniciento
const dungeonLevel = (tier) => Math.max(1, (S.maxFaille || 1)) + tier;
const dungeonEss = (tier) => 2 + tier;
const uniqueChance = (tier) => Math.min(0.7, 0.3 + tier * 0.03);

function openDungeon() {
  state = 'dungeon';
  buildDungeon();
  showOverlay('dungeon');
  SFX.play('click');
}
function closeDungeon() { state = 'hub'; buildHub(); showOverlay('hub'); }
function buildDungeon() {
  const D = S.dungeon || { max: 0 };
  $('dgRes').innerHTML = `${SEAL_SVG} ${fmtNum(seals())} · Awakening ${lbRank()}/${LB_MAX}`;
  if (!dungeonOpen()) {
    $('dgList').innerHTML = "<div class=\"dg-lock\">🔒 The Dungeon opens when you defeat the Super Boss of the Ashen Forest.<br><small>Unique relics and Feat Seals drop there, and every floor you clear unlocks an Awakening rank for your heroes.</small></div>";
    return;
  }
  const rows = [];
  for (let t = 1; t <= Math.min(DUNGEON_MAX, D.max + 1); t++) {
    const first = t > D.max, B = BIOMES[(t - 1) % BIOMES.length];
    rows.push(`<div class="dg-row ${first ? 'new' : ''}">
      <div class="dg-n">${t}</div>
      <div class="dg-txt"><b>Floor ${t} · ${B.name}</b>
        <span>Monsters level ${dungeonLevel(t) * 2 + 4} · lots of elites · Super Boss ${SUPER_BOSSES[B.id].name.split(',')[0]}</span>
        <span class="dg-rw">${SEAL_SVG} ${dungeonEss(t) * (first ? 2 : 1)} Seals${first ? ' (first time ×2)' : ''} · <b style="color:#ffb040">Unique relic ${first ? 'guaranteed!' : Math.round(uniqueChance(t) * 100) + '%'}</b> · ${AMBER_SVG} ${fmtNum(300 * t)}${LB_FLOOR.includes(t) && first ? ' · <b style="color:#ff8ae0">unlocks Awakening ' + (LB_FLOOR.indexOf(t) + 1) + '</b>' : ''}</span></div>
      <button class="btn big" data-t="${t}">Enter</button></div>`);
  }
  const ck = classUnique(), cu = ck && UNIQUES[ck];
  const head = cu ? `<div class="dg-cls"><img src="img/uniques/${ck}.png" width="40" height="40" alt=""><div><b style="color:${cu.color}">${CLASSES[S.cls].name}'s legendary weapon: ${cu.name}</b><span>${cu.desc} · only drops in the Dungeon</span></div></div>` : '';
  $('dgList').innerHTML = head + rows.reverse().join('');
}
$('dgList').addEventListener('click', (ev) => { const b = ev.target.closest('button[data-t]'); if (b) startDungeon(+b.dataset.t); });
$('btnDgClose').addEventListener('click', closeDungeon);
$('btnDungeon').addEventListener('click', openDungeon);

function startDungeon(tier) {
  const b = (tier - 1) % BIOMES.length;
  persist();
  startNode(b, 1, 2);
  rift.isDungeon = true;
  rift.tier = tier;
  rift.level = dungeonLevel(tier);
  rift.threat += 3 + Math.floor(tier / 2);
  rift.goal = 60 + tier * 2;
  rift.time += 60;
  dressDungeon();
  showBanner("Dungeon · Floor " + tier, '#ff5ad0', "Elites everywhere · Super Boss at the end");
}

// Aspecto propio de la Mazmorra: losas rúnicas, columnas, antorchas, jaulas y huesos (img/ground/dungeon.png, img/props/dungeon.png)
const DUNGEON_GROUND = { id: 'dungeon', patch: ['rgba(150,40,170,0.10)', 'rgba(10,4,20,0.28)'] };
const DUNGEON_LIGHT = { ambient: 0.52, shade: '70,45,110' };
function dressDungeon() {
  // menos «árboles» (jaulas, cofres, cadalsos), más columnas y antorchas; sin charcos del bioma
  const trees = obstacles.filter((o) => o.kind === 'tree');
  obstacles = obstacles.filter((o) => o.kind !== 'tree' || trees.indexOf(o) % 3 === 0);
  obstacles.forEach((o) => { if (o.kind === 'tree') o.s = Math.min(o.s, 1.1); });
  const cx = WORLD.w / 2, cy = WORLD.h / 2;
  for (let i = 0; i < 70; i++) {
    const x = rand(100, WORLD.w - 100), y = rand(100, WORLD.h - 100);
    if (dist(x, y, cx, cy) < 240 || obstacles.some((o) => dist(x, y, o.x, o.y) < o.r + 90)) continue;
    obstacles.push(i % 3 ? { kind: 'pillar', x, y, r: 16, s: rand(0.95, 1.25), v: randi(0, 2) } : { kind: 'brazier', x, y, r: 11, ph: rand(0, 6) });
  }
  pools = [];
  decos = decos.filter((d, i) => i % 9 === 0).map((d) => ({ ...d, kind: 'bones' }));
  groundChunks.clear();
}

// Recompensas al vencer al jefe de la Mazmorra
function dungeonVictory(e) {
  const D = S.dungeon || (S.dungeon = { max: 0 });
  const t = rift.tier, first = t > D.max;
  const ess = dungeonEss(t) * (first ? 2 : 1);
  S.seals = seals() + ess; // la Mazmorra da Sellos (ya no hay Esencias)
  S.kamas += 300 * t;
  if (first || Math.random() < uniqueChance(t)) {
    const it = makeUnique(itemLevel() + 2);
    dropPickup(e.x, e.y, 'item', { item: it });
    later(1.6, () => showBanner("Unique relic!", UNIQUES[it.unique].color, it.name + ' · ' + UNIQUES[it.unique].desc));
  }
  D.max = Math.max(D.max, t);
  rift.dungeonEss = ess;
  later(3.2, () => { subBanner = { text: `+${ess} Feat Seals · +${fmtNum(300 * t)} amber${LB_FLOOR.includes(t) && first ? ' · new Awakening rank available!' : ''}`, t: 3, max: 3 }; });
  persist();
}

// ============================================================
// Pestaña «Despertar» en el Tablón
// ============================================================
QUEST_TABS.splice(2, 0, ['limit', "Awakening"]);
const _buildQuests = buildQuests;
function buildLimitTab() {
  const r = lbRank(), maxed = r >= LB_MAX, cards = [];
  const cost = LB_COST[r], lvl = LB_LEVEL[r], lvlOk = S.level >= (lvl || 0), fl = LB_FLOOR[r], flOk = ((S.dungeon && S.dungeon.max) || 0) >= (fl || 0);
  cards.push(sealCard({ act: 'limit', icon: bigIcon('⟁' + r, 'radial-gradient(#ffd0f4,#a01a7a)'), name: maxed ? "Fully awakened" : `Awakening ${r + 1}`, color: '#ff8ae0',
    sub: `${CLASSES[S.cls].name} · ${r}/${LB_MAX}`,
    desc: maxed ? "Your hero has surpassed all their limits." : `${LB_PERKS[r]}.${lvlOk ? '' : ` <b style="color:#ff8a80">You need level ${lvl}.</b>`}${flOk ? '' : ` <b style="color:#ff8a80">Clear floor ${fl} of the Dungeon.</b>`}`,
    price: cost, can: !maxed && lvlOk && flOk && seals() >= cost, done: maxed }));
  LB_PERKS.forEach((p, i) => cards.push(sealCard({ act: 'perk', icon: bigIcon(r > i ? '★' : i + 1, r > i ? 'radial-gradient(#ffd0f4,#a01a7a)' : '#2a2f48'), name: `Awakening ${i + 1}`, color: r > i ? '#ff8ae0' : '#8d90a8', sub: `Level ${LB_LEVEL[i]} · floor ${LB_FLOOR[i]} · ${LB_COST[i]} Seals`, desc: p, done: true, doneTxt: r > i ? "✔ Active" : "Locked" })));
  $('questList').className = 'shop-grid gesta-grid';
  $('questList').innerHTML = cards.join('');
  $('questAmber').innerHTML = SEAL_SVG + ' ' + fmtNum(seals());
  $('questNote').textContent = "Each Awakening rank unlocks when you clear a Dungeon floor (Runic Portal → Dungeon).";
}
buildQuests = function () {
  const tab = questTab;
  if (tab === 'limit') { questTab = 'quests'; _buildQuests(); questTab = 'limit'; }
  else return _buildQuests();
  // repintar pestañas con la de Despertar activa
  $('questTabs').innerHTML = QUEST_TABS.map(([id, label]) => `<button data-tab="${id}" class="${questTab === id ? 'on' : ''}">${label}</button>`).join('');
  buildLimitTab();
};
const _gestaAction = gestaAction;
gestaAction = function (act) {
  if (act !== 'limit') return _gestaAction(act);
  const r = lbRank();
  if (r >= LB_MAX) return;
  if (S.level < LB_LEVEL[r]) { showToast('questToast', `You need level ${LB_LEVEL[r]}`, false); return; }
  if (((S.dungeon && S.dungeon.max) || 0) < LB_FLOOR[r]) { showToast('questToast', `Clear floor ${LB_FLOOR[r]} of the Dungeon to unlock this rank`, false); SFX.play('hurt'); return; }
  if (seals() < LB_COST[r]) { showToast('questToast', "You don't have enough Feat Seals", false); SFX.play('hurt'); return; }
  S.seals -= LB_COST[r];
  S.lb = r + 1;
  if (S.lb === 3) { while (S.gemSlots.length < GEM_SLOTS + 1) S.gemSlots.push(null); }
  if (P) recalc();
  persist();
  showToast('questToast', `Awakening ${S.lb}! ${LB_PERKS[r]}`);
  SFX.play('legend');
  buildQuests();
};
