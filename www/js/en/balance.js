/* Fendaria — equilibrio frente al poder REAL del héroe y muertes de jefe a la altura.
 *  · La vida de los monstruos se calculaba con un héroe «de referencia»; las bendiciones, talentos, runas,
 *    mecánica propia y equipo no contaban y se llegaba al capítulo 2 matando Guardianes de un golpe.
 *    Ahora se mide el daño que hace de verdad cada golpe (media móvil) y se compara con el poder ESPERADO de la Grieta:
 *    dentro de una banda de tolerancia no se compensa nada (mejorar se nota); por encima, solo la mitad del exceso.
 *  · Poder visible: en la tarjeta de la villa y «Poder recomendado» en el mapa (tools/balance/simular.js mide la curva).
 *  · Ningún golpe suelto quita más de un 7% de la vida de un Súper Jefe ni un 11% de la de un Guardián.
 *  · La muerte de un jefe: cámara lenta, explosiones encadenadas y un estallido final.
 */
'use strict';

// ---------- daño real por golpe ----------
let hitAvg = 0; // media móvil del daño por golpe (sin venenos ni efectos menores)
const curRef = () => (rift ? refPlayer(S.cls, rift.level, rift.d || 0) : null);
const BOSS_CAP = { super: 0.07, boss: 0.11 };

const _damageEnemyB = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (!e || e.dead || scene !== 'rift') return _damageEnemyB(e, base, o);
  const cap = e.superDef ? BOSS_CAP.super : e.boss ? BOSS_CAP.boss : 0;
  const hp0 = e.hp;
  let raw;
  if (!cap) {
    _damageEnemyB(e, base, o);
    raw = hp0 - e.hp;
  } else {
    // el golpe no puede pasar del tope: se aplica sobre una vida «blindada» y luego se recorta
    e.hp = 1e15;
    _damageEnemyB(e, base, o);
    raw = 1e15 - e.hp;
    e.hp = hp0 - Math.min(raw, e.maxHp * cap);
    if (e.hp <= 0 && !e.dead) killEnemy(e);
  }
  // un golpe anómalo (remate enorme, efectos de prueba) no dispara la media
  if (!o.quiet && raw > 0) hitAvg = hitAvg ? hitAvg * 0.92 + Math.min(raw, hitAvg * 6) * 0.08 : Math.min(raw, (curRef() ? curRef().hit : base) * 3);
};

// ---------- poder esperado y banda de tolerancia ----------
// Antes los monstruos crecían igual que el héroe (vida × poder real / referencia): mejorar no se notaba.
// tools/balance/simular.js mide a un jugador «normal» (algo de Épico, refina y sube Trascendencia poco a poco):
// va unas 2,3 × (1 + nivel/12) veces por encima de la referencia. Ese es el poder ESPERADO de cada Grieta.
// Se fija cuántos golpes aguanta un monstruo normal según q = poder real / poder esperado:
//   · con el poder esperado (q = 1), ~3,5 golpes;
//   · hasta un 50% por encima no se compensa nada: los golpes bajan en proporción (recompensa por mejorar);
//   · más arriba, los monstruos compensan solo la mitad (raíz cuadrada) del exceso, sin bajar de 1 golpe;
//   · por debajo cuesta más, pero sin muro: como mucho ~10 golpes aunque no refines ni subas nada.
// Los jefes siguen la misma proporción (con el poder esperado, igual que antes).
// (en las primeras Grietas el héroe aún no tiene el equipo completo: la curva arranca más baja)
const expectK = (L) => 2.3 * (1 + L / 12) - 1.3 * Math.max(0, 1 - L / 15);
const POWER_TOL = 1.5, HITS_EXPECTED = 3.5;
const heroHit = () => (P ? basicDmg() * (1 + Math.min(0.75, P.crit) * 0.8) : 0); // golpe medio sin bendiciones
const recPower = (L) => (S ? refPlayer(S.cls, L, 0).hit * expectK(L) : 0);
function hitsFor(q) {
  if (q < 1) return Math.min(10, HITS_EXPECTED * Math.pow(q, -0.35));
  if (q <= POWER_TOL) return HITS_EXPECTED / q;
  return Math.max(1, (HITS_EXPECTED / POWER_TOL) / Math.sqrt(q / POWER_TOL));
}

