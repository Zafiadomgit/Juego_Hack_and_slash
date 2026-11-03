"""Genera todos los iconos de la app a partir de una ilustración cuadrada (a sangre, sin texto).
Uso: python3 tools/art/make_icons.py ilustracion.png
  · Android: ic_launcher (cuadrado redondeado), ic_launcher_round (círculo) e ic_launcher_foreground
    (capa del icono adaptativo, 108 dp: la ilustración entera; el sistema muestra el centro con su máscara)
  · Google Play: store/icono_512.png · web: www/img/icon-192.png y icon-512.png
"""
import sys
from PIL import Image, ImageDraw

src = Image.open(sys.argv[1]).convert('RGB')
side = min(src.size); src = src.crop(((src.width - side) // 2, (src.height - side) // 2, (src.width + side) // 2, (src.height + side) // 2))
R = 'android/app/src/main/res/mipmap-'
DENS = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}

def fit(n): return src.resize((n, n), Image.LANCZOS)

def masked(n, shape):
    k = 4; big = Image.new('L', (n * k, n * k), 0); d = ImageDraw.Draw(big)
    if shape == 'round': d.ellipse((0, 0, n * k - 1, n * k - 1), fill=255)
    else: d.rounded_rectangle((0, 0, n * k - 1, n * k - 1), radius=int(n * k * 0.18), fill=255)
    out = fit(n).convert('RGBA'); out.putalpha(big.resize((n, n), Image.LANCZOS)); return out

for dens, n in DENS.items():
    masked(n, 'square').save(R + dens + '/ic_launcher.png')
    masked(n, 'round').save(R + dens + '/ic_launcher_round.png')
    # capa del adaptativo: lienzo de 108 dp por cada 48 dp del icono; la ilustración ocupa 86 dp en el centro,
    # así la máscara (≈72 dp visibles) enseña la cara, el hacha y parte del Portal en vez de solo la cara
    fg = round(n * 108 / 48); art = round(n * 86 / 48)
    layer = Image.new('RGBA', (fg, fg), (0, 0, 0, 0)); layer.paste(fit(art), ((fg - art) // 2, (fg - art) // 2))
    layer.save(R + dens + '/ic_launcher_foreground.png')
fit(512).save('store/icono_512.png')
fit(192).save('www/img/icon-192.png'); fit(512).save('www/img/icon-512.png')
print('iconos generados')
