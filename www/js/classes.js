/* Fendaria — clases nuevas: Sombra, Domadora, Artificiera y Berserker.
 * refK ajusta la vida de los monstruos al ritmo de ataque de la clase (los golpes rápidos y flojos
 * de la Sombra cuentan como más daño por segundo que los lentos y fuertes del Berserker).
 * Cada clase tiene su kit (ataque básico, 2 hechizos y definitiva) en CLASS_KIT; el resto del juego
 * (equipo, stats, dificultad, mapa…) funciona igual que con las clases originales.
 */
'use strict';

Object.assign(CLASSES, {
  sombra: {
    name: 'Sombra', role: 'Asesina de dagas', color: '#3a2a5a', hair: '#1c1630',
    desc: 'Capucha negra y dos dagas. Golpes rapidísimos, críticos devastadores y pasos entre las sombras.',
    hp: 88, speed: 192, basicMul: 0.62, refK: 1.6, critBonus: 0.12, critMul: 2.3, weapon: { icon: '🗡', names: ['Dagas', 'Puñales', 'Estiletes'] },
    skills: [
      { name: 'Paso Sombrío', icon: '☾', cost: 3, cd: 2.6, desc: 'Aparece tras el enemigo cercano y le apuñala con un crítico seguro' },
      { name: 'Abanico Venenoso', icon: '✧', cost: 4, cd: 4, desc: 'Lanza siete dagas en abanico que envenenan' },
    ],
  },
  domadora: {
    name: 'Domadora', role: 'Invocadora de bestias', color: '#4a6a2a', hair: '#7a4a24',
    desc: 'Látigo de cuero y silbato de hueso. Sus lobos luchan a su lado y enloquecen con su rugido.',
    hp: 112, speed: 168, basicMul: 1.15, refK: 1.05, weapon: { icon: '🪢', names: ['Látigo', 'Fusta', 'Látigo de espinas'] },
    skills: [
      { name: 'Llamada del Lobo', icon: '🐺', cost: 3, cd: 5, desc: 'Invoca un lobo que caza enemigos durante 16 s (hasta 3)' },
      { name: 'Rugido Salvaje', icon: '⚡', cost: 4, cd: 8, desc: 'Empuja a los enemigos y enfurece a tus bestias (+70% daño)' },
    ],
  },
  artificiera: {
    name: 'Artificiera', role: 'Ingeniera explosiva', color: '#a8641e', hair: '#e0a040',
    desc: 'Gafas de latón y cinturón de bombas. Lanza explosivos y planta torretas que disparan solas.',
    hp: 100, speed: 170, basicMul: 1.25, refK: 0.9, weapon: { icon: '💣', names: ['Lanzabombas', 'Mortero de mano', 'Trabuco'] },
    skills: [
      { name: 'Torreta de Chispas', icon: '⚙', cost: 4, cd: 7, desc: 'Planta una torreta que dispara 12 s (hasta 2)' },
      { name: 'Bomba Racimo', icon: '✷', cost: 5, cd: 5, desc: 'Una gran bomba que suelta seis bombas más pequeñas' },
    ],
  },
  berserker: {
    name: 'Berserker', role: 'Furia cuerpo a cuerpo', color: '#8a1c1c', hair: '#b8322a',
    desc: 'Martillo enorme y pieles de oso. Cuanto menos vida tiene, más fuerte golpea, y se cura al pegar.',
    hp: 150, speed: 160, basicMul: 1.8, refK: 0.95, weapon: { icon: '🔨', names: ['Martillo', 'Gran martillo', 'Maza de guerra'] },
    skills: [
      { name: 'Golpe Sangriento', icon: '🩸', cost: 3, cd: 3, desc: 'Sacrifica un 8% de vida por un golpe brutal que te cura' },
      { name: 'Grito de Guerra', icon: '📯', cost: 4, cd: 10, desc: 'Atacas un 40% más rápido y recibes un 25% menos de daño 7 s' },
    ],
  },
});

