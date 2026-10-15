/* Fendaria — Mazmorra, reliquias únicas y Ruptura de Límite.
 * La Mazmorra tiene pisos (1…20) cada vez más duros: monstruos de nivel superior al de tu mejor Grieta,
 * muchas élites y un Súper Jefe al final. Allí caen las Esencias de Ruptura (para la Ruptura de Límite de
 * los héroes) y las reliquias únicas: legendarias con un poder especial que no existe en ningún otro sitio.
 */
'use strict';

// ============================================================
// Reliquias únicas
// ============================================================
const UNIQUES = {
  eclipse: { slot: 'arma', name: 'del Eclipse', color: '#ff6a3d', desc: '+25% de daño y +8% de crítico' },
  sangre: { slot: 'arma', name: 'Colmillo Sangriento', color: '#e0303a', desc: 'Robas un 6% del daño que haces como vida' },
  corona: { slot: 'sombrero', name: 'Corona del Rey Ceniza', color: '#ffb040', desc: '+30% de PV máximos' },
  manto: { slot: 'capa', name: 'Manto del Vacío', color: '#9c5bd8', desc: '-15% de daño recibido y +12% de velocidad' },
  eco: { slot: 'amuleto', name: 'Amuleto del Eco', color: '#5fd0ff', desc: 'Tus hechizos se recargan un 30% más rápido' },
  verdugo: { slot: 'anillo', name: 'Anillo del Verdugo', color: '#ff4a6a', desc: 'Los críticos hacen un 60% más de daño' },
  viento: { slot: 'botas', name: 'Botas del Viento Eterno', color: '#8fe8c0', desc: '+1 esquiva y +20% de velocidad' },
  avaro: { slot: 'cinturon', name: 'Faja del Rey Avaro', color: '#ffd54f', desc: '+60% de ámbar y +40% de experiencia' },
  // Armas legendarias de clase (solo caen para la clase que las usa); mods: dmg, hp, crit, critDmg, cd, armor, speed, ls
  volcan: { slot: 'arma', cls: 'iop', name: 'Hacha del Volcán', color: '#ff5a1f', desc: '+30% de daño y +20% de PV máximos', mods: { dmg: 0.3, hp: 0.2 } },
  alba: { slot: 'arma', cls: 'cra', name: 'Arco del Alba', color: '#ffe08a', desc: '+30% de daño y +12% de crítico', mods: { dmg: 0.3, crit: 0.12 } },
  milrunas: { slot: 'arma', cls: 'feca', name: 'Báculo de las Mil Runas', color: '#5fc8ff', desc: '+30% de daño y hechizos un 25% más rápidos', mods: { dmg: 0.3, cd: 0.25 } },
  colmillos: { slot: 'arma', cls: 'sombra', name: 'Colmillos del Eclipse', color: '#c04aff', desc: '+30% de daño y críticos un 50% más fuertes', mods: { dmg: 0.3, critDmg: 0.5 } },
  cayado: { slot: 'arma', cls: 'domadora', name: 'Cayado del Bosque Antiguo', color: '#7ad85a', desc: '+30% de daño, +15% de resistencia y +10% de velocidad', mods: { dmg: 0.3, armor: 0.15, speed: 0.1 } },
  solar: { slot: 'arma', cls: 'artificiera', name: 'Cañón Solar', color: '#ffa23a', desc: '+45% de daño', mods: { dmg: 0.45 } },
  mandoble: { slot: 'arma', cls: 'berserker', name: 'Mandoble del Rey Caído', color: '#e8e8f0', desc: '+30% de daño y robas un 5% del daño como vida', mods: { dmg: 0.3, ls: 0.05 } },
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
// Ruptura de Límite
// ============================================================
const LB_MAX = 5;
const LB_COST = [5, 10, 18, 28, 40];       // Esencias de Ruptura
const LB_LEVEL = [15, 25, 35, 45, 55];     // nivel de héroe necesario
const LB_PERKS = ['+12% de daño y PV', '+12% de daño y PV · refinado máximo +11', '+12% de daño y PV · ¡4.º hueco de gema!', '+12% de daño y PV · refinado máximo +13', '+12% de daño y PV · refinado máximo +15 y aura de Ruptura'];
const lbRank = () => (S && S.lb) || 0;
const essence = () => (S && S.ess) || 0;
const ESS_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 L12 6 L8 15 L4 6 Z" fill="#ff5ad0" stroke="#3a0a30" stroke-width="1.2"/><path d="M8 1 L10 6 L8 11 Z" fill="#ffd0f4" opacity="0.8"/></svg>';
const refineMax = () => 10 + [0, 1, 1, 3, 3, 5][lbRank()];

// ============================================================
// Mazmorra
// ============================================================
const DUNGEON_MAX = 20;
const dungeonOpen = () => S && S.maxFaille >= 8 && isFull(); // tras vencer al Súper Jefe del Bosque Ceniciento (Edición Completa)
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
  $('dgRes').innerHTML = `${ESS_SVG} ${essence()} Esencias · Ruptura ${lbRank()}/${LB_MAX}`;
  if (!dungeonOpen()) {
    $('dgList').innerHTML = '<div class="dg-lock">🔒 La Mazmorra se abre al vencer al Súper Jefe del Bosque Ceniciento.<br><small>Allí caen reliquias únicas y Esencias de Ruptura para romper el límite de tus héroes.</small></div>';
    return;
  }
  const rows = [];
  for (let t = 1; t <= Math.min(DUNGEON_MAX, D.max + 1); t++) {
    const first = t > D.max, B = BIOMES[(t - 1) % BIOMES.length];
    rows.push(`<div class="dg-row ${first ? 'new' : ''}">
      <div class="dg-n">${t}</div>
      <div class="dg-txt"><b>Piso ${t} · ${B.name}</b>
        <span>Monstruos nivel ${dungeonLevel(t) * 2 + 4} · muchas élites · Súper Jefe ${SUPER_BOSSES[B.id].name.split(',')[0]}</span>
        <span class="dg-rw">${ESS_SVG} ${dungeonEss(t) * (first ? 2 : 1)} Esencias${first ? ' (primera vez ×2)' : ''} · <b style="color:#ffb040">Reliquia única ${first ? '¡asegurada!' : Math.round(uniqueChance(t) * 100) + '%'}</b> · ${FRAG_SVG} ${10 * t}</span></div>
      <button class="btn big" data-t="${t}">Entrar</button></div>`);
  }
  const ck = classUnique(), cu = ck && UNIQUES[ck];
  const head = cu ? `<div class="dg-cls"><img src="img/uniques/${ck}.png" width="40" height="40" alt=""><div><b style="color:${cu.color}">Arma legendaria de ${CLASSES[S.cls].name}: ${cu.name}</b><span>${cu.desc} · solo cae en la Mazmorra</span></div></div>` : '';
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
  showBanner('Mazmorra · Piso ' + tier, '#ff5ad0', 'Élites por todas partes · Súper Jefe al final');
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
  S.ess = essence() + ess;
  S.frag = frags() + 10 * t;
  if (first || Math.random() < uniqueChance(t)) {
    const it = makeUnique(itemLevel() + 2);
    dropPickup(e.x, e.y, 'item', { item: it });
    later(1.6, () => showBanner('¡Reliquia única!', UNIQUES[it.unique].color, it.name + ' · ' + UNIQUES[it.unique].desc));
  }
  D.max = Math.max(D.max, t);
  rift.dungeonEss = ess;
  later(3.2, () => { subBanner = { text: `+${ess} Esencias de Ruptura · +${10 * t} Fragmentos`, t: 3, max: 3 }; });
  persist();
}

