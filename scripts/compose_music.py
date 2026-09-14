"""Original, deterministic ambient score for the 30-second TON 618 showcase."""
from pathlib import Path
import wave
import numpy as np

RATE = 44100
DURATION = 30
rng = np.random.default_rng(618)
mix = np.zeros((RATE * DURATION, 2), dtype=np.float64)

def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def place(signal, start, pan=0):
    offset = round(start * RATE)
    if offset >= len(mix):
        return
    signal = signal[:len(mix) - offset]
    angle = (pan + 1) * np.pi / 4
    mix[offset:offset + len(signal), 0] += signal * np.cos(angle)
    mix[offset:offset + len(signal), 1] += signal * np.sin(angle)

# Spacious D-minor harmony with added ninths; the final chord resolves home.
chords = [
    (38, [50, 57, 60, 64, 69]),
    (34, [53, 57, 60, 62, 69]),
    (41, [53, 57, 60, 64, 67]),
    (36, [55, 60, 62, 67, 69]),
    (34, [53, 57, 60, 62, 65]),
    (38, [50, 57, 60, 64, 69]),
]

chords = [(bass - 2, [note - 2 for note in notes]) for bass, notes in chords]

for section, (bass, notes) in enumerate(chords):
    start = section * 5
    t = np.arange(round(7 * RATE)) / RATE
    env = (1 - np.exp(-t / 1.0)) * np.clip((7 - t) / 2.3, 0, 1)
    for j, note in enumerate(notes):
        # Detuned, slowly breathing oscillators, with gentle upper harmonics.
        f = hz(note)
        voice = np.zeros_like(t)
        for detune, level in [(-0.0025, .34), (0, .38), (.0028, .28)]:
            phase = rng.uniform(0, 2 * np.pi)
            vibrato = .025 * np.sin(2 * np.pi * .13 * t + phase)
            p = 2 * np.pi * f * (1 + detune) * t + phase + vibrato
            voice += level * (np.sin(p) + .17 * np.sin(2 * p) + .045 * np.sin(3 * p))
        breathe = .87 + .13 * np.sin(2 * np.pi * .18 * t + j)
        place(.045 * voice * env * breathe, start, -.75 + j * .375)
    bass_env = (1 - np.exp(-t / .4)) * np.clip((6 - t) / 1.8, 0, 1)
    bass_voice = np.sin(2 * np.pi * hz(bass) * t) + .2 * np.sin(4 * np.pi * hz(bass) * t)
    place(.095 * bass_voice * bass_env, start)

# Sparse glass-like arpeggios. A quiet echo gives motion without obscuring text.
pattern = [0, 2, 4, 1, 3, 2, 4, 3]
for section, (_, notes) in enumerate(chords):
    for beat, index in enumerate(pattern):
        start = section * 5 + beat * .625
        if start > 27:
            continue
        t = np.arange(round(3.4 * RATE)) / RATE
        f = hz(notes[index] + 12)
        bell = (np.sin(2 * np.pi * f * t) * np.exp(-t / 1.05)
                + .23 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / .42)
                + .055 * np.sin(2 * np.pi * f * 3.001 * t) * np.exp(-t / .2))
        bell *= 1 - np.exp(-t / .014)
        level = .023 if section == 0 else .037
        pan = .55 * np.sin(beat * 2.4 + section)
        place(level * bell, start, pan)
        place(level * .32 * bell, start + .469, -pan)
        place(level * .14 * bell, start + .938, pan)

# Broad stereo ambience from diffused, filtered reflections.
dry = mix.copy()
for delay, gain in [(.137, .11), (.233, .10), (.379, .09), (.557, .08),
                    (.797, .065), (1.111, .05), (1.487, .04), (1.937, .028)]:
    n = round(delay * RATE)
    mix[n:] += gain * dry[:-n, ::-1]

t = np.arange(len(mix)) / RATE
fade = np.sin(np.clip(t / 1.7, 0, 1) * np.pi / 2) ** 2
fade *= np.sin(np.clip((DURATION - t) / 3.5, 0, 1) * np.pi / 2) ** 2
mix *= fade[:, None]
mix -= mix.mean(axis=0)
mix *= .76 / np.max(np.abs(mix))
destination = Path(__file__).resolve().parents[1] / 'output' / 'ton-618-original-score.wav'
with wave.open(str(destination), 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print(destination)
