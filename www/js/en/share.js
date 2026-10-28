/* Fendaria — compartir el resultado de una Grieta como imagen (1080×1080).
 * Botón «Compartir» en las pantallas de Grieta cerrada y de caída. La imagen lleva el mundo de fondo, el logo,
 * el héroe, el resultado (Grieta, Tormento, Grieta del Día, expedición), sus cifras y las bendiciones.
 * En la app se comparte con el menú del sistema (plugins Share y Filesystem de Capacitor); en el navegador,
 * con navigator.share si admite archivos o, si no, se descarga.
 */
'use strict';

const SHARE_SIZE = 1080;
const shareImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

// datos del resultado, leídos de la Grieta que acaba de terminar
function shareData(won) {
  const r = rift, C = CLASSES[S.cls];
  const d = { won, hero: C.name, lvl: S.level, cls: S.cls, world: r.biome, rows: [], boons: [] };
  if (r.daily) {
    d.title = won ? "Daily Rift cleared" : "Daily Rift";
    d.big = fmtNum(r.daily.final || (typeof dailyScore === 'function' ? dailyScore() : 0)) + ' pts';
  } else if (r.isDungeon) {
    d.title = won ? `Dungeon · Floor ${r.tier} cleared` : `Dungeon · Floor ${r.tier}`;
  } else if (r.isSuper) {
    d.title = won ? `${SUPER_BOSSES[r.biome.id].name.split(',')[0]} defeated!` : `Super Boss · ${SUPER_BOSSES[r.biome.id].name.split(',')[0]}`;
  } else d.title = won ? `Rift ${r.n} closed` : `Fell in Rift ${r.n}`;
  if (r.torment) d.badge = '☠ ' + tormentName(r.torment);
  if (r.run) d.rows.push(["Expedition", `${r.run.depth + 1} Rifts`]);
  d.rows.push(["Time", fmtTime(r.elapsed)], ["Monsters", fmtNum((r.run ? r.run.kills : 0) + r.kills)]);
  if (r.legendaries) d.rows.push(["Legendaries", r.legendaries]);
  try { d.rows.push(["Power", fmtNum(powerScore(derived()))]); } catch (e) { /* sin poder */ }
  const b = r.bn;
  if (b && b.owned) d.boons = Object.entries(b.owned).map(([id, o]) => ({ id, god: BOONS[id].god, name: BOONS[id].name, r: o.r })).slice(0, 8);
  return d;
}

