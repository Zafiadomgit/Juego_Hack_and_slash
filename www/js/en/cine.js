/* Fendaria — cinemáticas de la historia (video/cine_*.webm, hechas con HyperFrames).
 * Se reproducen una vez, justo antes de la escena de diálogo correspondiente, y se pueden saltar.
 */
'use strict';

const CINE_FOR = { prologo: 'prologo', win0: 'sello', win2: 'ivo', win4: 'heraldos', win7: 'final' };
document.body.insertAdjacentHTML('beforeend', `<div id="cine" class="cine">
  <video id="cineVid" playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback" poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></video>
  <button id="cineSound" class="intro-sound" type="button">🔇 Turn on sound</button>
  <button id="cineSkip" class="cine-skip" type="button">Skip ›</button>
</div>`);
let cineDone = null, cinePrev = null;
function playCine(name, onEnd) {
  const el = $('cine'), v = $('cineVid');
  cineDone = onEnd; cinePrev = state;
  state = 'cine';
  clearInput();
  MUSIC.setDuck(0);
  v.src = 'video/cine_' + name + (document.documentElement.lang === 'en' ? '_en' : '') + '.webm';
  v.currentTime = 0; v.muted = !!SFX.muted;
  el.classList.add('show');
  // oculto hasta que de verdad arranca: sin el «play» gris de Android y con fundido desde negro
  v.classList.remove('on');
  const p = v.play();
  // sin permiso para sonar (navegador): se reproduce en silencio con botón para activar el audio
  if (p && p.catch) p.catch(() => { v.muted = true; $('cineSound').classList.add('show'); v.play().catch(endCine); });
}
function endCine() {
  const el = $('cine'), v = $('cineVid');
  if (!el.classList.contains('show')) return;
  v.pause(); v.classList.remove('on'); v.removeAttribute('src'); v.load();
  el.classList.remove('show'); $('cineSound').classList.remove('show');
  if (state === 'cine') state = cinePrev;
  MUSIC.setDuck(1);
  const f = cineDone; cineDone = null;
  if (f) f();
}
$('cineVid').addEventListener('ended', endCine);
$('cineVid').addEventListener('playing', () => $('cineVid').classList.add('on'));
$('cineVid').addEventListener('error', endCine);
$('cineSkip').addEventListener('click', (ev) => { ev.stopPropagation(); SFX.play('click'); endCine(); });
$('cineSound').addEventListener('click', (ev) => { ev.stopPropagation(); $('cineVid').muted = false; $('cineSound').classList.remove('show'); });
window.addEventListener('keydown', (e) => { if (state === 'cine' && (e.key === 'Escape' || e.key === 'Enter')) endCine(); });

// la escena de diálogo arranca cuando acaba la cinemática
const _playSceneC = playScene;
playScene = function (id, ctx, o = {}) {
  const st = storyState();
  if (!CINE_FOR[id] || st.seen[id] || !SCENES[id]) return _playSceneC(id, ctx, o);
  st.seen[id] = 1; persist(); // vista aunque se cierre el juego durante el video
  playCine(CINE_FOR[id], () => { st.seen[id] = 0; _playSceneC(id, ctx, o); });
  return true;
};
