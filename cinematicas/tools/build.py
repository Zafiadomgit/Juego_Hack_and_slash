"""Genera las 5 cinemáticas (compositions/cN-*.html) y el index.html que las encadena.
Cada cinemática: 4 planos de 6 s con Ken Burns, partículas, viñeta, franjas de cine y texto.
Uso: python3 tools/build.py        (español)
     python3 tools/build.py --en   (inglés: mismo montaje con los textos traducidos; render → cine_*_en.webm)
"""
import json, random, os, sys

EN = '--en' in sys.argv
TR = {
  'Prólogo': 'Prologue', 'El primer Sello': 'The first Seal', 'La verdad de Ivo': "Ivo's truth", 'Los Heraldos': 'The Heralds', 'La llave rota': 'The broken key',
  'Hace trescientos años, la Orden de las Runas selló el mal.': 'Three hundred years ago, the Order of Runes sealed away evil.',
  'Esta noche… la cerradura ha cedido.': 'Tonight… the lock has given way.',
  'Morvhal, el Cerrajero, quiere volver.': 'Morvhal, the Locksmith, wants to return.',
  'El guardián del bosque descansa al fin.': 'The guardian of the forest rests at last.',
  'Primer Sello: restaurado.': 'First Seal: restored.',
  '«Qué grosero… romper mi cerradura.»': '“How rude… breaking my lock.”',
  'Capítulo 2 · La ciénaga que susurra': 'Chapter 2 · The whispering swamp',
  'Doce runistas. Una noche entera cantando.': 'Twelve runecasters. A whole night of chanting.',
  'Solo uno sostuvo la última runa.': 'Only one held the last rune.',
  'Y esperó trescientos años a que llegaras tú.': 'And he waited three hundred years for you to come.',
  'Capítulo 4 · Las arenas de ámbar': 'Chapter 4 · The amber sands',
  'Los Doce han estado observando.': 'The Twelve have been watching.',
  'Nereth, Heraldo de la Marea.': 'Nereth, Herald of the Tide.',
  'Lysara, Heraldo del Prisma.': 'Lysara, Herald of the Prism.',
  'Acto II · Los Heraldos': 'Act II · The Heralds',
  'La llave… se rompe.': 'The key… breaks.',
  'Una a una, las Grietas se cierran.': 'One by one, the Rifts close.',
  'Y Villa Candela vuelve a amanecer.': 'And dawn returns to Candela Village.',
  'Siete héroes · Doce dioses · Un sello': 'Seven heroes · Twelve gods · One seal',
  'Fin del primer viaje · Gracias por jugar': 'End of the first journey · Thanks for playing',
}
T = (lambda s: TR.get(s, s)) if EN else (lambda s: s)
LOGO = 'logo_en.png' if EN else 'logo.png'

CINES = [
 ('c1-prologo', 'Prólogo', [
   ('f01', 'Hace trescientos años, la Orden de las Runas selló el mal.', 'out', 'dust', '255,210,140'),
   ('f02', 'Esta noche… la cerradura ha cedido.', 'in', 'sparks', '190,120,255', 'shake'),
   ('f03', 'Morvhal, el Cerrajero, quiere volver.', 'pan', 'sparks', '200,110,255'),
   ('f04', None, 'in', 'dust', '140,230,255', 'logo'),
 ]),
 ('c2-sello', 'El primer Sello', [
   ('f05', 'El guardián del bosque descansa al fin.', 'in', 'embers', '255,150,60', 'shake'),
   ('f06', 'Primer Sello: restaurado.', 'out', 'embers', '255,190,110'),
   ('f07', '«Qué grosero… romper mi cerradura.»', 'in', 'sparks', '200,110,255'),
   ('f08', 'Capítulo 2 · La ciénaga que susurra', 'in', 'fireflies', '150,255,140', 'title'),
 ]),
 ('c3-ivo', 'La verdad de Ivo', [
   ('f09', 'Doce runistas. Una noche entera cantando.', 'pan', 'snow', '230,240,255'),
   ('f10', 'Solo uno sostuvo la última runa.', 'out', 'snow', '200,230,255'),
   ('f11', 'Y esperó trescientos años a que llegaras tú.', 'pan', 'dust', '255,220,150'),
   ('f12', 'Capítulo 4 · Las arenas de ámbar', 'in', 'embers', '255,200,110', 'title'),
 ]),
 ('c4-heraldos', 'Los Heraldos', [
   ('f13', 'Los Doce han estado observando.', 'out', 'stars', '255,240,200'),
   ('f14', 'Nereth, Heraldo de la Marea.', 'up', 'bubbles', '140,220,255', 'shake'),
   ('f15', 'Lysara, Heraldo del Prisma.', 'pan', 'sparks', '230,170,255'),
   ('f16', 'Acto II · Los Heraldos', 'in', 'sparks', '170,140,255', 'title'),
 ]),
 ('c5-final', 'La llave rota', [
   ('f17', 'La llave… se rompe.', 'in', 'sparks', '255,220,120', 'flash'),
   ('f18', 'Una a una, las Grietas se cierran.', 'out', 'dust', '255,230,170'),
   ('f19', 'Y Villa Candela vuelve a amanecer.', 'pan', 'confetti', '255,220,160'),
   ('f20', None, 'out', 'stars', '255,220,150', 'end'),
 ]),
]
SHOT, N = 6.0, 4
DUR = SHOT * N

