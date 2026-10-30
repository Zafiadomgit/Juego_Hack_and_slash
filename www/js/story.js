/* Fendaria — trama principal y cuadros de diálogo.
 * Acto I «El Cerrajero»: hace trescientos años la Orden de las Runas encerró a Morvhal tras cinco Sellos, uno en cada
 * tierra que hoy está al otro lado de las Grietas. Morvhal está forzándolos desde dentro y ha corrompido a sus guardianes
 * (los Súper Jefes). Cada Súper Jefe vencido libera un Sello; con los cinco, Morvhal huye a la Mazmorra (contenido final).
 *
 * Las decisiones, sus efectos en el juego, la historia al morir y las despedidas de los jefes están en saga.js.
 *
 * Retratos: si existe img/portraits/<id>.png (y está en PORTRAITS) se usa; si no, se recorta el sprite del personaje.
 */
'use strict';

// Retratos pintados disponibles en img/portraits (ids: hero_<clase>, ivo, brunilda, tobias, morvhal, boss_<bioma>)
const PORTRAITS = [];

const CHAPTERS = [
  { title: 'Ceniza y juramento', goal: 'Cierra las Grietas del Bosque Ceniciento y derrota al Rey Ceniza' },
  { title: 'La ciénaga que susurra', goal: 'Atraviesa la Ciénaga Sombría y libera a la Madre de la Ciénaga' },
  { title: 'El invierno que no termina', goal: 'Sube al Glaciar Rúnico y vence al Titán del Invierno Eterno' },
  { title: 'Las arenas de ámbar', goal: 'Cruza el Desierto de Ámbar y apaga al Fénix corrompido' },
  { title: 'El Cerrajero', goal: 'Desciende al Abismo del Vacío y derrota al Archimago' },
  { title: 'La ciudad bajo el mar', goal: 'Desciende a la Ciudad Hundida y derrota a Nereth, Heraldo de la Marea', act: 2 },
  { title: 'El bosque que canta', goal: 'Atraviesa el Bosque de Cristal y vence a Lysara, Heraldo del Prisma', act: 2 },
  { title: 'La Ciudadela del Cerrajero', goal: 'Asalta la Ciudadela y derrota a Morvhal, el Cerrajero', act: 3 },
  { title: 'Epílogo: la llave rota', goal: 'Las Grietas se calman. Explora la Mazmorra en busca de reliquias', act: 3 },
];

// Voz de cada héroe en los momentos clave
const HERO_LINES = {
  iop: { intro: 'Entonces habrá más yelmos que partir. ¿Qué hay al otro lado, Ivo?', defy: 'Tengo un hacha y muy poca paciencia. Sal de las sombras y lo hablamos.', boss: 'Mi padre forjaba yelmos. Yo los parto. ¡Ven aquí!', final: 'Partiré el último yelmo de Morvhal. Por la herrería de mi padre.' },
  cra: { intro: 'He seguido rastros peores. ¿Adónde lleva este?', defy: 'Mi halcón ya sabe dónde estás. Solo es cuestión de tiempo.', boss: 'Quieto. Así. Una flecha basta.', final: 'Por el bosque que fue mi casa. Una última flecha.' },
  feca: { intro: 'Las runas del borde de la Grieta… son una cerradura. Lo sabía.', defy: 'Conozco tus runas, Cerrajero. Y sé cómo cerrarlas.', boss: 'Égida arriba. Esto va a doler… a ti.', final: 'La Torre cayó por tu culpa, Morvhal. Yo cerraré la última puerta.' },
  sombra: { intro: '¿Y cuánto paga la villa por cerrar Grietas? Pregunto por curiosidad.', defy: 'Las voces en la oscuridad no me asustan. Yo vivo ahí.', boss: 'No me verás venir. Nadie lo hace.', final: 'Tres días a oscuras me enseñaron una cosa: la sombra también corta.' },
  domadora: { intro: 'La manada está inquieta desde anoche. Ahora sé por qué.', defy: 'Mis lobos huelen tu miedo, voz. Y les gusta.', boss: '¡Manada, conmigo! ¡A por él!', final: 'La loba gris aulló toda la noche. Sabe que es la última cacería.' },
  artificiera: { intro: '¿Una cerradura gigante? Me encantan las cerraduras. Sobre todo volarlas.', defy: 'Tengo una bomba con tu nombre. Literalmente: lo he grabado.', boss: '¡Cubríos! …Ah, que estoy sola. ¡Pues cúbrete tú!', final: 'Siempre dije que cerraría una Grieta con la explosión adecuada. Hoy la tengo.' },
  berserker: { intro: 'Huelo sangre al otro lado. Bien.', defy: 'Tus palabras no sangran. Tus monstruos sí.', boss: '¡LA FURIA ROJA! ¡VEN!', final: 'Mi clan cayó ante un monstruo. Morvhal no tendrá esa suerte.' },
};
const heroLine = (k) => (HERO_LINES[S.cls] || HERO_LINES.iop)[k];

