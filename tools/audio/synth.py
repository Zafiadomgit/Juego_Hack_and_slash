"""Fendaria — mini sintetizador para la banda sonora (numpy + scipy).

Instrumentos sintetizados por código (sin samples de terceros):
arpa / laúd / oud (Karplus-Strong), cuerdas, coro, flauta, metales, campanas (FM),
marimba, bajo y percusión (taiko, bombo, caja, platos, darbuka, timbales).
"""
import numpy as np
from scipy import signal

SR = 44100


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s
    ia, idd, ir = int(a * SR), int(d * SR), int(r * SR)
    ia = min(ia, n); e[:ia] = np.linspace(0, 1, ia, endpoint=False) if ia else e[:ia]
    j = min(ia + idd, n)
    if j > ia: e[ia:j] = np.linspace(1, s, j - ia, endpoint=False)
    ir = min(ir, n)
    if ir: e[n - ir:] *= np.linspace(1, 0, ir)
    return e


def lp(x, fc, order=2):
    fc = min(fc, SR * 0.45)
    sos = signal.butter(order, fc, 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def saw(ph):
    return 2 * (ph % 1.0) - 1


RNG = np.random.default_rng(11)


def noise(n):
    return RNG.standard_normal(n)


# ---------------- instrumentos melódicos ----------------
def ks(f, dur, bright=0.6, decay=0.996, body=None):
    """Cuerda pulsada Karplus-Strong, vectorizada por bloques de un periodo (arpa, laúd, oud)."""
    n = int(dur * SR)
    N = max(2, int(SR / f))
    exc = noise(N + 1)
    if bright < 1: exc = lp(exc, 800 + 7000 * bright)
    y = np.zeros(n + N + 1)
    y[:N + 1] = exc
    k = N + 1
    while k < len(y):
        m = min(N, len(y) - k)
        y[k:k + m] = decay * 0.5 * (y[k - N:k - N + m] + y[k - N - 1:k - N - 1 + m])
        k += m
    y = y[N + 1:N + 1 + n]
    if body is not None:
        y = y + body * bp(y, f * 1.5, f * 4)
    y = y * adsr(n, 0.002, 0.0, 1.0, min(0.15, dur * 0.3))
    return y / (np.abs(y).max() + 1e-9)


def harp(f, dur):
    return ks(f, dur, bright=0.7, decay=0.9975)


def lute(f, dur):
    return ks(f, dur, bright=0.45, decay=0.993, body=0.6)


def oud(f, dur):
    y = ks(f, dur, bright=0.55, decay=0.9925, body=1.2)
    return y


def strings(f, dur, bright=1.0, att=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + 0.0035 * np.sin(2 * np.pi * 5.3 * t + RNG.random() * 6)
    y = np.zeros(n)
    for det in (-0.006, -0.002, 0.0, 0.003, 0.007):
        ph = np.cumsum(f * (1 + det) * vib) / SR + RNG.random()
        y += saw(ph)
    y = lp(y / 5, 900 + 2200 * bright)
    return y * adsr(n, att, 0.2, 0.85, min(0.4, dur * 0.4))


def pizz(f, dur):
    return ks(f, min(dur, 0.6), bright=0.3, decay=0.985)


def flute(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.0 * t) * np.clip(t * 2, 0, 1)
    ph = np.cumsum(f * vib) / SR
    y = np.sin(2 * np.pi * ph) + 0.18 * np.sin(4 * np.pi * ph) + 0.06 * np.sin(6 * np.pi * ph)
    breath = bp(noise(n), f * 0.9, f * 3) * 0.08
    return (y + breath) * adsr(n, 0.06, 0.1, 0.8, min(0.15, dur * 0.3))


def brass(f, dur, att=0.05):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = np.cumsum(f * (1 + 0.003 * np.sin(2 * np.pi * 4.5 * t))) / SR
    y = saw(ph) + 0.6 * saw(ph * 1.003 + 0.3)
    # filtro que se abre al atacar (sonido de trompa)
    env = adsr(n, att, 0.25, 0.75, min(0.2, dur * 0.3))
    y = lp(y, 600) * 0.6 + lp(y, 2600) * 0.4 * env
    return y * env


def choir(f, dur, vowel='a'):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.004, 0.0, 0.005):
        ph = np.cumsum(f * (1 + det) * (1 + 0.005 * np.sin(2 * np.pi * 5.5 * t + det * 900))) / SR
        y += saw(ph)
    F = {'a': [(700, 1100), (1100, 1400), (2500, 2900)], 'o': [(400, 600), (700, 1000), (2300, 2700)]}[vowel]
    out = bp(y, *F[0]) * 1.0 + bp(y, *F[1]) * 0.6 + bp(y, *F[2]) * 0.25
    return out * adsr(n, 0.35, 0.2, 0.85, min(0.6, dur * 0.4))


def bell(f, dur, ratio=3.5, index=2.5):
    n = int(dur * SR); t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t * 3)
    y = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.2)
    return y * adsr(n, 0.002, 0.0, 1.0, 0.05)


def celesta(f, dur):
    return bell(f, dur, ratio=4.0, index=1.2)


def marimba(f, dur):
    n = int(min(dur, 1.0) * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 20)
    return y


