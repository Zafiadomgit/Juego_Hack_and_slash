/* Fendaria — música de jefe por mundo y música dinámica.
 *  · Cada Guardián y cada Súper Jefe suena con su propio tema (boss_<mundo>, sb_<mundo>), hecho con
 *    la tonalidad, el leitmotiv y el instrumento de su mundo (tools/audio/compose.py).
 *  · Fase final del Súper Jefe: la música se acelera y sube de tono.
 *  · Con poca vida la música se apaga (filtro de graves) hasta que te recuperas.
 */
'use strict';

const BOSS_WORLDS = ['ceniza', 'pantano', 'glaciar', 'desierto', 'abismo', 'hundida', 'cristal', 'ciudadela'];
const _musicPlayM = MUSIC.play.bind(MUSIC);
MUSIC.play = function (name, opts = {}) {
  const id = scene === 'rift' && rift && !rift.isDungeon && rift.biome && rift.biome.id;
  if (id && BOSS_WORLDS.includes(id)) {
    if (name === 'boss') name = 'boss_' + id;
    else if (name === 'superboss') name = 'sb_' + id;
  }
  return _musicPlayM(name, opts);
};

// filtro de graves a la salida de la música (para el efecto de poca vida)
const _musicAttachM = MUSIC.attach.bind(MUSIC);
MUSIC.attach = function (ac, master) {
  _musicAttachM(ac, master);
  try {
    this.lpf = ac.createBiquadFilter();
    this.lpf.type = 'lowpass'; this.lpf.frequency.value = 20000; this.lpf.Q.value = 0.7;
    this.out.disconnect(); this.out.connect(this.lpf); this.lpf.connect(master);
  } catch (e) { this.lpf = null; }
};
let musLow = false;
function musicTick() {
  requestAnimationFrame(musicTick);
  const M = MUSIC;
  if (!M.ac || !M.lpf) return;
  const low = scene === 'rift' && state === 'play' && P && P.maxHp && P.hp / P.maxHp < 0.3;
  if (low !== musLow) { musLow = low; M.lpf.frequency.setTargetAtTime(low ? 900 : 20000, M.ac.currentTime, low ? 0.25 : 0.6); }
}
requestAnimationFrame(musicTick);

// fase final del Súper Jefe: más rápido y medio tono arriba
const _updateSuperM = updateSuper;
updateSuper = function (e, dt) {
  const ph = e.phase;
  _updateSuperM(e, dt);
  if (e.phase === 2 && ph !== 2 && MUSIC.cur && MUSIC.cur.src && MUSIC.ac) {
    try { MUSIC.cur.src.playbackRate.setTargetAtTime(1.06, MUSIC.ac.currentTime, 0.8); } catch (err) { /* sin cambio */ }
  }
};
