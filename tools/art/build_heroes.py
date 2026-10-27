"""Fendaria — héroes rediseñados (2.ª generación): atlas de animación y arte de cuerpo entero.

Uso: python3 build_heroes.py <carpeta_hojas>[:<otra>...] <salida_www>   (la primera carpeta con la hoja gana)
  <carpeta_hojas> contiene, por clase, <clase>_base-0.jpg (diseño) y <clase>_<pose>-0.jpg (walk, idle, attack, hurt),
  todas con fondo magenta liso (generadas con Leonardo, ver README).
Escribe <www>/img/heroes/anim/<clase>.webp, <www>/img/heroes/px/<clase>.png y <www>/js/anim_data.js
"""
import sys, os, json
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from anim_frames import frames
from build_anims import shrink, clip_body, BODY_PX

CLASSES = ['iop', 'cra', 'feca', 'sombra', 'domadora', 'artificiera', 'berserker']
# fotogramas a usar de cada hoja (None = todos); FLIP: fotogramas que miran a la izquierda
KEEP = {
    'iop': {'attack': [0, 1, 2]},
    'cra': {'walk': [1, 2, 3, 4, 5], 'idle': [1, 2], 'attack': [0, 1, 2]},
    'feca': {'walk': [1, 2, 3, 4, 5], 'idle': [0, 1, 2], 'attack': [0, 1, 2]},
    'artificiera': {'attack': [0, 1]},
    'berserker': {'attack': [0, 1, 2], 'hurt': [0]},
}
FLIP = {'artificiera': {'walk': [5]}}
# ajustes de las hojas nuevas (rejillas de 12-16 fotogramas)
FRESH_KEEP = {'feca': {'walk': [0, 1, 2, 3, 4, 6, 7, 8, 10, 11]}}
CLIP_FWD = {'cra': 0.8, 'feca': 1.7, 'berserker': 1.0, 'iop': 0.85, 'domadora': 1.0}
# hojas cuyos fotogramas se tocan: N columnas iguales, o lista de cortes (fracción del ancho)
GRID = {'cra': {'walk': 6}, 'feca': {'attack': [0.26, 0.72]}}
# hojas en rejilla con efectos que unen fotogramas: columnas de cada fila (cada celda es un fotograma)
CELLS = {
    'artificiera': {'attack': [3, 3], 'cast': [3, 3]}, 'berserker': {'cast': [4, 4, 4]}, 'cra': {'cast': [3, 3]},
    'domadora': {'attack': [3, 3, 3], 'cast': [3, 3]}, 'feca': {'attack': [4, 3], 'cast': [3, 3]},
    'iop': {'attack': [3, 3], 'cast': [3, 3]}, 'sombra': {'attack': [4, 3], 'cast': [3, 3]},
}
# fotogramas elegidos de las hojas en celdas (índice de celda en orden de lectura)
CELL_KEEP = {
    'artificiera': {'attack': [2, 0, 3], 'cast': [0, 1, 5]}, 'berserker': {'cast': [0, 1, 2, 3, 8, 6]},
    'cra': {'cast': [0, 1, 3, 4, 5]}, 'domadora': {'attack': [1, 0, 4, 7], 'cast': [0, 1, 2, 4]},
    'feca': {'attack': [0, 1, 5, 4], 'cast': [0, 1, 2, 4, 5]}, 'iop': {'attack': [0, 2, 3, 4, 5], 'cast': [0, 1, 5]},
    'sombra': {'attack': [0, 1, 2, 3, 4, 5], 'cast': [0, 1, 2, 3, 4, 5]},
}
PX_H = 300  # altura del arte de cuerpo entero (menú, diálogos)


