/* Fendaria — Árbol de talentos de los 7 héroes.
 * 1 punto por nivel. Tres ramas por héroe, 8 nodos por rama:
 *   · nodos de rango (hasta 5): bonus pequeños que se acumulan,
 *   · encrucijadas (★): eliges UNA de dos opciones que cambian cómo juegas,
 *   · culmen (★★): pide 15 puntos en su rama.
 * Cada nodo pide el anterior de su rama. Reiniciar es gratis en Villa Candela.
 */
'use strict';

// ---------- Constructores de nodos ----------
const N = (id, name, icon, max, m, d) => ({ id, name, icon, max, m, d });
const K = (id, name, icon, fx, d, m) => ({ id, name, icon, max: 1, key: 1, fx, d, m });
const X = (id, a, b) => ({ id, choice: [a, b], max: 1 });
const CAP = (id, name, icon, d, fx, m) => ({ id, name, icon, max: 1, cap: 1, fx, d, m });
// nodos de rango habituales
const nDmg = (id, n, i) => N(id, n, i, 5, { dmg: 0.03 }, '+3% de daño por rango');
const nAspd = (id, n, i) => N(id, n, i, 5, { aspd: 0.03 }, '+3% de velocidad de ataque por rango');
const nCrit = (id, n, i) => N(id, n, i, 5, { crit: 0.015 }, '+1,5% de probabilidad de crítico por rango');
const nCritD = (id, n, i) => N(id, n, i, 3, { critDmg: 0.1 }, '+10% de daño crítico por rango');
const nSkill = (id, n, i) => N(id, n, i, 5, { skill: 0.04 }, '+4% de daño de habilidades por rango');
const nCd = (id, n, i) => N(id, n, i, 5, { cd: 0.03 }, '-3% de tiempo de recarga por rango');
const nHp = (id, n, i) => N(id, n, i, 5, { hp: 0.04 }, '+4% de PV máximos por rango');
const nArmor = (id, n, i) => N(id, n, i, 5, { armor: 0.015 }, '-1,5% de daño recibido por rango');
const nSpeed = (id, n, i) => N(id, n, i, 3, { speed: 0.03 }, '+3% de velocidad de movimiento por rango');
const nRegen = (id, n, i) => N(id, n, i, 3, { regen: 0.002 }, 'Recuperas un 0,2% de vida por segundo por rango');
const nLs = (id, n, i) => N(id, n, i, 3, { ls: 0.008 }, 'Robas un 0,8% del daño como vida por rango');
const nPa = (id, n, i) => N(id, n, i, 2, { pa: 1 }, '+1 de energía máxima por rango');
const nPaR = (id, n, i) => N(id, n, i, 5, { paRegen: 0.05 }, '+5% de recarga de energía por rango');
const nKama = (id, n, i) => N(id, n, i, 3, { kama: 0.08 }, '+8% de ámbar por rango');
const nUlt = (id, n, i) => N(id, n, i, 3, { ult: 0.1 }, 'La definitiva se carga un 10% más rápido por rango');
const nBoss = (id, n, i) => N(id, n, i, 3, { boss: 0.06 }, '+6% de daño a Guardianes y élites por rango');

