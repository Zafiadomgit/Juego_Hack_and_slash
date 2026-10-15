"""Fendaria — genera imágenes con la API de Leonardo.ai.

Uso: LEONARDO_API_KEY=... python3 leonardo.py <trabajos.json> <carpeta_salida> [ids...]
  <trabajos.json>: {"estilo": "...", "negativo": "...", "modelo": "<id>", "ancho": 1024, "alto": 1024,
                    "trabajos": {"<id>": "<prompt>", ...}}
  Guarda <carpeta_salida>/<id>-<n>.png (num_images candidatos por trabajo). Si ya existen, se salta el trabajo.
"""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

API = 'https://cloud.leonardo.ai/api/rest/v1'
KEY = os.environ['LEONARDO_API_KEY']


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'Authorization': 'Bearer ' + KEY, 'content-type': 'application/json', 'accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def download(url, path):
    # el CDN rechaza el User-Agent por defecto de Python
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=120) as r, open(path, 'wb') as f:
        f.write(r.read())


def generate(job_id, prompt, cfg, out):
    if os.path.exists(os.path.join(out, job_id + '-0.png')):
        return job_id, 'ya existe'
    body = {'prompt': (cfg.get('estilo', '') + ' ' + prompt).strip(), 'modelId': cfg['modelo'],
            'width': cfg.get('ancho', 1024), 'height': cfg.get('alto', 1024), 'num_images': cfg.get('num', 2)}
    if cfg.get('negativo'): body['negative_prompt'] = cfg['negativo']
    if cfg.get('contraste'): body['contrast'] = cfg['contraste']
    gid = call('POST', '/generations', body)['sdGenerationJob']['generationId']
    for _ in range(90):
        time.sleep(4)
        g = call('GET', '/generations/' + gid)['generations_by_pk']
        if g['status'] == 'COMPLETE':
            for n, im in enumerate(g['generated_images']):
                download(im['url'], os.path.join(out, f'{job_id}-{n}.png'))
            return job_id, 'ok'
        if g['status'] == 'FAILED':
            return job_id, 'FALLÓ'
    return job_id, 'tiempo agotado'


def main():
    cfg = json.load(open(sys.argv[1], encoding='utf-8'))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    jobs = {k: v for k, v in cfg['trabajos'].items() if len(sys.argv) < 4 or k in sys.argv[3:]}
    with ThreadPoolExecutor(5) as ex:
        for job_id, st in ex.map(lambda kv: generate(kv[0], kv[1], cfg, out), jobs.items()):
            print(job_id, st, flush=True)


if __name__ == '__main__':
    main()
