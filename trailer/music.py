# Música del tráiler de Fendaria (sintetizada, sin samples): drone, cuerdas, taikos, golpes y coro final.
import sys, wave
import numpy as np

SR = 44100
DUR = 30.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def note(n):  # n: semitonos desde A4
    return 440.0 * 2 ** (n / 12)

def env(n, a, d, s, r, sus_len):
    total = n
    e = np.zeros(total)
    ia, idd, ir = int(a * SR), int(d * SR), int(r * SR)
    isus = max(0, int(sus_len * SR))
    i = 0
    seg = min(ia, total - i); e[i:i + seg] = np.linspace(0, 1, ia)[:seg]; i += seg
    seg = min(idd, total - i); e[i:i + seg] = np.linspace(1, s, idd)[:seg] if idd else []; i += seg
    seg = min(isus, total - i); e[i:i + seg] = s; i += seg
    seg = min(ir, total - i); e[i:i + seg] = np.linspace(s, 0, ir)[:seg] if ir else []; i += seg
    return e

def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x); acc = 0.0
    # filtro de un polo vectorizado por bloques (suficiente para un drone)
    from itertools import accumulate
    out = np.empty_like(x)
    prev = 0.0
    for i in range(0, len(x), 4096):
        blk = x[i:i + 4096]
        res = np.empty_like(blk)
        for j, v in enumerate(blk):
            prev = (1 - a) * v + a * prev
            res[j] = prev
        out[i:i + 4096] = res
    return out

def saw(f, t):
    return 2 * ((t * f) % 1) - 1

def add(sig, start, gain=1.0, pan=0.0):
    i0 = int(start * SR)
    if i0 >= N: return
    sig = sig[: N - i0]
    l = gain * np.sqrt(0.5 * (1 - pan)); r = gain * np.sqrt(0.5 * (1 + pan))
    L[i0:i0 + len(sig)] += sig * l
    R[i0:i0 + len(sig)] += sig * r

def noise(n):
    return rng.standard_normal(n)

# ---------- capas ----------
def drone(start, dur, notes, gain, cutoff=420):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for k in notes:
        f = note(k)
        x += saw(f * 1.003, t) + saw(f * 0.997, t)
    x = lowpass(x / (2 * len(notes)), cutoff)
    x *= env(n, 1.2, 0.0, 1.0, 1.2, dur - 2.4)
    add(x, start, gain, -0.2); add(x, start + 0.011, gain, 0.2)

def pad(start, dur, notes, gain):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for k in notes:
        f = note(k)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t)
        x += np.sin(2 * np.pi * f * t * vib) + 0.35 * np.sin(4 * np.pi * f * t) + 0.15 * saw(f, t)
    x = x / len(notes) * env(n, 0.6, 0.0, 1.0, 1.6, dur - 2.2)
    add(x, start, gain, -0.3); add(x, start + 0.017, gain, 0.3)

def taiko(start, gain=1.0, pitch=72):
    n = int(0.7 * SR); t = np.arange(n) / SR
    f = pitch * np.exp(-t * 3) + 38
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 6) + 0.35 * noise(n) * np.exp(-t * 40)
    add(x, start, gain)

def impact(start, gain=1.0):
    n = int(3.5 * SR); t = np.arange(n) / SR
    f = 90 * np.exp(-t * 2.5) + 30
    ph = 2 * np.pi * np.cumsum(f) / SR
    boom = np.sin(ph) * np.exp(-t * 1.8)
    tail = lowpass(noise(n), 900) * np.exp(-t * 1.4) * 0.6
    crack = noise(n) * np.exp(-t * 25) * 0.5
    x = boom + tail + crack
    add(x, start, gain, -0.1); add(x, start + 0.009, gain * 0.9, 0.1)

def crash(start, gain=0.5):
    n = int(3 * SR); t = np.arange(n) / SR
    x = noise(n); x = x - lowpass(x, 3000)
    x *= np.exp(-t * 1.6)
    add(x, start, gain, -0.4); add(x * 0.9, start + 0.013, gain, 0.4)

def whoosh(start, dur=0.5, gain=0.5, up=True):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lowpass(noise(n), 2500)
    e = np.sin(np.pi * t / dur) ** 2
    add(x * e, start, gain, -0.5 if up else 0.5)

