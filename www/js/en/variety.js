/* Fendaria — variedad en las Grietas.
 *  A) Mutaciones de monstruo: cada mundo trae las suyas y se van acumulando.
 *     Volátil (explota al morir) · Divisible (se parte en dos) · Escudado (bloquea de frente)
 *     · Abrasador (deja fuego) · Chamán (cura y acelera a los suyos) · Errante (se teletransporta).
 *  B) Eventos nuevos, además del cofre, la lluvia de ámbar, la emboscada y el altar:
 *     Duende Dorado · Cofre Maldito · Arena de Élites · Pacto Arriesgado · Eclipse.
 */
'use strict';

// ============================================================
// A) Mutaciones
// ============================================================
const MUTS = {
  volatil: { name: "Volatile", color: '255,106,58', icon: '✹', from: 0, tip: "Explodes on death: get away from the red circle" },
  divisible: { name: "Splitting", color: '155,224,90', icon: '◐', from: 0, tip: "Splits in two on death" },
  escudado: { name: "Shielded", color: '176,196,222', icon: '⛨', from: 1, tip: "Its shield blocks hits from the front: go around it" },
  rastro: { name: "Scorching", color: '255,154,61', icon: '♨', from: 1, tip: "Leaves fire wherever it goes" },
  chaman: { name: "Shaman", color: '124,255,138', icon: '✚', from: 2, tip: "Heals and speeds up its allies: kill it first" },
  errante: { name: "Blinker", color: '180,140,255', icon: '✧', from: 3, tip: "Appears right next to you: watch for the purple flash" },
};
const mutPool = (b) => Object.keys(MUTS).filter((k) => MUTS[k].from <= b);
function rollMut(e) {
  if (!rift || rift.isDungeon || e.boss || e.superDef || e.elite || e.child || e.goblin) return;
  if (typeof tutOn === 'function' && tutOn() && rift.b === 0 && rift.n === 1) return;
  const depth = typeof runDepth === 'function' ? runDepth() : 0;
  const p = Math.min(0.38, 0.1 + 0.03 * rift.b + 0.012 * rift.n + 0.02 * depth);
  if (Math.random() > p) return;
  const pool = mutPool(rift.b);
  // las del mundo actual salen más (es su novedad)
  const w = pool.map((k) => (MUTS[k].from === Math.min(rift.b, 3) ? 2.2 : 1));
  let r = Math.random() * w.reduce((a, b) => a + b, 0), k = pool[0];
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { k = pool[i]; break; } }
  e.mut = k; e.mutT = rand(1.5, 3); e.shA = 0;
  // la primera vez que aparece cada mutación, se explica
  S.seenMut = S.seenMut || {};
  if (!S.seenMut[k]) { S.seenMut[k] = 1; later(0.4, () => { subBanner = { text: `New: ${MUTS[k].icon} ${MUTS[k].name} — ${MUTS[k].tip}`, t: 3.5, max: 3.5 }; }); }
  if (k === 'escudado') e.hp = e.maxHp = Math.round(e.maxHp * 1.2);
  if (k === 'chaman') { e.hp = e.maxHp = Math.round(e.maxHp * 0.8); e.mutT = 2.5; }
}

const _spawnEnemyV = spawnEnemy;
spawnEnemy = function (type, x, y, o = {}) {
  const e = _spawnEnemyV(type, x, y, o);
  if (e && scene === 'rift' && rift) {
    rollMut(e);
    if (rift.curse) e.dmg *= rift.curse;
  }
  return e;
};

