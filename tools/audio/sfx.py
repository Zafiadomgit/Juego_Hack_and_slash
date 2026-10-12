"""Fendaria — efectos de sonido sintetizados (se exportan a .ogg cortos).
Uso: python3 sfx.py <carpeta_salida>
"""
import os, sys, subprocess
import numpy as np
import synth as S
from synth import SR, lp, hp, bp, noise


def env_exp(n, k):
    return np.exp(-np.arange(n) / SR * k)


def T(d):
    return np.arange(int(d * SR)) / SR


def chirp(f0, f1, d, shape='sin'):
    t = T(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = np.cumsum(f) / SR
    return np.sin(2 * np.pi * ph) if shape == 'sin' else S.saw(ph)


def mixdown(parts, d):
    n = int(d * SR)
    y = np.zeros(n)
    for sig, t0, g in parts:
        i = int(t0 * SR)
        m = min(len(sig), n - i)
        if m > 0: y[i:i + m] += sig[:m] * g
    return y


def small_verb(y, rt=0.6, amt=0.25):
    from scipy import signal
    n = int(rt * SR)
    ir = noise(n) * env_exp(n, 6.9 / rt)
    w = signal.fftconvolve(y, lp(ir, 6000))[: len(y)]
    return y + w * amt * 0.05


FX = {}


def fx(name):
    def deco(fn):
        FX[name] = fn
        return fn
    return deco


@fx('swing')
def _():  # tajo de hacha: soplido + filo metálico
    d = 0.28
    w = bp(noise(int(d * SR)), 600, 4000) * np.sin(np.pi * T(d) / d) ** 1.5
    shing = S.bell(2600, 0.25, ratio=2.7, index=1.5) * 0.25
    return mixdown([(w, 0, 0.9), (shing, 0.05, 1)], d + 0.2)


@fx('hit')
def _():  # golpe seco con cuerpo
    d = 0.22
    thud = np.sin(2 * np.pi * np.cumsum(140 * env_exp(int(d * SR), 18) + 60) / SR) * env_exp(int(d * SR), 22)
    crack = bp(noise(int(0.06 * SR)), 1500, 6000) * env_exp(int(0.06 * SR), 60)
    return mixdown([(thud, 0, 1), (crack, 0, 0.7)], d)


@fx('crit')
def _():  # crítico: golpe pesado + campanazo agudo
    d = 0.6
    thud = np.sin(2 * np.pi * np.cumsum(180 * env_exp(int(0.35 * SR), 12) + 55) / SR) * env_exp(int(0.35 * SR), 12)
    crack = bp(noise(int(0.1 * SR)), 1000, 8000) * env_exp(int(0.1 * SR), 35)
    ring = S.bell(1760, 0.5, ratio=3.1, index=2) * 0.35
    return small_verb(mixdown([(thud, 0, 1), (crack, 0, 0.9), (ring, 0.01, 1)], d), amt=0.5)


@fx('boom')
def _():
    d = 1.4
    return small_verb(S.impact(1.0)[: int(d * SR)] * env_exp(int(d * SR), 2.5), rt=0.9, amt=0.6)


@fx('coin')
def _():
    d = 0.45
    a = S.bell(1975, 0.4, ratio=2.0, index=0.8); b = S.bell(2637, 0.35, ratio=2.0, index=0.8)
    return mixdown([(a, 0, 0.6), (b, 0.07, 0.6)], d)


@fx('xp')
def _():
    return S.celesta(1568, 0.25) * 0.5


@fx('hurt')
def _():  # el héroe recibe daño: golpe sordo + quejido grave
    d = 0.4
    thud = np.sin(2 * np.pi * np.cumsum(110 * env_exp(int(0.25 * SR), 10) + 50) / SR) * env_exp(int(0.25 * SR), 14)
    grunt = bp(chirp(220, 140, 0.3, 'saw'), 300, 1400) * np.sin(np.pi * T(0.3) / 0.3)
    return mixdown([(thud, 0, 1), (grunt, 0.02, 0.5)], d)


@fx('level')
def _():  # subida de nivel: arpa ascendente + brillo
    notes = [72, 76, 79, 84, 88, 91]
    parts = [(S.harp(S.midi(n), 1.2), i * 0.07, 0.5) for i, n in enumerate(notes)]
    parts.append((S.choir(S.midi(84), 1.4) * 0.6, 0.1, 0.4))
    return small_verb(mixdown(parts, 1.8), rt=1.5, amt=0.8)


@fx('dash')
def _():
    d = 0.25
    return bp(noise(int(d * SR)), 800, 5000) * np.sin(np.pi * T(d) / d) ** 2 * 0.9


@fx('shield')
def _():  # égida: destello que sube
    d = 0.7
    sh = chirp(400, 1600, d) * np.sin(np.pi * T(d) / d) * 0.5
    sp = sum(S.celesta(S.midi(n), 0.5) for n in (84, 88, 91)) / 3
    return small_verb(mixdown([(sh, 0, 0.6), (sp, 0.15, 0.7)], d + 0.3), rt=1.0, amt=0.6)


@fx('baa')
def _():  # gruñido de jabalí
    d = 0.45
    g = S.saw(np.cumsum(90 + 25 * np.sin(2 * np.pi * 12 * T(d))) / SR)
    g = bp(g, 200, 1100) * np.sin(np.pi * T(d) / d) + bp(noise(int(d * SR)), 300, 900) * 0.3 * np.sin(np.pi * T(d) / d)
    return g * 0.8


@fx('piou')
def _():  # chillido del pájaro de fuego
    d = 0.3
    return chirp(1800, 3200, d) * np.sin(np.pi * T(d) / d) * 0.4 + bp(noise(int(d * SR)), 2000, 6000) * 0.1


@fx('boss')
def _():  # rugido del Guardián: gruñido grave distorsionado + impacto
    d = 1.8
    t = T(d)
    growl = S.saw(np.cumsum(70 + 18 * np.sin(2 * np.pi * 7 * t) + 10 * noise(len(t)) * 0.3) / SR)
    growl = np.tanh(bp(growl, 80, 1400) * 3) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6
    return small_verb(mixdown([(growl, 0, 0.7), (S.impact(0.8)[: int(d * SR)], 0, 0.6)], d), rt=1.2, amt=0.7)


@fx('die')
def _():
    d = 1.6
    parts = [(S.strings(S.midi(n), 1.2, att=0.05), i * 0.25, 0.5) for i, n in enumerate([69, 65, 62, 57])]
    return small_verb(mixdown(parts, d), rt=1.6, amt=0.8)


@fx('heal')
def _():
    parts = [(S.celesta(S.midi(n), 0.6), i * 0.06, 0.5) for i, n in enumerate([79, 83, 86, 91])]
    return small_verb(mixdown(parts, 0.9), amt=0.6)


@fx('click')
def _():  # tic de madera para la interfaz
    d = 0.06
    return (np.sin(2 * np.pi * 1200 * T(d)) * env_exp(int(d * SR), 90) + bp(noise(int(d * SR)), 2000, 6000) * env_exp(int(d * SR), 120) * 0.4) * 0.6


@fx('loot')
def _():
    return mixdown([(S.bell(1318, 0.5, 2.0, 1.0), 0, 0.5), (S.bell(1760, 0.5, 2.0, 1.0), 0.08, 0.5)], 0.7)


@fx('legend')
def _():  # objeto legendario: glissando de arpa + coro
    notes = [67, 71, 74, 79, 83, 86, 91, 95]
    parts = [(S.harp(S.midi(n), 1.5), i * 0.05, 0.45) for i, n in enumerate(notes)]
    parts.append((S.choir(S.midi(79), 1.8), 0.15, 0.35)); parts.append((S.choir(S.midi(86), 1.8), 0.15, 0.25))
    return small_verb(mixdown(parts, 2.2), rt=1.8, amt=0.9)


@fx('zaap')
def _():  # Portal Rúnico
    d = 1.4
    sw = chirp(200, 1400, d) * np.sin(np.pi * T(d) / d) * 0.35
    sh = bp(noise(int(d * SR)), 2000, 9000) * np.sin(np.pi * T(d) / d) ** 2 * 0.25
    sp = sum(S.celesta(S.midi(n), 0.8) for n in (79, 86, 91)) / 3
    return small_verb(mixdown([(sw, 0, 1), (sh, 0, 1), (sp, 0.6, 0.6)], d + 0.4), rt=1.4, amt=0.8)


@fx('shoot')
def _():  # cuerda de arco + silbido de flecha
    d = 0.35
    tw = S.ks(110, 0.25, bright=0.3, decay=0.98) * 0.6
    wh = bp(noise(int(0.22 * SR)), 1500, 7000) * np.sin(np.pi * T(0.22) / 0.22) * 0.35
    return mixdown([(tw, 0, 1), (wh, 0.02, 1)], d)


@fx('magic')
def _():  # orbe arcano
    d = 0.4
    t = T(d)
    y = np.sin(2 * np.pi * 660 * t + 3 * np.sin(2 * np.pi * 990 * t) * np.exp(-t * 6)) * env_exp(len(t), 7)
    return small_verb(mixdown([(y, 0, 0.5), (S.celesta(1320, 0.3), 0, 0.2)], d), amt=0.5)


@fx('step')
def _():  # paso sobre tierra
    d = 0.08
    return bp(noise(int(d * SR)), 200, 1800) * env_exp(int(d * SR), 50) * 0.5


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    total = 0
    for name, fn in FX.items():
        y = fn()
        y = y / (np.abs(y).max() + 1e-9) * 0.9
        st = np.stack([y, y], 1)
        wav = os.path.join(out_dir, name + '.wav'); ogg = os.path.join(out_dir, name + '.ogg')
        S.write_wav(wav, st)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-c:a', 'libvorbis', '-q:a', '4', ogg], check=True)
        os.remove(wav)
        total += os.path.getsize(ogg)
    print(len(FX), 'efectos,', total // 1024, 'KB')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '../../www/audio/sfx')
