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
      flame(x0, y0, 46 * S * (0.6 + 0.4 * ea) * fl, ea);
    }
    // 4) LUMEN forjado (2.0 → 3.0 s)
    var ty = y0 + 112 * S, fs = Math.round(64 * S);
    if (t > 1.9) {
      g.font = '900 ' + fs + 'px Cinzel, Georgia, serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      var word = 'L U M E N', tw = g.measureText(word).width;
      var rev = ease((t - 1.95) / 1.0), xl = x0 - tw / 2, xr = xl + tw * rev;
      g.save();
      g.beginPath(); g.rect(xl - 10 * S, ty - fs, (xr - xl) + 10 * S, fs * 2); g.clip();
      var tg = g.createLinearGradient(0, ty - fs / 2, 0, ty + fs / 2);
      tg.addColorStop(0, '#fffbe8'); tg.addColorStop(0.45, '#ffd76a'); tg.addColorStop(0.55, '#c8892c'); tg.addColorStop(1, '#ffe6a0');
      g.shadowColor = 'rgba(255,190,90,0.7)'; g.shadowBlur = 18 * S;
      g.fillStyle = tg; g.fillText(word, x0, ty);
      g.shadowBlur = 0;
      // brillo que recorre las letras al final
      if (t > 3.3) {
        var sx = xl + ((t - 3.3) / 0.9) * (tw + 80 * S) - 40 * S;
        var sg = g.createLinearGradient(sx - 40 * S, 0, sx + 40 * S, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        g.globalCompositeOperation = 'lighter'; g.fillStyle = sg; g.fillText(word, x0, ty); // el brillo solo sobre las letras
        g.globalCompositeOperation = 'source-over';
      }
      g.restore();
      // chispas en el borde que se forja
      if (rev < 1 && Math.random() < 0.9) spark(xr, ty + (Math.random() - 0.5) * fs * 0.8, 3, 90 * S, '255,214,140');
      if (rev >= 1 && !forged) { forged = 1; spark(x0, ty, 30, 140 * S); }
      // STUDIO
      var sa = ease((t - 3.0) / 0.6);
      if (sa > 0) {
        g.globalAlpha = sa;
        g.font = '700 ' + Math.round(15 * S) + 'px Cinzel, Georgia, serif';
        g.fillStyle = '#c9a35a';
        g.fillText('S  T  U  D  I  O', x0, ty + fs * 0.85);
        g.strokeStyle = 'rgba(201,163,90,' + 0.6 * sa + ')'; g.lineWidth = 1 * S;
        var lw = tw * 0.32 * sa;
        g.beginPath(); g.moveTo(x0 - tw / 2, ty + fs * 0.85); g.lineTo(x0 - tw / 2 + lw, ty + fs * 0.85);
        g.moveTo(x0 + tw / 2, ty + fs * 0.85); g.lineTo(x0 + tw / 2 - lw, ty + fs * 0.85); g.stroke();
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
    if (document.fonts && document.fonts.load) Promise.race([document.fonts.load('900 40px Cinzel'), new Promise(function (r) { setTimeout(r, 400); })]).then(go, go);
    else go();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(ready, 60); });
  else ready();
  // red de seguridad: si algo falla, la pantalla negra nunca tapa el juego más de 12 s
  setTimeout(finish, 12000);
})();
