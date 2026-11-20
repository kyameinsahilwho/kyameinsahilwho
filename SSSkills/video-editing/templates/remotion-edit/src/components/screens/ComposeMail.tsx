import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FPS, SHADOW, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';

/* ------------------------------------------------------------------ */
/* Shared screen helpers (used by every component in ./screens).       */
/* Not re-exported from ./index so they never show up as "graphics".   */
/* Look: neutral, unbranded mail UI. White surfaces, hairline dividers, */
/* light window chrome, Inter only, depth from shadow alone.           */
/* ------------------------------------------------------------------ */

export type ScreenVariant = 'overlay' | 'full';
export type ScreenPosition = 'center' | 'left' | 'right';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Progress 0..1 of a window that starts at `start` (s) and lasts `len` (s). */
export const prog = (t: number, start: number, len: number) => clamp01((t - start) / len);
/** Soft overshoot, for pop-ins. */
export const easeOutBack = (x: number, s = 1.5) => {
  const t = clamp01(x) - 1;
  return 1 + (s + 1) * t * t * t + s * t * t;
};
export const easeInCubic = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOutSine = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));

/* ---- design tokens shared by the screens ---- */
export const UI = {
  radius: 16,
  header: '#F6F6F4', // light window chrome
  headerH: 60,
  hairline: `1px solid ${C.line}`,
  body: '#2A2A2E', // long-form body copy
  chip: '#1B1B1E', // dark toasts / call chip
  uiBlueDeep: '#2459C9', // pressed uiBlue
  tintBlue: 'rgba(47,111,235,0.10)',
  /** Small UI label (sentence case, Inter 500). */
  label: {fontSize: 19, fontWeight: 500, color: C.textDim, letterSpacing: '0.005em'} as React.CSSProperties,
  /** Column header (small caps feel). */
  colLabel: {fontSize: 14, fontWeight: 600, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase'} as React.CSSProperties,
};

/** Entrance (0.55s easeOutExpo: rise 24px + fade + scale .97->1) / exit (last 0.35s). */
export const enterExit = (t: number, dur: number, enterAt = 0) => {
  const inP = easeOutExpo(prog(t, enterAt, 0.55));
  const fade = easeOutCubic(prog(t, enterAt, 0.4));
  const outP = easeInOutCubic(prog(t, dur - 0.35, 0.35));
  return {
    inP,
    outP,
    opacity: fade * (1 - outP),
    scale: (0.97 + 0.03 * inP) * (1 - 0.02 * outP),
    y: 24 * (1 - inP) + 12 * outP,
  };
};

/** Slow cinematic push-in for the full-screen variant: 1.0 -> 1.025 over the whole shot. */
export const pushIn = (t: number, dur: number) => 1 + 0.025 * easeInOutSine(t / Math.max(0.001, dur));

export const CARD_SHADOW = SHADOW.card;
/** Lighter shadow for elements that sit ON a card (toasts, notifications). */
export const SOFT_SHADOW = '0 14px 34px rgba(0,0,0,0.28), 0 3px 10px rgba(0,0,0,0.18)';

/** Full-screen backdrop: solid near-black. No gradient, no texture. */
export const FullBackground: React.FC = () => <AbsoluteFill style={{background: C.ink}} />;

/** Solid scrim for overlays, clamped to <=30%. */
export const scrimColor = (op: number) => `rgba(0,0,0,${Math.min(0.3, Math.max(0, op)).toFixed(3)})`;

const SIDE_PAD = 110;

/**
 * Places a card (designed at `baseWidth`) either over footage (overlay: light solid scrim + floating card)
 * or full-frame (solid black + large centred card with a slow push-in), with the standard entrance/exit.
 */
export const ScreenStage: React.FC<{
  dur: number;
  variant: ScreenVariant;
  position?: ScreenPosition;
  baseWidth: number;
  overlayWidth: number;
  fullWidth: number;
  scrim?: number;
  children: React.ReactNode;
  /** Frame-level layers (toasts, popups). Receives the card scale factor and the card's centre x (px). */
  extras?: (k: number, cx: number) => React.ReactNode;
}> = ({dur, variant, position = 'center', baseWidth, overlayWidth, fullWidth, scrim = 0.18, children, extras}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const full = variant === 'full';
  const a = enterExit(t, dur);
  const k = (full ? fullWidth : overlayWidth) / baseWidth;
  const pos = full ? 'center' : position;
  const scrimOp = scrim * easeOutCubic(prog(t, 0, 0.4)) * (1 - a.outP);
  const push = full ? pushIn(t, dur) : 1;
  const wPx = baseWidth * k;
  const cx = pos === 'center' ? 960 : pos === 'left' ? SIDE_PAD + wPx / 2 : 1920 - SIDE_PAD - wPx / 2;

  return (
    <AbsoluteFill style={{fontFamily: FONT_SANS}}>
      {full ? <FullBackground /> : scrim > 0 ? <AbsoluteFill style={{background: scrimColor(scrimOp)}} /> : null}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: pos === 'center' ? 'center' : pos === 'left' ? 'flex-start' : 'flex-end',
          padding: pos === 'center' ? 0 : `0 ${SIDE_PAD}px`,
        }}
      >
        <div
          style={{
            width: baseWidth,
            flexShrink: 0,
            transformOrigin: pos === 'center' ? '50% 50%' : pos === 'left' ? '0% 50%' : '100% 50%',
            transform: `translateY(${a.y}px) scale(${k * a.scale * push})`,
            opacity: a.opacity,
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
      {extras ? <AbsoluteFill style={{opacity: 1 - a.outP}}>{extras(k * push, cx)}</AbsoluteFill> : null}
    </AbsoluteFill>
  );
};

/** Light window title bar shared by all desktop screens. */
export const WindowHeader: React.FC<{
  title: React.ReactNode;
  right?: React.ReactNode;
  padX?: number;
  children?: React.ReactNode;
}> = ({title, right, padX = 40, children}) => (
  <div
    style={{
      position: 'relative',
      height: UI.headerH,
      background: UI.header,
      borderBottom: UI.hairline,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `0 ${padX - 8}px 0 ${padX}px`,
      boxSizing: 'border-box',
    }}
  >
    <div style={{fontSize: 21, fontWeight: 600, color: C.text, letterSpacing: '-0.005em', whiteSpace: 'nowrap'}}>{title}</div>
    {right ?? <WindowIcons />}
    {children}
  </div>
);

export const WindowIcons: React.FC<{color?: string}> = ({color = C.textDim}) => (
  <svg width={96} height={18} viewBox="0 0 96 18" style={{display: 'block', flexShrink: 0}}>
    <path d="M6 9h12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <rect x={41} y={3} width={12} height={12} rx={2.5} fill="none" stroke={color} strokeWidth={1.8} />
    <path d="M78 3.5l11 11M89 3.5l-11 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

/** Circular initials avatar (neutral, solid). */
export const Avatar: React.FC<{text: string; size?: number; bg?: string; color?: string}> = ({
  text,
  size = 48,
  bg = '#ECECEA',
  color = C.text,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: bg,
      color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.36,
      fontWeight: 600,
      letterSpacing: '0.02em',
      flexShrink: 0,
      fontFamily: FONT_SANS,
    }}
  >
    {text}
  </div>
);

export const initialsOf = (who: string) => {
  const clean = who
    .replace(/^(to|from|cc)\s*:\s*/i, '')
    .replace(/\b(mr|mrs|ms|dr|shri|smt)\.?\s+/gi, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

export const CheckIcon: React.FC<{size?: number; color?: string; stroke?: number}> = ({
  size = 22,
  color = '#fff',
  stroke = 3,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}>
    <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Slightly irregular, overshooting loop — reads as a pen circling something. */
const ringPath = (w: number, h: number) => {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 8;
  const ry = h / 2 - 8;
  const N = 90;
  const a0 = -Math.PI * 0.68;
  const total = Math.PI * 2 + 0.5;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = a0 + total * u;
    const wob = 1 + 0.03 * Math.sin(3 * a + 1.2) + 0.018 * Math.sin(5 * a + 0.4);
    const grow = 1 + 0.07 * u; // second pass drifts outward a touch
    const x = cx + rx * wob * grow * Math.cos(a) * 0.97;
    const y = cy + ry * wob * grow * Math.sin(a) * 0.9 - 3 * u;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
};

export const HandRing: React.FC<{
  w: number;
  h: number;
  color: string;
  /** draw progress 0..1 */
  p: number;
  /** extra scale for pulse */
  pulse?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
}> = ({w, h, color, p, pulse = 1, strokeWidth = 4, style}) => (
  <svg
    width={w}
    height={h}
    viewBox={`0 0 ${w} ${h}`}
    style={{
      position: 'absolute',
      overflow: 'visible',
      transform: `rotate(-2.5deg) scale(${pulse})`,
      pointerEvents: 'none',
      ...style,
    }}
  >
    <path
      d={ringPath(w, h)}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - p}
      opacity={p > 0 ? 1 : 0}
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/* ComposeMail                                                         */
/* ------------------------------------------------------------------ */

export type ComposeMailProps = {
  dur: number;
  variant?: ScreenVariant;
  position?: ScreenPosition;
  title?: string;
  to: string;
  cc?: string;
  subject: string;
  body?: string;
  attachments?: string[];
  typeFields?: boolean;
  typeBodyFrom?: number;
  typeCps?: number;
  ccEmptyRing?: {at: number};
  ccHighlight?: {at: number};
  sendAt?: number;
  reply?: {at: number; from: string; subject?: string; text: string};
  /** Overlay scrim opacity (solid black, clamped to <=0.3). Default 0.18. */
  scrim?: number;
};

/* ---- typing schedule (single source of truth for the component AND for SFX generation) ---- */

type Win = {start: number; end: number};
export type TypingWindow = {field: 'to' | 'cc' | 'subject' | 'body'; start: number; end: number; chars: number};
export type TypingScheduleInput = Pick<ComposeMailProps, 'to' | 'cc' | 'subject' | 'body' | 'typeFields' | 'typeBodyFrom' | 'typeCps'>;
export type TypingSchedule = {
  /** Start of header-field typing (s, relative to component start); null when typeFields is off. */
  fieldsStart: number | null;
  /** End of header-field typing (last char of the subject); null when typeFields is off. */
  fieldsEnd: number | null;
  /** Start of body typing; null when there is no body. */
  bodyStart: number | null;
  /** End of body typing (last char appears); null when there is no body. */
  bodyEnd: number | null;
  /** Total characters typed (fields + body). */
  chars: number;
  /** Characters per second used. */
  cps: number;
  /** Every typing window in order (fields have a 0.25s pause between them). */
  windows: TypingWindow[];
};

const FIELD_START = 0.45;
const FIELD_GAP = 0.25;

const computeWindows = (p: TypingScheduleInput) => {
  const cps = Math.max(1, p.typeCps ?? 38);
  const typeFields = p.typeFields ?? false;
  const typeBodyFrom = p.typeBodyFrom ?? 0.8;
  const cc = p.cc ?? '';
  let clock = FIELD_START;
  const sched = (s: string): Win => {
    const w = {start: clock, end: clock + s.length / cps};
    clock = w.end + FIELD_GAP;
    return w;
  };
  const toW = typeFields ? sched(p.to) : null;
  const ccW = typeFields && cc ? sched(cc) : null;
  const subW = typeFields ? sched(p.subject) : null;
  const bodyW: Win | null = p.body
    ? (() => {
        const start = typeFields ? Math.max(typeBodyFrom, clock) : typeBodyFrom;
        return {start, end: start + p.body.length / cps};
      })()
    : null;
  return {cps, toW, ccW, subW, bodyW};
};

/** Pure helper: when typing happens in a ComposeMail with these props (seconds, relative to component start). */
export const typingSchedule = (props: TypingScheduleInput): TypingSchedule => {
  const {cps, toW, ccW, subW, bodyW} = computeWindows(props);
  const windows: TypingWindow[] = [];
  if (toW) windows.push({field: 'to', ...toW, chars: props.to.length});
  if (ccW) windows.push({field: 'cc', ...ccW, chars: (props.cc ?? '').length});
  if (subW) windows.push({field: 'subject', ...subW, chars: props.subject.length});
  if (bodyW) windows.push({field: 'body', ...bodyW, chars: (props.body ?? '').length});
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return {
    fieldsStart: toW ? r(toW.start) : null,
    fieldsEnd: subW ? r(subW.end) : null,
    bodyStart: bodyW ? r(bodyW.start) : null,
    bodyEnd: bodyW ? r(bodyW.end) : null,
    chars: windows.reduce((n, w) => n + w.chars, 0),
    cps,
    windows: windows.map((w) => ({...w, start: r(w.start), end: r(w.end)})),
  };
};

const BASE_W = 1100;
const PAD_X = 44;
const LABEL_W = 132;
const ROW_H = 72;
const BODY_H = 330;
const VALUE_FS = 26;
const FOOTER_H = 92;
const BODY_LH = 1.55;
const FULL_W = 1280;

/** Estimated rendered text height (px) of `text` at font size `fs` in a box `w` wide. */
const bodyTextHeight = (text: string, w: number, fs: number) => {
  const cpl = Math.max(10, Math.floor(w / (fs * 0.53)));
  const lines = text.split('\n').reduce((n, para) => n + Math.max(1, Math.ceil((para.length * 1.05) / cpl)), 0);
  return lines * fs * BODY_LH;
};

/**
 * Picks the body font size + body box height: prefers 30→26px in the default box,
 * then lets the box grow up to `maxH`, then shrinks the font until everything fits.
 */
const fitBody = (text: string, w: number, minH: number, maxH: number) => {
  const PAD = 28 + 24; // top padding + bottom breathing room
  for (let fs = 30; fs >= 14; fs--) {
    const need = bodyTextHeight(text, w, fs) + PAD;
    if (need <= minH) return {fs, h: minH};
    if (fs <= 26 && need <= maxH) return {fs, h: Math.ceil(need)};
  }
  return {fs: 14, h: maxH};
};

const fakeSize = (s: string) => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `${180 + (h % 640)} KB`;
};

const Cursor: React.FC<{on: boolean; h: number}> = ({on, h}) => (
  <span
    style={{
      display: 'inline-block',
      width: 2.5,
      height: h,
      marginLeft: 2,
      background: C.uiBlue,
      borderRadius: 1,
      verticalAlign: '-0.2em',
      opacity: on ? 1 : 0,
    }}
  />
);

const DocIcon: React.FC = () => (
  <svg width={28} height={34} viewBox="0 0 28 34" style={{display: 'block', flexShrink: 0}}>
    <path d="M3 1.5h14.5l8 8V32.5H3z" fill="#fff" stroke="#B9B9B6" strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M17.5 1.5v8h8" fill="none" stroke="#B9B9B6" strokeWidth={1.4} strokeLinejoin="round" />
    <rect x={0} y={18} width={20} height={10} rx={2.5} fill={C.alert} />
    <text x={10} y={25.6} fontSize={7.2} fontWeight={700} fill="#fff" textAnchor="middle" fontFamily={FONT_SANS} letterSpacing="0.04em">
      PDF
    </text>
  </svg>
);

const FooterIcons: React.FC = () => (
  <svg width={140} height={28} viewBox="0 0 140 28" style={{display: 'block'}}>
    {/* paperclip */}
    <path d="M18 8l-8.5 8.5a3.5 3.5 0 0 0 5 5L24 12a6 6 0 0 0-8.5-8.5L6 13" fill="none" stroke={C.textDim} strokeWidth={1.9} strokeLinecap="round" />
    {/* text format "A" */}
    <path d="M58 23l7-17 7 17M60.6 17h8.8" fill="none" stroke={C.textDim} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    {/* trash */}
    <path d="M114 7h20M119 7V4h10v3M117 7l1.5 18h11L131 7" fill="none" stroke={C.textDim} strokeWidth={1.9} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

// Pointing-hand cursor: glides from the email body onto Send, presses at `sendAt`.
const HandCursor: React.FC<{t: number; sendAt: number}> = ({t, sendAt}) => {
  const appear = clamp01((t - (sendAt - 1.25)) / 0.2);
  if (appear <= 0) return null;
  const m = easeInOutSine(prog(t, sendAt - 1.15, 1.0)); // travel
  const x = 330 * (1 - m) + 36 * m; // px relative to the button's left edge
  const y = -150 * (1 - m) + 22 * m;
  const click = Math.sin(Math.PI * prog(t, sendAt - 0.02, 0.2));
  const ring = prog(t, sendAt, 0.45);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: appear, zIndex: 5, pointerEvents: 'none'}}>
      {ring > 0 && ring < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: 10 - 26 * ring,
            top: 2 - 26 * ring,
            width: 52 * ring,
            height: 52 * ring,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.9)',
            opacity: 1 - ring,
          }}
        />
      ) : null}
      <svg
        width={38}
        height={46}
        viewBox="0 0 38 46"
        style={{position: 'absolute', left: -3, top: -2, transform: `scale(${1 - 0.14 * click})`, transformOrigin: '12px 4px', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.45))'}}
      >
        <path
          d="M12 3.5c-1.9 0-3.2 1.4-3.2 3.3v17.4l-2.6-2.5c-1.4-1.3-3.5-1.3-4.7.1-1.1 1.3-1 3.2.2 4.4l8.6 9.7c1.9 2.1 4.5 3.3 7.3 3.3h6.4c5 0 8.9-3.9 8.9-8.9v-9.6c0-1.8-1.4-3.2-3.1-3.2-.7 0-1.3.2-1.8.6-.3-1.5-1.6-2.6-3.1-2.6-.8 0-1.5.3-2 .7-.4-1.4-1.6-2.4-3.1-2.4-.6 0-1.2.2-1.7.5V6.8c0-1.9-1.4-3.3-3.3-3.3z"
          fill="#FFFFFF"
          stroke="#111113"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path d="M18.4 21.5v7M23.3 22.6v6M28 24.4v5" stroke="#111113" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    </div>
  );
};

