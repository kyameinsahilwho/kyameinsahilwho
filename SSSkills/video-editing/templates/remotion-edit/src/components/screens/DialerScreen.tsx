import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, FPS, SHADOW, easeOutCubic} from '../../theme';

// Right half of a split screen: the RECEIVER's phone in an ongoing call.
// `wave` = per-frame voice envelope (0..1) of the receiver, so the bars move with his voice.
export type DialerScreenProps = {
  dur: number;
  callerName: string; // shown on the phone (who is calling)
  callerRole?: string;
  ownerName: string; // whose phone this is (split label)
  ownerRole?: string;
  leftName?: string; // label for the left split
  leftRole?: string;
  wave?: number[];
  endAt?: number;
};

const BAR_N = 29;

export const DialerScreen: React.FC<DialerScreenProps> = ({dur, callerName, callerRole, ownerName, ownerRole, leftName, leftRole, wave = [], endAt}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const ended = endAt !== undefined && t >= endAt;
  const v = wave.length ? wave[Math.min(wave.length - 1, f)] ?? 0 : 0;
  const secs = Math.floor(Math.min(t, endAt ?? dur) + 4); // call was already a few seconds in
  const timer = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const appear = easeOutCubic(Math.min(1, t / 0.35));

  const phoneH = 980;
  const phoneW = 470;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* right half background */}
      <div style={{position: 'absolute', left: 963, top: 0, width: 957, height: 1080, background: '#0B0B0D'}} />
      {/* divider */}
      <div style={{position: 'absolute', left: 957, top: 0, width: 6, height: 1080, background: '#050506'}} />
      {/* phone */}
      <div
        style={{
          position: 'absolute',
          left: 963 + (957 - phoneW) / 2,
          top: (1080 - phoneH) / 2,
          width: phoneW,
          height: phoneH,
          borderRadius: 64,
          background: '#151517',
          border: '10px solid #2A2A2E',
          boxShadow: SHADOW.card,
          overflow: 'hidden',
          opacity: appear,
          transform: `translateY(${(1 - appear) * 20}px)`,
          fontFamily: FONT_SANS,
          color: C.white,
        }}
      >
        <div style={{position: 'absolute', left: '50%', top: 16, width: 120, height: 32, marginLeft: -60, borderRadius: 20, background: '#000'}} />
        <div style={{position: 'absolute', top: 92, width: '100%', textAlign: 'center'}}>
          <div style={{fontSize: 19, letterSpacing: '0.08em', color: ended ? C.alert : '#9A9AA2'}}>{ended ? 'Call ended' : timer}</div>
          <div
            style={{
              margin: '34px auto 0',
              width: 132,
              height: 132,
              borderRadius: '50%',
              background: '#2C2C31',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              fontWeight: 600,
            }}
          >
            {callerName.slice(0, 1)}
          </div>
          <div style={{marginTop: 26, fontSize: 44, fontWeight: 600, letterSpacing: '-0.01em'}}>{callerName}</div>
          {callerRole ? <div style={{marginTop: 8, fontSize: 19, color: '#9A9AA2'}}>{callerRole}</div> : null}
        </div>
        {/* waveform of the phone owner's voice */}
        <div style={{position: 'absolute', top: 520, left: 0, width: '100%', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}>
          {Array.from({length: BAR_N}).map((_, i) => {
            const center = 1 - Math.abs(i - (BAR_N - 1) / 2) / ((BAR_N - 1) / 2); // taller in the middle
            const jitter = 0.55 + 0.45 * Math.abs(Math.sin(f * 0.9 + i * 1.7) * Math.cos(f * 0.37 + i * 0.6));
            const h = ended ? 4 : 4 + 140 * v * (0.35 + 0.65 * center) * jitter;
            return <div key={i} style={{width: 8, height: h, borderRadius: 4, background: v > 0.05 && !ended ? C.white : '#4A4A50'}} />;
          })}
        </div>
        <div style={{position: 'absolute', top: 690, width: '100%', textAlign: 'center', fontSize: 16, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7C7C84'}}>
          {ended ? '' : v > 0.05 ? 'You' : 'Connected'}
        </div>
        {/* controls */}
        <div style={{position: 'absolute', top: 760, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 34}}>
          {['Mute', 'Keypad', 'Speaker'].map((k) => (
            <div key={k} style={{textAlign: 'center'}}>
              <div style={{width: 74, height: 74, borderRadius: '50%', background: '#2C2C31', margin: '0 auto'}} />
              <div style={{fontSize: 14, color: '#9A9AA2', marginTop: 8}}>{k}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 878,
            left: '50%',
            marginLeft: -40,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: C.alert,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={36} height={36} viewBox="0 0 24 24">
            <path d="M3 14.5c5-4.4 13-4.4 18 0l-2.2 2.6c-.4.5-1.1.6-1.6.2l-1.9-1.4c-.4-.3-.6-.8-.5-1.3l.3-1.4c-2-.7-4.2-.7-6.2 0l.3 1.4c.1.5-.1 1-.5 1.3l-1.9 1.4c-.5.4-1.2.3-1.6-.2z" fill="#fff" />
          </svg>
        </div>
      </div>
      {/* split labels (static) */}
      {[
        {x: 40, name: leftName, role: leftRole},
        {x: 1003, name: ownerName, role: ownerRole},
      ].map((l) =>
        l.name ? (
          <div key={l.x} style={{position: 'absolute', top: 34, left: l.x, color: C.white}}>
            <div style={{width: 28, height: 3, background: C.accent, marginBottom: 10}} />
            <div style={{fontFamily: FONT_DISPLAY, fontSize: 52, lineHeight: 0.95, letterSpacing: '0.04em', textShadow: SHADOW.hero, textTransform: 'uppercase'}}>{l.name}</div>
            {l.role ? (
              <div style={{fontFamily: FONT_SANS, fontWeight: 600, fontSize: 15, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.88, marginTop: 6, textShadow: SHADOW.text}}>{l.role}</div>
            ) : null}
          </div>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
