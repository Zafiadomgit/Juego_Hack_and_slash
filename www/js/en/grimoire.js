/* Fendaria — Grimorio y árbol de talentos 2.
 * GRIMORIO: cada héroe tiene 5 habilidades (las 3 de siempre + 2 nuevas) y 2 definitivas (la de siempre + 1 nueva).
 *   En la ficha (pestaña Grimorio) eliges qué habilidad va en cada botón y qué definitiva llevas. Gratis en Villa Candela.
 *   Cada habilidad se lanza por su camino de siempre esté en el botón que esté: bendiciones, talentos y ataques Ω
 *   reaccionan igual. Las nuevas pasan por la misma cadena con el índice 9 y su efecto se lanza aquí.
 * ÁRBOL 2: las filas se abren con los puntos gastados EN TOTAL (ya no hace falta el nodo anterior de la rama, así que
 *   se pueden mezclar ramas), solo puede haber UN culmen en todo el árbol, y la columna del Grimorio desbloquea
 *   las 2 habilidades nuevas y la definitiva nueva. Reiniciar sigue siendo gratis en la villa.
 * Va cargado al final: su useSkill tiene que ser el de fuera para que los demás vean el índice de siempre.
 */
'use strict';

const GRIM_NEW = 9; // índice con el que las habilidades nuevas recorren la cadena de useSkill
const gNear = (r) => nearestEnemy(P.x, P.y, r);
const gAim = (r) => aimAt(r);
const gAlive = (r) => enemies.filter((e) => !e.dead && e.z <= 30 && dist(e.x, e.y, P.x, P.y) < r);
const gTimer = (k, t) => { P[k] = t; recalc(); };

