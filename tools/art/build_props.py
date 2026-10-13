"""Fendaria — empaqueta los objetos de escenario recortados en un atlas por bioma.

Uso: python3 build_props.py <carpeta_de_recortes>[:<otra>...] <salida_www>
  <carpeta_de_recortes> contiene subcarpetas gN-K/NN.png (salida de extract.py, una por hoja generada).
  Escribe <salida_www>/img/props/<bioma>.png y <salida_www>/js/props_data.js
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage

# Altura en unidades de mundo de cada tipo de objeto (el juego la multiplica por la escala del objeto)
WORLD_H = {'tree': 124, 'pillar': 88, 'rock': 46, 'crystal': 58, 'brazier': 52,
           'fern': 22, 'bones': 20, 'shroom': 22, 'skull': 26, 'shard': 20,
           # Villa Candela
           'house': 176, 'stall': 156, 'alchemy': 168, 'well': 100, 'lamp': 74, 'barrel': 30, 'bush': 40,
           'sign': 70, 'cauldron': 42, 'board': 88, 'oak': 128,
           'merchant': 64, 'alchemist': 76, 'vil0': 60, 'vil1': 54, 'vil2': 66, 'vil3': 44}
WU_PER_PX = 1.2  # densidad de píxel (≈ la del búfer HD-2D)

SEL = {
    'ceniza': {
        'tree': ['g0-0/00', 'g0-0/01', 'g0-1/00', 'g0-3/00'],
        'pillar': ['g0-0/02', 'g0-1/02', 'g0-1/03', 'g0-3/07'],
        'rock': ['g0-0/08', 'g0-0/09', 'g0-2/09', 'g0-2/11'],
        'crystal': ['g0-0/05', 'g0-3/04'],
        'brazier': ['g0-0/10', 'g0-3/10'],
        'fern': ['g0-0/13', 'g0-0/14', 'g0-0/15'],
        'bones': ['g0-0/16'],
    },
    'pantano': {
        'tree': ['g1-0/00', 'g1-1/00', 'g1-2/00', 'g1-3/02'],
        'pillar': ['g1-1/07', 'g1-0/04'],
        'rock': ['g1-1/06', 'g1-3/06', 'g1-0/08'],
        'crystal': ['g1-1/05', 'g1-1/04'],
        'shroom': ['g1-0/06', 'g1-0/07', 'g1-2/05', 'g1-2/08'],
    },
    'glaciar': {
        'tree': ['g2-0/00', 'g2-1/00', 'g2-2/00', 'g3-0/00', 'g3-2/00', 'g3-3/00'],
        'pillar': ['g2-0/04', 'g2-2/06', 'g2-3/09', 'g3-1/03'],
        'rock': ['g2-2/09', 'g2-3/12', 'g3-0/06', 'g3-2/07', 'g3-2/04'],
        'crystal': ['g2-0/02', 'g2-2/02', 'g3-0/03', 'g3-3/02'],
        'brazier': ['g2-1/08', 'g3-1/07', 'g3-2/08'],
        'shard': ['g2-3/05', 'g2-3/03', 'g2-3/06'],
    },
    'desierto': {
        'tree': ['g4-0/00', 'g4-0/01', 'g4-0/02', 'g4-3/00'],
        'pillar': ['g4-1/00', 'g4-1/01', 'g4-1/02', 'g4-2/00'],
        'rock': ['g4-0/10', 'g4-1/10', 'g4-1/09', 'g4-0/06'],
        'crystal': ['g4-0/04', 'g4-3/04', 'g4-1/05'],
        'brazier': ['g4-0/14', 'g4-1/12', 'g4-2/08'],
        'skull': ['g4-0/08', 'g4-1/14'],
    },
    'villa': {
        'house': ['v-1/00', 'v-1/01', 'v-3/00', 'v-2/03', 'v-1/03'],
        'stall': ['v-2/01'],
        'alchemy': ['v-1/02'],
        'well': ['v-3/07'],
        'lamp': ['v-1/04', 'v-1/09', 'v-3/09'],
        'barrel': ['v-3/15', 'v-3/14', 'v-3/12'],
        'bush': ['v-1/10'],
        'sign': ['v-2/11'],
        'cauldron': ['v-3/17'],
        'board': ['v-3/10'],
        'oak': ['v-3/13', 'v-2/09', 'v-0/10'],
        # vecinos (vil0 granjero, vil1 anciana, vil2 guardia, vil3 niño: mismo orden que VILLAGERS)
        'merchant': ['n2-0/00'], 'alchemist': ['n1-0/00'],
        'vil0': ['n0-0/00'], 'vil1': ['n0-0/02'], 'vil2': ['n0-0/01'], 'vil3': ['n0-0/03'],
    },
    'abismo': {
        'tree': ['g5-0/00', 'g5-0/03', 'g5-1/01'],
        'pillar': ['g5-0/05', 'g5-1/04', 'g5-1/07', 'g5-2/03'],
        'rock': ['g5-0/01', 'g5-0/02', 'g5-1/00', 'g5-2/05', 'g5-3/01'],
        'crystal': ['g5-1/02', 'g5-0/04', 'g5-2/01'],
        'brazier': ['g5-3/06', 'g5-3/07'],
    },
}


def clean(im):
    """Quita el reborde del color del fondo y recorta al contenido."""
    a = np.asarray(im.convert('RGBA')).copy()
    al = a[:, :, 3] > 0
    rgb = a[:, :, :3].astype(int)
    # tono granate/morado del fondo: rojo y azul altos frente al verde
    purple = (rgb[:, :, 0] > rgb[:, :, 1] + 25) & (rgb[:, :, 2] > rgb[:, :, 1] + 15) & (np.abs(rgb[:, :, 0] - rgb[:, :, 2]) < 70)
    edge = al & ~ndimage.binary_erosion(al, iterations=3)
    al &= ~(purple & edge)
    lab, n = ndimage.label(al)
    if n > 1:
        sizes = ndimage.sum(al, lab, range(1, n + 1))
        al = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > max(30, sizes.max() * 0.02)])
    a[:, :, 3] = np.where(al, 255, 0)
    ys, xs = np.where(al)
    return Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1])


def shrink(im, h):
    w = max(1, round(im.width * h / im.height))
    a = np.asarray(im).astype(np.float32)
    pm = a.copy(); pm[:, :, :3] *= a[:, :, 3:4] / 255
    s = np.asarray(Image.fromarray(pm.astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(np.float32)
    al = s[:, :, 3:4]
    rgb = np.where(al > 0, s[:, :, :3] * 255 / np.maximum(al, 1), 0)
    out = np.dstack([np.clip(rgb, 0, 255), np.where(al[:, :, 0] > 110, 255, 0)]).astype(np.uint8)
    return Image.fromarray(out)


def build(src, www):
    os.makedirs(os.path.join(www, 'img/props'), exist_ok=True)
    manifest = {}
    for biome, kinds in SEL.items():
        sprites = []
        for kind, names in kinds.items():
            for nm in names:
                path = next(p for p in (os.path.join(d, nm + '.png') for d in src.split(':')) if os.path.exists(p))
                im = clean(Image.open(path))
                h = max(8, round(WORLD_H[kind] / WU_PER_PX))
                sprites.append((kind, shrink(im, h)))
        # empaquetado en estantes
        W = 512; x = y = rowh = 0; places = []
        for kind, im in sorted(sprites, key=lambda t: -t[1].height):
            if x + im.width + 2 > W: x = 0; y += rowh + 2; rowh = 0
            places.append((kind, im, x, y)); x += im.width + 2; rowh = max(rowh, im.height)
        H = y + rowh
        atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        entry = {}
        for kind, im, px, py in places:
            atlas.paste(im, (px, py))
            entry.setdefault(kind, []).append([px, py, im.width, im.height])
        atlas.save(os.path.join(www, 'img/props', biome + '.png'), optimize=True)
        manifest[biome] = entry
        print(biome, W, 'x', H, {k: len(v) for k, v in entry.items()})
    with open(os.path.join(www, 'js/props_data.js'), 'w') as f:
        f.write('/* Generado por tools/art/build_props.py — no editar a mano. */\n')
        f.write("'use strict';\n")
        f.write('const PROP_WU_PER_PX = %s;\n' % WU_PER_PX)
        f.write('const PROP_ATLAS = ' + json.dumps(manifest, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
