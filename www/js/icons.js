/* Fendaria — iconos ilustrados (SVG) para objetos y características.
 * Los mismos SVG se usan en la interfaz (DOM) y en el mundo (como imagen).
 */
'use strict';

// Paletas por rareza: metal, brillo, gema, cuero, tela
const ICON_PAL = [
  { m: '#9aa3ab', ml: '#e1e6ea', g: '#d8d0bc', l: '#7a5233', c: '#8a6a4a' }, // Común
  { m: '#8fa9c4', ml: '#eaf4fd', g: '#3fa9f0', l: '#5e4632', c: '#2f6fa8' }, // Raro
  { m: '#8a78ad', ml: '#ece2ff', g: '#b65ef0', l: '#4a3048', c: '#6b3fa0' }, // Épico
  { m: '#dba83c', ml: '#fff3c4', g: '#ff7a1a', l: '#6b3a1a', c: '#b8322a' }, // Legendario
];
const OL = '#2a1a0c';

function iconBody(kind, p) {
  switch (kind) {
    case 'axe':
      return `<g transform="rotate(-28 24 24)">
        <path d="M24 45 L24 9" stroke="${OL}" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M24 45 L24 9" stroke="${p.l}" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M22 9 Q9 6 4 17 Q9 27 22 22 Z" fill="${p.m}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M26 9 Q39 6 44 17 Q39 27 26 22 Z" fill="${p.m}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 16 Q11 10 18 10" stroke="${p.ml}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <rect x="20.5" y="11" width="7" height="10" rx="2" fill="${p.g}" stroke="${OL}" stroke-width="1.6"/>
      </g>`;
    case 'bow':
      return `<path d="M15 5 Q44 24 15 43" stroke="${OL}" stroke-width="6.5" fill="none" stroke-linecap="round"/>
        <path d="M15 5 Q44 24 15 43" stroke="${p.l}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
        <path d="M15 5 L15 43" stroke="${p.ml}" stroke-width="1.4"/>
        <path d="M8 24 L40 24" stroke="${OL}" stroke-width="3"/><path d="M8 24 L40 24" stroke="${p.c}" stroke-width="1.6"/>
        <path d="M43 24 L36 20 L36 28 Z" fill="${p.m}" stroke="${OL}" stroke-width="1.4"/>
        <circle cx="15" cy="5" r="3" fill="${p.g}" stroke="${OL}" stroke-width="1.4"/><circle cx="15" cy="43" r="3" fill="${p.g}" stroke="${OL}" stroke-width="1.4"/>`;
    case 'staff':
      return `<path d="M24 46 L24 18" stroke="${OL}" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M24 46 L24 18" stroke="${p.l}" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M17 20 Q24 14 31 20" stroke="${p.m}" stroke-width="3" fill="none"/>
        <circle cx="24" cy="12" r="11" fill="${p.g}" opacity="0.25"/>
        <path d="M24 1 L32 12 L24 23 L16 12 Z" fill="${p.g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M24 4 L28 12 L24 19 Z" fill="${p.ml}" opacity="0.75"/>`;
    case 'helm':
      return `<path d="M13 24 Q3 20 6 6 Q10 16 17 18 Z" fill="#efe3c8" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M35 24 Q45 20 42 6 Q38 16 31 18 Z" fill="#efe3c8" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M10 33 Q10 11 24 11 Q38 11 38 33 Z" fill="${p.m}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M15 27 Q15 16 23 15" stroke="${p.ml}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <rect x="8" y="31" width="32" height="6" rx="2" fill="${p.l}" stroke="${OL}" stroke-width="2"/>
        <rect x="21.5" y="18" width="5" height="18" rx="1.5" fill="${p.m}" stroke="${OL}" stroke-width="1.6"/>
        <circle cx="24" cy="15" r="3" fill="${p.g}" stroke="${OL}" stroke-width="1.4"/>`;
    case 'cape':
      return `<path d="M15 7 L33 7 Q38 26 41 43 L32 38 L24 44 L16 38 L7 43 Q10 26 15 7 Z" fill="${p.c}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M19 12 Q16 26 13 38 M29 12 Q32 26 35 38" stroke="rgba(0,0,0,0.25)" stroke-width="2" fill="none"/>
        <path d="M18 10 Q14 22 12 30" stroke="rgba(255,255,255,0.3)" stroke-width="2" fill="none" stroke-linecap="round"/>
        <rect x="13" y="5" width="22" height="6" rx="3" fill="${p.m}" stroke="${OL}" stroke-width="1.8"/>
        <circle cx="24" cy="8" r="3.6" fill="${p.g}" stroke="${OL}" stroke-width="1.4"/>`;
    case 'amulet':
      return `<path d="M9 5 Q24 34 39 5" stroke="${OL}" stroke-width="4" fill="none"/>
        <path d="M9 5 Q24 34 39 5" stroke="${p.ml}" stroke-width="2" fill="none" stroke-dasharray="3 2"/>
        <circle cx="24" cy="33" r="11" fill="${p.m}" stroke="${OL}" stroke-width="2"/>
        <circle cx="24" cy="33" r="6.5" fill="${p.g}" stroke="${OL}" stroke-width="1.6"/>
        <circle cx="21.8" cy="30.8" r="2" fill="#fff" opacity="0.8"/>`;
    case 'ring':
      return `<ellipse cx="24" cy="31" rx="14" ry="12" fill="none" stroke="${OL}" stroke-width="8"/>
        <ellipse cx="24" cy="31" rx="14" ry="12" fill="none" stroke="${p.m}" stroke-width="4.5"/>
        <path d="M14 26 Q18 21 24 20" stroke="${p.ml}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M24 5 L32 14 L24 22 L16 14 Z" fill="${p.g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M24 8 L28 14 L24 18 Z" fill="#fff" opacity="0.65"/>`;
    case 'boots':
      return `<path d="M15 6 L29 6 L29 29 L41 33 Q44 40 39 43 L13 43 Q11 40 13 35 Z" fill="${p.l}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <rect x="13" y="5" width="18" height="8" rx="2" fill="${p.m}" stroke="${OL}" stroke-width="2"/>
        <path d="M17 18 L27 18 M17 23 L27 23" stroke="${p.ml}" stroke-width="1.6" opacity="0.7"/>
        <path d="M12 41 L41 41" stroke="#1a0f08" stroke-width="3"/>
        <circle cx="22" cy="9" r="2.2" fill="${p.g}" stroke="${OL}" stroke-width="1.2"/>`;
    case 'belt':
      return `<rect x="3" y="18" width="42" height="12" rx="3" fill="${p.l}" stroke="${OL}" stroke-width="2"/>
        <path d="M5 21 L43 21" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
        <rect x="17" y="14" width="14" height="20" rx="3" fill="none" stroke="${OL}" stroke-width="5.5"/>
        <rect x="17" y="14" width="14" height="20" rx="3" fill="none" stroke="${p.m}" stroke-width="3"/>
        <circle cx="24" cy="24" r="3" fill="${p.g}" stroke="${OL}" stroke-width="1.4"/>
        <circle cx="9" cy="24" r="1.6" fill="${p.ml}"/><circle cx="39" cy="24" r="1.6" fill="${p.ml}"/>`;
    case 'potion':
      return `<path d="M19 6 L29 6 L29 14 L36 26 Q38 40 24 43 Q10 40 12 26 L19 14 Z" fill="${p.g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M13.5 29 Q24 25 34.5 29 Q36 40 24 41.5 Q12 40 13.5 29 Z" fill="${p.ml}" opacity="0.55"/>
        <rect x="18" y="3" width="12" height="5" rx="1.5" fill="#8a5a32" stroke="${OL}" stroke-width="1.6"/>
        <path d="M16 22 Q16 30 19 34" stroke="#fff" stroke-width="2" opacity="0.6" fill="none" stroke-linecap="round"/>`;
    case 'bag':
      return `<rect x="8" y="14" width="32" height="27" rx="6" fill="#7a5233" stroke="${OL}" stroke-width="2"/>
        <path d="M16 14 Q16 5 24 5 Q32 5 32 14" stroke="${OL}" stroke-width="3" fill="none"/>
        <path d="M8 22 L40 22" stroke="rgba(0,0,0,.3)" stroke-width="2"/>
        <rect x="20" y="20" width="8" height="8" rx="1.5" fill="${p.g}" stroke="${OL}" stroke-width="1.4"/>`;
    case 'whetstone':
      return `<path d="M8 30 L30 8 L40 18 L18 40 Z" fill="#8a8f96" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M12 30 L30 12" stroke="#d6dde3" stroke-width="2"/>
        <path d="M33 33 L42 42 M38 30 L44 36" stroke="${p.g}" stroke-width="2.5" stroke-linecap="round"/>`;
    case 'talisman':
      return `<path d="M24 4 L28 16 L41 16 L31 24 L35 37 L24 29 L13 37 L17 24 L7 16 L20 16 Z" fill="${p.g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="24" cy="21" r="5" fill="#fff" opacity="0.5"/>`;
    case 'shield':
      return `<path d="M24 4 L40 10 Q40 32 24 44 Q8 32 8 10 Z" fill="${p.g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M24 9 L35 13 Q35 30 24 39 Z" fill="#000" opacity="0.18"/>
        <path d="M24 12 L24 34 M15 20 L33 20" stroke="${p.ml}" stroke-width="2.5" opacity="0.8"/>`;
    case 'magnet':
      return `<path d="M10 8 L18 8 L18 26 Q18 32 24 32 Q30 32 30 26 L30 8 L38 8 L38 26 Q38 40 24 40 Q10 40 10 26 Z" fill="${p.g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <rect x="10" y="8" width="8" height="6" fill="#e8eef2" stroke="${OL}" stroke-width="1.5"/><rect x="30" y="8" width="8" height="6" fill="#e8eef2" stroke="${OL}" stroke-width="1.5"/>`;
    case 'clover':
      return `<circle cx="17" cy="17" r="8" fill="${p.g}" stroke="${OL}" stroke-width="2"/><circle cx="31" cy="17" r="8" fill="${p.g}" stroke="${OL}" stroke-width="2"/>
        <circle cx="17" cy="30" r="8" fill="${p.g}" stroke="${OL}" stroke-width="2"/><circle cx="31" cy="30" r="8" fill="${p.g}" stroke="${OL}" stroke-width="2"/>
        <path d="M24 26 Q26 36 32 44" stroke="${OL}" stroke-width="3" fill="none"/><circle cx="24" cy="24" r="3" fill="${p.ml}"/>`;
    case 'crystal':
      return `<path d="M24 3 L34 16 L30 44 L18 44 L14 16 Z" fill="${p.g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M24 3 L24 44 M14 16 L34 16" stroke="#fff" stroke-width="1.2" opacity="0.6"/><path d="M24 3 L34 16 L24 16 Z" fill="#fff" opacity="0.45"/>`;
    case 'gem':
      return `<path d="M24 4 L38 16 L33 40 L15 40 L10 16 Z" fill="${p.g}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M24 4 L38 16 L24 20 L10 16 Z" fill="#fff" opacity="0.5"/>
        <path d="M24 20 L33 40 L15 40 Z" fill="#000" opacity="0.2"/>
        <path d="M10 16 L24 20 L38 16 M24 20 L24 40" stroke="#fff" stroke-width="1" opacity="0.7" fill="none"/>`;
  }
  return '';
}