// Escenas: [quién, texto]. {hero} = nombre del héroe
const SCENES = {
  prologo: [
    ['ivo', '¡{hero}! Por fin. Ven, acércate… y no pises mis raíces de mandrágora.'],
    ['ivo', 'Anoche la Grieta del Portal Rúnico volvió a abrirse. Más grande. Y esta vez no se cerró al amanecer.'],
    ['hero', () => heroLine('intro')],
    ['ivo', 'El Bosque Ceniciento. Era un bosque de verdad, ¿sabes? Hace trescientos años, antes de que la Orden de las Runas sellara aquella tierra.'],
    ['ivo', 'Los libros viejos hablan de cinco Sellos. Si las Grietas se abren… es que alguien los está forzando desde dentro.'],
    ['brunilda', 'Y mientras los sabios discuten, los monstruos se comen mis gallinas. Si vas a cruzar, llévate algo decente: mi puesto está abierto.'],
    ['tobias', 'Y si lo decente se te queda corto, tráemelo. Mi yunque lo convertirá en algo que asuste a un dragón.'],
    ['ivo', 'Cruza el Portal, llena la Grieta de luz y derrota a su Guardián. Y {hero}… si oyes una voz ahí dentro, no le contestes.'],
  ],
  enter0: [
    ['voz', 'Vaya, vaya. Una lucecita de Villa Candela.'],
    ['voz', 'Llevo trescientos años girando esta cerradura. No vas a detenerme tú.'],
    ['hero', () => heroLine('defy')],
    ['voz', 'Ya veremos. Mi Rey Ceniza tiene hambre.'],
  ],
  boss0: [
    ['boss', '¡GRRAAH! ¡El bosque ardió… y yo ardí con él! ¡El Cerrajero prometió devolverme mis árboles!'],
    ['hero', () => heroLine('boss')],
    ['boss', '¡Entonces arderás tú también!'],
  ],
  win0: [
    ['ivo', '¿Lo notas? El aire de la villa huele menos a humo. Has liberado el primer Sello: el Sello de Ceniza.'],
    ['ivo', 'El Rey Ceniza no era malvado. Era el guardián del Sello… y alguien lo corrompió.'],
    ['hero', 'Una voz me habló ahí dentro. Dijo que llevaba trescientos años girando una cerradura.'],
    ['ivo', '…El Cerrajero. Morvhal. Creía que era una leyenda para asustar a los aprendices.'],
    ['ivo', 'Si es él, irá a por el segundo Sello, en la Ciénaga Sombría. No le des tiempo, {hero}.'],
  ],
  enter1: [
    ['morvhal', 'Has roto mi primera cerradura. Qué grosero.'],
    ['morvhal', '¿Sabes por qué la Orden me encerró? Porque yo quería abrir puertas, y ellos solo sabían cerrarlas.'],
    ['hero', 'Sé lo que hacen tus monstruos a este lado. Con eso me basta.'],
    ['morvhal', 'La Madre de la Ciénaga cuida mi segundo Sello. Tiene… muchos hijos.'],
  ],
  boss1: [
    ['boss', 'Shhh… mis niños duermen bajo el agua. Tú también dormirás, pequeña luz.'],
    ['hero', () => heroLine('boss')],
  ],
  win1: [
    ['brunilda', '¡Ha vuelto! ¡Y entero! Ivo, págame: te dije que volvería.'],
    ['ivo', 'Dos Sellos… Morvhal estará furioso. La Orden escondió el tercero en lo alto del Glaciar Rúnico.'],
    ['tobias', 'El frío de ahí arriba parte el acero. Pásate por la forja antes de subir. Lo digo en serio.'],
    ['hero', 'Iré. Pero cuando vuelva quiero la verdad entera, Ivo. ¿Cómo sabes tanto de Morvhal?'],
    ['ivo', '…Cuando vuelvas. Te lo prometo.'],
  ],
  enter2: [
    ['morvhal', 'Hace frío, ¿verdad? Aquí me encerraron. Doce runistas, una noche entera cantando.'],
    ['morvhal', 'Uno de ellos era un muchacho asustado que se llamaba Ivo. ¿No te lo ha contado?'],
    ['hero', '¿Ivo…? Mientes.'],
    ['morvhal', 'Pregúntale por qué no envejece.'],
  ],
  boss2: [
    ['boss', 'EL INVIERNO… NO TERMINA. EL SELLO… ME QUEMA.'],
    ['hero', () => heroLine('boss')],
    ['boss', 'LIBÉRAME… O MUERE.'],
  ],
  win2: [
    ['hero', 'Ivo. Morvhal dice que tú estabas allí la noche en que lo encerraron.'],
    ['ivo', '…Era el aprendiz más joven de la Orden. Sostuve la última runa mientras los demás morían congelados.'],
    ['ivo', 'Bebí un elixir para vivir lo bastante como para vigilar los Sellos. Llevo trescientos años en esta villa, esperando que este día no llegara.'],
    ['brunilda', 'Trescientos años y sigues regateándome el precio de las hierbas. Increíble.'],
    ['ivo', 'No te pido que lo entiendas, {hero}. Solo que no me mires como lo miras a él.'],
    // la elección (perdonar o echárselo en cara) y el cuarto Sello están en saga.js
  ],
  enter3: [
    ['morvhal', () => sagaFlag('ivo') === 'doubt' ? 'Ya no te fías del viejo Ivo. Bien. Empiezas a ver.' : sagaFlag('ivo') === 'trust' ? 'Has perdonado al viejo Ivo. Qué tierno. A mí nadie me perdonó.' : 'Ahora ya lo sabes. El viejo Ivo te usa como me usaron a mí: para cerrar puertas.'],
    ['morvhal', 'Únete a mí, {hero}. Al otro lado de la Puerta del Vacío está la Fendaria Antigua. Sin hambre. Sin muerte.'],
    ['morvhal', '¿Qué me dices, lucecita?'],
    // la elección (rechazarlo o preguntar por la Fendaria Antigua) está en saga.js
  ],
  boss3: [
    ['boss', 'Muero y renazco… muero y renazco… ¡Haz que pare!'],
    ['hero', () => heroLine('boss')],
  ],
  win3: [
    ['ivo', 'Cuatro Sellos. Solo queda el quinto, en el Abismo del Vacío, junto a la Puerta misma.'],
    ['tobias', 'He forjado armas toda mi vida para gente que no volvió. Tú vas a volver, ¿me oyes?'],
    ['brunilda', 'Y me traerás algo brillante del Abismo. Para la tienda. Por favor.'],
    ['hero', () => heroLine('final')],
    ['ivo', 'El Archimago del Vacío guarda el último Sello. Fue el maestro de la Orden… y el primero en caer ante Morvhal.'],
  ],
  enter4: [
    ['morvhal', 'Bienvenido a mi casa.'],
    ['morvhal', 'Mi Archimago te espera. Cuando caiga, el último Sello será tuyo… o mío.'],
    ['hero', 'Será de Villa Candela.'],
  ],
  boss4: [
    ['boss', '¿{hero}? No… otra vez no. Morvhal está DENTRO de mí. ¡Acaba conmigo antes de que abra la Puerta!'],
    ['hero', () => heroLine('boss')],
  ],
  win4: [
    ['ivo', 'Lo has conseguido. Los cinco Sellos brillan otra vez.'],
    ['hero', 'Pero Morvhal no murió. Lo sentí escapar… y no estaba solo.'],
    ['god_tiempo', 'No lo estaba, pequeña luz. Soy Kronael. Los Doce hemos observado tu viaje desde el otro lado.'],
    ['god_tiempo', 'Morvhal tiene dos Heraldos. Al romperse los Sellos abrieron Grietas nuevas: una bajo el mar, otra en un bosque de cristal.'],
    ['god_tiempo', 'Mientras ellos vivan, Morvhal puede reconstruir su Ciudadela. Ciérrales el paso, y nosotros te abriremos la puerta final.'],
    ['ivo', '¿Un dios… en mi plaza? Trescientos años y aún me sorprendo.'],
    ['tobias', 'Y bajo el Portal sigue la Mazmorra, llena de reliquias de reyes. Tráemelas y verás de lo que es capaz este yunque.'],
    ['brunilda', 'Villa Candela te debe la vida, {hero}. Aunque te lo seguiré cobrando todo.'],
  ],
  enter5: [
    ['voz', 'Bienvenido a Aelmar, la ciudad que el mar se tragó. Mi señor la hundió hace trescientos años.'],
    ['nereth', 'Soy Nereth, Heraldo de la Marea. Cada ola que rompe aquí lleva un pedazo de la Ciudadela de Morvhal.'],
    ['nereth', 'Hueles a Villa Candela. A hierbas de alquimista. Hace mucho conocí a alguien que olía así.'],
    ['hero', 'Entonces cortaré las olas.'],
    ['god_escudo', 'Aldemar te acompaña, {hero}. El agua no aplasta lo que no se dobla.'],
  ],
  boss5: [
    ['nereth', 'La marea siempre vuelve. Siempre. Y esta vez te arrastrará con ella.'],
    ['nereth', 'Él me prometió devolverme a mi hermano. ¡No dejaré que nadie me lo quite otra vez!'],
    ['hero', () => heroLine('boss')],
  ],
  win5: [
    ['ivo', 'El mar se ha retirado de la Grieta. Uno de los Heraldos ha caído.'],
    ['god_cura', 'Soy Lunessa. Nereth era un pescador de Aelmar al que Morvhal prometió devolver a su hermano. Ahora descansa.'],
    ['ivo', '…Nereth. Se llamaba Nereth. Le enseñé a nadar en el puerto, bajo el faro.'],
    ['hero', 'Ivo… ¿era tu hermano?'],
    ['ivo', 'Mi hermano pequeño. La noche en que la Orden selló Aelmar, él estaba en su barca. Yo sostenía la runa.'],
    ['ivo', () => sagaFlag('ivo') === 'doubt' ? 'Querías saber qué más callaba. Esto. Era esto.' : 'Gracias por traerle descanso, {hero}. Yo no pude en trescientos años.'],
    ['god_cura', 'Morvhal compra a la gente con lo que más quiere. Así compró también a Lysara, la cantora del bosque. Su canto convierte la carne en cristal.'],
    ['tobias', 'Cristal, ¿eh? Pues afila bien, que el cristal se raya.'],
  ],
  enter6: [
    ['lysara', '¿Oyes eso? Es el bosque cantando. Antes era de madera y hojas. Ahora es eterno, como yo.'],
    ['hero', 'Eterno y muerto.'],
    ['lysara', 'Morvhal me dio lo que los dioses me negaron: que nada que amo vuelva a marchitarse.'],
    ['god_bosque', 'Silvano escucha, {hero}. Este bosque era mío. Libéralo y te daré la fuerza de sus raíces.'],
  ],
  boss6: [
    ['lysara', 'Quédate. Conviértete en cristal conmigo. Serás bello para siempre.'],
    ['hero', () => heroLine('boss')],
  ],
  win6: [
    ['ivo', 'Los dos Heraldos han caído. Puedo sentirlo: la Ciudadela ya no tiene muros que la protejan.'],
    ['hero', () => sagaFlag('morvhal') === 'listen' ? 'Ivo. En el desierto, Morvhal me dijo que la Orden selló estas tierras con su gente dentro. ¿Es verdad?' : 'Ivo, Nereth y Lysara venían de tierras selladas. ¿Qué había en ellas cuando las cerrasteis?'],
    ['ivo', 'Gente. Aldeas, puertos, familias. Las Grietas se abrían solas y la Orden decidió cerrarlas para siempre… con todo dentro.'],
    ['ivo', 'Morvhal era uno de los doce. Se negó a cantar: quería abrir las puertas y sacarlos. Lo encerramos a él también.'],
    ['ivo', 'No nació siendo un monstruo, {hero}. Es lo que trescientos años de cerradura hacen con alguien que tenía razón a medias.'],
    ['god_ira', '¡Ja! Soy Brakkar. Hace siglos que no veía a un mortal pelear así. Los Doce abrimos la última Grieta para ti.'],
    ['god_tiempo', 'Al otro lado está la Ciudadela del Cerrajero. Morvhal te espera con su Carcelero y con su llave.'],
    ['ivo', '{hero}… la llave de Morvhal abre cualquier puerta. Incluso la que separa este mundo de la Fendaria Antigua.'],
    ['ivo', 'Si la gira, las Grietas no se cerrarán nunca. Rómpela.'],
    ['brunilda', 'Y vuelve. Que me debes una espada con tu nombre.'],
  ],
  enter7: [
    ['morvhal', 'Has llegado. Ni la Orden llegó tan lejos.'],
    ['morvhal', '¿Ya te lo ha contado Ivo? Yo solo quería sacarlos. Ellos eligieron la cerradura; yo elegí la llave.'],
    ['morvhal', 'Mira a tu alrededor: esta Ciudadela es una cerradura del tamaño de una montaña. Y yo tengo la llave.'],
    ['hero', () => heroLine('final')],
    ['morvhal', 'Antes tendrás que pasar por mi Carcelero. Él guarda a todos los que se me opusieron… incluidos los doce runistas.'],
  ],
  boss7: [
    ['morvhal', 'Trescientos años girando una cerradura. No voy a soltarla ahora.'],
    ['god_tiempo', 'Los Doce estamos contigo, {hero}. Por primera vez, todos a la vez.'],
    ['hero', () => heroLine('boss')],
    ['morvhal', '¡ENTONCES ABRIRÉ LA PUERTA CONTIGO DENTRO!'],
  ],
  win7: [
    ['morvhal', 'La llave… se rompe. No. No…'],
    ['morvhal', 'Al menos… ábreles tú la puerta. A los del otro lado. Promételo.'],
    ['god_tiempo', 'Se acabó, Morvhal. El tiempo que robaste vuelve a su sitio.'],
    ['runista', 'Doce celdas abiertas. Soy Elden, de la Orden de las Runas. Llevábamos trescientos años en las mazmorras del Carcelero.'],
    ['runista', 'Dile a Ivo que ya no tiene que vigilar solo. Volvemos a casa… y esta vez abriremos las puertas con cuidado.'],
    ['ivo', '{hero}. Las Grietas se están cerrando. Todas. Lo has conseguido.'],
    ['ivo', 'Y yo… siento cómo pasan los años. Trescientos de golpe. No te preocupes: es lo justo. Por fin descansaré.'],
    ['god_cura', 'Todavía no, viejo amigo. Lunessa te concede los años que te quedan, como un mortal más. Vívelos.'],
    ['brunilda', 'Espada con tu nombre, {hero}. De las caras. Invita la casa… por esta vez.'],
    ['god_ira', 'Las Grietas menores seguirán abriéndose de vez en cuando, y la Mazmorra está llena de reliquias. ¡Que no se te oxide el arma!'],
    ['tobias', 'Y esta llave rota de Cerrajero… ¿qué hago con ella, {hero}?'],
    // la elección (fundirla o dársela a los Doce) está en saga.js
  ],
  dungeon: [
    ['ivo', 'Esto es la Cámara del Cerrajero. Cada piso es más hondo… y más peligroso que el anterior.'],
    ['ivo', 'Lo que caiga ahí abajo no existe en ningún otro sitio: reliquias únicas, y cada piso que superes despierta un poco más el poder de tu héroe.'],
  ],
};

