/* Fendaria — Árbol de talentos (fase 1: Rompeyelmos y Ojo de Halcón).
 * 1 punto por nivel. Tres ramas por héroe; cada nodo pide el anterior de su rama y el último pide 8 puntos en ella.
 * Nodos normales: bonus pequeños con rangos. ★ Clave: cambia una habilidad. ★★ Culmen: el gran premio de la rama.
 * Reiniciar es gratis en Villa Candela.
 */
'use strict';

// m: modificadores por rango (se suman en derived); fx: efecto especial (ganchos más abajo)
const TALENTS = {
  iop: [
    { id: 'furia', name: 'Furia', color: '#ff5a3d', icon: '🪓', d: 'Tu hacha: ataque básico más rápido y letal', nodes: [
      { id: 'filo', name: 'Filo afilado', icon: '🗡', max: 3, m: { dmg: 0.06 }, d: '+6% de daño por rango' },
      { id: 'ritmo', name: 'Ritmo de guerra', icon: '⚡', max: 3, m: { aspd: 0.06 }, d: '+6% de velocidad de ataque por rango' },
      { id: 'doble', name: 'Hachazo doble', icon: '✦', max: 1, key: 1, fx: 'doble', d: 'Cada 4.º golpe básico lanza un segundo tajo (60% del daño)' },
      { id: 'sed', name: 'Sed de sangre', icon: '🩸', max: 2, m: { ls: 0.02 }, d: 'Robas un 2% del daño como vida por rango' },
      { id: 'brutal', name: 'Golpe brutal', icon: '💥', max: 2, m: { critDmg: 0.15 }, d: '+15% de daño crítico por rango' },
      { id: 'ira', name: 'Ira imparable', icon: '🔥', max: 1, cap: 1, fx: 'ira', d: 'Cada enemigo que matas: +8% de velocidad de ataque durante 3 s (hasta ×5)' },
    ] },
    { id: 'torbellino', name: 'Torbellino', color: '#ffb040', icon: '✸', d: 'Habilidades: más daño, menos espera', nodes: [
      { id: 'conducto', name: 'Conducto ígneo', icon: '✸', max: 3, m: { skill: 0.08 }, d: '+8% de daño de habilidades por rango' },
      { id: 'vigor', name: 'Vigor rúnico', icon: '⏳', max: 3, m: { cd: 0.06 }, d: '-6% de tiempo de recarga por rango' },
      { id: 'aterrizaje', name: 'Aterrizaje ardiente', icon: '🌋', max: 1, key: 1, fx: 'aterrizaje', d: 'Embestida Sísmica deja el suelo ardiendo 3 s' },
      { id: 'energia', name: 'Reserva de energía', icon: '★', max: 2, m: { pa: 1 }, d: '+1 de energía máxima por rango' },
      { id: 'tajo', name: 'Tajo descomunal', icon: '🗲', max: 2, m: { skill: 0.12 }, d: '+12% de daño de habilidades por rango' },
      { id: 'cataclismo', name: 'Cataclismo', icon: '☄', max: 1, cap: 1, m: { ult: 0.4 }, d: 'La definitiva se carga un 40% más rápido' },
    ] },
    { id: 'bastion', name: 'Bastión', color: '#8fb7d8', icon: '🛡', d: 'Aguantar en primera línea', nodes: [
      { id: 'piel', name: 'Piel de hierro', icon: '❤', max: 3, m: { hp: 0.07 }, d: '+7% de PV máximos por rango' },
      { id: 'guardia', name: 'Guardia', icon: '🛡', max: 3, m: { armor: 0.03 }, d: '-3% de daño recibido por rango' },
      { id: 'aliento', name: 'Segundo aliento', icon: '🌬', max: 1, key: 1, fx: 'aliento', d: 'Una vez por Grieta, al bajar del 25% de vida recuperas un 35%' },
      { id: 'pies', name: 'Pies ligeros', icon: '👢', max: 2, m: { speed: 0.06 }, d: '+6% de velocidad de movimiento por rango' },
      { id: 'regen', name: 'Regeneración', icon: '✚', max: 2, m: { regen: 0.005 }, d: 'Recuperas un 0,5% de vida por segundo por rango' },
      { id: 'inquebrantable', name: 'Inquebrantable', icon: '⛰', max: 1, cap: 1, fx: 'inquebrantable', d: 'Al esquivar: 1 s más de invulnerabilidad y +25% de daño durante 2 s' },
    ] },
  ],
  cra: [
    { id: 'punteria', name: 'Puntería', color: '#7fe08a', icon: '➶', d: 'Flechas más rápidas y certeras', nodes: [
      { id: 'plumas', name: 'Plumas afiladas', icon: '🪶', max: 3, m: { dmg: 0.06 }, d: '+6% de daño por rango' },
      { id: 'tension', name: 'Tensión rápida', icon: '⚡', max: 3, m: { aspd: 0.06 }, d: '+6% de velocidad de ataque por rango' },
      { id: 'perforante', name: 'Flecha perforante', icon: '➹', max: 1, key: 1, fx: 'perforante', d: 'Tus flechas básicas atraviesan a un enemigo más' },
      { id: 'ojo', name: 'Ojo crítico', icon: '👁', max: 2, m: { crit: 0.04 }, d: '+4% de probabilidad de crítico por rango' },
      { id: 'punta', name: 'Punta letal', icon: '💥', max: 2, m: { critDmg: 0.15 }, d: '+15% de daño crítico por rango' },
      { id: 'multiple', name: 'Disparo múltiple', icon: '☰', max: 1, cap: 1, fx: 'multiple', d: 'Cada 5.º disparo lanza 3 flechas en abanico' },
    ] },
    { id: 'artilleria', name: 'Artillería', color: '#ffb040', icon: '✹', d: 'Flechas ígneas y lluvias más potentes', nodes: [
      { id: 'polvora', name: 'Pólvora', icon: '✹', max: 3, m: { skill: 0.08 }, d: '+8% de daño de habilidades por rango' },
      { id: 'carcaj', name: 'Carcaj ligero', icon: '⏳', max: 3, m: { cd: 0.06 }, d: '-6% de tiempo de recarga por rango' },
      { id: 'gemela', name: 'Flecha gemela', icon: '✶', max: 1, key: 1, fx: 'gemela', d: 'Flecha Ígnea dispara dos flechas a la vez' },
      { id: 'energia', name: 'Reserva de energía', icon: '★', max: 2, m: { pa: 1 }, d: '+1 de energía máxima por rango' },
      { id: 'recarga', name: 'Respiración', icon: '🌀', max: 2, m: { paRegen: 0.1 }, d: '+10% de recarga de energía por rango' },
      { id: 'halcon', name: 'Ojo del halcón', icon: '🦅', max: 1, cap: 1, m: { ult: 0.4 }, d: 'La definitiva se carga un 40% más rápido' },
    ] },
    { id: 'supervivencia', name: 'Supervivencia', color: '#8fb7d8', icon: '🌲', d: 'Moverse, esquivar y no caer', nodes: [
      { id: 'piel', name: 'Cuero curtido', icon: '❤', max: 3, m: { hp: 0.07 }, d: '+7% de PV máximos por rango' },
      { id: 'zancada', name: 'Zancada', icon: '👢', max: 3, m: { speed: 0.06 }, d: '+6% de velocidad de movimiento por rango' },
      { id: 'viento', name: 'Paso del viento', icon: '»', max: 1, key: 1, m: { pm: 1 }, d: '+1 carga de esquiva' },
      { id: 'guardia', name: 'Esquiva instintiva', icon: '🛡', max: 2, m: { armor: 0.03 }, d: '-3% de daño recibido por rango' },
      { id: 'saqueo', name: 'Saqueador', icon: '◆', max: 2, m: { kama: 0.15 }, d: '+15% de ámbar por rango' },
      { id: 'trampa', name: 'Retirada táctica', icon: '✳', max: 1, cap: 1, fx: 'trampa', d: 'Al esquivar dejas una trampa que estalla (200% de daño de habilidad)' },
    ] },
  ],
};
const CAP_NEED = 8; // puntos en la rama para el nodo culmen

