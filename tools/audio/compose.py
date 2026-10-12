"""Fendaria — compositor de la banda sonora.

Cada pista se describe con tempo, tonalidad, modo, progresión de acordes y capas
(colchón, arpegio, bajo, melodía, contramelodía y percusión). La melodía se genera
con frases A A' B A'' sobre los acordes (notas del acorde en tiempos fuertes y
pasos de escala en los débiles), con semilla fija para que siempre suene igual.
Uso: python3 compose.py <carpeta_salida>
"""
import os, sys, subprocess
import numpy as np
import synth as S

SCALES = {
    'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10],
    'harm': [0, 2, 3, 5, 7, 8, 11], 'hijaz': [0, 1, 4, 5, 7, 8, 10], 'lydian': [0, 2, 4, 6, 7, 9, 11],
}


def deg_note(root, scale, d):
    sc = SCALES[scale]
    o, i = divmod(d, 7)
    return root + 12 * o + sc[i]


def chord(root, scale, d, size=3):
    return [deg_note(root, scale, d + 2 * k) for k in range(size)]


RHYTHMS = [  # duraciones en corcheas para 2 compases (16 corcheas)
    [2, 1, 1, 2, 2, 4, 4], [3, 1, 2, 2, 2, 2, 4], [1, 1, 2, 1, 1, 2, 4, 4], [2, 2, 2, 2, 3, 1, 4],
    [4, 2, 2, 3, 1, 4], [1, 1, 1, 1, 2, 2, 4, 4], [2, 1, 1, 4, 2, 2, 4],
]