Object.assign(CLASS_LORE, {
  sombra: {
    hero: 'Nyx', epithet: 'la Sombra',
    summary: 'Asesina de dagas. Ataca rapidísimo, encadena críticos enormes y aparece a la espalda de sus presas. Muy frágil si la rodean.',
    playstyle: 'Para jugadores hábiles: entra, mata al objetivo y sal con la esquiva antes de que te alcancen.',
    stats: { Vida: 1, Daño: 5, Alcance: 1, Defensa: 1, Movilidad: 5 }, difficulty: 3,
    story: 'Nyx robaba en los callejones de Villa Candela hasta que una Grieta se abrió bajo sus pies y pasó tres días al otro lado, a oscuras. Volvió con los ojos acostumbrados a la noche y con una habilidad que nadie sabe explicar: puede dar un paso dentro de una sombra y salir por otra. Ahora vende ese talento a la villa, a cambio de que nadie pregunte por su pasado.',
  },
  domadora: {
    hero: 'Ayla', epithet: 'la Domadora',
    summary: 'Invocadora de lobos. Su látigo mantiene a raya a los enemigos mientras su manada los caza, y su rugido los vuelve imparables.',
    playstyle: 'Juego tranquilo y estratégico: mantén lobos en el campo y deja que ellos hagan el trabajo sucio.',
    stats: { Vida: 3, Daño: 3, Alcance: 3, Defensa: 3, Movilidad: 3 }, difficulty: 1,
    story: 'Ayla cuidaba los perros pastores de las granjas del sur. Cuando las bestias de la Grieta atacaron el rebaño, una loba gris salió del bosque ceniciento y se puso de su lado. Desde entonces la manada crece cada temporada: lobos que nacieron cerca de las Grietas y que solo obedecen el silbido de hueso de Ayla.',
  },
  artificiera: {
    hero: 'Brina', epithet: 'la Artificiera',
    summary: 'Ingeniera de explosivos. Lanza bombas que estallan en área y planta torretas que disparan solas. Destroza grupos grandes.',
    playstyle: 'Coloca torretas, retrocede y bombardea. Brilla cuando los monstruos se amontonan.',
    stats: { Vida: 2, Daño: 4, Alcance: 4, Defensa: 2, Movilidad: 3 }, difficulty: 2,
    story: 'Brina desmontó el reloj de la torre de Villa Candela a los nueve años solo para ver cómo funcionaba (y lo volvió a montar con una pieza de más). Hoy dirige el único taller de la villa que fabrica pólvora con ámbar de las Grietas. Sus bombas brillan como pequeños soles, y ella jura que algún día cerrará una Grieta con la explosión adecuada.',
  },
  berserker: {
    hero: 'Ragna', epithet: 'la Berserker',
    summary: 'Guerrera salvaje. Cuanto más herida está, más fuerte golpea, y cada golpe le devuelve vida. Su martillo aplasta lo que toca.',
    playstyle: 'Arriesgado y explosivo: juega con poca vida para pegar más fuerte, pero no te pases.',
    stats: { Vida: 5, Daño: 5, Alcance: 1, Defensa: 2, Movilidad: 2 }, difficulty: 2,
    story: 'Ragna llegó del norte helado siguiendo el rastro de un Coloso de Escarcha que destruyó su clan. Lo encontró en el Glaciar Rúnico, al otro lado de una Grieta, y lo partió con el martillo de su padre. Desde aquel día una furia roja le corre por las venas cuando pelea: no siente el dolor, solo la sed de la siguiente pelea.',
  },
});
Object.assign(STAT_REC, { sombra: ['agi', 'sue'], domadora: ['int', 'vit'], artificiera: ['int', 'sue'], berserker: ['fue', 'vit'] });
Object.assign(WEAPON_KIND, { sombra: 'dagger', domadora: 'whip', artificiera: 'launcher', berserker: 'hammer' });
Object.assign(HERO_RIG, {
  sombra: { hip: 0.6, cx: 0.52, stride: 0.24 }, domadora: { hip: 0.72, cx: 0.5, stride: 0.16 },
  artificiera: { hip: 0.6, cx: 0.52, stride: 0.22 }, berserker: { hip: 0.6, cx: 0.5, stride: 0.24 },
});
['sombra', 'domadora', 'artificiera', 'berserker'].forEach((id) => {
  const img = new Image();
  img.onload = () => { HERO_PX[id] = img; if (typeof onHeroArtLoaded === 'function') onHeroArtLoaded(); };
  img.src = 'img/heroes/px/' + id + '.png';
});
Object.assign(ULTIMATES, {
  sombra: { name: 'Danza de Mil Cortes', icon: '✦', desc: 'Durante 2 s saltas de enemigo en enemigo apuñalando, sin poder ser tocada' },
  domadora: { name: 'Estampida', icon: '🐾', desc: 'Una manada de lobos espectrales arrasa todo en la dirección en la que miras' },
  artificiera: { name: 'Bombardeo', icon: '☄', desc: 'Una lluvia de explosiones cae sobre toda la pantalla' },
  berserker: { name: 'Frenesí Rojo', icon: '♨', desc: '10 s de furia: +50% daño, +30% velocidad de ataque, robo de vida y curación inmediata' },
});
const ATK_ICON = { iop: '⚔', cra: '➶', feca: '✦', sombra: '🗡', domadora: '〰', artificiera: '💣', berserker: '🔨' };

