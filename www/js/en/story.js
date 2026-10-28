/* Fendaria — trama principal y cuadros de diálogo.
 * Acto I «El Cerrajero»: hace trescientos años la Orden de las Runas encerró a Morvhal tras cinco Sellos, uno en cada
 * tierra que hoy está al otro lado de las Grietas. Morvhal está forzándolos desde dentro y ha corrompido a sus guardianes
 * (los Súper Jefes). Cada Súper Jefe vencido libera un Sello; con los cinco, Morvhal huye a la Mazmorra (contenido final).
 *
 * Retratos: si existe img/portraits/<id>.png (y está en PORTRAITS) se usa; si no, se recorta el sprite del personaje.
 */
'use strict';

// Retratos pintados disponibles en img/portraits (ids: hero_<clase>, ivo, brunilda, tobias, morvhal, boss_<bioma>)
const PORTRAITS = [];

const CHAPTERS = [
  { title: "Ash and oath", goal: "Close the Rifts of the Ashen Forest and defeat the Ash King" },
  { title: "The whispering swamp", goal: "Cross the Gloomy Swamp and free the Swamp Mother" },
  { title: "The winter that never ends", goal: "Climb the Runic Glacier and defeat the Titan of Eternal Winter" },
  { title: "The amber sands", goal: "Cross the Amber Desert and quench the corrupted Phoenix" },
  { title: "The Locksmith", goal: "Descend into the Void Abyss and defeat the Archmage" },
  { title: "The city beneath the sea", goal: "Descend into the Sunken City and defeat Nereth, Herald of the Tide", act: 2 },
  { title: "The singing forest", goal: "Cross the Crystal Forest and defeat Lysara, Herald of the Prism", act: 2 },
  { title: "The Locksmith's Citadel", goal: "Storm the Citadel and defeat Morvhal, the Locksmith", act: 3 },
  { title: "Epilogue: the broken key", goal: "The Rifts grow calm. Explore the Dungeon in search of relics", act: 3 },
];

// Voz de cada héroe en los momentos clave
const HERO_LINES = {
  iop: { intro: "Then there are more helmets to split. What's on the other side, Ivo?", defy: "I've got an axe and very little patience. Come out of the shadows and let's talk.", boss: "My father forged helmets. I split them. Come here!", final: "I'll split Morvhal's last helmet. For my father's smithy." },
  cra: { intro: "I've followed worse trails. Where does this one lead?", defy: "My hawk already knows where you are. It's only a matter of time.", boss: "Steady. Like that. One arrow is enough.", final: "For the forest that was my home. One last arrow." },
  feca: { intro: "The runes on the edge of the Rift… they're a lock. I knew it.", defy: "I know your runes, Locksmith. And I know how to close them.", boss: "Aegis up. This is going to hurt… you.", final: "The Tower fell because of you, Morvhal. I'll close the last door." },
  sombra: { intro: "And how much does the village pay for closing Rifts? Just curious.", defy: "Voices in the dark don't scare me. I live there.", boss: "You won't see me coming. Nobody does.", final: "Three days in the dark taught me one thing: shadows cut too." },
  domadora: { intro: "The pack has been restless since last night. Now I know why.", defy: "My wolves smell your fear, voice. And they like it.", boss: "Pack, with me! Get him!", final: "The grey she-wolf howled all night. She knows it's the last hunt." },
  artificiera: { intro: "A giant lock? I love locks. Especially blowing them up.", defy: "I've got a bomb with your name on it. Literally: I engraved it.", boss: "Take cover! …Oh, right, I'm alone. Then YOU take cover!", final: "I always said I'd close a Rift with the right explosion. Today I've got it." },
  berserker: { intro: "I smell blood on the other side. Good.", defy: "Your words don't bleed. Your monsters do.", boss: "THE RED FURY! COME ON!", final: "My clan fell to a monster. Morvhal won't be so lucky." },
};
const heroLine = (k) => (HERO_LINES[S.cls] || HERO_LINES.iop)[k];

