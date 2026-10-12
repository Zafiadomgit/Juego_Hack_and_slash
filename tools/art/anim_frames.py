"""Fendaria — separa los fotogramas de una hoja de animación generada (fondo de color uniforme).

Devuelve, en orden de lectura, cada fotograma recortado (RGBA) con su punto de apoyo (pies).
"""
import numpy as np
from PIL import Image
from scipy import ndimage


def key_mask(a):
    h, w = a.shape[:2]
    border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    f = a.astype(np.float32)
    d = np.sqrt(((f - bg) ** 2).sum(-1))
    mag = (f[:, :, 0] > 150) & (f[:, :, 2] > 150) & (f[:, :, 1] < 110) & (np.abs(f[:, :, 0] - f[:, :, 2]) < 90)
    return (d > 70) & ~mag


def frames(path, drop=()):
    a = np.asarray(Image.open(path).convert('RGB'))
    fg = key_mask(a)
    fg = ndimage.binary_opening(fg, iterations=1)
    lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=3))
    objs = ndimage.find_objects(lab)
    areas = np.array([((lab[s] == i + 1) & fg[s]).sum() for i, s in enumerate(objs)])
    big = [i for i in range(n) if areas[i] > areas.max() * 0.25]
    widths = np.array([objs[i][1].stop - objs[i][1].start for i in big])
    medw = np.median(widths)
    big = [i for i in big if objs[i][1].stop - objs[i][1].start < medw * 1.4]  # dos personajes unidos por un efecto: fuera
    cent = {i: ((objs[i][0].start + objs[i][0].stop) / 2, (objs[i][1].start + objs[i][1].stop) / 2) for i in range(n)}
    owner = {}
    for i in range(n):
        if i in big: owner[i] = i; continue
        if areas[i] < 20: continue
        cy, cx = cent[i]
        j = min(big, key=lambda b: (cent[b][0] - cy) ** 2 * 3 + (cent[b][1] - cx) ** 2)
        owner[i] = j
    out = []
    for b in big:
        m = np.zeros(fg.shape, bool)
        for i, o in owner.items():
            if o == b: m |= (lab == i + 1) & fg
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        # quitar el reborde rosado (antialiasing contra el magenta) en los 2 px del contorno
        mm = m[y0:y1, x0:x1].copy()
        rgb = a[y0:y1, x0:x1].astype(int)
        pink = (rgb[:, :, 0] > rgb[:, :, 1] + 45) & (rgb[:, :, 2] > rgb[:, :, 1] + 35)
        edge = mm & ~ndimage.binary_erosion(mm, iterations=2)
        mm &= ~(pink & edge)
        crop = np.dstack([a[y0:y1, x0:x1], (mm * 255).astype(np.uint8)])
        # punto de apoyo: centro de masa de la parte baja del cuerpo (piernas) y la fila más baja
        mb = (lab[y0:y1, x0:x1] == b + 1) & fg[y0:y1, x0:x1]
        h = mb.shape[0]
        rows = np.where(mb.any(1))[0]
        foot = rows.max()
        legs = mb[int(foot - h * 0.22):foot + 1]
        ax = np.where(legs)[1].mean()
        body_h = foot - rows.min()
        out.append({'img': Image.fromarray(crop), 'ax': float(ax), 'ay': float(foot), 'bh': float(body_h), 'y': (y0 + y1) / 2, 'x': (x0 + x1) / 2})
    # orden de lectura: filas (por centro vertical) y luego x
    hs = np.median([o['img'].height for o in out])
    out.sort(key=lambda o: (round(o['y'] / (hs * 0.6)), o['x']))
    return [o for k, o in enumerate(out) if k not in drop]


def frames_grid(path, cols, rows=1):
    """Para hojas con fotogramas pegados: divide el contenido en una rejilla regular."""
    a = np.asarray(Image.open(path).convert('RGB'))
    fg = ndimage.binary_opening(key_mask(a), iterations=1)
    ys, xs = np.where(fg)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = []
    for r in range(rows):
        for c in range(cols):
            cy0 = y0 + (y1 - y0) * r // rows; cy1 = y0 + (y1 - y0) * (r + 1) // rows
            cx0 = x0 + (x1 - x0) * c // cols; cx1 = x0 + (x1 - x0) * (c + 1) // cols
            m = fg[cy0:cy1, cx0:cx1]
            if m.sum() < 50: continue
            yy, xx = np.where(m)
            sy0, sy1, sx0, sx1 = yy.min(), yy.max() + 1, xx.min(), xx.max() + 1
            mm = m[sy0:sy1, sx0:sx1]
            crop = np.dstack([a[cy0 + sy0:cy0 + sy1, cx0 + sx0:cx0 + sx1], (mm * 255).astype(np.uint8)])
            rws = np.where(mm.any(1))[0]; foot = rws.max(); h = mm.shape[0]
            legs = mm[int(foot - h * 0.22):foot + 1]
            out.append({'img': Image.fromarray(crop), 'ax': float(np.where(legs)[1].mean()), 'ay': float(foot), 'bh': float(foot - rws.min()), 'x': 0, 'y': 0})
    return out