// comportamiento propio de cada mutación
const _updateEnemyV = updateEnemy;
updateEnemy = function (e, dt) {
  const x0 = e.x, y0 = e.y;
  _updateEnemyV(e, dt);
  if (e.goblin) return goblinTick(e, dt);
  if (!e.mut || e.dead || e.spawnT > 0 || state !== 'play') return;
  e.mutT -= dt;
  const d = dist(e.x, e.y, P.x, P.y);
  if (e.mut === 'escudado') {
    // el escudo gira despacio hacia el héroe: hay que rodearlo
    const want = Math.atan2(P.y - e.y, P.x - e.x), df = angDiff(want, e.shA);
    e.shA += clamp(df, -1.6 * dt, 1.6 * dt);
  } else if (e.mut === 'rastro') {
    if (e.mutT <= 0 && Math.hypot(e.x - x0, e.y - y0) > 0.2) { e.mutT = 0.55; addHazard('fire', e.x, e.y, 24, 0.2, e.dmg * 0.9, { linger: 2.6, src: e }); }
  } else if (e.mut === 'chaman') {
    if (d < 230) { const a = Math.atan2(e.y - P.y, e.x - P.x); e.x += Math.cos(a) * e.speed * 0.9 * dt; e.y += Math.sin(a) * e.speed * 0.9 * dt; } // se queda atrás
    if (e.mutT <= 0) {
      e.mutT = 4.5;
      let n = 0;
      for (const q of enemies) {
        if (q === e || q.dead || dist(q.x, q.y, e.x, e.y) > 220) continue;
        q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.18); q.hasteT = 3; n++;
        particles.push({ kind: 'glowdot', x: q.x, y: q.y - q.r, vx: 0, vy: -40, life: 0.7, max: 0.7, rgb: '124,255,138', size: 5, grav: 0 });
      }
      rings.push({ x: e.x, y: e.y, r0: 20, r1: 220, life: 0.5, max: 0.5, color: 'rgba(124,255,138,' });
      if (n) addText(e.x, e.y - e.r * 2.4, "+ healing", '#7cff8a', 0.8);
    }
  } else if (e.mut === 'errante') {
    if (e.mutT <= 0 && !e.blink && d < 520) {
      const a = rand(0, TAU);
      e.blink = { x: clamp(P.x + Math.cos(a) * 95, 40, WORLD.w - 40), y: clamp(P.y + Math.sin(a) * 95, 40, WORLD.h - 40), t: 0.6 };
    }
    if (e.blink) {
      e.blink.t -= dt;
      if (e.blink.t <= 0) { poof(e.x, e.y); e.x = e.blink.x; e.y = e.blink.y; poof(e.x, e.y); e.blink = null; e.mutT = rand(4, 6); e.cd = Math.min(e.cd || 0, 0.3); SFX.play('dash'); }
    }
  }
  // prisa del chamán
  if (e.hasteT > 0) { e.hasteT -= dt; e.x += (e.x - x0) * 0.5; e.y += (e.y - y0) * 0.5; } // +50% de velocidad
};

// golpes: el escudo bloquea de frente (los golpes pesados lo atraviesan a medias)
const _damageEnemyV = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (e && !e.dead && e.mut === 'escudado' && !o.quiet) {
    const sx = o.fx ?? P.x, sy = o.fy ?? P.y, a = Math.atan2(sy - e.y, sx - e.x);
    if (Math.abs(angDiff(a, e.shA)) < 1.05) {
      base *= o.heavy ? 0.55 : 0.18;
      if (!e.blkT || now - e.blkT > 0.6) { e.blkT = now; addText(e.x, e.y - e.r * 2.2, "Blocked!", '#c8d8f0', 0.7); sparks(e.x + Math.cos(e.shA) * e.r, e.y - e.r * 0.6 + Math.sin(e.shA) * e.r * 0.5, 6, '#e8f0ff', 220); }
    }
  }
  return _damageEnemyV(e, base, o);
};

// muertes: explosión y división
const _killEnemyV = killEnemy;
killEnemy = function (e) {
  const was = e.dead;
  _killEnemyV(e);
  if (was || scene !== 'rift') return;
  if (e.mut === 'volatil') {
    addHazard('meteor', e.x, e.y, 74, 0.9, e.dmg * 1.6, { src: e });
    addText(e.x, e.y - e.r * 2, "It's going to blow!", '#ff8a5a', 0.8);
  } else if (e.mut === 'divisible') {
    for (const s of [-1, 1]) {
      const c = spawnEnemy(e.type, e.x + s * e.r, e.y, { lvl: e.lvl });
      c.child = true; c.mut = null;
      c.hp = c.maxHp = Math.max(1, Math.round(e.maxHp * 0.35)); c.r *= 0.72; c.speed *= 1.2; c.dmg *= 0.6; c.spawnT = 0.15;
      c.kvx = s * 220; c.kvy = rand(-60, 60);
      poof(c.x, c.y);
    }
  }
  if (riftEvent && riftEvent.kind === 'eclipse' && !riftEvent.done) dropPickup(e.x, e.y, 'kama', { val: Math.max(1, Math.round((3 + rift.level) * rift.D.reward)) });
};

