import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, SHADOW, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {DS, KICK_SHADOW, MaskUp, lerp, prog} from './cine';

export type NameCardProps = {
  dur: number;
  name: string;
  role: string;
  kicker?: string;
  side?: 'left' | 'right';
  /** Optional: name size in px (default 160). */
  nameSize?: number;
};

const EDGE = 110; // left/right margin
const BASELINE = 900; // baseline of the name

/**
 * Character introduction, documentary-series style. No panel: big Bebas name rises letter by letter out of a
 * mask line while its tracking settles, a thin amber rule draws out beneath it, then the role and kicker arrive.
 * Exit: role/kicker fade, the name drops back into its mask, the rule retracts.
 */
export const NameCard: React.FC<NameCardProps> = ({dur, name, role, kicker, side = 'left', nameSize = 160}) => {
  const frame = useCurrentFrame();
  const right = side === 'right';
  const align = right ? 'flex-end' : 'flex-start';

  // ---- timing (s) ----
  const NAME_AT = 0.0;
  const PER_LETTER = 0.035;
  const LETTER_LEN = 0.8;
  const letters = name.toUpperCase().split('');
  const RULE_AT = 0.3;
  const ROLE_AT = 0.6;
  const KICK_AT = 0.85;

  const exitAt = Math.max(1.2, dur - 0.5);
  const outSoft = easeInOutCubic(prog(frame, exitAt, 0.3)); // role + kicker
  const outRule = easeInOutCubic(prog(frame, exitAt + 0.05, 0.35));

  const settle = easeOutCubic(prog(frame, NAME_AT, 1.4));
  const tracking = lerp(0.16, 0.035, settle); // em

  const rule = easeOutExpo(prog(frame, RULE_AT, 0.7)) * (1 - outRule);
  const roleP = easeOutCubic(prog(frame, ROLE_AT, 0.6));
  const kickP = easeOutCubic(prog(frame, KICK_AT, 0.6));

  // The name's line box: Bebas caps sit ~0.10em..0.80em in a 1.0 line; the mask line is just under the baseline.
  const nameTop = BASELINE - nameSize * 0.8;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* kicker + name, bottom-anchored on the name's mask */}
      <div
        style={{
          position: 'absolute',
          [right ? 'right' : 'left']: EDGE,
          top: nameTop,
          display: 'flex',
          flexDirection: 'column',
          alignItems: align,
        }}
      >
        {kicker ? (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              [right ? 'right' : 'left']: 4,
              marginBottom: 12,
              fontFamily: FONT_SANS,
              fontWeight: 700,
              fontSize: 19,
              letterSpacing: `${lerp(0.5, 0.32, kickP)}em`,
              textTransform: 'uppercase',
              color: C.tealBright,
              whiteSpace: 'nowrap',
              textShadow: KICK_SHADOW,
              opacity: kickP * (1 - outSoft),
              transform: `translateY(${(1 - kickP) * 8 + outSoft * 6}px)`,
            }}
          >
            {kicker}
          </div>
        ) : null}
        <div style={{filter: DS.hero}}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 400,
              fontSize: nameSize,
              lineHeight: 1,
              color: C.white,
              whiteSpace: 'nowrap',
              display: 'flex',
              marginLeft: right ? 0 : -nameSize * 0.02, // optical: Bebas side-bearing
            }}
          >
            {letters.map((ch, i) => {
              const p = easeOutExpo(prog(frame, NAME_AT + i * PER_LETTER, LETTER_LEN));
              const o = right ? letters.length - 1 - i : i;
              const oP = easeInOutCubic(prog(frame, exitAt + 0.08 + o * 0.012, 0.36));
              return (
                <MaskUp key={i} inP={p} outP={oP} style={{height: '0.84em'}}>
                  <span style={{display: 'inline-block', paddingRight: ch === ' ' ? '0.18em' : i === letters.length - 1 ? 0 : `${tracking}em`}}>
                    {ch === ' ' ? ' ' : ch}
                  </span>
                </MaskUp>
              );
            })}
          </div>
        </div>
      </div>

      {/* amber rule, under the name */}
      <div
        style={{
          position: 'absolute',
          [right ? 'right' : 'left']: EDGE + 2,
          top: BASELINE + 26,
          width: 120,
          height: 3,
          background: C.accent,
          boxShadow: '0 1px 6px rgba(0,0,0,0.45)',
          transform: `scaleX(${rule})`,
          transformOrigin: right ? 'right center' : 'left center',
        }}
      />

      {/* role */}
      <div
        style={{
          position: 'absolute',
          [right ? 'right' : 'left']: EDGE + 2,
          top: BASELINE + 50,
          fontFamily: FONT_SANS,
          fontWeight: 600,
          fontSize: 26,
          lineHeight: 1.2,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.88)',
          whiteSpace: 'nowrap',
          textShadow: SHADOW.text,
          opacity: roleP * (1 - outSoft),
          transform: `translateY(${(1 - roleP) * 14 + outSoft * 8}px)`,
        }}
      >
        {role}
      </div>
    </AbsoluteFill>
  );
};