// ---------- habilidades y definitivas nuevas ----------
const GRIMOIRE = {
  iop: {
    s: [
      { name: "Iron Chain", icon: '⛓', art: 'swords', cost: 3, cd: 7, desc: "Throw a chain in a line: it damages and drags towards you everyone it touches",
        fx() {
          const a = gAim(380);
          for (const e of gAlive(360)) {
            const d = Math.abs(((Math.atan2(e.y - P.y, e.x - P.x) - a + Math.PI * 3) % TAU) - Math.PI);
            if (d > 0.38) continue;
            damageEnemy(e, skillDmg(1.6), { fx: P.x, fy: P.y });
            const b = Math.atan2(P.y - e.y, P.x - e.x), k = 520 * (e.D.kbRes ?? 1);
            e.kvx += Math.cos(b) * k; e.kvy += Math.sin(b) * k;
          }
          for (let i = 1; i <= 9; i++) sparks(P.x + Math.cos(a) * i * 38, P.y - 10 + Math.sin(a) * i * 38, 2, '#d8dde8', 120);
          shake(4); SFX.play('swing');
        } },
      { name: "Runic Hammer", icon: '🔨', art: 'volcano', cost: 4, cd: 8, desc: "Slam the ground in front of you: a wave of runic fire that stuns for 1.2 s",
        fx() {
          const a = gAim(220), x = P.x + Math.cos(a) * 80, y = P.y + Math.sin(a) * 80;
          aoe(x, y, 115, skillDmg(2.2), 300, true);
          for (const e of gAlive(800)) if (dist(e.x, e.y, x, y) < 115 + e.r) stunEnemy(e, 1.2);
          spawnVfx('runeFire', x, y, 210, { dur: 0.6 });
          addDecal('scorch', x, y, 90, 3, '255,120,40');
          shake(8); zoomPunch = Math.max(zoomPunch, 0.03); SFX.play('boom');
        } },
    ],
    u: { name: "Giant's Wrath", icon: '🗿', art: 'giant', desc: "For 8 s you deal 60% more damage and every basic hit releases a shockwave around it",
      fx() { gTimer('giantT', 8); rings.push({ x: P.x, y: P.y, r0: 20, r1: 180, life: 0.5, max: 0.5, color: 'rgba(255,140,60,' }); } },
  },
  cra: {
    s: [
      { name: "Venom Rain", icon: '☔', art: 'poison', cost: 4, cd: 8, desc: "A rain of poisoned arrows covers the area for 4 s: it damages and poisons",
        fx() {
          const t = gNear(440), a = gAim(440), x = t ? t.x : P.x + Math.cos(a) * 220, y = t ? t.y : P.y + Math.sin(a) * 220;
          glyphs.push({ x, y, r: 110, life: 4, max: 4, tick: 0, mul: 0.7 });
          for (const e of gAlive(900)) if (dist(e.x, e.y, x, y) < 110 + e.r) damageEnemy(e, skillDmg(0.8), { poison: { t: 4, dps: skillDmg(0.35) } });
          spawnVfx('poison', x, y, 220, { dur: 0.8 });
          SFX.play('arrowrain');
        } },
      { name: "Wind Step", icon: '💨', art: 'gust', cost: 3, cd: 6, desc: "Leap backwards and fire 5 arrows in a fan ahead",
        fx() {
          const a = gAim(440);
          P.x = clamp(P.x - Math.cos(a) * 130, 40, WORLD.w - 40); P.y = clamp(P.y - Math.sin(a) * 130, 40, WORLD.h - 40);
          P.invul = Math.max(P.invul, 0.4); dust(P.x, P.y, 8);
          for (let i = -2; i <= 2; i++) {
            const b = a + i * 0.16;
            projectiles.push({ team: 'p', kind: 'arrow', x: P.x, y: P.y - 8, vx: Math.cos(b) * 720, vy: Math.sin(b) * 720, r: 7, dmg: skillDmg(1.1), life: 0.7, pierce: 1, kb: 120, hit: [] });
          }
          SFX.play('dash');
        } },
    ],
    u: { name: "Royal Hawk", icon: '🦅', art: 'eye', desc: "For 6 s, every half second a golden arrow seeks the nearest enemy and pierces it",
      fx() {
        for (let k = 0; k < 12; k++) later(k * 0.5, () => {
          if (!P || scene !== 'rift') return;
          const t = gNear(720); if (!t) return;
          const a = Math.atan2(t.y - P.y, t.x - P.x);
          projectiles.push({ team: 'p', kind: 'arrow', x: P.x, y: P.y - 10, vx: Math.cos(a) * 950, vy: Math.sin(a) * 950, r: 9, dmg: skillDmg(3 * ultMul()), life: 1, pierce: 4, kb: 200, hit: [] });
          hitFlash(P.x, P.y - 14, 26, '255,214,110'); SFX.play('shoot');
        });
      } },
  },
  feca: {
    s: [
      { name: "Arcane Orb", icon: '🔮', art: 'orb', cost: 4, cd: 7, desc: "A slow orb passes through every enemy and explodes at the end of its path",
        fx() {
          const a = gAim(500), p = { team: 'p', kind: 'orb', x: P.x, y: P.y - 10, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 16, dmg: skillDmg(1.2), life: 1.6, pierce: 99, kb: 60, hit: [] };
          projectiles.push(p);
          later(1.5, () => {
            if (scene !== 'rift') return;
            aoe(p.x, p.y, 120, skillDmg(1.8), 300, true);
            spawnVfx('runeBlue', p.x, p.y, 200, { dur: 0.6 }); shake(5); SFX.play('boom');
          });
          SFX.play('magic');
        } },
      { name: "Reflecting Aegis", icon: '⛨', art: 'aegis', cost: 4, cd: 10, desc: "A shield worth 25% of your health and a wave that pushes nearby enemies away",
        fx() {
          P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * 0.25)); P.shieldT = Math.max(P.shieldT || 0, 5);
          aoe(P.x, P.y, 140, skillDmg(1), 520);
          spawnVfx('shield', P.x, P.y - 20, 170, { dur: 0.8, follow: () => ({ x: P.x, y: P.y - 20 }) });
          rings.push({ x: P.x, y: P.y, r0: 20, r1: 140, life: 0.35, max: 0.35, color: 'rgba(150,210,255,' });
          SFX.play('shield');
        } },
    ],
    u: { name: "Runic Storm", icon: '⚡', art: 'bolt', desc: "14 runic bolts strike nearby enemies over 3 s",
      fx() {
        for (let k = 0; k < 14; k++) later(k * 0.22, () => {
          if (!P || scene !== 'rift') return;
          const near = gAlive(540), e = near.length ? pick(near) : null;
          const x = e ? e.x : P.x + rand(-220, 220), y = e ? e.y : P.y + rand(-160, 160);
          aoe(x, y, 70, skillDmg(2.4 * ultMul()), 160, true);
          hitFlash(x, y - 24, 44, '140,200,255'); sparks(x, y - 10, 10, '#bfe2ff', 320);
          SFX.play('zaap');
        });
      } },
  },
  sombra: {
    s: [
      { name: "Execution", icon: '🗡', art: 'skull', cost: 3, cd: 7, desc: "Appear next to the most wounded enemy and stab it; below 35% health the blow is lethal",
        fx(c) {
          const list = gAlive(400).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp), e = list[0];
          if (!e) { c.refund(); return; }
          poof(P.x, P.y);
          const a = Math.atan2(e.y - P.y, e.x - P.x);
          P.x = e.x - Math.cos(a) * (e.r + 18); P.y = e.y - Math.sin(a) * (e.r + 18); P.dir = a;
          damageEnemy(e, skillDmg(e.hp < e.maxHp * 0.35 ? 5 : 2.6), { crit: true, fx: P.x, fy: P.y, heavy: true });
          poof(P.x, P.y); SFX.play('swing');
        } },
      { name: "Dagger Rain", icon: '✧', art: 'thousandcuts', cost: 4, cd: 8, desc: "14 daggers fly out in a circle around you",
        fx() {
          for (let i = 0; i < 14; i++) {
            const a = (i / 14) * TAU;
            projectiles.push({ team: 'p', kind: 'dagger', look: 'dagger', x: P.x, y: P.y - 8, vx: Math.cos(a) * 580, vy: Math.sin(a) * 580, r: 7, dmg: skillDmg(0.9), life: 0.6, pierce: 1, kb: 80, hit: [] });
          }
          SFX.play('swing');
        } },
    ],
    u: { name: "Death Mark", icon: '☠', art: 'eclipse', desc: "Mark the 6 nearest enemies: after 2 s each mark bursts for huge damage",
      fx() {
        const marks = gAlive(520).sort((a, b) => dist(a.x, a.y, P.x, P.y) - dist(b.x, b.y, P.x, P.y)).slice(0, 6);
        for (const e of marks) { addText(e.x, e.y - e.r * 2.4, '☠', '#c77dff', 2); hitFlash(e.x, e.y - e.r, 30, '200,120,255'); }
        later(2, () => {
          for (const e of marks) {
            if (e.dead) continue;
            damageEnemy(e, skillDmg(5 * ultMul()), { crit: true, heavy: true, fx: e.x, fy: e.y });
            spawnVfx('poison', e.x, e.y, 150, { dur: 0.6 });
          }
          shake(9); SFX.play('boom');
        });
      } },
  },
  domadora: {
    s: [
      { name: "Ancestral Howl", icon: '🐺', art: 'fullmoon', cost: 3, cd: 9, desc: "Your wolves rage for 8 s and you heal 8%; with no wolves, you call two",
        fx() {
          let wolves = minions.filter((m) => m.kind === 'wolf');
          if (!wolves.length) for (let k = 0; k < 2; k++) {
            const a = rand(0, TAU), w = { kind: 'wolf', x: P.x + Math.cos(a) * 30, y: P.y + Math.sin(a) * 30, life: 16, atkCd: 0.3, dir: 0, walkT: 0, moving: false, seed: rand(0, 9) };
            minions.push(w); poof(w.x, w.y);
          }
          wolves = minions.filter((m) => m.kind === 'wolf');
          for (const m of wolves) { m.rage = 8; hitFlash(m.x, m.y - 12, 24, '255,120,60'); }
          heal(Math.round(P.maxHp * 0.08));
          rings.push({ x: P.x, y: P.y, r0: 20, r1: 160, life: 0.4, max: 0.4, color: 'rgba(255,200,120,' });
          SFX.play('boss');
        } },
      { name: "Guardian Spirits", icon: '👻', art: 'ghost', cost: 4, cd: 7, desc: "8 spirits burst from you in a circle and pass through enemies",
        fx() {
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * TAU;
            minions.push({ kind: 'spirit', x: P.x, y: P.y, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, life: 0.7, dir: a, walkT: 0, hit: [], dmg: skillDmg(1.3) });
          }
          SFX.play('magic');
        } },
    ],
    u: { name: "Great Hunt", icon: '🐾', art: 'paw', desc: "Four raging wolves answer your call for 20 s",
      fx() {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * TAU, w = { kind: 'wolf', x: P.x + Math.cos(a) * 40, y: P.y + Math.sin(a) * 40, life: 20, atkCd: 0.2, dir: 0, walkT: 0, moving: false, seed: rand(0, 9), rage: 10 };
          minions.push(w); poof(w.x, w.y);
        }
        const wolves = minions.filter((m) => m.kind === 'wolf');
        if (wolves.length > 7) wolves.sort((a, b) => a.life - b.life).slice(0, wolves.length - 7).forEach((m) => { m.life = 0; });
        SFX.play('baa');
      } },
  },
  artificiera: {
    s: [
      { name: "Fragmentation Grenade", icon: '💣', art: 'powder', cost: 4, cd: 7, desc: "A grenade that releases 5 small bombs around it when it explodes",
        fx() {
          const t = gNear(460), a = gAim(460);
          throwBomb(t ? t.x : P.x + Math.cos(a) * 220, t ? t.y : P.y + Math.sin(a) * 220, skillDmg(1.6), 90, { cluster: 5 });
          SFX.play('shoot');
        } },
      { name: "Spark Shield", icon: '⚙', art: 'tools', cost: 4, cd: 10, desc: "A shield worth 20% of your health that releases 4 discharges around you",
        fx() {
          P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * 0.2)); P.shieldT = Math.max(P.shieldT || 0, 5);
          for (let k = 0; k < 4; k++) later(k * 0.5, () => {
            if (!P || scene !== 'rift') return;
            aoe(P.x, P.y, 120, skillDmg(0.7), 120);
            rings.push({ x: P.x, y: P.y, r0: 20, r1: 120, life: 0.3, max: 0.3, color: 'rgba(255,220,120,' });
            sparks(P.x, P.y - 10, 10, '#ffe08a', 300);
          });
          SFX.play('zaap');
        } },
    ],
    u: { name: "Rocket Barrage", icon: '☄', art: 'comet', desc: "14 rockets fall on nearby enemies over 2 s",
      fx() {
        for (let k = 0; k < 14; k++) later(k * 0.13, () => {
          if (!P || scene !== 'rift') return;
          const near = gAlive(620), e = near.length ? pick(near) : null;
          throwBomb(e ? e.x + rand(-20, 20) : P.x + rand(-260, 260), e ? e.y + rand(-20, 20) : P.y + rand(-180, 180), skillDmg(2.2 * ultMul()), 100, { big: k % 4 === 0 });
        });
      } },
  },
  berserker: {
    s: [
      { name: "Crimson Cleave", icon: '🩸', art: 'blood', cost: 3, cd: 6, desc: "A huge slash in front of you; you heal 5% for each enemy hit (up to 25%)",
        fx() {
          const a = gAim(220);
          const hit = gAlive(170).filter((e) => Math.abs(((Math.atan2(e.y - P.y, e.x - P.x) - a + Math.PI * 3) % TAU) - Math.PI) < 1.6).length;
          meleeArc(P.x, P.y, a, 160, 1.6, skillDmg(2.2), 300, true);
          slashes.push({ x: P.x, y: P.y, dir: a, arc: 3.2, range: 160, life: 0.22, max: 0.22, color: '#ff3d4a', side: 1, width: 34, follow: true });
          if (hit) heal(Math.round(P.maxHp * Math.min(0.25, 0.05 * hit)));
          shake(5); SFX.play('swing');
        } },
      { name: "Challenge", icon: '📯', art: 'horn', cost: 3, cd: 10, desc: "A shout that strikes around you and grants 30% damage reduction for 5 s",
        fx() {
          gTimer('defyT', 5);
          aoe(P.x, P.y, 150, skillDmg(1), 260);
          rings.push({ x: P.x, y: P.y, r0: 20, r1: 150, life: 0.4, max: 0.4, color: 'rgba(255,80,60,' });
          shake(6); SFX.play('boss');
        } },
    ],
    u: { name: "Boiling Blood", icon: '😡', art: 'rage', desc: "For 8 s you deal 40% more damage and steal 15% of damage as health",
      fx() { gTimer('boilT', 8); rings.push({ x: P.x, y: P.y, r0: 20, r1: 170, life: 0.5, max: 0.5, color: 'rgba(255,40,40,' }); } },
  },
};