// Charla de los vecinos según el capítulo (0…5)
const CHATTER = {
  merchant: [
    'Equipo nuevo cada vez que vuelves de una Grieta. Los monstruos traen cosas raras… y yo las vendo más raras todavía.',
    'Dicen que en la Ciénaga hay ranas del tamaño de un carro. Si me traes una piel, te hago descuento. Mentira, no te lo hago.',
    'Arriba en el Glaciar se vende muy bien el ámbar caliente. Bueno, se vendería, si alguien volviera de allí.',
    'Trescientos años… y yo pensando que Ivo se teñía la barba.',
    'Si vuelves del Abismo, prometo ponerle tu nombre a una espada. A una barata, pero con tu nombre.',
    'Desde que los Sellos brillan, vienen mercaderes de todo el reino. ¡La competencia! Compra ahora, antes de que me arruine.',
    '¿Una ciudad entera bajo el mar? Si ves cofres, ábrelos. Si ves perlas, son mías.',
    'Cristal que canta… ¿se podrá vender? Pregunto por un cliente.',
    'No pienso decirte que tengas cuidado en la Ciudadela. Te lo diré cuando vuelvas, que da mala suerte.',
    'Ahora que las Grietas se calman, el negocio de las reliquias está que arde. ¡La Mazmorra, querido, la Mazmorra!',
  ],
  alchemist: [
    'El ámbar de las Grietas es luz cristalizada. Con él preparo elixires… y otras cosas que es mejor no preguntar.',
    'La Orden de las Runas eran doce. Los libros nunca dicen qué fue de ellos. Yo… prefiero no hablar de eso todavía.',
    'Si oyes a Morvhal, recuerda: miente con la verdad. Es lo que mejor sabe hacer.',
    () => sagaFlag('ivo') === 'doubt' ? 'Sé que no me perdonas. Me parece justo. El diario te servirá más que mis disculpas.' : 'Gracias por no mirarme raro desde que lo sabes. Bueno, menos raro que antes.',
    'El Archimago me enseñó a leer runas. Era un buen hombre. Libéralo, {hero}.',
    'Aelmar… la ciudad hundida. Allí nací yo, ¿sabes? Hace mucho. Si ves la torre del faro, salúdala de mi parte.',
    'Nereth tenía once años la última vez que lo vi. Ahora por fin sé dónde descansa. Gracias, {hero}.',
    'El canto de Lysara convierte la carne en cristal. Bebe antes de entrar: los elixires ayudan.',
    'Los doce runistas… el Carcelero los guarda. Si vuelves con ellos, te deberé algo más que gratitud.',
    'Cada día me salen canas nuevas. ¡Qué maravilla! Siéntate, que te preparo algo.',
  ],
  smith: [
    'Tráeme ámbar y refino tus armas. Lo que no uses, véndeselo a Brunilda. Así funciona el mundo.',
    'Un arma refinada a +10 corta cosas que ni deberían existir. Lo sé porque lo he visto.',
    'El acero se parte con ese frío. Lleva el arma bien refinada o no la lleves.',
    'Kara, la de la herrería del este… su padre me enseñó todo lo que sé. Gente de hierro, aquella.',
    'Si vuelves del Abismo con el arma rota, te forjo otra gratis. Si no vuelves… bueno, no pienso en eso.',
    'Las reliquias de la Mazmorra no se pueden ascender ni reforjar. Pero refinarlas… eso sí. Tráemelas.',
    'El salitre se come el acero. Pásate después de la Ciudad Hundida y te lo dejo como nuevo.',
    'Cristal contra acero… gana el que golpea primero. Refina eso.',
    'Te he dejado el mejor temple de mi vida en esa arma. No me la traigas rota.',
    'Con la llave de Morvhal fundida voy a hacer algo grande. Todavía no sé qué. Algo grande.',
  ],
};

