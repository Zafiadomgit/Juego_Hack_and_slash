// Fendaria — simulador de la curva de poder.
// Uso:  node tools/balance/simular.js            (necesita Google Chrome o Microsoft Edge instalados)
//       CHROME="ruta/al/navegador" node tools/balance/simular.js
// Abre el juego (www/) en un navegador sin ventana, ejecuta sim_page.js con las funciones reales del juego
// y escribe la tabla en la consola y en tools/balance/resultado.md.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '../..'), WWW = path.join(ROOT, 'www');
const PORT = 8790, DBG = 9340;
const CANDIDATES = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const CHROME = CANDIDATES.find((c) => c && fs.existsSync(c));
if (!CHROME) { console.error('No encuentro Chrome ni Edge. Indica la ruta: CHROME="..." node tools/balance/simular.js'); process.exit(1); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(WWW, p);
  if (!f.startsWith(WWW)) { r.writeHead(403); r.end(); return; }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(PORT);

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'fendaria-sim-'));
const browser = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + DBG, '--user-data-dir=' + prof, '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = (t) => new Promise((r) => setTimeout(r, t));
const done = (code) => { try { browser.kill(); } catch (e) { /* ya cerrado */ } server.close(); process.exit(code); };

(async () => {
  let tabs = [];
  for (let i = 0; i < 60 && !tabs.length; i++) { try { tabs = (await (await fetch(`http://127.0.0.1:${DBG}/json`)).json()).filter((t) => t.type === 'page'); } catch (e) { /* aún arrancando */ } await sleep(250); }
  if (!tabs.length) { console.error('El navegador no arrancó'); done(1); }
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  let id = 0; const wait = {}; const errs = [];
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; wait[i] = res; ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && wait[d.id]) { wait[d.id](d.result); delete wait[d.id]; }
    if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
  };
  await new Promise((r) => (ws.onopen = r));
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await sleep(6000);
  const res = await send('Runtime.evaluate', { expression: fs.readFileSync(path.join(__dirname, 'sim_page.js'), 'utf8'), awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails || !res.result || !Array.isArray(res.result.value)) {
    console.error('Error en la simulación:', JSON.stringify(res.exceptionDetails || res).slice(0, 800), errs.join('\n'));
    done(1);
  }
  const rows = res.result.value;
  const head = '| Grieta | Nivel | k justo | k normal | k fuerte (máx.) | Golpes justo: antes → ahora | Normal | Fuerte |\n|---|---|---|---|---|---|---|---|';
  const body = rows.map((r) => `| ${r.grieta} | ${r.nivel} | ${r.justo} | ${r.normal} | ${r.fuerte} (${r.fuerteMax}) | ${r.justoAntes} → ${r.justoAhora} | ${r.normalAntes} → ${r.normalAhora} | ${r.fuerteAntes} → ${r.fuerteAhora} |`).join('\n');
  const md = `# Curva de poder (k = golpe real / golpe de referencia)\n\nMediana de las 7 clases; entre paréntesis, la clase más fuerte.\n` +
    `Perfiles: **justo** (Raro, sin refinar), **normal** (algo de Épico, refinado y Trascendencia poco a poco), **fuerte** (todo Épico, refina y forja mucho).\n` +
    `No incluye bendiciones, gemas ni conjuntos (son de cada partida o de suerte).\n` +
    `**Golpes**: cuántos golpes básicos aguanta un monstruo normal (Jabalí): antes, con la regla anterior de balance.js; ahora, con la banda de tolerancia.\n\n${head}\n${body}\n`;
  fs.writeFileSync(path.join(__dirname, 'resultado.md'), md);
  console.log(md);
  if (errs.length) console.log('Errores del juego durante la simulación:\n' + errs.join('\n'));
  done(0);
})();
