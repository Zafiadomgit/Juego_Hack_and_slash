"""Fendaria — monstruos de 2.ª generación (Leonardo): atlas por monstruo a partir de dos hojas.

Uso: python3 build_monsters2.py <carpeta_hojas> <salida_www> <id> [<id> ...]
  <carpeta_hojas> contiene <id>_move-0.jpg y <id>_attack-0.jpg (fondo magenta liso).
Escribe <www>/img/monsters/<id>.webp y actualiza esas entradas de MON_ANIM en <www>/js/mon_data.js
(el resto de monstruos se conserva).
"""
import sys, os, json, re
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from anim_frames import frames
from build_anims import shrink

BODY = 100


def load_cols(path, n):
    import tempfile
    im = Image.open(path).convert('RGB'); cw = im.width / n; out = []
    for k in range(n):
        t = os.path.join(tempfile.gettempdir(), f'mcol_{k}.png')
        im.crop((int(k * cw), 0, int((k + 1) * cw), im.height)).save(t)
        fr = frames(t)
        if fr: out.append(max(fr, key=lambda f: f['img'].width * f['img'].height))
    return out


def load(path, want=0):
    fr = frames(path)
    if want and len(fr) < want - 1: return load_cols(path, want)
    if not fr: return []
    # descarta trozos sueltos (efectos o restos): menos de un 35% del área del mayor
    big = max(f['img'].width * f['img'].height for f in fr)
    return [f for f in fr if f['img'].width * f['img'].height > big * 0.35]


def build(src, www, ids):
    out = os.path.join(www, 'img/monsters'); os.makedirs(out, exist_ok=True)
    dpath = os.path.join(www, 'js/mon_data.js')
    data = json.loads(re.search(r'MON_ANIM = (.*);', open(dpath).read()).group(1))
    for mid in ids:
        mv = load(os.path.join(src, f'{mid}_move-0.jpg'), 6)
        at = load(os.path.join(src, f'{mid}_attack-0.jpg'), 4)
        poses = {'move': mv, 'attack': at, 'hurt': at[:1] or mv[:1]}
        if mid.startswith('S_') or len(mv) >= 4: poses['idle'] = mv[:4]
        placed = []
        for pose, fr in poses.items():
            if not fr: continue
            # cada hoja viene a su propia escala: se normaliza por pose (altura mediana del cuerpo)
            s = BODY / float(np.median([f['bh'] for f in fr]))
            for f in fr:
                placed.append((pose, shrink(f['img'], s), f['ax'] * s, f['ay'] * s))
        W = 1024; x = y = rowh = 0; rects = []
        for pose, im, ax, ay in placed:
            if x + im.width + 2 > W: x = 0; y += rowh + 2; rowh = 0
            rects.append((pose, im, x, y, ax, ay)); x += im.width + 2; rowh = max(rowh, im.height)
        atlas = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
        entry = {'bh': BODY}
        for pose, im, px, py, ax, ay in rects:
            atlas.paste(im, (px, py))
            entry.setdefault(pose, []).append([px, py, im.width, im.height, round(ax, 1), round(ay, 1)])
        atlas.save(os.path.join(out, mid + '.webp'), quality=90, method=6)
        data[mid] = entry
        print(mid, atlas.size, {k: len(v) for k, v in entry.items() if k != 'bh'})
    with open(dpath, 'w') as f:
        f.write('/* Generado por tools/art/build_monsters.py y build_monsters2.py — no editar a mano. */\n')
        f.write("'use strict';\n")
        f.write('const MON_ANIM = ' + json.dumps(data, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2], sys.argv[3:])
