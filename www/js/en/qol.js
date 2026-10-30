/* Fendaria — calidad de vida.
 *  · Ajustes (pausa y barra de la villa): ataque automático, volumen de música y de efectos, temblor de
 *    pantalla, números de daño, botones grandes, texto grande, vibración y venta automática con la bolsa llena.
 *  · Al vencer al Guardián, el botín que queda en el suelo vuela hacia ti.
 */
'use strict';

const OPT_DEF = { autoAtk: false, music: 0.8, sfx: 0.9, shake: 1, dmgNums: 'all', bigBtns: false, bigText: false, autoSell: true };
const OPT = () => (SAVE.opt = Object.assign({}, OPT_DEF, SAVE.opt || {}));
let TXT_BIG = false, TXT_HUD = false; // texto grande (se copia de OPT en applyOptions: text() se llama cientos de veces por fotograma)

// ---------- panel ----------
document.body.insertAdjacentHTML('beforeend', `<div id="optPanel" class="run-pick">
  <div class="rp-box opt-box">
    <div class="rp-head"><b>Settings</b><small class="opt-ver">Version 1.3 · Oct 29</small></div>
    <label class="opt-row"><span><b>Auto-attack</b><small>Attack automatically when an enemy is in range</small></span><input type="checkbox" data-o="autoAtk"></label>
    <label class="opt-row"><span><b>Music</b></span><input type="range" min="0" max="1" step="0.05" data-o="music"></label>
    <label class="opt-row"><span><b>Sound effects</b></span><input type="range" min="0" max="1" step="0.05" data-o="sfx"></label>
    <label class="opt-row"><span><b>Screen shake</b></span><input type="range" min="0" max="1" step="0.25" data-o="shake"></label>
    <label class="opt-row"><span><b>Damage numbers</b></span><select data-o="dmgNums"><option value="all">All</option><option value="crit">Crits only</option><option value="off">None</option></select></label>
    <label class="opt-row"><span><b>Big buttons</b><small>Larger combat buttons</small></span><input type="checkbox" data-o="bigBtns"></label>
    <label class="opt-row"><span><b>Full bag: sell the worst</b><small>When you pick up something better, the weakest common or rare piece is sold automatically</small></span><input type="checkbox" data-o="autoSell"></label>
    <label class="opt-row"><span><b>Language · Idioma</b></span><select id="optLang"><option value="es">Español</option><option value="en">English</option></select></label>
    <a class="opt-row opt-link" href="https://zafiadomgit.github.io/Juego_Hack_and_slash/privacidad.html" target="_blank" rel="noopener"><span><b>Privacy policy</b><small>What data the game stores (ranking and cloud save)</small></span><span>↗</span></a>
    <button id="optClose" class="rp-opt go" type="button"><i>✔</i><span><b>Done</b></span></button>
  </div>
</div>`);
document.querySelector('#optPanel [data-o="bigBtns"]').closest('label').insertAdjacentHTML('afterend', "<label class=\"opt-row\"><span><b>Large text</b><small>Health, energy, buttons and combat panels easier to read</small></span><input type=\"checkbox\" data-o=\"bigText\"></label>");
let optPrev = null;
function openOptions() {
  const o = OPT();
  for (const el of document.querySelectorAll('#optPanel [data-o]')) {
    const k = el.dataset.o;
    if (el.type === 'checkbox') el.checked = !!o[k]; else el.value = o[k];
  }
  optPrev = state; if (state === 'play' || state === 'pause') state = 'pause';
  $('optPanel').classList.add('show'); SFX.play('click');
}
function closeOptions() { $('optPanel').classList.remove('show'); persist(); if (optPrev === 'hub') state = 'hub'; }
$('optClose').addEventListener('click', closeOptions);
// idioma: cada uno tiene su página (index.html / index_en.html, generada con tools/i18n); la partida es la misma
const LANG = document.documentElement.lang === 'en' ? 'en' : 'es';
$('optLang').value = LANG;
$('optLang').addEventListener('change', (ev) => {
  try { localStorage.setItem('fendaria_lang', ev.target.value); } catch (e) { /* sin almacenamiento */ }
  persist();
  location.replace(ev.target.value === 'en' ? 'index_en.html' : 'index.html');
});
$('optPanel').addEventListener('click', (ev) => { if (ev.target.id === 'optPanel') closeOptions(); });
$('optPanel').addEventListener('input', (ev) => {
  const el = ev.target, k = el.dataset && el.dataset.o;
  if (!k) return;
  OPT()[k] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
  applyOptions();
  if (k === 'sfx') SFX.play('hit');
});
function applyOptions() {
  const o = OPT();
  MUSIC.vol = 0.55 * o.music; MUSIC.setDuck(MUSIC.duck);
  if (SFX.sfxGain) SFX.sfxGain.gain.value = 0.9 * o.sfx;
  TXT_BIG = !!o.bigText;
}
document.querySelector('#pause #btnMute').insertAdjacentHTML('beforebegin', "<button id=\"btnOpts\" class=\"btn\">⚙ Settings</button>");
$('btnOpts').addEventListener('click', openOptions);
(function () {
  const slots = document.querySelector('#dofusBar .db-slots');
  if (!slots) return;
  slots.insertAdjacentHTML('beforeend', "<button id=\"dbOpts\" class=\"db-slot\" type=\"button\"><img src=\"img/ui/gear.png\" alt=\"\"><span>Settings</span></button>");
  $('dbOpts').addEventListener('click', () => { if (state === 'hub') openOptions(); });
})();
// el audio se crea con el primer toque: aplicar los volúmenes en cuanto exista
const _sfxInitQ = SFX.init.bind(SFX);
SFX.init = function () { const had = !!this.ac; _sfxInitQ(); if (!had && this.ac) applyOptions(); };
applyOptions();