def particles(kind, rgb, rnd, n=34):
    out = []
    for i in range(n):
        x, y = rnd.uniform(0, 1920), rnd.uniform(0, 1080)
        s = rnd.uniform(3, 9) if kind != 'stars' else rnd.uniform(2, 5)
        if kind == 'snow': s = rnd.uniform(4, 10)
        if kind == 'confetti':
            col = rnd.choice(['255,90,90', '255,210,90', '120,200,255', '140,255,140', '255,150,220'])
        else: col = rgb
        out.append(dict(x=round(x), y=round(y), s=round(s, 1), c=col, d=round(rnd.uniform(0, 1), 3), sp=round(rnd.uniform(0.6, 1.4), 2)))
    return out

def comp(cid, title, shots):
    rnd = random.Random(cid)
    html, js = [], []
    for k, sh in enumerate(shots):
        img, text, cam, pk, rgb = sh[:5]
        text = T(text) if text else text
        fx = sh[5] if len(sh) > 5 else ''
        t0 = k * SHOT
        sid = f'{cid}-s{k}'
        parts = particles(pk, rgb, rnd)
        pdivs = ''.join(f'<i class="pt {pk}" id="{sid}-p{i}" style="left:{p["x"]}px;top:{p["y"]}px;width:{p["s"]}px;height:{p["s"]}px;--c:{p["c"]}"></i>' for i, p in enumerate(parts))
        cap = ''
        if fx == 'logo':
            cap = f'<img class="logo" id="{sid}-logo" src="assets/img/{LOGO}" alt=""><div class="sub" id="{sid}-sub">{T("Siete héroes · Doce dioses · Un sello")}</div>'
        elif fx == 'end':
            cap = f'<img class="logo" id="{sid}-logo" src="assets/img/{LOGO}" alt=""><div class="sub" id="{sid}-sub">{T("Fin del primer viaje · Gracias por jugar")}</div>'
        elif fx == 'title':
            cap = f'<div class="chap" id="{sid}-cap"><span class="rule"></span><b>{text}</b><span class="rule"></span></div>'
        else:
            cap = f'<div class="line" id="{sid}-cap">{text}</div>'
        html.append(f'''<div class="shot" id="{sid}">
  <div class="shk" id="{sid}-shk"><div class="cam" id="{sid}-cam"><img class="art" src="assets/img/{img}.jpg" alt=""></div></div>
  <div class="parts">{pdivs}</div>
  <div class="glow" id="{sid}-glow" style="--g:{rgb}"></div>
  {cap}
</div>''')
        # entrada y salida del plano (fundido cruzado de 0,8 s)
        js.append(f'tl.fromTo("#{sid}", {{opacity: 0}}, {{opacity: 1, duration: {0.01 if k == 0 else 0.8}, ease: "power1.inOut"}}, {t0 if k == 0 else t0 - 0.4});')
        if k < N - 1: js.append(f'tl.to("#{sid}", {{opacity: 0, duration: 0.8, ease: "power1.inOut"}}, {t0 + SHOT - 0.4});')
        # cámara (Ken Burns)
        span = SHOT + 0.8
        start = max(0, t0 - 0.4)
        mv = {'in': ('{scale: 1.0, x: 0, y: 0}', '{scale: 1.14, x: 0, y: -10}'),
              'out': ('{scale: 1.18, x: 0, y: -20}', '{scale: 1.02, x: 0, y: 0}'),
              'pan': ('{scale: 1.12, x: 70, y: 0}', '{scale: 1.12, x: -70, y: -8}'),
              'up': ('{scale: 1.12, x: 0, y: 60}', '{scale: 1.08, x: 0, y: -40}')}[cam]
        js.append(f'tl.fromTo("#{sid}-cam", {mv[0]}, {{...{mv[1]}, duration: {span}, ease: "sine.inOut"}}, {start});')
        if fx == 'shake':
            seq = [12, -10, 9, -7, 5, -3, 2, 0]
            prev = 0
            for j, v in enumerate(seq):
                js.append(f'tl.fromTo("#{sid}-shk", {{x: {prev}}}, {{x: {v}, duration: 0.06, ease: "none", immediateRender: false}}, {t0 + 1.6 + j * 0.06});')
                prev = v
        if fx == 'flash':
            js.append(f'tl.fromTo("#{cid}-flash", {{opacity: 0}}, {{opacity: 0.95, duration: 0.12, ease: "power2.in"}}, {t0 + 2.2});')
            js.append(f'tl.to("#{cid}-flash", {{opacity: 0, duration: 1.2, ease: "power2.out"}}, {t0 + 2.32});')
        # brillo ambiental que respira
        js.append(f'tl.fromTo("#{sid}-glow", {{opacity: 0.25}}, {{opacity: 0.6, duration: {SHOT / 2}, ease: "sine.inOut", repeat: 1, yoyo: true}}, {t0});')
        # partículas: suben (brasas, chispas, burbujas, luciérnagas) o caen (nieve, confeti)
        for i, p in enumerate(parts):
            fall = pk in ('snow', 'confetti')
            dy = (260 if fall else -260) * p['sp']; dx = 40 * (p['d'] - 0.5) * 2
            js.append(f'tl.fromTo("#{sid}-p{i}", {{x: 0, y: 0, opacity: 0}}, {{x: {round(dx)}, y: {round(dy)}, opacity: 1, duration: {span}, ease: "none"}}, {start});')
        # texto
        if fx in ('logo', 'end'):
            js.append(f'tl.fromTo("#{sid}-logo", {{opacity: 0, scale: 0.86, y: 20}}, {{opacity: 1, scale: 1, y: 0, duration: 1.4, ease: "power3.out"}}, {t0 + 1.0});')
            js.append(f'tl.fromTo("#{sid}-sub", {{opacity: 0, y: 16}}, {{opacity: 1, y: 0, duration: 0.9, ease: "power2.out"}}, {t0 + 2.2});')
        elif fx == 'title':
            js.append(f'tl.fromTo("#{sid}-cap", {{opacity: 0, scale: 1.18}}, {{opacity: 1, scale: 1, duration: 1.6, ease: "power3.out"}}, {t0 + 0.8});')
            js.append(f'tl.fromTo("#{sid}-cap .rule", {{scaleX: 0}}, {{scaleX: 1, duration: 1.0, ease: "power2.out"}}, {t0 + 1.2});')
        else:
            js.append(f'tl.fromTo("#{sid}-cap", {{opacity: 0, y: 24, filter: "blur(6px)"}}, {{opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power2.out"}}, {t0 + 0.9});')
            if k < N - 1: js.append(f'tl.to("#{sid}-cap", {{opacity: 0, duration: 0.5, ease: "power1.in"}}, {t0 + SHOT - 0.7});')
    js.append(f'tl.fromTo("#{cid}-fade", {{opacity: 1}}, {{opacity: 0, duration: 0.8, ease: "power1.out"}}, 0);')
    js.append(f'tl.to("#{cid}-fade", {{opacity: 1, duration: 1.0, ease: "power1.in"}}, {DUR - 1.0});')
    js.append(f'tl.fromTo("#{cid}-act", {{opacity: 0}}, {{opacity: 1, duration: 1.2, ease: "power1.out"}}, 0.6);')
    js.append(f'tl.to("#{cid}-act", {{opacity: 0, duration: 0.8, ease: "power1.in"}}, {DUR - 1.0});')
    style = f'''
#root {{ position: absolute; inset: 0; background: #07060c; overflow: hidden; }}
#root .shot {{ position: absolute; inset: 0; opacity: 0; }}
#root .shk {{ position: absolute; inset: 0; }}
#root .cam {{ position: absolute; inset: -60px; }}
#root .art {{ width: 100%; height: 100%; object-fit: cover; display: block; image-rendering: auto; }}
#root .parts {{ position: absolute; inset: 0; pointer-events: none; }}
#root .pt {{ position: absolute; border-radius: 50%; background: rgba(var(--c), 0.9); box-shadow: 0 0 10px 3px rgba(var(--c), 0.6); }}
#root .pt.snow {{ background: rgba(255, 255, 255, 0.85); box-shadow: 0 0 6px 1px rgba(220, 235, 255, 0.6); }}
#root .pt.confetti {{ border-radius: 2px; box-shadow: none; }}
#root .pt.stars {{ box-shadow: 0 0 12px 4px rgba(var(--c), 0.8); }}
#root .glow {{ position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 40%, rgba(var(--g), 0.35), transparent 60%); mix-blend-mode: screen; }}
#root .vig {{ position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(4, 3, 10, 0.78) 100%); }}
#root .bars::before, #root .bars::after {{ content: ""; position: absolute; left: 0; right: 0; height: 86px; background: #040308; }}
#root .bars::before {{ top: 0; }} #root .bars::after {{ bottom: 0; }}
#root .bars {{ position: absolute; inset: 0; pointer-events: none; }}
#root .line {{ position: absolute; left: 160px; right: 160px; bottom: 132px; text-align: center; font: 700 64px "EB Garamond", serif; color: #f6ecd2;
  text-shadow: 0 3px 0 #120c06, 0 0 24px rgba(0, 0, 0, 0.9), 0 0 60px rgba(0, 0, 0, 0.6); }}
#root .chap {{ position: absolute; left: 0; right: 0; top: 46%; display: flex; align-items: center; justify-content: center; gap: 30px; white-space: nowrap; font: 900 58px Cinzel, serif;
  color: #ecd18a; letter-spacing: 0.12em; text-transform: uppercase; text-shadow: 0 4px 0 #1a1006, 0 0 40px rgba(0, 0, 0, 0.9); }}
#root .chap .rule {{ display: block; width: 130px; height: 3px; background: #ecd18a; box-shadow: 0 0 12px rgba(236, 209, 138, 0.8); }}
#root .logo {{ position: absolute; left: 50%; top: 18%; width: 980px; margin-left: -490px; filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.8)); }}
#root .sub {{ position: absolute; left: 0; right: 0; bottom: 150px; text-align: center; font: 700 44px Cinzel, serif; letter-spacing: 0.16em; color: #f6ecd2;
  text-shadow: 0 3px 0 #120c06, 0 0 30px rgba(0, 0, 0, 0.9); }}
#root .act {{ position: absolute; left: 110px; top: 110px; font: 700 26px Cinzel, serif; letter-spacing: 0.3em; color: rgba(236, 209, 138, 0.9); text-transform: uppercase;
  text-shadow: 0 2px 8px #000; }}
#root .flash {{ position: absolute; inset: 0; background: #fff6d8; opacity: 0; }}
#root .fade {{ position: absolute; inset: 0; background: #040308; }}
'''
    return f'''<!doctype html>
<html lang="{'en' if EN else 'es'}">
  <head><meta charset="UTF-8" /><title>{title}</title></head>
  <body>
    <template>
      <style>
@font-face {{ font-family: Cinzel; font-weight: 700; src: url(assets/fonts/cinzel-latin-700-normal.woff2) format("woff2"); }}
@font-face {{ font-family: Cinzel; font-weight: 900; src: url(assets/fonts/cinzel-latin-900-normal.woff2) format("woff2"); }}
@font-face {{ font-family: "EB Garamond"; font-weight: 700; src: url(assets/fonts/eb-garamond-latin-700-normal.woff2) format("woff2"); }}
{style}
      </style>
      <div id="root" data-composition-id="{cid}" data-width="1920" data-height="1080" data-duration="{DUR:g}">
{chr(10).join(html)}
        <div class="vig"></div>
        <div class="bars"></div>
        <div class="flash" id="{cid}-flash"></div>
        <div class="fade" id="{cid}-fade"></div>
        <div class="act" id="{cid}-act">Fendaria · {T(title)}</div>
      </div>
      <script>
        const tl = gsap.timeline({{ paused: true }});
        {chr(10).join("        " + l for l in js).strip()}
        window.__timelines["{cid}"] = tl;
      </script>
    </template>
  </body>
</html>
'''

os.makedirs('compositions', exist_ok=True)
hosts, audios = [], []
for i, (cid, title, shots) in enumerate(CINES):
    open(f'compositions/{cid}.html', 'w').write(comp(cid, title, shots))
    hosts.append(f'''      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{i * DUR:g}" data-duration="{DUR:g}" data-track-index="0" data-width="1920" data-height="1080"></div>''')
    audios.append(f'''      <audio id="{cid}-music" src="assets/audio/c{i + 1}.ogg" data-start="{i * DUR:g}" data-duration="{DUR:g}" data-track-index="1" data-volume="0.9"></audio>''')
total = DUR * len(CINES)
open('index.html', 'w').write(f'''<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Fendaria · Cinemáticas</title>
    <script src="assets/js/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: #040308; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total:g}" data-width="1920" data-height="1080">
{chr(10).join(hosts)}
{chr(10).join(audios)}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
''')
print('ok', total)
