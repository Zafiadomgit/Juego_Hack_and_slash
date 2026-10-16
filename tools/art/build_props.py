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
           'house': 190, 'stall': 130, 'alchemy': 150, 'well': 100, 'lamp': 74, 'barrel': 30, 'bush': 40,
           'sign': 70, 'cauldron': 42, 'board': 92, 'oak': 150, 'forge': 120,
           'merchant': 64, 'alchemist': 76, 'vil0': 60, 'vil1': 54, 'vil2': 66, 'vil3': 44, 'smith': 68,
           # Mazmorra
           'bonepile': 30}
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
        'house': ['vh-0/00', 'vh-0/01', 'vh-0/02', 'vh-0/03'],
        'stall': ['vs-0/00'],
        'alchemy': ['vs-0/01'],
        'forge': ['vs-0/02'],
        'well': ['vs-0/04'],
        'lamp': ['v-1/04', 'v-1/09', 'v-3/09'],
        'barrel': ['v-3/15', 'v-3/14', 'v-3/12'],
        'bush': ['v-1/10'],
        'sign': ['v-2/11'],
        'cauldron': ['v-3/17'],
        'board': ['vs-0/05'],
        'oak': ['vs-0/03', 'v-3/13', 'v-2/09'],
        # vecinos (vil0 granjero, vil1 anciana, vil2 guardia, vil3 niño: mismo orden que VILLAGERS)
        'merchant': ['nn-merchant/00'], 'alchemist': ['nn-alchemist/00'],
        'vil0': ['nn-vil0/00'], 'vil1': ['nn-vil1/00'], 'vil2': ['nn-vil2/00'], 'vil3': ['nn-vil3/00'],
        'smith': ['nn-smith/00'],
    },
    # Mazmorra (solo se usa dentro de la Mazmorra: tree = jaulas, cadalsos y cadenas; rock = rocas y cofres)
    'dungeon': {
        'pillar': ['d-3/00', 'd-3/01', 'd-4/00', 'd-4/04', 'd-5/00', 'd-5/01', 'd-5/08', 'd-6/00', 'd-6/01'],
        'brazier': ['d-3/02', 'd-3/04', 'd-4/01', 'd-4/02', 'd-5/03', 'd-6/02', 'd-6/03'],
        'crystal': ['d-3/11', 'd-3/16', 'd-4/10', 'd-5/11', 'd-6/11'],
        'rock': ['d-3/10', 'd-4/11', 'd-4/13', 'd-5/12', 'd-5/13', 'd-6/12', 'd-3/15', 'd-4/15', 'd-5/15', 'd-6/10'],
        'tree': ['d-3/06', 'd-4/07', 'd-6/08', 'd-5/07', 'd-6/05', 'd-3/13', 'd-4/08'],
        'bonepile': ['d-3/07', 'd-3/08', 'd-4/09', 'd-5/09', 'd-6/07', 'd-3/03'],
    },
    'hundida': {
        'pillar': ['w0-0/00', 'w0-0/01', 'w0-0/02', 'w0-0/03'],
        'tree': ['w0-0/04', 'w0-0/05', 'w0-0/11'],
        'rock': ['w0-0/06', 'w0-0/07', 'w0-0/10', 'w0-0/12'],
        'crystal': ['w0-0/08'],
        'brazier': ['w0-0/09'],
    },
    'cristal': {
        'tree': ['w1-0/00', 'w1-0/01', 'w1-0/02', 'w1-0/11'],
        'crystal': ['w1-0/03', 'w1-0/04'],
        'rock': ['w1-0/05', 'w1-0/06', 'w1-0/10'],
        'brazier': ['w1-0/07'],
        'pillar': ['w1-0/08'],
        'shroom': ['w1-0/09'],
    },
    'ciudadela': {
        'pillar': ['w2-0/01', 'w2-0/02', 'w2-0/03', 'd-5/00', 'd-6/00'],
        'tree': ['d-3/06', 'd-4/07', 'd-6/08', 'w2-0/08'],
        'rock': ['w2-0/04', 'd-3/10', 'd-4/11'],
        'brazier': ['w2-0/06'],
        'crystal': ['w2-0/07'],
        'bonepile': ['w2-0/09', 'd-3/07', 'd-4/09'],
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
    # restos del fondo magenta encerrados dentro del objeto (bajo toldos, entre telas)
    al &= ~((rgb[:, :, 0] > 185) & (rgb[:, :, 2] > 185) & (rgb[:, :, 1] < 95))
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
