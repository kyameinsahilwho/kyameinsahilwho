import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_DISPLAY, FONT_SANS, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {lerp, prog} from './cine';

export type TitleCardProps = {
  dur: number;
  title: string;
  subtitle?: string;
  /** Optional: faint 60-tick clock ring behind the title (thin, low-opacity white). Default false. */
  ring?: boolean;
};

/**
 * Main title on solid black: the title fades in while its tracking settles from wide to tight, under a slow
 * push-in. A thin amber rule draws out beneath it, then the subtitle arrives in small tracked Inter.
 */
export const TitleCard: React.FC<TitleCardProps> = ({dur, title, subtitle, ring = false}) => {
  const frame = useCurrentFrame();
  const out = easeInOutCubic(prog(frame, dur - 0.4, 0.4));

  const titleP = easeOutCubic(prog(frame, 0.1, 1.5));
  const titleO = easeOutCubic(prog(frame, 0.1, 0.9));
  const blur = lerp(10, 0, easeOutExpo(prog(frame, 0.1, 1.0)));
  const rule = easeOutExpo(prog(frame, 0.75, 0.8));
  const subP = easeOutCubic(prog(frame, 1.0, 0.7));
  const ringP = easeOutCubic(prog(frame, 0.3, 1.2));
  const push = 1 + 0.03 * easeInOutCubic(prog(frame, 0, dur));

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${push})`}}>
        {ring ? (
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: 0.5 * ringP}}>
            {Array.from({length: 60}, (_, i) => {
              const major = i % 5 === 0;
              const a = (i / 60) * Math.PI * 2 + (frame / 30) * 0.004;
              const R = 470;
              const r1 = R - (major ? 22 : 10);
              return (
                <line
                  key={i}
                  x1={960 + Math.sin(a) * r1}
                  y1={540 - Math.cos(a) * r1}
                  x2={960 + Math.sin(a) * R}
                  y2={540 - Math.cos(a) * R}
                  stroke="#FFFFFF"
                  strokeOpacity={major ? 0.16 : 0.08}
                  strokeWidth={major ? 2 : 1}
                />
              );
            })}
          </svg>
        ) : null}
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 400,
              fontSize: 220,
              lineHeight: 1,
              color: C.white,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              letterSpacing: `${lerp(0.3, 0.06, titleP)}em`,
              marginRight: `-${lerp(0.3, 0.06, titleP)}em`, // keep optically centred (trailing tracking)
              opacity: titleO,
              filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
              marginTop: subtitle ? 20 : 0,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 14,
              width: 140,
              height: 2,
              background: C.accent,
              transform: `scaleX(${rule})`,
            }}
          />
          {subtitle ? (
            <div
              style={{
                marginTop: 34,
                fontFamily: FONT_SANS,
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: `${lerp(0.42, 0.32, subP)}em`,
                marginRight: '-0.32em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                whiteSpace: 'nowrap',
                opacity: subP,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