// ---------- Estado ----------
const talTree = () => (S && TALENTS[S.cls]) || null;
const talState = () => { if (!S.tal) S.tal = {}; return S.tal; };
const talRank = (id) => (S && S.tal && S.tal[id]) || 0;
const talSpent = () => Object.values(talState()).reduce((a, b) => a + b, 0);
const talPoints = () => Math.max(0, (S.level - 1) - talSpent());
const branchSpent = (br) => br.nodes.reduce((a, n) => a + talRank(br.id + '.' + n.id), 0);
function talCan(br, i) {
  const n = br.nodes[i], key = br.id + '.' + n.id;
  if (talRank(key) >= n.max || talPoints() < 1) return false;
  if (i > 0 && talRank(br.id + '.' + br.nodes[i - 1].id) < 1) return false;
  if (n.cap && branchSpent(br) < CAP_NEED) return false;
  return true;
}
function talMods() {
  const T = talTree(), m = {};
  if (!T) return m;
  for (const br of T) for (const n of br.nodes) {
    const r = talRank(br.id + '.' + n.id);
    if (r && n.m) for (const [k, v] of Object.entries(n.m)) m[k] = (m[k] || 0) + v * r;
  }
  return m;
}
const talFx = (fx) => { const T = talTree(); if (!T) return false; for (const br of T) for (const n of br.nodes) if (n.fx === fx && talRank(br.id + '.' + n.id)) return true; return false; };

