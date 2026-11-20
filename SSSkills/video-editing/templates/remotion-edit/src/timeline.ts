// =====================================================================
//  EDIT DECISION LIST — the whole cut lives here. Seconds everywhere.
//  segments play back-to-back; overlays / audio / captions are pinned to a
//  segment id + offset, so re-trimming one segment never breaks later items.
//  (Worked example from "Out of the Loop" — replace sources/ids with yours.)
// =====================================================================
import {ClipRef, Overlay, Seg, Timeline, AudioItem} from './engine/types';

const SRC = {
  deskWide: 'C0101', // proxy stems in public/proxies/<stem>.mp4
  bossPhone: 'C0102', // portrait (1080x1920) phone take
  herPhone: 'C0103',
} as const;
const NAMES = {
  A: {name: 'Ashutosh', role: 'Zonal Manager · North'},
  D: {name: 'Devanshi', role: 'AGM · Rajasthan'},
};

// ---------- helpers ----------
type ClipOpts = Partial<ClipRef> & {grade?: Seg['grade']; transitionIn?: Seg['transitionIn']; pillar?: number; half?: boolean; freezeLast?: number};
const clip = (id: string, src: string, from: number, to: number, o: ClipOpts = {}): Seg => {
  const {grade, transitionIn, pillar, half, freezeLast, ...c} = o;
  return {
    id,
    kind: 'clip',
    dur: +((to - from) / (c.rate ?? 1) + (freezeLast ?? 0)).toFixed(3),
    clip: {src, from, ...c},
    grade,
    transitionIn,
    freezeLast,
    ...(pillar !== undefined ? {layout: 'pillar' as const, pillarX: pillar} : {}),
    ...(half ? {layout: 'half-left' as const} : {}),
  };
};

// Split-screen phone call — "continuous takes". Each line plays from the SPEAKER's own take
// (picture + audio). The listener's take keeps rolling at whatever speed lands them exactly on
// the first frame of their next line (clamped 0.6–1.25x), so nobody's picture restarts or
// freezes between lines. Works when the two sides were shot separately (even on different days).
type Party = {src: string; start: number; focusX?: number; focusY?: number};
type CallLine = {id: string; who: 'left' | 'right'; from: number; to: number; volume?: number};
const RATE_MIN = 0.6;
const RATE_MAX = 1.25;
export const call = (
  cfg: {left: Party; right: Party; labels: {left: {name: string; role?: string}; right: {name: string; role?: string}}; grade?: Seg['grade']; transitionIn?: Seg['transitionIn']},
  lines: CallLine[],
): Seg[] => {
  const last = {left: cfg.left.start, right: cfg.right.start};
  return lines.map((l, i) => {
    const dur = +(l.to - l.from).toFixed(3);
    const other: 'left' | 'right' = l.who === 'left' ? 'right' : 'left';
    const next = lines.slice(i + 1).find((x) => x.who === other)?.from;
    let lFrom = last[other];
    let rate = 1;
    if (next !== undefined) {
      rate = (next - lFrom) / dur;
      if (rate > RATE_MAX || rate < RATE_MIN) {
        rate = Math.min(RATE_MAX, Math.max(RATE_MIN, rate));
        lFrom = Math.max(0, next - dur * rate);
      }
    } else rate = 0.85;
    last[other] = lFrom + dur * rate;
    const p = cfg[l.who];
    const q = cfg[other];
    const speakerClip: ClipRef = {src: p.src, from: l.from, focusX: p.focusX, focusY: p.focusY, volume: l.volume};
    const listenerClip: ClipRef = {src: q.src, from: +lFrom.toFixed(3), focusX: q.focusX, focusY: q.focusY, rate: +rate.toFixed(4), mute: true};
    last[l.who] = l.to;
    return {
      id: l.id, kind: 'split', dur,
      left: l.who === 'left' ? speakerClip : listenerClip,
      right: l.who === 'right' ? speakerClip : listenerClip,
      audio: l.who, active: l.who, leftLabel: cfg.labels.left, rightLabel: cfg.labels.right,
      grade: cfg.grade, transitionIn: i === 0 ? cfg.transitionIn : undefined,
    } as Seg;
  });
};
const g = (id: string, graphic: string, dur: number, props: Record<string, unknown> = {}, o: Partial<Seg> = {}): Seg =>
  ({id, kind: 'graphic', graphic, dur, props, ...o}) as Seg;
const ov = (id: string, at: string, offset: number, dur: number, graphic: string, props: Record<string, unknown> = {}): Overlay => ({id, at, offset, dur, graphic, props});

// =====================================================================
const segments: Seg[] = [
  g('title', 'TitleCard', 3.8, {title: 'Out of the Loop', subtitle: 'Course · Institute'}),
  clip('desk', SRC.deskWide, 0.75, 11.45, {grade: 'cool', transitionIn: 'fade'}),
  clip('dial', SRC.herPhone, 1.6, 6.05, {grade: 'cool', pillar: 960, mute: true}), // portrait clip, blurred fill
  ...call(
    {left: {src: SRC.bossPhone, start: 11.3, focusY: 0.3}, right: {src: SRC.herPhone, start: 6.05, focusY: 0.3}, labels: {left: NAMES.A, right: NAMES.D}, grade: 'cool'},
    [
      {id: 'c1', who: 'right', from: 6.05, to: 15.05},
      {id: 'c2', who: 'left', from: 19.85, to: 25.4},
    ],
  ),
  g('credits', 'CreditsCard', 7.0, {lines: ['Music: … CC BY 4.0'], cast: [{name: 'Devanshi', role: 'AGM'}], footer: 'Course · Institute'}, {transitionIn: 'dip'}),
];

const overlays: Overlay[] = [
  ov('nm_D', 'desk', 0.4, 4.4, 'NameCard', NAMES.D),
  ov('dialing', 'dial', 1.6, 2.85, 'CallScreen', {position: 'top-right', name: 'Ashutosh', state: 'calling'}),
];

const audio: AudioItem[] = [
  // {id: 'vo1', at: 'desk', offset: 0.8, file: 'vo/vo_01.wav', volume: 0.5},
  // {id: 'score', at: segments[0].id, offset: 0, file: 'music/score_baked.wav'},  // baked by helpers/bake_score.py
];

// Dialogue levelling (dB) per segment — set from measure_mix.py (target p90 ≈ -21 dBFS pre-master).
const GAIN_DB: Record<string, number> = {desk: 0, c1: 0, c2: 0};
const db = (x: number) => Math.pow(10, x / 20);
for (const seg of segments) {
  const gdb = GAIN_DB[seg.id];
  if (gdb === undefined) continue;
  if (seg.kind === 'clip') seg.clip.volume = (seg.clip.volume ?? 1) * db(gdb);
  if (seg.kind === 'split') {
    const side = seg.audio === 'left' ? seg.left : seg.right;
    side.volume = (side.volume ?? 1) * db(gdb);
  }
}

export const timeline: Timeline = {segments, overlays, audio};
