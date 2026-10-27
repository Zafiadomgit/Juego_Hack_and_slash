/* Uso: (servidor en www con python3 -m http.server 8765) THR=4 W=4 [WEAK=1] [LOCKQ=0] node tools/perf/bench.js
 * Mide FPS, llamadas de dibujo por fotograma, sus orígenes y el perfil de CPU en un combate cargado. */
// Banco de rendimiento: móvil simulado (CPU x4), combate cargado; FPS y perfil por función
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const THR = +(process.env.THR || 4), WORLD = +(process.env.W || 4), LOCKQ = process.env.LOCKQ !== '0';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  if (process.env.WEAK) await ctx.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 }); }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto('http://localhost:8765/index.html#test');
  await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(700);
  await p.click('#btnStart'); await p.waitForTimeout(1500);
  await p.evaluate(() => { if (typeof endCine === 'function') endCine(); S.tut = { done: 1 }; }); await p.waitForTimeout(600);
  await p.evaluate(([w, lock]) => {
    if (dlg) endDialog(); S.story.seen['enter' + w] = 1; S.story.seen.boons = 1; S.level = 20; recalc();
    startNode(w, 4, 0); window._iv = setInterval(() => { if (P) { P.invul = 1e9; P.hp = P.maxHp; } if (dlg) endDialog(); }, 200);
    if (lock) { window._ql = QUALITY.level; adaptQuality = function () {}; } // medir sin que la calidad baje sola
  }, [WORLD, LOCKQ]);
  await p.waitForTimeout(3500);
  // escena cargada: 80 enemigos alrededor y el héroe atacando con habilidades
  await p.evaluate(() => {
    rift.eventT = 999;
    const ks = Object.keys(rift.biome.weights);
    for (let i = 0; i < 80; i++) { const a = Math.random() * 6.28, r = 60 + Math.random() * 260; const e = spawnEnemy(ks[i % ks.length], P.x + Math.cos(a) * r, P.y + Math.sin(a) * r); e.spawnT = 0; }
    input.attack = true; window._sk = setInterval(() => { P.pa = 99; P.skillCd = [0, 0, 0]; useSkill(Math.floor(Math.random() * 3)); }, 700);
  });
  // cronómetro por capa
  await p.evaluate(() => {
    window._T = {};
    const wrap = (n) => { const f = window[n]; if (typeof f !== 'function') return; window[n] = function (...a) { const t = performance.now(); const r = f.apply(this, a); _T[n] = (_T[n] || 0) + performance.now() - t; return r; }; };
    ['drawEnemy', 'drawPlayer', 'drawProjectile', 'drawHUD', 'drawControls', 'renderLighting', 'drawDecals', 'drawRiftEvents', 'drawSlash', 'drawGhosts', 'drawPickup', 'drawParticles', 'drawVfx', 'drawTexts', 'renderRift', 'update', 'drawObstacle', 'drawCorpse', 'drawHazard', 'drawMinion', 'hd2dEndWorld'].forEach(wrap);
  });
  await p.evaluate(() => {
    window._C = {}; window._S = {}; const P2 = CanvasRenderingContext2D.prototype;
    for (const m of ['drawImage', 'fill', 'stroke', 'fillRect', 'fillText', 'strokeText', 'arc', 'createRadialGradient', 'createLinearGradient', 'save', 'restore', 'getImageData', 'ellipse']) {
      const f = P2[m]; P2[m] = function (...a) { _C[m] = (_C[m] || 0) + 1; if (Math.random() < 0.02) { const st = new Error().stack.split('\n').slice(2, 4).map(l => l.trim().replace(/^at /, '').replace(/\(?http:\/\/localhost:8765\/js\//, '').replace(/\)$/, '').replace(/:\d+$/, '')).join(' < '); const k = m + ' @ ' + st; _S[k] = (_S[k] || 0) + 1; } return f.apply(this, a); };
    }
    const d = Object.getOwnPropertyDescriptor(P2, 'globalCompositeOperation');
    Object.defineProperty(P2, 'globalCompositeOperation', { get() { return d.get.call(this); }, set(v) { _C.gco = (_C.gco || 0) + 1; if (Math.random() < 0.02) { const st = new Error().stack.split('\n').slice(2, 4).map(l => l.trim().replace(/^at /, '').replace(/\(?http:\/\/localhost:8765\/js\//, '').replace(/\)$/, '').replace(/:\d+$/, '')).join(' < '); const k = 'gco @ ' + st; _S[k] = (_S[k] || 0) + 1; } d.set.call(this, v); } });
    const c0 = document.createElement.bind(document);
    document.createElement = (t) => { if (t === 'canvas') _C.newCanvas = (_C.newCanvas || 0) + 1; return c0(t); };
  });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  await p.waitForTimeout(1500);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
  const fps = await p.evaluate(() => new Promise((res) => {
    const ts = []; let t0 = performance.now();
    function f(t) { ts.push(t); if (t - t0 < 6000) requestAnimationFrame(f); else {
      const d = ts.slice(1).map((x, i) => x - ts[i]); d.sort((a, b) => a - b);
      res({ fps: +(1000 * (ts.length - 1) / (ts[ts.length - 1] - ts[0])).toFixed(1), p50: +d[Math.floor(d.length * 0.5)].toFixed(1), p95: +d[Math.floor(d.length * 0.95)].toFixed(1), enemies: enemies.filter(e => !e.dead).length, particles: particles.length, q: QUALITY.level, dpr: DPR, hd2d: HD2D.active });
    } }
    requestAnimationFrame(f);
  }));
  const { profile } = await cdp.send('Profiler.stop');
  console.log('llamadas/frame:', await p.evaluate((n) => Object.entries(_C).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + Math.round(v / n)).join(' | '), Math.max(1, Math.round(fps.fps * 6))));
  console.log(await p.evaluate(() => Object.entries(_S).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => String(v).padStart(5) + ' ' + k).join('\n')));
  console.log('capas ms/frame:', await p.evaluate((n) => Object.entries(_T).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + (v / n).toFixed(1)).join(' | '), Math.max(1, Math.round(fps.fps * 6))));
  // tiempo propio por función
  const self = {}, total = profile.samples.length; const byId = {};
  for (const n of profile.nodes) byId[n.id] = n;
  const cnt = {}; for (const s of profile.samples) cnt[s] = (cnt[s] || 0) + 1;
  for (const [id, c] of Object.entries(cnt)) { const n = byId[id]; const k = (n.callFrame.functionName || '(anon)') + ' ' + (n.callFrame.url.split('/').pop() || '') + ':' + (n.callFrame.lineNumber + 1); self[k] = (self[k] || 0) + c; }
  const top = Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 22)).map(([k, c]) => (100 * c / total).toFixed(1).padStart(5) + '%  ' + k);
  console.log(JSON.stringify(fps)); console.log(top.join('\n'));
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS');
  await b.close();
})();
