// Fendaria i18n — busca texto que siga en español en la versión inglesa generada (www/js/en + index_en.html)
'use strict';
const fs = require('fs'), path = require('path');
const { literals, hash, JS, ROOT } = require('./extract.js');
const ES = /[áéíóúñ¡¿]|\b(de|del|la|las|los|el|con|que|para|por|una|tus|tu|te|se|Grieta|Grietas|Nivel|nivel|ámbar|daño|vida|Súper|Jefe|Guardián|bendici\w+|Misi\w+|Sonido|Vibración)\b/;
const IGN = /^(img|video|css)\//;
const out = [];
for (const f of fs.readdirSync(path.join(JS, 'en'))) {
  const src = fs.readFileSync(path.join(JS, 'en', f), 'utf8');
  fs.writeFileSync(path.join(JS, '__tmp.js'), src);
  for (const l of literals('__tmp.js')) {
    const t = l.val.replace(/<[^>]+>/g, ' ');
    if (ES.test(t) && !IGN.test(t) && !/^\/\//.test(t)) {
      // id del literal original: mismo texto en el fichero español
      out.push(`${f}:${l.line}  ${l.src.slice(0, 140).replace(/\n/g, '⏎')}`);
    }
  }
}
fs.unlinkSync(path.join(JS, '__tmp.js'));
console.log(out.join('\n') || 'sin restos de español'); console.log(out.length, 'posibles restos');