def make_melody(root, scale, prog, bars, rng, lo, hi, start_bar=0):
    """Devuelve [(compás_inicio_en_corcheas, duración_en_corcheas, nota_midi)]."""
    notes = []
    sc_notes = sorted({deg_note(root, scale, d) for d in range(-14, 21)})
    sc_notes = [n for n in sc_notes if lo <= n <= hi]
    prev = sc_notes[len(sc_notes) // 2]
    motifs = {}
    for ph in range(start_bar // 2, bars // 2):
        kind = ['A', 'A2', 'B', 'A3'][ph % 4]
        base = kind[0]
        if base not in motifs:
            motifs[base] = (RHYTHMS[rng.integers(len(RHYTHMS))], rng.integers(-2, 3, size=12))
        rhythm, contour = motifs[base]
        if kind == 'A3':  # cierre: última nota larga en la tónica
            rhythm = rhythm[:-1] + [rhythm[-1]]
        pos = ph * 16
        for k, dur in enumerate(rhythm):
            bar = (pos // 8) % len(prog)
            ch = chord(root, scale, prog[bar])
            strong = (pos % 4 == 0)
            if strong or dur >= 3:
                # nota del acorde más cercana a la anterior (desplazada por el contorno del motivo)
                target = prev + int(contour[k % 12]) * 2
                cands = [n for n in sc_notes if (n - ch[0]) % 12 in [(c - ch[0]) % 12 for c in ch]]
                note = min(cands, key=lambda n: abs(n - target)) if cands else prev
            else:
                step = int(np.sign(contour[k % 12]) or rng.choice([-1, 1]))
                i = min(range(len(sc_notes)), key=lambda j: abs(sc_notes[j] - prev))
                note = sc_notes[max(0, min(len(sc_notes) - 1, i + step))]
            if kind == 'A3' and k == len(rhythm) - 1:
                tonics = [n for n in sc_notes if (n - root) % 12 == 0]
                note = min(tonics, key=lambda n: abs(n - prev))
            notes.append((pos, dur, note))
            prev = note
            pos += dur
    return notes


def render_track(spec, out_wav):
    rng = np.random.default_rng(spec.get('seed', 1))
    bpm, bars = spec['bpm'], spec['bars']
    beat = 60 / bpm
    eighth = beat / 2
    root, scale, prog = spec['root'], spec['scale'], spec['prog']
    dur = bars * 4 * beat
    M = S.Mix(dur)
    bar_len = 4 * beat
    for b in range(bars):
        t0 = b * bar_len
        d = prog[b % len(prog)]
        ch = chord(root, scale, d, 4 if spec.get('sevenths') else 3)
        # colchón sostenido
        for name, octv, gain, *rest in spec.get('pads', []):
            fn = getattr(S, name)
            for k, n in enumerate(ch[:3]):
                M.add(fn(S.midi(n + 12 * octv), bar_len + 0.3), t0, gain / 3, pan=(-0.4, 0, 0.4)[k], verb=0.5)
        # arpegio
        for name, octv, gain, pattern, step in spec.get('arps', []):
            fn = getattr(S, name)
            steps = int(round(4 / step))
            for i in range(steps):
                idx = pattern[i % len(pattern)]
                if idx is None: continue
                n = ch[idx % len(ch)] + 12 * (octv + idx // len(ch))
                M.add(fn(S.midi(n), beat * step * 2.2), t0 + i * beat * step, gain, pan=0.25 * np.sin(i), verb=0.45)
        # bajo
        if 'bass' in spec:
            name, octv, gain, rhythm = spec['bass']
            fn = getattr(S, name)
            pos = 0.0
            for i, r in enumerate(rhythm):
                n = ch[0] + 12 * octv + (7 if i % 4 == 2 and spec.get('bass_fifth') else 0)
                M.add(fn(S.midi(n), r * beat * 0.95), t0 + pos * beat, gain, verb=0.1)
                pos += r
        # percusión: patrón de 16 semicorcheas
        for name, gain, pat, *kw in spec.get('drums', []):
            fn = getattr(S, name)
            for i, ch_ in enumerate(pat):
                if ch_ == '.': continue
                g = gain * (1.0 if ch_ in 'Xx' and ch_ == 'X' else 0.65)
                M.add(fn(g, **(kw[0] if kw else {})) if kw else fn(g), t0 + i * beat / 4, 1.0, pan=0.1 if name in ('hat', 'tek') else 0, verb=0.15)
        if spec.get('crash_every') and b % spec['crash_every'] == 0:
            M.add(S.cymbal(0.35), t0, 1.0, verb=0.3)
        if spec.get('timpani_every') and b % spec['timpani_every'] == spec['timpani_every'] - 1:
            for k in range(4):
                M.add(S.timpani(S.midi(ch[0] - 24), 0.5 + k * 0.15), t0 + 3 * beat + k * beat / 4, 1.0, verb=0.3)
    # melodías
    for mel in spec.get('melodies', []):
        name, gain, lo, hi, start, seed = mel
        fn = getattr(S, name)
        notes = make_melody(root, scale, prog, bars, np.random.default_rng(seed), lo, hi, start)
        for pos, d8, n in notes:
            M.add(fn(S.midi(n), d8 * eighth * 1.05), pos * eighth, gain, pan=-0.15, verb=0.55)
    st = M.render(loop=spec.get('loop', True), rt=spec.get('rt', 2.2), fade_out=spec.get('fade', 0.0))
    S.write_wav(out_wav, st)
    return dur


# ---------------- pistas ----------------
X = None
TRACKS = {
    # Pantalla de título: tema heroico y nostálgico (re mayor lidio), arpa + cuerdas + trompa
    'title': dict(bpm=72, bars=16, root=50, scale='lydian', prog=[0, 4, 5, 3, 0, 4, 1, 4], seed=3,
                  pads=[('strings', 0, 0.55)], arps=[('harp', 1, 0.22, [0, 1, 2, 3, 2, 1, 0, 1], 0.5)],
                  bass=('bass', -1, 0.35, [4]), melodies=[('flute', 0.32, 69, 86, 4, 21), ('brass', 0.16, 57, 74, 8, 22)],
                  timpani_every=8, rt=3.0),
    # Villa Candela: folk cálido (sol mayor), laúd, flauta, pandero ligero
    'village': dict(bpm=96, bars=16, root=55, scale='major', prog=[0, 3, 4, 0, 5, 3, 1, 4], seed=5,
                    pads=[('strings', -1, 0.25)], arps=[('lute', 0, 0.3, [0, 2, 1, 2, 0, 2, 1, 2], 0.5)],
                    bass=('pizz', -1, 0.45, [1, 1, 1, 1]), melodies=[('flute', 0.3, 67, 86, 2, 31)],
                    drums=[('tek', 0.22, 'x.x.x.x.x.x.x.x.'), ('doum', 0.4, 'X.......X.......')], rt=1.8),
    # Bosque Ceniciento: épico oscuro (mi menor), taikos, cuerdas en ostinato
    'ceniza': dict(bpm=112, bars=16, root=52, scale='minor', prog=[0, 5, 2, 6], seed=7,
                   pads=[('strings', -1, 0.35), ('choir', 0, 0.18)], arps=[('spic', 0, 0.22, [0, 1, 2, 1], 0.25)],
                   bass=('bass', -1, 0.45, [1.5, 0.5, 1, 1]), melodies=[('brass', 0.22, 59, 76, 4, 41)],
                   drums=[('taiko', 0.75, 'X.....x.X...x...'), ('snare', 0.22, '....X.......X..x'), ('hat', 0.12, 'x.x.x.x.x.x.x.x.')],
                   crash_every=8, rt=2.2),
    # Pantano Sombrío: misterioso (re dórico), marimba, coro, flauta de madera
    'pantano': dict(bpm=92, bars=16, root=50, scale='dorian', prog=[0, 3, 0, 6, 0, 3, 4, 6], seed=9,
                    pads=[('choir', 0, 0.28)], arps=[('marimba', 1, 0.3, [0, 2, 1, 2, 0, 2, 1, X], 0.5)],
                    bass=('bass', -1, 0.35, [2, 2]), melodies=[('flute', 0.26, 62, 81, 4, 51)],
                    drums=[('doum', 0.35, 'X.....X...X.....'), ('tek', 0.16, '..x...x...x...x.')], rt=2.8),
    # Glaciar Rúnico: celesta y campanas, cuerdas suaves (fa# menor relativa de la mayor)
    'glaciar': dict(bpm=84, bars=16, root=54, scale='minor', prog=[0, 5, 2, 6, 0, 5, 3, 4], seed=13,
                    pads=[('strings', 0, 0.4)], arps=[('celesta', 1, 0.24, [0, 1, 2, 3, 2, 3, 1, 2], 0.5)],
                    bass=('bass', -1, 0.3, [4]), melodies=[('flute', 0.28, 66, 85, 4, 61), ('bell', 0.12, 78, 92, 8, 62)],
                    timpani_every=8, rt=3.4),
    # Desierto de Ámbar: modo hijaz (mi), oud, darbuka y bordón
    'desierto': dict(bpm=116, bars=16, root=52, scale='hijaz', prog=[0, 1, 0, 6, 0, 1, 3, 0], seed=17,
                     pads=[('drone', -1, 0.3)], arps=[('oud', 0, 0.26, [0, X, 1, 0, X, 2, 1, X], 0.5)],
                     bass=('bass', -1, 0.35, [1.5, 1.5, 1]), melodies=[('oud', 0.36, 64, 83, 2, 71), ('flute', 0.16, 64, 83, 8, 72)],
                     drums=[('doum', 0.7, 'X..X..X.X..X..X.'), ('tek', 0.35, '..x...x...x.x.x.')], rt=1.8),
    # Abismo Volcánico: coro, metales graves y percusión pesada (do menor armónica)
    'abismo': dict(bpm=124, bars=16, root=48, scale='harm', prog=[0, 5, 3, 4], seed=19,
                   pads=[('choir', 0, 0.35), ('strings', -1, 0.3)], arps=[('spic', 0, 0.24, [0, 1, 2, 1, 0, 1, 2, 3], 0.25)],
                   bass=('bass', -1, 0.5, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]), melodies=[('brass', 0.26, 55, 72, 4, 81)],
                   drums=[('taiko', 0.85, 'X..x..X.X..x..X.'), ('kick', 0.5, 'X...X...X...X...'), ('snare', 0.25, '....X.......X...')],
                   crash_every=4, rt=2.4),
    # Guardianes: combate rápido (la menor armónica)
    'boss': dict(bpm=150, bars=16, root=57, scale='harm', prog=[0, 5, 6, 4], seed=23,
                 pads=[('strings', -1, 0.3)], arps=[('spic', 0, 0.28, [0, 0, 1, 0, 2, 0, 1, 0], 0.25)],
                 bass=('bass', -2, 0.5, [0.5] * 8), melodies=[('brass', 0.3, 64, 81, 2, 91)],
                 drums=[('kick', 0.6, 'X..x..X.X..x..X.'), ('snare', 0.4, '....X.......X..x'), ('hat', 0.16, 'xxxxxxxxxxxxxxxx'), ('taiko', 0.5, 'X.......X.......')],
                 crash_every=4, rt=1.8),
    # Súper Jefes: coro completo, timbales y aún más rápido (re menor armónica)
    'superboss': dict(bpm=160, bars=16, root=50, scale='harm', prog=[0, 5, 3, 4, 0, 5, 1, 4], seed=29,
                      pads=[('choir', 0, 0.4), ('strings', -1, 0.3)], arps=[('spic', 1, 0.24, [0, 1, 2, 1, 0, 1, 2, 3], 0.25)],
                      bass=('bass', -2, 0.55, [0.5] * 8), melodies=[('brass', 0.32, 62, 79, 2, 97), ('choir', 0.14, 62, 79, 8, 98)],
                      drums=[('kick', 0.65, 'X.x.X.x.X.x.X.xx'), ('snare', 0.4, '....X.......X.X.'), ('taiko', 0.6, 'X...X...X...X...'), ('hat', 0.14, 'xxxxxxxxxxxxxxxx')],
                      crash_every=2, timpani_every=4, rt=2.0),
    # Fanfarria de victoria y lamento de derrota (no se repiten)
    'victory': dict(bpm=110, bars=3, root=48, scale='major', prog=[4, 3, 0], seed=31, loop=False, fade=1.2,
                    pads=[('strings', 0, 0.5), ('brass', 0, 0.4)], arps=[('harp', 1, 0.25, [0, 1, 2, 3], 0.25)],
                    bass=('bass', -1, 0.4, [4]), timpani_every=1, rt=2.5),
    'defeat': dict(bpm=60, bars=2, root=45, scale='minor', prog=[5, 0], seed=37, loop=False, fade=1.5,
                   pads=[('strings', 0, 0.6), ('choir', 0, 0.25)], bass=('bass', -1, 0.35, [4]), rt=3.2),
}


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for name, spec in TRACKS.items():
        wav = os.path.join(out_dir, name + '.wav')
        dur = render_track(spec, wav)
        ogg = os.path.join(out_dir, name + '.ogg')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libvorbis', '-q:a', '3', ogg], check=True)
        os.remove(wav)
        print(f'{name:10s} {dur:5.1f}s  {os.path.getsize(ogg) // 1024} KB')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '../../www/audio/music')