// ---------- base de cada héroe (lo de siempre) ----------
const GRIM_BASE = {}, ART_BASE = {}, ULT_BASE = {};
for (const id of Object.keys(GRIMOIRE)) {
  if (!CLASSES[id]) continue;
  GRIM_BASE[id] = CLASSES[id].skills.slice();
  GRIM_BASE[id].forEach((sk, i) => { sk.gIdx = i; });
  GRIMOIRE[id].s.forEach((sk, i) => { sk.gIdx = 3 + i; sk.gNew = true; });
  ART_BASE[id] = (SKILL_ART[id] || []).slice();
  ULT_BASE[id] = ULTIMATES[id];
}
// los kits de las clases nuevas tratan cualquier índice distinto de 0 como su segundo hechizo: el 9 es nuestro
for (const id of Object.keys(CLASS_KIT)) {
  const k = CLASS_KIT[id], sk = k.skill;
  k.skill = function (i) { if (i < 3) return sk.call(this, i); };
}

// ---------- equipo del Grimorio ----------
const GRIM_NEED = { s3: 4, s4: 10, u1: 18 }; // puntos gastados en total para cada nodo del Grimorio
const grimHas = (k) => talRank('grim.' + k) > 0;
const grimSkillOpen = (idx) => idx < 3 || (idx === 3 ? grimHas('s3') : idx === 4 ? grimHas('s4') : false);
function grimState() {
  if (!S.grim) S.grim = { sk: [0, 1, 2], ult: 0 };
  const g = S.grim;
  // lo que ya no está desbloqueado (árbol reiniciado) vuelve a lo de siempre, sin repetir
  g.sk = g.sk.map((v, i) => (grimSkillOpen(v) ? v : i));
  if (new Set(g.sk).size < 3) g.sk = [0, 1, 2];
  if (g.ult && !grimHas('u1')) g.ult = 0;
  return g;
}
const grimSkillDef = (cls, idx) => (idx < 3 ? GRIM_BASE[cls][idx] : GRIMOIRE[cls].s[idx - 3]);
function applyLoadout() {
  if (!S || !GRIMOIRE[S.cls] || !GRIM_BASE[S.cls]) return;
  const cls = S.cls, g = grimState(), C = CLASSES[cls];
  C.skills = g.sk.map((idx) => grimSkillDef(cls, idx));
  if (SKILL_ART[cls]) {
    const art = ART_BASE[cls].slice();
    g.sk.forEach((idx, j) => { art[j + 1] = idx < 3 ? ART_BASE[cls][idx + 1] : GRIMOIRE[cls].s[idx - 3].art; });
    art[4] = g.ult ? GRIMOIRE[cls].u.art : ART_BASE[cls][4];
    SKILL_ART[cls] = art;
  }
  ULTIMATES[cls] = g.ult ? GRIMOIRE[cls].u : ULT_BASE[cls];
  if (P && P.cls === cls) P.C = C;
}
const _createPlayerG = createPlayer;
createPlayer = function () { applyLoadout(); _createPlayerG(); };