const WEAPON_KIND = { iop: 'axe', cra: 'bow', feca: 'staff' };
const SLOT_KIND = { sombrero: 'helm', capa: 'cape', amuleto: 'amulet', anillo: 'ring', botas: 'boots', cinturon: 'belt' };

function itemKind(it, cls) { return it.slot === 'arma' ? WEAPON_KIND[cls || S.cls] : SLOT_KIND[it.slot]; }

function iconSVG(kind, rarity, size = 48, extra = '', pal) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" ${extra}>${iconBody(kind, pal || ICON_PAL[rarity] || ICON_PAL[0])}</svg>`;
}
// Icono con un color propio (elixires, mejoras)
function tintIcon(kind, color, hi, size = 40) {
  return iconSVG(kind, 0, size, 'aria-hidden="true"', { m: '#9aa3ab', ml: hi || '#ffffff', g: color, l: '#7a5233', c: color });
}
function itemSVG(it, size = 48) { return iconSVG(itemKind(it), it.rarity, size, 'aria-hidden="true"'); }

// Silueta vacía de una ranura (gris apagado)
function slotSVG(slot, size = 40) {
  const kind = slot === 'arma' ? WEAPON_KIND[S.cls] : SLOT_KIND[slot];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" style="opacity:.22;filter:grayscale(1)">${iconBody(kind, ICON_PAL[0])}</svg>`;
}

