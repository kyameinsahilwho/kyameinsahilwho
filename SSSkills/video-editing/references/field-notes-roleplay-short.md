# Field notes — role-play short film edit ("Out of the Loop", Nov 2026)

A 6:39 live-action MBA role-play (office politics), shot on 4 phones over 4 days, re-made from an
animated reference + a script, with real names replacing script names. Edited in ~9 review rounds
with a non-editor director. What follows is what actually mattered.

## 1. Reading the material
- Contact sheets per clip (8 frames, ffmpeg `fps=8/dur,tile=4x2`) + a reference-video sheet (every 3 s)
  gave the whole shot-to-script mapping in one pass. Do this BEFORE transcripts finish.
- Crew chatter ("Haan… cut, babe") fills walk/B-roll audio — those clips are MUTE in the edit.
- Phone footage mix: landscape 4K/1440p, HLG HDR (10-bit), portrait clips stored as 1920x1080 +
  rotation -90, some at 120 fps. Normalise everything into proxies first (helpers/make_proxies.py).
- Separately shot call sides (each actor filmed alone, other voice read off-camera, often a
  different day) — both recordings usually contain BOTH voices. Use each speaker's own take for
  their lines (best mic), never one shared audio track (lips won't match on the other side).
- Script vs. real footage drifts: actors improvise ("Rajasthan won't shut down for one client"),
  change genders/names, reshoot scenes as different situations (cabin meeting -> balcony tea).
  Map by content, not by scene order.

## 2. What the director asked for, round by round (expect this arc)
1. First pass of everything + list of missing voice-overs + a placeholder slot for unshot footage.
2. "Split screens feel like glitches" -> listener must not restart/jump; then "freeze looks
   unnatural" -> rate-matched continuous listener playback (engine `call()`).
3. Audio clarity, especially the worst scene (distant balcony) — took 4 iterations (see §3).
4. "Make it cinematic": typography + no gradients, slow-mo exits, letterbox.
5. SFX "but don't overdo"; real typing (synthetic typing = "cringe"); send = click + sweet chime,
   not whoosh; hand cursor clicking Send.
6. PLOT clarity: the director cared most about the story reading straight — rewrote the cold
   open so cause -> effect is visible on screen (mail goes to the zonal manager at 2:07 AM;
   5:34 AM the boss sees "pending with zonal desk"; unread inbox while he watches songs).
7. Final files (VO + meeting) -> integrate, clean, subtitle.
8. Tighten: remove pauses (meeting at 1.1x), cut the academic/insight graphics entirely
   ("we just have to show the office-politics scenario"), retitle, fix a speaker the denoiser ate.
9. White noise complaint -> it was MY room-tone bed. Replaced by a ducked low-key score.

## 3. Dialogue audio — decision tree that worked
| Situation | Do | Don't |
|---|---|---|
| Close phone mic, SNR > 15 dB | DeepFilterNet3, atten cap ~28 dB, light EQ/comp | — |
| Soft speaker / soft first words | afftdn (non-gating) + presence EQ + 3:1 comp, +6 dB makeup | DeepFilterNet (ate the first words by 17 dB) |
| Distant mic in wind, SNR ~7 dB | Demucs htdemucs_ft vocals + voice-KEYED blend of a light DF layer + warm EQ | full DF (deleted speech), double DF (echoey), gate (chopped), VoiceFixer (garbled), presence boost (sharp) |
| In-scene music (song on a monitor) or whispered muttering | raw camera audio | any denoiser |
Validate every candidate with: Whisper transcript vs raw, SNR, dropout %, harshness. Give the
director an A/B WAV with spoken labels ("Version one… Version three") made with Windows SAPI TTS.

## 4. Levels & mix
- Per-segment gain from measured p90 (100 ms RMS) to ~-21 dBFS pre-master; re-measure after every
  audio-source change (cleaned tracks change levels by ±10 dB).
- Split lines: gain applies to the speaking side only.
- Master: 2-pass loudnorm -16 LUFS / -1.5 dBTP, `-c:v copy` (audio-only re-master is cheap).
- Audio-only iteration: `remotion render ... --codec=wav` (~2-3 min) + mux into the existing picture.
- SFX levels: impacts were 6-7 dB too hot on first pass (freeze hit, rewind); keep SFX RMS ≤ dialogue.
- Digital silence between cleaned lines reads as dead air — fill with the music bed (preferred) or a
  room tone well below -50 dBFS post-master. A -40 dBFS bed was heard as "white noise throughout".

## 5. Picture tricks that landed
- Slow-mo from 30 fps phone footage: `minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=2*PTS,fps=30`
  (0.5x). Even 0.385x (`fps=78`, `setpts=2.6*PTS`) held up on a walking shot. Build as separate proxies.
- Rewind: reversed 4x clip (`reverse,setpts=PTS/4`) + VHS overlay + tape-rewind SFX.
- Reframe/punch-in from the 4K original into a crop proxy (sharp), not a zoom on the 1080 proxy.
- Portrait phone call in a 16:9 film: `pillar` (blurred fill) for single shots; for a one-sided call,
  `half-left` person + a phone UI (DialerScreen) whose waveform is driven by the other person's voice
  envelope (per-frame JSON computed from their cleaned track, masked to their lines).
- Letterbox 2.39:1 bars easing in for "cinematic" moments; fade to black into credits.

## 6. Graphics language the director approved
- Bebas Neue display (names, titles, scene cards), Inter UI, NO gradients / panels on footage, shadow only.
- Character intro = big Bebas name rising letter-by-letter from a mask + thin accent rule + small tracked role line.
- Story screens (email compose with typing + empty-CC red ring + cursor click, inbox with unread/no reply,
  phone lock-screen notification with status pill, approvals report with stamps) were KEPT;
  academic overlays (concept tags, matrices, TAT bars, lesson cards) were REMOVED at the end.
  Ask early whether "insight" graphics belong in the film at all.
- Amber kicker text on bright sky was unreadable — kickers white or dropped.

## 7. Sourcing (no paid APIs available)
- Transcription: local faster-whisper large-v3-turbo (CPU int8, ~10 min audio in a few minutes).
- Typing SFX: real recording "Sounds of Typing" (Michael Mol, CC BY 3.0, archive.org/details/SoundsOfTyping);
  pick the steadiest window (max inter-keystroke gap) and cut to the on-screen typing schedule.
- Music: incompetech.com direct MP3s (Kevin MacLeod, CC BY 4.0): `https://incompetech.com/music/royalty-free/mp3-royaltyfree/<Title>.mp3`.
  "Lightless Dawn" (low-key bed, natural build) + "Heartbreaking" (emotional ending) worked.
  Profile candidates (loudness/centroid/onset density per 15 s) since you can't listen.
- Wikimedia Commons upload host returned HTTP 429 to scripted downloads; freepd.com is JS-rendered.
- Synth is fine for: door knocks (wood body modes + click + small room), mouse click, a soft two-note
  "sent" chime, ringback tones. Synth is NOT fine for typing.
- Credit every CC BY asset in the end credits.

## 8. Windows environment gotchas
- Python stdout is cp1252: set `PYTHONIOENCODING=utf-8` / `PYTHONUTF8=1` for any script printing ₹, →, ’.
- ffmpeg drawtext needs `fontfile='C\:/Windows/Fonts/arial.ttf'` (escaped colon) — fontconfig is absent and
  drawtext without fontfile SEGFAULTS. Prefer PIL for contact sheets/labels.
- Long multi-replacement Python in a bash heredoc broke on quoting — write the script to a file and run it.
- Remotion public assets via junctions (`mklink /J`), not copies.
- `--scale=0.6667` produces non-integer dimensions and fails; use `0.6666666666666666`.