// ---------- ataque automático ----------
const _updatePlayerQ = updatePlayer;
updatePlayer = function (dt) {
  _updatePlayerQ(dt);
  if (!OPT().autoAtk || scene !== 'rift' || state !== 'play' || input.attack) return;
  if (P.atkCd > 0 || P.lock > 0 || P.cast || P.jump || P.dashT > 0) return;
  const melee = ['iop', 'berserker', 'sombra', 'domadora'].includes(P.cls);
  if (nearestEnemy(P.x, P.y, melee ? 120 : 380)) basicAttack();
};

// ---------- temblor y números de daño ----------
const _shakeQ = shake;
shake = function (m) { const k = OPT().shake; if (k > 0) _shakeQ(m * k); };
const _damageEnemyQ = damageEnemy;
damageEnemy = function (e, base, o = {}) {
  const mode = OPT().dmgNums, n0 = texts.length;
  const r = _damageEnemyQ(e, base, o);
  if (mode !== 'all') for (let i = texts.length - 1; i >= n0; i--) if (/^\d+$/.test(texts[i].txt) && (mode === 'off' || !texts[i].crit)) texts.splice(i, 1);
  return r;
};

// ---------- texto grande: solo el HUD y los botones (los textos del mundo HD-2D se guardan y se dibujan otra vez) ----------
const _textQ = text;
text = function (str, x, y, size, ...rest) { return _textQ(str, x, y, TXT_HUD && TXT_BIG && size < 18 ? size * 1.2 : size, ...rest); };
const _drawHUDQ = drawHUD;
drawHUD = function () { TXT_HUD = true; try { _drawHUDQ(); } finally { TXT_HUD = false; } };
const _drawControlsQ = drawControls;
drawControls = function () { TXT_HUD = true; try { _drawControlsQ(); } finally { TXT_HUD = false; } };

// ---------- botones grandes ----------
const _buttonLayoutQ = buttonLayout;
buttonLayout = function () {
  const L = _buttonLayoutQ();
  if (!OPT().bigBtns) return L;
  for (const k of ['attack', 's0', 's1', 's2', 'dash', 'pan', 'ult', 'cast']) if (L[k]) L[k] = Object.assign({}, L[k], { r: L[k].r * 1.18 });
  return L;
};

// ---------- bolsa llena: vender la peor pieza para hacer sitio ----------
const _collectQ = collect;
collect = function (k) {
  if (k.type === 'item' && S.bag.length >= bagMax() && OPT().autoSell) {
    let worst = -1;
    S.bag.forEach((it, i) => {
      if (it.unique || it.set || it.rarity > 1 || itemPower(it) >= itemPower(k.item)) return;
      if (worst < 0 || itemPower(it) < itemPower(S.bag[worst])) worst = i;
    });
    if (worst >= 0) {
      const old = S.bag.splice(worst, 1)[0];
      S.kamas += old.value || 0;
      addText(P.x, P.y - 66, `Sold: ${old.name} (+${old.value || 0})`, '#ecd18a', 0.75);
    }
  }
  return _collectQ(k);
};

// ---------- tras el Guardián, el botín vuela hacia ti ----------
const _updatePickupsQ = updatePickups;
updatePickups = function (dt) {
  if (scene === 'rift' && rift && rift.bossDead && P) {
    rift.lootT = (rift.lootT || 0) + dt;
    if (rift.lootT > 1.6) for (const k of pickups) {
      if (k.t < 0.4) continue;
      const a = Math.atan2(P.y - k.y, P.x - k.x), d = dist(k.x, k.y, P.x, P.y);
      k.vx = Math.cos(a) * Math.max(260, d * 3); k.vy = Math.sin(a) * Math.max(260, d * 3);
    }
  }
  _updatePickupsQ(dt);
};
