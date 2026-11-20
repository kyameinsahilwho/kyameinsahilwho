// SUBTITLES — hand-corrected from Whisper drafts. Pinned to segment id + offset (like overlays).
// italic = voice-over or an off-screen voice (Netflix convention). Rendered LAST (above every overlay),
// auto-raised to the top while a NameCard / big bottom ConceptTag / MotiveMatrix is on screen.
export type Cue = {at: string; offset: number; dur: number; text: string; italic?: boolean};

export const CAPTIONS: Cue[] = [
  {at: 'desk', offset: 0.31, dur: 2.6, text: 'Ma’am, the transporter has been calling since morning.'},
  {at: 'c1', offset: 0.15, dur: 3.6, text: 'Hello, sir. Devanshi here.'},
];