// ============================================================
// Estado propio de las clases nuevas (bestias, torretas, venenos…)
// ============================================================
let minions = [];
function resetClassState() { minions = []; }

// Pasivas y bufos que modifican el daño, la velocidad de ataque y el daño recibido
function classDmgMul() {
  if (!P) return 1;
  let m = 1;
  if (P.cls === 'berserker') m *= 1 + 0.6 * (1 - P.hp / P.maxHp); // Sed de sangre
  if (P.frenzyT > 0) m *= 1.5;
  return m;
}
const classAtkSpeed = () => (P.warcryT > 0 ? 1.4 : 1) * (P.frenzyT > 0 ? 1.3 : 1);
const classDefMul = () => (P && P.warcryT > 0 ? 0.75 : 1);
const lifesteal = () => (!P ? 0 : P.cls === 'berserker' ? (P.frenzyT > 0 ? 0.15 : 0.04) : 0);
function stealLife(dmg) {
  const ls = lifesteal();
  if (ls > 0 && P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + dmg * ls);
}

// Dirección con más enemigos (para ataques en línea)
function crowdDir(range) {
  let best = P.dir, bn = 0;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    let n = 0;
    for (const e of enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < range && Math.abs(angDiff(Math.atan2(e.y - P.y, e.x - P.x), a)) < 0.4) n += e.boss ? 4 : e.elite ? 2 : 1;
    if (n > bn) { bn = n; best = a; }
  }
  return best;
}

// Explosión con radio propio (bombas de la Artificiera)
function blast(x, y, R, dmg, big = false) {
  aoe(x, y, R, dmg, big ? 300 : 160, big);
  rings.push({ x, y, r0: 8, r1: R, life: 0.3, max: 0.3, color: 'rgba(255,170,50,' });
  for (let i = 0; i < (big ? 18 : 8); i++) {
    const a = rand(0, TAU), sp = rand(80, 260);
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, max: 0.4, color: pick(['#ffb300', '#ff5722', '#fff3e0']), size: rand(2, 5), grav: 0 });
  }
  hitFlash(x, y - 6, R * 0.45, '255,160,60');
  addDecal('scorch', x, y, R * 0.7, 2.5, '255,120,30');
  if (big) { shake(6); embers(x, y, 8, '255,140,40', 26); }
  SFX.play(big ? 'boom' : 'hit');
}

// Bomba lanzada en parábola hacia un punto (estalla al llegar)
function throwBomb(tx, ty, dmg, R, o = {}) {
  const d = dist(P.x, P.y, tx, ty), t = clamp(d / 520, 0.25, 0.7);
  minions.push({ kind: 'bomb', x: P.x, y: P.y - 10, sx: P.x, sy: P.y - 10, tx, ty, t: 0, dur: t, dmg, R, big: !!o.big, cluster: o.cluster || 0 });
}

