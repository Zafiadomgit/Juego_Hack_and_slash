"""Recorta una hoja de piezas (fondo transparente) en ficheros sueltos, por regiones conectadas de alfa.
Uso: python3 tools/art/slice_sheet.py hoja.png carpeta nombre1 nombre2 ...   (orden: filas de arriba abajo, de izquierda a derecha)"""
import sys
from collections import deque
from PIL import Image, ImageFilter
import numpy as np
src, out, names = sys.argv[1], sys.argv[2], sys.argv[3:]
im = Image.open(src).convert('RGBA')
A = np.array(im.getchannel('A').filter(ImageFilter.MaxFilter(9))) > 20
H, W = A.shape; lab = np.zeros((H, W), bool); comps = []
for y in range(0, H, 2):
    for x in range(0, W, 2):
        if A[y, x] and not lab[y, x]:
            q = deque([(y, x)]); lab[y, x] = True; x0 = x1 = x; y0 = y1 = y; c = 0
            while q:
                cy, cx = q.popleft(); c += 1
                x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and A[ny, nx] and not lab[ny, nx]: lab[ny, nx] = True; q.append((ny, nx))
            comps.append((c, (x0, y0, x1 + 1, y1 + 1)))
boxes = [b for c, b in sorted(comps, reverse=True)[:len(names)]]
cy = sorted(((b[1] + b[3]) / 2) for b in boxes); gap = max(range(1, len(cy)), key=lambda i: cy[i] - cy[i - 1]) if len(cy) > 1 else 0
split = (cy[gap - 1] + cy[gap]) / 2 if gap else 1e9
boxes.sort(key=lambda b: (((b[1] + b[3]) / 2) > split, b[0]))
for n, b in zip(names, boxes):
    t = im.crop(b); t = t.crop(t.getbbox())
    k = min(1, 300 / max(t.size)); t = t.resize((round(t.width * k), round(t.height * k)), Image.LANCZOS) if k < 1 else t
    t.save(f'{out}/{n}.webp', quality=90, method=6); print(n, b, t.size)