// ---------- Estadísticas ----------
const _derivedT = derived;
derived = function () {
  const d = _derivedT(), m = talMods();
  if (!Object.keys(m).length && !(P && P.iraN)) return d;
  d.maxHp = Math.round(d.maxHp * (1 + (m.hp || 0)));
  d.dmgMul *= (1 + (m.dmg || 0)) * (P && P.indT > 0 ? 1.25 : 1);
  d.skillMul *= 1 + (m.skill || 0);
  d.crit = Math.min(0.8, d.crit + (m.crit || 0));
  d.critDmg *= 1 + (m.critDmg || 0);
  d.cdMul *= 1 - Math.min(0.5, m.cd || 0);
  d.atkSpeed *= (1 + (m.aspd || 0)) * (1 + 0.08 * ((P && P.iraT > 0 && P.iraN) || 0));
  d.speed *= 1 + (m.speed || 0);
  d.armor = Math.min(0.8, d.armor + (m.armor || 0));
  d.hpRegen += m.regen || 0;
  d.paRegen *= 1 + (m.paRegen || 0);
  d.kamaMul *= 1 + (m.kama || 0);
  return d;
};
// energía y esquivas máximas (no van en derived)
const _recalcT = recalc;
recalc = function () {
  _recalcT();
  if (!P) return;
  const m = talMods();
  P.maxPa = 6 + (m.pa || 0);
  const pm0 = 3 + (S.up.reflejos || 0) + (uniqueOn('viento') ? 1 : 0);
  P.maxPm = pm0 + (m.pm || 0);
};
const _stealLifeT = stealLife;
stealLife = function (dmg) { _stealLifeT(dmg); const ls = talMods().ls; if (ls && P && P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + dmg * ls); };
const _gainUltT = gainUlt;
gainUlt = function (n) { return _gainUltT(n * (1 + (talMods().ult || 0))); };