// ============================================================
// Personajes y retratos
// ============================================================
const SPEAKERS = {
  ivo: { name: 'Maese Ivo', color: '#d9a8ff', sprite: 'alchemist' },
  brunilda: { name: 'Brunilda', color: '#ffcf7a', sprite: 'merchant' },
  tobias: { name: 'Tobías', color: '#ffb070', sprite: 'smith' },
  morvhal: { name: 'Morvhal, el Cerrajero', color: '#c77dff', aura: '200,90,255' },
  voz: { name: '???', color: '#c77dff', aura: '200,90,255', hidden: true },
};
const NPC_SPEAKER = { merchant: 'brunilda', alchemist: 'ivo', smith: 'tobias' };

function speakerInfo(who, ctx) {
  if (who === 'hero') { const L = CLASS_LORE[S.cls]; return { id: 'hero_' + S.cls, name: L.hero, color: CLASSES[S.cls].color === '#3a2a5a' ? '#b49cff' : '#ecd18a', hero: true }; }
  if (who === 'boss') {
    const b = BIOMES[ctx.b], sb = SUPER_BOSSES[b.id];
    return { id: 'boss_' + b.id, name: sb.name, color: `rgb(${sb.aura})`, aura: sb.aura };
  }
  return Object.assign({ id: who }, SPEAKERS[who]);
}

