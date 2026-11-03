"""Descarga la imagen original (1024 px, antes del procesado de pixel art) de un asset de SpriteCook.
Uso: python3 tools/art/sc_raw.py ASSET_ID salida.png
"""
import os, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
import spritecook as sc
m = sc.call('get_asset_metadata', {'asset_id': sys.argv[1], 'verbose': True}); m = m[0] if isinstance(m, list) else m
open(sys.argv[2], 'wb').write(urllib.request.urlopen(m['raw_url']).read()); print(sys.argv[2])
