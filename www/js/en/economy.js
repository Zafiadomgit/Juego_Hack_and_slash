/* Fendaria — economía simplificada: solo Ámbar (día a día) y Sellos de Gesta (progreso permanente).
 *  · Los Fragmentos de mineral se convierten en ámbar y las Esencias de Despertar en Sellos (una sola vez).
 *  · Hitos B de la Trascendencia que necesitan enganche: escudo inicial (5) y eco de la definitiva (10).
 */
'use strict';

const ECO_FRAG = 30, ECO_ESS = 5; // ámbar por Fragmento y Sellos por Esencia al convertir
function ecoMigrate(s) {
  if (!s || s.eco2) return;
  s.eco2 = 1;
  const f = s.frag || 0, e = s.ess || 0;
  if (f) s.kamas = (s.kamas || 0) + f * ECO_FRAG;
  if (e) s.seals = (s.seals || 0) + e * ECO_ESS;
  s.frag = 0; s.ess = 0;
  if (f || e) s._ecoMsg = (f ? `${f} Shards → ${fmtNum(f * ECO_FRAG)} amber` : '') + (f && e ? ' · ' : '') + (e ? `${e} Essences → ${e * ECO_ESS} Seals` : '');
}
// todas las partidas guardadas (cada héroe tiene la suya)
if (SAVE && SAVE.slots) { for (const s of Object.values(SAVE.slots)) ecoMigrate(s); persist(); }
const _buildHubEco = buildHub;
buildHub = function () {
  const r = _buildHubEco();
  if (S) { ecoMigrate(S); if (S._ecoMsg) { const m = S._ecoMsg; delete S._ecoMsg; persist(); setTimeout(() => showToast('questToast', "Currencies unified: " + m), 800); } }
  return r;
};

// Hito 5 B: escudo al empezar cada Grieta
const _startNodeEco = startNode;
startNode = function (b, n, d) {
  const r = _startNodeEco(b, n, d);
  setTimeout(() => { if (P && scene === 'rift' && transPerk(5, 1)) { P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * 0.3)); P.shieldT = 999; } }, 1200);
  return r;
};
// Hito 10 B: al desatar la definitiva, curación y recarga parcial
const _ultBlastEco = ultBlast;
ultBlast = function () {
  _ultBlastEco();
  if (P && transPerk(10, 1)) { heal(Math.round(P.maxHp * 0.35)); P.ult = Math.max(P.ult || 0, 25); }
};
