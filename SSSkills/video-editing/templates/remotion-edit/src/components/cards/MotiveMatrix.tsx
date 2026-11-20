import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {MaskUp, lerp, prog} from './cine';

export type MotiveBox = {kicker: string; text: string};

export type MotiveMatrixProps = {
  dur: number;
  title?: string;
  boxes?: MotiveBox[];
  boxAt?: number[];
};

const DEFAULT_BOXES: MotiveBox[] = [
  {kicker: 'STATED INTENT', text: '“Risk control”'},
  {kicker: 'SYSTEMIC INCENTIVE', text: 'Approvals = his relevance'},
  {kicker: 'PSYCHOLOGICAL NEED', text: 'Authority, being needed'},
  {kicker: 'POLITICAL RISK', text: 'Becoming invisible to the Business Head'},
];

const POP = 0.45; // seconds per box pop; boxes never overlap their pops
const CELL_W = 660;
const CELL_H = 220;

/** Solid ink scrim (88%) over the footage, Bebas title, 2x2 outlined cells that reveal one at a time. */
export const MotiveMatrix: React.FC<MotiveMatrixProps> = ({
  dur,
  title = 'Incentive-Motive Matrix · Mr. Khurana',
  boxes = DEFAULT_BOXES,
  boxAt = [0.8, 2.2, 3.6, 5.0],
}) => {
  const frame = useCurrentFrame();
  const scrim = easeOutCubic(prog(frame, 0, 0.5));
  const titleP = easeOutCubic(prog(frame, 0.1, 1.2));
  const titleO = easeOutCubic(prog(frame, 0.1, 0.7));
  const rule = easeOutExpo(prog(frame, 0.35, 0.7));
  const out = easeInOutCubic(prog(frame, Math.max(1, dur - 0.4), 0.4));

  // Enforce strictly sequential pops.
  const starts: number[] = [];
  boxes.slice(0, 4).forEach((_, i) => {
    const want = boxAt[i] ?? (starts[i - 1] ?? 0.4) + 1.2;
    starts.push(i === 0 ? want : Math.max(want, starts[i - 1] + POP));
  });

  const ls = lerp(0.2, 0.06, titleP);

  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 1 - out}}>
      <AbsoluteFill style={{background: C.ink, opacity: 0.88 * scrim}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 400,
            fontSize: 76,
            lineHeight: 1,
            color: C.white,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: `${ls}em`,
            marginRight: `-${ls}em`,
            opacity: titleO,
          }}
        >
          {title}
        </div>
        <div style={{marginTop: 20, width: 90, height: 2, background: C.accent, transform: `scaleX(${rule})`}} />
        <div
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: `${CELL_W}px ${CELL_W}px`,
            gridAutoRows: CELL_H,
            gap: 28,
          }}
        >
          {boxes.slice(0, 4).map((b, i) => {
            const p = easeOutCubic(prog(frame, starts[i], POP));
            const tp = easeOutExpo(prog(frame, starts[i] + 0.08, 0.8));
            const risk = i === 3;
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  border: `1px solid ${risk ? 'rgba(224,72,62,0.6)' : 'rgba(255,255,255,0.25)'}`,
                  padding: '30px 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  opacity: p,
                  transform: `translateY(${(1 - p) * 14}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 700,
                    fontSize: 16,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: risk ? C.alert : C.accent,
                  }}
                >
                  {b.kicker}
                </div>
                <div
                  style={{
                    marginTop: 16,
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 400,
                    fontSize: 56,
                    letterSpacing: '0.03em',
                    color: C.white,
                    textTransform: 'uppercase',
                    lineHeight: 1.04,
                    textWrap: 'balance',
                  }}
                >
                  {b.text.split(' ').map((w, wi, arr) => (
                    <React.Fragment key={wi}>
                      <MaskUp inP={tp} style={{height: '0.84em'}}>
                        {w}
                      </MaskUp>
                      {wi < arr.length - 1 ? ' ' : null}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
