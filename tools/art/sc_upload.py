"""Sube imágenes locales a SpriteCook y devuelve sus asset_id (para usarlas como referencia o para animarlas).
Uso: python3 tools/art/sc_upload.py ruta.png [ruta2.png ...]
"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
import spritecook as sc

def upload(path, pixel=True):
    ct = 'image/webp' if path.endswith('.webp') else 'image/png'
    r = sc.call('create_asset_upload', {'file_name': os.path.basename(path), 'content_type': ct, 'pixel': pixel, 'size_bytes': os.path.getsize(path)})
    r = r[0] if isinstance(r, list) else r
    req = urllib.request.Request(r['upload_url'], data=open(path, 'rb').read(), method='PUT', headers=r.get('headers') or r.get('upload_headers') or {'Content-Type': ct})
    urllib.request.urlopen(req, timeout=120).read()
    f = sc.call('finalize_asset_upload', {'upload_token': r['upload_token']})
    f = f[0] if isinstance(f, list) else f
    return f.get('asset_id') or f.get('id') or f

if __name__ == '__main__':
    sc.rpc('initialize', {'protocolVersion': '2025-03-26', 'capabilities': {}, 'clientInfo': {'name': 'fendaria', 'version': '1'}})
    for p in sys.argv[1:]: print(p, upload(p))
