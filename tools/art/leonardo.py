"""Fendaria — generar arte con Leonardo (clave en la variable LEONARDO_API_KEY; nunca se imprime).

Uso:
  python3 leonardo.py gen <salida_dir> <nombre> "<prompt>" [ancho alto n modelo]
      genera n imágenes y las guarda como <nombre>_K.png; quita el fondo (nobg) y guarda <nombre>_K_nobg.png
  python3 leonardo.py me    → tokens que quedan
"""
import sys, os, json, time, urllib.request

API = 'https://cloud.leonardo.ai/api/rest/v1'
KEY = os.environ.get('LEONARDO_API_KEY', '')
MODELS = {'phoenix': 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', 'lucid': '7b592283-e8a7-4c5a-9ba6-d18c31f258b9', 'pixel': 'e5a291b6-3990-495a-b1fa-7bd1864510a6'}


def req(method, path, body=None):
    r = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                               headers={'authorization': 'Bearer ' + KEY, 'content-type': 'application/json', 'accept': 'application/json'})
    with urllib.request.urlopen(r, timeout=120) as f:
        return json.load(f)


def wait_gen(gid):
    for _ in range(90):
        time.sleep(4)
        g = req('GET', '/generations/' + gid)['generations_by_pk']
        if g['status'] == 'COMPLETE':
            return g
        if g['status'] == 'FAILED':
            raise SystemExit('generación fallida')
    raise SystemExit('tiempo agotado')


def nobg(img_id):
    j = req('POST', '/variations/nobg', {'id': img_id})['sdNobgJob']['id']
    for _ in range(60):
        time.sleep(3)
        v = req('GET', '/variations/' + j)['generated_image_variation_generic']
        if v and v[0]['status'] == 'COMPLETE':
            return v[0]['url']
    return None


def gen(out, name, prompt, w=1024, h=1024, n=2, model='phoenix'):
    os.makedirs(out, exist_ok=True)
    body = {'prompt': prompt, 'modelId': MODELS.get(model, model), 'width': int(w), 'height': int(h), 'num_images': int(n)}
    if model in ('phoenix', 'lucid'):
        body.update({'contrast': 3.5, 'styleUUID': '111dc692-d470-4eec-b791-3475abac4c46'})  # estilo «Dynamic»
    gid = req('POST', '/generations', body)['sdGenerationJob']['generationId']
    g = wait_gen(gid)
    for k, im in enumerate(g['generated_images']):
        p = os.path.join(out, f'{name}_{k}.png')
        urllib.request.urlretrieve(im['url'], p)
        u = nobg(im['id'])
        if u:
            urllib.request.urlretrieve(u, os.path.join(out, f'{name}_{k}_nobg.png'))
        print(p)


if __name__ == '__main__':
    if sys.argv[1] == 'me':
        u = req('GET', '/me')['user_details'][0]
        print('tokens', u.get('subscriptionTokens'), 'api', u.get('apiPaidTokens'))
    elif sys.argv[1] == 'gen':
        gen(*sys.argv[2:])
