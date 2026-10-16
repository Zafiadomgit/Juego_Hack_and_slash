"""Fendaria — recorta una hoja de iconos en rejilla (fondo magenta) en PNG cuadrados con transparencia.

Uso: python3 cut_icons.py <hoja.jpg> <columnas> <filas> <nombre1,nombre2,...> <carpeta_salida> [tamaño=96]
Un nombre vacío o '-' salta esa celda.
"""
import sys, os, tempfile
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from anim_frames import frames
from build_anims import shrink

src, C, R, names, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(','), sys.argv[5]
N = int(sys.argv[6]) if len(sys.argv) > 6 else 96
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB')
cw, ch = im.width / C, im.height / R
for k, n in enumerate(names):
    if not n or n == '-': continue
    c = im.crop((int((k % C) * cw), int((k // C) * ch), int((k % C + 1) * cw), int((k // C + 1) * ch)))
    t = os.path.join(tempfile.gettempdir(), 'cut_icon.png'); c.save(t)
    fr = frames(t)
    if not fr: print('vacío', n); continue
    g = max(fr, key=lambda f: f['img'].width * f['img'].height)['img']
    s = (N - 4) / max(g.size)
    o = shrink(g, s)
    can = Image.new('RGBA', (N, N)); can.alpha_composite(o, ((N - o.width) // 2, (N - o.height) // 2))
    can.save(os.path.join(out, n + '.png'), optimize=True)
print('ok', len([n for n in names if n and n != '-']))
