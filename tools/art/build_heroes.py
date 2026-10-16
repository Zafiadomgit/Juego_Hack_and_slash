"""Fendaria — héroes rediseñados (2.ª generación): atlas de animación y arte de cuerpo entero.

Uso: python3 build_heroes.py <carpeta_hojas> <salida_www>
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
    'feca': {'walk': [1, 2, 3, 4, 5], 'idle': [0, 1, 2], 'attack': [0, 1]},
    'artificiera': {'attack': [0, 1]},
    'berserker': {'attack': [0, 1, 2], 'hurt': [0]},
}
FLIP = {'artificiera': {'walk': [5]}}
CLIP_FWD = {'cra': 0.8, 'feca': 1.7, 'berserker': 1.0, 'iop': 0.85, 'domadora': 1.0}
GRID = {'cra': {'walk': 6}}  # hojas cuyos fotogramas se tocan: se cortan en N columnas iguales
PX_H = 300  # altura del arte de cuerpo entero (menú, diálogos)


def build(src, www):
    out_dir = os.path.join(www, 'img/heroes/anim'); os.makedirs(out_dir, exist_ok=True)
    px_dir = os.path.join(www, 'img/heroes/px'); os.makedirs(px_dir, exist_ok=True)
    data = {}
    for cls in CLASSES:
        # arte de cuerpo entero a partir del diseño base
        base = frames(os.path.join(src, f'{cls}_base-0.jpg'))
        b = max(base, key=lambda f: f['img'].width * f['img'].height)
        s = PX_H / b['img'].height
        shrink(b['img'], s).save(os.path.join(px_dir, cls + '.png'), optimize=True)
        placed = []
        for pose in ['walk', 'idle', 'attack', 'hurt']:
            path = os.path.join(src, f'{cls}_{pose}-0.jpg')
            if not os.path.exists(path): continue
            n = GRID.get(cls, {}).get(pose)
            if n:
                import tempfile
                im = Image.open(path).convert('RGB'); cw = im.width / n; fr = []
                for k in range(n):
                    tmp = os.path.join(tempfile.gettempdir(), f'col_{cls}_{k}.png')
                    im.crop((int(k * cw), 0, int((k + 1) * cw), im.height)).save(tmp)
                    fr.append(max(frames(tmp), key=lambda f: f['img'].width * f['img'].height))
            else:
                fr = frames(path)
            for i in FLIP.get(cls, {}).get(pose, []):
                f = fr[i]; f['img'] = f['img'].transpose(Image.FLIP_LEFT_RIGHT); f['ax'] = f['img'].width - 1 - f['ax']
            keep = KEEP.get(cls, {}).get(pose)
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