// ============================================================
// Kits
// ============================================================
const CLASS_KIT = {
  sombra: {
    basic() {
      const a = aimAt(150);
      P.dir = a; P.aimHold = 0.25;
      P.swingT = 0.12; P.swingSide *= -1; P.sq = 0.2;
      slashes.push({ x: P.x, y: P.y, dir: a, arc: 1.5, range: 66, life: 0.12, max: 0.12, color: '#c8b0ff', side: P.swingSide, width: 12, follow: true });
      meleeArc(P.x, P.y, a, 66, 0.85, basicDmg(), 70);
      P.x += Math.cos(a) * 7; P.y += Math.sin(a) * 7;
      P.atkCd = 0.24 / (P.atkSpeed * classAtkSpeed());
      SFX.play('swing');
    },
    skill(i) {
      if (i === 0) {
        const t = nearestEnemy(P.x, P.y, 380);
        poof(P.x, P.y);
        if (t) {
          const a = Math.atan2(t.y - P.y, t.x - P.x);
          P.x = clamp(t.x + Math.cos(a) * (t.r + 18), 30, WORLD.w - 30); P.y = clamp(t.y + Math.sin(a) * (t.r + 18), 30, WORLD.h - 30);
          P.dir = a + Math.PI;
          damageEnemy(t, skillDmg(3.4), { kb: 120, fx: P.x, fy: P.y, heavy: true, crit: true });
          slashes.push({ x: P.x, y: P.y, dir: P.dir, arc: 2, range: 70, life: 0.2, max: 0.2, color: '#b48cff', side: 1, width: 22, follow: true });
        } else {
          const a = P.moving ? Math.atan2(input.my, input.mx) : P.dir;
          P.x = clamp(P.x + Math.cos(a) * 180, 30, WORLD.w - 30); P.y = clamp(P.y + Math.sin(a) * 180, 30, WORLD.h - 30);
        }
        poof(P.x, P.y);
        P.invul = Math.max(P.invul, 0.35);
        SFX.play('dash');
      } else {
        const a = aimAt(380);
        P.dir = a; P.aimHold = 0.3; P.shotT = 0.15;
        for (let k = -3; k <= 3; k++) {
          const aa = a + k * 0.16;
          projectiles.push({ team: 'p', kind: 'dagger', look: 'dagger', x: P.x, y: P.y - 8, vx: Math.cos(aa) * 620, vy: Math.sin(aa) * 620, r: 7, dmg: skillDmg(1.3), life: 0.6, pierce: 1, kb: 60, hit: [], poison: { t: 4, dps: skillDmg(0.55) } });
        }
        SFX.play('shoot');
      }
    },
    ult() {
      P.danceT = 2.2; P.danceTick = 0; P.invul = Math.max(P.invul, 2.3);
      poof(P.x, P.y);
    },
    update(dt) {
      if (!(P.danceT > 0)) return;
      P.danceT -= dt; P.danceTick -= dt; P.invul = Math.max(P.invul, 0.1);
      if (P.danceTick > 0) return;
      P.danceTick = 0.14;
      const near = enemies.filter((e) => !e.dead && dist(e.x, e.y, P.x, P.y) < 420);
      if (!near.length) return;
      const t = pick(near), a = rand(0, TAU);
      ghosts.push({ x: P.x, y: P.y, dir: P.dir, walkT: P.walkT, life: 0.25, max: 0.25 });
      P.x = clamp(t.x + Math.cos(a) * (t.r + 16), 30, WORLD.w - 30); P.y = clamp(t.y + Math.sin(a) * (t.r + 16), 30, WORLD.h - 30);
      P.dir = a + Math.PI; P.swingT = 0.12; P.swingSide *= -1;
      damageEnemy(t, skillDmg(2.4 * ultMul()), { kb: 40, fx: P.x, fy: P.y });
      slashes.push({ x: P.x, y: P.y, dir: P.dir, arc: 2.4, range: 70, life: 0.14, max: 0.14, color: '#d8c0ff', side: P.swingSide, width: 18, follow: false });
      SFX.play('swing');
    },
  },

  domadora: {
    basic() {
      const a = aimAt(200);
      P.dir = a; P.aimHold = 0.3;
      P.swingT = 0.2; P.swingSide *= -1;
      slashes.push({ x: P.x, y: P.y, dir: a, arc: 0.9, range: 128, life: 0.2, max: 0.2, color: '#d8b080', side: P.swingSide, width: 8, follow: true });
      meleeArc(P.x, P.y, a, 128, 0.42, basicDmg(), 150);
      P.atkCd = 0.5 / (P.atkSpeed * classAtkSpeed());
      SFX.play('swing');
    },
    skill(i) {
      if (i === 0) {
        const wolves = minions.filter((m) => m.kind === 'wolf');
        if (wolves.length >= 3) wolves.sort((a, b) => a.life - b.life)[0].life = 0;
        const a = rand(0, TAU);
        const w = { kind: 'wolf', x: P.x + Math.cos(a) * 30, y: P.y + Math.sin(a) * 30, life: 16, atkCd: 0.3, dir: 0, walkT: 0, moving: false, seed: rand(0, 9) };
        minions.push(w);
        poof(w.x, w.y); dust(w.x, w.y, 8);
        SFX.play('baa');
      } else {
        rings.push({ x: P.x, y: P.y, r0: 20, r1: 170, life: 0.4, max: 0.4, color: 'rgba(255,200,120,' });
        aoe(P.x, P.y, 160, skillDmg(1.2), 420);
        for (const m of minions) if (m.kind === 'wolf') { m.rage = 6; hitFlash(m.x, m.y - 12, 24, '255,120,60'); }
        shake(6); SFX.play('boss');
      }
    },
    ult() {
      const a = crowdDir(560);
      P.dir = a;
      for (let k = 0; k < 7; k++) {
        later(k * 0.08, () => {
          const off = (k - 3) * 28;
          const sx = P.x - Math.cos(a) * 60 + Math.cos(a + Math.PI / 2) * off, sy = P.y - Math.sin(a) * 60 + Math.sin(a + Math.PI / 2) * off;
          minions.push({ kind: 'spirit', x: sx, y: sy, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, life: 1.1, dir: a, walkT: 0, hit: [], dmg: skillDmg(3.2 * ultMul()) });
        });
      }
      SFX.play('boss');
    },
  },

  artificiera: {
    basic() {
      const t = nearestEnemy(P.x, P.y, 380);
      const a = t ? Math.atan2(t.y - P.y, t.x - P.x) : aimAt(380);
      P.dir = a; P.aimHold = 0.3; P.shotT = 0.15;
      const d = t ? dist(P.x, P.y, t.x, t.y) : 220;
      throwBomb(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, basicDmg(), 46);
      P.atkCd = 0.55 / (P.atkSpeed * classAtkSpeed());
      SFX.play('dash');
    },
    skill(i) {
      if (i === 0) {
        const turrets = minions.filter((m) => m.kind === 'turret');
        if (turrets.length >= 2) turrets.sort((a, b) => a.life - b.life)[0].life = 0;
        const a = P.dir;
        const m = { kind: 'turret', x: clamp(P.x + Math.cos(a) * 30, 30, WORLD.w - 30), y: clamp(P.y + Math.sin(a) * 30, 30, WORLD.h - 30), life: 12, atkCd: 0.5, aim: a, recoil: 0 };
        minions.push(m);
        dust(m.x, m.y, 8); SFX.play('hit');
      } else {
        const t = nearestEnemy(P.x, P.y, 420);
        const tx = t ? t.x : P.x + Math.cos(P.dir) * 200, ty = t ? t.y : P.y + Math.sin(P.dir) * 200;
        P.dir = Math.atan2(ty - P.y, tx - P.x); P.shotT = 0.15;
        throwBomb(tx, ty, skillDmg(2.6), 95, { big: true, cluster: 6 });
        SFX.play('dash');
      }
    },
    ult() {
      for (let k = 0; k < 20; k++) {
        later(0.15 + k * 0.1, () => {
          if (!P || scene !== 'rift') return;
          const near = enemies.filter((e) => !e.dead && dist(e.x, e.y, P.x, P.y) < 520);
          const t = near.length && Math.random() < 0.75 ? pick(near) : null;
          const x = t ? t.x + rand(-20, 20) : P.x + rand(-420, 420), y = t ? t.y + rand(-20, 20) : P.y + rand(-260, 260);
          minions.push({ kind: 'shell', x, y, t: 0, dur: 0.45, dmg: skillDmg(2.3 * ultMul()) });
        });
      }
    },
  },

  berserker: {
    basic() {
      const a = aimAt(170);
      P.dir = a; P.aimHold = 0.35;
      P.swingT = 0.2; P.swingSide *= -1; P.sq = 0.45;
      slashes.push({ x: P.x, y: P.y, dir: a, arc: 2.5, range: 92, life: 0.2, max: 0.2, color: P.frenzyT > 0 ? '#ff5a4a' : weaponFxColor(), side: P.swingSide, width: 30, follow: true });
      meleeArc(P.x, P.y, a, 92, 1.3, basicDmg(), 320, true);
      P.x += Math.cos(a) * 6; P.y += Math.sin(a) * 6;
      P.atkCd = 0.52 / (P.atkSpeed * classAtkSpeed());
      shake(2);
      SFX.play('swing');
    },
    skill(i) {
      if (i === 0) {
        const cost = Math.round(P.hp * 0.08);
        P.hp = Math.max(1, P.hp - cost);
        addText(P.x, P.y - 40, '-' + cost, '#ff4a3d', 0.9);
        const a = aimAt(200);
        P.dir = a; P.aimHold = 0.5; P.swingT = 0.2; P.sq = 0.8;
        slashes.push({ x: P.x, y: P.y, dir: a, arc: 2.4, range: 130, life: 0.26, max: 0.26, color: '#ff3a2a', side: 1, width: 44, follow: false });
        const before = enemies.reduce((s, e) => s + Math.max(0, e.hp), 0);
        meleeArc(P.x, P.y, a, 130, 1.1, skillDmg(5), 460, true);
        const dealt = before - enemies.reduce((s, e) => s + Math.max(0, e.hp), 0);
        heal(dealt * 0.25);
        hitFlash(P.x + Math.cos(a) * 60, P.y + Math.sin(a) * 60 - 10, 46, '255,60,40');
        addDecal('crack', P.x + Math.cos(a) * 60, P.y + Math.sin(a) * 60, 60, 2, '200,40,30');
        shake(12); SFX.play('crit');
      } else {
        P.warcryT = 7;
        rings.push({ x: P.x, y: P.y, r0: 20, r1: 180, life: 0.45, max: 0.45, color: 'rgba(255,90,60,' });
        for (const e of enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < 180) { e.slowT = 2.5; damageEnemy(e, skillDmg(0.8), { kb: 200, fx: P.x, fy: P.y }); }
        shake(8); SFX.play('boss');
      }
    },
    ult() {
      P.frenzyT = 10;
      heal(P.maxHp * 0.2);
      rings.push({ x: P.x, y: P.y, r0: 20, r1: 220, life: 0.5, max: 0.5, color: 'rgba(255,40,30,' });
      hitFlash(P.x, P.y - 24, 70, '255,60,40');
    },
  },
};