// Escenas: [quién, texto]. {hero} = nombre del héroe
const SCENES = {
  prologo: [
    ['ivo', "{hero}! At last. Come, come closer… and don't step on my mandrake roots."],
    ['ivo', "Last night the Rift at the Runic Portal opened again. Bigger. And this time it didn't close at dawn."],
    ['hero', () => heroLine('intro')],
    ['ivo', "The Ashen Forest. It was a real forest, you know? Three hundred years ago, before the Order of Runes sealed that land."],
    ['ivo', "The old books speak of five Seals. If the Rifts are opening… someone is forcing them from the inside."],
    ['brunilda', "And while the wise men argue, the monsters eat my chickens. If you're crossing, take something decent with you: my stall is open."],
    ['tobias', "And if decent falls short, bring it to me. My anvil will turn it into something that scares a dragon."],
    ['ivo', "Cross the Portal, fill the Rift with light and defeat its Guardian. And {hero}… if you hear a voice in there, don't answer it."],
  ],
  enter0: [
    ['voz', "Well, well. A little light from Candela Village."],
    ['voz', "I've been turning this lock for three hundred years. You won't be the one to stop me."],
    ['hero', () => heroLine('defy')],
    ['voz', "We'll see. My Ash King is hungry."],
  ],
  boss0: [
    ['boss', "GRRAAH! The forest burned… and I burned with it! The Locksmith promised to give me back my trees!"],
    ['hero', () => heroLine('boss')],
    ['boss', "Then you'll burn too!"],
  ],
  win0: [
    ['ivo', "Can you feel it? The village air smells less of smoke. You've freed the first Seal: the Seal of Ash."],
    ['ivo', "The Ash King wasn't evil. He was the guardian of the Seal… and someone corrupted him."],
    ['hero', "A voice spoke to me in there. It said it had been turning a lock for three hundred years."],
    ['ivo', "…The Locksmith. Morvhal. I thought he was a legend to scare apprentices."],
    ['ivo', "If it's him, he'll go after the second Seal, in the Gloomy Swamp. Don't give him time, {hero}."],
  ],
  enter1: [
    ['morvhal', "You've broken my first lock. How rude."],
    ['morvhal', "Do you know why the Order locked me away? Because I wanted to open doors, and all they knew was how to close them."],
    ['hero', "I know what your monsters do on this side. That's enough for me."],
    ['morvhal', "The Swamp Mother guards my second Seal. She has… many children."],
  ],
  boss1: [
    ['boss', "Shhh… my little ones sleep beneath the water. You'll sleep too, little light."],
    ['hero', () => heroLine('boss')],
  ],
  win1: [
    ['brunilda', "You're back! And in one piece! Ivo, pay up: I told you you'd come back."],
    ['ivo', "Two Seals… Morvhal will be furious. The Order hid the third one high up on the Runic Glacier."],
    ['tobias', "The cold up there cracks steel. Stop by the forge before you climb. I mean it."],
    ['hero', "I'll go. But when I come back I want the whole truth, Ivo. How do you know so much about Morvhal?"],
    ['ivo', "…When you come back. I promise."],
  ],
  enter2: [
    ['morvhal', "Cold, isn't it? This is where they locked me up. Twelve runecasters, a whole night of chanting."],
    ['morvhal', "One of them was a frightened boy named Ivo. Didn't he tell you?"],
    ['hero', "Ivo…? You're lying."],
    ['morvhal', "Ask him why he doesn't age."],
  ],
  boss2: [
    ['boss', "THE WINTER… NEVER ENDS. THE SEAL… BURNS ME."],
    ['hero', () => heroLine('boss')],
    ['boss', "FREE ME… OR DIE."],
  ],
  win2: [
    ['hero', "Ivo. Morvhal says you were there the night they locked him away."],
    ['ivo', "…I was the youngest apprentice of the Order. I held the last rune while the others froze to death."],
    ['ivo', "I drank an elixir to live long enough to watch over the Seals. I've spent three hundred years in this village, hoping this day would never come."],
    ['brunilda', "Three hundred years and you still haggle with me over the price of herbs. Unbelievable."],
    ['ivo', "The fourth Seal is in the Amber Desert. Its guardian is a Phoenix: if it is reborn corrupted, it will be reborn that way forever."],
  ],
  enter3: [
    ['morvhal', "Now you know. Old Ivo uses you the way they used me: to close doors."],
    ['morvhal', "Join me, {hero}. On the other side of the Void Gate lies Ancient Fendaria. No hunger. No death."],
    ['hero', "Ivo told me the truth. All you offer me is another lock."],
    ['morvhal', "Then burn with my Phoenix."],
  ],
  boss3: [
    ['boss', "I die and I'm reborn… I die and I'm reborn… Make it stop!"],
    ['hero', () => heroLine('boss')],
  ],
  win3: [
    ['ivo', "Four Seals. Only the fifth remains, in the Void Abyss, beside the Gate itself."],
    ['tobias', "I've forged weapons all my life for people who never came back. You're coming back, you hear me?"],
    ['brunilda', "And you'll bring me something shiny from the Abyss. For the shop. Please."],
    ['hero', () => heroLine('final')],
    ['ivo', "The Void Archmage guards the last Seal. He was the master of the Order… and the first to fall to Morvhal."],
  ],
  enter4: [
    ['morvhal', "Welcome to my home."],
    ['morvhal', "My Archmage awaits you. When he falls, the last Seal will be yours… or mine."],
    ['hero', "It'll belong to Candela Village."],
  ],
  boss4: [
    ['boss', "{hero}? No… not again. Morvhal is INSIDE me. Finish me before he opens the Gate!"],
    ['hero', () => heroLine('boss')],
  ],
  win4: [
    ['ivo', "You did it. The five Seals shine again."],
    ['hero', "But Morvhal didn't die. I felt him escape… and he wasn't alone."],
    ['god_tiempo', "He wasn't, little light. I am Kronael. We, the Twelve, have watched your journey from the other side."],
    ['god_tiempo', "Morvhal has two Heralds. When the Seals broke they opened new Rifts: one beneath the sea, another in a crystal forest."],
    ['god_tiempo', "While they live, Morvhal can rebuild his Citadel. Cut them off, and we will open the final door for you."],
    ['ivo', "A god… in my square? Three hundred years and I'm still surprised."],
    ['tobias', "And beneath the Portal the Dungeon remains, full of the relics of kings. Bring them to me and you'll see what this anvil can do."],
    ['brunilda', "Candela Village owes you its life, {hero}. Though I'll keep charging you for everything."],
  ],
  enter5: [
    ['voz', "Welcome to Aelmar, the city the sea swallowed. My lord sank it three hundred years ago."],
    ['nereth', "I am Nereth, Herald of the Tide. Every wave that breaks here carries a piece of Morvhal's Citadel."],
    ['hero', "Then I'll cut through the waves."],
    ['god_escudo', "Aldemar is with you, {hero}. Water can't crush what won't bend."],
  ],
  boss5: [
    ['nereth', "The tide always returns. Always. And this time it will drag you with it."],
    ['hero', () => heroLine('boss')],
  ],
  win5: [
    ['ivo', "The sea has withdrawn from the Rift. One of the Heralds has fallen."],
    ['god_cura', "I am Lunessa. Nereth was a fisherman of Aelmar whom Morvhal promised to reunite with his family. Now he rests."],
    ['hero', "Morvhal buys people with what they love most."],
    ['god_cura', "That's how he bought Lysara too, the forest singer. Be careful: her song turns flesh into crystal."],
    ['tobias', "Crystal, huh? Then sharpen your blade well, crystal scratches."],
  ],
  enter6: [
    ['lysara', "Do you hear that? It's the forest singing. It used to be wood and leaves. Now it's eternal, like me."],
    ['hero', "Eternal and dead."],
    ['lysara', "Morvhal gave me what the gods denied me: that nothing I love would ever wither again."],
    ['god_bosque', "Silvano is listening, {hero}. This forest was mine. Free it and I'll give you the strength of its roots."],
  ],
  boss6: [
    ['lysara', "Stay. Become crystal with me. You'll be beautiful forever."],
    ['hero', () => heroLine('boss')],
  ],
  win6: [
    ['ivo', "Both Heralds have fallen. I can feel it: the Citadel no longer has walls to protect it."],
    ['god_ira', "Ha! I am Brakkar. It's been centuries since I saw a mortal fight like that. We, the Twelve, have opened the last Rift for you."],
    ['god_tiempo', "On the other side lies the Locksmith's Citadel. Morvhal awaits you with his Jailer and his key."],
    ['ivo', "{hero}… Morvhal's key opens any door. Even the one that separates this world from Ancient Fendaria."],
    ['ivo', "If he turns it, the Rifts will never close. Break it."],
    ['brunilda', "And come back. You owe me a sword with your name on it."],
  ],
  enter7: [
    ['morvhal', "You've made it. Not even the Order got this far."],
    ['morvhal', "Look around you: this Citadel is a lock the size of a mountain. And I have the key."],
    ['hero', () => heroLine('final')],
    ['morvhal', "First you'll have to get past my Jailer. He keeps everyone who opposed me… including the twelve runecasters."],
  ],
  boss7: [
    ['morvhal', "Three hundred years turning a lock. I'm not letting go now."],
    ['god_tiempo', "The Twelve are with you, {hero}. For the first time, all of us at once."],
    ['hero', () => heroLine('boss')],
    ['morvhal', "THEN I'LL OPEN THE GATE WITH YOU INSIDE!"],
  ],
  win7: [
    ['morvhal', "The key… it's breaking. No. No…"],
    ['god_tiempo', "It's over, Morvhal. The time you stole returns to where it belongs."],
    ['ivo', "{hero}. The Rifts are closing. All of them. You did it."],
    ['ivo', "And I… can feel the years passing. Three hundred all at once. Don't worry: it's only fair. At last I'll rest."],
    ['god_cura', "Not yet, old friend. Lunessa grants you the years you have left, like any other mortal. Live them."],
    ['tobias', "A Locksmith's broken key… I'm going to need a bigger forge."],
    ['brunilda', "A sword with your name, {hero}. One of the pricey ones. On the house… just this once."],
    ['god_ira', "Smaller Rifts will still open now and then, and the Dungeon is full of relics. Don't let your weapon rust!"],
  ],
  dungeon: [
    ['ivo', "This is the Locksmith's Vault. Each floor is deeper… and more dangerous than the last."],
    ['ivo', "What drops down there exists nowhere else: unique relics and Essences to break your limits."],
  ],
};