// ---------- Efectos especiales ----------
let talShots = 0;
const _basicAttackT = basicAttack;
basicAttack = function () {
  const nP = projectiles.length;
  _basicAttackT();
  talShots++;
  if (P.cls === 'iop' && talFx('doble') && talShots % 4 === 0) {
    const a = P.dir;
    later(0.12, () => {
      if (!P || scene !== 'rift') return;
      slashes.push({ x: P.x, y: P.y, dir: a, arc: 2.3, range: 86, life: 0.18, max: 0.18, color: '#ff8a5a', side: -P.swingSide, width: 26, follow: true });
      meleeArc(P.x, P.y, a, 86, 1.2, basicDmg() * 0.6, 200);
      SFX.play('swing');
    });
  }
  if (P.cls === 'cra') {
    if (talFx('perforante')) for (let i = nP; i < projectiles.length; i++) if (projectiles[i].kind === 'arrow') projectiles[i].pierce = (projectiles[i].pierce || 0) + 1;
    if (talFx('multiple') && talShots % 5 === 0) {
      const base = projectiles[projectiles.length - 1];
      if (base && base.kind === 'arrow') for (const off of [-0.22, 0.22]) {
        const a = Math.atan2(base.vy, base.vx) + off, sp = Math.hypot(base.vx, base.vy);
        projectiles.push(Object.assign({}, base, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, hit: [] }));
      }
    }
  }
};
const _useSkillT = useSkill;
useSkill = function (i) {
  const cd0 = P.skillCd[i], nP = projectiles.length;
  _useSkillT(i);
  if (P.skillCd[i] <= cd0) return; // no se lanzó
  if (P.cls === 'iop' && i === 0 && talFx('aterrizaje') && P.jump) {
    const { tx, ty } = P.jump;
    later(0.4, () => { if (P && scene === 'rift') { glyphs.push({ x: tx, y: ty, r: 95, life: 3, max: 3, tick: 0, mul: 0.8 }); addDecal('scorch', tx, ty, 80, 3, '255,110,30'); } });
  }
  if (P.cls === 'cra' && i === 0 && talFx('gemela')) {
    const p = projectiles[nP];
    if (p) { const a = Math.atan2(p.vy, p.vx) + 0.16, sp = Math.hypot(p.vx, p.vy); projectiles.push(Object.assign({}, p, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, hit: [] })); }
  }
};
const _dashT = dash;
dash = function () {
  const pm0 = P.pm;
  _dashT();
  if (P.pm >= pm0) return;
  if (talFx('inquebrantable')) { P.invul = Math.max(P.invul, 1.25); P.indT = 2; recalc(); }
  if (talFx('trampa')) {
    const x = P.x, y = P.y;
    later(0.6, () => {
      if (!P || scene !== 'rift') return;
      aoe(x, y, 90, skillDmg(2), 260);
      rings.push({ x, y, r0: 10, r1: 90, life: 0.35, max: 0.35, color: 'rgba(160,255,140,' });
      sparks(x, y - 6, 16, '#c8ff9a', 300);
      SFX.play('boom');
    });
  }
};
const _killEnemyT = killEnemy;
killEnemy = function (e) {
  const r = _killEnemyT(e);
  if (P && talFx('ira')) { P.iraN = Math.min(5, (P.iraT > 0 ? P.iraN || 0 : 0) + 1); P.iraT = 3; recalc(); }
  return r;
};
const _updatePlayerT = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerT(dt);
  if (!P) return;
  if (P.iraT > 0) { P.iraT -= dt; if (P.iraT <= 0) { P.iraN = 0; recalc(); } }
  if (P.indT > 0) { P.indT -= dt; if (P.indT <= 0) recalc(); }
  if (talFx('aliento') && !P.alientoUsed && P.hp > 0 && P.hp < P.maxHp * 0.25) {
    P.alientoUsed = true;
    heal(Math.round(P.maxHp * 0.35));
    rings.push({ x: P.x, y: P.y, r0: 10, r1: 110, life: 0.45, max: 0.45, color: 'rgba(160,220,255,' });
    addText(P.x, P.y - 60, '¡Segundo aliento!', '#bfe8ff', 1.1);
    SFX.play('heal');
  }
};

