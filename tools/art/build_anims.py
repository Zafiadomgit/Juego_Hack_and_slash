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
    'iop': ('Rompeyelmos', {'walk': (0, [3, 4, 5, 6, 7, 8, 9, 10]), 'idle': (1, None), 'attack': (2, None), 'hurt': (3, None)}),
    'cra': ('Ojo de halcon', {'walk': (0, [4, 5, 6, 7, 8, 9, 10, 11]), 'idle': (1, None), 'attack': (3, [0, 1, 2, 4, 5]), 'hurt': (2, None)}),
    'feca': ('Arcanista', {'walk': (1, None), 'idle': (2, None), 'attack': (0, [2, 3, 4, 5, 6]), 'hurt': (3, None)}),
    'sombra': ('Assasin', {'walk': (3, None), 'idle': (2, None), 'attack': (1, [0, 1, 3]), 'hurt': (0, None)}),
    'domadora': ('summoner', {'walk': (0, [0, 1, 2, 3, 5, 6, 7]), 'idle': (1, None), 'attack': (3, None), 'hurt': (2, None)}),
    'artificiera': ('Bomber', {'walk': (3, None), 'idle': (2, None), 'attack': (0, None), 'hurt': (1, None)}),
    'berserker': ('Berserker', {'walk': (0, [0, 1, 3, 5, 6]), 'idle': (1, None), 'attack': (2, None), 'hurt': (3, None)}),
}


def shrink(im, s):
    w, h = max(1, round(im.width * s)), max(1, round(im.height * s))
    a = np.asarray(im).astype(np.float32)
    pm = a.copy(); pm[:, :, :3] *= a[:, :, 3:4] / 255
    r = np.asarray(Image.fromarray(pm.astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(np.float32)
    al = r[:, :, 3:4]
    rgb = np.where(al > 0, r[:, :, :3] * 255 / np.maximum(al, 1), 0)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.where(al[:, :, 0] > 110, 255, 0)]).astype(np.uint8))


def build(src, www):
    out_dir = os.path.join(www, 'img/heroes/anim'); os.makedirs(out_dir, exist_ok=True)
    data = {}
    for cls, (folder, poses) in PLAN.items():
        sheets = sorted(glob.glob(os.path.join(src, folder, '*', '*.jpg')))
        placed = []
        for pose, (si, keep) in poses.items():
            fr = frames(sheets[si])
            if keep is not None: fr = [fr[i] for i in keep]
            s = BODY_PX / float(np.median([f['bh'] for f in fr]))
            for f in fr:
                placed.append((pose, shrink(f['img'], s), f['ax'] * s, f['ay'] * s))
        W = 1024; x = y = rowh = 0; rects = []
        for pose, im, ax, ay in placed:
            if x + im.width + 2 > W: x = 0; y += rowh + 2; rowh = 0
            rects.append((pose, im, x, y, ax, ay)); x += im.width + 2; rowh = max(rowh, im.height)
        atlas = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
        entry = {'bh': BODY_PX}
        for pose, im, px, py, ax, ay in rects:
            atlas.paste(im, (px, py))
            entry.setdefault(pose, []).append([px, py, im.width, im.height, round(ax, 1), round(ay, 1)])
        atlas.save(os.path.join(out_dir, cls + '.png'), optimize=True)
        data[cls] = entry
        print(cls, atlas.size, {k: len(v) for k, v in entry.items() if k != 'bh'})
    with open(os.path.join(www, 'js/anim_data.js'), 'w') as f:
        f.write('/* Generado por tools/art/build_anims.py — no editar a mano. */\n')
        f.write("'use strict';\n")
        f.write('const HERO_ANIM = ' + json.dumps(data, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
