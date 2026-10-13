/* Fendaria — estilo "HD-2D" (inspirado en Octopath Traveler):
 * el mundo se dibuja en un búfer de baja resolución y se amplía sin suavizado (pixel art nítido),
 * y encima se aplica luz dinámica. (El desenfoque tipo maqueta existe pero está apagado: HD2D.dof.)
 * Los sprites se "pixelan" al guardarse en la caché: alfa binario, paleta reducida y contorno oscuro de 1 píxel.
 * La interfaz y los números de daño se dibujan nítidos a resolución completa.
 */
'use strict';

const HD2D = { on: true, dof: false, pixMul: 1, pix: 2, c: null, g: null, main: null, active: false, texts: [], blur1: null, blur2: null };

// Tamaño del píxel en CSS px: ~250 píxeles de alto de pantalla, como una consola clásica
const hd2dPixSize = () => Math.max(1.25, H / 250) * HD2D.pixMul;

function hd2dCanvas(w, h, alpha = true) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w); c.height = Math.max(1, h);
  return { c, g: c.getContext('2d', { alpha }) };
}

// Empieza a dibujar el mundo en el búfer de baja resolución (devuelve false si el estilo está apagado)
function hd2dBegin() {
  if (!HD2D.on) return false;
  const pix = HD2D.pix = hd2dPixSize();
  const w = Math.ceil(W / pix), h = Math.ceil(H / pix);
  if (!HD2D.c || HD2D.c.width !== w || HD2D.c.height !== h) {
    const b = hd2dCanvas(w, h, false);
    HD2D.c = b.c; HD2D.g = b.g;
    HD2D.blur1 = hd2dCanvas(Math.ceil(w / 3), Math.ceil(h / 3));
    HD2D.blur2 = hd2dCanvas(Math.ceil(w / 7), Math.ceil(h / 7));
  }
  HD2D.main = ctx;
  ctx = HD2D.g;
  ctx.setTransform(1 / pix, 0, 0, 1 / pix, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  HD2D.active = true;
  HD2D.texts.length = 0;
  return true;
}

// Termina el mundo: amplía el búfer con píxeles nítidos y aplica el desenfoque de maqueta (tilt-shift).
// (El antiguo "bloom" con filtros de canvas se quitó: era el efecto más caro en móviles.)
function hd2dEndWorld() {
  if (!HD2D.active) return;
  HD2D.active = false;
  ctx = HD2D.main;
  const lo = HD2D.c, pix = HD2D.pix;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(lo, 0, 0, lo.width * pix, lo.height * pix);
  ctx.imageSmoothingEnabled = true;
  if (!HD2D.dof) return;
  // desenfoque: dos reducciones sucesivas (barato) y bandas arriba/abajo con transparencia gradual
  const b1 = HD2D.blur1, b2 = HD2D.blur2;
  b1.g.drawImage(lo, 0, 0, b1.c.width, b1.c.height);
  b2.g.drawImage(b1.c, 0, 0, b2.c.width, b2.c.height);
  const bands = 4;
  for (const [y0, y1, top] of [[0, H * 0.2, true], [H * 0.84, H, false]]) {
    const bh = (y1 - y0) / bands;
    for (let i = 0; i < bands; i++) {
      ctx.globalAlpha = top ? 1 - i / bands : (i + 1) / bands;
      const sy = (y0 + i * bh) / H * b2.c.height, sh = bh / H * b2.c.height;
      ctx.drawImage(b2.c, 0, sy, b2.c.width, sh, 0, y0 + i * bh, W, bh + 0.5);
    }
  }
  ctx.globalAlpha = 1;
}

// Textos del mundo dibujados durante el pase en baja resolución: se guardan y se pintan nítidos al final
function hd2dDeferText(args) {
  HD2D.texts.push({ m: ctx.getTransform(), a: ctx.globalAlpha, args });
}
function hd2dFlushText() {
  if (!HD2D.texts.length) return;
  const k = HD2D.pix * DPR;
  for (const t of HD2D.texts) {
    ctx.setTransform(t.m.a * k, t.m.b * k, t.m.c * k, t.m.d * k, t.m.e * k, t.m.f * k);
    ctx.globalAlpha = t.a;
    text(...t.args);
  }
  HD2D.texts.length = 0;
  ctx.globalAlpha = 1;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

// Convierte un sprite recién dibujado en pixel art: alfa binario, color posterizado y contorno de 1 px
function pixelize(c) {
  const w = c.width, h = c.height;
  if (w < 2 || h < 2 || w * h > 90000) return;
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, w, h), d = img.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0, p = 0; p < w * h; p++, i += 4) {
    if (d[i + 3] >= 100) {
      // des-premultiplicar y posterizar (paleta de 10 niveles por canal)
      const a = d[i + 3] / 255;
      for (let ch = 0; ch < 3; ch++) d[i + ch] = Math.min(255, Math.round(d[i + ch] / a / 28) * 28);
      d[i + 3] = 255; solid[p] = 1;
    } else d[i + 3] = 0;
  }
  // contorno oscuro donde el sprite toca el vacío
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (solid[p]) continue;
      let n = -1;
      if (x > 0 && solid[p - 1]) n = p - 1;
      else if (x < w - 1 && solid[p + 1]) n = p + 1;
      else if (y > 0 && solid[p - w]) n = p - w;
      else if (y < h - 1 && solid[p + w]) n = p + w;
      if (n < 0) continue;
      const i = p * 4, j = n * 4;
      d[i] = d[j] * 0.22; d[i + 1] = d[j + 1] * 0.18; d[i + 2] = d[j + 2] * 0.22 + 6; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

// Versión pixelada (y en caché) de una imagen pintada, como el retrato del Rompeyelmos
const PIX_IMG = new Map();
function pixelImage(img, hpx, key = img.src + '|' + hpx) {
  let c = PIX_IMG.get(key);
  if (c) return c;
  const wpx = Math.max(1, Math.round(hpx * img.width / img.height));
  // reducción por pasos para no perder detalle
  let src = img, sw = img.width, sh = img.height;
  while (sh / 2 > hpx * 1.5) {
    const t = hd2dCanvas(Math.round(sw / 2), Math.round(sh / 2));
    t.g.imageSmoothingQuality = 'high';
    t.g.drawImage(src, 0, 0, t.c.width, t.c.height);
    src = t.c; sw = t.c.width; sh = t.c.height;
  }
  const out = hd2dCanvas(wpx + 2, hpx + 2);
  out.g.imageSmoothingQuality = 'high';
  out.g.drawImage(src, 1, 1, wpx, hpx);
  pixelize(out.c);
  c = out.c;
  PIX_IMG.set(key, c);
  return c;
}

// Versión suave de una imagen para personajes pintados: reducción de alta calidad (bordes antialias)
// y un contorno oscuro suave de 1 píxel para que destaquen sobre el suelo sin bordes dentados
const SMOOTH_IMG = new Map();
function smoothImage(img, hpx, key, rim) {
  let c = SMOOTH_IMG.get(key);
  if (c) return c;
  const wpx = Math.max(1, Math.round(hpx * img.width / img.height));
  let src = img, sw = img.width, sh = img.height;
  while (sh / 2 > hpx * 1.2) {
    const t = hd2dCanvas(Math.round(sw / 2), Math.round(sh / 2));
    t.g.imageSmoothingQuality = 'high';
    t.g.drawImage(src, 0, 0, t.c.width, t.c.height);
    src = t.c; sw = t.c.width; sh = t.c.height;
  }
  const body = hd2dCanvas(wpx, hpx);
  body.g.imageSmoothingQuality = 'high';
  body.g.drawImage(src, 0, 0, wpx, hpx);
  const out = hd2dCanvas(wpx + 2, hpx + 2);
  // contorno: la silueta en oscuro desplazada en las 4 direcciones
  const sil = hd2dCanvas(wpx, hpx);
  sil.g.drawImage(body.c, 0, 0);
  sil.g.globalCompositeOperation = 'source-in';
  // héroes: borde de luz cálida (se distinguen siempre del suelo); monstruos: contorno oscuro
  sil.g.fillStyle = rim ? '#ffe9bf' : '#140c18'; sil.g.fillRect(0, 0, wpx, hpx);
  out.g.globalAlpha = rim ? 0.6 : 0.7;
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) out.g.drawImage(sil.c, dx, dy);
  out.g.globalAlpha = 1;
  out.g.drawImage(body.c, 1, 1);
  c = out.c;
  if (SMOOTH_IMG.size > 600) SMOOTH_IMG.delete(SMOOTH_IMG.keys().next().value);
  SMOOTH_IMG.set(key, c);
  return c;
}

// Activar / desactivar el estilo
function setHd2d(on) {
  HD2D.on = on;
  SPR.cache.clear();
  PIX_IMG.clear();
  if (typeof resize === 'function') resize();
}