const TALENTS = {
  iop: [
    { id: 'furia', name: 'Furia', color: '#ff5a3d', icon: '🪓', nodes: [
      nDmg('filo', 'Filo afilado', '🗡'), nAspd('ritmo', 'Ritmo de guerra', '⚡'),
      X('golpe', K('doble', 'Hachazo doble', '✦', { k: 'combo', n: 4, mul: 0.7 }, 'Cada 4.º golpe básico lanza un segundo tajo (70%)'),
        K('giro', 'Molino', '🌀', { k: 'fan', n: 5 }, 'Cada 5.º golpe básico es un giro completo que golpea a todos alrededor')),
      nCritD('brutal', 'Golpe brutal', '💥'), nLs('sed', 'Sed de sangre', '🩸'),
      X('instinto', K('verdugo', 'Verdugo', '💀', { k: 'execute' }, '+40% de daño a enemigos con menos del 30% de vida'),
        K('cazagigantes', 'Cazagigantes', '🗿', { k: 'bossbane' }, '+25% de daño a Guardianes y élites')),
      nDmg('furor', 'Furor', '🔥'),
      CAP('ira', 'Ira imparable', '🔥', 'Cada enemigo que matas: +8% de velocidad de ataque 3 s (hasta ×5)', { k: 'ira' }),
    ] },
    { id: 'torbellino', name: 'Torbellino', color: '#ffb040', icon: '✸', nodes: [
      nSkill('conducto', 'Conducto ígneo', '✸'), nCd('vigor', 'Vigor rúnico', '⏳'),
      X('salto', K('aterrizaje', 'Aterrizaje ardiente', '🌋', { k: 'zone', i: 0 }, 'Embestida Sísmica deja el suelo ardiendo 3 s'),
        K('rebote', 'Rebote', '↺', { k: 'echo', i: 0, p: 0.3 }, '30% de probabilidad de que Embestida Sísmica no gaste su recarga')),
      nPa('reserva', 'Reserva de energía', '★'), nPaR('aliento2', 'Respiración de combate', '🌬'),
      X('fuego', K('incendio', 'Incendio', '🔥', { k: 'zone', i: 1 }, 'Furia Ígnea deja el suelo ardiendo 3 s'),
        K('sobrecarga', 'Sobrecarga', '⚡', { k: 'overcharge' }, '+20% de daño mientras tengas la energía llena')),
      nUlt('cataclismo0', 'Presagio', '☄'),
      CAP('cataclismo', 'Cataclismo', '☄', 'La definitiva se carga un 40% más rápido y tus habilidades hacen +15%', null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'bastion', name: 'Bastión', color: '#8fb7d8', icon: '🛡', nodes: [
      nHp('piel', 'Piel de hierro', '❤'), nArmor('guardia', 'Guardia', '🛡'),
      X('aguante', K('aliento', 'Segundo aliento', '🌬', { k: 'aliento' }, 'Una vez por Grieta, al bajar del 25% de vida recuperas un 35%'),
        K('espinas', 'Coraza de púas', '🌵', { k: 'thorns' }, 'Devuelves un 40% del daño recibido a los enemigos cercanos')),
      nRegen('regen', 'Regeneración', '✚'), nSpeed('pies', 'Pies ligeros', '👢'),
      X('defensa', K('escudo', 'Escudo de guerra', '🛡', { k: 'skillShield' }, 'Cada habilidad te da un escudo del 12% de tu vida'),
        K('sanguinaria', 'Sanguinaria', '🍷', { k: 'frenesi' }, 'Cada enemigo que matas te cura un 2% de vida')),
      nHp('coloso', 'Coloso', '⛰'),
      CAP('inquebrantable', 'Inquebrantable', '⛰', 'Al esquivar: 1 s más de invulnerabilidad y +25% de daño durante 2 s', { k: 'inquebrantable' }),
    ] },
  ],
  cra: [
    { id: 'punteria', name: 'Puntería', color: '#7fe08a', icon: '➶', nodes: [
      nDmg('plumas', 'Plumas afiladas', '🪶'), nAspd('tension', 'Tensión rápida', '⚡'),
      X('flecha', K('perforante', 'Flecha perforante', '➹', { k: 'pierce' }, 'Tus flechas básicas atraviesan a un enemigo más'),
        K('rafaga', 'Ráfaga', '»', { k: 'combo', n: 3, mul: 0.6 }, 'Cada 3.er disparo sale una segunda flecha (60%)')),
      nCrit('ojo', 'Ojo crítico', '👁'), nCritD('punta', 'Punta letal', '💥'),
      X('caza', K('verdugo', 'Tiro de gracia', '💀', { k: 'execute' }, '+40% de daño a enemigos con menos del 30% de vida'),
        K('cazamayor', 'Caza mayor', '🦌', { k: 'bossbane' }, '+25% de daño a Guardianes y élites')),
      nDmg('precision', 'Precisión', '🎯'),
      CAP('multiple', 'Disparo múltiple', '☰', 'Cada 5.º disparo lanza 3 flechas en abanico', { k: 'fan', n: 5 }),
    ] },
    { id: 'artilleria', name: 'Artillería', color: '#ffb040', icon: '✹', nodes: [
      nSkill('polvora', 'Pólvora', '✹'), nCd('carcaj', 'Carcaj ligero', '⏳'),
      X('ignea', K('gemela', 'Flecha gemela', '✶', { k: 'twin', i: 0 }, 'Flecha Ígnea dispara dos flechas a la vez'),
        K('brasas', 'Brasas', '🔥', { k: 'zone', i: 0 }, 'Flecha Ígnea deja fuego donde cae')),
      nPa('energia', 'Reserva de energía', '★'), nPaR('recarga', 'Respiración', '🌀'),
      X('lluvia', K('diluvio', 'Diluvio', '☔', { k: 'echo', i: 1, p: 0.25 }, '25% de probabilidad de que Tormenta de Flechas no gaste su recarga'),
        K('chispas', 'Chispa crítica', '✨', { k: 'critEnergy' }, 'Tus golpes críticos te devuelven energía')),
      nUlt('halcon0', 'Vista aguda', '🦅'),
      CAP('halcon', 'Ojo del halcón', '🦅', 'La definitiva se carga un 40% más rápido y tus habilidades hacen +15%', null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'supervivencia', name: 'Supervivencia', color: '#8fb7d8', icon: '🌲', nodes: [
      nHp('piel', 'Cuero curtido', '❤'), nSpeed('zancada', 'Zancada', '👢'),
      X('viento', K('paso', 'Paso del viento', '»', null, '+1 carga de esquiva', { pm: 1 }),
        K('nova', 'Retroceso', '💨', { k: 'nova' }, 'Al esquivar empujas y dañas a los enemigos cercanos')),
      nArmor('guardia', 'Esquiva instintiva', '🛡'), nKama('saqueo', 'Saqueador', '◆'),
      X('instinto', K('aliento', 'Último recurso', '🌬', { k: 'aliento' }, 'Una vez por Grieta, al bajar del 25% de vida recuperas un 35%'),
        K('presa', 'Presa fácil', '🍖', { k: 'frenesi' }, 'Cada enemigo que matas te cura un 2% de vida')),
      nRegen('campamento', 'Hierbas del bosque', '🌿'),
      CAP('trampa', 'Retirada táctica', '✳', 'Al esquivar dejas una trampa que estalla (200% de daño de habilidad)', { k: 'trampa' }),
    ] },
  ],
  feca: [
    { id: 'runas', name: 'Runas', color: '#ff8a3a', icon: '✺', nodes: [
      nSkill('tinta', 'Tinta ígnea', '✺'), nCd('trazo', 'Trazo rápido', '⏳'),
      X('circulo', K('doble', 'Círculo doble', '◎', { k: 'zone', i: 1 }, 'Runa de Fuego deja un segundo círculo ardiendo'),
        K('eco', 'Runa resonante', '↺', { k: 'echo', i: 1, p: 0.3 }, '30% de probabilidad de que Runa de Fuego no gaste su recarga')),
      nPa('reserva', 'Reserva arcana', '★'), nPaR('meditacion', 'Meditación', '🧘'),
      X('poder', K('sobrecarga', 'Sobrecarga arcana', '⚡', { k: 'overcharge' }, '+20% de daño mientras tengas la energía llena'),
        K('chispa', 'Chispa crítica', '✨', { k: 'critEnergy' }, 'Tus golpes críticos te devuelven energía')),
      nUlt('presagio', 'Presagio rúnico', '☄'),
      CAP('archimaga', 'Archimaga', '🔮', 'La definitiva se carga un 40% más rápido y tus habilidades hacen +15%', null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'egida', name: 'Égida', color: '#8fd0ff', icon: '⛨', nodes: [
      nHp('escudo', 'Sello de vida', '❤'), nArmor('glifo', 'Glifo protector', '🛡'),
      X('egida', K('reflejo', 'Égida reflectante', '🌵', { k: 'thorns' }, 'Devuelves un 40% del daño recibido a los enemigos cercanos'),
        K('aliento', 'Runa de vida', '🌬', { k: 'aliento' }, 'Una vez por Grieta, al bajar del 25% de vida recuperas un 35%')),
      nRegen('savia', 'Savia rúnica', '✚'), nSpeed('levitar', 'Levitación', '🪶'),
      X('barrera', K('escudo2', 'Barrera eterna', '🛡', { k: 'skillShield' }, 'Cada habilidad te da un escudo del 12% de tu vida'),
        K('nova', 'Onda rúnica', '💨', { k: 'nova' }, 'Al esquivar empujas y dañas a los enemigos cercanos')),
      nHp('baluarte', 'Baluarte', '⛰'),
      CAP('inquebrantable', 'Muralla viva', '⛰', 'Al esquivar: 1 s más de invulnerabilidad y +25% de daño durante 2 s', { k: 'inquebrantable' }),
    ] },
    { id: 'baculo', name: 'Báculo', color: '#d7b4ff', icon: '🪄', nodes: [
      nDmg('cristal', 'Cristal pulido', '💎'), nAspd('conjuro', 'Conjuro veloz', '⚡'),
      X('orbe', K('perforante', 'Orbe errante', '➹', { k: 'pierce' }, 'Tus orbes atraviesan a un enemigo más'),
        K('gemelo', 'Orbe gemelo', '✶', { k: 'combo', n: 3, mul: 0.6 }, 'Cada 3.er disparo sale un segundo orbe (60%)')),
      nCrit('foco', 'Foco', '👁'), nCritD('estallido', 'Estallido', '💥'),
      X('juicio', K('verdugo', 'Juicio', '💀', { k: 'execute' }, '+40% de daño a enemigos con menos del 30% de vida'),
        K('cazaheraldos', 'Cazaheraldos', '🗿', { k: 'bossbane' }, '+25% de daño a Guardianes y élites')),
      nDmg('resonancia', 'Resonancia', '🔔'),
      CAP('lluvia', 'Lluvia de orbes', '☰', 'Cada 5.º disparo lanza 3 orbes en abanico', { k: 'fan', n: 5 }),
    ] },
  ],
  sombra: [
    { id: 'filo', name: 'Filo', color: '#b490ff', icon: '🗡', nodes: [
      nDmg('afilar', 'Afilar', '🗡'), nAspd('danza', 'Danza de dagas', '⚡'),
      X('corte', K('doble', 'Corte doble', '✦', { k: 'combo', n: 3, mul: 0.6 }, 'Cada 3.er golpe básico da un tajo extra (60%)'),
        K('veneno', 'Filo envenenado', '☠', { k: 'poison' }, 'Tus golpes envenenan (25% del daño en 3 s)')),
      nCrit('punto', 'Punto débil', '👁'), nCritD('letal', 'Golpe letal', '💥'),
      X('asesino', K('verdugo', 'Asesinato', '💀', { k: 'execute' }, '+40% de daño a enemigos con menos del 30% de vida'),
        K('cazarrecompensas', 'Cazarrecompensas', '◆', { k: 'bossbane' }, '+25% de daño a Guardianes y élites')),
      nCritD('carnicera', 'Carnicera', '🩸'),
      CAP('mil', 'Mil cortes', '✧', 'Cada 5.º golpe básico es un torbellino de dagas que golpea a todos alrededor', { k: 'fan', n: 5 }),
    ] },
    { id: 'sombras', name: 'Sombras', color: '#7a5aa8', icon: '☾', nodes: [
      nSkill('noche', 'Noche cerrada', '☾'), nCd('fugaz', 'Fugaz', '⏳'),
      X('paso', K('rebote', 'Paso doble', '↺', { k: 'echo', i: 0, p: 0.35 }, '35% de probabilidad de que Paso Sombrío no gaste su recarga'),
        K('niebla', 'Niebla tóxica', '☁', { k: 'zone', i: 1 }, 'Abanico Venenoso deja una nube que daña')),
      nPa('reserva', 'Reserva de sombras', '★'), nPaR('susurro', 'Susurro', '🌬'),
      X('vacio', K('chispa', 'Hambre del vacío', '✨', { k: 'critEnergy' }, 'Tus golpes críticos te devuelven energía'),
        K('sobrecarga', 'Oscuridad plena', '⚡', { k: 'overcharge' }, '+20% de daño mientras tengas la energía llena')),
      nUlt('eclipse0', 'Penumbra', '🌑'),
      CAP('eclipse', 'Eclipse', '🌑', 'La definitiva se carga un 40% más rápido y tus habilidades hacen +15%', null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'evasion', name: 'Evasión', color: '#8fb7d8', icon: '💨', nodes: [
      nSpeed('sigilo', 'Sigilo', '👢'), nHp('fibra', 'Fibra', '❤'),
      X('esquiva', K('viento', 'Paso del viento', '»', null, '+1 carga de esquiva', { pm: 1 }),
        K('nova', 'Cortina de humo', '💨', { k: 'nova' }, 'Al esquivar empujas y dañas a los enemigos cercanos')),
      nArmor('reflejos', 'Reflejos', '🛡'), nLs('sanguijuela', 'Sanguijuela', '🩸'),
      X('supervivencia', K('aliento', 'Escapista', '🌬', { k: 'aliento' }, 'Una vez por Grieta, al bajar del 25% de vida recuperas un 35%'),
        K('presa', 'Depredadora', '🍖', { k: 'frenesi' }, 'Cada enemigo que matas te cura un 2% de vida')),
      nKama('botin', 'Botín', '◆'),
      CAP('fantasma', 'Fantasma', '👻', 'Al esquivar: 1 s más de invulnerabilidad y +25% de daño durante 2 s', { k: 'inquebrantable' }),
    ] },
  ],
  domadora: [
    { id: 'manada', name: 'Manada', color: '#9be05a', icon: '🐺', nodes: [
      nSkill('aullido', 'Aullido', '🐺'), nCd('rastreo', 'Rastreo', '⏳'),
      X('lobos', K('alfa', 'Lobo alfa', '↺', { k: 'echo', i: 0, p: 0.3 }, '30% de probabilidad de que Llamada del Lobo no gaste su recarga'),
        K('estampida', 'Tierra batida', '🐾', { k: 'zone', i: 1 }, 'Rugido Salvaje deja el suelo desgarrado (daña 3 s)')),
      nPa('reserva', 'Reserva salvaje', '★'), nPaR('vinculo', 'Vínculo', '🌀'),
      X('instinto', K('sobrecarga', 'Instinto pleno', '⚡', { k: 'overcharge' }, '+20% de daño mientras tengas la energía llena'),
        K('escudo', 'Piel de oso', '🛡', { k: 'skillShield' }, 'Cada habilidad te da un escudo del 12% de tu vida')),
      nUlt('luna0', 'Luna llena', '🌕'),
      CAP('reina', 'Reina de la manada', '👑', 'La definitiva se carga un 40% más rápido y tus habilidades hacen +15%', null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'cayado', name: 'Cayado', color: '#e0b060', icon: '🪄', nodes: [
      nDmg('madera', 'Madera de fresno', '🌳'), nAspd('ritmo', 'Ritmo tribal', '⚡'),
      X('golpe', K('doble', 'Doble golpe', '✦', { k: 'combo', n: 4, mul: 0.7 }, 'Cada 4.º golpe básico da otro golpe (70%)'),
        K('veneno', 'Espinas', '🌵', { k: 'poison' }, 'Tus golpes envenenan (25% del daño en 3 s)')),
      nCrit('ojo', 'Ojo de lince', '👁'), nCritD('colmillo', 'Colmillo', '💥'),
      X('caza', K('verdugo', 'Remate', '💀', { k: 'execute' }, '+40% de daño a enemigos con menos del 30% de vida'),
        K('cazamayor', 'Caza mayor', '🦌', { k: 'bossbane' }, '+25% de daño a Guardianes y élites')),
      nDmg('furia', 'Furia salvaje', '🔥'),
      CAP('giro', 'Torbellino del cayado', '🌀', 'Cada 5.º golpe básico golpea a todos alrededor', { k: 'fan', n: 5 }),
    ] },
    { id: 'naturaleza', name: 'Naturaleza', color: '#7fe08a', icon: '🌿', nodes: [
      nHp('raices', 'Raíces', '❤'), nRegen('savia', 'Savia', '✚'),
      X('bosque', K('espinas', 'Corteza espinosa', '🌵', { k: 'thorns' }, 'Devuelves un 40% del daño recibido a los enemigos cercanos'),
        K('aliento', 'Renacer', '🌬', { k: 'aliento' }, 'Una vez por Grieta, al bajar del 25% de vida recuperas un 35%')),
      nArmor('corteza', 'Corteza', '🛡'), nSpeed('zancada', 'Zancada', '👢'),
      X('ciclo', K('presa', 'Ciclo de la vida', '🍖', { k: 'frenesi' }, 'Cada enemigo que matas te cura un 2% de vida'),
        K('nova', 'Brote', '💨', { k: 'nova' }, 'Al esquivar empujas y dañas a los enemigos cercanos')),
      nHp('roble', 'Roble', '⛰'),
      CAP('druida', 'Gran druida', '🌳', 'Al esquivar: 1 s más de invulnerabilidad y +25% de daño durante 2 s', { k: 'inquebrantable' }),
    ] },
  ],
  artificiera: [
    { id: 'explosivos', name: 'Explosivos', color: '#ff8a3a', icon: '💣', nodes: [
      nDmg('polvora', 'Pólvora fina', '💥'), nAspd('mecha', 'Mecha corta', '⚡'),
      X('bomba', K('racimo', 'Bombas gemelas', '✶', { k: 'combo', n: 3, mul: 0.6 }, 'Cada 3.ª bomba sale otra más (60%)'),
        K('rebote', 'Bomba saltarina', '➹', { k: 'pierce' }, 'Tus bombas atraviesan a un enemigo más antes de estallar')),
      nCrit('calibre', 'Calibre', '🎯'), nCritD('metralla', 'Metralla', '💥'),
      X('demolicion', K('verdugo', 'Demolición', '💀', { k: 'execute' }, '+40% de daño a enemigos con menos del 30% de vida'),
        K('rompemuros', 'Rompemuros', '🧱', { k: 'bossbane' }, '+25% de daño a Guardianes y élites')),
      nDmg('nitro', 'Nitro', '🔥'),
      CAP('bombardeo', 'Bombardeo', '☰', 'Cada 5.ª bomba lanza 3 en abanico', { k: 'fan', n: 5 }),
    ] },
    { id: 'ingenieria', name: 'Ingeniería', color: '#ffd76a', icon: '⚙', nodes: [
      nSkill('engranaje', 'Engranajes', '⚙'), nCd('llave', 'Llave inglesa', '🔧'),
      X('torreta', K('doble', 'Torreta exprés', '↺', { k: 'echo', i: 0, p: 0.3 }, '30% de probabilidad de que la Torreta no gaste su recarga'),
        K('aceite', 'Aceite ardiente', '🔥', { k: 'zone', i: 1 }, 'Bomba Racimo deja el suelo en llamas')),
      nPa('bateria', 'Batería', '★'), nPaR('dinamo', 'Dinamo', '🌀'),
      X('genio', K('chispa', 'Chispa genial', '✨', { k: 'critEnergy' }, 'Tus golpes críticos te devuelven energía'),
        K('sobrecarga', 'Sobrecarga', '⚡', { k: 'overcharge' }, '+20% de daño mientras tengas la energía llena')),
      nUlt('prototipo', 'Prototipo', '🛠'),
      CAP('obra', 'Obra maestra', '🏆', 'La definitiva se carga un 40% más rápido y tus habilidades hacen +15%', null, { ult: 0.4, skill: 0.15 }),
    ] },
    { id: 'blindaje', name: 'Blindaje', color: '#8fb7d8', icon: '🛡', nodes: [
      nHp('placas', 'Placas', '❤'), nArmor('remaches', 'Remaches', '🛡'),
      X('armadura', K('escudo', 'Escudo de latón', '🛡', { k: 'skillShield' }, 'Cada habilidad te da un escudo del 12% de tu vida'),
        K('espinas', 'Pinchos', '🌵', { k: 'thorns' }, 'Devuelves un 40% del daño recibido a los enemigos cercanos')),
      nSpeed('botas', 'Botas a vapor', '👢'), nKama('chatarra', 'Chatarrera', '◆'),
      X('emergencia', K('aliento', 'Botiquín', '🌬', { k: 'aliento' }, 'Una vez por Grieta, al bajar del 25% de vida recuperas un 35%'),
        K('cohete', 'Propulsor', '💨', { k: 'nova' }, 'Al esquivar empujas y dañas a los enemigos cercanos')),
      nRegen('reparacion', 'Autorreparación', '✚'),
      CAP('trampa', 'Mina de despedida', '✳', 'Al esquivar dejas una mina que estalla (200% de daño de habilidad)', { k: 'trampa' }),
    ] },
  ],
  berserker: [
    { id: 'matanza', name: 'Matanza', color: '#ff4a3a', icon: '⚔', nodes: [
      nDmg('acero', 'Acero', '🗡'), nAspd('frenesi0', 'Frenesí', '⚡'),
      X('tajo', K('doble', 'Tajo de vuelta', '✦', { k: 'combo', n: 4, mul: 0.7 }, 'Cada 4.º golpe básico da otro tajo (70%)'),
        K('giro', 'Torbellino', '🌀', { k: 'fan', n: 5 }, 'Cada 5.º golpe básico golpea a todos alrededor')),
      nCritD('brutal', 'Brutal', '💥'), nCrit('ojo', 'Ojo rojo', '👁'),
      X('caza', K('verdugo', 'Decapitar', '💀', { k: 'execute' }, '+40% de daño a enemigos con menos del 30% de vida'),
        K('mataogros', 'Mataogros', '🗿', { k: 'bossbane' }, '+25% de daño a Guardianes y élites')),
      nDmg('carniceria', 'Carnicería', '🔥'),
      CAP('ira', 'Ira roja', '🔥', 'Cada enemigo que matas: +8% de velocidad de ataque 3 s (hasta ×5)', { k: 'ira' }),
    ] },
    { id: 'sangre', name: 'Sangre', color: '#b0203a', icon: '🩸', nodes: [
      nLs('sed', 'Sed', '🩸'), nHp('vigor', 'Vigor', '❤'),
      X('herida', K('rabia', 'Rabia herida', '😡', { k: 'berserk' }, 'Por debajo del 50% de vida haces un 30% más de daño'),
        K('presa', 'Festín', '🍖', { k: 'frenesi' }, 'Cada enemigo que matas te cura un 2% de vida')),
      nRegen('cicatriz', 'Cicatrices', '✚'), nLs('vampiro', 'Vampiro', '🦇'),
      X('pacto', K('aliento', 'Negarse a caer', '🌬', { k: 'aliento' }, 'Una vez por Grieta, al bajar del 25% de vida recuperas un 35%'),
        K('espinas', 'Piel de guerra', '🌵', { k: 'thorns' }, 'Devuelves un 40% del daño recibido a los enemigos cercanos')),
      nHp('mole', 'Mole', '⛰'),
      CAP('inmortal', 'Inmortal', '⛰', 'Al esquivar: 1 s más de invulnerabilidad y +25% de daño durante 2 s', { k: 'inquebrantable' }),
    ] },
    { id: 'grito', name: 'Grito', color: '#ffb040', icon: '📯', nodes: [
      nSkill('voz', 'Vozarrón', '📯'), nCd('aliento', 'Aliento de guerra', '⏳'),
      X('golpe', K('rebote', 'Sangre caliente', '↺', { k: 'echo', i: 0, p: 0.3 }, '30% de probabilidad de que Golpe Sangriento no gaste su recarga'),
        K('terremoto', 'Terremoto', '🌋', { k: 'zone', i: 0 }, 'Golpe Sangriento agrieta el suelo (daña 3 s)')),
      nPa('reserva', 'Reserva de rabia', '★'), nPaR('furia', 'Furia', '🌀'),
      X('grito', K('escudo', 'Grito de hierro', '🛡', { k: 'skillShield' }, 'Cada habilidad te da un escudo del 12% de tu vida'),
        K('sobrecarga', 'Rabia plena', '⚡', { k: 'overcharge' }, '+20% de daño mientras tengas la energía llena')),
      nUlt('presagio', 'Llamada de guerra', '☄'),
      CAP('caudillo', 'Caudillo', '👑', 'La definitiva se carga un 40% más rápido y tus habilidades hacen +15%', null, { ult: 0.4, skill: 0.15 }),
    ] },
  ],
};
const CAP_NEED = 15; // puntos en la rama para el nodo culmen

// ---------- Estado ----------
const talTree = () => (S && TALENTS[S.cls]) || null;
// claves válidas del héroe actual (rama.nodo o rama.nodo.opción)
function talKeys() {
  const out = {}, T = talTree();
  if (!T) return out;
  for (const br of T) br.nodes.forEach((n, i) => {
    if (n.choice) for (const o of n.choice) out[br.id + '.' + n.id + '.' + o.id] = { br, n, o, i };
    else out[br.id + '.' + n.id] = { br, n, o: n, i };
  });
  return out;
}
function talState() {
  if (!S.tal) S.tal = {};
  const valid = talKeys();
  for (const k of Object.keys(S.tal)) if (!valid[k]) delete S.tal[k]; // árboles antiguos: se devuelven los puntos
  return S.tal;
}
const talRank = (k) => (S && S.tal && S.tal[k]) || 0;
const nodeRank = (br, n) => (n.choice ? n.choice.reduce((a, o) => a + talRank(br.id + '.' + n.id + '.' + o.id), 0) : talRank(br.id + '.' + n.id));
const talSpent = () => Object.values(talState()).reduce((a, b) => a + b, 0);
const talPoints = () => Math.max(0, (S.level - 1) - talSpent());
const branchSpent = (br) => br.nodes.reduce((a, n) => a + nodeRank(br, n), 0);
function talCan(key) {
  const K0 = talKeys()[key];
  if (!K0) return false;
  const { br, n, o, i } = K0;
  if (talRank(key) >= o.max || talPoints() < 1) return false;
  if (n.choice && nodeRank(br, n) > 0) return false; // ya elegiste la otra
  if (i > 0 && nodeRank(br, br.nodes[i - 1]) < 1) return false;
  if (n.cap && branchSpent(br) < CAP_NEED) return false;
  return true;
}
function talActive() { // opciones aprendidas
  const out = [];
  const keys = talKeys();
  for (const [k, v] of Object.entries(keys)) { const r = talRank(k); if (r) out.push({ o: v.o, r }); }
  return out;
}
function talMods() {
  const m = {};
  for (const { o, r } of talActive()) if (o.m) for (const [k, v] of Object.entries(o.m)) m[k] = (m[k] || 0) + v * r;
  return m;
}
const talFxList = () => talActive().filter((a) => a.o.fx).map((a) => a.o.fx);
const talFx = (k) => talFxList().find((f) => f.k === k) || null;

// ---------- Estadísticas ----------
const _derivedT = derived;
derived = function () {
  const d = _derivedT(), m = talMods();
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
const _recalcT = recalc;
recalc = function () {
  _recalcT();
  if (!P) return;
  const m = talMods();
  P.maxPa = 6 + (m.pa || 0);
  P.maxPm = 3 + (S.up.reflejos || 0) + (uniqueOn('viento') ? 1 : 0) + (m.pm || 0);
};
const _stealLifeT = stealLife;
stealLife = function (dmg) { _stealLifeT(dmg); const ls = talMods().ls; if (ls && P && P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + dmg * ls); };
const _gainUltT = gainUlt;
gainUlt = function (n) { return _gainUltT(n * (1 + (talMods().ult || 0))); };

// ---------- Efectos especiales (genéricos para todos los héroes) ----------
let talShots = 0;
// daño: ejecución, cazagigantes, energía llena, rabia herida, veneno, crítico que devuelve energía
const _damageEnemyT = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  if (!P || e.dead || o.tal) return _damageEnemyT(e, base, o);
  const m = talMods();
  if (talFx('execute') && e.hp < e.maxHp * 0.3) base *= 1.4;
  if (e.boss || e.elite) base *= (1 + (m.boss || 0)) * (talFx('bossbane') ? 1.25 : 1);
  if (talFx('overcharge') && P.pa >= P.maxPa - 0.01) base *= 1.2;
  if (talFx('berserk') && P.hp < P.maxHp * 0.5) base *= 1.3;
  const hp0 = e.hp, r = _damageEnemyT(e, base, o);
  const dealt = Math.max(0, hp0 - Math.max(0, e.hp));
  if (talFx('poison') && !e.dead && dealt > 0) e.dot = { t: 3, dps: Math.max(1, dealt * 0.25 / 3), tick: 0.5 };
  if (talFx('critEnergy') && Math.random() < P.crit) P.pa = Math.min(P.maxPa, P.pa + 0.4);
  return r;
};
function extraShots(nP, offs, mul) {
  const made = projectiles.slice(nP).filter((p) => p.team === 'p');
  const base = made[made.length - 1];
  if (!base) return false;
  for (const off of offs) {
    const a = Math.atan2(base.vy, base.vx) + off, sp = Math.hypot(base.vx, base.vy);
    projectiles.push(Object.assign({}, base, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: base.dmg * mul, hit: [] }));
  }
  return true;
}
const _basicAttackT = basicAttack;
basicAttack = function () {
  const nP = projectiles.length;
  _basicAttackT();
  talShots++;
  const ranged = projectiles.length > nP;
  if (talFx('pierce')) for (let i = nP; i < projectiles.length; i++) if (projectiles[i].team === 'p') projectiles[i].pierce = (projectiles[i].pierce || 0) + 1;
  const combo = talFx('combo');
  if (combo && talShots % combo.n === 0) {
    if (ranged) extraShots(nP, [0.12], combo.mul);
    else {
      const a = P.dir;
      later(0.12, () => {
        if (!P || scene !== 'rift') return;
        slashes.push({ x: P.x, y: P.y, dir: a, arc: 2.3, range: 86, life: 0.18, max: 0.18, color: '#ff8a5a', side: -P.swingSide, width: 26, follow: true });
        meleeArc(P.x, P.y, a, 90, 1.2, basicDmg() * combo.mul, 200);
        SFX.play('swing');
      });
    }
  }
  const fan = talFx('fan');
  if (fan && talShots % fan.n === 0) {
    if (ranged) extraShots(nP, [-0.22, 0.22], 1);
    else {
      aoe(P.x, P.y, 110, basicDmg() * 0.9, 220);
      rings.push({ x: P.x, y: P.y, r0: 20, r1: 110, life: 0.25, max: 0.25, color: 'rgba(255,200,140,' });
      SFX.play('swing');
    }
  }
};
const _useSkillT = useSkill;
useSkill = function (i) {
  const cd0 = P.skillCd[i], nP = projectiles.length, pa0 = P.pa;
  _useSkillT(i);
  if (P.skillCd[i] <= cd0) return; // no se lanzó
  for (const f of talFxList()) {
    if (f.k === 'zone' && f.i === i) {
      const t = nearestEnemy(P.x, P.y, 360), tx = P.jump ? P.jump.tx : t ? t.x : P.x, ty = P.jump ? P.jump.ty : t ? t.y : P.y;
      later(0.4, () => { if (P && scene === 'rift') { glyphs.push({ x: tx, y: ty, r: 95, life: 3, max: 3, tick: 0, mul: 0.8 }); addDecal('scorch', tx, ty, 80, 3, '255,110,30'); } });
    }
    if (f.k === 'echo' && f.i === i && Math.random() < f.p) { P.skillCd[i] = 0; addText(P.x, P.y - 60, '¡Otra vez!', '#ffe08a', 0.9); }
    if (f.k === 'twin' && f.i === i) extraShots(nP, [0.16], 1);
  }
  if (talFx('skillShield')) { P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * 0.12)); P.shieldT = Math.max(P.shieldT || 0, 4); }
  if (talFx('refund') && Math.random() < 0.25) P.pa = Math.min(P.maxPa, P.pa + (pa0 - P.pa));
};
const _dashT = dash;
dash = function () {
  const pm0 = P.pm;
  _dashT();
  if (P.pm >= pm0) return;
  if (talFx('inquebrantable')) { P.invul = Math.max(P.invul, 1.25); P.indT = 2; recalc(); }
  if (talFx('nova')) {
    aoe(P.x, P.y, 100, skillDmg(1), 420);
    rings.push({ x: P.x, y: P.y, r0: 10, r1: 100, life: 0.3, max: 0.3, color: 'rgba(200,230,255,' });
  }
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
const _hurtPlayerT = hurtPlayer;
hurtPlayer = function (dmg, sx, sy, src) {
  const hp0 = P ? P.hp : 0;
  const r = _hurtPlayerT(dmg, sx, sy, src);
  const lost = P ? hp0 - P.hp : 0;
  if (lost > 0 && talFx('thorns')) for (const e of enemies) if (!e.dead && dist(e.x, e.y, P.x, P.y) < 120) _damageEnemyT(e, lost * 0.4, { quiet: true, color: '#9be05a', tal: 1 });
  return r;
};
const _killEnemyT = killEnemy;
killEnemy = function (e) {
  const r = _killEnemyT(e);
  if (!P) return r;
  if (talFx('ira')) { P.iraN = Math.min(5, (P.iraT > 0 ? P.iraN || 0 : 0) + 1); P.iraT = 3; recalc(); }
  if (talFx('frenesi')) P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.02);
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
function talNodeBtn(br, n, i, key, o, cls) {
  const r = talRank(key), can = talCan(key), prev = i === 0 || nodeRank(br, br.nodes[i - 1]) > 0;
  const lock = !r && !can && (!prev || (n.cap && branchSpent(br) < CAP_NEED) || (n.choice && nodeRank(br, n) > 0));
  const pips = o.max > 1 ? `<span class="tp">${Array.from({ length: o.max }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('')}</span>` : '';
  return `<button class="tn ${cls} ${o.key ? 'key' : ''} ${n.cap ? 'cap' : ''} ${r ? 'got' : ''} ${can ? 'can' : ''} ${lock ? 'lock' : ''} ${talSel === key ? 'sel' : ''}" data-k="${key}" title="${o.name}"><span class="ic">${o.icon}</span>${pips}</button>`;
}
function buildTalents() {
  const box = $('shTalents'), T = talTree();
  if (!T) { box.innerHTML = '<div class="tal-soon">🌳 Este héroe aún no tiene árbol de talentos.</div>'; return; }
  const keys = talKeys(), pts = talPoints();
  if (!talSel || !keys[talSel]) talSel = Object.keys(keys)[0];
  const rows = T.map((br) => {
    const spent = branchSpent(br);
    const nodes = br.nodes.map((n, i) => {
      const line = i ? `<b class="tl ${nodeRank(br, n) || nodeRank(br, br.nodes[i - 1]) ? 'on' : ''}"></b>` : '';
      if (!n.choice) return line + talNodeBtn(br, n, i, br.id + '.' + n.id, n, '');
      return line + `<span class="tx">${n.choice.map((o) => talNodeBtn(br, n, i, br.id + '.' + n.id + '.' + o.id, o, 'mini')).join('<em>o</em>')}</span>`;
    }).join('');
    return `<div class="tb" style="--c:${br.color}"><div class="tb-h"><b>${br.icon} ${br.name}</b><small>${spent} pts${spent < CAP_NEED ? ` · culmen ${CAP_NEED}` : ' · ★★'}</small></div><div class="tb-n">${nodes}</div></div>`;
  }).join('');
  const { br: SB, n: SN, o: SO, i: SI } = keys[talSel], r = talRank(talSel), can = talCan(talSel);
  const why = r >= SO.max ? '' : pts < 1 ? 'Sin puntos: ganas uno por nivel' : SN.choice && nodeRank(SB, SN) > 0 ? 'Ya elegiste la otra opción de esta encrucijada (reinicia para cambiar)'
    : SI > 0 && nodeRank(SB, SB.nodes[SI - 1]) < 1 ? 'Primero aprende el anterior de la rama' : SN.cap && branchSpent(SB) < CAP_NEED ? `Necesitas ${CAP_NEED} puntos en ${SB.name} (tienes ${branchSpent(SB)})` : '';
  const kind = SN.cap ? '★★ Culmen' : SN.choice ? '★ Encrucijada · elige una' : 'Pasivo';
  box.innerHTML = `<div class="tal-head"><b>Talentos</b><span class="tal-pts ${pts ? 'has' : ''}">${pts} punto${pts === 1 ? '' : 's'}</span><small class="tal-sp">${talSpent()} gastados</small>
      <button id="talReset" class="sh-sell" ${talSpent() && invReturn === 'hub' ? '' : 'disabled'} title="Gratis en Villa Candela">↺ Reiniciar</button></div>
    <div class="tal-grid"><div class="tal-tree">${rows}</div>
      <aside class="tal-info" style="--c:${SB.color}"><div class="ti-n">${SO.icon} ${SO.name}</div>
        <div class="ti-t">${kind} · ${SB.name} · rango ${r}/${SO.max}</div>
        <div class="ti-d">${SO.d}</div>
        ${SN.choice ? `<div class="ti-alt">La otra opción: <b>${SN.choice.find((o) => o !== SO).name}</b> — ${SN.choice.find((o) => o !== SO).d}</div>` : ''}
        <button id="talLearn" class="sh-sell auto" ${can ? '' : 'disabled'}>${r >= SO.max ? '✔ Aprendido' : 'Aprender'}</button>
        ${why ? `<small class="ti-why">${why}</small>` : ''}</aside></div>`;
  for (const b of box.querySelectorAll('.tn')) b.onclick = () => { talSel = b.dataset.k; SFX.play('click'); buildTalents(); };
  $('talLearn').onclick = () => {
    if (!talCan(talSel)) return;
    talState()[talSel] = r + 1;
    SFX.play(SN.cap || SN.choice ? 'legend' : 'level');
    persist(); if (P) recalc();
    buildTalents();
    buildInventory();
  };
  $('talReset').onclick = () => { S.tal = {}; persist(); if (P) recalc(); SFX.play('zaap'); buildTalents(); buildInventory(); };
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
