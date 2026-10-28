/* Fendaria — barra inferior de Villa Candela al estilo Dofus: minimapa, ficha del personaje y accesos rápidos.
 * Reutiliza la ficha (#hubChar) y los botones existentes; solo los cambia de sitio.
 */
'use strict';

(function () {
  const hub = $('hub');
  hub.insertAdjacentHTML('beforeend', `<div id="dofusBar" class="dbar">
    <canvas id="dbMini" class="db-mini" width="240" height="120" aria-label="Minimap of Candela Village"></canvas>
    <div class="db-slots">
      <button id="dbMap" class="db-slot" type="button"><img src="img/ui/map.png" alt=""><span>Rifts</span></button>
      <button id="dbQuests" class="db-slot" type="button"><img src="img/ui/quest.png" alt=""><span>Quests</span></button>
    </div>
  </div>`);
  const bar = $('dofusBar'), slots = bar.querySelector('.db-slots');
  bar.insertBefore($('hubChar'), slots);
  slots.insertBefore($('btnChange'), slots.firstChild);
  slots.insertBefore($('btnInv'), slots.firstChild);
  for (const id of ['btnInv', 'btnChange']) $(id).classList.add('db-slot');
  const oldBtns = hub.querySelector('.hub-btns'); if (oldBtns) oldBtns.remove();
  $('dbMap').addEventListener('click', () => { if (state === 'hub') openMap(); });
  $('dbQuests').addEventListener('click', () => { if (state === 'hub') openQuests(); });
})();

// ---------- minimapa ----------
const MINI = { c: $('dbMini'), g: $('dbMini').getContext('2d'), t: 0 };
function drawMini() {
  const { c, g } = MINI;
  const sx = c.width / VG.w, sy = c.height / VG.h;
  const P = (x, y) => [(x - VG.x0) * sx, (y - VG.y0) * sy];
  g.fillStyle = '#3d5a2c'; g.fillRect(0, 0, c.width, c.height);
  // caminos y plaza
  g.strokeStyle = '#8a6a46'; g.lineCap = 'round';
  const road = (pts, w) => { g.lineWidth = w * sx; g.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = P(x, y); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.stroke(); };
  road([[0, 60], [10, 220], [-10, 380], [0, 600]], 84); road([[-120, 60], [-300, 110], [-520, 140], [-800, 160]], 70); road([[120, 60], [300, 110], [520, 150], [800, 170]], 70);
  const [pcx, pcy] = P(0, -40);
  g.fillStyle = '#a59a86'; g.beginPath(); g.ellipse(pcx, pcy, 270 * sx, 175 * sy, 0, 0, TAU); g.fill();
  for (const o of VILLAGE.props) {
    const [x, y] = P(o.x, o.y);
    if (o.kind === 'house') { g.fillStyle = '#7a3f2a'; g.fillRect(x - 7, y - 9, 14, 10); }
    else if (o.kind === 'tree') { g.fillStyle = o.tint ? '#b8743a' : '#24401c'; g.beginPath(); g.arc(x, y, o.s < 0.7 ? 1.6 : 3, 0, TAU); g.fill(); }
  }
  const [qx, qy] = P(PORTAL.x, PORTAL.y);
  g.fillStyle = '#6fd8ff'; g.beginPath(); g.arc(qx, qy, 4, 0, TAU); g.fill();
  for (const n of NPCS) { const [x, y] = P(n.x, n.y); g.fillStyle = n.color; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); g.strokeStyle = '#141b30'; g.lineWidth = 1; g.stroke(); }
  // héroe: flecha en la dirección en que mira
  const [hx, hy] = P(vHero.x, vHero.y);
  g.save(); g.translate(hx, hy); g.rotate(vHero.dir + Math.PI / 2);
  g.fillStyle = '#fff'; g.strokeStyle = '#141b30'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, -6); g.lineTo(4.5, 5); g.lineTo(0, 2.5); g.lineTo(-4.5, 5); g.closePath(); g.fill(); g.stroke();
  g.restore();
  // lo que se ve en pantalla
  const hw = W / (2 * zoom), hh = H / (2 * zoom), [vx, vy] = P(vCam.x - hw, vCam.y - hh);
  g.strokeStyle = 'rgba(255,240,200,0.6)'; g.lineWidth = 1.5; g.strokeRect(vx, vy, hw * 2 * sx, hh * 2 * sy);
}
function miniLoop(t) {
  if (scene === 'hub' && state === 'hub' && t - MINI.t > 90) { MINI.t = t; drawMini(); }
  requestAnimationFrame(miniLoop);
}
requestAnimationFrame(miniLoop);
