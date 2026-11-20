import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FPS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {FullBackground, ScreenVariant, clamp01, initialsOf, prog, pushIn} from './ComposeMail';

export type CallState = 'calling' | 'connected' | 'ended';

export type CallScreenProps = {
  dur: number;
  variant?: ScreenVariant;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  name: string;
  role?: string;
  state: CallState;
  startAt?: number;
  connectAt?: number;
  endAt?: number;
};

const CW = 470;
const CH = 116;
const MARGIN = 56;

const mmss = (s: number) => {
  const v = Math.max(0, Math.floor(s));
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};

const HangUpIcon: React.FC = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" style={{display: 'block', transform: 'rotate(135deg)'}}>
    <path
      d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"
      fill="#fff"
    />
  </svg>
);

export const CallScreen: React.FC<CallScreenProps> = ({
  dur,
  variant = 'overlay',
  position = 'top-right',
  name,
  role,
  state,
  startAt = 0,
  connectAt,
  endAt,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const full = variant === 'full';

  /* ---- state machine ---- */
  let cur: CallState = state;
  if (connectAt !== undefined && t >= connectAt && cur === 'calling') cur = 'connected';
  if (endAt !== undefined && t >= endAt) cur = 'ended';
  const since = connectAt ?? (state === 'connected' ? startAt : undefined);
  const elapsed = since !== undefined ? Math.min(t, endAt ?? Infinity) - since : 0;
  const changeAt = cur === 'ended' ? endAt ?? startAt : cur === 'connected' ? connectAt ?? startAt : startAt;
  const swap = easeOutCubic(prog(t, changeAt, 0.3));

  /* ---- entrance / exit ---- */
  const inP = easeOutExpo(prog(t, startAt, 0.55));
  const fade = easeOutCubic(prog(t, startAt, 0.4));
  const outP = easeInOutCubic(prog(t, dur - 0.35, 0.35));
  const k = full ? 1.9 * pushIn(t, dur) : 1;
  const scale = (0.97 + 0.03 * inP) * (1 - 0.02 * outP) * k;
  const top = position.startsWith('top');
  const leftSide = position.endsWith('left');
  const rise = (top ? -1 : 1) * 24 * (1 - inP);

  const ended = cur === 'ended';
  const endedP = ended ? swap : 0;

  const rings =
    cur === 'calling'
      ? [0, 0.5].map((off) => {
          const ph = (((t - startAt) / 1.4 + off) % 1 + 1) % 1;
          const e = easeOutCubic(ph);
          return {s: 1 + 0.5 * e, o: 0.45 * (1 - ph)};
        })
      : [];

  const statusLine = (() => {
    if (cur === 'calling') {
      return (
        <span style={{display: 'inline-flex', alignItems: 'baseline', color: 'rgba(255,255,255,0.68)'}}>
          Calling
          {[0, 1, 2].map((d) => (
            <span key={d} style={{opacity: Math.floor(t * 3) % 4 > d ? 1 : 0.2}}>
              .
            </span>
          ))}
        </span>
      );
    }
    if (cur === 'connected') {
      return (
        <span style={{display: 'inline-flex', alignItems: 'center', gap: 9, color: 'rgba(255,255,255,0.92)'}}>
          <span style={{width: 8, height: 8, borderRadius: 999, background: C.accent, opacity: 0.55 + 0.45 * Math.cos(t * 4)}} />
          <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em'}}>{mmss(elapsed)}</span>
        </span>
      );
    }
    return (
      <span style={{display: 'inline-flex', alignItems: 'center', gap: 10}}>
        <span style={{color: C.alert, fontWeight: 600}}>Call ended</span>
        {since !== undefined ? (
          <span style={{color: 'rgba(255,255,255,0.45)', fontSize: 16, fontVariantNumeric: 'tabular-nums'}}>{mmss(elapsed)}</span>
        ) : null}
      </span>
    );
  })();

  const card = (
    <div
      style={{
        width: CW,
        height: CH,
        borderRadius: 24,
        background: 'rgba(24,24,27,0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${ended ? `rgba(224,72,62,${0.12 + 0.3 * endedP})` : 'rgba(255,255,255,0.08)'}`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 6px 18px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 22px',
        fontFamily: FONT_SANS,
        boxSizing: 'border-box',
      }}
    >
      {/* avatar */}
      <div style={{position: 'relative', width: 64, height: 64, flexShrink: 0}}>
        {rings.map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.85)',
              transform: `scale(${r.s})`,
              opacity: r.o,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            background: '#3A3A40',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 23,
            fontWeight: 600,
            letterSpacing: '0.02em',
            opacity: 1 - 0.4 * endedP,
          }}
        >
          {initialsOf(name)}
        </div>
      </div>

      {/* text */}
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{color: '#fff', fontSize: 24, fontWeight: 600, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {name}
        </div>
        {role ? (
          <div style={{color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {role}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 5,
            fontSize: 17,
            opacity: swap,
            transform: `translateY(${6 * (1 - swap)}px)`,
          }}
        >
          {statusLine}
        </div>
      </div>

      {/* hang-up button */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          flexShrink: 0,
          background: ended ? `rgba(255,255,255,${0.1 * endedP})` : C.alert,
          border: ended ? '1px solid rgba(255,255,255,0.12)' : 'none',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ended ? 1 - 0.45 * clamp01(endedP) : 1,
        }}
      >
        <HangUpIcon />
      </div>
    </div>
  );

  const anchor: React.CSSProperties = full
    ? {left: '50%', top: '50%', marginLeft: -CW / 2, marginTop: -CH / 2}
    : {
        [top ? 'top' : 'bottom']: MARGIN,
        [leftSide ? 'left' : 'right']: MARGIN,
      };
  const origin = full ? '50% 50%' : `${leftSide ? '0%' : '100%'} ${top ? '0%' : '100%'}`;

  return (
    <AbsoluteFill>
      {full ? <FullBackground /> : null}
      <div
        style={{
          position: 'absolute',
          ...anchor,
          transformOrigin: origin,
          transform: `translateY(${rise}px) scale(${scale})`,
          opacity: fade * (1 - outP),
        }}
      >
        {card}
      </div>
    </AbsoluteFill>
  );
};

