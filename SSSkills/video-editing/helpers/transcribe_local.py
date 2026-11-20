"""Local word-level transcription (no API key): faster-whisper -> Scribe-shaped JSON.

Use when ELEVENLABS_API_KEY is missing. Output is compatible with pack_transcripts.py.

    pip install faster-whisper            # once
    python helpers/transcribe_local.py --edit-dir <videos_dir>/edit <video> [<video> ...]
    python helpers/transcribe_local.py --edit-dir ... --prompt "Names: Arjun, Khurana, Jaipur" <videos...>

Notes (learned the hard way):
- Audio is decoded with ffmpeg + numpy, NOT faster-whisper's own decoder: some PyAV builds
  crash with `open() got an unexpected keyword argument 'metadata_errors'`.
- Whisper stretches each word's end time to the next word's start, so INTERNAL PAUSES ARE
  INVISIBLE in the word timestamps. Never detect pauses/silences from Whisper words — use the
  audio energy (see tighten_pauses.py).
- On music-only or very noisy audio Whisper hallucinates "Thank you." Treat that output as
  "no intelligible speech", never as evidence of quality.
- Cached: existing JSONs are skipped.
"""
import argparse
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("videos", nargs="+")
ap.add_argument("--edit-dir", required=True)
ap.add_argument("--model", default="large-v3-turbo")
ap.add_argument("--language", default="en")
ap.add_argument("--prompt", default="Umm, so, uh, sir, Haan.")
ap.add_argument("--workers", type=int, default=2)
args = ap.parse_args()

out_dir = Path(args.edit_dir) / "transcripts"
out_dir.mkdir(parents=True, exist_ok=True)
model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=8, num_workers=args.workers)


def load16k(path: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def run(video: str) -> str:
    v = Path(video)
    out = out_dir / f"{v.stem}.json"
    if out.exists():
        return f"cached {v.stem}"
    segs, info = model.transcribe(load16k(v), language=args.language, word_timestamps=True, vad_filter=False,
                                  condition_on_previous_text=False, initial_prompt=args.prompt)
    words, prev = [], None
    for s in list(segs):
        for w in s.words:
            if prev is not None and w.start > prev:
                words.append({"text": " ", "start": round(prev, 3), "end": round(w.start, 3), "type": "spacing", "speaker_id": "speaker_0"})
            words.append({"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3), "type": "word",
                          "speaker_id": "speaker_0", "logprob": round(w.probability, 3)})
            prev = w.end
    text = " ".join(w["text"] for w in words if w["type"] == "word")
    out.write_text(json.dumps({"language_code": info.language, "text": text, "words": words}, indent=1), encoding="utf-8")
    return f"done {v.stem} ({len(words)} tokens)"


with ThreadPoolExecutor(args.workers) as ex:
    for r in ex.map(run, args.videos):
        print(r, flush=True)