// dibujo: aro de color, icono y escudo
const _drawEnemyV = drawEnemy;
drawEnemy = function (e) {
  if (e.mut && !e.dead) {
    const M = MUTS[e.mut];
    if (e.blink) { ctx.save(); ctx.globalAlpha = 0.6; glow(e.blink.x, e.blink.y, 30, M.color, 0.6); ctx.translate(e.blink.x, e.blink.y); ctx.scale(1, 0.45); circle(0, 0, 22 * (0.6 + 0.4 * Math.sin(now * 20)), null, `rgba(${M.color},1)`, 2); ctx.restore(); }
  }
  if (e.goblin && !e.dead) glow(e.x, e.y - e.r, e.r * 2.6, '255,214,90', 0.55 + Math.sin(now * 8) * 0.15);
  _drawEnemyV(e);
  if (e.mut && !e.dead) {
    const M = MUTS[e.mut];
    // indicador flotante sobre la cabeza (estilo flecha de jugador): icono en una placa y punta hacia abajo
    const bob = Math.sin(now * 4 + e.seed) * 2.5;
    const ax = e.x, ay = e.y - Math.max(e.r * 2.2, (e.hTop || 0) + 8) - (e.z || 0) - 10 + bob;
    ctx.save();
    glow(ax, ay - 10, 18, M.color, 0.35);
    ctx.fillStyle = `rgb(${M.color})`; ctx.strokeStyle = 'rgba(8,10,20,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax - 7, ay - 4); ctx.lineTo(ax + 7, ay - 4); ctx.lineTo(ax, ay + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    circle(ax, ay - 13, 9.5, 'rgba(10,12,24,0.88)', `rgb(${M.color})`, 2);
    ctx.restore();
    text(M.icon, ax, ay - 13, 11, `rgb(${M.color})`, 'center', 900, false);
    if (e.mut === 'escudado') {
      ctx.save(); ctx.translate(e.x, e.y - e.r * 0.7);
      ctx.strokeStyle = 'rgba(210,225,250,0.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(0, 0, e.r * 1.25, e.r * 0.9, 0, e.shA - 0.95, e.shA + 0.95); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,150,200,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, e.r * 1.25, e.r * 0.9, 0, e.shA - 0.95, e.shA + 0.95); ctx.stroke();
      ctx.restore();
    }
  }
};

// ============================================================
// B) Eventos nuevos
// ============================================================
Object.assign(RIFT_EVENTS, {
  goblin: { name: "Golden Goblin", desc: "A goblin loaded with amber! Catch it before it escapes", color: '#ffd54f' },
  cursed: { name: "Cursed Chest", desc: "Open it if you dare: the Rift will defend it", color: '#c07cf0' },
  arena: { name: "Elite Arena", desc: "You're locked in: defeat the elites and a god will reward you", color: '#ff5a3d' },
  pact: { name: "Risky Pact", desc: "An epic blessing in exchange for monsters hitting harder", color: '#ff7ad8' },
  eclipse: { name: "Eclipse", desc: "Darkness for 20 s: more monsters, double amber", color: '#8a7cff' },
});
const NEW_EVENTS = ['goblin', 'cursed', 'arena', 'pact', 'eclipse'];