// ---------- lanzar: cada habilidad por su camino de siempre ----------
const _useSkillG = useSkill;
useSkill = function (j) {
  if (!P || !GRIM_BASE[P.cls] || !P.C.skills[j] || P.C.skills[j].gIdx === undefined) return _useSkillG(j);
  const sk = P.C.skills[j], k = sk.gNew ? GRIM_NEW : sk.gIdx;
  if (k === j) return _useSkillG(j); // en su botón de siempre
  if (P.skillCd[j] > 0) return;
  const shown = P.C.skills, cds = P.skillCd, keep = cds[k] || 0, pa0 = P.pa;
  const run = GRIM_BASE[P.cls].slice(); if (sk.gNew) run[GRIM_NEW] = sk;
  P.C.skills = run; cds[k] = 0;
  try { _useSkillG(k); } finally { P.C.skills = shown; }
  const fired = P.pa < pa0 - 1e-6 || cds[k] > 0;
  if (fired) cds[j] = cds[k];
  cds[k] = k === GRIM_NEW ? 0 : keep;
  if (fired && sk.gNew) sk.fx({ refund: () => { P.pa = Math.min(P.maxPa, P.pa + sk.cost); cds[j] = 0; } });
};
// definitiva nueva (content.js la llama antes de la de siempre)
function grimUltFx() {
  if (!S || !S.grim || !S.grim.ult || !GRIMOIRE[P.cls]) return false;
  GRIMOIRE[P.cls].u.fx();
  return true;
}

