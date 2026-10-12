"""Música del tráiler (30 s) sincronizada con los cortes de trailer/index.html.
Uso: python3 trailer_music.py <salida.wav>
"""
import sys
import numpy as np
import synth as S
from compose import chord, deg_note, make_melody

DUR = 30.0
BEAT = 0.4            # 150 ppm: los cortes caen en el pulso (offset 0.2 s)
OFF = 0.2
M = S.Mix(DUR)
ROOT, SC = 50, 'minor'   # re menor


def at_beat(k):
    return OFF + k * BEAT


def pad(t0, dur, degree, inst='strings', octv=0, gain=0.35, size=3, root=ROOT, sc=SC):
    for k, n in enumerate(chord(root, sc, degree, size)):
        M.add(getattr(S, inst)(S.midi(n + 12 * octv), dur), t0, gain / size, pan=(-0.4, 0, 0.4, 0.2)[k], verb=0.6)


def ostinato(t0, t1, degree_fn, gain=0.22, octv=0):
    k = 0
    t = t0
    while t < t1 - 0.01:
        ch = chord(ROOT, SC, degree_fn(t))
        n = ch[[0, 0, 1, 0, 2, 0, 1, 0][k % 8]] + 12 * octv
        M.add(S.spic(S.midi(n), BEAT * 0.6), t, gain, pan=0.3 if k % 2 else -0.3, verb=0.3)
        t += BEAT / 2; k += 1


def drums(t0, t1, heavy=True):
    k = 0
    t = t0
    while t < t1 - 0.01:
        s = k % 16
        if s in (0, 6, 8, 14): M.add(S.taiko(0.9 if s == 0 else 0.6), t, 1.0, verb=0.2)
        if heavy and s in (0, 3, 8, 11): M.add(S.kick(0.7), t, 1.0, verb=0.05)
        if s in (4, 12): M.add(S.snare(0.5), t, 1.0, verb=0.15)
        if heavy: M.add(S.hat(0.12), t, 1.0, pan=0.2, verb=0.05)
        t += BEAT / 4; k += 1


def hit(t, big=1.0):
    M.add(S.impact(big), t, 0.9, verb=0.4)
    M.add(S.cymbal(0.4 * big), t, 1.0, verb=0.3)


# 1) Apertura: bordón grave, coro y notas de arpa sueltas
pad(0, 2.8, 0, 'drone', -1, 0.5)
pad(0.3, 2.5, 0, 'choir', 0, 0.3)
for i, n in enumerate([74, 77, 81, 79]):
    M.add(S.harp(S.midi(n), 1.6), 0.4 + i * 0.5, 0.2, verb=0.7)
M.add(S.whoosh(0.6, 0.6), 2.0, 1.0)

# 2) Portal: golpe, cuerdas que crecen y ostinato
hit(2.6)
pad(2.6, 2.5, 0, 'strings', 0, 0.45)
ostinato(3.0, 5.0, lambda t: 0, 0.18)
M.add(S.riser(1.6, 0.4), 3.4, 1.0)

# 3) Primer combate
hit(5.0, 0.8)
drums(5.0, 6.6)
ostinato(5.0, 6.6, lambda t: 5, 0.22)
pad(5.0, 1.6, 5, 'brass', -1, 0.3)

# 4) Héroes: golpe + acorde coral + motivo de metales distinto para cada uno
hero_degrees = [(0, [62, 69, 74]), (5, [65, 70, 77]), (3, [67, 74, 79])]
for i, t in enumerate([6.6, 8.6, 10.6]):
    d, motif = hero_degrees[i]
    M.add(S.whoosh(0.35, 0.6), t - 0.35, 1.0)
    hit(t, 0.9)
    pad(t, 2.0, d, 'choir', 0, 0.35)
    pad(t, 2.0, d, 'strings', -1, 0.3)
    for k, n in enumerate(motif):
        M.add(S.brass(S.midi(n), 0.5 if k < 2 else 1.1), t + 0.2 + k * 0.4, 0.3, verb=0.5)
    drums(t + 0.4, t + 2.0, heavy=False)

# 5) Montaje: tema de combate completo con melodía de metales
prog = [0, 5, 6, 4]
ostinato(12.6, 20.6, lambda t: prog[int((t - 12.6) / 2) % 4], 0.24)
drums(12.6, 20.6)
for k in range(4):
    t = 12.6 + k * 2
    hit(t, 0.7)
    pad(t, 2.0, prog[k], 'strings', -1, 0.32)
    root = chord(ROOT, SC, prog[k])[0]
    for j in range(8):
        M.add(S.bass(S.midi(root - 12), BEAT * 0.9), t + j * BEAT / 2 * 2, 0.45, verb=0.05)
mel = make_melody(ROOT, SC, prog, 8, np.random.default_rng(5), 62, 79, 0)
for pos, d8, n in mel:
    t = 12.6 + pos * BEAT / 2
    if t < 20.4:
        M.add(S.brass(S.midi(n), d8 * BEAT / 2 * 1.05), t, 0.28, pan=-0.1, verb=0.5)
M.add(S.whoosh(0.4, 0.5), 20.2, 1.0)

# 6) Tensión: grave, latidos y subida
hit(20.6, 0.5)
pad(20.6, 3.0, 0, 'drone', -2, 0.5)
for t in [21.0, 21.85, 22.6, 23.15]:
    for o, g in ((0, 1.0), (0.22, 0.7)):
        n = int(0.4 * S.SR); tt = np.arange(n) / S.SR
        M.add(np.sin(2 * np.pi * (55 * np.exp(-tt * 4) + 30) * tt) * np.exp(-tt * 9), t + o, 0.9 * g, verb=0.2)
M.add(S.riser(1.8, 0.5), 21.8, 1.0)

# 7) Logo: golpe y orquesta completa en re mayor (de menor a mayor: esperanza)
hit(23.6, 1.1)
for inst, octv, g in (('strings', -1, 0.4), ('strings', 0, 0.35), ('choir', 0, 0.35), ('brass', -1, 0.25)):
    pad(23.6, 6.4, 0, inst, octv, g, sc='major')
for i, n in enumerate([62, 66, 69, 74, 78, 81, 86, 90]):
    M.add(S.harp(S.midi(n), 2.0), 23.7 + i * 0.06, 0.25, verb=0.7)
for k in range(8):
    M.add(S.timpani(S.midi(38), 0.4 + k * 0.08), 23.6 + k * 0.1, 1.0, verb=0.3)
for i, n in enumerate([74, 76, 78, 81, 78, 86]):
    M.add(S.brass(S.midi(n), 0.8 if i < 5 else 2.2), 24.6 + i * 0.5, 0.26, verb=0.6)

st = M.render(loop=False, rt=2.4, fade_out=1.4)
S.write_wav(sys.argv[1], st)
print('ok', sys.argv[1])
