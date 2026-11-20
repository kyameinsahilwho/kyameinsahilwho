# SSSkills

My Claude Code agent skills. Each folder is a self-contained skill with a `SKILL.md`.

| Skill | What it does |
| --- | --- |
| [frontend-design](frontend-design/) | Distinctive visual design for new UI, plus product UI audits against core design system standards (type scale, radii, affordance, theme contrast) with screenshot-verified hill-climbing to 9.5/10. |
| [video-editing](video-editing/) | Edit any video by conversation: transcribe, cut, color grade, overlay animations, burn subtitles. |
| [3d-ai-video-edit](3d-ai-video-edit/) | All-in-one video production router: FFmpeg, Remotion, Blender, AI voiceover/music/clips/images, and more. Bundled from digitalsamba/claude-code-video-toolkit. |
| [find-skills](find-skills/) | Discover and install agent skills for a task. |

## Install

Copy a skill folder into `~/.claude/skills/`:

```sh
cp -r SSSkills/frontend-design ~/.claude/skills/
```

Licenses are kept inside each skill folder where the original came with one.
