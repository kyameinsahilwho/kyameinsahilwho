import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {DS, KICK_SHADOW, MaskUp, lerp, prog} from './cine';

export type TimeStampProps = {
  dur: number;
  time: string;
  sub?: string;
  countFrom?: string;
};

const SIZE = 110;
const LINE = SIZE; // one digit row (line-height 1)

/** One digit cell that rolls upward from `from` to `to`. Clipped to its row; the wrapper carries the shadow. */
const RollDigit: React.FC<{from: number; to: number; p: number}> = ({from, to, p}) => {
  const steps = (to - from + 10) % 10;
  const seq = Array.from({length: steps + 1}, (_, i) => (from + i) % 10);
  if (p >= 1 || steps === 0) return <span>{to}</span>;
  return (
    <span style={{display: 'inline-block', height: LINE, overflow: 'hidden', verticalAlign: 'top'}}>
      <span style={{display: 'flex', flexDirection: 'column', transform: `translateY(${-p * steps * LINE}px)`}}>
        {seq.map((d, i) => (
          <span key={i} style={{height: LINE, lineHeight: `${LINE}px`, textAlign: 'center'}}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};

/** Top-left clock stamp, e.g. "2:07 AM": rises out of a mask line, digits roll from `countFrom`, sub line follows. */
export const TimeStamp: React.FC<TimeStampProps> = ({dur, time, sub, countFrom}) => {
  const frame = useCurrentFrame();
  const inP = easeOutExpo(prog(frame, 0, 0.8));
  const settle = easeOutCubic(prog(frame, 0, 1.2));
  const rollP = easeInOutCubic(prog(frame, 0.35, 0.7));
  const ruleP = easeOutExpo(prog(frame, 0.3, 0.7));
  const subP = easeOutCubic(prog(frame, 0.5, 0.6));
  const exitAt = Math.max(1, dur - 0.45);
  const outSub = easeInOutCubic(prog(frame, exitAt, 0.3));
  const outMain = easeInOutCubic(prog(frame, exitAt + 0.08, 0.37));

  const [clock, ...rest] = time.split(' ');
  const suffix = rest.join(' ');
  const fromClock = countFrom ? countFrom.split(' ')[0] : undefined;
  const canRoll = !!fromClock && fromClock.length === clock.length;

  const chars = clock.split('').map((ch, i) => {
    const f = canRoll ? fromClock![i] : undefined;
    if (f !== undefined && /\d/.test(ch) && /\d/.test(f) && f !== ch) {
      return <RollDigit key={i} from={Number(f)} to={Number(ch)} p={rollP} />;
    }
    return <span key={i}>{ch}</span>;
  });

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 110, top: 78}}>
        <div style={{filter: DS.hero}}>
          <MaskUp inP={inP} outP={outMain} style={{height: '0.84em', fontSize: SIZE}}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 400,
                fontSize: SIZE,
                lineHeight: `${LINE}px`,
                height: LINE,
                color: C.white,
                letterSpacing: `${lerp(0.12, 0.03, settle)}em`,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'flex-start',
                marginLeft: -SIZE * 0.02,
              }}
            >
              {chars}
              {suffix ? <span style={{marginLeft: '0.22em'}}>{suffix}</span> : null}
            </div>
          </MaskUp>
        </div>
        {sub ? (
          <div style={{marginTop: 16, display: 'flex', alignItems: 'center', gap: 16}}>
            <div
              style={{
                width: 36,
                height: 2,
                background: C.accent,
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                transform: `scaleX(${ruleP * (1 - outSub)})`,
                transformOrigin: 'left center',
              }}
            />
            <div
              style={{
                fontFamily: FONT_SANS,
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: `${lerp(0.38, 0.28, subP)}em`,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.9)',
                textShadow: KICK_SHADOW,
                whiteSpace: 'nowrap',
                opacity: subP * (1 - outSub),
                transform: `translateY(${(1 - subP) * 8}px)`,
              }}
            >
              {sub}
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
