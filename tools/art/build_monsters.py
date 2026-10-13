"""Fendaria — atlas de animación de monstruos, jefes y súper jefes.

Uso: python3 build_monsters.py <carpeta con las 55 hojas (generation_*)> <salida_www> [preview.png]
Las hojas van en el orden en que se generaron (ver PLAN). Escribe img/monsters/<id>.png y js/mon_data.js
"""
import sys, os, glob, json
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from anim_frames import frames, frames_grid
from build_anims import shrink

BODY = 100  # altura de referencia del cuerpo en el atlas (px)
# id: {pose: (índice de hoja, fotogramas o None)}; los súper jefes van como S_<bioma>
PLAN = {
    'tofu':         {'move': (0, None), 'attack': (1, None), 'hurt': (2, [0])},
    'bouftou':      {'move': (3, None), 'attack': (4, 'grid5x1'), 'hurt': (5, None)},
    'arakne':       {'move': (6, None), 'attack': (6, [1, 3]), 'hurt': (7, None)},
    'pissenlit':    {'move': (8, None), 'attack': (9, None), 'hurt': (10, None)},
    'craqueleur':   {'move': (12, None), 'attack': (11, None), 'hurt': (13, [0])},
    'bouftouRoyal': {'move': (14, None), 'attack': (15, None), 'hurt': (16, [1]), 'idle': (21, None)},
    'reinaTeje':    {'move': (17, None), 'attack': (18, None), 'hurt': (19, None), 'idle': (20, None)},
    'colosoHielo':  {'move': (22, None), 'attack': (23, None), 'hurt': (24, None), 'idle': (25, None)},
    'tofuRoyal':    {'move': (26, None), 'attack': (27, None), 'hurt': (29, None), 'idle': (30, None)},
    'hechicero':    {'move': (31, None), 'attack': (32, None), 'hurt': (33, None), 'idle': (34, None)},
    'S_ceniza':     {'move': (35, None), 'attack': (36, None), 'hurt': (37, [1]), 'idle': (38, None)},
    'S_pantano':    {'move': (39, 'grid6x2'), 'attack': (40, None), 'hurt': (41, [0]), 'idle': (42, None)},
    'S_glaciar':    {'move': (43, None), 'attack': (44, None), 'hurt': (45, None), 'idle': (46, None)},
    'S_desierto':   {'move': (47, None), 'attack': (48, None), 'hurt': (49, None), 'idle': (50, None)},
    'S_abismo':     {'move': (51, None), 'attack': (52, None), 'hurt': (53, None), 'idle': (54, None)},
}


def build(src, www, preview=None):
    sheets = sorted(glob.glob(os.path.join(src, 'generation_*', '*.*')))
    assert len(sheets) >= 55, len(sheets)
    out = os.path.join(www, 'img/monsters'); os.makedirs(out, exist_ok=True)
    data = {}; prev_rows = []
    cache = {}
    for mid, poses in PLAN.items():
        placed = []
        for pose, (si, keep) in poses.items():
            if isinstance(keep, str):
                c, r = map(int, keep[4:].split('x')); fr = frames_grid(sheets[si], c, r)
            else:
                if si not in cache: cache[si] = frames(sheets[si])
                fr = cache[si]
                if keep is not None: fr = [fr[i] for i in keep if i < len(fr)]
            s = BODY / float(np.median([f['bh'] for f in fr]))
            for f in fr: placed.append((pose, shrink(f['img'], s), f['ax'] * s, f['ay'] * s))
        W = 1024; x = y = rowh = 0; rects = []
        for pose, im, ax, ay in placed:
            if x + im.width + 2 > W: x = 0; y += rowh + 2; rowh = 0
            rects.append((pose, im, x, y, ax, ay)); x += im.width + 2; rowh = max(rowh, im.height)
        atlas = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
        entry = {'bh': BODY}
        for pose, im, px, py, ax, ay in rects:
            atlas.paste(im, (px, py))
            entry.setdefault(pose, []).append([px, py, im.width, im.height, round(ax, 1), round(ay, 1)])
        atlas.save(os.path.join(out, mid + '.webp'), quality=92, method=6)
        data[mid] = entry
        print(mid, atlas.size, {k: len(v) for k, v in entry.items() if k != 'bh'})
        if preview:
            strip = Image.new('RGB', (len(rects) * 70 + 90, 90), (34, 38, 52)); d = ImageDraw.Draw(strip)
            d.text((2, 2), mid, fill=(255, 230, 120))
            for i, (pose, im, px, py, ax, ay) in enumerate(rects):
                k = 80 / max(im.height, 60); t = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))))
                strip.paste(t, (90 + i * 70 + 35 - int(ax * k), 86 - int(ay * k)), t)
                d.text((90 + i * 70, 78), pose[0], fill=(200, 200, 200))
            prev_rows.append(strip)
    with open(os.path.join(www, 'js/mon_data.js'), 'w') as fh:
        fh.write('/* Generado por tools/art/build_monsters.py — no editar a mano. */\n')
        fh.write("'use strict';\n")
        fh.write('const MON_ANIM = ' + json.dumps(data, separators=(',', ':')) + ';\n')
    if preview:
        Wp = max(r.width for r in prev_rows); c = Image.new('RGB', (min(Wp, 2400), sum(r.height for r in prev_rows)), (20, 20, 30)); yy = 0
        for r in prev_rows: c.paste(r, (0, yy)); yy += r.height
        c.save(preview)


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