def by_rows(fr):
    """Hojas en rejilla: ordena los fotogramas por filas y, dentro de cada fila, de izquierda a derecha."""
    if len(fr) < 2: return fr
    hs = sorted(f['img'].height for f in fr); gap = hs[len(hs) // 2] * 0.5
    fr = sorted(fr, key=lambda f: f['y'])
    rows, cur = [], [fr[0]]
    for f in fr[1:]:
        if f['y'] - cur[-1]['y'] > gap: rows.append(cur); cur = [f]
        else: cur.append(f)
    rows.append(cur)
    return [f for r in rows for f in sorted(r, key=lambda f: f['x'])]


def build(src, www):
    srcs = src.split(':')  # varias carpetas: la primera que tenga la hoja gana
    out_dir = os.path.join(www, 'img/heroes/anim'); os.makedirs(out_dir, exist_ok=True)
    px_dir = os.path.join(www, 'img/heroes/px'); os.makedirs(px_dir, exist_ok=True)
    data = {}
    for cls in CLASSES:
        # arte de cuerpo entero a partir del diseño base
        base = frames(next(os.path.join(d, f'{cls}_base-0.jpg') for d in srcs if os.path.exists(os.path.join(d, f'{cls}_base-0.jpg'))))
        b = max(base, key=lambda f: f['img'].width * f['img'].height)
        s = PX_H / b['img'].height
        shrink(b['img'], s).save(os.path.join(px_dir, cls + '.png'), optimize=True)
        placed = []
        for pose in ['walk', 'idle', 'attack', 'hurt', 'cast']:
            path = next((os.path.join(d, f'{cls}_{pose}-0.jpg') for d in srcs if os.path.exists(os.path.join(d, f'{cls}_{pose}-0.jpg'))), None)
            if not path: continue
            fresh = len(srcs) > 1 and not path.startswith(srcs[-1])  # hoja nueva: sin los ajustes de las antiguas
            cfg = lambda T: (FRESH_KEEP.get(cls, {}) if T is KEEP else {}) if fresh else T.get(cls, {})
            n = cfg(GRID).get(pose)
            cells = CELLS.get(cls, {}).get(pose) if '/hero2' in path else None
            if cells:
                import tempfile
                im = Image.open(path).convert('RGB'); fr = []
                rh = im.height / len(cells)
                for r, nc in enumerate(cells):
                    for k in range(nc):
                        tmp = os.path.join(tempfile.gettempdir(), f'cell_{cls}_{pose}_{r}_{k}.png')
                        box = (int(k * im.width / nc), int(r * rh), int((k + 1) * im.width / nc), int((r + 1) * rh))
                        im.crop(box).save(tmp)
                        try: got = frames(tmp)
                        except Exception: continue
                        fr.append(max(got, key=lambda f: f['bh'] * f['img'].width ** 0.3))
                keep = CELL_KEEP.get(cls, {}).get(pose)
                if keep is not None: fr = [fr[i] for i in keep if i < len(fr)]
            elif n:
                import tempfile
                im = Image.open(path).convert('RGB'); fr = []
                xs = [0] + [int(c * im.width) for c in n] + [im.width] if isinstance(n, list) else [int(k * im.width / n) for k in range(n + 1)]
                for k in range(len(xs) - 1):
                    tmp = os.path.join(tempfile.gettempdir(), f'col_{cls}_{k}.png')
                    im.crop((xs[k], 0, xs[k + 1], im.height)).save(tmp)
                    fr.append(max(frames(tmp), key=lambda f: f['img'].width * f['img'].height))
            else:
                fr = by_rows(frames(path)) if fresh else frames(path)
            for i in ([] if cells else cfg(FLIP).get(pose, [])):
                f = fr[i]; f['img'] = f['img'].transpose(Image.FLIP_LEFT_RIGHT); f['ax'] = f['img'].width - 1 - f['ax']
            keep = None if cells else cfg(KEEP).get(pose)
            if keep is not None: fr = [fr[i] for i in keep if i < len(fr)]
            # escala común de la pose a partir de la altura del cuerpo (mediana)
            sc = BODY_PX / float(np.median([f['bh'] for f in fr]))
            for f in fr:
                im, ax, ay = clip_body(shrink(f['img'], sc), f['ax'] * sc, f['ay'] * sc, CLIP_FWD.get(cls, 0.7), 0.6)
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
        f.write('/* Generado por tools/art/build_heroes.py — no editar a mano. */\n')
        f.write("'use strict';\n")
        f.write('const HERO_ANIM = ' + json.dumps(data, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
