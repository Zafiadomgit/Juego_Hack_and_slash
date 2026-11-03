/* Lumen studio — intro al abrir el juego (≈5 s, se salta tocando).
 * 1) partículas de luz que llegan en espiral al centro · 2) estallido: destello, onda y temblor
 * 3) emblema de llama dorada con rayos girando · 4) «LUMEN» se forja de izquierda a derecha con chispas
 * 5) «STUDIO», brillo final y fundido.
 */
(function () {
  'use strict';
  var root = document.getElementById('lumenSplash');
  if (!root) return;
  if (navigator.webdriver) { root.remove(); return; } // pruebas automáticas: sin intro
  var cv = document.createElement('canvas');
  root.appendChild(cv);
  var g = cv.getContext('2d'), W = 0, H = 0, D = 1, S = 1;
  // en algunos móviles el WebView mide 0 en el primer instante: se toma el tamaño de la pantalla y se recalcula cada fotograma
  function size() {
    var w = window.innerWidth || document.documentElement.clientWidth || screen.width || 800;
    var h = window.innerHeight || document.documentElement.clientHeight || screen.height || 400;
    D = Math.min(2, window.devicePixelRatio || 1);
    var nw = Math.round(w * D), nh = Math.round(h * D);
    if (nw !== cv.width || nh !== cv.height) { cv.width = nw; cv.height = nh; }
    W = cv.width; H = cv.height;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    S = Math.min(W, H) / 400;
  }
  size(); addEventListener('resize', size);
  // reloj propio: avanza fotograma a fotograma (máx. 1/30 s). Si el móvil se atasca cargando el juego,
  // la intro se pausa en vez de «consumirse» sin que se vea (era el fallo en Android).
  var T = 0, last = 0, END = 5.0, done = false;
  var cx = function () { return W / 2; }, cy = function () { return H * 0.36; };
  // partículas que convergen
  var P = [];
  for (var i = 0; i < 170; i++) P.push({ a: Math.random() * 6.283, r: 0.75 + Math.random() * 0.6, s: 0.6 + Math.random() * 0.8, d: Math.random() * 0.5, w: 0.8 + Math.random() * 2.2 });
  // chispas sueltas (estallido y forja)
  var K = [];
  function spark(x, y, n, sp, col) {
    for (var j = 0; j < n; j++) { var a = Math.random() * 6.283, v = sp * (0.3 + Math.random()); K.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.2, l: 0.5 + Math.random() * 0.7, m: 1.2, c: col || '255,226,160' }); }
  }
  var burst = false, forged = 0;
  // emblema pintado (SpriteCook, estilo del juego): farol dorado con la llama animada en 8 fotogramas
  var FAROL = new Image(), farolOk = false;
  FAROL.onload = function () { farolOk = true; };
  FAROL.src = 'img/ui/lumen_farol.webp';
  var ease = function (x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); };

  function flame(x, y, h, a) {
    // llama estilizada: gota con lengua interior
    g.save(); g.translate(x, y); g.globalAlpha = a;
    var gr = g.createLinearGradient(0, -h, 0, h * 0.4);
    gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.35, '#ffd76a'); gr.addColorStop(0.8, '#e08a1e'); gr.addColorStop(1, '#8a3a0a');
    g.shadowColor = 'rgba(255,190,90,0.9)'; g.shadowBlur = 30 * S;
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, -h);
    g.bezierCurveTo(h * 0.55, -h * 0.35, h * 0.5, h * 0.25, 0, h * 0.4);
    g.bezierCurveTo(-h * 0.5, h * 0.25, -h * 0.55, -h * 0.35, 0, -h);
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,240,0.95)';
    g.beginPath();
    g.moveTo(0, -h * 0.35);
    g.bezierCurveTo(h * 0.22, -h * 0.05, h * 0.2, h * 0.22, 0, h * 0.3);
    g.bezierCurveTo(-h * 0.2, h * 0.22, -h * 0.22, -h * 0.05, 0, -h * 0.35);
    g.fill();
    // aro del farol
    g.strokeStyle = 'rgba(255,214,140,0.85)'; g.lineWidth = 2.2 * S;
    g.beginPath(); g.ellipse(0, h * 0.05, h * 0.78, h * 0.78, 0, 0, 6.283); g.stroke();
    g.strokeStyle = 'rgba(255,214,140,0.35)'; g.lineWidth = 1 * S;
    g.beginPath(); g.ellipse(0, h * 0.05, h * 0.92, h * 0.92, 0, 0, 6.283); g.stroke();
    g.restore();
  }

  // ---------- rótulo «LUMEN» de oro antiguo ----------
  // Cinzel Decorative (romana clásica con remates), oro con bisel, borde de bronce oscuro, pátina de desgaste y
  // filetes ornamentales. Todo se pinta UNA vez: cada fotograma solo copia la imagen (nada de shadowBlur en vivo).
  var WM = null;
  function cv2(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); c.g = c.getContext('2d'); return c; }
  function wordmark() {
    var fok = !document.fonts || !document.fonts.check || document.fonts.check('900 40px "Cinzel Decorative"');
    if (WM && WM.S === S && (WM.fok || !fok)) return WM; // se rehace si cambia la pantalla o acaba de llegar la fuente
    var fs = Math.round(66 * S), word = 'LUMEN', font = '900 ' + fs + 'px "Cinzel Decorative", Cinzel, Georgia, serif';
    var m = cv2(10, 10).g; m.font = font; var sp = fs * 0.16;
    var widths = word.split('').map(function (ch) { return m.measureText(ch).width; });
    var tw = widths.reduce(function (a, b) { return a + b; }, 0) + sp * (word.length - 1);
    var pad = 24 * S, c = cv2(tw + pad * 2, fs * 1.7), g2 = c.g, mid = c.height / 2;
    function letters(fn) { var x = pad; for (var i = 0; i < word.length; i++) { fn(word[i], x + widths[i] / 2); x += widths[i] + sp; } }
    g2.font = font; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
    // 1) sombra de relieve hacia abajo y borde de bronce envejecido
    g2.fillStyle = '#1c0e05'; letters(function (ch, x) { g2.fillText(ch, x + 2 * S, mid + 4 * S); });
    g2.strokeStyle = '#2e1a0a'; g2.lineWidth = 7 * S; letters(function (ch, x) { g2.strokeText(ch, x, mid); });
    g2.strokeStyle = '#7a5022'; g2.lineWidth = 3.2 * S; letters(function (ch, x) { g2.strokeText(ch, x, mid); });
    // 2) oro con bisel: claro arriba, bronce en el centro, reflejo cálido abajo
    var gr = g2.createLinearGradient(0, mid - fs * 0.5, 0, mid + fs * 0.5);
    gr.addColorStop(0, '#fff3c8'); gr.addColorStop(0.28, '#f1c96a'); gr.addColorStop(0.5, '#a8701f'); gr.addColorStop(0.62, '#d9a447'); gr.addColorStop(1, '#f6dc94');
    g2.fillStyle = gr; letters(function (ch, x) { g2.fillText(ch, x, mid); });
    // máscara del oro (para la pátina y el brillo final)
    var mask = cv2(c.width, c.height); mask.g.font = font; mask.g.textAlign = 'center'; mask.g.textBaseline = 'middle';
    mask.g.fillStyle = '#fff'; (function () { var x = pad; for (var i = 0; i < word.length; i++) { mask.g.fillText(word[i], x + widths[i] / 2, mid); x += widths[i] + sp; } })();
    // 3) pátina: motas de desgaste y vetas oscuras solo dentro de las letras (semilla fija: siempre igual)
    var pat = cv2(c.width, c.height), sd = 1337, rnd = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    for (var k = 0; k < c.width * c.height / (90 * S * S); k++) { pat.g.fillStyle = 'rgba(60,32,8,' + (0.12 + rnd() * 0.28) + ')'; var r0 = (0.6 + rnd() * 1.6) * S; pat.g.fillRect(rnd() * c.width, rnd() * c.height, r0, r0); }
    pat.g.strokeStyle = 'rgba(70,40,12,0.25)'; pat.g.lineWidth = 0.8 * S;
    for (var v = 0; v < 18; v++) { var vx = rnd() * c.width, vy = rnd() * c.height; pat.g.beginPath(); pat.g.moveTo(vx, vy); pat.g.lineTo(vx + (rnd() - 0.5) * 30 * S, vy + (rnd() - 0.5) * 12 * S); pat.g.stroke(); }
    pat.g.globalCompositeOperation = 'destination-in'; pat.g.drawImage(mask, 0, 0);
    g2.drawImage(pat, 0, 0);
    // 4) filo de luz en la parte alta de cada letra (bisel)
    g2.save(); g2.globalCompositeOperation = 'source-atop'; g2.strokeStyle = 'rgba(255,248,215,0.55)'; g2.lineWidth = 1.2 * S;
    letters(function (ch, x) { g2.strokeText(ch, x, mid - 1.5 * S); }); g2.restore();
    // halo: el rótulo desenfocado una sola vez
    var glow = cv2(c.width + 60 * S, c.height + 60 * S);
    glow.g.filter = 'blur(' + Math.round(14 * S) + 'px)'; glow.g.drawImage(mask, 30 * S, 30 * S); glow.g.filter = 'none';
    glow.g.globalCompositeOperation = 'source-in'; glow.g.fillStyle = 'rgba(255,170,70,0.9)'; glow.g.fillRect(0, 0, glow.width, glow.height);
    // STUDIO con filetes y rombos
    var sfs = Math.round(15 * S), st = cv2(tw + pad * 2, sfs * 2.4), sg = st.g, smid = st.height / 2;
    sg.font = '700 ' + sfs + 'px "Cinzel Decorative", Cinzel, Georgia, serif'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
    var label = 'S T U D I O', lwid = sg.measureText(label).width;
    sg.fillStyle = '#2a1708'; sg.fillText(label, st.width / 2 + S, smid + S);
    sg.fillStyle = '#d6b06a'; sg.fillText(label, st.width / 2, smid);
    sg.strokeStyle = '#b48a46'; sg.lineWidth = 1.2 * S; sg.fillStyle = '#e6c27a';
    [-1, 1].forEach(function (d2) {
      var x1 = st.width / 2 + d2 * (lwid / 2 + 10 * S), x2 = st.width / 2 + d2 * (tw / 2);
      sg.beginPath(); sg.moveTo(x1, smid); sg.lineTo(x2, smid); sg.stroke();
      sg.beginPath(); sg.moveTo(x2 - d2 * 6 * S, smid - 3 * S); sg.lineTo(x2 - d2 * 2 * S, smid); sg.lineTo(x2 - d2 * 6 * S, smid + 3 * S); sg.stroke();
      [x1 + d2 * 4 * S, (x1 + x2) / 2].forEach(function (rx) { sg.beginPath(); sg.moveTo(rx, smid - 3.5 * S); sg.lineTo(rx + 3.5 * S, smid); sg.lineTo(rx, smid + 3.5 * S); sg.lineTo(rx - 3.5 * S, smid); sg.closePath(); sg.fill(); });
    });
    WM = { S: S, fok: fok, c: c, mask: mask, glow: glow, studio: st, shine: cv2(c.width, c.height), tw: tw, fs: fs, h: c.height };
    return WM;
  }

  function frame(now) {
    if (done) return;
    size();
    T += Math.min(1 / 30, Math.max(0, (now - last) / 1000)); last = now;
    var t = T;
    if (t >= END) { finish(); return; }
    var x0 = cx(), y0 = cy();
    g.setTransform(1, 0, 0, 1, 0, 0);
    // temblor tras el estallido
    var sh = burst ? Math.max(0, 1 - (t - 1.25) / 0.45) * 7 * S : 0;
    g.fillStyle = '#040408'; g.fillRect(0, 0, W, H);
    g.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    g.globalCompositeOperation = 'lighter';

    // 1) convergencia (0 → 1.25 s)
    if (t < 1.35) {
      for (var i = 0; i < P.length; i++) {
        var p = P[i], k = ease((t - p.d * 0.6) / (1.2 - p.d * 0.6));
        if (k <= 0) continue;
        var rr = (1 - k) * p.r * Math.max(W, H) * 0.6, a = p.a + k * 2.6 * p.s;
        var x = x0 + Math.cos(a) * rr, y = y0 + Math.sin(a) * rr * 0.8;
        var x2 = x0 + Math.cos(a - 0.12) * (rr + 30 * S), y2 = y0 + Math.sin(a - 0.12) * (rr + 30 * S) * 0.8;
        g.strokeStyle = 'rgba(255,214,140,' + (0.25 + 0.6 * k) + ')'; g.lineWidth = p.w * D;
        g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke();
      }
      // núcleo que crece
      var core = ease(t / 1.25) * 26 * S;
      var cg = g.createRadialGradient(x0, y0, 0, x0, y0, core * 3);
      cg.addColorStop(0, 'rgba(255,255,240,0.95)'); cg.addColorStop(0.3, 'rgba(255,214,140,0.6)'); cg.addColorStop(1, 'rgba(255,170,80,0)');
      g.fillStyle = cg; g.fillRect(x0 - core * 3, y0 - core * 3, core * 6, core * 6);
    }
    // 2) estallido (1.25 s)
    if (t >= 1.25 && !burst) { burst = true; spark(x0, y0, 90, 260 * S); }
    if (burst) {
      var bt = t - 1.25;
      // onda
      if (bt < 0.9) {
        g.strokeStyle = 'rgba(255,240,200,' + (1 - bt / 0.9) * 0.9 + ')'; g.lineWidth = (10 - bt * 9) * S;
        g.beginPath(); g.arc(x0, y0, ease(bt / 0.9) * Math.max(W, H) * 0.7, 0, 6.283); g.stroke();
      }
      // rayos girando detrás del emblema
      var ra = Math.min(1, bt / 0.6) * (t > END - 0.7 ? (END - t) / 0.7 : 1);
      g.save(); g.translate(x0, y0); g.rotate(t * 0.25);
      for (var j = 0; j < 14; j++) {
        g.rotate(6.283 / 14);
        var L = (190 + 40 * Math.sin(t * 2 + j)) * S;
        var rg = g.createLinearGradient(0, 0, L, 0);
        rg.addColorStop(0, 'rgba(255,214,140,' + 0.32 * ra + ')'); rg.addColorStop(1, 'rgba(255,214,140,0)');
        g.fillStyle = rg; g.beginPath(); g.moveTo(0, 0); g.lineTo(L, -9 * S); g.lineTo(L, 9 * S); g.closePath(); g.fill();
      }
      g.restore();
      // halo
      var hg = g.createRadialGradient(x0, y0, 0, x0, y0, 150 * S);
      hg.addColorStop(0, 'rgba(255,200,110,' + 0.35 * ra + ')'); hg.addColorStop(1, 'rgba(255,170,80,0)');
      g.fillStyle = hg; g.fillRect(x0 - 150 * S, y0 - 150 * S, 300 * S, 300 * S);
    }
    g.globalCompositeOperation = 'source-over';
    // 3) emblema
    if (burst) {
      var ea = ease((t - 1.3) / 0.5), fl = 1 + Math.sin(t * 9) * 0.03 + Math.sin(t * 23) * 0.02;
      if (farolOk) {
        // el farol aparece creciendo con un pequeño rebote y su llama late a 10 fps
        var fi = Math.floor(t * 10) % 8, fh = 150 * S * (0.6 + 0.4 * ea) * (ea < 1 ? 1 + Math.sin(ea * 3.14) * 0.12 : 1);
        g.save(); g.globalAlpha = ea; g.imageSmoothingEnabled = false;
        g.drawImage(FAROL, fi * 256, 0, 256, 256, x0 - fh / 2, y0 - fh * 0.56, fh, fh);
        g.restore();
      } else flame(x0, y0, 46 * S * (0.6 + 0.4 * ea) * fl, ea);
    }
    // 4) LUMEN forjado (2.0 → 3.0 s): rótulo de oro antiguo grabado, pintado una vez en caché (wordmark)
    var ty = y0 + 112 * S, M = wordmark();
    if (t > 1.9) {
      var rev = ease((t - 1.95) / 1.0), tw = M.tw, xl = x0 - tw / 2, xr = xl + tw * rev;
      g.save();
      g.beginPath(); g.rect(xl - 30 * S, ty - M.h, (xr - xl) + 30 * S, M.h * 2); g.clip();
      // halo cálido (horneado con desenfoque una sola vez) y el rótulo encima
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 + Math.sin(t * 3) * 0.08;
      g.drawImage(M.glow, x0 - M.glow.width / 2, ty - M.glow.height / 2);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.drawImage(M.c, x0 - M.c.width / 2, ty - M.c.height / 2);
      // brillo que recorre las letras al final (solo sobre el oro: se recorta con la máscara del rótulo)
      if (t > 3.3 && t < 4.3) {
        var sx = ((t - 3.3) / 0.9) * (M.c.width + 80 * S) - 40 * S;
        var sh2 = M.shine; sh2.g.clearRect(0, 0, sh2.width, sh2.height);
        sh2.g.globalCompositeOperation = 'source-over'; sh2.g.drawImage(M.mask, 0, 0);
        sh2.g.globalCompositeOperation = 'source-in';
        var sg = sh2.g.createLinearGradient(sx - 40 * S, 0, sx + 40 * S, 0);
        sg.addColorStop(0, 'rgba(255,250,225,0)'); sg.addColorStop(0.5, 'rgba(255,250,225,0.8)'); sg.addColorStop(1, 'rgba(255,250,225,0)');
        sh2.g.fillStyle = sg; sh2.g.fillRect(0, 0, sh2.width, sh2.height);
        g.globalCompositeOperation = 'lighter'; g.drawImage(sh2, x0 - sh2.width / 2, ty - sh2.height / 2); g.globalCompositeOperation = 'source-over';
      }
      g.restore();
      // chispas en el borde que se forja
      if (rev < 1 && Math.random() < 0.9) spark(xr, ty + (Math.random() - 0.5) * M.fs * 0.8, 3, 90 * S, '255,214,140');
      if (rev >= 1 && !forged) { forged = 1; spark(x0, ty, 30, 140 * S); }
      // STUDIO, entre dos filetes con rombos (también en caché)
      var sa = ease((t - 3.0) / 0.6);
      if (sa > 0) {
        g.globalAlpha = sa;
        g.drawImage(M.studio, x0 - M.studio.width / 2, ty + M.fs * 0.9 - M.studio.height / 2);
        g.globalAlpha = 1;
      }
    }
    // chispas
    g.globalCompositeOperation = 'lighter';
    var dt = 1 / 60;
    for (var q = K.length - 1; q >= 0; q--) {
      var s2 = K[q]; s2.l -= dt; if (s2.l <= 0) { K.splice(q, 1); continue; }
      s2.x += s2.vx * dt; s2.y += s2.vy * dt; s2.vy += 120 * S * dt; s2.vx *= 0.985;
      g.fillStyle = 'rgba(' + s2.c + ',' + Math.min(1, s2.l * 1.6) + ')';
      g.fillRect(s2.x, s2.y, 2.2 * D, 2.2 * D);
    }
    g.globalCompositeOperation = 'source-over';
    // destello blanco del estallido
    if (burst && t - 1.25 < 0.35) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(255,250,235,' + (1 - (t - 1.25) / 0.35) * 0.85 + ')'; g.fillRect(0, 0, W, H); }
    // fundido final
    if (t > END - 0.6) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(4,4,8,' + (t - (END - 0.6)) / 0.6 + ')'; g.fillRect(0, 0, W, H); }
    requestAnimationFrame(frame);
  }
  function finish() {
    if (done) return;
    done = true;
    root.classList.add('out');
    setTimeout(function () { root.remove(); }, 700);
  }
  root.addEventListener('click', finish);
  root.addEventListener('touchstart', finish, { passive: true });
  // espera breve a la fuente (si tarda, se usa la de reserva)
  // arranca cuando el juego ya terminó de cargar sus scripts (hasta entonces, pantalla negra)
  var go = function () { requestAnimationFrame(function (n) { last = n; frame(n); }); };
  var ready = function () {
    if (document.fonts && document.fonts.load) Promise.race([Promise.all([document.fonts.load('900 40px Cinzel'), document.fonts.load('900 40px "Cinzel Decorative"'), document.fonts.load('700 15px "Cinzel Decorative"')]), new Promise(function (r) { setTimeout(r, 900); })]).then(go, go);
    else go();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(ready, 60); });
  else ready();
  // red de seguridad: si algo falla, la pantalla negra nunca tapa el juego más de 12 s
  setTimeout(finish, 12000);
})();
