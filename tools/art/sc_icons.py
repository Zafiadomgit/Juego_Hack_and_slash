"""Recorta una hoja de iconos de SpriteCook (cuadrícula de 3×3, fondo transparente; casillas vacías se saltan) en archivos de 72×72.
Orden: por filas de arriba abajo y, en cada fila, de izquierda a derecha.
Uso: python3 tools/art/sc_icons.py hoja.png nombre1,nombre2,... carpeta_salida
"""
import sys
import numpy as np
from PIL import Image

def slice_icons(path, names, out, size=72):
    im = Image.open(path).convert('RGBA'); al = np.array(im)[..., 3] > 40
    cw, ch = im.width / 3, im.height / 3; boxes = []
    for r in range(3):
        for c in range(3):
            x0, y0 = int(c * cw), int(r * ch); m = al[y0:int(y0 + ch), x0:int(x0 + cw)]
            if m.sum() < cw * ch * 0.02: continue  # casilla vacía
            ys, xs = np.nonzero(m); boxes.append((slice(y0 + ys.min(), y0 + ys.max() + 1), slice(x0 + xs.min(), x0 + xs.max() + 1)))
    if len(boxes) != len(names): raise SystemExit(f'{path}: {len(boxes)} iconos encontrados, esperaba {len(names)}')
    for b, n in zip(boxes, names):
        c = im.crop((b[1].start, b[0].start, b[1].stop, b[0].stop)); c = c.crop(c.getbbox())
        k = (size - 4) / max(c.size); c = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.BOX)
        al = c.getchannel('A').point(lambda v: 255 if v > 100 else 0)
        rgb = c.convert('RGB').quantize(48, dither=Image.Dither.NONE).convert('RGB'); rgb.putalpha(al)
        t = Image.new('RGBA', (size, size)); t.alpha_composite(rgb, ((size - rgb.width) // 2, (size - rgb.height) // 2))
        t.save(f'{out}/{n}.png'); print(n, t.size)

if __name__ == '__main__':
    slice_icons(sys.argv[1], sys.argv[2].split(','), sys.argv[3])
