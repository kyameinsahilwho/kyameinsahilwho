"""Bake music with ducking/swell automation into ONE wav, then play it as a single plain track.

    python helpers/bake_score.py plan.json out.wav [--public <remotion>/public]

plan.json = {"total": <film seconds>, "items": [{"file": "music/bed.wav", "start": 0, "dur": 372.3,
             "keys": [[0, 0.63], [12.8, 0.63], [13.25, 0.2], ...]}, ...]}
keys = [seconds from the item's start, LINEAR gain], interpolated per sample.

WHY: Remotion turns an <Audio volume={(f)=>...}> callback into one nested per-frame ffmpeg
`if(between(t,..))` expression; over a few minutes it exceeds ffmpeg's expression limit and the
render fails ("Missing ')' or too many args"). Keyframes must also be STRICTLY increasing in time.

Ducking recipe that worked (dialogue p90 about -21 dBFS pre-master):
  bed open (nobody talking) -4 dB on a track whose own RMS is about -30 dBFS;
  under dialogue/VO -14 dB with 0.45 s down-ramp before the line and 0.6 s release after;
  merge speech windows closer than 1.2 s so the bed doesn't pump between lines;
  ending piece: enters at -2 dB under the final VO, swells +11 dB over 2.5 s once the VO ends,
  holds through the credits, fades over the last 2.5 s.
Re-export the plan and re-bake after ANY timeline timing change.
"""
import argparse
import json
import subprocess
import wave

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("plan")
ap.add_argument("out")
ap.add_argument("--public", default=".")
a = ap.parse_args()
SR = 48000
plan = json.load(open(a.plan))
out = np.zeros((int(plan["total"] * SR) + SR, 2), np.float32)
for it in plan["items"]:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{a.public}/{it['file']}", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32).reshape(-1, 2) / 32768
    n = int(it["dur"] * SR)
    if len(x) < n:
        x = np.tile(x, (n // len(x) + 1, 1))
    x = x[:n]
    k = sorted(it["keys"])
    env = np.interp(np.arange(n) / SR, [p[0] for p in k], [p[1] for p in k]).astype(np.float32)
    s0 = int(max(0, it["start"]) * SR)
    seg = x * env[:, None]
    out[s0:s0 + len(seg)] += seg[: len(out) - s0]
peak = np.abs(out).max()
if peak > 0.97:
    out *= 0.97 / peak
with wave.open(a.out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print("baked", a.out, round(len(out) / SR, 1), "s, peak", round(20 * np.log10(peak + 1e-9), 1), "dBFS")