// ---------- efectos con duración (Ira del Gigante, Desafío, Sangre Hirviente) ----------
{
  const _derivedG = derived;
  derived = function () {
    const d = _derivedG();
    if (!P) return d;
    if (P.giantT > 0) d.dmgMul *= 1.6;
    if (P.boilT > 0) d.dmgMul *= 1.4;
    if (P.defyT > 0) d.armor = Math.min(0.8, d.armor + 0.3);
    return d;
  };
}
const _updatePlayerG = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerG(dt);
  if (!P) return;
  for (const k of ['giantT', 'boilT', 'defyT']) if (P[k] > 0) { P[k] -= dt; if (P[k] <= 0) { P[k] = 0; recalc(); } }
};
const _basicAttackG = basicAttack;
basicAttack = function () {
  const cd0 = P.atkCd;
  _basicAttackG();
  if (P.giantT > 0 && P.atkCd > cd0) {
    const x = P.x + Math.cos(P.dir) * 60, y = P.y + Math.sin(P.dir) * 60;
    aoe(x, y, 95, basicDmg() * 0.8, 220);
    rings.push({ x, y, r0: 10, r1: 95, life: 0.25, max: 0.25, color: 'rgba(255,150,70,' });
  }
};
const _stealLifeG = stealLife;
stealLife = function (dmg) { _stealLifeG(dmg); if (P && P.boilT > 0 && P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + dmg * 0.15); };
const _drawPlayerG = drawPlayer;
drawPlayer = function () {
  if (P && scene === 'rift') {
    if (P.giantT > 0) glow(P.x, P.y - 24, 70, '255,140,60', 0.55);
    if (P.boilT > 0) glow(P.x, P.y - 24, 66, '255,40,40', 0.5 + Math.sin(now * 10) * 0.12);
    if (P.defyT > 0) glow(P.x, P.y - 24, 60, '255,210,140', 0.35);
  }
  _drawPlayerG();
};

