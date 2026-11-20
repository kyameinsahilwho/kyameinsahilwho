import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {BODY_SHADOW, KICK_SHADOW, lerp, prog} from './cine';

export type ConceptTagProps = {
  dur: number;
  kicker?: string;
  text: string;
  /** 'teal' is the legacy name of the amber accent; 'accent' is accepted as an alias. */
  tone?: 'teal' | 'accent' | 'alert' | 'warm';
  position?: 'top-left' | 'bottom-left' | 'top-right';
  /** Optional: max text width in px (default 980). */
  maxWidth?: number;
};

// Rule colour, and a kicker colour tuned to stay legible as small text over footage.
const TONES: Record<NonNullable<ConceptTagProps['tone']>, {rule: string; kicker: string}> = {
  teal: {rule: C.accent, kicker: C.tealBright},
  accent: {rule: C.accent, kicker: C.tealBright},
  alert: {rule: C.alert, kicker: '#F2675D'},
  warm: {rule: C.warm, kicker: C.warm},
};

/**
 * Academic concept annotation, as a clean text block on footage: a thin vertical rule in the tone colour draws
 * down, the tracked kicker arrives, then the statement. No card, no box: shadow only.
 */
export const ConceptTag: React.FC<ConceptTagProps> = ({
  dur,
  kicker = 'CONCEPT',
  text,
  tone = 'teal',
  position = 'top-left',
  maxWidth = 980,
}) => {
  const frame = useCurrentFrame();
  const t = TONES[tone] ?? TONES.teal;
  const ruleP = easeOutExpo(prog(frame, 0, 0.7));
  const kick = easeOutCubic(prog(frame, 0.15, 0.6));
  const body = easeOutCubic(prog(frame, 0.35, 0.7));
  const exitAt = Math.max(1.2, dur - 0.45);
  const outText = easeInOutCubic(prog(frame, exitAt, 0.35));
  const outRule = easeInOutCubic(prog(frame, exitAt + 0.1, 0.35));

  const right = position === 'top-right';
  const pos: React.CSSProperties =
    position === 'top-right' ? {top: 84, right: 110} : position === 'bottom-left' ? {bottom: 120, left: 110} : {top: 84, left: 110};

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          ...pos,
          display: 'flex',
          flexDirection: right ? 'row-reverse' : 'row',
          alignItems: 'stretch',
          gap: 24,
        }}
      >
        <div style={{width: 3, flexShrink: 0, position: 'relative'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              background: t.rule,
              boxShadow: '0 0 2px rgba(0,0,0,0.5), 0 1px 8px rgba(0,0,0,0.45)',
              transform: `scaleY(${ruleP * (1 - outRule)})`,
              transformOrigin: outRule > 0 ? 'center bottom' : 'center top',
            }}
          />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start', padding: '2px 0 4px'}}>
          <div
            style={{
              fontFamily: FONT_SANS,
              fontWeight: 800,
              fontSize: 18,
              lineHeight: 1,
              letterSpacing: `${lerp(0.42, 0.3, kick)}em`,
              marginRight: right ? '-0.3em' : 0,
              textTransform: 'uppercase',
              color: t.kicker,
              textShadow: KICK_SHADOW,
              whiteSpace: 'nowrap',
              opacity: kick * (1 - outText),
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: 34,
              lineHeight: 1.3,
              letterSpacing: '-0.005em',
              color: C.white,
              textShadow: BODY_SHADOW,
              maxWidth,
              textAlign: right ? 'right' : 'left',
              textWrap: 'balance',
              opacity: body * (1 - outText),
              transform: `translateY(${(1 - body) * 12 + outText * 6}px)`,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
