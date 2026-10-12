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


def sine_drop(f0, f1, d, k):
    """Tono que cae de f0 a f1 con decaimiento exponencial (cuerpo de un golpe)."""
    n = int(d * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * k)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def soft_noise(d, lo, hi, att=0.01):
    """Ruido filtrado con ataque suave (sin chasquidos)."""
    n = int(d * SR); t = np.arange(n) / SR
    env = np.minimum(1, t / att) * np.exp(-t * 6 / d)
    return bp(noise(n), lo, hi) * env


def chime(freqs, d, decay=7):
    """Campanilla limpia de senos (brillo sin estridencia)."""
    n = int(d * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t) * (0.6 ** k) for k, f in enumerate(freqs))
    return y * np.exp(-t * decay) * np.minimum(1, t / 0.004)


@fx('swing')
def _():  # tajo: soplido de aire corto y grave, sin chirrido metálico
    d = 0.2
    t = T(d)
    sweep = lp(noise(len(t)), 1800) * np.sin(np.pi * t / d) ** 2
    return lp(sweep, 2200) * 0.9


@fx('hit')
def _():  # golpe: cuerpo grave y redondo, chasquido muy corto y filtrado
    d = 0.16
    body = sine_drop(330, 150, d, 26) * env_exp(int(d * SR), 22)
    knock = sine_drop(620, 420, d, 30) * env_exp(int(d * SR), 45) * 0.35
    tap = lp(noise(int(0.02 * SR)), 2500) * env_exp(int(0.02 * SR), 180)
    return mixdown([(body, 0, 1), (knock, 0, 1), (tap, 0, 0.3)], d)


@fx('crit')
def _():  # crítico: golpe con más cuerpo + campanilla brillante y breve
    d = 0.5
    body = sine_drop(400, 150, 0.3, 16) * env_exp(int(0.3 * SR), 12)
    tap = lp(noise(int(0.03 * SR)), 3000) * env_exp(int(0.03 * SR), 120)
    ring = chime([1568, 2349, 3136], 0.45, 9)
    return small_verb(mixdown([(body, 0, 1), (tap, 0, 0.4), (ring, 0.01, 0.35)], d), amt=0.35)


@fx('boom')
def _():  # explosión: retumbo grave, sin siseo agudo
    d = 1.1
    t = T(d)
    sub = sine_drop(110, 38, d, 5) * np.exp(-t * 3.2)
    rumble = lp(noise(len(t)), 500) * np.exp(-t * 3.5) * np.minimum(1, t / 0.01)
    puff = lp(noise(len(t)), 2000) * np.exp(-t * 18)
    crunch = bp(noise(len(t)), 250, 1200) * np.exp(-t * 7)
    return small_verb(mixdown([(sub, 0, 1), (rumble, 0, 0.9), (crunch, 0, 0.7), (puff, 0, 0.25)], d), rt=0.8, amt=0.35)


@fx('coin')
def _():  # ámbar: dos notas suaves y cortas
    return mixdown([(chime([2093, 4186], 0.18, 22), 0, 0.5), (chime([2637, 5274], 0.25, 18), 0.06, 0.5)], 0.32)


@fx('xp')
def _():  # orbe de experiencia: burbujita aguda muy discreta
    d = 0.12
    return sine_drop(1400, 1900, d, -6)[: int(d * SR)] * np.sin(np.pi * T(d) / d) * 0.4


@fx('hurt')
def _():  # el héroe recibe daño: golpe sordo + nota que baja (sin graznido)
    d = 0.35
    thud = sine_drop(280, 120, 0.25, 14) * env_exp(int(0.25 * SR), 13)
    tone = sine_drop(392, 262, 0.3, 6) * np.sin(np.pi * T(0.3) / 0.3) * 0.3
    return mixdown([(thud, 0, 1), (lp(tone, 1500), 0.02, 1)], d)


@fx('level')
def _():  # subida de nivel: arpa ascendente + brillo
    notes = [72, 76, 79, 84, 88, 91]
    parts = [(S.harp(S.midi(n), 1.2), i * 0.07, 0.5) for i, n in enumerate(notes)]
    parts.append((S.choir(S.midi(84), 1.4) * 0.6, 0.1, 0.4))
    return small_verb(mixdown(parts, 1.8), rt=1.5, amt=0.8)


@fx('dash')
def _():  # esquiva: soplido suave
    d = 0.22
    return lp(bp(noise(int(d * SR)), 300, 2500), 2000) * np.sin(np.pi * T(d) / d) ** 2 * 0.9


@fx('shield')
def _():  # égida: destello que sube
    d = 0.7
    sh = chirp(400, 1600, d) * np.sin(np.pi * T(d) / d) * 0.5
    sp = sum(S.celesta(S.midi(n), 0.5) for n in (84, 88, 91)) / 3
    return small_verb(mixdown([(sh, 0, 0.6), (sp, 0.15, 0.7)], d + 0.3), rt=1.0, amt=0.6)


@fx('baa')
def _():  # gruñido de bestia, grave y filtrado
    d = 0.4
    g = S.saw(np.cumsum(85 + 18 * np.sin(2 * np.pi * 9 * T(d))) / SR)
    return lp(bp(g, 120, 900), 800) * np.sin(np.pi * T(d) / d) * 0.8


@fx('piou')
def _():  # chillido del pájaro de fuego, más suave
    d = 0.25
    return lp(chirp(1100, 1700, d), 2500) * np.sin(np.pi * T(d) / d) * 0.35


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
def _():  # arco: cuerda pulsada redonda + aire muy leve
    d = 0.3
    tw = lp(S.ks(147, 0.25, bright=0.2, decay=0.985), 2500) * 0.8
    wh = lp(bp(noise(int(0.15 * SR)), 600, 3000), 2500) * np.sin(np.pi * T(0.15) / 0.15) * 0.18
    return mixdown([(tw, 0, 1), (wh, 0.02, 1)], d)


@fx('magic')
def _():  # orbe arcano: nota de cristal con ataque suave
    d = 0.35
    t = T(d)
    y = np.sin(2 * np.pi * 784 * t) * np.exp(-t * 9) * np.minimum(1, t / 0.015)
    y += np.sin(2 * np.pi * 1176 * t) * np.exp(-t * 12) * 0.3
    return small_verb(y * 0.8, amt=0.4)


@fx('step')
def _():  # paso sobre tierra
    d = 0.08
    return bp(noise(int(d * SR)), 200, 1800) * env_exp(int(d * SR), 50) * 0.5


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    total = 0
    only = set(sys.argv[2:])
    for name, fn in FX.items():
        if only and name not in only: continue
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
