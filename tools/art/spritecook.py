"""Cliente mínimo del MCP de SpriteCook (https://api.spritecook.ai/mcp/).
La clave se lee de SPRITECOOK_API_KEY o de ~/.config/fendaria/spritecook.env (nunca va al repositorio).
Uso:  python3 tools/art/spritecook.py tools            -> lista de herramientas
      python3 tools/art/spritecook.py call NOMBRE '{json}'
"""
import json, os, sys, urllib.request

URL = 'https://api.spritecook.ai/mcp/'

def key():
    k = os.environ.get('SPRITECOOK_API_KEY')
    if k: return k
    p = os.path.expanduser('~/.config/fendaria/spritecook.env')
    for line in open(p):
        if line.startswith('SPRITECOOK_API_KEY='): return line.split('=', 1)[1].strip()
    raise SystemExit('falta SPRITECOOK_API_KEY')

_id = [0]
def rpc(method, params=None, timeout=300):
    _id[0] += 1
    body = json.dumps({'jsonrpc': '2.0', 'id': _id[0], 'method': method, 'params': params or {}}).encode()
    req = urllib.request.Request(URL, data=body, headers={'Authorization': 'Bearer ' + key(), 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'})
    raw = urllib.request.urlopen(req, timeout=timeout).read().decode()
    if raw.lstrip().startswith('{'): msg = json.loads(raw)
    else:  # text/event-stream: la última línea data:
        datas = [l[5:].strip() for l in raw.splitlines() if l.startswith('data:')]
        msg = json.loads(datas[-1])
    if 'error' in msg: raise RuntimeError(msg['error'])
    return msg['result']

def call(name, args):
    r = rpc('tools/call', {'name': name, 'arguments': args})
    out = []
    for c in r.get('content', []):
        if c.get('type') == 'text':
            try: out.append(json.loads(c['text']))
            except Exception: out.append(c['text'])
        else: out.append(c)
    if r.get('structuredContent'): out.append(r['structuredContent'])
    return out[0] if len(out) == 1 else out

if __name__ == '__main__':
    rpc('initialize', {'protocolVersion': '2025-03-26', 'capabilities': {}, 'clientInfo': {'name': 'fendaria', 'version': '1'}})
    if sys.argv[1] == 'tools':
        for t in rpc('tools/list')['tools']:
            print('##', t['name']); print(t.get('description', '')); print(json.dumps(t.get('inputSchema', {}).get('properties', {}), ensure_ascii=False)[:1500]); print()
    elif sys.argv[1] == 'info':
        print(json.dumps(rpc('initialize', {'protocolVersion': '2025-03-26', 'capabilities': {}, 'clientInfo': {'name': 'fendaria', 'version': '1'}}).get('instructions'), ensure_ascii=False))
    elif sys.argv[1] == 'call':
        print(json.dumps(call(sys.argv[2], json.loads(sys.argv[3] if len(sys.argv) > 3 else '{}')), ensure_ascii=False, indent=1))