const portraitCache = {};
function silhouette(aura, hidden) {
  const key = 'sil' + aura + (hidden ? 'h' : '');
  if (portraitCache[key]) return portraitCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(64, 70, 6, 64, 70, 80);
  bg.addColorStop(0, `rgba(${aura},0.55)`); bg.addColorStop(1, 'rgba(8,4,16,0)');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  // capucha y hombros
  g.fillStyle = '#0c0814';
  g.beginPath(); g.moveTo(64, 14); g.bezierCurveTo(98, 18, 104, 58, 96, 84); g.lineTo(124, 128); g.lineTo(4, 128); g.lineTo(32, 84);
  g.bezierCurveTo(24, 58, 30, 18, 64, 14); g.fill();
  g.fillStyle = '#05030a';
  g.beginPath(); g.ellipse(64, 60, 20, 25, 0, 0, Math.PI * 2); g.fill();
  if (!hidden) { g.strokeStyle = `rgba(${aura},0.7)`; g.lineWidth = 2; g.beginPath(); g.moveTo(64, 92); g.lineTo(64, 128); g.stroke(); g.beginPath(); g.arc(64, 104, 6, 0, Math.PI * 2); g.stroke(); }
  // ojos
  g.shadowColor = `rgb(${aura})`; g.shadowBlur = 10; g.fillStyle = '#fff2ff';
  g.fillRect(53, 56, 7, 3); g.fillRect(68, 56, 7, 3);
  return (portraitCache[key] = c.toDataURL());
}
function spritePortrait(kind) {
  const key = 'spr' + kind;
  if (portraitCache[key]) return portraitCache[key];
  const img = PROP_IMG.villa, f = PROP_ATLAS.villa && PROP_ATLAS.villa[kind] && PROP_ATLAS.villa[kind][0];
  if (!img || !f) return null;
  const c = document.createElement('canvas'); c.width = f[2]; c.height = Math.round(f[3] * 0.62);
  c.getContext('2d').drawImage(img, f[0], f[1], f[2], c.height, 0, 0, f[2], c.height);
  return (portraitCache[key] = c.toDataURL());
}
// devuelve { src, mode }: mode 'paint' (retrato pintado), 'hero' (arte de cuerpo entero, encuadrado arriba), 'pixel' o 'sil'
function portraitFor(sp) {
  if (sp.img) return { src: sp.img, mode: 'paint' };
  if (PORTRAITS.includes(sp.id)) return { src: 'img/portraits/' + sp.id + '.png', mode: 'paint' };
  if (sp.hero) { const f = heroFaceURL(S.cls); if (f) return { src: f, mode: 'pixel face' }; const a = heroArt(S.cls); if (a) return { src: a.url, mode: 'hero' }; }
  if (sp.sprite) { const s = spritePortrait(sp.sprite); if (s) return { src: s, mode: 'pixel' }; }
  return { src: silhouette(sp.aura || '200,200,220', sp.hidden), mode: 'sil' };
}