const _resetRiftEventsV = resetRiftEvents;
resetRiftEvents = function () { _resetRiftEventsV(); if (rift) { rift.eventT = rand(24, 38); rift.curse = 0; } };
const _startRiftEventV = startRiftEvent;
startRiftEvent = function (force) {
  // sin repetir el mismo evento dos veces seguidas
  let kind = force;
  if (!kind) { const ks = Object.keys(RIFT_EVENTS).filter((k) => k !== rift.lastEv); kind = pick(ks); }
  rift.lastEv = kind;
  _startRiftEventV(kind);
  rift.eventT = rand(38, 58);
  const ev = riftEvent;
  if (kind === 'goblin') {
    const a = rand(0, TAU), g = spawnEnemy('tofu', clamp(P.x + Math.cos(a) * 240, 60, WORLD.w - 60), clamp(P.y + Math.sin(a) * 240, 60, WORLD.h - 60), {});
    g.goblin = true; g.mut = null; g.name = "Golden Goblin"; g.ai = 'goblin'; // sin IA de ataque: solo huye
    g.hp = g.maxHp = Math.round(Math.max(g.maxHp * 6, (typeof hitAvg !== 'undefined' && hitAvg ? hitAvg : 30) * 22));
    g.speed *= 1.25; g.dmg = 0; g.r *= 1.2; g.spawnT = 0.4;
    ev.mob = g; ev.esc = 16;
  } else if (kind === 'arena') {
    ev.x = P.x; ev.y = P.y; ev.bar = { x: P.x, y: P.y, R: 260 }; ev.wave = 0; ev.mobs = [];
    arenaWave(ev);
  } else if (kind === 'eclipse') ev.dur = 20;
};
function arenaWave(ev) {
  ev.wave++;
  const n = 2 + ev.wave;
  ev.mobs = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand(-0.2, 0.2);
    const m = spawnEnemy(pick(Object.keys(rift.biome.weights)), ev.bar.x + Math.cos(a) * 200, ev.bar.y + Math.sin(a) * 200, { elite: i < ev.wave });
    poof(m.x, m.y); ev.mobs.push(m);
  }
  showBanner(`Arena · wave ${ev.wave}/2`, '#ff5a3d', "You can't leave the circle until you win");
}
function goblinTick(g, dt) {
  const ev = riftEvent;
  if (g.dead) return;
  // huye del héroe
  const a = Math.atan2(g.y - P.y, g.x - P.x), d = dist(g.x, g.y, P.x, P.y);
  if (d < 360) { g.x = clamp(g.x + Math.cos(a + Math.sin(now * 2) * 0.6) * g.speed * 0.9 * dt, 40, WORLD.w - 40); g.y = clamp(g.y + Math.sin(a + Math.sin(now * 2) * 0.6) * g.speed * 0.9 * dt, 40, WORLD.h - 40); }
  if (Math.random() < dt * 3) particles.push({ kind: 'glowdot', x: g.x + rand(-8, 8), y: g.y - rand(4, 20), vx: 0, vy: -30, life: 0.6, max: 0.6, rgb: '255,214,90', size: 4, grav: 0 });
  if (ev && ev.kind === 'goblin' && !ev.done) {
    ev.esc -= dt;
    if (ev.esc <= 0) { poof(g.x, g.y); g.dead = true; addText(g.x, g.y - 30, "It got away!", '#ffd54f', 1); SFX.play('dash'); finishRiftEvent(false); }
  }
}
// cada golpe al duende suelta ámbar
const _damageEnemyG = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  const r = _damageEnemyG(e, base, o);
  if (e && e.goblin && !o.quiet && Math.random() < 0.6) dropPickup(e.x, e.y, 'kama', { val: Math.max(1, Math.round((2 + rift.level) * rift.D.reward)) });
  return r;
};

