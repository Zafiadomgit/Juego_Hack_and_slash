"""Genera sprites en el estilo elegido (Kara 6) con SpriteCook. Lanza varios trabajos a la vez y los descarga.
Uso: python3 tools/art/sc_gen.py lote.json   (lista de {name, prompt, ref?, size?, variations?})
Salida: tools/art/sc_out/<name>_<n>.png y los asset_id añadidos a tools/art/sc_out/ASSETS.md
"""
import json, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(__file__))
import spritecook as sc

STYLE = ['d8ed40a1-5e8f-4ebd-9728-47b5f6a96e79', 'fbfb538a-685e-4797-8695-4b264d4ba3aa']  # Kara 6 + encapuchado
SUFFIX = ' Clean readable silhouette, soft dithered shading, warm light from upper left, limited palette, crisp pixel edges. Low resolution pixel art like the style reference, chunky pixels.'
OUT = os.path.join(os.path.dirname(__file__), 'sc_out')

def one(job):
    args = {'prompt': job['prompt'] + SUFFIX, 'width': job.get('size', 128), 'height': job.get('size', 128),
            'variations': job.get('variations', 1), 'pixel': True, 'bg_mode': 'transparent',
            'model': 'gpt-image-2.5-sunburst', 'style_asset_ids': STYLE, 'wait_seconds': 90}
    if job.get('ref'): args['reference_asset_id'] = job['ref']
    r = sc.call('generate_game_art', args); r = r[0] if isinstance(r, list) else r
    while r.get('status') not in ('succeeded', 'failed'):
        r = sc.call('check_job_status', {'job_id': r['job_id'], 'wait_seconds': 60}); r = r[0] if isinstance(r, list) else r
    lines = []
    for i, a in enumerate(r.get('assets', []), 1):
        p = f"{job['name']}_{i}.png"; open(os.path.join(OUT, p), 'wb').write(urllib.request.urlopen(a['sprite_url']).read())
        lines.append(f"- {p} ({a['width']}×{a['height']}) → {a['asset_id']}")
    return job['name'], r.get('status'), r.get('credits_used'), r.get('credits_remaining'), lines

if __name__ == '__main__':
    sc.rpc('initialize', {'protocolVersion': '2025-03-26', 'capabilities': {}, 'clientInfo': {'name': 'fendaria', 'version': '1'}})
    jobs = json.load(open(sys.argv[1]))
    with ThreadPoolExecutor(5) as ex: res = list(ex.map(one, jobs))
    with open(os.path.join(OUT, 'ASSETS.md'), 'a') as f:
        f.write(f"\n## {os.path.basename(sys.argv[1])} — gpt-image-2.5-sunburst, estilo Kara 6\n")
        for name, st, cu, cr, lines in res:
            print(name, st, cu, 'quedan', cr); f.write('\n'.join(lines) + '\n')
