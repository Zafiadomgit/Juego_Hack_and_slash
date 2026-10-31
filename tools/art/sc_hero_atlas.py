"""Atlas de animación de un héroe a partir de las tiras de SpriteCook (sc_anim.py) → www/img/heroes/anim/<id>.webp
y su entrada en HERO_ANIM (www/js/anim_data.js). Sin reescalar: el pixelado queda tal cual sale.
Uso: python3 tools/art/sc_hero_atlas.py ID 'pose=tira.png:i,j,k' ...   (índices opcionales; por defecto todos)
Ej.:  python3 tools/art/sc_hero_atlas.py iop idle=kara_idle_tira.png walk=kara_walk2_tira.png:1,2,3,4,5,6,7 ...
"""
import json, os, sys
import numpy as np
from PIL import Image
OUT = os.path.join(os.path.dirname(__file__), 'sc_out')
ident, specs = sys.argv[1], sys.argv[2:]

def frames(path):
    sh = Image.open(path if os.path.exists(path) else os.path.join(OUT, path)).convert('RGBA')
    fw = sh.height  # fotogramas cuadrados
    return [sh.crop((i * fw, 0, i * fw + fw, sh.height)) for i in range(sh.width // fw)]

poses = {}
for s in specs:
    pose, rest = s.split('=', 1)
    path, _, idx = rest.partition(':')
    fr = frames(path)
    poses[pose] = [fr[int(i)] for i in idx.split(',')] if idx else fr

# eje y suelo comunes a todo el héroe (las tiras salen con el mismo encuadre): pies del primer fotograma de reposo
ref = np.array(poses.get('idle', next(iter(poses.values())))[0])[..., 3] > 110
ground = max(int(np.nonzero(np.array(f)[..., 3] > 110)[0].max()) for fs in poses.values() for f in fs) + 1
ys, xs = np.nonzero(ref[ground - 10:ground])
cx = float(xs.mean()) if len(xs) else ref.shape[1] / 2
idle_h = ground - int(np.nonzero(ref)[0].min())

W = 1024; x = y = row = 0; placed = []; table = {'bh': 136}  # 136 = alto de un héroe normal: los más grandes (Brann) se ven más altos
for pose, fs in poses.items():
    table[pose] = []
    for f in fs:
        bb = f.getbbox(); t = f.crop(bb)
        if x + t.width > W: x = 0; y += row + 2; row = 0
        placed.append((t, x, y)); table[pose].append([x, y, t.width, t.height, round(cx - bb[0], 1), round(ground - bb[1], 1)])
        x += t.width + 2; row = max(row, t.height)
atlas = Image.new('RGBA', (W, y + row), (0, 0, 0, 0))
for t, px, py in placed: atlas.alpha_composite(t, (px, py))
atlas.save(f'www/img/heroes/anim/{ident}.webp', lossless=True, method=6)

p = 'www/js/anim_data.js'; src = open(p).read()
a = src.index('const HERO_ANIM = ') + len('const HERO_ANIM = '); b = src.index(';', a)
data = json.loads(src[a:b]); data[ident] = table
open(p, 'w').write(src[:a] + json.dumps(data, separators=(',', ':')) + src[b:])
print(ident, {k: len(v) for k, v in table.items() if k != 'bh'}, 'bh', idle_h, 'atlas', atlas.size)
