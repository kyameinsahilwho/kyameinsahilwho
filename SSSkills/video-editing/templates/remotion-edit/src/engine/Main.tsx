import React from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {GRAPHICS} from '../components/registry';
import {C, easeOutCubic, FONT_DISPLAY, FONT_SANS, FONT_SERIF, FONT_SUB, FPS, GRADES, SHADOW} from '../theme';
import type {Cue} from '../captions';
import {Footage, rampVolume} from './Footage';
import {ClipRef, Seg, Timeline} from './types';

export const sec = (s: number) => Math.round(s * FPS);

export const layout = (tl: Timeline) => {
  const starts: Record<string, number> = {};
  let t = 0;
  for (const s of tl.segments) {
    starts[s.id] = t;
    t += sec(s.dur);
  }
  return {starts, total: t};
};

// ---------- split screen (phone calls) ----------
const SplitLabel: React.FC<{name: string; role?: string; side: 'left' | 'right'}> = ({name, role}) => (
  // static on purpose: split segments change on every line; an entrance animation would flicker
  <div style={{position: 'absolute', top: 34, left: 40, color: C.white}}>
    <div style={{width: 28, height: 3, background: C.accent, marginBottom: 10, boxShadow: SHADOW.text}} />
    <div style={{fontFamily: FONT_DISPLAY, fontSize: 52, lineHeight: 0.95, letterSpacing: '0.04em', textShadow: SHADOW.hero, textTransform: 'uppercase'}}>{name}</div>
    {role ? (
      <div style={{fontFamily: FONT_SANS, fontWeight: 600, fontSize: 15, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.88, marginTop: 6, textShadow: SHADOW.text}}>
        {role}
      </div>
    ) : null}
  </div>
);

const Half: React.FC<{
  clip: ClipRef;
  durFrames: number;
  grade: Seg['grade'];
  muted: boolean;
  label?: {name: string; role?: string};
  dim: boolean;
  ended?: boolean;
  side: 'left' | 'right';
}> = ({clip, durFrames, grade, muted, label, dim, ended, side}) => (
  <div style={{position: 'absolute', top: 0, bottom: 0, width: 957, [side]: 0, overflow: 'hidden'}}>
    <Footage clip={clip} durFrames={durFrames} grade={grade} muted={muted} />
    <AbsoluteFill style={{background: '#000', opacity: ended ? 0.82 : 0}} />
    {ended ? (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: FONT_SANS, fontSize: 26, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)'}}>
          {label?.name ?? ''} left the call
        </div>
      </AbsoluteFill>
    ) : null}
    {label ? <SplitLabel name={label.name} role={label.role} side={side} /> : null}
  </div>
);

// ---------- transitions ----------
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 2, 12], [1, 0.95, 0], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#fff', opacity: o}} />;
};
const FadeIn: React.FC<{frames: number}> = ({frames}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [0, frames], [1, 0], {extrapolateRight: 'clamp'})}} />;
};
// VHS-style rewind: scanlines, tracking bands, ◀◀ chip.
export const RewindFX: React.FC<{frames: number}> = ({frames}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 3, frames - 6, frames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bands = [0.18, 0.47, 0.73].map((b, i) => ((b + f * (0.037 + i * 0.011)) % 1) * 1080);
  return (
    <AbsoluteFill style={{opacity: o, pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 5px)',
          mixBlendMode: 'screen',
        }}
      />
      {bands.map((y, i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 10 + i * 6, background: 'rgba(255,255,255,0.35)', filter: 'blur(2px)'}} />
      ))}
      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 64,
          fontFamily: FONT_DISPLAY,
          fontSize: 64,
          color: '#fff',
          textShadow: SHADOW.hero,
          letterSpacing: '0.12em',
        }}
      >
        ◀◀ REWIND
      </div>
    </AbsoluteFill>
  );
};

