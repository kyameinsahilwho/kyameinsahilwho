# remotion-edit — a timeline-as-code editor for iterative, back-and-forth edits

Use this instead of `helpers/render.py` when the user expects many review rounds, split-screen
dialogue, UI/screen graphics, subtitles and a score. One file (`src/timeline.ts`) is the whole cut.

## Start a project
```
cp -r <skill>/templates/remotion-edit <videos_dir>/edit/remotion
cd <videos_dir>/edit/remotion && npm install          # Remotion 4.0.544, React 19
# Windows: link proxies + cleaned audio into public/ (junctions, no copies)
cmd /c "mklink /J public\proxies ..\proxies"   &&   cmd /c "mklink /J public\enh ..\enh"
mkdir public\vo public\sfx public\music
npm run studio                                      # live preview / scrub in the browser
```
Fonts load from `@remotion/google-fonts` in `src/theme.ts` (Bebas Neue display, Inter UI, Arimo subtitles).

## Model (src/engine/types.ts)
- `segments` (back-to-back): `clip` (layout `cover` | `pillar` for 9:16 phone clips with blurred fill |
  `half-left` for a person + a UI panel), `split` (two takes side by side), `graphic`, `placeholder`
  (slot for footage not shot yet), `video`.
- `ClipRef`: `src` proxy stem, `from`, `rate`, `zoom/focusX/focusY/driftZoom`, `freeze`,
  `rawAudio` (skip the cleaned track), `audioSrc` (cleaned dialogue from another stem, e.g. a reframed crop).
- `overlays` / `audio` / `CAPTIONS`: anchored `{at: segId, offset}` — never absolute times.
- Transitions: `cut | fade | dip | flash | rewind`. `freezeLast` holds the last frame.
- Cleaned dialogue: stems listed in `engine/enhanced.ts` play `public/enh/<stem>.wav` instead of the camera audio.

## Render
```
# review (720p — scale must give integer dims; 0.6667 crashes):
npx remotion render src/index.ts Clean out.mp4 --public-dir=public --scale=0.6666666666666666 --crf=21 --concurrency=6
# final 1080p:
npx remotion render src/index.ts Clean out.mp4 --public-dir=public --crf=18 --x264-preset=veryfast --concurrency=6 --timeout=120000
# audio only (fast; then mux into an existing picture with -c:v copy):
npx remotion render src/index.ts Clean mix.wav --public-dir=public --codec=wav
```
Then master: two-pass `loudnorm=I=-16:TP=-1.5:LRA=11` on the audio, `-c:v copy`.
- `--gl=angle` was ~2x SLOWER here (bottleneck is video decode/compositing, not WebGL).
- concurrency 8 crashed the compositor ("Request closed") on variable-rate listener clips; 6 is stable.
  A single-frame "Timeout (30000ms)" at a dense split: re-run with `--timeout=120000`.
- Kill leftovers after a stopped render: node processes whose command line contains `remotion`
  + every `chrome-headless-shell.exe` (don't kill all node — MCP servers run on node).

## Things that bit us
- Per-segment entrance animations on split labels flicker at every line change → keep labels static.
- Toggling a "dim the listener" layer per line also flickers → don't.
- `<Audio volume={(f)=>…}>` over minutes overflows ffmpeg's expression parser → bake music automation
  (`helpers/bake_score.py`); keyframe times must be strictly increasing.
- `<Freeze>` on a listener looks dead; rate-matched continuous playback (see `call()`) reads natural.
- JSON imports need `"resolveJsonModule": true` in tsconfig.