// ---------- árbol 2: reglas ----------
const TIER_NEED = [0, 2, 4, 7, 10, 14, 18, 24]; // puntos gastados en total para abrir cada fila
const GRIM_NODES = [
  { key: 'grim.s3', row: 2, kind: 's', idx: 3 },
  { key: 'grim.s4', row: 4, kind: 's', idx: 4 },
  { key: 'grim.u1', row: 6, kind: 'u' },
];
const grimNodeDef = (G) => (G.kind === 'u' ? GRIMOIRE[S.cls].u : GRIMOIRE[S.cls].s[G.idx - 3]);
const _talKeysG = talKeys;
talKeys = function () {
  const out = _talKeysG();
  if (S && GRIMOIRE[S.cls]) for (const G of GRIM_NODES) out[G.key] = { br: null, n: { id: G.key, max: 1 }, o: { max: 1 }, i: G.row, grim: G };
  return out;
};
const capTaken = (except) => { const T = talTree(); return T && T.some((br) => br !== except && br.nodes.some((n) => n.cap && nodeRank(br, n) > 0)); };
function talWhy(key) {
  const K0 = talKeys()[key];
  if (!K0) return "Does not exist";
  const r = talRank(key);
  if (r >= K0.o.max) return '';
  if (talPoints() < 1) return "No points: you earn one per level";
  if (K0.grim) { const need = GRIM_NEED[key.slice(5)]; return talSpent() < need ? `You need ${need} points spent in the tree (you have ${talSpent()})` : ''; }
  const { br, n, i } = K0;
  if (n.choice && nodeRank(br, n) > 0 && !r) return "You already chose the other option (reset to change)";
  if (talSpent() < TIER_NEED[i]) return `This row opens at ${TIER_NEED[i]} points spent (you have ${talSpent()})`;
  if (n.cap && capTaken(br)) return "You can only have one capstone: you already chose another (reset to change)";
  return '';
}
talCan = function (key) { return !talWhy(key); };

// árboles de antes: los puntos se devuelven una vez (las reglas han cambiado)
const _migrateSlotG = migrateSlot;
migrateSlot = function (slot) {
  const s = _migrateSlotG(slot);
  if (s && s.talV !== 2) { if (s.tal && Object.keys(s.tal).length) s.talMsg = 1; s.tal = {}; s.talV = 2; }
  return s;
};
const _goHubG = goHub;
goHub = function () {
  _goHubG();
  if (S && S.talMsg) { S.talMsg = 0; persist(); setTimeout(() => { if (typeof sagaCards === 'function') sagaCards([["New talent tree", "Your points have been refunded: spend them again and check the Grimoire"]]); }, 1500); }
};