// Charla de los vecinos según el capítulo (0…5)
const CHATTER = {
  merchant: [
    "New gear every time you come back from a Rift. Monsters bring rare things… and I sell them even rarer.",
    "They say there are frogs the size of a cart in the Swamp. Bring me a hide and I'll give you a discount. Just kidding, I won't.",
    "Up on the Glacier, hot amber sells really well. Well, it would, if anyone ever came back from there.",
    "Three hundred years… and here I was thinking Ivo dyed his beard.",
    "If you come back from the Abyss, I promise to name a sword after you. A cheap one, but with your name.",
    "Since the Seals started shining, merchants come from all over the kingdom. Competition! Buy now, before I go broke.",
    "A whole city under the sea? If you see chests, open them. If you see pearls, they're mine.",
    "Singing crystal… could it be sold? Asking for a customer.",
    "I'm not going to tell you to be careful in the Citadel. I'll tell you when you come back, it's bad luck otherwise.",
    "Now that the Rifts are calming down, the relic business is booming. The Dungeon, dear, the Dungeon!",
  ],
  alchemist: [
    "Rift amber is crystallized light. I brew elixirs with it… and other things it's best not to ask about.",
    "The Order of Runes were twelve. The books never say what became of them. I… would rather not talk about it yet.",
    "If you hear Morvhal, remember: he lies with the truth. It's what he does best.",
    "Thank you for not looking at me funny since you found out. Well, less funny than before.",
    "The Archmage taught me to read runes. He was a good man. Free him, {hero}.",
    "I've lived three hundred years waiting for this ending. Now it turns out it was only the beginning.",
    "Aelmar… the sunken city. I was born there, you know? Long ago. If you see the lighthouse tower, say hello for me.",
    "Lysara's song turns flesh into crystal. Drink before you go in: elixirs help.",
    "The twelve runecasters… the Jailer keeps them. If you come back with them, I'll owe you more than gratitude.",
    "New grey hairs every day. How wonderful! Sit down, I'll make you something.",
  ],
  smith: [
    "Bring me what you don't use: I melt it into Shards. With Shards I refine your weapons. That's how the world works.",
    "A weapon refined to +10 cuts things that shouldn't even exist. I know because I've seen it.",
    "Steel cracks in that cold. Bring a well-refined weapon or don't bring one at all.",
    "Kara, from the eastern smithy… her father taught me everything I know. Iron folk, those.",
    "If you come back from the Abyss with a broken weapon, I'll forge you another for free. If you don't come back… well, I don't think about that.",
    "Dungeon relics can't be ascended or reforged. But refined… that they can. Bring them to me.",
    "Saltpeter eats steel. Come by after the Sunken City and I'll make it good as new.",
    "Crystal against steel… whoever strikes first wins. Refine that.",
    "I put the best temper of my life into that weapon. Don't bring it back broken.",
    "With Morvhal's key melted down I'm going to make something big. I don't know what yet. Something big.",
  ],
};

