import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, SHADOW, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {KICK_SHADOW, prog} from './cine';

export type TatBarsProps = {
  dur: number;
  promised?: string;
  delivered?: string;
  /** Optional: kicker above the bars (default "Turnaround time"). */
  title?: string;
};

const BAR_W = 300; // promised width; delivered = 2.1x
const LABEL_W = 230;
const BAR_H = 12;
const ROW_H = 64;

/** Splits "48+ hrs" into {n: 48, rest: "+ hrs"} for the counter. */
const parseNum = (s: string) => {
  const m = s.match(/^(\D*)(\d+)(.*)$/);
  return m ? {pre: m[1], n: Number(m[2]), rest: m[3]} : null;
};

/** Turnaround-time comparison on footage: flat white "promised" bar vs red "delivered" bar (2.1x, counting up). */
export const TatBars: React.FC<TatBarsProps> = ({dur, promised = '24 hrs', delivered = '48+ hrs', title = 'Turnaround time'}) => {
  const frame = useCurrentFrame();
  const kick = easeOutCubic(prog(frame, 0, 0.6));
  const r1 = easeOutCubic(prog(frame, 0.15, 0.5));
  const p1 = easeOutExpo(prog(frame, 0.3, 0.9));
  const l1 = easeOutCubic(prog(frame, 0.7, 0.45));
  const r2 = easeOutCubic(prog(frame, 0.95, 0.5));
  const mark = easeOutCubic(prog(frame, 1.0, 0.5));
  const p2 = easeInOutCubic(prog(frame, 1.15, 1.3));
  const l2 = easeOutCubic(prog(frame, 1.2, 0.3));
  const out = easeInOutCubic(prog(frame, Math.max(1, dur - 0.4), 0.4));

  const parsed = parseNum(delivered);
  let deliveredLabel = delivered;
  if (parsed) {
    const count = Math.round(parsed.n * p2);
    const rest = p2 < 1 ? parsed.rest.replace('+', '') : parsed.rest;
    deliveredLabel = `${parsed.pre}${count}${rest}`;
  }

  const row = (label: string, fill: string, numColor: string, width: number, value: string, valueOpacity: number, rowP: number) => (
    <div style={{display: 'flex', alignItems: 'center', height: ROW_H, opacity: rowP, transform: `translateY(${(1 - rowP) * 10}px)`}}>
      <div
        style={{
          width: LABEL_W,
          fontFamily: FONT_SANS,
          fontWeight: 600,
          fontSize: 19,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.9)',
          textShadow: KICK_SHADOW,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      <div style={{position: 'relative', width: BAR_W * 2.1 + 200, height: ROW_H}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: (ROW_H - BAR_H) / 2,
            height: BAR_H,
            width,
            background: fill,
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: width + 22,
            top: 0,
            height: ROW_H,
            lineHeight: `${ROW_H}px`,
            fontFamily: FONT_DISPLAY,
            fontWeight: 400,
            fontSize: 58,
            letterSpacing: '0.03em',
            color: numColor,
            textShadow: SHADOW.hero,
            whiteSpace: 'nowrap',
            opacity: valueOpacity,
            paddingTop: 6,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 110, top: 84, opacity: 1 - out, transform: `translateY(${out * 8}px)`}}>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: C.tealBright,
            textShadow: KICK_SHADOW,
            opacity: kick,
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div style={{position: 'relative'}}>
          {/* promise marker running through both rows */}
          <div
            style={{
              position: 'absolute',
              left: LABEL_W + BAR_W,
              top: 8,
              bottom: 8,
              width: 0,
              borderLeft: '1px dashed rgba(255,255,255,0.7)',
              opacity: mark,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
            }}
          />
          {row('Promised', 'rgba(255,255,255,0.9)', C.white, BAR_W * p1, promised, l1, r1)}
          {row('Delivered', C.alert, C.alert, BAR_W * 2.1 * p2, deliveredLabel, l2, r2)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
