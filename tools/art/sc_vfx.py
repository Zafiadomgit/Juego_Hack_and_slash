"""Fendaria — atlas de efectos (img/fx/vfx.png + js/vfx_data.js) a partir del arte de SpriteCook.

Los efectos se pintaron quietos (hojas vfxA/vfxB de sc_out); aquí se les dan los fotogramas girándolos,
haciéndolos crecer, subir o apagarse. El lobo trae su propia animación de carrera (vfx_wolf_tira.png).
Mismos nombres y número de fotogramas que el atlas anterior (tools/art/build_vfx.py), así que el juego no cambia.
Uso: python3 tools/art/sc_vfx.py
"""
import json, math, os
import numpy as np
from PIL import Image, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'sc_out'); WWW = os.path.join(HERE, '..', '..', 'www')
CELL = 112  # lado mayor de cada fotograma en el atlas


def tight(im):
    return im.crop(im.getbbox())


def grid_cells(path, n=3):
    """Efectos de una hoja en cuadrícula n×n (por filas), recortados a su contenido."""
    im = Image.open(path).convert('RGBA'); a = np.array(im)[..., 3] > 40
    cw, ch = im.width / n, im.height / n; out = []
    for r in range(n):
        for c in range(n):
            x0, y0 = int(c * cw), int(r * ch); m = a[y0:int(y0 + ch), x0:int(x0 + cw)]
            if m.sum() < cw * ch * 0.02: continue
            ys, xs = np.nonzero(m); out.append(im.crop((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)))
    return out


def fit(im, side=CELL):
    k = side / max(im.size)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.BOX)


def on_black(im):
    """El juego dibuja los efectos sumando luz: fondo negro y el color multiplicado por su opacidad."""
    a = np.array(im.convert('RGBA')).astype(np.float32)
    rgb = a[..., :3] * (a[..., 3:4] / 255.0)
    return Image.fromarray(rgb.clip(0, 255).astype(np.uint8), 'RGB')


