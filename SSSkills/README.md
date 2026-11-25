# SSSkills

**SSSkills is a free collection of five Claude Code agent skills that teach Claude distinctive frontend design, conversational video editing, AI video production, Windows desktop apps in Rust and how to find and install more skills.**

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-skills-D97757?style=flat-square" alt="Claude Code skills" />
  <img src="https://img.shields.io/badge/skills-5-22d3ee?style=flat-square" alt="5 skills" />
  <img src="https://img.shields.io/badge/format-SKILL.md-a78bfa?style=flat-square" alt="SKILL.md format" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/FFmpeg-required_for_video-007808?style=flat-square&logo=ffmpeg&logoColor=white" alt="FFmpeg" />
  <img src="https://img.shields.io/badge/Rust-Tauri_v2-000000?style=flat-square&logo=rust&logoColor=white" alt="Rust and Tauri v2" />
</p>

Each folder is a self-contained skill with a `SKILL.md`. Copy a folder into `~/.claude/skills/`, then start a new Claude Code session, and Claude uses the skill whenever a task matches its description.

## Why SSSkills

- **5 skills, one folder each.** `frontend-design`, `rusty-apps` and `find-skills` work as soon as the folder is copied and a new Claude Code session starts. `video-editing` needs a one-time Python install and FFmpeg, and the `3d-ai-video-edit` pipeline guides need a clone of the upstream toolkit.
- **17 video sub-guides behind one skill.** `3d-ai-video-edit` routes to FFmpeg, Remotion, moviepy, Blender, ElevenLabs, ACE-Step, LTX-2, Ideogram 4, Qwen-Image-Edit, RunPod and more, and Claude reads only the guide the task needs.
- **12 hard production rules for video edits.** `video-editing` never cuts inside a word, adds 30 ms audio fades at every cut and burns subtitles last, backed by 13 Python and Node helper scripts.
- **Edits video without an API key.** When no ElevenLabs key is set, `video-editing` falls back to local faster-whisper transcription with the same JSON shape.
- **UI audits with a scorecard.** `frontend-design` scores an interface from 1 to 10 in 7 categories from real screenshots (light and dark, desktop and phone) and keeps iterating until every category reaches 9.5.
- **A Windows Rust playbook from two shipped apps.** `rusty-apps` was written while building the Platter disk utility and the MAX File Recovery app: an 11-step playbook, 10 reference files, Rust templates that compile together as a Tauri app shell, and screenshot and launch-benchmark scripts.
- **Upstream credited and licenses kept.** The table below credits each skill's upstream source, and upstream license files are kept in the skill folders. `rusty-apps` is original to this collection.

## The skills