// ---------- árbol 2: interfaz ----------
const grimImg = (art, fb) => (art ? `<img class="tal-img" src="img/talents/${art}.png" alt="" onerror="this.replaceWith(document.createTextNode('${fb}'))">` : fb);
function t2Node(key, icon, max, extra = '') {
  const r = talRank(key), can = talCan(key), st = r >= max ? 'max' : r ? 'got' : can ? 'can' : 'lock';
  const rank = max > 1 ? `<span class="tv-r">${r}/${max}</span>` : '';
  return `<button class="tv-n ${extra} ${st} ${talSel === key ? 'sel' : ''}" data-k="${key}"><span class="tv-ring"></span><span class="tv-ic">${icon}</span>${rank}</button>`;
}
buildTalents = function () {
  const box = $('shTalents'), T = talTree();
  if (!T || !GRIMOIRE[S.cls]) { box.innerHTML = "<div class=\"tal-soon\">🌳 This hero doesn't have a talent tree yet.</div>"; return; }
  const keys = talKeys(), pts = talPoints(), spent = talSpent();
  if (!talSel || !keys[talSel]) talSel = Object.keys(keys)[0];
  const head = `<div class="t2-cols"><span class="t2-tier"></span><span class="t2-ch grim">📖 Grimoire</span>${T.map((br) => `<span class="t2-ch" style="--c:${br.color}">${talIcon(br.icon, 'sm')} ${br.name}<small>${branchSpent(br)}</small></span>`).join('')}</div>`;
  const rows = TIER_NEED.map((need, row) => {
    const open = spent >= need;
    const G = GRIM_NODES.find((g) => g.row === row);
    const gcell = G ? (() => { const d = grimNodeDef(G); return t2Node(G.key, grimImg(d.art, d.icon), 1, 'grim ' + (G.kind === 'u' ? 'cap' : '')); })() : '';
    const cells = T.map((br) => {
      const n = br.nodes[row];
      if (!n) return '<span class="t2-c"></span>';
      if (!n.choice) return `<span class="t2-c" style="--c:${br.color}">${t2Node(br.id + '.' + n.id, talIcon(n.icon), n.max, n.cap ? 'cap' : '')}</span>`;
      return `<span class="t2-c fork" style="--c:${br.color}">${n.choice.map((o) => t2Node(br.id + '.' + n.id + '.' + o.id, talIcon(o.icon), 1, 'half')).join('<b>o</b>')}</span>`;
    }).join('');
    return `<div class="t2-row ${open ? 'open' : ''}"><span class="t2-tier">${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][row]}<small>${need}</small></span><span class="t2-c grim">${gcell}</span>${cells}</div>`;
  }).join('');
  const K = keys[talSel], r = talRank(talSel), can = talCan(talSel), why = talWhy(talSel);
  let name, desc, kind, color, icon, max, alt = null;
  if (K.grim) {
    const d = grimNodeDef(K.grim);
    name = d.name; desc = d.desc + (K.grim.kind === 's' ? ` · ${d.cost} energy · ${d.cd} s` : ''); kind = K.grim.kind === 'u' ? "📖 New ultimate" : "📖 New skill";
    color = '#ecd18a'; icon = grimImg(d.art, d.icon); max = 1;
  } else {
    const { br, n, o } = K;
    name = o.name; desc = o.d; kind = n.cap ? "★★ Capstone (only one in the whole tree)" : n.choice ? "★ Crossroads" : "Passive";
    color = br.color; icon = talIcon(o.icon); max = o.max;
    if (n.choice) alt = n.choice.find((x) => x !== o);
  }
  const segs = max > 1 ? `<div class="ti-segs">${Array.from({ length: max }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('')}</div>` : '';
  box.innerHTML = `<div class="tv-head"><b>Talents</b>
      <span class="tv-pts ${pts ? 'has' : ''}"><i><img class="pico-ui" src="img/icons/talents.png" width="16" height="16" alt=""></i>${pts}<small>point${pts === 1 ? '' : 's'}</small></span>
      <small class="tv-sp">${spent} spent · rows open with the points you spend</small>
      <button id="talReset" class="tv-reset" ${spent && invReturn === 'hub' ? '' : 'disabled'} title="Free in Candela Village">↺ Reset</button></div>
    <div class="tv-grid"><div class="tv-tree t2">${head}${rows}</div>
      <aside class="tv-info" style="--c:${color}">
        <div class="ti-top"><span class="ti-medal ${r ? 'got' : ''}">${icon}</span>
          <div><div class="ti-n">${name}</div><span class="ti-chip">${kind}</span></div></div>
        <div class="ti-d">${desc}</div>
        ${segs}
        ${alt ? `<div class="ti-alt"><span>or</span><b>${talIcon(alt.icon, 'sm')} ${alt.name}</b>${alt.d}</div>` : ''}
        ${K.grim && r ? '<small class="ti-why ok">Unlocked: equip it in the Grimoire tab</small>' : ''}
        <button id="talLearn" class="ti-learn" ${can ? '' : 'disabled'}>${r >= max ? '✔ Learned' : r ? `Upgrade · rank ${r + 1}` : 'Learn'}</button>
        ${why ? `<small class="ti-why">${why}</small>` : ''}</aside></div>`;
  for (const b of box.querySelectorAll('.tv-n')) b.onclick = () => { talSel = b.dataset.k; SFX.play('click'); buildTalents(); };
  $('talLearn').onclick = () => {
    if (!talCan(talSel)) return;
    talState()[talSel] = r + 1;
    const big = K.grim || (K.n && (K.n.cap || K.n.choice));
    SFX.play(big ? 'legend' : 'level');
    persist(); if (P) recalc();
    if (K.grim && typeof sagaCards === 'function') { const d = grimNodeDef(K.grim); sagaCards([[K.grim.kind === 'u' ? "New ultimate" : "New skill", d.name + " · equip it in the Grimoire"]]); }
    buildTalents(); buildInventory();
    const el = $('shTalents').querySelector(`.tv-n[data-k="${talSel}"]`);
    if (el) el.classList.add('pop');
  };
  $('talReset').onclick = () => { S.tal = {}; grimState(); applyLoadout(); persist(); if (P) recalc(); SFX.play('zaap'); buildTalents(); buildInventory(); };
};

