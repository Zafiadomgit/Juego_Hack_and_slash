"""Lanza animaciones de SpriteCook a la vez, espera a que terminen y descarga las tiras.
Uso: python3 tools/art/sc_anim.py lote.json   (lista de {name, asset_id, prompt, frames?, model?})
Salida: tools/art/sc_out/<name>.webp (animada) y <name>_tira.png (fotogramas en fila)
Si una entrada trae job_id, no se lanza de nuevo (no se paga dos veces): solo se espera y se descarga.
"""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import spritecook as sc
OUT = os.path.join(os.path.dirname(__file__), 'sc_out')

def first(r): return r[0] if isinstance(r, list) else r

def call(name, args, tries=5):
    """Llamada con reintentos ante cortes de red (solo para consultas: lanzar un trabajo no se reintenta)."""
    for i in range(tries):
        try: return sc.call(name, args)
        except Exception:
            if i == tries - 1: raise
            time.sleep(5 * (i + 1))

def urls(o, acc):
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str) and v.startswith('http') and ('url' in k): acc.append((k, v))
            else: urls(v, acc)
    elif isinstance(o, list):
        for v in o: urls(v, acc)
    return acc

def fetch(url, tries=5):
    for i in range(tries):
        try: return urllib.request.urlopen(url, timeout=120).read()
        except Exception:
            if i == tries - 1: raise
            time.sleep(5 * (i + 1))

def one(job):
    jp = os.path.join(OUT, job['name'] + '_job.json')
    if os.path.exists(os.path.join(OUT, job['name'] + '_tira.png')) and not job.get('redo'): return job['name'], 'ya estaba', None, None
    if not job.get('job_id') and os.path.exists(jp): job = dict(job, job_id=json.load(open(jp))['job_id'])  # ya lanzado antes
    if job.get('job_id'): r = {'job_id': job['job_id']}
    else: r = first(sc.call('animate_game_art', {'asset_id': job['asset_id'], 'prompt': job['prompt'], 'auto_enhance_prompt': False,
        'output_frames': job.get('frames', 8), 'model': job.get('model', 'pixel-engine-v1.1'), 'output_format': 'webp', 'wait_seconds': 0}))
    jid = r.get('job_id')
    jp = os.path.join(OUT, job['name'] + '_job.json')
    if not os.path.exists(jp): json.dump({'job_id': jid, 'status': 'submitted'}, open(jp, 'w'))  # para recogerlo si algo se corta
    while r.get('status') not in ('succeeded', 'completed', 'failed', 'error'):
        time.sleep(15); r = first(call('check_job_status', {'job_id': jid}))
    json.dump(r, open(os.path.join(OUT, job['name'] + '_job.json'), 'w'), indent=1)
    if r.get('status') in ('failed', 'error'): return job['name'], r.get('status'), r.get('error'), None
    u = [v for k, v in urls(r, []) if 'webp' in v or 'sprite' in k or 'url' == k] or [v for _, v in urls(r, [])]
    p = os.path.join(OUT, job['name'] + '.webp'); open(p, 'wb').write(fetch(u[0]))
    im = Image.open(p); fr = []
    for i in range(getattr(im, 'n_frames', 1)): im.seek(i); fr.append(im.convert('RGBA').copy())
    strip = Image.new('RGBA', (fr[0].width * len(fr), fr[0].height))
    for i, f in enumerate(fr): strip.alpha_composite(f, (i * f.width, 0))
    strip.save(os.path.join(OUT, job['name'] + '_tira.png'))
    return job['name'], r.get('status'), r.get('credits_used'), len(fr)

if __name__ == '__main__':
    sc.rpc('initialize', {'protocolVersion': '2025-03-26', 'capabilities': {}, 'clientInfo': {'name': 'fendaria', 'version': '1'}})
    with ThreadPoolExecutor(5) as ex: res = list(ex.map(one, json.load(open(sys.argv[1]))))
    for x in res: print(*x)