async function shareCanvas(d) {
  const N = SHARE_SIZE, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const en = document.documentElement.lang === 'en';
  const [bg, logo, hero] = await Promise.all([
    shareImg(`img/worlds/art_${d.world.id}.webp`), shareImg(en ? 'img/logo_en.png' : 'img/logo.png'), shareImg(`img/heroes/px/${d.cls}.png`),
  ]);
  const gods = await Promise.all(d.boons.map((o) => shareImg(`img/gods/${o.god}.webp`)));
  // fondo: el mundo, oscurecido hacia abajo
  g.fillStyle = '#0a0812'; g.fillRect(0, 0, N, N);
  if (bg) { const k = Math.max(N / bg.width, N / bg.height); g.drawImage(bg, (N - bg.width * k) / 2, (N - bg.height * k) / 2, bg.width * k, bg.height * k); }
  let gr = g.createLinearGradient(0, 0, 0, N);
  gr.addColorStop(0, 'rgba(6,4,14,0.55)'); gr.addColorStop(0.45, 'rgba(6,4,14,0.35)'); gr.addColorStop(1, 'rgba(6,4,14,0.92)');
  g.fillStyle = gr; g.fillRect(0, 0, N, N);
  // marco
  g.strokeStyle = d.badge ? '#d36bff' : '#ecd18a'; g.lineWidth = 6; g.strokeRect(18, 18, N - 36, N - 36);
  g.strokeStyle = 'rgba(236,209,138,0.35)'; g.lineWidth = 2; g.strokeRect(32, 32, N - 64, N - 64);
  // logo
  if (logo) { const w = 520, h = logo.height * (w / logo.width); g.drawImage(logo, (N - w) / 2, 40, w, h); }
  // héroe (pixel art nítido) con halo
  const hx = 300, hy = 880;
  gr = g.createRadialGradient(hx, hy - 260, 20, hx, hy - 260, 330);
  gr.addColorStop(0, d.badge ? 'rgba(211,107,255,0.45)' : 'rgba(255,200,120,0.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 300, 640, 700);
  if (hero) {
    const h = 600, w = hero.width * (h / hero.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(hero, hx - w / 2, hy - h, w, h);
    g.imageSmoothingEnabled = true;
  }
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(hx, hy + 6, 150, 26, 0, 0, Math.PI * 2); g.fill();
  const txt = (s, x, y, font, col, al = 'left') => {
    g.font = font; g.textAlign = al; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(8,5,16,0.95)'; g.lineWidth = 8; g.strokeText(s, x, y);
    g.fillStyle = col; g.fillText(s, x, y);
  };
  txt(`${d.hero} · Lv. ${d.lvl}`, hx, hy + 70, '700 38px Cinzel, serif', '#f6ecd2', 'center');
  // resultado
  const X = 600;
  let y = 330;
  if (d.badge) { txt(d.badge, X, y, '900 40px Cinzel, serif', '#e6b8ff'); y += 62; }
  const title = d.title;
  g.font = '900 50px Cinzel, serif';
  const words = title.split(' '); let line = '', lines = [];
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > 440 && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line);
  for (const l of lines) { txt(l, X, y, '900 50px Cinzel, serif', d.won ? '#ffd76a' : '#ff8a7a'); y += 60; }
  if (d.big) { y += 10; txt(d.big, X, y + 30, '900 72px Cinzel, serif', '#ffffff'); y += 100; }
  y += 14;
  for (const [k, v] of d.rows) {
    txt(k, X, y, '700 30px Garamond, Georgia, serif', '#cdb58a');
    txt(String(v), N - 70, y, '800 32px Garamond, Georgia, serif', '#ffffff', 'right');
    y += 46;
  }
  // bendiciones
  if (d.boons.length) {
    y = Math.max(y + 10, 760);
    txt("Blessings", X, y, '700 26px Cinzel, serif', '#ecd18a');
    y += 18;
    d.boons.forEach((o, i) => {
      const s = 84, bx = X + (i % 4) * (s + 14), by = y + Math.floor(i / 4) * (s + 14);
      const R = BOON_RARITY[o.r] || {};
      g.save(); g.beginPath(); g.arc(bx + s / 2, by + s / 2, s / 2, 0, Math.PI * 2); g.clip();
      if (gods[i]) g.drawImage(gods[i], bx, by, s, s); else { g.fillStyle = GODS[o.god].color; g.fillRect(bx, by, s, s); }
      g.restore();
      g.strokeStyle = R.color || GODS[o.god].color; g.lineWidth = 5; g.beginPath(); g.arc(bx + s / 2, by + s / 2, s / 2 - 2, 0, Math.PI * 2); g.stroke();
    });
  }
  // pie
  txt("Can you beat it? · Fendaria on Google Play", N / 2, N - 52, '700 30px Cinzel, serif', '#ecd18a', 'center');
  return c;
}

async function shareResult(won) {
  if (!S || !rift) return;
  const btns = document.querySelectorAll('.btn-share');
  btns.forEach((b) => { b.disabled = true; });
  try {
    const d = shareData(won), c = await shareCanvas(d);
    const text = "My result in Fendaria: " + d.title + (d.big ? ' · ' + d.big : '');
    const dataUrl = c.toDataURL('image/png');
    const cap = window.Capacitor, P2 = cap && cap.Plugins;
    if (cap && cap.isNativePlatform && cap.isNativePlatform() && P2 && P2.Share && P2.Filesystem) {
      const f = await P2.Filesystem.writeFile({ path: 'fendaria_resultado.png', data: dataUrl.split(',')[1], directory: 'CACHE' });
      await P2.Share.share({ title: 'Fendaria', text, files: [f.uri], dialogTitle: 'Fendaria' });
    } else {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'fendaria_resultado.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text, title: 'Fendaria' });
      else { const a = document.createElement('a'); a.href = dataUrl; a.download = 'fendaria_resultado.png'; document.body.appendChild(a); a.click(); a.remove(); }
    }
  } catch (e) {
    if (!(e && /cancel/i.test(String(e.message || e)))) console.warn('share', e);
  } finally { btns.forEach((b) => { b.disabled = false; }); }
}

// botones en las pantallas de final y de caída
$('btnEndHub').insertAdjacentHTML('beforebegin', "<button id=\"btnShareEnd\" class=\"btn btn-share\" type=\"button\">📤 Share result</button>");
$('btnDeadHub').insertAdjacentHTML('beforebegin', "<button id=\"btnShareDead\" class=\"btn btn-share\" type=\"button\">📤 Share result</button>");
$('btnShareEnd').addEventListener('click', () => { SFX.play('click'); shareResult(true); });
$('btnShareDead').addEventListener('click', () => { SFX.play('click'); shareResult(false); });
