"""Iguala el tamaño de píxel de un sprite de SpriteCook al de Kara 6 (≈124 px de alto para un héroe).
Si el modelo devuelve un sprite demasiado grande (pixelado más fino), lo reduce por un factor entero, endurece el
alfa y limita la paleta para que vuelva a parecer pixel art. No cuesta créditos.
Uso: python3 tools/art/sc_norm.py entrada.png salida.png [factor=2]
"""
import sys
from PIL import Image

def norm(src, dst, k=2, colors=48):
    im = Image.open(src).convert('RGBA'); im = im.crop(im.getbbox())
    s = im.resize((im.width // k, im.height // k), Image.BOX)
    a = s.getchannel('A').point(lambda v: 255 if v > 110 else 0)
    rgb = s.convert('RGB').quantize(colors, dither=Image.Dither.NONE).convert('RGB'); rgb.putalpha(a)
    rgb.save(dst); return rgb.size

if __name__ == '__main__':
    print(norm(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2))
