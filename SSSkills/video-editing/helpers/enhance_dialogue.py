"""Dialogue cleanup, per clip, with a profile chosen by how the mic was placed.

Run inside a Python 3.11 venv (DeepFilterNet has no wheels for 3.13):
    uv venv -p 3.11 <edit>/tools/.venv-df
    uv pip install -p <edit>/tools/.venv-df/Scripts/python.exe --index-url https://download.pytorch.org/whl/cpu torch==2.1.2 torchaudio==2.1.2
    uv pip install -p <edit>/tools/.venv-df/Scripts/python.exe deepfilternet==0.5.6 soundfile "numpy<2" demucs==4.0.1
    <venv python> helpers/enhance_dialogue.py --proxies <edit>/proxies --out <edit>/enh  STEM[:profile] ...

Writes <out>/<stem>.wav (48 kHz mono). The edit then plays this clean track instead of the
camera audio (Remotion engine: listed in engine/enhanced.ts; ClipRef.rawAudio overrides).

PROFILES (pick per clip; verify every result with --check):
  near    close phone mic, decent SNR (>15 dB): DeepFilterNet3, attenuation CAPPED at 28 dB + EQ/comp.
  soft    soft-spoken / quiet first words: NO DeepFilterNet. afftdn (stationary, non-gating)
          + presence EQ + 3:1 comp with makeup. DeepFilterNet crushed a soft speaker's first
          words by 17 dB even at a 10 dB cap.
  far     distant mic in wind/room (SNR < 10 dB): Demucs htdemucs_ft vocals (continuous,
          never chops) + a voice-KEYED blend of a lightly denoised layer (fills consonants
          without bringing noise back between words) + gentle warm EQ.
  raw     keep camera audio (music playing in-scene, whispers DF thins out).

WHAT FAILED (don't repeat):
  - Full-strength DeepFilterNet on 7 dB SNR speech: deleted the speech with the noise.
  - Two DeepFilterNet passes: "loud but echoey/not crisp" (reverb tails pumped up).
  - Noise GATE (agate) on noisy dialogue: chopped quiet syllables ("cuts in between").
  - VoiceFixer (generative restoration): garbled low-SNR speech; Whisper hallucinated "Thank you".
  - Presence boost (+3..5 dB @3-5 kHz) + 150 Hz high-pass on a distant voice: "too sharp".

CHECK every candidate (--check): Whisper transcript (does it read better than raw?), SNR
(p90/p10 of 100 ms RMS), DROPOUTS (% of 50 ms frames where the raw 300-3400 Hz band has speech
but the processed track is >18 dB below its own p90) and HARSHNESS (3-8 kHz vs 0.3-3 kHz energy;
a natural close-mic voice measured about -21 dB). Never trust Whisper confidence alone.
"""
import argparse
import subprocess
from pathlib import Path

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("stems", nargs="+")
ap.add_argument("--proxies", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--check", action="store_true", help="print SNR/dropouts/harshness vs raw")
args = ap.parse_args()
OUT = Path(args.out)
(OUT / "_work").mkdir(parents=True, exist_ok=True)

POST = {
    "near": "highpass=f=85,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.0:g=2.5,acompressor=threshold=-24dB:ratio=2.5:attack=8:release=120:makeup=2",
    "soft": "afftdn=nr=12:nf=-44:tn=1,equalizer=f=220:t=q:w=1.0:g=1,equalizer=f=3000:t=q:w=1.0:g=3,acompressor=threshold=-30dB:ratio=3:attack=8:release=160:makeup=6,alimiter=limit=0.9",
    "warm": "equalizer=f=200:t=q:w=1.0:g=1.5,equalizer=f=4000:t=q:w=1.2:g=-1.5,highshelf=f=8000:g=-2.5,lowpass=f=10000,acompressor=threshold=-24dB:ratio=1.8:attack=20:release=250:makeup=1.5",
}


def ff(*a):
    subprocess.run(["ffmpeg", "-y", "-v", "error", *a], check=True)


def load(p, sr=48000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def save(p, x, sr=48000):
    import wave
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


_df = None


def df(inp, out, cap):
    global _df
    import torch
    from df.enhance import enhance, init_df, load_audio, save_audio
    torch.set_num_threads(12)
    if _df is None:
        _df = init_df()
    model, st, _ = _df
    a, _ = load_audio(str(inp), sr=st.sr())
    save_audio(str(out), enhance(model, st, a.mean(0, keepdim=True), atten_lim_db=cap), st.sr())


def demucs_vocals(inp, out):
    import torch
    from demucs.apply import apply_model
    from demucs.audio import AudioFile, save_audio
    from demucs.pretrained import get_model
    m = get_model("htdemucs_ft"); m.eval()
    wav = AudioFile(str(inp)).read(streams=0, samplerate=m.samplerate, channels=m.audio_channels)
    ref = wav.mean(0); wav = (wav - ref.mean()) / ref.std()
    with torch.no_grad():
        src = apply_model(m, wav[None], device="cpu", shifts=2, split=True, overlap=0.25, progress=False)[0]
    save_audio(src[m.sources.index("vocals")] * ref.std() + ref.mean(), str(out), m.samplerate)


def keyed_blend(vox_p, layer_p, out_p, weight=0.7):
    """layer follows the clean voice's envelope (10 ms attack / 180 ms release, floor 15%)."""
    vox, lay = load(vox_p), load(layer_p)
    n = min(len(vox), len(lay)); vox, lay = vox[:n], lay[:n]
    hop = 240
    fr = np.sqrt(np.convolve(vox ** 2, np.ones(hop) / hop, "same"))[::hop] + 1e-9
    db = 20 * np.log10(fr); tgt = np.clip((db - (np.percentile(db, 92) - 26)) / 14, 0, 1)
    env = np.zeros_like(tgt); a = 1 - np.exp(-1 / (0.010 * 48000 / hop)); r = 1 - np.exp(-1 / (0.180 * 48000 / hop))
    for i, t in enumerate(tgt):
        p = env[i - 1] if i else 0; env[i] = p + (a if t > p else r) * (t - p)
    mask = np.interp(np.arange(n), np.arange(len(env)) * hop, env)
    save(out_p, vox + weight * 10 ** (-3 / 20) * lay * (0.15 + 0.85 * mask))


def metrics(raw_p, proc_p):
    def env(x, w=800): return 20 * np.log10(np.array([np.sqrt(np.mean(x[j:j + w] ** 2)) for j in range(0, len(x) - w, w)]) + 1e-9)
    rb = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(raw_p), "-af", "highpass=f=300,lowpass=f=3400", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                                      capture_output=True).stdout, np.int16).astype(np.float32) / 32768
    sp = env(rb) > np.percentile(env(rb), 70)
    e = env(load(proc_p, 16000)); n = min(len(e), len(sp))
    drop = np.mean(e[:n][sp[:n]] < np.percentile(e, 90) - 18) * 100
    x = load(proc_p); X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / 48000)
    harsh = 10 * np.log10(X[(f > 3000) & (f < 8000)].sum() / X[(f > 300) & (f < 3000)].sum())
    return f"SNR {np.percentile(e, 90) - np.percentile(e, 10):.0f} dB | dropouts {drop:.1f}% | harshness {harsh:.1f} dB"


