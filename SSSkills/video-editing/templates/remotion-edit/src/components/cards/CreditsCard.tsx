import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {MaskUp, prog} from './cine';

export type CreditsCardProps = {
  dur: number;
  lines: string[];
  cast: {name: string; role: string}[];
  footer?: string;
  /** Optional: small heading above the cast (default "Cast"). */
  castTitle?: string;
};

const fadeUp = (p: number, dist = 10): React.CSSProperties => ({opacity: p, transform: `translateY(${(1 - p) * dist}px)`});

/** Final credit card on solid black: cast names in Bebas with Inter roles, then the disclaimer and footer. Staggered. */
export const CreditsCard: React.FC<CreditsCardProps> = ({
  dur,
  lines,
  cast,
  footer = 'Thriving at Office Politics · GIM Goa',
  castTitle = 'Cast',
}) => {
  const frame = useCurrentFrame();
  const out = easeInOutCubic(prog(frame, Math.max(1, dur - 0.4), 0.4));
  const rule = easeOutExpo(prog(frame, 0.1, 0.7));
  const head = easeOutCubic(prog(frame, 0.25, 0.6));

  const castStart = 0.45;
  const PER = 0.18;
  const castEnd = castStart + cast.length * PER;
  const sepAt = castEnd + 0.25;
  const linesStart = sepAt + 0.2;
  const footerStart = linesStart + lines.length * 0.18 + 0.3;
  const cols = Math.min(4, Math.max(1, cast.length));

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 220, paddingRight: 220, opacity: 1 - out}}>
        <div style={{width: 72, height: 2, background: C.accent, transform: `scaleX(${rule})`, transformOrigin: 'left center'}} />
        <div
          style={{
            marginTop: 24,
            fontFamily: FONT_SANS,
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: C.accent,
            opacity: head,
          }}
        >
          {castTitle}
        </div>
        <div
          style={{
            marginTop: 36,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            columnGap: 56,
            rowGap: 44,
            maxWidth: 1480,
          }}
        >
          {cast.map((c, i) => {
            const p = easeOutExpo(prog(frame, castStart + i * PER, 0.8));
            const rp = easeOutCubic(prog(frame, castStart + i * PER + 0.25, 0.6));
            return (
              <div key={i}>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 400,
                    fontSize: 72,
                    lineHeight: 1,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: C.white,
                    whiteSpace: 'nowrap',
                    marginLeft: -72 * 0.02,
                  }}
                >
                  <MaskUp inP={p} style={{height: '0.84em'}}>
                    {c.name}
                  </MaskUp>
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    fontSize: 15,
                    lineHeight: 1.5,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.58)',
                    ...fadeUp(rp, 6),
                  }}
                >
                  {c.role}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 72,
            maxWidth: 1480,
            height: 1,
            background: 'rgba(255,255,255,0.14)',
            transform: `scaleX(${easeOutExpo(prog(frame, sepAt, 0.9))})`,
            transformOrigin: 'left center',
          }}
        />
        <div style={{marginTop: 36, maxWidth: 1480}}>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                fontFamily: FONT_SANS,
                fontWeight: 400,
                fontSize: 24,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.66)',
                ...fadeUp(easeOutCubic(prog(frame, linesStart + i * 0.18, 0.6))),
              }}
            >
              {l}
            </div>
          ))}
        </div>
        {footer ? (
          <div
            style={{
              marginTop: 40,
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: C.accent,
              ...fadeUp(easeOutCubic(prog(frame, footerStart, 0.6))),
            }}
          >
            {footer}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
