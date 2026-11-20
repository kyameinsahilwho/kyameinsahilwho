import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {DS, KICK_SHADOW, MaskUp, lerp, prog} from './cine';

export type SceneCardProps = {
  dur: number;
  text: string;
  sub?: string;
  mode?: 'full' | 'overlay' | 'top';
  /** Optional, overlay mode: opacity of the solid full-frame darkening (0..0.25, default 0.2). */
  dim?: number;
};

/**
 * Time-jump / caption card.
 * 'full'    = solid black, Bebas line with tracking settle, amber rule, small Inter sub.
 * 'overlay' = Bebas words rising out of a mask over footage (shadow only, faint solid darkening).
 * 'top'     = small Bebas caption top-centre with shadow.
 */
export const SceneCard: React.FC<SceneCardProps> = ({dur, text, sub, mode = 'overlay', dim = 0.2}) => {
  const frame = useCurrentFrame();
  const exitAt = Math.max(0.9, dur - 0.4);
  const out = easeInOutCubic(prog(frame, exitAt, 0.4));

  if (mode === 'full') {
    const p = easeOutCubic(prog(frame, 0.05, 1.3));
    const o = easeOutCubic(prog(frame, 0.05, 0.8));
    const blur = lerp(8, 0, easeOutExpo(prog(frame, 0.05, 0.9)));
    const rule = easeOutExpo(prog(frame, 0.45, 0.7));
    const subP = easeOutCubic(prog(frame, 0.7, 0.6));
    const ls = lerp(0.25, 0.05, p);
    return (
      <AbsoluteFill style={{background: C.ink}}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 1 - out}}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 400,
              fontSize: 120,
              lineHeight: 1,
              color: C.white,
              textTransform: 'uppercase',
              textAlign: 'center',
              maxWidth: 1640,
              letterSpacing: `${ls}em`,
              marginRight: `-${ls}em`,
              opacity: o,
              filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
              marginTop: sub ? 52 : 24,
            }}
          >
            {text}
          </div>
          <div style={{marginTop: 22, width: 90, height: 2, background: C.accent, transform: `scaleX(${rule})`}} />
          {sub ? (
            <div
              style={{
                marginTop: 26,
                fontFamily: FONT_SANS,
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: `${lerp(0.4, 0.3, subP)}em`,
                marginRight: '-0.3em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                whiteSpace: 'nowrap',
                opacity: subP,
              }}
            >
              {sub}
            </div>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (mode === 'top') {
    const inP = easeOutExpo(prog(frame, 0, 0.8));
    const settle = easeOutCubic(prog(frame, 0, 1.2));
    const subP = easeOutCubic(prog(frame, 0.35, 0.6));
    const ls = lerp(0.2, 0.08, settle);
    return (
      <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 64, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{filter: DS.hero}}>
            <MaskUp inP={inP} outP={out} style={{height: '0.84em', fontSize: 54}}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 400,
                  fontSize: 54,
                  lineHeight: 1,
                  color: C.white,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  letterSpacing: `${ls}em`,
                  marginRight: `-${ls}em`,
                }}
              >
                {text}
              </div>
            </MaskUp>
          </div>
          {sub ? (
            <div
              style={{
                marginTop: 12,
                fontFamily: FONT_SANS,
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: '0.3em',
                marginRight: '-0.3em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.88)',
                textShadow: KICK_SHADOW,
                whiteSpace: 'nowrap',
                opacity: subP * (1 - out),
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  }

  // overlay
  const dimP = easeOutCubic(prog(frame, 0, 0.6));
  const words = text.split(' ');
  const PER = 0.07;
  const wordsDone = 0.15 + words.length * PER + 0.3;
  const subP = easeOutCubic(prog(frame, wordsDone, 0.6));
  const settle = easeOutCubic(prog(frame, 0.1, 1.4));
  const ls = lerp(0.1, 0.04, settle);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: '#000', opacity: Math.min(0.25, Math.max(0, dim)) * dimP * (1 - out)}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <div style={{filter: DS.hero, maxWidth: 1640, textAlign: 'center', marginTop: sub ? 20 : 0}}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 400,
              fontSize: 96,
              color: C.white,
              textTransform: 'uppercase',
              letterSpacing: `${ls}em`,
              lineHeight: 1.04,
              textWrap: 'balance',
            }}
          >
            {words.map((w, i) => {
              const p = easeOutExpo(prog(frame, 0.15 + i * PER, 0.8));
              const o = easeInOutCubic(prog(frame, exitAt + i * 0.02, 0.35));
              return (
                <React.Fragment key={i}>
                  <MaskUp inP={p} outP={o} style={{height: '0.84em'}}>
                    <span style={{display: 'inline-block', marginRight: `-${ls}em`}}>{w}</span>
                  </MaskUp>
                  {i < words.length - 1 ? ' ' : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        {sub ? (
          <div
            style={{
              marginTop: 26,
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: '0.24em',
              marginRight: '-0.24em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.92)',
              textShadow: KICK_SHADOW,
              whiteSpace: 'nowrap',
              opacity: subP * (1 - out),
              transform: `translateY(${(1 - subP) * 10}px)`,
            }}
          >
            {sub}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