// ---------- placeholder for footage not shot yet ----------
const Placeholder: React.FC<{title: string; lines: string[]}> = ({title, lines}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.ink, alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SANS}}>
      <div
        style={{
          border: `3px dashed ${C.warm}`,
          borderRadius: 18,
          padding: '56px 72px',
          width: 1300,
          color: C.white,
          opacity: interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp'}),
        }}
      >
        <div style={{color: C.warm, letterSpacing: '0.18em', fontSize: 24, fontWeight: 700}}>FOOTAGE PENDING · DROP-IN SLOT</div>
        <div style={{fontFamily: FONT_DISPLAY, fontSize: 84, letterSpacing: '0.03em', marginTop: 14, textTransform: 'uppercase'}}>{title}</div>
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: 28, opacity: 0.85, marginTop: i === 0 ? 26 : 10, lineHeight: 1.35}}>
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Portrait (9:16) phone clip inside the 16:9 frame: blurred copy behind, sharp pillar on top.
const Pillar: React.FC<{clip: ClipRef; durFrames: number; grade: Seg['grade']; x: number; freezeLastFrames: number}> = ({clip, durFrames, grade, x, freezeLastFrames}) => {
  const w = 1080 * (9 / 16);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: 'blur(38px) brightness(0.42) saturate(0.9)', transform: 'scale(1.15)'}}>
        <Footage clip={{...clip, zoom: 1, driftZoom: 0}} durFrames={durFrames} grade={grade} muted freezeLastFrames={freezeLastFrames} />
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 0, height: 1080, width: w, left: x - w / 2, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.55)'}}>
        <Footage clip={clip} durFrames={durFrames} grade={grade} freezeLastFrames={freezeLastFrames} />
      </div>
    </AbsoluteFill>
  );
};

const Graphic: React.FC<{name: string; props?: Record<string, unknown>; dur: number}> = ({name, props, dur}) => {
  const G = GRAPHICS[name];
  if (!G) {
    return (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{background: 'red', color: '#fff', fontSize: 40, padding: 20}}>Missing graphic: {name}</div>
      </AbsoluteFill>
    );
  }
  return <G dur={dur} {...(props ?? {})} />;
};

const SegView: React.FC<{seg: Seg}> = ({seg}) => {
  const d = sec(seg.dur);
  const grade = seg.grade ?? 'cool';
  switch (seg.kind) {
    case 'clip':
      if (seg.layout === 'half-left')
        return (
          <AbsoluteFill style={{background: '#0B0B0D'}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: 957, height: 1080, overflow: 'hidden'}}>
              <Footage clip={seg.clip} durFrames={d} grade={grade} freezeLastFrames={seg.freezeLast ? sec(seg.freezeLast) : 0} />
            </div>
          </AbsoluteFill>
        );
      if (seg.layout === 'pillar') return <Pillar clip={seg.clip} durFrames={d} grade={grade} x={seg.pillarX ?? 960} freezeLastFrames={seg.freezeLast ? sec(seg.freezeLast) : 0} />;
      return <Footage clip={seg.clip} durFrames={d} grade={grade} freezeLastFrames={seg.freezeLast ? sec(seg.freezeLast) : 0} />;
    case 'split': {
      const a = seg.audio ?? 'both';
      return (
        <AbsoluteFill style={{background: '#071a1e'}}>
          <Half clip={seg.left} durFrames={d} grade={grade} muted={a === 'right'} label={seg.leftLabel} dim={seg.active === 'right'} ended={seg.leftEnded} side="left" />
          <Half clip={seg.right} durFrames={d} grade={grade} muted={a === 'left'} label={seg.rightLabel} dim={seg.active === 'left'} ended={seg.rightEnded} side="right" />
        </AbsoluteFill>
      );
    }
    case 'graphic':
      return <Graphic name={seg.graphic} props={seg.props} dur={seg.dur} />;
    case 'placeholder':
      return <Placeholder title={seg.title} lines={seg.lines} />;
    case 'video':
      return (
        <AbsoluteFill style={{background: '#000'}}>
          <OffthreadVideo
            src={staticFile(seg.file)}
            trimBefore={sec(seg.from ?? 0)}
            volume={rampVolume(d, seg.volume ?? 1)}
            style={{width: '100%', height: '100%', objectFit: 'contain', filter: GRADES[grade]}}
          />
        </AbsoluteFill>
      );
  }
};

