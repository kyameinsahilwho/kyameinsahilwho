"""Measure a rendered mix: loudness, per-section levels, dead air. (You cannot listen — measure.)

    python helpers/measure_mix.py <render.mp4|wav> [--segtimes segtimes.tsv] [--ids s2_desk,s3_i1,...]

segtimes.tsv lines: "<seg id>\t<start s>\t<start frame>\t<dur s>" (print it from the timeline).

Reports:
- integrated LUFS + true peak (ebur128), target -16 LUFS / <= -1.5 dBTP for review & final;
- per-segment speech level = 90th percentile of 100 ms RMS (p90). Level dialogue so every
  speaker lands within about 2 dB (target about -21 dBFS pre-master, about -16 post-master).
  A soft-spoken character can sit +1.5 dB;
- dead air: count of 100 ms frames below -70 dBFS (cleaned dialogue tracks are digitally silent
  between lines — fill with a music bed or a VERY low room tone; a room tone around -40 dBFS
  after mastering was heard as "white noise throughout" and had to be removed).
Short windows of continuous VO read 2-3 dB hotter in p90 than dialogue windows with pauses;
compare like with like before "fixing" them.
"""
import argparse
import subprocess

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("media")
ap.add_argument("--segtimes")
ap.add_argument("--ids", default="")
a = ap.parse_args()
ebu = subprocess.run(["ffmpeg", "-hide_banner", "-i", a.media, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
summ = ebu[ebu.rfind("Summary"):]
print("\n".join(l.strip() for l in summ.splitlines() if l.strip().startswith(("I:", "Peak:"))))
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", a.media, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
fr = 20 * np.log10(np.array([np.sqrt(np.mean(x[i:i + 1600] ** 2)) for i in range(0, len(x) - 1600, 1600)]) + 1e-9)
print("dead-air frames (<-70 dBFS, excl. last 1.5 s):", int((fr[:-15] < -70).sum()))
if a.segtimes:
    rows = {l.split("\t")[0]: (float(l.split("\t")[1]), float(l.split("\t")[3])) for l in open(a.segtimes) if not l.startswith("TOTAL")}
    ids = [i for i in a.ids.split(",") if i] or list(rows)
    for k in ids:
        s0, d = rows[k]
        s = x[int(s0 * 16000):int((s0 + d) * 16000)]
        f2 = [np.sqrt(np.mean(s[i:i + 1600] ** 2)) for i in range(0, max(len(s) - 1600, 1), 1600)]
        print(f"{k:14s} p90 {20 * np.log10(np.percentile(f2, 90) + 1e-9):6.1f}  rms {20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-9):6.1f}")