for item in args.stems:
    stem, _, prof = item.partition(":")
    prof = prof or "near"
    src = Path(args.proxies) / f"{stem}.mp4"
    W = OUT / "_work"
    dst = OUT / f"{stem}.wav"
    ff("-i", str(src), "-vn", "-ac", "1", "-ar", "48000", "-af", "highpass=f=80", str(W / f"{stem}_raw.wav"))
    if prof == "near":
        df(W / f"{stem}_raw.wav", W / f"{stem}_df.wav", 28)
        ff("-i", str(W / f"{stem}_df.wav"), "-af", POST["near"], "-ar", "48000", "-ac", "1", str(dst))
    elif prof == "soft":
        ff("-i", str(W / f"{stem}_raw.wav"), "-af", POST["soft"], "-ar", "48000", "-ac", "1", str(dst))
    elif prof == "far":
        ff("-i", str(src), "-vn", "-ac", "2", "-ar", "44100", "-af", "highpass=f=80,volume=8dB", str(W / f"{stem}_st.wav"))
        demucs_vocals(W / f"{stem}_st.wav", W / f"{stem}_vox.wav")
        ff("-i", str(W / f"{stem}_vox.wav"), "-af", "aresample=48000,highpass=f=90", "-ac", "1", str(W / f"{stem}_voxm.wav"))
        ff("-i", str(src), "-vn", "-ac", "1", "-ar", "48000", "-af", "highpass=f=150,afftdn=nr=12:nf=-40,volume=10dB", str(W / f"{stem}_pre.wav"))
        df(W / f"{stem}_pre.wav", W / f"{stem}_layer0.wav", 10)
        ff("-i", str(W / f"{stem}_layer0.wav"), "-af", "afftdn=nr=14:nf=-42:tn=1,highpass=f=90", str(W / f"{stem}_layer.wav"))
        keyed_blend(W / f"{stem}_voxm.wav", W / f"{stem}_layer.wav", W / f"{stem}_blend.wav")
        ff("-i", str(W / f"{stem}_blend.wav"), "-af", POST["warm"], "-ar", "48000", "-ac", "1", str(dst))
    elif prof == "raw":
        ff("-i", str(W / f"{stem}_raw.wav"), "-ar", "48000", "-ac", "1", str(dst))
    print("enhanced", stem, prof, metrics(src, dst) if args.check else "", flush=True)