def frame(base, size, scale=1.0, rot=0.0, dy=0.0, bright=1.0, alpha=1.0):
    """Un fotograma: el efecto escalado, girado y desplazado dentro de una celda de tamaño fijo."""
    W, H = size; im = base
    if scale != 1.0: im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.BOX)
    if rot: im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    if bright != 1.0: im = Image.merge('RGBA', (*ImageEnhance.Brightness(im.convert('RGB')).enhance(bright).split(), im.getchannel('A')))
    if alpha != 1.0: im.putalpha(im.getchannel('A').point(lambda v: int(v * alpha)))
    c = Image.new('RGBA', size)
    c.alpha_composite(im, ((W - im.width) // 2, int((H - im.height) // 2 + dy)))
    return on_black(c)


def anim(name, base):
    b = fit(base, CELL - 8); S = (b.width + 8, b.height + 8)  # celda fija por efecto: cabe el giro (efectos redondos) y el desplazamiento
    W, H = S
    if name == 'explosion':  # estalla: crece rápido y se apaga
        return [frame(b, S, s, bright=br, alpha=al) for s, br, al in [(0.45, 1.5, 1), (0.8, 1.3, 1), (1.0, 1.0, 0.85), (1.05, 0.7, 0.55)]]
    if name in ('runeBlue', 'runeFire'):  # gira y late
        return [frame(b, S, 0.92, rot=-i * 40 if name == 'runeBlue' else i * 40, bright=1 + 0.25 * math.sin(i / 9 * 6.283)) for i in range(9)]
    if name == 'shield':  # burbuja que respira y brilla
        return [frame(b, S, 0.94 + 0.05 * math.sin(i / 9 * 6.283), bright=1 + 0.3 * math.sin(i / 9 * 6.283 + 1)) for i in range(9)]
    if name in ('poison', 'rage'):  # burbujea / arde: pulso y parpadeo
        return [frame(b, S, 0.94 + 0.05 * math.sin(i / 9 * 6.283), bright=1 + 0.3 * math.sin(i / 9 * 12.566)) for i in range(9)]
    if name == 'heal':  # sube y se desvanece (el juego usa los 3 primeros)
        return [frame(b, S, 0.9, dy=-i * H * 0.06, bright=1.2 - i * 0.1, alpha=1 - i * 0.2) for i in range(4)]
    if name == 'ice':  # los cristales brotan y se rompen
        k = [0.35, 0.6, 0.85, 1.0, 1.0, 1.0, 0.95, 0.9, 0.85]; a = [1, 1, 1, 1, 0.95, 0.85, 0.65, 0.45, 0.25]
        return [frame(b, S, k[i], bright=1.3 if i == 3 else 1, alpha=a[i]) for i in range(9)]
    if name == 'smoke':  # sube girando y se deshace
        return [frame(b, S, 0.75 + i * 0.03, rot=math.sin(i) * 8, dy=-i * 2, alpha=1 - i * 0.09) for i in range(9)]
    if name == 'slash':  # el tajo aparece de un lado al otro y se apaga
        out = []
        for i in range(5):
            m = Image.new('L', b.size, 0); cut = int(b.width * min(1, (i + 1) / 3))
            m.paste(255, (0, 0, cut, b.height)); im = b.copy(); im.putalpha(Image.fromarray(np.minimum(np.array(b.getchannel('A')), np.array(m))))
            out.append(frame(im, S, bright=1.3 if i == 2 else 1, alpha=[1, 1, 1, 0.7, 0.35][i]))
        return out
    raise KeyError(name)


def wolf_frames():
    sh = Image.open(os.path.join(OUT, 'vfx_wolf_tira.png')).convert('RGBA'); fw = sh.height
    fr = [sh.crop((i * fw, 0, (i + 1) * fw, fw)) for i in range(sh.width // fw)]
    box = None
    for f in fr:  # caja común: el lobo no tiembla entre fotogramas
        bb = f.getbbox(); box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
    return [on_black(fit(f.crop(box))) for f in fr]


def main():
    names = json.load(open(os.path.join(OUT, 'vfx_nombres.json')))
    A = grid_cells(os.path.join(OUT, 'vfxA_raw.png'))
    assert len(A) == len(names['A']), len(A)
    B = Image.open(os.path.join(OUT, 'vfxB_raw.png')).convert('RGBA')
    slash = tight(B.crop((B.width * 3 // 5, 0, B.width, B.height))).rotate(90, expand=True)  # media luna tumbada, como la del atlas anterior
    stills = dict(zip(names['A'], A)); stills['slash'] = slash
    order = ['slash', 'explosion', 'runeBlue', 'runeFire', 'shield', 'poison', 'heal', 'ice', 'rage', 'smoke', 'wolf']
    placed = [(n, wolf_frames() if n == 'wolf' else anim(n, stills[n])) for n in order]
    W = 1024; x = y = rowh = 0; data = {}; rects = []
    for name, fr in placed:
        for f in fr:
            if x + f.width + 1 > W: x = 0; y += rowh + 1; rowh = 0
            rects.append((name, f, x, y)); x += f.width + 1; rowh = max(rowh, f.height)
    atlas = Image.new('RGB', (W, y + rowh), (0, 0, 0))
    for name, f, px, py in rects:
        atlas.paste(f, (px, py)); d = data.setdefault(name, {'w': f.width, 'h': f.height, 'f': []}); d['f'].append([px, py])
    atlas.save(os.path.join(WWW, 'img/fx/vfx.png'), optimize=True)
    with open(os.path.join(WWW, 'js/vfx_data.js'), 'w') as fh:
        fh.write('/* Generado por tools/art/sc_vfx.py — no editar a mano. */\n')
        fh.write("'use strict';\n")
        fh.write('const VFX_ATLAS = ' + json.dumps(data, separators=(',', ':')) + ';\n')
    print({k: (v['w'], v['h'], len(v['f'])) for k, v in data.items()}, 'atlas', atlas.size)


if __name__ == '__main__':
    main()
