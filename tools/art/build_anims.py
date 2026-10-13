"""Fendaria — atlas de animación de los héroes a partir de las hojas generadas.

Uso: python3 build_anims.py <carpeta "Referencias Heroes"> <salida_www>
Escribe <www>/img/heroes/anim/<clase>.png y <www>/js/anim_data.js
"""
import sys, os, glob, json
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from anim_frames import frames

BODY_PX = 110  # altura del cuerpo (de la cabeza a los pies) en el atlas

# clase: carpeta, y para cada pose: (índice de hoja, fotogramas a usar o None = todos)
PLAN = {
    'iop': ('Rompeyelmos', {'walk': (0, [3, 4, 5, 8, 9, 10]), 'idle': (1, None), 'attack': (2, None), 'hurt': (3, None)}),
    'cra': ('Ojo de halcon', {'walk': (0, [4, 5, 6, 7, 10, 11]), 'idle': (1, None), 'attack': (3, [0, 1, 2, 4]), 'hurt': (2, None)}),
    'feca': ('Arcanista', {'walk': (1, [0, 1, 2, 3, 4, 6, 7]), 'idle': (2, None), 'attack': (0, [2, 3, 4, 5, 6]), 'hurt': (3, None)}),
    'sombra': ('Assasin', {'walk': (3, None), 'idle': (2, None), 'attack': (1, [0, 1, 3]), 'hurt': (0, None)}),
    'domadora': ('summoner', {'walk': (0, [0, 1, 2, 3, 5, 6, 7]), 'idle': (1, None), 'attack': (3, None), 'hurt': (2, None)}),
    'artificiera': ('Bomber', {'walk': (3, [0, 2, 3, 4]), 'idle': (2, None), 'attack': (0, None), 'hurt': (1, None)}),
    'berserker': ('Berserker', {'walk': (0, [0, 1, 5, 6]), 'idle': (1, None), 'attack': (2, None), 'hurt': (3, None)}),
}


def clean_mask(al):
    """Silueta limpia: sin píxeles sueltos ni huecos, con el borde redondeado."""
    from scipy import ndimage
    m = al > 110
    m = ndimage.binary_closing(m, iterations=1)
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz > max(12, sizes.max() * 0.004)])
    # rellenar solo agujeritos (ruido); los huecos reales (entre arco y cuerda, brazos…) se quedan vacíos
    holes = ndimage.binary_fill_holes(m) & ~m
    lab, n = ndimage.label(holes)
    if n:
        sizes = ndimage.sum(holes, lab, range(1, n + 1))
        m |= np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz < 40])
    return m


def shrink(im, s):
    """Reduce con alfa suave (bordes antialias) a partir de una silueta limpia."""
    from scipy import ndimage
    a = np.asarray(im).astype(np.float32)
    r_, g_, b_ = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    spill = (r_ > 140) & (b_ > 120) & (g_ < r_ * 0.55) & (g_ < b_ * 0.6) & (np.abs(r_ - b_) < 90)  # restos del fondo magenta
    a[:, :, 3] = np.where(spill, 0, a[:, :, 3])
    m = clean_mask(a[:, :, 3])
    m &= ~spill
    m = m.astype(np.float32)
    m = ndimage.gaussian_filter(m, 0.8) * 255
    w, h = max(1, round(im.width * s)), max(1, round(im.height * s))
    pm = a.copy(); pm[:, :, 3] = m; pm[:, :, :3] *= m[..., None] / 255
    r = np.asarray(Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(np.float32)
    al = r[:, :, 3:4]
    rgb = np.where(al > 0, r[:, :, :3] * 255 / np.maximum(al, 1), 0)
    al = np.where(al < 24, 0, np.clip((al - 24) * 255 / 200, 0, 255))
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al[:, :, 0]]).astype(np.uint8))


CLIP_FWD = {'feca': 0.42, 'cra': 0.6}  # cuánto puede asomar el arma por delante (fracción de la altura)