// Versión imagen (para dibujar en el canvas del juego)
const ICON_IMG = new Map();
function itemIconImage(kind, rarity) {
  const key = kind + '|' + rarity;
  let img = ICON_IMG.get(key);
  if (!img) {
    img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(iconSVG(kind, rarity, 96));
    ICON_IMG.set(key, img);
  }
  return img;
}

// Iconos de características (16px)
const STAT_ICON = {
  vit: (c = '#ff5a4e') => `<path d="M8 14 C2 9.5 1 6.5 2.6 4.2 C4.2 2 6.8 2.4 8 4.6 C9.2 2.4 11.8 2 13.4 4.2 C15 6.5 14 9.5 8 14 Z" fill="${c}"/>`,
  sab: (c = '#b48cff') => `<path d="M1.5 8 Q8 1.5 14.5 8 Q8 14.5 1.5 8 Z" fill="${c}"/><circle cx="8" cy="8" r="2.6" fill="#1d1410"/><circle cx="8.8" cy="7.2" r="0.9" fill="#fff"/>`,
  fue: (c = '#d08a48') => `<path d="M2 13 L5 5 L8 9 L11 3 L14 13 Z" fill="${c}"/>`,
  int: (c = '#ff7a2a') => `<path d="M8 1.5 C10 4.5 13 6.5 13 10 A5 5 0 0 1 3 10 C3 7.5 4.6 6 5.6 4.4 C6.4 6 7.2 6.6 8 6.8 C8 4.8 7.4 3.2 8 1.5 Z" fill="${c}"/>`,
  sue: (c = '#4fb4f0') => `<path d="M8 1.5 C10.5 5.5 13 8 13 10.5 A5 5 0 0 1 3 10.5 C3 8 5.5 5.5 8 1.5 Z" fill="${c}"/>`,
  agi: (c = '#6fd05a') => `<path d="M3 14 C3 7 7 2.5 14 2 C13.5 9 9 13 3 14 Z" fill="${c}"/><path d="M3 14 L10 6" stroke="#1d1410" stroke-width="1.2"/>`,
  dmg: (c = '#e8e2d0') => `<path d="M3 13 L12 4 M10 3 L13 3 L13 6 M2 11 L5 14" stroke="${c}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  crit: (c = '#ffc04a') => `<circle cx="8" cy="8" r="5.5" fill="none" stroke="${c}" stroke-width="2"/><circle cx="8" cy="8" r="1.8" fill="${c}"/>`,
  res: (c = '#9fb6c8') => `<path d="M8 1.5 L14 4 Q14 11 8 14.5 Q2 11 2 4 Z" fill="${c}"/>`,
  pros: (c = '#ffcf5a') => `<circle cx="8" cy="8" r="6" fill="${c}"/><circle cx="8" cy="8" r="3.4" fill="none" stroke="#8a5a12" stroke-width="1.2"/>`,
};
const STAT_COLOR = { vit: '#ff5a4e', sab: '#b48cff', fue: '#d08a48', int: '#ff7a2a', sue: '#4fb4f0', agi: '#6fd05a', dmg: '#e8e2d0', crit: '#ffc04a', res: '#9fb6c8', pros: '#ffcf5a' };
function statIcon(k, size = 16) {
  return `<svg viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true">${STAT_ICON[k]()}</svg>`;
}