// Bufos con duración y efectos que se repiten cada fotograma
function updateClassKits(dt) {
  if (!P) return;
  if (P.warcryT > 0) P.warcryT -= dt;
  if (P.frenzyT > 0) {
    P.frenzyT -= dt;
    if (Math.random() < 0.4) particles.push({ kind: 'glowdot', x: P.x + rand(-12, 12), y: P.y - rand(0, 40), vx: 0, vy: -50, life: 0.5, max: 0.5, rgb: '255,60,40', size: 4, grav: 0 });
  }
  const kit = CLASS_KIT[P.cls];
  if (kit && kit.update) kit.update(dt);
  // venenos
  for (const e of enemies) {
    if (e.dead || !e.dot) continue;
    e.dot.t -= dt; e.dot.tick -= dt;
    if (e.dot.tick <= 0) {
      e.dot.tick = 0.5;
      damageEnemy(e, e.dot.dps * 0.5, { quiet: true, color: '#9be05a' });
      if (Math.random() < 0.8) particles.push({ kind: 'glowdot', x: e.x + rand(-8, 8), y: e.y - e.r, vx: 0, vy: -40, life: 0.5, max: 0.5, rgb: '150,230,90', size: 4, grav: 0 });
    }
    if (e.dot.t <= 0) e.dot = null;
  }
  updateMinions(dt);
}

