"""Fendaria — efectos de sonido a partir de los packs CC0 de Kenney (www.kenney.nl).

Uso: python3 kenney_sfx.py <carpeta con los packs descomprimidos> <www/audio/sfx>
Algunos efectos se componen mezclando varias muestras (p. ej. el arco = madera + silbido).
Los efectos melódicos (subir de nivel, legendario, portal…) siguen saliendo de sfx.py.
"""
import sys, os, glob, subprocess
import numpy as np
SR = 44100
sys.path.insert(0, os.path.dirname(__file__))
from synth import lp, bp, noise


def load(root, name):
    f = glob.glob(os.path.join(root, '**', name), recursive=True)
    assert f, name
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f[0], '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def trim(y, dur=None, fade=0.05, gate=0.01):
    idx = np.where(np.abs(y) > gate * np.abs(y).max())[0]
    if len(idx): y = y[idx[0]:]
    if dur: y = y[:int(dur * SR)]
    n = min(len(y), int(fade * SR))
    if n: y[-n:] *= np.linspace(1, 0, n)
    return y


def mix(parts, dur):
    out = np.zeros(int(dur * SR))
    for y, t0, g in parts:
        i = int(t0 * SR); m = min(len(y), len(out) - i)
        if m > 0: out[i:i + m] += y[:m] * g
    return out


def whoosh(d, lo, hi, seed=0):
    np.random.seed(seed)
    n = int(d * SR); t = np.arange(n) / SR
    return lp(bp(noise(n), lo, hi), hi) * np.sin(np.pi * t / d) ** 2


def build(root, out):
    L = lambda n: load(root, n)
    S = {}
    # combate cuerpo a cuerpo
    S['swing'] = trim(L('knifeSlice.ogg'), 0.35)
    S['swing2'] = trim(L('knifeSlice2.ogg'), 0.35)
    S['swing3'] = mix([(whoosh(0.2, 400, 1800, 3), 0, 0.8), (trim(L('chop.ogg'), 0.2), 0.04, 0.35)], 0.25)
    S['hit'] = trim(L('impactPunch_medium_000.ogg'), 0.3)
    S['hit2'] = trim(L('impactPunch_medium_002.ogg'), 0.3)
    S['hit3'] = trim(L('impactPunch_medium_004.ogg'), 0.3)
    S['crit'] = mix([(trim(L('impactPunch_heavy_000.ogg'), 0.5), 0, 1), (trim(L('impactMetal_light_002.ogg'), 0.3), 0.01, 0.35)], 0.5)
    S['hurt'] = trim(L('impactSoft_heavy_000.ogg'), 0.4)
    S['dash'] = trim(L('cloth3.ogg'), 0.3)
    # arco: golpe seco de madera (cuerda) + silbido corto de la flecha
    for k, (w, s) in enumerate([('impactWood_light_000.ogg', 1), ('impactWood_light_002.ogg', 2), ('impactWood_light_004.ogg', 3)]):
        S['shoot' + ('' if k == 0 else str(k + 1))] = mix([(trim(L(w), 0.2), 0, 0.8), (whoosh(0.16, 1000, 4500, s), 0.02, 0.22)], 0.24)
    S['arrowrain'] = mix([(trim(L('impactWood_light_%03d.ogg' % (i % 5)), 0.15), 0.06 * i + 0.08, 0.5) for i in range(6)] + [(whoosh(0.35, 1200, 5000, 9), 0, 0.25)], 0.55)
    S['blades'] = mix([(trim(L('impactMetal_light_%03d.ogg' % i), 0.18), i * 0.05, 0.5) for i in range(3)] + [(trim(L('knifeSlice2.ogg'), 0.25), 0, 0.5)], 0.4)
    S['turret'] = trim(L('impactMetal_light_004.ogg'), 0.15)
    # explosiones, escudos, fuego, telarañas
    S['boom'] = mix([(trim(L('explosionCrunch_000.ogg'), 0.8), 0, 1), (trim(L('lowFrequency_explosion_000.ogg'), 0.8), 0, 0.6)], 0.85)
    S['shield'] = trim(L('forceField_000.ogg'), 0.6, fade=0.2)
    S['fireshot'] = mix([(trim(L('thrusterFire_000.ogg'), 0.45, fade=0.25), 0, 0.9), (trim(L('impactWood_light_001.ogg'), 0.15), 0, 0.5)], 0.45)
    S['web'] = trim(L('slime_000.ogg'), 0.3)
    # botín e interfaz
    S['coin'] = trim(L('chip-lay-1.ogg'), 0.18)
    S['loot'] = trim(L('glass_002.ogg'), 0.2)
    S['click'] = trim(L('click_001.ogg'), 0.1)
    S['step'] = trim(L('footstep_grass_000.ogg'), 0.25)
    os.makedirs(out, exist_ok=True)
    for name, y in S.items():
        y = y / (np.abs(y).max() + 1e-9) * 0.9
        wav = os.path.join(out, name + '.wav'); ogg = os.path.join(out, name + '.ogg')
        import wave
        with wave.open(wav, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((y * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libvorbis', '-q:a', '4', ogg], check=True)
        os.remove(wav)
    print(len(S), 'efectos de Kenney')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