const _updateRiftEventsV = updateRiftEvents;
updateRiftEvents = function (dt) {
  _updateRiftEventsV(dt);
  const ev = riftEvent;
  if (!ev || ev.done || !NEW_EVENTS.includes(ev.kind) || !rift) return;
  if (ev.kind === 'goblin') {
    if (ev.mob && ev.mob.dead && ev.esc > 0) {
      const nK = Math.round((60 + rift.level * 16) * rift.D.reward);
      for (let i = 0; i < 10; i++) dropPickup(ev.mob.x, ev.mob.y, 'kama', { val: Math.round(nK / 10) });
      dropPickup(ev.mob.x, ev.mob.y, 'item', { item: makeItem(S.cls, itemLevel() + 1, rollDiffRarity(rift.D, 0.5)) });
      showBanner("Goblin caught!", '#ffd54f', '+' + nK + " amber and an item");
      SFX.play('legend'); finishRiftEvent(true);
    }
  } else if (ev.kind === 'cursed') {
    if (!ev.open && dist(P.x, P.y, ev.x, ev.y) < 44) {
      ev.open = true; ev.bar = { x: ev.x, y: ev.y, R: 240 }; ev.wave = 0; ev.waveT = 0;
      showBanner("The Rift defends the chest!", '#c07cf0', "Survive three waves inside the circle");
      SFX.play('boss'); shake(8);
    }
    if (ev.open) {
      ev.waveT -= dt;
      const alive = enemies.filter((q) => !q.dead && ev.mobs && ev.mobs.includes(q)).length;
      if (ev.wave < 3 && (ev.waveT <= 0 || alive === 0)) {
        ev.wave++; ev.waveT = 9; ev.mobs = ev.mobs || [];
        for (let i = 0; i < 4 + ev.wave; i++) {
          const a = rand(0, TAU), m = spawnEnemy(pick(Object.keys(rift.biome.weights)), ev.x + Math.cos(a) * 190, ev.y + Math.sin(a) * 190, { elite: i === 0 && ev.wave === 3 });
          poof(m.x, m.y); ev.mobs.push(m);
        }
        subBanner = { text: `Wave ${ev.wave}/3`, t: 2, max: 2 };
      } else if (ev.wave >= 3 && alive === 0) {
        dropPickup(ev.x, ev.y, 'item', { item: makeItem(S.cls, itemLevel() + 2, 3) });
        const nK = Math.round((80 + rift.level * 20) * rift.D.reward);
        for (let i = 0; i < 8; i++) dropPickup(ev.x, ev.y, 'kama', { val: Math.round(nK / 8) });
        showBanner("Cursed chest conquered!", '#ffd54f', "A legendary item is yours");
        hitFlash(ev.x, ev.y - 14, 50, '220,160,255'); SFX.play('legend');
        ev.bar = null; finishRiftEvent(true);
      }
    } else if (ev.t > 50) finishRiftEvent(false);
  } else if (ev.kind === 'arena') {
    if (ev.mobs.every((m) => m.dead)) {
      if (ev.wave < 2) arenaWave(ev);
      else {
        ev.bar = null;
        const b = bst();
        if (b) {
          const god = pick(Object.keys(GODS));
          b.altars.push({ x: clamp(P.x + 90, 80, WORLD.w - 80), y: P.y, god, t: 0, minR: 1 });
          showBanner("Arena cleared!", '#7cff8a', "A god offers you an extra blessing");
        }
        SFX.play('legend'); finishRiftEvent(true);
      }
    }
  } else if (ev.kind === 'pact') {
    if (!ev.used && dist(P.x, P.y, ev.x, ev.y) < 44) {
      ev.used = true;
      rift.curse = 1.3;
      for (const q of enemies) if (!q.dead) q.dmg *= 1.3;
      const b = bst();
      if (b) b.altars.push({ x: clamp(ev.x + 70, 80, WORLD.w - 80), y: ev.y, god: pick(Object.keys(GODS)), t: 0, minR: 2 });
      showBanner("Pact sealed", '#ff7ad8', "Epic blessing at your side · monsters hit 30% harder");
      rings.push({ x: ev.x, y: ev.y, r0: 10, r1: 180, life: 0.5, max: 0.5, color: 'rgba(255,122,216,' });
      SFX.play('boss'); finishRiftEvent(true);
    } else if (!ev.used && ev.t > 45) finishRiftEvent(false);
  } else if (ev.kind === 'eclipse') {
    rift.spawnT = Math.min(rift.spawnT, 0.6);
    if (ev.t > ev.dur) { showBanner("The eclipse ends", '#c8b8ff', "You survived the darkness"); finishRiftEvent(true); }
  }
};

