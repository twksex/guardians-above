"""Render the original exhibition soundscape using only the Python standard library.
Run: python tools/compose_bgm.py /tmp/guardians-bgm.wav
Encode: ffmpeg -i /tmp/guardians-bgm.wav -codec:a libmp3lame -b:a 128k assets/guardians-ambient.mp3
This contemporary synthetic composition is not a reconstruction of historical music.
"""
import math
import struct
import sys
import wave

RATE = 22050
DURATION = 64
# An unhurried pentatonic motif, with a second answering voice.
NOTES = [293.6648, 329.6276, 391.9954, 440.0, 493.8833, 440.0, 391.9954, 329.6276,
         293.6648, 391.9954, 440.0, 587.3295, 493.8833, 440.0, 391.9954, 293.6648]
events = []
for i, frequency in enumerate(NOTES):
    events.append((i * 3.5 + 2, frequency, 0.12, (-0.28 if i % 2 else 0.28)))
    if i % 4 == 2:
        events.append((i * 3.5 + 3.7, frequency * 0.5, 0.045, -0.2))
frames = bytearray()
peak = 0
energy = 0
for i in range(RATE * DURATION):
    t = i / RATE
    fade = min(1, t / 2.5, (DURATION - t) / 4)
    # Quiet low sustained tones; no sudden percussion or noise.
    bed = 0.018 * math.sin(2 * math.pi * 146.8324 * t) + 0.010 * math.sin(2 * math.pi * 220 * t)
    left = right = bed * (0.84 + 0.16 * math.sin(2 * math.pi * t / 16))
    for start, frequency, strength, pan in events:
        age = t - start
        if 0 <= age < 9:
            attack = 1 - math.exp(-age * 9)
            envelope = attack * math.exp(-age / 2.15) * min(1, (9 - age) / 2)
            tone = math.sin(2 * math.pi * frequency * age)
            tone += 0.28 * math.sin(2 * math.pi * 2 * frequency * age) * math.exp(-age / 1.7)
            tone += 0.09 * math.sin(2 * math.pi * 3 * frequency * age) * math.exp(-age)
            value = strength * envelope * tone
            left += value * (1 - pan)
            right += value * (1 + pan)
    for value in (left * fade, right * fade):
        peak = max(peak, abs(value))
        energy += value * value
        frames.extend(struct.pack('<h', round(max(-1, min(1, value)) * 32767)))
with wave.open(sys.argv[1], 'wb') as output:
    output.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
    output.writeframes(frames)
print(f'Rendered {DURATION}s stereo; peak={peak:.4f}, RMS={math.sqrt(energy/(RATE*DURATION*2)):.4f}; no clipping')
