"""Fendaria — atlas de efectos visuales (fondo negro, se dibujan sumando luz).

Uso: python3 build_vfx.py <carpeta con las hojas (subcarpetas generation_*)> <salida_www>
"""
import sys, os, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage

CELL = 112  # tamaño máximo de cada fotograma en el atlas
# orden de las hojas (por fecha de generación) → nombre del efecto y fotogramas a usar
DILATE = {'shield': 26, 'heal': 2}  # cuánto se unen las partículas sueltas de un mismo fotograma
SHEETS = ['slash', 'explosion', 'runeBlue', 'runeFire', 'shield', 'poison', 'heal', 'ice', 'rage', 'smoke', 'wolf', None]


def frames_of(path, dil=10):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    a = np.clip(a - bg * 1.15, 0, 255)  # el fondo pasa a negro puro
    lum = a.max(-1)
    m = lum > 34
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=dil))
    objs = ndimage.find_objects(lab)
    areas = np.array([(m[s] & (lab[s] == i + 1)).sum() for i, s in enumerate(objs)])
    keep = [i for i in range(n) if areas[i] > areas.max() * 0.2]
    boxes = [objs[i] for i in keep]
    hs = np.median([b[0].stop - b[0].start for b in boxes])
    boxes.sort(key=lambda b: (round(((b[0].start + b[0].stop) / 2) / (hs * 0.8)), b[1].start))
    # celda común: la mayor caja, centrada en cada fotograma
    cw = max(b[1].stop - b[1].start for b in boxes) + 8
    ch = max(b[0].stop - b[0].start for b in boxes) + 8
    out = []
    for b in boxes:
        cy, cx = (b[0].start + b[0].stop) // 2, (b[1].start + b[1].stop) // 2
        y0, x0 = cy - ch // 2, cx - cw // 2
        cell = np.zeros((ch, cw, 3), np.float32)
        sy0, sx0 = max(0, y0), max(0, x0)
        sy1, sx1 = min(a.shape[0], y0 + ch), min(a.shape[1], x0 + cw)
        sub = a[sy0:sy1, sx0:sx1].copy()
        # solo lo que pertenece a este fotograma (evita trozos del vecino y textos sueltos)
        own = np.isin(lab[sy0:sy1, sx0:sx1], [i + 1 for i in keep if objs[i] == b])
        sub[~own] = 0
        cell[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = sub
        out.append(Image.fromarray(cell.astype(np.uint8)))
    return out


def build(src, www):
    sheets = sorted(glob.glob(os.path.join(src, 'generation_*', '*.*')))
    placed = []
    for name, path in zip(SHEETS, sheets):
        if not name: continue
        fr = frames_of(path, DILATE.get(name, 10))
        s = min(1.0, CELL / max(fr[0].width, fr[0].height))
        fr = [f.resize((max(1, round(f.width * s)), max(1, round(f.height * s))), Image.LANCZOS) for f in fr]
        placed.append((name, fr))
        print(name, len(fr), fr[0].size)
    W = 1024; x = y = rowh = 0; data = {}; rects = []
    for name, fr in placed:
        for f in fr:
            if x + f.width + 1 > W: x = 0; y += rowh + 1; rowh = 0
            rects.append((name, f, x, y)); x += f.width + 1; rowh = max(rowh, f.height)
    atlas = Image.new('RGB', (W, y + rowh), (0, 0, 0))
    for name, f, px, py in rects:
        atlas.paste(f, (px, py))
        d = data.setdefault(name, {'w': f.width, 'h': f.height, 'f': []})
        d['f'].append([px, py])
    os.makedirs(os.path.join(www, 'img/fx'), exist_ok=True)
    atlas.save(os.path.join(www, 'img/fx/vfx.png'), optimize=True)
    with open(os.path.join(www, 'js/vfx_data.js'), 'w') as fh:
        fh.write('/* Generado por tools/art/build_vfx.py — no editar a mano. */\n')
        fh.write("'use strict';\n")
        fh.write('const VFX_ATLAS = ' + json.dumps(data, separators=(',', ':')) + ';\n')
    print('atlas', atlas.size)


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
