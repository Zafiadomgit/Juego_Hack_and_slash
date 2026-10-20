"""Fendaria — recorta una hoja de iconos en rejilla (fondo magenta) en PNG cuadrados con transparencia.

Uso: python3 cut_icons.py <hoja.jpg> <columnas> <filas> <nombre1,nombre2,...> <carpeta_salida> [tamaño=96]
Un nombre vacío o '-' salta esa celda. Con --todo se conserva todo lo que hay en la celda
(iconos de varias piezas: huellas, dagas en círculo...), no solo la pieza más grande.
"""
import sys, os, tempfile
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from anim_frames import frames, key_mask
from build_anims import shrink

ALL = '--todo' in sys.argv
argv = [a for a in sys.argv if a != '--todo']
src, C, R, names, out = argv[1], int(argv[2]), int(argv[3]), argv[4].split(','), argv[5]
N = int(argv[6]) if len(argv) > 6 else 96
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB')
cw, ch = im.width / C, im.height / R
for k, n in enumerate(names):
    if not n or n == '-': continue
    c = im.crop((int((k % C) * cw), int((k // C) * ch), int((k % C + 1) * cw), int((k // C + 1) * ch)))
    if ALL:
        a = np.asarray(c)
        m = ndimage.binary_opening(key_mask(a), iterations=1)
        lab, k2 = ndimage.label(ndimage.binary_dilation(m, iterations=2))
        sizes = ndimage.sum(m, lab, range(1, k2 + 1)) if k2 else []
        boxes = ndimage.find_objects(lab)
        big = max(sizes) if k2 else 0
        H, Wc = m.shape
        def ok(i):  # fuera los trocitos que asoman de la celda vecina (tocan el borde y son pequeños)
            sl = boxes[i]; edge = sl[0].start < 6 or sl[1].start < 6 or sl[0].stop > H - 6 or sl[1].stop > Wc - 6
            cy, cx = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
            central = 0.18 * H < cy < 0.82 * H and 0.18 * Wc < cx < 0.82 * Wc
            if sizes[i] == big: return True
            return sizes[i] > 40 and central and (not edge or sizes[i] > big * 0.35)
        keep = np.isin(lab, [i + 1 for i in range(k2) if ok(i)]) & m
        if not keep.any(): print('vacío', n); continue
        ys, xs = np.where(keep)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        g = Image.fromarray(np.dstack([a[y0:y1, x0:x1], (keep[y0:y1, x0:x1] * 255).astype(np.uint8)]), 'RGBA')
    else:
        t = os.path.join(tempfile.gettempdir(), 'cut_icon.png'); c.save(t)
        fr = frames(t)
        if not fr: print('vacío', n); continue
        g = max(fr, key=lambda f: f['img'].width * f['img'].height)['img']
    s = (N - 4) / max(g.size)
    o = shrink(g, s)
    can = Image.new('RGBA', (N, N)); can.alpha_composite(o, ((N - o.width) // 2, (N - o.height) // 2))
    can.save(os.path.join(out, n + '.png'), optimize=True)
print('ok', len([n for n in names if n and n != '-']))