// ---------- Interfaz: pestaña Talentos en la ficha del personaje ----------
$('shModes').insertAdjacentHTML('beforeend', '<button data-m="talents" type="button">🌳 Talentos</button>');
document.querySelector('#inv .sh-body').insertAdjacentHTML('beforeend', '<section id="shTalents" class="sh-talents"></section>');
let talSel = null;
function buildTalents() {
  const box = $('shTalents'), T = talTree();
  if (!T) { box.innerHTML = '<div class="tal-soon">🌳 El árbol de talentos de este héroe llega pronto. Ya está disponible para la Rompeyelmos y Ojo de Halcón.</div>'; return; }
  const pts = talPoints();
  if (!talSel) talSel = T[0].id + '.' + T[0].nodes[0].id;
  const [sb, sn] = talSel.split('.'), SB = T.find((b) => b.id === sb), SNi = SB.nodes.findIndex((n) => n.id === sn), SN = SB.nodes[SNi];
  const rows = T.map((br) => {
    const spent = branchSpent(br);
    const nodes = br.nodes.map((n, i) => {
      const key = br.id + '.' + n.id, r = talRank(key), can = talCan(br, i);
      const locked = !r && !can && (i > 0 && talRank(br.id + '.' + br.nodes[i - 1].id) < 1 || (n.cap && spent < CAP_NEED));
      const pips = n.max > 1 ? `<span class="tp">${Array.from({ length: n.max }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('')}</span>` : '';
      return `${i ? `<b class="tl ${r || talRank(br.id + '.' + br.nodes[i - 1].id) ? 'on' : ''}"></b>` : ''}<button class="tn ${n.key ? 'key' : ''} ${n.cap ? 'cap' : ''} ${r ? 'got' : ''} ${can ? 'can' : ''} ${locked ? 'lock' : ''} ${talSel === key ? 'sel' : ''}" data-k="${key}" title="${n.name}"><span class="ic">${n.icon}</span>${pips}</button>`;
    }).join('');
    return `<div class="tb" style="--c:${br.color}"><div class="tb-h"><b>${br.icon} ${br.name}</b><small>${spent} pts</small></div><div class="tb-n">${nodes}</div></div>`;
  }).join('');
  const r = talRank(talSel), can = talCan(SB, SNi);
  const why = r >= SN.max ? 'Rango máximo' : pts < 1 ? 'Sin puntos: subes uno por nivel' : SNi > 0 && talRank(SB.id + '.' + SB.nodes[SNi - 1].id) < 1 ? 'Primero aprende el anterior de la rama' : SN.cap && branchSpent(SB) < CAP_NEED ? `Necesitas ${CAP_NEED} puntos en ${SB.name}` : '';
  box.innerHTML = `<div class="tal-head"><b>Talentos</b><span class="tal-pts ${pts ? 'has' : ''}">${pts} punto${pts === 1 ? '' : 's'}</span>
      <button id="talReset" class="sh-sell" ${talSpent() && state === 'inv' && invReturn === 'hub' ? '' : 'disabled'} title="Gratis en Villa Candela">↺ Reiniciar</button></div>
    <div class="tal-grid"><div class="tal-tree">${rows}</div>
      <aside class="tal-info" style="--c:${SB.color}"><div class="ti-n">${SN.icon} ${SN.name}</div>
        <div class="ti-t">${SN.cap ? '★★ Culmen' : SN.key ? '★ Clave' : 'Pasivo'} · ${SB.name} · rango ${r}/${SN.max}</div>
        <div class="ti-d">${SN.d}</div>
        <button id="talLearn" class="sh-sell auto" ${can ? '' : 'disabled'}>${r >= SN.max ? '✔ Aprendido' : 'Aprender'}</button>
        ${why && r < SN.max ? `<small class="ti-why">${why}</small>` : ''}</aside></div>`;
  for (const b of box.querySelectorAll('.tn')) b.onclick = () => { talSel = b.dataset.k; SFX.play('click'); buildTalents(); };
  $('talLearn').onclick = () => {
    if (!talCan(SB, SNi)) return;
    talState()[talSel] = r + 1;
    SFX.play(SN.cap || SN.key ? 'legend' : 'level');
    persist(); if (P) recalc();
    buildTalents();
    buildInventory();
  };
  $('talReset').onclick = () => { S.tal = {}; persist(); if (P) recalc(); SFX.play('zaap'); buildTalents(); };
}
const _setInvModeT = setInvMode;
setInvMode = function (m) {
  _setInvModeT(m);
  $('inv').classList.toggle('mode-talents', m === 'talents');
  for (const b of $('shModes').querySelectorAll('button')) b.classList.toggle('on', b.dataset.m === m);
  if (m === 'talents') buildTalents();
};
// aviso de puntos de talento sin gastar en la pestaña
const _buildInventoryT = buildInventory;
buildInventory = function (j) {
  _buildInventoryT(j);
  const b = $('shModes') && $('shModes').querySelector('[data-m="talents"]');
  if (b && S) b.innerHTML = '🌳 Talentos' + (talTree() && talPoints() ? ` <i class="badge">${talPoints()}</i>` : '');
};
