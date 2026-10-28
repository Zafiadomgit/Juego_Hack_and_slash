// Fendaria i18n — genera la versión inglesa: www/js/en/*.js y www/index_en.html.
// Solo cambia los textos (según tools/i18n/en/*.txt); el código es idéntico al español.
// Uso: node tools/i18n/build.js        (después de cambiar cualquier js con texto, vuelve a ejecutarlo)
'use strict';
const fs = require('fs'), path = require('path');
const { literals, loadDict, hash, htmlBits, JS, ROOT, SKIP } = require('./extract.js');
const NM = '/opt/node-tools/node_modules/';
const acorn = require(fs.existsSync(NM + 'acorn') ? NM + 'acorn' : 'acorn');

const dict = loadDict();
const OUT = path.join(JS, 'en');
let errors = 0, used = 0;

function translateFile(f) {
  const code = fs.readFileSync(path.join(JS, f), 'utf8');
  const lits = literals(f).sort((a, b) => a.start - b.start || b.end - a.end);
  // devuelve el código de [s, e) con los literales de dentro traducidos
  function range(s, e) {
    let out = '', pos = s;
    for (let i = 0; i < lits.length; i++) {
      const l = lits[i];
      if (l.start < pos || l.end > e || l.start < s) continue;
      out += code.slice(pos, l.start) + lit(l);
      pos = l.end;
    }
    return out + code.slice(pos, e);
  }
  function lit(l) {
    const tr = dict.get(hash(l.src));
    if (!l.tpl) {
      if (tr == null) return l.src;
      used++;
      return JSON.stringify(tr);
    }
    const ex = l.tpl.expressions;
    const exT = ex.map((x) => range(x.start, x.end));
    if (tr == null) { // plantilla sin traducir: solo sus expresiones
      let o = '`';
      l.tpl.quasis.forEach((q, i) => { o += q.value.raw; if (i < ex.length) o += '${' + exT[i] + '}'; });
      return o + '`';
    }
    used++;
    const srcs = ex.map((x) => code.slice(x.start, x.end));
    let o = '`', i = 0;
    while (i < tr.length) {
      if (tr.startsWith('${', i)) {
        const k = srcs.findIndex((x) => tr.startsWith('${' + x + '}', i));
        if (k >= 0) { o += '${' + exT[k] + '}'; i += srcs[k].length + 3; continue; }
        // expresión nueva (p. ej. plural inglés): se copia tal cual hasta su llave de cierre
        let d = 0, j = i + 2;
        for (; j < tr.length; j++) { if (tr[j] === '{') d++; else if (tr[j] === '}') { if (!d) break; d--; } }
        o += tr.slice(i, j + 1); i = j + 1; continue;
      }
      if (tr[i] === '`') o += '\\`'; else o += tr[i];
      i++;
    }
    return o + '`';
  }
  const res = range(0, code.length);
  if (res === code) return false;
  try { acorn.parse(res, { ecmaVersion: 'latest', sourceType: 'script' }); }
  catch (e) {
    errors++;
    const ln = res.split('\n')[e.loc.line - 1];
    console.error(`✖ ${f}:${e.loc.line} ${e.message}\n   ${ln && ln.slice(0, 200)}`);
  }
  fs.writeFileSync(path.join(OUT, f), res);
  return true;
}

if (require.main === module) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));
  const files = fs.readdirSync(JS).filter((f) => f.endsWith('.js') && !SKIP.has(f));
  const changed = new Set(files.filter(translateFile));
  // html
  let html = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
  const bits = [...new Map(htmlBits(html).map((b) => [b.t, b])).values()].sort((a, b) => b.t.length - a.t.length);
  for (const b of bits) {
    const tr = dict.get(hash('html:' + b.t));
    if (tr == null) continue;
    used++;
    const re = b.t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.split('"' + b.t + '"').join('"' + tr + '"')
      .replace(new RegExp('>(\\s*)' + re + '(\\s*)<', 'g'), (m, a, c) => '>' + a + tr + c + '<');
  }
  html = html.replace('<html lang="es"', '<html lang="en"')
    .split('img/logo.png').join('img/logo_en.png')
    .replace(/<script src="js\/([\w]+\.js)"/g, (m, f) => (changed.has(f) ? `<script src="js/en/${f}"` : m));
  fs.writeFileSync(path.join(ROOT, 'www/index_en.html'), html);
  console.log(`${changed.size} ficheros traducidos · ${used} textos aplicados · ${errors} errores`);
  if (errors) process.exit(1);
}