def riser(start, dur, gain=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 180 * (8 ** (t / dur))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) * 0.5 + lowpass(noise(n), 4000) * 0.6) * (t / dur) ** 2
    add(x, start, gain)

def strings_ostinato(start, dur, chords, gain=0.35, step=0.125):
    # arpegio de cuerdas a semicorcheas (sensación de anime épico)
    n_steps = int(dur / step)
    for i in range(n_steps):
        chord = chords[int(i * step / (dur / len(chords))) % len(chords)]
        k = chord[[0, 1, 2, 1][i % 4]] + (12 if (i // 4) % 2 else 0)
        n = int(step * 0.95 * SR); t = np.arange(n) / SR
        f = note(k)
        x = (saw(f, t) * 0.6 + np.sin(2 * np.pi * f * t) * 0.4) * np.exp(-t * 7)
        add(x, start + i * step, gain, -0.3 if i % 2 else 0.3)

def heartbeat(start, gain=0.9):
    for off in (0, 0.22):
        n = int(0.4 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * (55 * np.exp(-t * 4) + 30) * t) * np.exp(-t * 9)
        add(x, start + off, gain * (1 if off == 0 else 0.7))

# ---------- arreglo (tiempos en segundos, igual que el video) ----------
Am, F, G, C, Dm, E = [-12, -9, -5], [-16, -12, -9], [-14, -10, -7], [-9, -5, -2], [-7, -4, 0], [-5, -1, 2]
drone(0, 6.8, [-36, -29], 0.5)
pad(0.2, 2.6, [-12, -9, -5], 0.12)
whoosh(2.0, 0.6, 0.6)
impact(2.6, 0.9); crash(2.6, 0.35)
riser(3.4, 1.6, 0.3)
impact(5.0, 0.7)
strings_ostinato(5.0, 1.6, [Am], 0.22)
for i, tt in enumerate([6.6, 8.6, 10.6]):
    whoosh(tt - 0.35, 0.4, 0.6)
    impact(tt, 0.75); crash(tt, 0.25)
    taiko(tt + 0.5, 0.6); taiko(tt + 1.0, 0.7); taiko(tt + 1.25, 0.5); taiko(tt + 1.5, 0.8)
drone(6.6, 6.2, [-31, -24], 0.35)
strings_ostinato(6.6, 6.0, [F, G, Am], 0.24)
# montaje: tambores a 120 ppm y cuerdas
strings_ostinato(12.6, 8.0, [Am, F, C, G], 0.3)
drone(12.6, 8.2, [-36, -24], 0.4)
for b in range(32):
    tt = 12.6 + b * 0.25
    if b % 4 == 0: taiko(tt, 0.9, 80)
    elif b % 4 == 2: taiko(tt, 0.55, 110)
    if b % 8 == 7: taiko(tt + 0.125, 0.45, 120)
for tt in [12.6, 14.6, 16.6, 18.6]:
    impact(tt, 0.6); crash(tt, 0.2)
whoosh(20.3, 0.4, 0.5)
# tensión
impact(20.6, 0.5)
drone(20.6, 3.2, [-37, -30], 0.45, 250)
for tt in [21.0, 21.85, 22.6, 23.15]:
    heartbeat(tt, 0.9)
riser(21.8, 1.8, 0.45)
# logo: golpe y coro heroico en mayor
impact(23.6, 1.0); crash(23.6, 0.45)
pad(23.6, 6.4, [-9 - 12, -5 - 12, -2, 3], 0.32)   # C mayor abierto
pad(23.6, 6.4, [3, 7, 10], 0.14)
for tt in [23.6, 24.6, 25.6, 26.1]:
    taiko(tt, 0.7, 70)
strings_ostinato(24.6, 4.0, [C, G, F, C], 0.16, 0.25)

# reverb simple: convolución con cola de ruido decreciente
ir_n = int(1.6 * SR); ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal(ir_n) * np.exp(-ir_t * 3.2); ir[0] = 0
def reverb(x):
    n = len(x) + ir_n
    nf = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), nf)[: len(x)]
    return x + y * 0.06
L = reverb(L); R = reverb(R)
# fundido final y normalización
fade = np.clip((DUR - t_all) / 1.2, 0, 1)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
L = np.tanh(L / peak * 1.4) * 0.9; R = np.tanh(R / peak * 1.4) * 0.9
out = (np.stack([L, R], 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', sys.argv[1])
