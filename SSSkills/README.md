# SSSkills

My Claude Code agent skills. Each folder is a self-contained skill with a `SKILL.md`.

| Skill | What it does |
| --- | --- |
| [frontend-design](frontend-design/) | Distinctive visual design for new UI and product UI audits: type, color systems, dark mode, layout, component states and UX flows, with screenshot-verified hill-climbing to 9.5/10 across 6 categories. Includes `references/ui-craft.md`, a detailed rule set drawn from the @juxtopposed and @kolejain video catalogues. |
| [video-editing](video-editing/) | Edit any video by conversation: transcribe, cut, color grade, overlay animations, burn subtitles. |
| [3d-ai-video-edit](3d-ai-video-edit/) | All-in-one video production router: FFmpeg, Remotion, Blender, AI voiceover/music/clips/images, and more. Bundled from digitalsamba/claude-code-video-toolkit. |
| [find-skills](find-skills/) | Discover and install agent skills for a task. |

## Install

Copy a skill folder into `~/.claude/skills/`:

```sh
cp -r SSSkills/frontend-design ~/.claude/skills/
```

Licenses are kept inside each skill folder where the original came with one.