function updateMinions(dt) {
  for (const m of minions) {
    if (m.kind === 'wolf') {
      m.life -= dt; m.atkCd -= dt; if (m.rage > 0) m.rage -= dt;
      const t = nearestEnemy(m.x, m.y, 420);
      let tx, ty;
      if (t) { tx = t.x; ty = t.y; } else { tx = P.x + Math.cos(m.seed) * 50; ty = P.y + Math.sin(m.seed) * 40; }
      const d = dist(m.x, m.y, tx, ty), reach = t ? t.r + 16 : 30;
      m.moving = d > reach;
      if (m.moving) {
        const sp = (t ? 270 : 220) * (m.rage > 0 ? 1.3 : 1);
        m.x += ((tx - m.x) / d) * sp * dt; m.y += ((ty - m.y) / d) * sp * dt;
        m.dir = Math.atan2(ty - m.y, tx - m.x); m.walkT += dt;
      } else if (t && m.atkCd <= 0) {
        m.atkCd = m.rage > 0 ? 0.4 : 0.6;
        m.bite = 0.15;
        damageEnemy(t, skillDmg(0.95) * (m.rage > 0 ? 1.7 : 1), { kb: 50, fx: m.x, fy: m.y });
      }
      if (m.bite > 0) m.bite -= dt;
    } else if (m.kind === 'spirit') {
      m.life -= dt; m.walkT += dt;
      m.x += m.vx * dt; m.y += m.vy * dt;
      for (const e of enemies) if (!e.dead && !m.hit.includes(e) && dist(e.x, e.y, m.x, m.y) < e.r + 24) { m.hit.push(e); damageEnemy(e, m.dmg, { kb: 380, fx: m.x - m.vx, fy: m.y - m.vy, heavy: true }); }
      if (Math.random() < 0.7) particles.push({ kind: 'glowdot', x: m.x + rand(-10, 10), y: m.y - rand(0, 20), vx: 0, vy: -30, life: 0.4, max: 0.4, rgb: '140,200,255', size: 5, grav: 0 });
    } else if (m.kind === 'turret') {
      m.life -= dt; m.atkCd -= dt; m.recoil *= Math.exp(-12 * dt);
      const t = nearestEnemy(m.x, m.y, 360);
      if (t) {
        m.aim = Math.atan2(t.y - m.y, t.x - m.x);
        if (m.atkCd <= 0) {
          m.atkCd = 0.38; m.recoil = 1;
          projectiles.push({ team: 'p', kind: 'spark', look: 'spark', x: m.x + Math.cos(m.aim) * 16, y: m.y - 16 + Math.sin(m.aim) * 16, vx: Math.cos(m.aim) * 620, vy: Math.sin(m.aim) * 620, r: 5, dmg: skillDmg(0.75), life: 0.7, pierce: 0, kb: 40, hit: [] });
          SFX.play('magic');
        }
      }
    } else if (m.kind === 'bomb') {
      m.t += dt;
      const k = Math.min(1, m.t / m.dur);
      m.x = lerp(m.sx, m.tx, k); m.y = lerp(m.sy, m.ty, k);
      m.z = Math.sin(k * Math.PI) * (40 + m.dur * 60);
      if (k >= 1) {
        m.life = 0;
        blast(m.tx, m.ty, m.R, m.dmg, m.big);
        for (let c = 0; c < m.cluster; c++) {
          const a = (c / m.cluster) * TAU + rand(-0.3, 0.3), r = rand(60, 110);
          minions.push({ kind: 'bomb', x: m.tx, y: m.ty, sx: m.tx, sy: m.ty, tx: m.tx + Math.cos(a) * r, ty: m.ty + Math.sin(a) * r, t: 0, dur: 0.4, dmg: m.dmg * 0.45, R: 52, big: false, cluster: 0 });
        }
      } else m.life = 1;
    } else if (m.kind === 'shell') {
      m.t += dt;
      if (m.t >= m.dur) { m.life = 0; blast(m.x, m.y, 85, m.dmg, true); } else m.life = 1;
    }
  }
  minions = minions.filter((m) => {
    if (m.life > 0) return true;
    if (m.kind === 'wolf' || m.kind === 'turret') poof(m.x, m.y);
    return false;
  });
}