export const Main: React.FC<{timeline: Timeline; showVoChips?: boolean; captions?: Cue[]; showSubs?: boolean}> = ({timeline, showVoChips = true, captions = [], showSubs = true}) => {
  const {starts} = layout(timeline);
  // overlay windows that occupy the lower third -> subtitles jump to the top while they are up
  const lowWindows = timeline.overlays
    .filter((o) => o.graphic === 'NameCard' || (o.graphic === 'ConceptTag' && (o.props as any)?.position === 'bottom-left' && ((o.props as any)?.maxWidth ?? 980) > 480) || o.graphic === 'MotiveMatrix')
    .map((o) => [starts[o.at] + sec(o.offset), starts[o.at] + sec(o.offset + o.dur)] as const);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {timeline.segments.map((s) => (
        <Sequence key={s.id} from={starts[s.id]} durationInFrames={sec(s.dur)} name={`seg:${s.id}`}>
          <SegView seg={s} />
          {s.transitionIn === 'flash' ? (
            <Sequence durationInFrames={14}>
              <Flash />
            </Sequence>
          ) : null}
          {s.transitionIn === 'fade' || s.transitionIn === 'dip' ? (
            <Sequence durationInFrames={s.transitionIn === 'dip' ? 10 : 18}>
              <FadeIn frames={s.transitionIn === 'dip' ? 10 : 18} />
            </Sequence>
          ) : null}
          {s.transitionIn === 'rewind' ? (
            <Sequence durationInFrames={24}>
              <RewindFX frames={24} />
            </Sequence>
          ) : null}
        </Sequence>
      ))}
      {timeline.overlays.map((o) => (
        <Sequence key={o.id} from={starts[o.at] + sec(o.offset)} durationInFrames={sec(o.dur)} name={`ov:${o.id}`}>
          <Graphic name={o.graphic} props={o.props} dur={o.dur} />
        </Sequence>
      ))}
      {timeline.audio.map((a) =>
        a.file ? (
          <Sequence key={a.id} from={Math.max(0, starts[a.at] + sec(a.offset))} durationInFrames={a.dur ? sec(a.dur) : undefined} name={`au:${a.id}`}>
            <Audio
              src={staticFile(a.file)}
              loop={a.loop}
              volume={(f: number) => {
                const base = a.dur ? rampVolume(sec(a.dur), a.volume ?? 1)(f) : a.volume ?? 1;
                if (!a.volumeKeys || a.volumeKeys.length === 0) return base;
                const ks = a.volumeKeys;
                return base * interpolate(f / FPS, ks.map((k) => k[0]), ks.map((k) => k[1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              }}
            />
            {showVoChips && a.placeholderText ? <VoChip text={a.placeholderText} /> : null}
          </Sequence>
        ) : null,
      )}
      {showSubs
        ? captions.map((c, i) => {
            if (starts[c.at] === undefined) return null;
            const from = starts[c.at] + sec(c.offset);
            const to = from + Math.max(sec(c.dur), 18);
            const top = lowWindows.some(([a, b]) => from < b && to > a);
            return (
              <Sequence key={`cap${i}`} from={from} durationInFrames={to - from} name={`sub:${c.text.slice(0, 24)}`}>
                <Subtitle text={c.text} italic={c.italic} top={top} />
              </Sequence>
            );
          })
        : null}
    </AbsoluteFill>
  );
};

// Netflix-style burned-in subtitle: Helvetica-metric bold (Arimo), white, soft shadow, no box.
const Subtitle: React.FC<{text: string; italic?: boolean; top?: boolean}> = ({text, italic, top}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 2], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: top ? 'flex-start' : 'flex-end', alignItems: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          marginTop: top ? 64 : 0,
          marginBottom: top ? 0 : 84,
          maxWidth: 1240,
          padding: '0 40px',
          textAlign: 'center',
          fontFamily: FONT_SUB,
          fontWeight: 700,
          fontStyle: italic ? 'italic' : 'normal',
          fontSize: 46,
          lineHeight: 1.22,
          color: '#FFFFFF',
          textShadow: SHADOW.sub,
          textWrap: 'balance',
          opacity: o,
        } as React.CSSProperties}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Small marker so scratch (machine) VO is obvious in previews.
const VoChip: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  if (f > 6 * FPS) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        maxWidth: 720,
        background: 'rgba(244,162,97,0.92)',
        color: '#1b1b1b',
        fontFamily: FONT_SANS,
        fontSize: 20,
        fontWeight: 600,
        padding: '8px 14px',
        borderRadius: 8,
      }}
    >
      SCRATCH VO (replace): “{text.length > 90 ? text.slice(0, 90) + '…' : text}”
    </div>
  );
};