// ============================================================
// Cuadro de diálogo
// ============================================================
const dlgEl = document.createElement('div');
dlgEl.id = 'dlg';
dlgEl.className = 'dlg';
dlgEl.innerHTML = `<div class="dlg-dim"></div>
  <div class="dlg-box">
    <div class="dlg-port"><img alt=""></div>
    <div class="dlg-body"><div class="dlg-name"></div><div class="dlg-text"></div><div class="dlg-choices"></div><div class="dlg-next">▼</div></div>
    <button class="dlg-skip" type="button">Saltar ⏭</button>
  </div>`;
document.body.appendChild(dlgEl);
const dlgQ = [];
let dlg = null;

function hasText(s) { return typeof s === 'function' ? s() : s; }
function fillText(s) { return hasText(s).replace(/\{hero\}/g, CLASS_LORE[S.cls].hero); }

// lines: [[quién, texto]], o: { ctx, choices: [{label, fn}], onEnd }
function playDialog(lines, o = {}) {
  // sin duplicados (tocar al vecino y su botón a la vez) y nunca encima de otro panel
  if ((dlg && dlg.lines === lines) || dlgQ.some((q) => q[0] === lines)) return;
  if (dlg) { dlgQ.push([lines, o]); return; }
  if (['end', 'dead', 'pause', 'inv', 'shop', 'map', 'quests', 'boon'].includes(state)) {
    const tries = (o._tries || 0) + 1;
    if (tries < 40) setTimeout(() => playDialog(lines, Object.assign(o, { _tries: tries })), 500);
    return;
  }
  dlg = { lines, o, i: -1, prev: state, typing: false, full: '', shown: 0 };
  state = 'dialog';
  clearInput();
  dlgEl.classList.add('show');
  nextLine();
}
function nextLine() {
  dlg.i++;
  if (dlg.i >= dlg.lines.length) { endDialog(); return; }
  const [who, text] = dlg.lines[dlg.i];
  const sp = speakerInfo(who, dlg.o.ctx || {});
  const pt = portraitFor(sp);
  const box = dlgEl.querySelector('.dlg-box');
  box.classList.toggle('right', !!sp.hero);
  const port = dlgEl.querySelector('.dlg-port');
  port.className = 'dlg-port ' + pt.mode;
  port.style.setProperty('--c', sp.color);
  port.querySelector('img').src = pt.src;
  const nm = dlgEl.querySelector('.dlg-name');
  nm.textContent = sp.name; nm.style.color = sp.color;
  dlg.full = fillText(text); dlg.shown = 0; dlg.typing = true;
  dlgEl.querySelector('.dlg-text').textContent = '';
  dlgEl.querySelector('.dlg-choices').innerHTML = '';
  dlgEl.querySelector('.dlg-next').style.visibility = 'hidden';
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}
function typeTick() {
  if (dlg && dlg.typing) {
    dlg.shown = Math.min(dlg.full.length, dlg.shown + 2);
    dlgEl.querySelector('.dlg-text').textContent = dlg.full.slice(0, dlg.shown);
    if (dlg.shown >= dlg.full.length) finishTyping();
  }
}
setInterval(typeTick, 28);
function finishTyping() {
  dlg.typing = false;
  dlgEl.querySelector('.dlg-text').textContent = dlg.full;
  const last = dlg.i === dlg.lines.length - 1;
  if (last && dlg.o.choices) {
    dlgEl.querySelector('.dlg-choices').innerHTML = dlg.o.choices.map((c, k) => `<button class="btn" data-k="${k}">${c.label}</button>`).join('');
  } else dlgEl.querySelector('.dlg-next').style.visibility = 'visible';
}
function advanceDialog() {
  if (!dlg) return;
  if (dlg.typing) { finishTyping(); return; }
  if (dlg.i === dlg.lines.length - 1 && dlg.o.choices) return; // hay que elegir
  SFX.play('click');
  nextLine();
}
function endDialog(choice) {
  const d = dlg;
  dlg = null;
  dlgEl.classList.remove('show');
  if (state === 'dialog') state = d.prev;
  clearInput();
  if (choice && choice.fn) choice.fn();
  if (d.o.onEnd) d.o.onEnd();
  if (dlgQ.length) { const [l, o] = dlgQ.shift(); setTimeout(() => playDialog(l, o), 250); }
}
dlgEl.addEventListener('pointerdown', (ev) => {
  ev.stopPropagation();
  const ch = ev.target.closest('.dlg-choices button');
  if (ch) { SFX.play('click'); endDialog(dlg.o.choices[+ch.dataset.k]); return; }
  if (ev.target.closest('.dlg-skip')) { SFX.play('click'); if (dlg.o.choices) { dlg.i = dlg.lines.length - 2; nextLine(); finishTyping(); } else endDialog(); return; }
  advanceDialog();
});
window.addEventListener('keydown', (e) => {
  if (!dlg) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'enter' || k === 'e') advanceDialog();
  else if (k === 'escape') endDialog();
});
try {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App) App.addListener('backButton', () => { if (dlg) endDialog(); });
} catch (e) { /* entorno web */ }