// ============================================================
// Personajes y retratos
// ============================================================
const SPEAKERS = {
  ivo: { name: "Master Ivo", color: '#d9a8ff', sprite: 'alchemist' },
  brunilda: { name: 'Brunilda', color: '#ffcf7a', sprite: 'merchant' },
  tobias: { name: "Tobias", color: '#ffb070', sprite: 'smith' },
  morvhal: { name: "Morvhal, the Locksmith", color: '#c77dff', aura: '200,90,255' },
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
    <button class="dlg-skip" type="button">Skip ⏭</button>
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
          if (b === BIOMES.length - 1) showStoryCard("The End", "Morvhal has fallen. The Dungeon still holds his relics");
          else if (b === 4) showStoryCard("Act II · The Heralds", CHAPTERS[5].title);
          else if (b === 6) showStoryCard("Act III · The Locksmith", CHAPTERS[7].title);
          else showStoryCard("Chapter " + (b + 2), CHAPTERS[b + 1].title);
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
      { label: what.id === 'smith' ? "⚒ Smithy" : what.id === 'alchemist' ? "⚗ Elixirs and upgrades" : "🛒 Trade", fn: () => _villageInteract(what) },
      { label: "Goodbye", fn: null },
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
  card.insertAdjacentHTML('beforeend', `<button class="hubStory" type="button" title="${CHAPTERS[ch].goal}"><b>📖 ${ch < 8 ? "Ch. " + (ch + 1) : "Epilogue"}</b><span>${CHAPTERS[ch].goal}</span></button>`);
  card.querySelector('.hubStory').onclick = (ev) => { ev.currentTarget.classList.toggle('open'); };
};

// Cartel grande de capítulo
function showStoryCard(title, sub) {
  const el = document.createElement('div');
  el.className = 'story-card';
  el.innerHTML = `<small>Fendaria · Act ${['I', 'I', 'I', 'I', 'I', 'II', 'II', 'III', 'III'][Math.min(storyChapter(), 8)]}</small><b>${title}</b><span>${sub}</span>`;
  document.body.appendChild(el);
  SFX.play('legend');
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 4200);
}
