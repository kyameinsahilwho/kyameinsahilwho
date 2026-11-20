"""Edit proxies: 1080p (or 1080x1920 for rotated portrait) H.264, 30 fps, keyframe every 1 s.

    python helpers/make_proxies.py <src_dir> <edit_dir>/proxies [--threads 6]

- Applies rotation metadata (phone portrait clips report 1920x1080 + rotation -90).
- Converts HLG/HDR (yuv420p10le, arib-std-b67) to 8-bit BT.709. On phone HLG footage a plain
  conversion looked more natural than zscale+tonemap (hable too contrasty, mobius washed out);
  eyeball one frame of each before committing.
- 120 fps sources are resampled to 30 fps (fine for speech; slow-mo is built separately).
- Keep proxies OUT of the source folder; the source is never modified.
- For a REFRAME (punch-in) don't zoom the 1080 proxy — crop from the 4K/1440p original into a
  separate proxy (e.g. crop_<stem>.mp4) so it stays sharp; point the clip's audio back at the
  original stem (Remotion engine: ClipRef.audioSrc).
"""
import argparse
import subprocess
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("src_dir")
ap.add_argument("out_dir")
ap.add_argument("--threads", type=int, default=6)
args = ap.parse_args()
out = Path(args.out_dir)
out.mkdir(parents=True, exist_ok=True)


def probe(f: Path, entries: str, stream="v:0") -> str:
    return subprocess.run(["ffprobe", "-v", "error", "-select_streams", stream, "-show_entries", entries, "-of", "csv=p=0", str(f)],
                          capture_output=True, text=True).stdout.strip()


for f in sorted(Path(args.src_dir).iterdir()):
    if f.suffix.lower() not in {".mp4", ".mov", ".m4v", ".mkv"}:
        continue
    dst = out / f"{f.stem}.mp4"
    if dst.exists():
        continue
    rot = probe(f, "stream_side_data=rotation")
    scale = "scale=1080:1920" if rot else "scale=1920:1080"
    tmp = dst.with_suffix(".tmp.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(f), "-vf", f"{scale}:flags=lanczos,fps=30,format=yuv420p",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-g", "30", "-threads", str(args.threads),
                    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(tmp)], check=True)
    tmp.replace(dst)
    print("proxy", f.stem, "(portrait)" if rot else "", flush=True)
