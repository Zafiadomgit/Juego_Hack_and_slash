/* Fendaria — tope de nivel por Súper Jefes.
 * Empiezas con tope 23 (lo justo para el primer Súper Jefe en Difícil); cada Súper Jefe vencido lo sube 14.
 * Con los 8 vencidos no hay tope. La experiencia que se gana en el tope se convierte en ámbar.
 */
'use strict';

const supersDone = () => BIOMES.reduce((n, b, i) => n + (superDone(i) ? 1 : 0), 0);
const levelCap = () => { const k = supersDone(); return k >= BIOMES.length ? Infinity : 23 + 14 * k; };
const nextSuperName = () => { const i = BIOMES.findIndex((b, k) => !superDone(k)); return i < 0 ? '' : SUPER_BOSSES[BIOMES[i].id].name.split(',')[0] + ' (' + BIOMES[i].name + ')'; };

const _gainXpC = gainXp;
gainXp = function (v) {
  const cap = levelCap();
  if (S.level >= cap) {
    const a = Math.max(1, Math.round(v * (P ? P.xpMul : 1) * 0.3));
    S.kamas += a;
    if (rift && !rift.capNoted) {
      rift.capNoted = true;
      showBanner(`Max level (${cap})`, '#ffd76a', `Defeat ${nextSuperName()} to keep leveling · experience turns into amber`);
    }
    return;
  }
  _gainXpC(v);
  if (S.level >= cap) { S.level = cap; S.xp = 0; }
};

// el tope se ve en la ficha y en la barra de la villa
const _buildInventoryC = buildInventory;
buildInventory = function (j) {
  _buildInventoryC(j);
  const cap = levelCap();
  if (cap !== Infinity) $('shLevel').textContent = `Lv. ${S.level} / ${cap}`;
};
const _buildHubC = buildHub;
buildHub = function () {
  _buildHubC();
  const cap = levelCap(), face = document.querySelector('#hubChar .hc-face');
  if (face && cap !== Infinity && S.level >= cap) {
    face.title = `Max level: defeat ${nextSuperName()} to go higher`;
    if (!face.querySelector('.cap')) face.insertAdjacentHTML('beforeend', '<i class="cap">🔒</i>');
  }
};
// en el mapa, el Súper Jefe dice qué tope desbloquea
const _buildMapInfoC = buildMapInfo;
buildMapInfo = function () {
  _buildMapInfoC();
  const sel = mapSel();
  if (sel.n !== 'S' || sel.b !== mapView || superDone(sel.b)) return;
  const rows = $('mapInfo').querySelector('.mi-rows');
  if (rows) rows.insertAdjacentHTML('beforeend', `<span>When defeated</span><b style="color:#7cff8a">level cap ${sel.b + 1 >= BIOMES.length ? "no limit" : 23 + 14 * (supersDone() + 1)}</b>`);
};
