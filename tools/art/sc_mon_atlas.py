"""Atlas de animación de un monstruo a partir de las tiras de SpriteCook (sc_anim.py) → www/img/monsters/<id>.webp
y su entrada en MON_ANIM (www/js/mon_data.js). Sin reescalar: el pixelado queda tal cual sale.
Uso: python3 tools/art/sc_mon_atlas.py ID 'pose=tira.png:i,j,k' ...   (índices opcionales; por defecto todos)
Ej.:  python3 tools/art/sc_mon_atlas.py tofu idle=m_tofu_idle_tira.png move=m_tofu_move_tira.png:1,2,3,4,5,6,7 attack=m_tofu_attack_tira.png
Si no se da «hurt», se usa el primer fotograma de reposo (el destello del motor marca el golpe).
Una pose terminada en «!» (p. ej. «leap!=…») pega cada fotograma al suelo: el motor ya pone la altura del salto.
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


poses = {}; pinned = set()
for s in specs:
    pose, rest = s.split('=', 1)
    if pose.endswith('!'): pose = pose[:-1]; pinned.add(pose)
    path, _, idx = rest.partition(':')
    fr = frames(path)
    poses[pose] = [fr[int(i)] for i in idx.split(',')] if idx else fr
if 'hurt' not in poses: poses['hurt'] = [poses['idle'][0]]

# eje y suelo comunes (las tiras salen con el mismo encuadre): centro de los pies del primer fotograma de reposo
ref = np.array(poses['idle'][0])[..., 3] > 110
ground = max(int(np.nonzero(np.array(f)[..., 3] > 110)[0].max()) for p, fs in poses.items() if p not in pinned for f in fs) + 1
ys, xs = np.nonzero(ref[ground - 10:ground])
cx = float(xs.mean()) if len(xs) else ref.shape[1] / 2
bh = ground - int(np.nonzero(ref)[0].min())  # alto del cuerpo en reposo: el motor lo escala a su tamaño en el mundo

W = 1024; x = y = row = 0; placed = []; table = {'bh': bh}
for pose, fs in poses.items():
    table[pose] = []
    for f in fs:
        bb = f.getbbox(); t = f.crop(bb)
        if x + t.width > W: x = 0; y += row + 2; row = 0
        placed.append((t, x, y)); table[pose].append([x, y, t.width, t.height, round(cx - bb[0], 1), t.height if pose in pinned else round(ground - bb[1], 1)])
        x += t.width + 2; row = max(row, t.height)
atlas = Image.new('RGBA', (W, y + row), (0, 0, 0, 0))
for t, px, py in placed: atlas.alpha_composite(t, (px, py))
atlas.save(f'www/img/monsters/{ident}.webp', lossless=True, method=6)

p = 'www/js/mon_data.js'; src = open(p).read()
a = src.index('const MON_ANIM = ') + len('const MON_ANIM = '); b = src.index(';', a)
data = json.loads(src[a:b]); data[ident] = table
open(p, 'w').write(src[:a] + json.dumps(data, separators=(',', ':')) + src[b:])
print(ident, {k: len(v) for k, v in table.items() if k != 'bh'}, 'bh', bh, 'atlas', atlas.size)