// ---------- Grimorio: interfaz ----------
$('shModes').insertAdjacentHTML('beforeend', "<button data-m=\"grim\" type=\"button\">📖 Grimoire</button>");
document.querySelector('#inv .sh-body').insertAdjacentHTML('beforeend', '<section id="shGrim" class="sh-grim"></section>');
let grimSlot = 0;
const GR_NEW = " <i class=\"gr-new\">New</i>";
function buildGrimoire() {
  const box = $('shGrim');
  if (!S || !GRIMOIRE[S.cls]) { box.innerHTML = "<div class=\"tal-soon\">📖 This hero doesn't have a Grimoire yet.</div>"; return; }
  const cls = S.cls, g = grimState(), edit = invReturn === 'hub';
  const card = (idx) => {
    const d = grimSkillDef(cls, idx), open = grimSkillOpen(idx), at = g.sk.indexOf(idx);
    const art = idx < 3 ? ART_BASE[cls][idx + 1] : d.art;
    const need = idx === 3 ? GRIM_NEED.s3 : GRIM_NEED.s4;
    return `<button class="gr-card ${at >= 0 ? 'on' : ''} ${open ? '' : 'lock'}" data-sk="${idx}" ${open && edit ? '' : 'disabled'}>
      <span class="gr-ic">${grimImg(art, d.icon)}</span><span class="gr-tx"><b>${d.name}${idx >= 3 ? GR_NEW : ''}</b>
      <small>${d.cost} energy · ${d.cd} s — ${d.desc}</small>
      ${at >= 0 ? `<em>Button ${at + 1}</em>` : open ? '' : `<em class="lk">🔒 Tree → Grimoire (${need} points spent)</em>`}</span></button>`;
  };
  const ultCard = (k) => {
    const d = k ? GRIMOIRE[cls].u : ULT_BASE[cls], open = !k || grimHas('u1'), on = g.ult === k;
    const art = k ? d.art : ART_BASE[cls][4];
    return `<button class="gr-card ult ${on ? 'on' : ''} ${open ? '' : 'lock'}" data-ult="${k}" ${open && edit ? '' : 'disabled'}>
      <span class="gr-ic">${grimImg(art, d.icon)}</span><span class="gr-tx"><b>${d.name}${k ? GR_NEW : ''}</b><small>${d.desc}</small>
      ${on ? "<em>Equipped</em>" : open ? '' : `<em class="lk">🔒 Tree → Grimoire (${GRIM_NEED.u1} points spent)</em>`}</span></button>`;
  };
  box.innerHTML = `<div class="tv-head"><b>Grimoire</b><small class="tv-sp">${edit ? "Pick a button and tap the skill you want on it · free in Candela Village" : "Can only be changed in Candela Village"}</small></div>
    <div class="gr-slots">${g.sk.map((idx, j) => { const d = grimSkillDef(cls, idx); return `<button class="gr-slot ${grimSlot === j ? 'sel' : ''}" data-slot="${j}"><small>Button ${j + 1}</small>${d.icon} ${d.name}</button>`; }).join('')}</div>
    <div class="gr-list">${[0, 1, 2, 3, 4].map(card).join('')}</div>
    <h4 class="gr-h">Ultimate</h4>
    <div class="gr-list two">${ultCard(0)}${ultCard(1)}</div>`;
  for (const b of box.querySelectorAll('.gr-slot')) b.onclick = () => { grimSlot = +b.dataset.slot; SFX.play('click'); buildGrimoire(); };
  for (const b of box.querySelectorAll('[data-sk]')) b.onclick = () => {
    const idx = +b.dataset.sk, at = g.sk.indexOf(idx);
    if (at >= 0) { if (at !== grimSlot) { g.sk[at] = g.sk[grimSlot]; g.sk[grimSlot] = idx; } } // ya estaba en otro botón: se intercambian
    else g.sk[grimSlot] = idx;
    applyLoadout(); persist(); SFX.play('level'); buildGrimoire();
  };
  for (const b of box.querySelectorAll('[data-ult]')) b.onclick = () => { g.ult = +b.dataset.ult; applyLoadout(); persist(); SFX.play('legend'); buildGrimoire(); };
}
const _setInvModeG = setInvMode;
setInvMode = function (m) {
  _setInvModeG(m);
  $('inv').classList.toggle('mode-grim', m === 'grim');
  for (const b of $('shModes').querySelectorAll('button')) b.classList.toggle('on', b.dataset.m === m);
  if (m === 'grim') buildGrimoire();
};
