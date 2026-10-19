"""Escribe boards/storyboard.html con los fotogramas de boards/stills (uno por plano)."""
import sys, os, glob
sys.path.insert(0, os.path.dirname(__file__))
from build import CINES
stills = sorted(glob.glob('boards/stills/frame-*.jpg'))
fx_name = {'logo': 'Logo', 'end': 'Cierre', 'title': 'Título', 'shake': 'Sacudida', 'flash': 'Destello'}
cards, i = [], 0
for k, (cid, title, shots) in enumerate(CINES):
    cards.append(f'<h2>{k+1}. {title} <small>· 24 s · tras {["el prólogo","el jefe 1","el jefe 3","el jefe 5","el jefe final"][k]}</small></h2><div class="row">')
    for j, s in enumerate(shots):
        fx = s[5] if len(s) > 5 else ''
        src = os.path.relpath(stills[i], 'boards'); i += 1
        cards.append(f'<figure><img src="{src}" alt=""><figcaption><b>{j*6}–{j*6+6} s</b> · cámara {s[2]} · {s[3]}{" · " + fx_name.get(fx, fx) if fx else ""}<br>{s[1] or "—"}</figcaption></figure>')
    cards.append('</div>')
open('boards/storyboard.html', 'w').write('''<!doctype html><html lang="es"><meta charset="utf-8"><title>Fendaria · Storyboard</title>
<style>body{background:#0c0a12;color:#eadfc6;font:15px Georgia,serif;margin:24px}h1{color:#ecd18a}h2{margin-top:32px;color:#ecd18a}small{color:#9a8f7a;font-weight:400}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}figure{margin:0;background:#171320;border-radius:8px;overflow:hidden}
img{width:100%;display:block}figcaption{padding:8px 10px;line-height:1.4}</style>
<h1>Fendaria — 5 cinemáticas (20 planos)</h1>''' + '\n'.join(cards) + '</html>')
print('ok', i)
