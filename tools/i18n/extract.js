// Fendaria i18n — lista los literales de texto (strings y plantillas) de www/js que parecen texto visible.
// Uso: node tools/i18n/extract.js  → escribe tools/i18n/strings.json  ({ file, src } por literal, sin repetidos)
'use strict';
const fs = require('fs'), path = require('path');
const NM = '/opt/node-tools/node_modules/';
const acorn = require(fs.existsSync(NM + 'acorn') ? NM + 'acorn' : 'acorn');
const walk = require(fs.existsSync(NM + 'acorn-walk') ? NM + 'acorn-walk' : 'acorn-walk');

const ROOT = path.join(__dirname, '../..');
const JS = path.join(ROOT, 'www/js');
const SKIP = new Set(['anim_data.js', 'mon_data.js', 'vfx_data.js', 'props_data.js', 'i18n.js']);

// ¿parece texto para el jugador? (descarta ids, claves, colores, css, rutas…)
function looksText(s) {
  const attrs = []; s.replace(/\b(?:title|alt|placeholder|aria-label)="([^"]*)"/g, (m, v) => attrs.push(v));
  const t = (s.replace(/\$\{[^}]*\}/g, ' ').replace(/<[^>]+>/g, ' ') + ' ' + attrs.join(' ').replace(/\$\{[^}]*\}/g, ' ')).replace(/&[a-z]+;/g, ' ').trim();
  if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}/.test(t)) return false;
  if (/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|url\(|data:|img\/|video\/|https?:)/i.test(t)) return false;
  if (/^[\w.\/-]+\.(png|webp|webm|jpg|mp3|ogg|json|js|css)$/.test(t)) return false;
  if (/^(bold |italic |[\d.]+px )/.test(t) && !/[áéíóúñ¡¿]/i.test(t)) return false;   // fuente css
  if (/^[\w-]+(\s*:\s*[^;]+;?)+$/.test(t) && /;|:\s*\d/.test(t)) return false;        // css en línea
  if (/(serif|monospace|px|^[.#[][\w-]|\bbutton$|^(left|right|top|bottom|Escape|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Space|Shift|Tab)\b)/.test(t) && !/[áéíóúñ¡¿]/i.test(t)) return false;   // css, selectores, teclas
  if (/[áéíóúñÁÉÍÓÚÑ¡¿…·✔⚔]/.test(t)) return true;
  if (/\s/.test(t)) return /[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(t) || /^[A-ZÁÉÍÓÚ]/.test(t) || /[a-z]{3,}/.test(t) && !/[=\[\]{}|>]/.test(t);
  return /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+[.:]?$/.test(t) || /^[A-Z][a-z]+(\s|$)/.test(t);  // palabra con mayúscula (nombres, títulos)
}

function literals(file) {
  const code = fs.readFileSync(path.join(JS, file), 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  const out = [];
  walk.fullAncestor(ast, (n, _st, anc) => {
    const par = anc[anc.length - 2];
    if (n.type === 'Literal' && typeof n.value === 'string') {
      if (par && par.type === 'Property' && par.key === n && !par.computed) return;   // clave de objeto
      if (par && par.type === 'MemberExpression' && par.property === n) return;      // obj['x']
      if (par && (par.type === 'ImportDeclaration' || par.type === 'ExpressionStatement')) return; // 'use strict'
      const cmp = par && ((par.type === 'BinaryExpression' && /[=!]==?|in/.test(par.operator)) || par.type === 'SwitchCase');
      out.push({ start: n.start, end: n.end, line: n.loc.start.line, src: code.slice(n.start, n.end), val: n.value, cmp });
    } else if (n.type === 'TemplateLiteral') {
      if (par && par.type === 'TaggedTemplateExpression') return;
      out.push({ start: n.start, end: n.end, line: n.loc.start.line, src: code.slice(n.start, n.end), val: n.quasis.map((q) => q.value.cooked).join('${}'), tpl: n, exprs: n.expressions.map((e) => code.slice(e.start, e.end)) });
    }
  });
  return out;
}

// ---------- index.html: textos entre etiquetas y atributos visibles ----------
const htmlBits = (html) => {
  const out = [];
  html.replace(/>([^<>]*[A-Za-zÁÉÍÓÚáéíóúñ¡¿][^<>]*)</g, (m, t, off) => { if (t.trim()) out.push({ t: t.trim() }); return m; });
  html.replace(/\b(placeholder|title|alt|aria-label|content)="([^"]*[A-Za-záéíóúñ][^"]*)"/g, (m, a, t) => { out.push({ t }); return m; });
  return out;
};

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

if (require.main === module) {
  const files = fs.readdirSync(JS).filter((f) => f.endsWith('.js') && !SKIP.has(f));
  const seen = new Set();
  const dict = loadDict();
  fs.mkdirSync(path.join(__dirname, 'work'), { recursive: true });
  let total = 0, todo = 0;
  for (const f of files) {
    const lines = fs.readFileSync(path.join(JS, f), 'utf8').split('\n');
    let ws = '';
    for (const l of literals(f)) {
      if (!looksText(l.val) || seen.has(l.src)) continue;
      seen.add(l.src); total++;
      const id = hash(l.src);
      if (dict.has(id)) continue;
      todo++;
      const ctx = l.src.length < 40 && lines[l.line - 1].trim().length > l.src.length + 4 ? '   ¶ ' + lines[l.line - 1].trim().slice(0, 170) : '';
      ws += `@@${id} L${l.line}${l.cmp ? ' !CMP' : ''}${ctx}\n${l.src}\n`;
    }
    const wp = path.join(__dirname, 'work', f.replace('.js', '.txt'));
    if (ws) fs.writeFileSync(wp, ws); else if (fs.existsSync(wp)) fs.unlinkSync(wp);
  }
  let wh = '';
  for (const b of new Map(htmlBits(fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8')).map((x) => [x.t, x])).values()) {
    const id = hash('html:' + b.t); total++;
    if (dict.has(id)) continue;
    todo++; wh += `@@${id}\n${b.t}\n`;
  }
  const hp = path.join(__dirname, 'work', '_html.txt');
  if (wh) fs.writeFileSync(hp, wh); else if (fs.existsSync(hp)) fs.unlinkSync(hp);
  console.log(total, 'textos;', todo, 'sin traducir (ver tools/i18n/work/)');
}

// diccionario: tools/i18n/en/*.txt con bloques «@@id» + traducción (texto plano; en plantillas, ${expr} tal cual).
// «@@id =» deja el texto igual (nombres propios, etc.)
function loadDict() {
  const dir = path.join(__dirname, 'en'), d = new Map();
  if (!fs.existsSync(dir)) return d;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.txt'))) {
    const txt = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r/g, '');
    for (const blk of txt.split(/^@@/m).slice(1)) {
      const nl = blk.indexOf('\n');
      const head = (nl < 0 ? blk : blk.slice(0, nl)).trim(), body = nl < 0 ? '' : blk.slice(nl + 1).replace(/\n$/, '');
      const [id, flag] = head.split(/\s+/);
      d.set(id, flag === '=' ? null : body);
    }
  }
  return d;
}
module.exports = { literals, looksText, loadDict, hash, htmlBits, JS, ROOT, SKIP };