// ============================================================
// Progreso de la trama
// ============================================================
function storyState() {
  if (!S.story) {
    S.story = { seen: {} };
    // partidas anteriores a la trama: se dan por vistas las escenas de lo ya superado
    for (let b = 0; b < BIOMES.length; b++) {
      if (superDone(b)) ['enter', 'boss', 'win'].forEach((k) => { S.story.seen[k + b] = 1; });
      else if (b === 0 && clearedDiffs(0, 1)) S.story.seen.enter0 = 1;
    }
    if (superDone(0)) S.story.seen.prologo = 1;
  }
  return S.story;
}
const storyChapter = () => { let b = 0; while (b < BIOMES.length && superDone(b)) b++; return b; };
function playScene(id, ctx, o = {}) {
  const st = storyState();
  if (st.seen[id] || !SCENES[id]) return false;
  st.seen[id] = 1;
  persist();
  playDialog(SCENES[id], Object.assign({ ctx }, o));
  return true;
}

// Al volver a la villa: prólogo y cierre de capítulo
const _goHub = goHub;
goHub = function () {
  _goHub();
  setTimeout(() => {
    if (state !== 'hub' || !S) return;
    if (playScene('prologo', {})) return;
    for (let b = 0; b < BIOMES.length; b++) {
      if (superDone(b) && playScene('win' + b, { b }, {
        onEnd: () => {
          buildHub();
          if (b === BIOMES.length - 1) showStoryCard('Fin', 'Morvhal ha caído. La Mazmorra guarda aún sus reliquias');
          else if (b === 4) showStoryCard('Acto II · Los Heraldos', CHAPTERS[5].title);
          else if (b === 6) showStoryCard('Acto III · El Cerrajero', CHAPTERS[7].title);
          else showStoryCard('Capítulo ' + (b + 2), CHAPTERS[b + 1].title);
        },
      })) return;
    }
  }, 700);
};