| Skill | What it does | Based on |
| --- | --- | --- |
| [frontend-design](frontend-design/) | Distinctive visual design for new UI, plus audits of existing product UI | Extended from Anthropic's [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache 2.0, `LICENSE.txt`) |
| [video-editing](video-editing/) | Edit raw footage by conversation: transcribe, cut, grade, animate, subtitle | Extended from Browser Use's [video-use](https://github.com/browser-use/video-use) (MIT, `LICENSE`) |
| [3d-ai-video-edit](3d-ai-video-edit/) | All-in-one video production router: FFmpeg, Remotion, Blender, AI voice, music, clips and images | Bundled from Digital Samba's [claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) (MIT, `LICENSE-video-toolkit`) |
| [rusty-apps](rusty-apps/) | Build, speed up and ship Windows desktop apps in Rust with Tauri v2, Win32 and an NSIS installer | Original, learned building [Platter](https://github.com/kyameinsahilwho/platter) and [MAX File Recovery](https://github.com/kyameinsahilwho/ReincarnateMax) |
| [find-skills](find-skills/) | Search for and install agent skills with the `npx skills` CLI | The find-skills skill from Vercel Labs' [skills](https://github.com/vercel-labs/skills) repo |

## Features

### 🎨 frontend-design

**Triggers when** you ask Claude to build a new page or component, restyle an existing UI, pick a palette or type scale, or audit and polish a dashboard, editor or admin panel.

- Plans a compact token system first (4 to 6 role-named colors, type scale, layout, point of view, flow, custom parts), reviews it against the brief, then builds.
- Treats premium craft as core, not polish: every state designed (what just happened, undo, what's next), one pattern per recurring situation across screens, and failure states that carry the fix inline.
- Makes the product's own parts: custom SVG icons drawn to the icon library's exact spec for product-specific concepts and live-data icons, one or two signature details, and flows built from the user's job with no dead ends.
- Calls out the common "generated UI" defaults by name (cream background with terracotta accent, SaaS card kit, emoji as icons, four KPI cards on every page) so Claude avoids them unless the brief asks for them.
- Product UI audit covers hierarchy and typography, containers and radii, color and affordance, theme contrast, layout balance, flows, states and information architecture, and coherence, recovery and custom parts.
- Editor pass before calling it done: break it on purpose (network off mid-flow, failed payment, empty lists), walk the whole journey as a real user, push past the first acceptable result.
- Screenshot-verified hill-climbing: score 7 categories (failure, empty and limit states included), fix the lowest, re-screenshot, repeat until each scores 9.5/10 or higher.
- Adds `references/ui-craft.md`: a 12-section rule set with concrete numbers (type scales, line heights, color ramps, dark mode, spacing, mobile touch targets), each rule traced to a video id from the @juxtopposed (J-01 to J-44) and @kolejain (K-01 to K-54) catalogues.
- Adds `references/premium-craft.md`: an 11-state matrix, coherence audit, failure-recovery recipe, custom icon spec with an SVG template and a live-date calendar icon, signature details, and a flow brief template, distilled from Tim Gabe's "The Psychology of Premium Apps" and Katie Dill's (Stripe) "How to scale intent, quality, and artistry with AI", with timestamps.

### ✂️ video-editing

**Triggers when** you ask Claude to edit a folder of footage: talking heads, montages, tutorials, travel, interviews, launch videos. Typical prompt: "edit these into a launch video".

- Reads the video instead of watching it: word-level transcripts packed into one `takes_packed.md`, plus on-demand filmstrip and waveform PNGs at decision points.
- Asks, proposes a 4 to 8 sentence strategy, waits for your OK, renders, then self-checks the output at every cut boundary before showing it to you.
- Color grading presets or custom FFmpeg filter chains, styled burned-in subtitles, and animation overlays built in parallel sub-agents with HyperFrames, Remotion, Manim (bundled `skills/manim-video` guide) or PIL.
- Additions over upstream video-use: 7 more helpers (`transcribe_local.py`, `make_proxies.py`, `enhance_dialogue.py`, `tighten_pauses.py`, `bake_score.py`, `measure_mix.py`, `remotion_stills.cjs`), a `templates/remotion-edit` timeline-as-code project (Remotion 4.0.544) for long back-and-forth edits, and field notes in `references/`.
- Session memory in `edit/project.md`, so the next session picks up where the last one stopped. All output goes to `<videos_dir>/edit/`, never into the skill folder.

### 🎬 3d-ai-video-edit

**Triggers when** a task involves making or processing video: convert, trim, compress, caption, overlay, render, voiceover, soundtrack, b-roll, demo video, explainer, thumbnail or title card.

- One `SKILL.md` router with a task table pointing to 17 `GUIDE.md` sub-guides.
- Standalone guides that need no extra repo: `ffmpeg`, `moviepy`, `remotion-official` (12 official Remotion sub-skills), `playwright-recording`, `video-design`, and `elevenlabs` (API key only).
- Guides for the toolkit pipeline (`video-toolkit`, `ltx2`, `acestep`, `qwen-edit`, `blender`, `runpod`, `synthetic-ui-demo`, `parody-short`) run tools from a clone of claude-code-video-toolkit. The skill tells Claude to ask before cloning it.
- Suggested order for a full video: pick a route, design the look, build in Remotion or moviepy, generate assets, finish with FFmpeg.

### 🦀 rusty-apps

**Triggers when** you ask Claude to create, extend, debug, speed up, package or install a Windows desktop, tray or system-utility app in Rust or Tauri (disk, battery, cleanup, drives, data recovery, system tools), mention Tauri, WebView2, windows-sys, windres/MinGW, NSIS, UAC or single instance for such an app, or ask for a Windows app with an installer without naming a language. It stays out of Rust CLIs, libraries, web servers, WASM and cross-platform work.

- An 11-step playbook: toolchain check, scaffold, a feasibility spike that calls each real API before any UI is designed, design pass, a `CONTRACT.md` with parallel subagents, a mock-backed UI, a real-machine build, adversarial review, measured optimization, the installer, and an honest report.
- Builds on the GNU toolchain without Visual Studio, and fixes the MinGW `windres` failure on project paths that contain a space before the first build.
- Picks the smallest elevation model that works (one-shot elevated helper, scheduled task, or whole-app relaunch with an optional UAC prompt at startup), plus single instance without a plugin, a race-free elevated handoff and UIPI message filters.
- Win32 from Rust with `windows-sys`: drives and IOCTLs, WMI and Task Scheduler over raw COM and the Event Log through its native API instead of PowerShell (disk info 1,357 ms to 557 ms), and child processes that never flash a console.
- Fast directory scanning with `FileIdBothDirectoryInfo`, hard-link and cloud-placeholder aware sizes, and handle-based, junction-safe deletion for anything that runs elevated.
- Raw volume and disk reads that tolerate bad sectors, destination checks so recovered files never land on the source drive (junctions, `subst`, loopback shares, VHDs), Range streaming of large videos to the WebView, and one SQLite file per long job.
- Ready-to-adapt templates: `main.rs`, `util.rs`, `perf.rs`, `cache.rs` and `other_account.rs` compile together as a Tauri app shell (7 tests pass), plus an NSIS close-running-app hook, an installer-bitmap generator and a space-free Cargo target dir.
- Test and measurement scripts: `shoot.mjs` (mock UI screenshots in headless Chrome), `winshot.ps1` (DPI-aware real-window screenshots) and `launch-bench.ps1` (launch medians over the app and WebView2 process tree). On Platter, CPU used in the first 15 s after launch fell from 20.7 s to 1.9 s.
- Includes the author's own defaults (parallel subagents, errors as one plain sentence, an admin prompt at startup for admin-heavy apps, an explicit "not tested" list). Edit the "Defaults this user expects" section of `SKILL.md` to match yours.

### 🔎 find-skills

**Triggers when** you ask "how do I do X", "find a skill for X" or "is there a skill that can...".

- Runs `npx skills find <query>`, presents matches with install commands and a [skills.sh](https://skills.sh/) link.
- Installs on request with `npx skills add <owner/repo@skill> -g -y`.
- If nothing fits, says so and offers to do the task directly.

## Quick start

Clone the repo and copy the skills you want into your Claude Code skills folder.

```sh
git clone https://github.com/kyameinsahilwho/kyameinsahilwho.git
mkdir -p ~/.claude/skills
cp -r kyameinsahilwho/SSSkills/frontend-design ~/.claude/skills/
cp -r kyameinsahilwho/SSSkills/find-skills ~/.claude/skills/
cp -r kyameinsahilwho/SSSkills/rusty-apps ~/.claude/skills/
```

On Windows (PowerShell):

```powershell
git clone https://github.com/kyameinsahilwho/kyameinsahilwho.git
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse kyameinsahilwho\SSSkills\frontend-design "$HOME\.claude\skills\"
Copy-Item -Recurse kyameinsahilwho\SSSkills\rusty-apps "$HOME\.claude\skills\"
```

Keep the folder names as they are: the skill name in `SKILL.md` matches the folder, and `video-editing` expects to live at `~/.claude/skills/video-editing/`. To scope a skill to one project, copy it into that project's `.claude/skills/` instead.

### Extra setup for video-editing

```sh
cd ~/.claude/skills/video-editing
uv sync                      # or: pip install -e .   (Python 3.10+)
cp .env.example .env         # then set ELEVENLABS_API_KEY=...
```

- `ffmpeg` and `ffprobe` must be on your `PATH`. `yt-dlp` is optional, for pulling sources from URLs.
- No ElevenLabs key? Install `faster-whisper` and the skill uses `helpers/transcribe_local.py` instead.
- Node.js is needed only when an edit uses HyperFrames (Node 22+) or Remotion overlays.
- See [`video-editing/install.md`](video-editing/install.md) for the full install notes.

### Extra setup for 3d-ai-video-edit

The FFmpeg, moviepy, Remotion, Playwright, video design and ElevenLabs guides work as-is. The pipeline guides (LTX-2, ACE-Step, Qwen edit, Blender, RunPod and others) need a clone of [claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit), which uses `uv`, with API keys in that repo's `.env`.

## How it works

Claude Code reads the `name` and `description` from each `SKILL.md` frontmatter at startup. When your request matches a description, Claude loads that skill's full instructions and any referenced files (guides, helpers, references) only as needed, so installed skills cost little context until they are used. You can also call a skill directly by name, for example `/frontend-design`.

```
SSSkills/
├── frontend-design/     SKILL.md, references/ (ui-craft.md, premium-craft.md), LICENSE.txt
├── video-editing/       SKILL.md, install.md, helpers/, templates/remotion-edit/, skills/manim-video/, LICENSE
├── 3d-ai-video-edit/    SKILL.md, 17 sub-guide folders, LICENSE-video-toolkit
├── rusty-apps/          SKILL.md, references/ (10 files), assets/templates/, scripts/
└── find-skills/         SKILL.md
```

## Tech stack

- **Skill format:** Markdown `SKILL.md` files with YAML frontmatter (Claude Code agent skills)
- **Video editing:** Python 3.10+ (`requests`, `librosa`, `matplotlib`, `pillow`, `numpy`), FFmpeg, ElevenLabs Scribe or faster-whisper
- **Animation and rendering:** Remotion, HyperFrames, Manim, PIL, moviepy, Blender
- **AI media:** ElevenLabs, ACE-Step, LTX-2, Ideogram 4, Qwen-Image-Edit, RunPod
- **Windows desktop apps:** Rust (GNU or MSVC toolchain), Tauri v2, `windows-sys` 0.59, WebView2, vanilla HTML/CSS/JS, NSIS; Node.js for the Tauri CLI and Puppeteer screenshots
- **Skill discovery:** the `npx skills` CLI and skills.sh

## FAQ

### Is SSSkills free?

Yes. The skills are plain Markdown and scripts you can copy into `~/.claude/skills/`. Some features call paid services, such as ElevenLabs for transcription and voiceover or RunPod for cloud GPUs, and those need your own account.

### How do I install a Claude Code skill from SSSkills?

Copy the skill's folder into `~/.claude/skills/` (or a project's `.claude/skills/`) and start a new Claude Code session. Claude then uses it whenever your request matches the skill's description.

### Does the video-editing skill upload my videos?

Only the audio transcription step uses a cloud API: ElevenLabs Scribe, when you set `ELEVENLABS_API_KEY`. Without a key it transcribes locally with faster-whisper, and cutting, grading and rendering always run locally with FFmpeg.

### What is the difference between video-editing and 3d-ai-video-edit?

`video-editing` turns your own raw footage into a finished cut by reading transcripts and following strict cut rules. `3d-ai-video-edit` is a router for making and processing video in general, including FFmpeg conversions, Remotion builds, Blender shots and AI-generated voice, music, clips and images.

### Does rusty-apps work for cross-platform or command-line Rust projects?

No. `rusty-apps` covers Windows desktop GUI apps in Rust or Tauri: tray and system utilities, disk and recovery tools, and their installers. Its description tells Claude to skip Rust CLIs, libraries, parsers, web servers, WASM and cross-platform or non-Windows work.

### Can I use these skills with agents other than Claude Code?

They are written for Claude Code. The `video-editing` install notes also cover registering it with Codex (`~/.codex/skills/`), and `find-skills` uses the `npx skills` CLI from the open agent skills ecosystem.

### Where do these skills come from?

Three are based on open-source upstream skills: Anthropic's frontend-design, Browser Use's video-use and Digital Samba's claude-code-video-toolkit, with their license files kept in each folder. find-skills comes from Vercel Labs' skills repo. The additions (UI craft and premium craft references, audit scorecard, extra video helpers and the Remotion edit template) were written for this collection. `rusty-apps` is fully original: it was written while building [Platter](https://github.com/kyameinsahilwho/platter) and [MAX File Recovery](https://github.com/kyameinsahilwho/ReincarnateMax), two Windows apps in Rust.

## Part of CodingMarvel

SSSkills is part of [CodingMarvel](https://codingmarvel.com), a set of small, focused tools.

- [Love for PDF](https://pdf.codingmarvel.com): 35+ PDF tools that run in your browser
- [Video Grid Maker](https://video-grid-maker.codingmarvel.com): video contact sheets and thumbnail grids
- [Ehmatrix](https://ehmatrix.codingmarvel.com): Eisenhower matrix to-do list
- [HabitGrid](https://habitgrid.codingmarvel.com): printable habit tracker PDFs
- [Platter](https://github.com/kyameinsahilwho/platter): Windows disk utility in Rust
- [MAX File Recovery](https://github.com/kyameinsahilwho/ReincarnateMax): Windows data recovery app in Rust