const SendGlyph: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M3.5 11.6L20.5 4l-6.8 16.5-2.6-6.4z" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    <path d="M11.1 14.1L20.5 4" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

export const ComposeMail: React.FC<ComposeMailProps> = ({
  dur,
  variant = 'overlay',
  position = 'center',
  title = 'New message',
  to,
  cc = '',
  subject,
  body,
  attachments = [],
  typeFields = false,
  typeBodyFrom = 0.8,
  typeCps = 38,
  ccEmptyRing,
  ccHighlight,
  sendAt,
  reply,
  scrim,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  /* ---- typing schedule ---- */
  const {cps, toW, ccW, subW, bodyW} = computeWindows({to, cc, subject, body, typeFields, typeBodyFrom, typeCps});

  const typed = (s: string, w: Win | null) =>
    w ? s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - w.start) * cps)))) : s;

  const sent = sendAt !== undefined && t >= sendAt;
  // Which field owns the caret right now.
  const wins: [string, Win | null][] = [
    ['to', toW],
    ['cc', ccW],
    ['subject', subW],
    ['body', bodyW],
  ];
  let caretField: string | null = null;
  let caretTyping = false;
  for (const [name, w] of wins) {
    if (!w) continue;
    if (caretField === null || t >= w.start) {
      caretField = name;
      caretTyping = t >= w.start && t < w.end;
    }
  }
  if (sent) caretField = null;
  const blinkOn = caretTyping || Math.floor(t * 1.9) % 2 === 0;
  const caret = (name: string, h: number) => (caretField === name ? <Cursor on={blinkOn} h={h} /> : null);

  /* ---- send / whoosh / toast ---- */
  const press = sendAt !== undefined ? Math.sin(Math.PI * prog(t, sendAt, 0.24)) : 0;
  const whoosh = sendAt !== undefined ? easeInCubic(prog(t, sendAt + 0.15, 0.45)) : 0;
  const toastP = sendAt !== undefined ? easeOutExpo(prog(t, sendAt + 0.42, 0.5)) : 0;
  const toastFade = sendAt !== undefined ? easeOutCubic(prog(t, sendAt + 0.42, 0.3)) : 0;

  /* ---- reply ---- */
  const replyP = reply ? prog(t, reply.at, 0.5) : 0;
  const replyDim = reply ? easeOutCubic(prog(t, reply.at, 0.4)) : 0;

  /* ---- rings ---- */
  const emptyRingP = ccEmptyRing ? easeInOutCubic(prog(t, ccEmptyRing.at, 0.5)) : 0;
  const emptyPulse = ccEmptyRing ? 1 + 0.09 * Math.sin(Math.PI * easeInOutCubic(prog(t, ccEmptyRing.at + 0.5, 0.45))) : 1;
  const hlRingP = ccHighlight ? easeInOutCubic(prog(t, ccHighlight.at, 0.5)) : 0;
  const hlPulse = ccHighlight ? 1 + 0.07 * Math.sin(Math.PI * easeInOutCubic(prog(t, ccHighlight.at + 0.5, 0.45))) : 1;

  /* ---- layout / fit ---- */
  const full = variant === 'full';
  const overlayW = position === 'center' ? 1000 : 880;
  const k = (full ? FULL_W : overlayW) / BASE_W;
  // Card chrome without body: header + 3 field rows + footer (+ attachments row).
  const chrome = UI.headerH + ROW_H * 3 + FOOTER_H + (attachments.length ? 84 : 0);
  // Scaled card must stay inside the 1080 frame (full also carries the 1.025 push-in).
  const maxCardH = full ? 980 / (k * 1.025) : 960 / k;
  const {fs: bodyFs, h: bodyH} = body
    ? fitBody(body, BASE_W - PAD_X * 2, BODY_H, Math.max(BODY_H, maxCardH - chrome))
    : {fs: 26, h: 0};

  const ccTyped = typed(cc, ccW);
  const ringH = 60;
  const hlW = Math.max(150, cc.length * VALUE_FS * 0.56 + 60);

  const fieldRow = (
    label: string,
    value: React.ReactNode,
    opts: {weight?: number; tint?: string; children?: React.ReactNode} = {},
  ) => (
    <div
      style={{
        position: 'relative',
        height: ROW_H,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${PAD_X}px`,
        borderBottom: UI.hairline,
        background: opts.tint,
        boxSizing: 'border-box',
      }}
    >
      <div style={{width: LABEL_W, flexShrink: 0, ...UI.label}}>{label}</div>
      <div
        style={{
          fontSize: VALUE_FS,
          fontWeight: opts.weight ?? 400,
          color: C.text,
          letterSpacing: '-0.005em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
          flex: 1,
        }}
      >
        {value}
      </div>
      {opts.children}
    </div>
  );

  const btnBg = interpolateColors(press, [0, 1], [C.uiBlue, UI.uiBlueDeep]);

  const card = (
    <div
      style={{
        transform: `translateY(${-560 * whoosh}px) scale(${(1 - 0.1 * whoosh) * (1 - 0.03 * replyDim)})`,
        // Reply pushes the card back: stays opaque (no ghosting over footage), just darker + soft.
        opacity: 1 - whoosh,
        filter: replyDim > 0 ? `blur(${3 * replyDim}px) brightness(${1 - 0.4 * replyDim})` : undefined,
      }}
    >
      <div
        style={{
          background: C.paper,
          borderRadius: UI.radius,
          overflow: 'hidden',
          boxShadow: CARD_SHADOW,
          fontFamily: FONT_SANS,
        }}
      >
        <WindowHeader title={title} padX={PAD_X} />

        {fieldRow('To', <>{typed(to, toW)}{caret('to', 28)}</>)}
        {fieldRow('Cc', <>{ccTyped}{caret('cc', 28)}</>, {
          tint: ccEmptyRing ? `rgba(224,72,62,${0.05 * emptyRingP})` : undefined,
          children: (
            <>
              {ccEmptyRing ? (
                <HandRing
                  w={300}
                  h={ringH}
                  color={C.alert}
                  p={emptyRingP}
                  pulse={emptyPulse}
                  strokeWidth={4.5}
                  style={{left: PAD_X + LABEL_W - 26, top: (ROW_H - ringH) / 2}}
                />
              ) : null}
              {ccHighlight ? (
                <HandRing
                  w={hlW}
                  h={ringH}
                  color={C.accent}
                  p={hlRingP}
                  pulse={hlPulse}
                  strokeWidth={4.5}
                  style={{left: PAD_X + LABEL_W - 28, top: (ROW_H - ringH) / 2}}
                />
              ) : null}
            </>
          ),
        })}
        {fieldRow('Subject', <>{typed(subject, subW)}{caret('subject', 28)}</>, {weight: 600})}

        {/* body */}
        {body !== undefined ? (
          <div
            style={{
              height: bodyH,
              boxSizing: 'border-box',
              padding: `28px ${PAD_X}px 0`,
              fontSize: bodyFs,
              lineHeight: BODY_LH,
              color: UI.body,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              overflow: 'hidden',
            }}
          >
            {typed(body, bodyW)}
            {caret('body', bodyFs * 1.2)}
          </div>
        ) : null}

        {/* attachments */}
        {attachments.length ? (
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, padding: `${body !== undefined ? 4 : 22}px ${PAD_X}px 22px`}}>
            {attachments.map((f, i) => {
              const ap = easeOutExpo(prog(t, 0.35 + i * 0.1, 0.5));
              return (
                <div
                  key={f + i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 20px 9px 12px',
                    border: UI.hairline,
                    background: C.paper,
                    borderRadius: 12,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    opacity: ap,
                    transform: `translateY(${8 * (1 - ap)}px)`,
                  }}
                >
                  <DocIcon />
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <span style={{fontSize: 18, fontWeight: 600, color: C.text, whiteSpace: 'nowrap'}}>{f}</span>
                    <span style={{fontSize: 14, color: C.textDim, marginTop: 1}}>{fakeSize(f)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : body === undefined ? (
          <div style={{height: 30}} />
        ) : null}

        {/* footer */}
        <div
          style={{
            height: FOOTER_H,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: `0 ${PAD_X}px`,
            borderTop: UI.hairline,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: btnBg,
              color: C.white,
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: '0.005em',
              padding: '13px 30px 13px 26px',
              borderRadius: 10,
              transform: `scale(${1 - 0.06 * press}) translateY(${1.5 * press}px)`,
              boxShadow: `0 ${4 - 3 * press}px ${12 - 8 * press}px rgba(47,111,235,${0.32 - 0.2 * press})`,
              position: 'relative',
            }}
          >
            <SendGlyph />
            Send
            {sendAt !== undefined ? <HandCursor t={t} sendAt={sendAt} /> : null}
          </div>
          {attachments.length ? (
            <div style={{fontSize: 18, color: C.textDim}}>
              {attachments.length} {attachments.length === 1 ? 'file' : 'files'} attached
            </div>
          ) : null}
          <div style={{flex: 1}} />
          <FooterIcons />
        </div>
      </div>
    </div>
  );

  const replyFs = reply ? (reply.text.length <= 12 ? 104 : reply.text.length <= 24 ? 80 : reply.text.length <= 70 ? 50 : 36) : 0;

  const extras = (kk: number, cx: number) => (
    <>
      {sendAt !== undefined && toastP > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: cx - 400,
            width: 800,
            bottom: 120,
            display: 'flex',
            justifyContent: 'center',
            opacity: toastFade,
            transform: `translateY(${30 * (1 - toastP)}px) scale(${0.96 + 0.04 * toastP})`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: UI.chip,
              color: C.white,
              borderRadius: 999,
              padding: '16px 34px 16px 18px',
              boxShadow: SOFT_SHADOW,
              fontFamily: FONT_SANS,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-0.005em',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: C.uiBlue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckIcon size={22} stroke={3} />
            </div>
            Message sent
          </div>
        </div>
      ) : null}
      {reply && replyP > 0 ? (
        <div style={{position: 'absolute', left: cx - 380, width: 760, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
          <div
            style={{
              width: 760,
              transformOrigin: '50% 50%',
              transform: `translateY(${40 + 24 * (1 - easeOutExpo(replyP))}px) scale(${kk * (0.94 + 0.06 * easeOutBack(replyP, 1.2))})`,
              opacity: easeOutCubic(prog(t, reply.at, 0.3)),
              background: C.paper,
              borderRadius: UI.radius + 2,
              boxShadow: CARD_SHADOW,
              overflow: 'hidden',
              fontFamily: FONT_SANS,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '26px 36px 22px', borderBottom: UI.hairline}}>
              <Avatar text={initialsOf(reply.from)} size={54} bg={UI.chip} color={C.white} />
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16}}>
                  <span style={{fontSize: 23, fontWeight: 700, color: C.text, whiteSpace: 'nowrap'}}>{reply.from}</span>
                  <span style={{fontSize: 16, color: C.textDim, whiteSpace: 'nowrap'}}>just now</span>
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 18,
                    color: C.textDim,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {reply.subject ?? `Re: ${subject}`}
                </div>
              </div>
            </div>
            <div style={{padding: '30px 36px 40px'}}>
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontWeight: 800,
                  fontSize: replyFs,
                  lineHeight: 1.08,
                  letterSpacing: '-0.035em',
                  color: C.text,
                }}
              >
                {reply.text}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <ScreenStage
      dur={dur}
      variant={variant}
      position={position}
      baseWidth={BASE_W}
      overlayWidth={overlayW}
      fullWidth={FULL_W}
      scrim={scrim}
      extras={extras}
    >
      {card}
    </ScreenStage>
  );
};