// Al entrar en una Grieta: presentación del bioma o del Súper Jefe (la Mazmorra tiene la suya)
const _startNode = startNode;
startNode = function (b, n, d) {
  _startNode(b, n, d);
  later(2.6, () => { // después del cartel del bioma
    if (!rift || state !== 'play') return;
    if (rift.isDungeon) { playScene('dungeon', { b }); return; }
    if (n === 'S') playScene('boss' + b, { b });
    else playScene('enter' + b, { b });
  });
};

// Hablar con los vecinos: una frase del capítulo y luego la tienda
const _villageInteract = villageInteract;
villageInteract = function (what) {
  const who = what && what.id && NPC_SPEAKER[what.id];
  if (!who) return _villageInteract(what);
  if (dlg || state !== 'hub') return;
  vHero.target = null; vHero.pending = null;
  const ch = Math.min(storyChapter(), 8);
  playDialog([[who, CHATTER[what.id][ch]]], {
    choices: [
      { label: what.id === 'smith' ? '⚒ Herrería' : what.id === 'alchemist' ? '⚗ Elixires y mejoras' : '🛒 Comerciar', fn: () => _villageInteract(what) },
      { label: 'Adiós', fn: null },
    ],
  });
};

// Objetivo actual en la tarjeta del pueblo
const _buildHub = buildHub;
buildHub = function () {
  _buildHub();
  const ch = Math.min(storyChapter(), CHAPTERS.length - 1);
  const card = $('hubChar');
  const old = card.querySelector('.hubStory'); if (old) old.remove();
  card.insertAdjacentHTML('beforeend', `<button class="hubStory" type="button" title="${CHAPTERS[ch].goal}"><b>📖 ${ch < 8 ? 'Cap. ' + (ch + 1) : 'Epílogo'}</b><span>${CHAPTERS[ch].goal}</span></button>`);
  card.querySelector('.hubStory').onclick = (ev) => { ev.currentTarget.classList.toggle('open'); };
};

// Cartel grande de capítulo
function showStoryCard(title, sub) {
  const el = document.createElement('div');
  el.className = 'story-card';
  el.innerHTML = `<small>Fendaria · Acto ${['I', 'I', 'I', 'I', 'I', 'II', 'II', 'III', 'III'][Math.min(storyChapter(), 8)]}</small><b>${title}</b><span>${sub}</span>`;
  document.body.appendChild(el);
  SFX.play('legend');
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 4200);
}
