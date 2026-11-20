"""Remove dead air from a long take (meeting / screen recording / monologue) by AUDIO ENERGY.

    python helpers/tighten_pauses.py <clean_dialogue.wav> --start 3.4 --end 88 \
        [--min-sil 0.35] [--pad 0.11] [--rate 1.1] [--keep 59.6-60.75 --keep 90.85-92.3] \
        [--turns "0-25:A,25-36.75:D,36.75-45:A,45-60:P"] > pieces.json

Prints JSON pieces [{from, to, dur, spk}] in source seconds (dur = output seconds at --rate),
ready to become back-to-back clip segments. Why energy, not Whisper: Whisper word timestamps
stretch over pauses, so they hide exactly the silences you want to cut.

- --keep windows: wordless story beats to preserve (someone leaving a call, a reaction).
- --turns: split pieces at speaker changes so each speaker can get its own gain.
- Run it on the CLEANED dialogue track (silence is near-digital there); threshold = 85th
  percentile of 20 ms frames minus 24 dB, with a 160 ms hangover so soft word tails survive.
- Playing at 1.05-1.1x is usually invisible on talking heads; Remotion keeps pitch (atempo).
- Map subtitle cues from source time onto the pieces (a cue starting inside a removed gap
  snaps to the next piece).
"""
import argparse
import json
import subprocess

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("--start", type=float, default=0)
ap.add_argument("--end", type=float, default=1e9)
ap.add_argument("--min-sil", type=float, default=0.35)
ap.add_argument("--pad", type=float, default=0.11)
ap.add_argument("--rate", type=float, default=1.0)
ap.add_argument("--keep", action="append", default=[])
ap.add_argument("--turns", default="")
a = ap.parse_args()

x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
hop = 320
e = 20 * np.log10(np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)]) + 1e-9)
act = e > np.percentile(e[e > -90], 85) - 24
act2 = act.copy()
for i in np.where(act)[0]:
    act2[i:i + 8] = True
t = np.arange(len(e)) * 0.02
regs, s = [], None
for i, v in enumerate(act2):
    if v and s is None: s = i
    if not v and s is not None: regs.append((t[s], t[i])); s = None
if s is not None: regs.append((t[s], t[-1]))
merged = []
for r0, r1 in regs:
    r0, r1 = max(r0, a.start), min(r1, a.end)
    if r1 <= r0: continue
    if merged and r0 - merged[-1][1] < a.min_sil: merged[-1] = (merged[-1][0], r1)
    else: merged.append((r0, r1))
pieces = [(max(a.start, p0 - a.pad), p1 + a.pad) for p0, p1 in merged if p1 - p0 > 0.12]
turns = [(float(s.split(':')[0].split('-')[0]), float(s.split(':')[0].split('-')[1]), s.split(':')[1]) for s in a.turns.split(',') if s] or [(0, 1e9, '-')]
out = []
for p0, p1 in pieces:
    for t0, t1, spk in turns:
        lo, hi = max(p0, t0), min(p1, t1)
        if hi - lo > 0.15: out.append([lo, hi, spk])
for k in a.keep:
    k0, k1 = map(float, k.split('-')); out.append([k0, k1, 'keep'])
out.sort()
for i in range(1, len(out)):
    out[i][0] = max(out[i][0], out[i - 1][1])
out = [o for o in out if o[1] - o[0] > 0.1]
res = [{"from": round(p0, 3), "to": round(p1, 3), "dur": round((p1 - p0) / a.rate, 3), "spk": spk} for p0, p1, spk in out]
print(json.dumps(res, indent=1))
import sys
print(f"# {len(res)} pieces, {sum(r['dur'] for r in res):.1f}s out of {a.end - a.start:.1f}s", file=sys.stderr)
