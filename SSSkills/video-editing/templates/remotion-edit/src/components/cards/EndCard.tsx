import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {MaskUp, lerp, prog} from './cine';

export type EndCardProps = {
  dur: number;
  kicker: string;
  text: string;
  /** Optional: statement size in px (default 116). */
  size?: number;
};

/** Splits a statement into sentences ("A. B." -> ["A.", "B."]) so each starts on its own line. */
const sentences = (text: string) => text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];

/**
 * Full-screen lesson card on solid black, left-aligned: amber rule, tracked kicker, then the statement in Bebas,
 * word by word out of a mask line. Each sentence starts a new line; later sentences sit back at 62% white.
 */
export const EndCard: React.FC<EndCardProps> = ({dur, kicker, text, size = 116}) => {
  const frame = useCurrentFrame();
  const rule = easeOutExpo(prog(frame, 0.1, 0.7));
  const kick = easeOutCubic(prog(frame, 0.3, 0.6));
  const out = easeInOutCubic(prog(frame, Math.max(1, dur - 0.4), 0.4));

  const WORD0 = 0.65;
  const PER = 0.075;
  let wi = 0;

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 220, paddingRight: 180, opacity: 1 - out}}>
        <div style={{width: 72, height: 2, background: C.accent, transform: `scaleX(${rule})`, transformOrigin: 'left center'}} />
        <div
          style={{
            marginTop: 26,
            fontFamily: FONT_SANS,
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: `${lerp(0.42, 0.32, kick)}em`,
            textTransform: 'uppercase',
            color: C.accent,
            opacity: kick,
          }}
        >
          {kicker}
        </div>
        <div style={{marginTop: 34, maxWidth: 1520}}>
          {sentences(text).map((s, si) => (
            <div
              key={si}
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 400,
                fontSize: size,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: si === 0 ? C.white : 'rgba(255,255,255,0.62)',
                lineHeight: 1.04,
                textWrap: 'balance',
                marginTop: si === 0 ? 0 : '0.06em',
                marginLeft: -size * 0.02,
              }}
            >
              {s.split(' ').map((w, k, arr) => {
                const p = easeOutExpo(prog(frame, WORD0 + wi++ * PER, 0.8));
                return (
                  <React.Fragment key={k}>
                    <MaskUp inP={p} style={{height: '0.84em'}}>
                      {w}
                    </MaskUp>
                    {k < arr.length - 1 ? ' ' : null}
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
