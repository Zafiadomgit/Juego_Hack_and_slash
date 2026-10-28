"""Añade fotogramas de una hoja de SpriteCook (fila horizontal de N fotogramas cuadrados) a un atlas del juego
y sustituye una pose en la tabla de animación (HERO_ANIM en anim_data.js o MON_ANIM en mon_data.js).
Uso: python3 tools/art/sc_merge.py {hero|mon} ID POSE hoja.webp N escala "i,j,k..." [centro_x]
  escala: factor para pasar del tamaño de la hoja al del juego (p. ej. 0.5 si se subió al doble)
  índices: qué fotogramas de la hoja usar y en qué orden; centro_x: x del eje del personaje en el fotograma
"""
import json, sys
from PIL import Image
kind, ident, pose, sheet, n, scale, idxs = sys.argv[1:8]
n, scale, idxs = int(n), float(scale), [int(i) for i in idxs.split(',')]
data_js = 'www/js/anim_data.js' if kind == 'hero' else 'www/js/mon_data.js'
var = 'HERO_ANIM' if kind == 'hero' else 'MON_ANIM'
atlas_p = f'www/img/heroes/anim/{ident}.webp' if kind == 'hero' else f'www/img/monsters/{ident}.webp'
src = open(data_js).read()
a = src.index('const ' + var + ' = ') + len('const ' + var + ' = '); b = src.index(';\n', a) if ';\n' in src[a:] else len(src.rstrip()) - 1
table = json.loads(src[a:b])
sh = Image.open(sheet).convert('RGBA'); fw = sh.width // n; fh = sh.height
cx = float(sys.argv[8]) if len(sys.argv) > 8 else fw / 2
frames = [sh.crop((i * fw, 0, i * fw + fw, fh)) for i in idxs]
ground = max(f.getbbox()[3] for f in frames if f.getbbox())
atlas = Image.open(atlas_p).convert('RGBA')
# los fotogramas nuevos van en filas debajo de lo que ya hay
y0 = atlas.height + 2; x = 0; row_h = 0; placed = []
outs = []
for f in frames:
    bb = f.getbbox(); t = f.crop(bb)
    t = t.resize((max(1, round(t.width * scale)), max(1, round(t.height * scale))), Image.LANCZOS)
    if x + t.width > atlas.width: x = 0; y0 += row_h + 2; row_h = 0
    outs.append((t, x, y0)); placed.append([x, y0, t.width, t.height, round((cx - bb[0]) * scale, 1), round((ground - bb[1]) * scale, 1)])
    x += t.width + 2; row_h = max(row_h, t.height)
new = Image.new('RGBA', (atlas.width, y0 + row_h + 2), (0, 0, 0, 0)); new.alpha_composite(atlas, (0, 0))
for t, px, py in outs: new.alpha_composite(t, (px, py))
new.save(atlas_p, quality=92, method=6)
table[ident][pose] = placed
open(data_js, 'w').write(src[:a] + json.dumps(table, separators=(',', ':')) + src[b:])
print(ident, pose, len(placed), 'fotogramas ·', new.size)
