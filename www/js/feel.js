/* Fendaria — sensación de combate.
 *  · Vibración (Android): críticos, golpes recibidos, esquiva, muertes de élite y de jefe. Se apaga en la pausa.
 *  · Micro-pausa de impacto en los críticos y temblor suave.
 *  · Números de daño agrupados: los golpes seguidos sobre el mismo enemigo suman en un solo número.
 *  · «!» sobre el monstruo que prepara un ataque fuerte.
 *  · Con poca vida: viñeta roja con latido.
 */
'use strict';

// ---------- vibración ----------
const HAPT = { last: {} };
const hapticsOn = () => !(SAVE && SAVE.noVibe);
function buzz(kind, pattern, gap = 0.08) {
  if (!hapticsOn() || !navigator.vibrate) return;
  const t = performance.now() / 1000;
  if (t - (HAPT.last[kind] || 0) < gap) return;
  HAPT.last[kind] = t;
  try { navigator.vibrate(pattern); } catch (e) { /* sin permiso: nada */ }
}
document.querySelector('#pause #btnMute').insertAdjacentHTML('afterend', '<button id="btnVibe" class="btn"></button>');
const vibeLabel = () => { $('btnVibe').textContent = 'Vibración: ' + (hapticsOn() ? 'ON' : 'OFF'); };
vibeLabel();
$('btnVibe').addEventListener('click', () => { SAVE.noVibe = hapticsOn(); persist(); vibeLabel(); if (hapticsOn()) buzz('test', 30, 0); });

// ---------- impactos y números de daño ----------
const _damageEnemyFeel = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (!e || e.dead || scene !== 'rift') return _damageEnemyFeel(e, base, o);
  const n0 = texts.length, wasDead = e.dead;
  const r = _damageEnemyFeel(e, base, o);
  // el número nuevo se suma al que ya flota sobre ese enemigo (si es reciente)
  for (let i = texts.length - 1; i >= n0; i--) {
    const t = texts[i];
    if (!/^\d+$/.test(t.txt)) continue;
    t.eid = e;
    const prev = texts.find((q) => q !== t && q.eid === e && q.max - q.life < 0.45 && /^\d+$/.test(q.txt));
    if (prev) {
      prev.txt = String(+prev.txt + +t.txt);
      prev.life = prev.max; prev.x = t.x; prev.y = Math.min(prev.y, t.y);
      prev.scale = Math.min(2.2, Math.max(prev.scale, t.scale) * 1.04);
      if (t.crit) { prev.crit = true; prev.color = t.color; }
      texts.splice(i, 1);
    }
    if (t.crit && !o.quiet) {
      hitStop(0.035); shake(3);
      buzz('crit', 12, 0.12);
    }
  }
  if (!wasDead && e.dead) {
    if (e.superDef || e.boss) buzz('boss', [60, 40, 140], 0.5);
    else if (e.elite) { buzz('elite', 35, 0.2); hitStop(0.05); }
  }
  return r;
};
const _hurtPlayerFeel = hurtPlayer;
hurtPlayer = function (dmg, sx, sy, src) {
  const hp0 = P ? P.hp : 0;
  const r = _hurtPlayerFeel(dmg, sx, sy, src);
  if (P && P.hp < hp0) buzz('hurt', P.hp < P.maxHp * 0.3 ? 70 : 40, 0.25);
  return r;
};
const _dashFeel = dash;
dash = function () {
  const was = P.dashT;
  _dashFeel();
  if (P.dashT > 0 && was <= 0) buzz('dash', 8, 0.15);
};

// ---------- aviso de ataque fuerte ----------
const WIND_STATES = { wind: 1, leap: 1, summon: 1, web: 1, volley: 1 };
const _drawEnemyFeel = drawEnemy;
drawEnemy = function (e) {
  _drawEnemyFeel(e);
  if (e.dead || !WIND_STATES[e.state] || e.spawnT > 0) return;
  if (!(e.boss || e.superDef || e.D.ai === 'charger' || e.D.ai === 'slammer' || e.elite)) return;
  const y = e.y - e.r * 2.3 - (e.z || 0) - 10, k = 1 + Math.sin(now * 18) * 0.12;
  ctx.save();
  glow(e.x, y, 16, '255,60,40', 0.55);
  text('!', e.x, y, 22 * k, '#ff4a3d', 'center', 900);
  ctx.restore();
};

// ---------- poca vida ----------
const _drawHUDFeel = drawHUD;
drawHUD = function () {
  if (scene === 'rift' && P && P.maxHp && P.hp / P.maxHp < 0.3 && state === 'play') {
    const k = 1 - P.hp / P.maxHp / 0.3, beat = 0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(now * 5.5)), 6);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(160,0,0,0)');
    g.addColorStop(1, `rgba(170,10,10,${(0.25 + 0.3 * beat) * (0.5 + k * 0.5)})`);
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    if (beat > 0.9) buzz('beat', 18, 1.1);
  }
  _drawHUDFeel();
};