# Ciclos de caminar regenerados (hojas en el orden de clase de NEW_ORDER): índice de fotogramas a usar
NEW_ORDER = ['iop', 'cra', 'feca', 'sombra', 'domadora', 'artificiera', 'berserker']
NEW_WALK = {'iop': [4, 5, 6, 8, 10, 11], 'cra': [3, 4, 5, 6, 7, 8, 9, 10], 'feca': [0, 2, 3, 8, 10],
            'sombra': None, 'domadora': None, 'artificiera': None, 'berserker': None}
NEW_FLIP = {'feca': [2, 3]}  # fotogramas de la hoja que miran a la izquierda: se voltean


def clip_body(im, ax, ay, fwd=0.68, back=0.55):
    """Quita los efectos dibujados lejos del cuerpo (rastros de flechas, rayos, dagas lanzadas):
    solo se conserva lo que cabe en una caja alrededor del personaje y su arma."""
    a = np.asarray(im).copy()
    h, w = a.shape[:2]
    x0 = int(max(0, ax - BODY_PX * back)); x1 = int(min(w, ax + BODY_PX * fwd))
    y0 = int(max(0, ay - BODY_PX * 1.18))
    a[:, :x0, 3] = 0; a[:, x1:, 3] = 0; a[:y0, :, 3] = 0
    ys, xs = np.where(a[:, :, 3] > 0)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(a), ax - xs.min(), ay - ys.min()


def build(src, www, walk_src=None):
    out_dir = os.path.join(www, 'img/heroes/anim'); os.makedirs(out_dir, exist_ok=True)
    data = {}
    for cls, (folder, poses) in PLAN.items():
        sheets = sorted(glob.glob(os.path.join(src, folder, '*', '*.jpg')))
        placed = []
        for pose, (si, keep) in poses.items():
            if pose == 'walk' and walk_src:
                fr = frames(walk_src[NEW_ORDER.index(cls)])
                for i in NEW_FLIP.get(cls, []):
                    f = fr[i]; f['img'] = f['img'].transpose(Image.FLIP_LEFT_RIGHT); f['ax'] = f['img'].width - 1 - f['ax']
                keep = NEW_WALK[cls]
            else:
                fr = frames(sheets[si])
            if keep is not None: fr = [fr[i] for i in keep]
            s = BODY_PX / float(np.median([f['bh'] for f in fr]))
            for f in fr:
                im, ax, ay = clip_body(shrink(f['img'], s), f['ax'] * s, f['ay'] * s, CLIP_FWD.get(cls, 0.68) if pose == 'attack' else 0.68, 0.4 if (pose == 'attack' and cls == 'feca') else 0.55)
                if im.height > BODY_PX * 1.3 and len(fr) > 2: continue  # pose mal recortada (efecto pegado a los pies)
                placed.append((pose, im, ax, ay))
        W = 1024; x = y = rowh = 0; rects = []
        for pose, im, ax, ay in placed:
            if x + im.width + 2 > W: x = 0; y += rowh + 2; rowh = 0
            rects.append((pose, im, x, y, ax, ay)); x += im.width + 2; rowh = max(rowh, im.height)
        atlas = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
        entry = {'bh': BODY_PX}
        for pose, im, px, py, ax, ay in rects:
            atlas.paste(im, (px, py))
            entry.setdefault(pose, []).append([px, py, im.width, im.height, round(ax, 1), round(ay, 1)])
        atlas.save(os.path.join(out_dir, cls + '.webp'), quality=92, method=6)
        data[cls] = entry
        print(cls, atlas.size, {k: len(v) for k, v in entry.items() if k != 'bh'})
    with open(os.path.join(www, 'js/anim_data.js'), 'w') as f:
        f.write('/* Generado por tools/art/build_anims.py — no editar a mano. */\n')
        f.write("'use strict';\n")
        f.write('const HERO_ANIM = ' + json.dumps(data, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2], open(sys.argv[3]).read().split('\n') if len(sys.argv) > 3 else None)
