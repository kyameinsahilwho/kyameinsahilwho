// Timeline model. Everything in SECONDS. The base track is a list of segments
// played back-to-back; overlays/audio are anchored to a segment id + offset,
// so re-trimming an earlier segment never breaks later graphics.

export type GradeName = 'none' | 'cool' | 'night' | 'warm';

export type ClipRef = {
  src: string; // proxy file stem, e.g. "20261115_203535"
  from: number; // in-point in the source (seconds)
  volume?: number; // default 1
  mute?: boolean;
  zoom?: number; // 1 = cover-fit, >1 punch-in
  focusX?: number; // 0..1 horizontal crop anchor (cover fit), default .5
  focusY?: number; // 0..1 vertical crop anchor, default .5
  rate?: number; // playback rate (default 1)
  driftZoom?: number; // slow push-in over the segment (e.g. 0.04 = +4%)
  audioSrc?: string; // take the (enhanced) dialogue from another stem, e.g. a reframed proxy of the same take
  rawAudio?: boolean; // use the camera's original audio instead of the enhanced dialogue track
  freeze?: boolean; // hold the frame at `from` (muted) — used for the listener in split-screen calls
};

export type GraphicCall = {graphic: string; props?: Record<string, unknown>};

export type Transition = 'cut' | 'flash' | 'fade' | 'rewind' | 'dip';

type SegBase = {
  id: string;
  dur: number;
  grade?: GradeName;
  transitionIn?: Transition;
  note?: string; // editorial note (shown nowhere, for us)
  freezeLast?: number; // hold last frame for N seconds (included in dur)
};

export type Seg = SegBase &
  (
    | {kind: 'clip'; clip: ClipRef; layout?: 'cover' | 'pillar' | 'half-left'; pillarX?: number}
    | {
        kind: 'split';
        left: ClipRef;
        right: ClipRef;
        leftLabel?: {name: string; role?: string};
        rightLabel?: {name: string; role?: string};
        audio?: 'left' | 'right' | 'both';
        active?: 'left' | 'right'; // who is talking (subtle highlight)
        leftEnded?: boolean; // show "call ended" on left
        rightEnded?: boolean;
      }
    | ({kind: 'graphic'} & GraphicCall)
    | {kind: 'placeholder'; title: string; lines: string[]; file?: string}
    | {kind: 'video'; file: string; from?: number; volume?: number} // any file in public/ (e.g. meeting/meeting.mp4)
  );

export type Overlay = GraphicCall & {
  id: string;
  at: string; // segment id
  offset: number; // seconds from the start of that segment (may exceed its dur)
  dur: number;
};

export type AudioItem = {
  id: string;
  file: string; // path inside public/, e.g. "vo/vo_01.wav"
  at: string;
  offset: number;
  volume?: number;
  placeholderText?: string; // shown on a "VO MISSING" debug chip when file absent
  dur?: number; // optional: cut the sound after N seconds (1-frame fade)
  volumeKeys?: [number, number][]; // automation: [seconds from item start, linear gain], interpolated (multiplies `volume`)
  loop?: boolean;
};

export type Timeline = {
  segments: Seg[];
  overlays: Overlay[];
  audio: AudioItem[];
};
