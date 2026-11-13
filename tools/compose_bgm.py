"""Original contemporary plucked-zither soundscape (not a real gayageum recording).
Python standard library only. Karplus–Strong strings, subtle pitch bends, dark drones,
and stereo echoes. No sampled audio, historical score, or external composition.
python tools/compose_bgm.py /tmp/guardian-night.wav
ffmpeg -i /tmp/guardian-night.wav -codec:a libmp3lame -b:a 160k assets/guardian-night.mp3
"""
import math
import random
import struct
import sys
import wave

RATE = 22050
DURATION = 80
rng = random.Random(902894)
left = [0.0] * (RATE * DURATION)
right = [0.0] * (RATE * DURATION)
# Sparse phrases with ample space for each pluck to decay: D minor pentatonic colors.
notes = [
 (2.0,146.8324,.70,-.30),(5.6,220,.43,.28),(8.0,261.6256,.50,-.15),
 (12.5,293.6648,.59,.32),(15.0,261.6256,.32,-.28),(18.8,196,.47,.18),
 (23,174.6141,.60,-.32),(26.4,146.8324,.50,.30),(29.8,220,.32,-.10),
 (34.5,293.6648,.52,.27),(36.0,349.2282,.29,-.23),(39.5,261.6256,.40,.18),
 (44.5,196,.64,-.32),(47.1,220,.39,.30),(51.8,174.6141,.52,-.15),
 (57.0,146.8324,.58,.20),(60.5,196,.35,-.25),(64.0,261.6256,.42,.30),
 (68.0,220,.41,-.20),(72.0,146.8324,.54,.16),
]

def pluck(frequency, duration):
    period = round(RATE / frequency)
    delay = [rng.uniform(-1,1) for _ in range(period)]
    # Triangular-ish excitation produces a woody rather than metallic attack.
    delay = [(delay[i] + delay[(i-1)%period]) * .5 for i in range(period)]
    mean = sum(delay)/period
    delay = [v-mean for v in delay]
    signal = []
    pos = 0
    for _ in range(round(RATE * duration) + 1):
        value = delay[pos]
        delay[pos] = .997 * (value + delay[(pos+1)%period]) * .5
        signal.append(value)
        pos = (pos+1)%period
    return signal

for start, frequency, velocity, pan in notes:
    duration = min(8.5, DURATION-start)
    signal = pluck(frequency,duration+1)
    phase = 0.0
    start_sample = round(start*RATE)
    for i in range(round(duration*RATE)):
        age = i/RATE
        # A restrained, delayed pitch bend suggests nonghyeon without claiming a real instrument.
        ratio = 1 + .008*math.sin(2*math.pi*4.4*age)*min(1,age/1.1) + .012*math.exp(-age*2)
        j = int(phase)
        if j+1 >= len(signal): break
        fraction = phase-j
        string = signal[j]*(1-fraction)+signal[j+1]*fraction
        phase += ratio
        body = .028*math.sin(2*math.pi*frequency*.5*age)*math.exp(-age*1.5)
        value = velocity*(string+body)*min(1,age/.003)*min(1,(duration-age)/.4)
        index = start_sample+i
        if index >= len(left): break
        left[index] += value*(1-pan)
        right[index] += value*(1+pan)
        for delay,decay in ((.23,.17),(.51,.13),(.89,.09),(1.43,.045)):
            echo=index+round(delay*RATE)
            if echo < len(left):
                left[echo] += value*(1+pan)*decay
                right[echo] += value*(1-pan)*decay

wind = 0.0
for i in range(len(left)):
    t=i/RATE
    wind = .998*wind + .002*rng.uniform(-1,1)
    drone = .008*math.sin(2*math.pi*73.4162*t)*(0.7+.3*math.sin(2*math.pi*t/21))
    drone += .0035*math.sin(2*math.pi*110*t)
    breath=wind*.055*(.6+.4*math.sin(2*math.pi*t/13))
    fade=max(0,min(1,t/3,(DURATION-t)/5))
    left[i]=(left[i]+drone+breath)*fade
    right[i]=(right[i]+drone+breath*.8)*fade
peak=max(max(abs(v) for v in left),max(abs(v) for v in right))
gain=.48/peak
energy=0
frames=bytearray()
for a,b in zip(left,right):
    for v in (a*gain,b*gain):
        energy+=v*v
        frames.extend(struct.pack('<h',round(v*32767)))
with wave.open(sys.argv[1],'wb') as output:
    output.setparams((2,2,RATE,0,'NONE','not compressed'));output.writeframes(frames)
print(f'{DURATION}s stereo plucked strings; peak=.48, RMS={math.sqrt(energy/(len(left)*2)):.4f}; no clipping')
