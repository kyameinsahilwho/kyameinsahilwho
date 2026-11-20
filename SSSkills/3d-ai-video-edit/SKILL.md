---
name: 3d-ai-video-edit
description: All-in-one video production and editing skill (bundled from digitalsamba/claude-code-video-toolkit). Routes to sub-guides for FFmpeg editing/conversion, Remotion (React video) incl. official Remotion best practices, moviepy Python composition, Playwright screen recording, synthetic UI product demos, visual video design, Blender 3D shots/idents, AI voiceover/SFX/music (ElevenLabs, ACE-Step), AI video clips (LTX-2), AI image generation/editing (Ideogram 4, Qwen-Image-Edit), cloud GPU (RunPod), parody/comedy shorts, YouTube stats, and the end-to-end video toolkit job pipeline. Use for any video creation, editing, trimming, converting, compressing, captioning, overlaying, rendering, voiceover, soundtrack, b-roll, demo video, explainer, thumbnail or title-card task.
---

# 3D AI Video Edit

One skill bundling every skill from [claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit)
(MIT, see `LICENSE-video-toolkit`). Each sub-guide lives in its own folder next to this file as `GUIDE.md`, with
any supporting `.md` references beside it. **Read only the guide(s) the task needs**, then follow them.

## Route by task

| Task | Read |
|---|---|
| Convert, trim, cut, resize, compress, extract audio, GIF↔MP4, concat, any media transform | `ffmpeg/GUIDE.md` (+ `ffmpeg/reference.md`) |
| Python compositing: text/captions/lower-thirds over clips, short ad spots, `build.py` projects | `moviepy/GUIDE.md` |
| Remotion (React) videos: framework, hooks, animation, captions, audio, maps, rendering | `remotion-official/GUIDE.md` (router to its sub-folders) |
| Remotion toolkit patterns: custom transitions, shared components, motion craft | `remotion/GUIDE.md` (+ `motion-craft.md`, `reference.md`) |
| Look & feel: palettes, type scale, layouts for 16:9 / 9:16, critique of a render | `video-design/GUIDE.md` |
| Record a browser/app walkthrough as video | `playwright-recording/GUIDE.md` |
| Product demo / release-notes video rebuilt from app source (no screen recording) | `synthetic-ui-demo/GUIDE.md` |
| 3D characters, product shots, device mockups, logo idents in Blender | `blender/GUIDE.md` |
| Voiceover, narration, sound effects, voice cloning (ElevenLabs) | `elevenlabs/GUIDE.md` |
| Background music, songs, stems, covers (ACE-Step) | `acestep/GUIDE.md` |
| AI video clips, b-roll, animate an image (LTX-2.3) | `ltx2/GUIDE.md` |
| Images with legible on-image text: thumbnails, title cards (Ideogram 4) | `ideogram4/GUIDE.md` |
| Edit photos keeping identity, restyle, costume, reframe (Qwen-Image-Edit) | `qwen-edit/GUIDE.md` |
| Cloud GPU endpoints, costs, troubleshooting | `runpod/GUIDE.md` |
| Comedy/parody shorts about a team, club, family or shared topic | `parody-short/GUIDE.md` |
| How published videos perform on YouTube | `youtube-stats/GUIDE.md` |
| Brief → finished MP4 via the toolkit's job pipeline; overview of all routes and tools | `video-toolkit/GUIDE.md` |

For a full video, typical order: `video-toolkit` (pick a route) → `video-design` → build with `remotion` /
`moviepy` → assets via `elevenlabs` / `acestep` / `ltx2` / `ideogram4` → finish with `ffmpeg`.

## Paths and dependencies

- References inside the guides to `~/.claude/skills/3d-ai-video-edit/<name>/` point at the sibling folders here.
- Paths such as `tools/*.py`, `lib/components/`, `templates/`, `examples/`, `docs/`, `kits/` and `.env` are
  **relative to the toolkit repository root**, not to this skill. Guides that use them (job pipeline, LTX-2,
  ACE-Step, Qwen edit, Blender, RunPod, synthetic UI demo, parody short, toolkit Remotion components) need the repo:
  check whether the user already has a clone; if not, ask before cloning
  `https://github.com/digitalsamba/claude-code-video-toolkit` and run the tools from its root (it uses `uv`).
- Standalone guides (no repo needed): `ffmpeg`, `moviepy`, `remotion-official`, `playwright-recording`,
  `video-design`, `elevenlabs` (API key only).
- API keys (ElevenLabs, RunPod, Modal, etc.) belong in the toolkit's `.env`; never ask the user to paste them in chat.