// el círculo cerrado no deja salir al héroe
const _updatePlayerV = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerV(dt);
  const ev = riftEvent, B = ev && !ev.done && ev.bar;
  if (!B || scene !== 'rift') return;
  const d = dist(P.x, P.y, B.x, B.y);
  if (d > B.R - 14) { const a = Math.atan2(P.y - B.y, P.x - B.x); P.x = B.x + Math.cos(a) * (B.R - 14); P.y = B.y + Math.sin(a) * (B.R - 14); }
};

// dibujo de los eventos nuevos
const _drawRiftEventsV = drawRiftEvents;
drawRiftEvents = function () {
  const ev = riftEvent;
  if (!ev || !NEW_EVENTS.includes(ev.kind)) return _drawRiftEventsV();
  if (ev.bar && !ev.done) {
    const B = ev.bar;
    ctx.save(); ctx.translate(B.x, B.y); ctx.scale(1, 0.55);
    ctx.globalAlpha = 0.75 + Math.sin(now * 4) * 0.15;
    circle(0, 0, B.R, null, ev.kind === 'arena' ? 'rgba(255,90,60,0.9)' : 'rgba(192,124,240,0.9)', 4);
    ctx.setLineDash([6, 14]); circle(0, 0, B.R - 10, null, 'rgba(255,230,200,0.5)', 2); ctx.setLineDash([]);
    ctx.restore();
  }
  if ((ev.kind === 'cursed' && !ev.done) || (ev.kind === 'pact' && !ev.used)) {
    const col = ev.kind === 'cursed' ? '192,124,240' : '255,122,216';
    glow(ev.x, ev.y - 20, 70, col, 0.55 + Math.sin(now * 4) * 0.15);
    shadow(ev.x, ev.y + 1, 22);
    ctx.save(); ctx.translate(ev.x, ev.y - Math.sin(now * 3) * 2);
    if (ev.kind === 'cursed') {
      ctx.fillStyle = '#2a1838'; ctx.fillRect(-20, -24, 40, 22);
      ctx.fillStyle = '#4a2a5a'; ctx.beginPath(); ctx.moveTo(-20, -24); ctx.quadraticCurveTo(0, -40, 20, -24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c07cf0'; ctx.fillRect(-20, -26, 40, 3); ctx.fillRect(-3, -28, 6, 12);
      ctx.fillStyle = '#ff7ad8'; ctx.fillRect(-12, -14, 4, 4); ctx.fillRect(8, -14, 4, 4);
    } else {
      ctx.fillStyle = '#3a2a3a'; ctx.fillRect(-14, -40, 28, 40);
      ctx.fillStyle = '#5a3a5a'; ctx.fillRect(-18, -44, 36, 6);
      ctx.fillStyle = `rgba(${col},1)`; ctx.beginPath(); ctx.arc(0, -56, 9 + Math.sin(now * 5), 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd0f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(6, -16); ctx.moveTo(6, -30); ctx.lineTo(-6, -16); ctx.stroke();
    }
    ctx.restore();
    text(ev.kind === 'cursed' ? "Cursed Chest" : "Pact", ev.x, ev.y - 70, 11, `rgb(${col})`, 'center', 900);
  }
};

// eclipse: oscuridad salvo alrededor del héroe
const _drawHUDV = drawHUD;
drawHUD = function () {
  const ev = riftEvent;
  if (scene === 'rift' && ev && ev.kind === 'eclipse' && !ev.done && P) {
    const k = Math.min(1, ev.t / 1.5, (ev.dur - ev.t) / 1.5);
    const px = W / 2 + (P.x - cam.x) * zoom, py = H / 2 + (P.y - 20 - cam.y) * zoom;
    const g = ctx.createRadialGradient(px, py, 70 * zoom, px, py, 230 * zoom);
    g.addColorStop(0, 'rgba(4,2,16,0)');
    g.addColorStop(1, `rgba(4,2,16,${0.88 * k})`);
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  _drawHUDV();
};

// al terminar un evento, solo se borra ese (no el siguiente si ya empezó otro)
finishRiftEvent = function (success) {
  const ev = riftEvent;
  if (!ev || ev.done) return;
  ev.done = true;
  if (success) { trackDaily('event', 1); rift.events = (rift.events || 0) + 1; }
  later(1.5, () => { if (riftEvent === ev) riftEvent = null; });
};