// ---------- vida y daño de los monstruos según el poder real ----------
const _spawnEnemyB = spawnEnemy;
spawnEnemy = function (type, x, y, o = {}) {
  const e = _spawnEnemyB(type, x, y, o);
  if (!e || scene !== 'rift' || !rift) return e;
  const r = curRef(), hit = hitAvg > 0 ? hitAvg : heroHit(); // al empezar aún no hay golpes: se estima con las estadísticas
  if (!r || !hit) return e;
  const k = hit / r.hit, q = k / expectK(rift.level);
  const big = e.superDef || e.boss;
  // la vida de base está pensada para que el Jabalí aguante 8 golpes al héroe de referencia (DIFFS.hits)
  const s = k * hitsFor(q) / HITS_EXPECTED; // fuerza del monstruo frente a la referencia (con el poder esperado, k)
  const m = big ? s : k * hitsFor(q) / 8;
  e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * m));
  e.dmg *= 1 + 0.35 * Math.log2(Math.max(1, s));
  // suelo de golpes: con el poder esperado un Guardián aguanta ~45 golpes reales y un Súper Jefe ~110;
  // si vas por encima de la banda, el suelo baja (hasta la mitad)
  if (hitAvg > 0 && big) {
    const min = hitAvg * (e.superDef ? 110 : 45) * Math.max(0.5, 1 / Math.sqrt(Math.max(1, q / POWER_TOL)));
    if (e.maxHp < min) e.hp = e.maxHp = Math.round(min);
  }
  return e;
};

// ---------- Poder: número visible en la villa y «Poder recomendado» en el mapa ----------
const _buildHubB = buildHub;
buildHub = function () {
  _buildHubB();
  const card = $('hubChar'), pw = Math.round(heroHit());
  if (!card || !pw) return;
  const old = card.querySelector('.hc-power'); if (old) old.remove();
  card.querySelector('.hc-name').insertAdjacentHTML('afterend', `<div class="hc-power" title="Your average hit with your gear, talents and upgrades (without blessings). Compare it with the Recommended Power of each Rift on the map">⚔ Power <b>${fmtNum(pw)}</b></div>`);
};

// ---------- la presentación del jefe no sale si ya ha caído ----------
const _playSceneB = playScene;
playScene = function (id, ctx, o) {
  if (/^boss\d/.test(id) && scene === 'rift' && rift && (rift.bossDead || !enemies.some((e) => !e.dead && (e.superDef || e.boss)))) return false;
  return _playSceneB(id, ctx, o);
};

// ---------- muerte de jefe ----------
let slowT = 0;
const _updateB = update;
update = function (dt) {
  if (slowT > 0) { slowT -= dt; dt *= 0.35; }
  _updateB(dt);
};
const _killEnemyB = killEnemy;
killEnemy = function (e) {
  const was = e.dead;
  _killEnemyB(e);
  if (was || !(e.boss || e.superDef) || scene !== 'rift') return;
  const big = !!e.superDef, R = e.r * (big ? 1.6 : 1.3), x = e.x, y = e.y - e.r * 0.6;
  slowT = big ? 1.3 : 0.8;
  bannerHoldUntil = now + (big ? 3.2 : 2.4);
  zoomPunch = Math.max(zoomPunch, big ? 0.12 : 0.08);
  const n = big ? 9 : 6;
  for (let k = 0; k < n; k++) {
    later(0.08 + k * 0.13, () => {
      if (scene !== 'rift') return;
      const a = rand(0, TAU), d = rand(0, R);
      const ex = x + Math.cos(a) * d, ey = y + Math.sin(a) * d * 0.6;
      spawnVfx('explosion', ex, ey, rand(60, 110) * (big ? 1.3 : 1), { dur: 0.4 });
      embers(ex, ey, 6, '255,170,70', 20);
      sparks(ex, ey, 8, '#ffe0a0', 260);
      shake(big ? 9 : 6);
      SFX.play('hit');
    });
  }
  later(0.2 + n * 0.13, () => {
    if (scene !== 'rift') return;
    rings.push({ x: e.x, y: e.y, r0: 10, r1: R * 3.2, life: 0.6, max: 0.6, color: 'rgba(255,230,170,' });
    rings.push({ x: e.x, y: e.y, r0: 6, r1: R * 2, life: 0.45, max: 0.45, color: 'rgba(255,140,60,' });
    hitFlash(x, y, R * 0.8, '255,200,140');
    spawnVfx('explosion', x, y, R * 1.9, { dur: 0.6 });
    for (let i = 0; i < 40; i++) {
      const a = rand(0, TAU), sp = rand(120, 480);
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - 60, life: 0.9, max: 0.9, color: pick(['#fff3d0', '#ffb040', '#ff6a2a', e.D.blood || '#fff']), size: rand(3, 7), grav: 260 });
    }
    addDecal('scorch', e.x, e.y, R * 1.8, 6, '255,110,30');
    shake(big ? 22 : 14);
    SFX.play('boom');
  });
};

// los carteles de botín esperan a que acabe la muerte del jefe (no pisan el «¡derrotado!»)
let bannerHoldUntil = 0;
const _showBannerB = showBanner;
showBanner = function (title, color, sub) {
  if (now < bannerHoldUntil && !/derrotad/i.test(title)) {
    const wait = bannerHoldUntil - now;
    bannerHoldUntil += 1.6; // en fila, uno tras otro
    setTimeout(() => _showBannerB(title, color, sub), wait * 1000);
    return;
  }
  return _showBannerB(title, color, sub);
};
