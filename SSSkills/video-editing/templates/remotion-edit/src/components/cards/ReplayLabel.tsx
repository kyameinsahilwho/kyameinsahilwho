import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {DS, KICK_SHADOW, MaskUp, lerp, prog} from './cine';

export type ReplayLabelProps = {
  dur: number;
  index: number;
  title: string;
  /** Optional: override the kicker (default "What if · Replay N"). */
  kicker?: string;
};

/** Top-left "What if · Replay N" label: warm tracked kicker, then a Bebas title rising out of its mask. No panel. */
export const ReplayLabel: React.FC<ReplayLabelProps> = ({dur, index, title, kicker}) => {
  const frame = useCurrentFrame();
  const ruleP = easeOutExpo(prog(frame, 0, 0.7));
  const kick = easeOutCubic(prog(frame, 0.1, 0.6));
  const titleP = easeOutExpo(prog(frame, 0.3, 0.8));
  const settle = easeOutCubic(prog(frame, 0.3, 1.3));
  const exitAt = Math.max(1.1, dur - 0.45);
  const outKick = easeInOutCubic(prog(frame, exitAt, 0.3));
  const outTitle = easeInOutCubic(prog(frame, exitAt + 0.08, 0.37));

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 110, top: 84}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginLeft: 2}}>
          <div
            style={{
              width: 36,
              height: 2,
              background: C.warm,
              boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
              transform: `scaleX(${ruleP * (1 - outKick)})`,
              transformOrigin: 'left center',
            }}
          />
          <div
            style={{
              fontFamily: FONT_SANS,
              fontWeight: 800,
              fontSize: 19,
              letterSpacing: `${lerp(0.42, 0.3, kick)}em`,
              textTransform: 'uppercase',
              color: C.warm,
              textShadow: KICK_SHADOW,
              whiteSpace: 'nowrap',
              opacity: kick * (1 - outKick),
            }}
          >
            {kicker ?? `What if · Replay ${index}`}
          </div>
        </div>
        <div style={{filter: DS.hero, marginTop: 14}}>
          <MaskUp inP={titleP} outP={outTitle} style={{height: '0.84em', fontSize: 84}}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 400,
                fontSize: 84,
                lineHeight: 1,
                color: C.white,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                letterSpacing: `${lerp(0.12, 0.04, settle)}em`,
                marginLeft: -84 * 0.02,
              }}
            >
              {title}
            </div>
          </MaskUp>
        </div>
      </div>
    </AbsoluteFill>
  );
};