// ============================================================
// Dibujo
// ============================================================
function artWolf(g, f, spirit) {
  const leg = Math.sin(f * TAU) * 5;
  g.lineJoin = 'round';
  const body = spirit ? '#9fd8ff' : '#7a7a86', dark = spirit ? '#5a9ad8' : '#4a4a56', light = spirit ? '#e0f4ff' : '#b8b8c4';
  g.strokeStyle = OUTLINE; g.lineWidth = 2;
  // patas
  g.fillStyle = dark;
  for (const [x, s] of [[-12, 1], [-6, -1], [8, 1], [13, -1]]) { g.beginPath(); g.rect(x - 2 + leg * s * 0.4, -12, 4, 12); g.fill(); g.stroke(); }
  // cola
  g.fillStyle = body; g.beginPath(); g.moveTo(-16, -20); g.quadraticCurveTo(-30, -26 + leg * 0.3, -28, -14); g.quadraticCurveTo(-22, -16, -16, -16); g.closePath(); g.fill(); g.stroke();
  // cuerpo
  g.beginPath(); g.ellipse(0, -18, 18, 9, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = light; g.beginPath(); g.ellipse(2, -14, 12, 4, 0, 0, TAU); g.fill();
  // cabeza
  g.fillStyle = body; g.beginPath(); g.moveTo(12, -26); g.lineTo(26, -22); g.lineTo(30, -17); g.lineTo(18, -14); g.lineTo(10, -18); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = dark; g.beginPath(); g.moveTo(13, -26); g.lineTo(16, -34); g.lineTo(19, -25); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = spirit ? '#ffffff' : '#ffd54f'; g.fillRect(20, -23, 3, 2);
  g.fillStyle = '#1a1010'; g.fillRect(28, -19, 3, 2);
}

function drawMinion(m) {
  if (m.kind === 'wolf' || m.kind === 'spirit') {
    const face = Math.cos(m.dir) >= 0 ? 1 : -1, f = Math.floor(((m.walkT || 0) * 8) % 4) / 4;
    if (m.kind === 'wolf') shadow(m.x, m.y + 1, 16);
    ctx.save();
    ctx.translate(m.x + (m.bite > 0 ? face * 5 : 0), m.y);
    if (m.kind === 'spirit') { ctx.globalAlpha = 0.75; glow(0, -18, 40, '120,190,255', 0.6); }
    if (m.rage > 0) glow(0, -18, 30, '255,90,50', 0.5 + Math.sin(now * 10) * 0.2);
    ctx.scale(face, 1);
    sprite('wolf|' + (m.kind === 'spirit' ? 1 : 0) + '|' + f, 70, 48, 34, 44, (g) => artWolf(g, f, m.kind === 'spirit'));
    ctx.restore();
    if (m.kind === 'wolf' && m.life < 3 && Math.sin(now * 14) > 0) circle(m.x, m.y - 40, 2.5, '#ffd54f');
  } else if (m.kind === 'turret') {
    shadow(m.x, m.y + 1, 14);
    ctx.save(); ctx.translate(m.x, m.y);
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a3a1e';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(s * 12, 0); ctx.lineTo(s * 9, 0); ctx.lineTo(0, -8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(0, -16, 8, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.translate(0, -16); ctx.rotate(m.aim);
    ctx.fillStyle = '#c99a3a'; ctx.fillRect(-2 - m.recoil * 4, -4, 18, 8); ctx.strokeRect(-2 - m.recoil * 4, -4, 18, 8);
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(13 - m.recoil * 4, -2, 3, 4);
    ctx.restore();
    glow(m.x, m.y - 16, 22, '255,200,90', 0.25 + m.recoil * 0.4);
    if (m.life < 3 && Math.sin(now * 14) > 0) circle(m.x, m.y - 32, 2.5, '#ffd54f');
  } else if (m.kind === 'bomb') {
    shadow(m.tx, m.ty + 1, 8);
    const s = m.big ? 1.5 : 1;
    circle(m.x, m.y - m.z, 6 * s, '#3a3440', OUTLINE, 2);
    circle(m.x - 2 * s, m.y - m.z - 2 * s, 1.6 * s, '#9a94a8');
    glow(m.x + 4 * s, m.y - m.z - 6 * s, 8, '255,200,80', 0.8);
  } else if (m.kind === 'shell') {
    const k = m.t / m.dur;
    circle(m.x, m.y, 70 * (1 - k * 0.3), null, `rgba(255,90,40,${0.3 + k * 0.5})`, 2);
    const h = (1 - k) * 320;
    circle(m.x, m.y - h, 7, '#3a3440', OUTLINE, 2);
    glow(m.x, m.y - h - 6, 14, '255,160,60', 0.9);
  }
}

// Proyectiles con aspecto propio
function drawProjLook(p) {
  ctx.save();
  if (p.look === 'dagger') {
    ctx.translate(p.x, p.y); ctx.rotate(now * 22);
    ctx.fillStyle = '#d8d8e8'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(0, -3); ctx.lineTo(-6, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7be05a'; ctx.fillRect(-9, -2, 4, 4);
  } else if (p.look === 'spark') {
    ctx.globalCompositeOperation = 'lighter';
    circle(p.x, p.y, p.r * 1.8, 'rgba(255,190,70,0.45)');
    circle(p.x, p.y, p.r, '#ffe08a');
  }
  ctx.restore();
}