def bass(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = f * t
    y = np.sin(2 * np.pi * ph) + 0.3 * lp(saw(ph), 400)
    return y * adsr(n, 0.01, 0.15, 0.8, 0.08)


def drone(f, dur):
    return strings(f, dur, bright=0.2, att=1.0) + 0.5 * strings(f * 1.5, dur, bright=0.2, att=1.0)


# ---------------- percusión ----------------
def taiko(gain=1.0, pitch=70):
    n = int(0.8 * SR); t = np.arange(n) / SR
    f = pitch * np.exp(-t * 3) + 38
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5) + 0.3 * lp(noise(n), 2000) * np.exp(-t * 40)
    return y * gain


def kick(gain=1.0):
    n = int(0.4 * SR); t = np.arange(n) / SR
    f = 120 * np.exp(-t * 25) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * gain


def snare(gain=1.0):
    n = int(0.3 * SR); t = np.arange(n) / SR
    y = bp(noise(n), 1200, 7000) * np.exp(-t * 18) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return y * gain


def hat(gain=0.4, open_=False):
    n = int((0.35 if open_ else 0.06) * SR); t = np.arange(n) / SR
    return hp(noise(n), 7000) * np.exp(-t * (8 if open_ else 70)) * gain


def cymbal(gain=0.6):
    n = int(3.0 * SR); t = np.arange(n) / SR
    return hp(noise(n), 3500) * np.exp(-t * 1.5) * gain


def timpani(f=55, gain=1.0):
    n = int(1.6 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.5) + 0.4 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 4)
    y += 0.2 * lp(noise(n), 500) * np.exp(-t * 20)
    return y * gain


def doum(gain=1.0):
    n = int(0.5 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (110 * np.exp(-t * 6) + 70) * t) * np.exp(-t * 10) + 0.2 * lp(noise(n), 900) * np.exp(-t * 30)) * gain


def tek(gain=0.6):
    n = int(0.15 * SR); t = np.arange(n) / SR
    return (bp(noise(n), 2500, 8000) * np.exp(-t * 45) + 0.4 * np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60)) * gain


def impact(gain=1.0):
    n = int(3.5 * SR); t = np.arange(n) / SR
    f = 90 * np.exp(-t * 2.5) + 30
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8) + lp(noise(n), 900) * np.exp(-t * 1.4) * 0.6 + noise(n) * np.exp(-t * 25) * 0.4
    return y * gain


def riser(dur, gain=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 180 * (8 ** (t / dur))
    y = (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + lp(noise(n), 4000) * 0.6) * (t / dur) ** 2
    return y * gain


def whoosh(dur=0.5, gain=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    return bp(noise(n), 300, 3000) * np.sin(np.pi * t / dur) ** 2 * gain


# ---------------- mezcla ----------------
class Mix:
    def __init__(self, dur):
        self.n = int(dur * SR)
        self.L = np.zeros(self.n + SR * 4)
        self.R = np.zeros(self.n + SR * 4)
        self.verbL = np.zeros_like(self.L)
        self.verbR = np.zeros_like(self.R)

    def add(self, sig, t, gain=1.0, pan=0.0, verb=0.25):
        i = int(t * SR)
        if i >= len(self.L) or i < 0: return
        sig = sig[: len(self.L) - i]
        l = gain * np.sqrt(0.5 * (1 - pan)); r = gain * np.sqrt(0.5 * (1 + pan))
        self.L[i:i + len(sig)] += sig * l
        self.R[i:i + len(sig)] += sig * r
        if verb:
            self.verbL[i:i + len(sig)] += sig * l * verb
            self.verbR[i:i + len(sig)] += sig * r * verb

    def render(self, loop=True, rt=2.2, master=0.9, fade_out=0.0):
        # reverb de sala: respuesta al impulso de ruido con caída exponencial, distinta por canal
        n_ir = int(rt * SR); t = np.arange(n_ir) / SR
        irL = noise(n_ir) * np.exp(-t * 6.9 / rt); irR = noise(n_ir) * np.exp(-t * 6.9 / rt)
        irL = lp(irL, 5000); irR = lp(irR, 5000)
        wl = signal.fftconvolve(self.verbL, irL)[: len(self.L)] * 0.035
        wr = signal.fftconvolve(self.verbR, irR)[: len(self.R)] * 0.035
        L = self.L + wl; R = self.R + wr
        if loop:
            # la cola posterior al final del bucle se suma al principio: bucle sin cortes
            tail = len(L) - self.n
            L[:tail] += L[self.n:]; R[:tail] += R[self.n:]
        L = L[: self.n]; R = R[: self.n]
        if fade_out:
            k = int(fade_out * SR)
            L[-k:] *= np.linspace(1, 0, k); R[-k:] *= np.linspace(1, 0, k)
        peak = max(np.abs(L).max(), np.abs(R).max()) + 1e-9
        L = np.tanh(L / peak * 1.25) * master; R = np.tanh(R / peak * 1.25) * master
        return np.stack([L, R], 1)


def write_wav(path, stereo):
    import wave
    out = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())


def spic(f, dur):
    """Cuerdas en spiccato (notas cortas y rápidas para ostinatos)."""
    n = int(min(dur, 0.3) * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.004, 0.0, 0.005):
        y += saw(np.cumsum(np.full(n, f * (1 + det))) / SR + RNG.random())
    y = lp(y / 3, 2600)
    return y * np.exp(-t * 9) * adsr(n, 0.008, 0.0, 1.0, 0.03)