// ============================================================
// Pestaña «Ruptura» en el Tablón
// ============================================================
QUEST_TABS.splice(2, 0, ['limit', 'Ruptura']);
const _buildQuests = buildQuests;
function buildLimitTab() {
  const r = lbRank(), maxed = r >= LB_MAX, cards = [];
  const cost = LB_COST[r], lvl = LB_LEVEL[r], lvlOk = S.level >= (lvl || 0);
  cards.push(sealCard({ act: 'limit', icon: bigIcon('⟁' + r, 'radial-gradient(#ffd0f4,#a01a7a)'), name: maxed ? 'Límite roto' : `Ruptura ${r + 1}`, color: '#ff8ae0',
    sub: `${CLASSES[S.cls].name} · ${r}/${LB_MAX}`,
    desc: maxed ? 'Tu héroe ha superado todos sus límites.' : `${LB_PERKS[r]}.${lvlOk ? '' : ` <b style="color:#ff8a80">Necesitas nivel ${lvl}.</b>`}`,
    price: cost, can: !maxed && lvlOk && essence() >= cost, done: maxed }));
  LB_PERKS.forEach((p, i) => cards.push(sealCard({ act: 'perk', icon: bigIcon(r > i ? '★' : i + 1, r > i ? 'radial-gradient(#ffd0f4,#a01a7a)' : '#2a2f48'), name: `Ruptura ${i + 1}`, color: r > i ? '#ff8ae0' : '#8d90a8', sub: `Nivel ${LB_LEVEL[i]} · ${LB_COST[i]} Esencias`, desc: p, done: true, doneTxt: r > i ? '✔ Activa' : 'Bloqueada' })));
  $('questList').className = 'shop-grid gesta-grid';
  $('questList').innerHTML = cards.join('').replace(new RegExp(SEAL_SVG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ESS_SVG);
  $('questAmber').innerHTML = ESS_SVG + ' ' + fmtNum(essence());
  $('questNote').textContent = 'Las Esencias de Ruptura solo caen en la Mazmorra (Portal Rúnico → Mazmorra).';
}
buildQuests = function () {
  const tab = questTab;
  if (tab === 'limit') { questTab = 'quests'; _buildQuests(); questTab = 'limit'; }
  else return _buildQuests();
  // repintar pestañas con la de Ruptura activa
  $('questTabs').innerHTML = QUEST_TABS.map(([id, label]) => `<button data-tab="${id}" class="${questTab === id ? 'on' : ''}">${label}</button>`).join('');
  buildLimitTab();
};
const _gestaAction = gestaAction;
gestaAction = function (act) {
  if (act !== 'limit') return _gestaAction(act);
  const r = lbRank();
  if (r >= LB_MAX) return;
  if (S.level < LB_LEVEL[r]) { showToast('questToast', `Necesitas nivel ${LB_LEVEL[r]}`, false); return; }
  if (essence() < LB_COST[r]) { showToast('questToast', 'Te faltan Esencias de Ruptura: consíguelas en la Mazmorra', false); SFX.play('hurt'); return; }
  S.ess -= LB_COST[r];
  S.lb = r + 1;
  if (S.lb === 3) { while (S.gemSlots.length < GEM_SLOTS + 1) S.gemSlots.push(null); }
  if (P) recalc();
  persist();
  showToast('questToast', `¡Ruptura de Límite ${S.lb}! ${LB_PERKS[r]}`);
  SFX.play('legend');
  buildQuests();
};
