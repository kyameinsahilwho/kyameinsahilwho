import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FPS, SHADOW, easeInOutCubic, easeOutCubic, easeOutExpo} from '../../theme';
import {CheckIcon, FullBackground, ScreenPosition, ScreenVariant, clamp01, prog, pushIn, scrimColor} from './ComposeMail';

export type PhoneNotificationProps = {
  dur: number;
  variant?: ScreenVariant;
  position?: ScreenPosition;
  time: string;
  date?: string;
  from: string;
  subject: string;
  preview?: string;
  notifyAt?: number;
  approveAt?: number;
  /** Optional status pill instead of an Approve button (e.g. files still pending). `at` = when it pops in. */
  status?: {text: string; tone?: 'alert' | 'warn'; at?: number};
  /** Overlay scrim opacity (solid black, clamped to <=0.3). Default 0.12. */
  scrim?: number;
};

const PW = 420;
const PH = 860;
const BEZEL = 12;
const NOTE_W = PW - BEZEL * 2 - 28;
const BTN_FULL = NOTE_W - 36;
const BTN_PILL = 214;

const WALLPAPER = '#121316'; // solid, neutral, dark
const FRAME = '#0B0B0C';
const FRAME_EDGE = '#3A3A3F';

const MailGlyph: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" style={{display: 'block'}}>
    <rect x={3} y={5.5} width={18} height={13} rx={2.5} fill="none" stroke="#fff" strokeWidth={2} />
    <path d="M3.8 7l8.2 6 8.2-6" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

const LockGlyph: React.FC = () => (
  <svg width={20} height={24} viewBox="0 0 22 26" style={{display: 'block'}}>
    <rect x={3} y={11} width={16} height={13} rx={3} fill="rgba(255,255,255,0.85)" />
    <path d="M6.5 11V7.5a4.5 4.5 0 0 1 9 0V11" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2.2} />
  </svg>
);

const StatusIcons: React.FC = () => (
  <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
    {/* signal */}
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 13}}>
      {[4, 7, 10, 13].map((h) => (
        <div key={h} style={{width: 3.5, height: h, background: '#fff', borderRadius: 1}} />
      ))}
    </div>
    {/* wifi */}
    <svg width={18} height={14} viewBox="0 0 18 14" style={{display: 'block', marginLeft: 3}}>
      <path d="M1.5 5a11 11 0 0 1 15 0M4.2 8a7 7 0 0 1 9.6 0" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <circle cx={9} cy={11.5} r={1.8} fill="#fff" />
    </svg>
    {/* battery */}
    <div style={{display: 'flex', alignItems: 'center', gap: 1.5, marginLeft: 3}}>
      <div style={{width: 26, height: 13, border: '1.5px solid rgba(255,255,255,0.55)', borderRadius: 4, padding: 1.5, boxSizing: 'border-box'}}>
        <div style={{width: '72%', height: '100%', background: '#fff', borderRadius: 1.5}} />
      </div>
      <div style={{width: 2, height: 4.5, background: 'rgba(255,255,255,0.55)', borderRadius: 1}} />
    </div>
  </div>
);

const RoundControl: React.FC<{side: 'left' | 'right'}> = ({side}) => (
  <div
    style={{
      position: 'absolute',
      bottom: 54,
      [side]: 40,
      width: 54,
      height: 54,
      borderRadius: 999,
      background: 'rgba(255,255,255,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {side === 'left' ? (
      // torch
      <svg width={18} height={24} viewBox="0 0 18 24">
        <path d="M3 2h12v4l-3 4v12H6V10L3 6z" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.7} strokeLinejoin="round" />
      </svg>
    ) : (
      // camera
      <svg width={24} height={20} viewBox="0 0 24 20">
        <path d="M2 6h5l2-3h6l2 3h5v12H2z" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.7} strokeLinejoin="round" />
        <circle cx={12} cy={11.5} r={3.6} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.7} />
      </svg>
    )}
  </div>
);

export const PhoneNotification: React.FC<PhoneNotificationProps> = ({
  dur,
  variant = 'overlay',
  position = 'right',
  time,
  date = 'Thursday, 14 November',
  from,
  subject,
  preview,
  notifyAt = 0.6,
  approveAt,
  status,
  scrim = 0.12,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const full = variant === 'full';

  /* ---- phone entrance / exit ---- */
  const inP = easeOutExpo(prog(t, 0, 0.6));
  const fade = easeOutCubic(prog(t, 0, 0.4));
  const outP = easeInOutCubic(prog(t, dur - 0.35, 0.35));
  const fromSide = full || position === 'center' ? 0 : position === 'left' ? -1 : 1;
  const slideX = fromSide * 140 * (1 - inP);
  const rise = 24 * (1 - inP) + 12 * outP;
  const scaleIn = 0.97 + 0.03 * inP;
  const phoneScale = scaleIn * (1 - 0.02 * outP) * (full ? 1.1 * pushIn(t, dur) : 1);
  const phoneOpacity = fade * (1 - outP);

  const left = full || position === 'center' ? (1920 - PW) / 2 : position === 'left' ? 150 : 1350;
  const top = (1080 - PH) / 2;

  /* ---- notification ---- */
  const nP = easeOutExpo(prog(t, notifyAt, 0.6));
  const nFade = easeOutCubic(prog(t, notifyAt, 0.3));
  const wake = easeOutCubic(prog(t, notifyAt - 0.05, 0.3));

  /* ---- approve ---- */
  const hasApprove = approveAt !== undefined;
  const at = approveAt ?? 0;
  const tapDotIn = hasApprove ? easeOutCubic(prog(t, at - 0.4, 0.25)) * (1 - easeOutCubic(prog(t, at + 0.12, 0.3))) : 0;
  const tapPress = hasApprove ? Math.sin(Math.PI * prog(t, at - 0.06, 0.2)) : 0;
  const ripple = hasApprove ? easeOutCubic(prog(t, at, 0.55)) : 0;
  const morph = hasApprove ? easeInOutCubic(prog(t, at + 0.14, 0.38)) : 0;
  const btnW = BTN_FULL + (BTN_PILL - BTN_FULL) * morph;
  const btnBg = interpolateColors(morph, [0, 1], ['rgba(47,111,235,0.12)', C.uiBlue]);
  const pillPop = hasApprove ? 1 + 0.06 * Math.sin(Math.PI * prog(t, at + 0.4, 0.3)) : 1;

  const scrimOp = full ? 0 : scrim * easeOutCubic(prog(t, 0, 0.4)) * (1 - outP);

  return (
    <AbsoluteFill style={{fontFamily: FONT_SANS}}>
      {full ? <FullBackground /> : <AbsoluteFill style={{background: scrimColor(scrimOp)}} />}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: PW,
          height: PH,
          transform: `translate(${slideX}px, ${rise}px) scale(${phoneScale})`,
          opacity: phoneOpacity,
        }}
      >
        {/* side buttons */}
        <div style={{position: 'absolute', left: -3, top: 170, width: 4, height: 34, background: '#2A2A2E', borderRadius: 2}} />
        <div style={{position: 'absolute', left: -3, top: 222, width: 4, height: 62, background: '#2A2A2E', borderRadius: 2}} />
        <div style={{position: 'absolute', left: -3, top: 296, width: 4, height: 62, background: '#2A2A2E', borderRadius: 2}} />
        <div style={{position: 'absolute', right: -3, top: 250, width: 4, height: 96, background: '#2A2A2E', borderRadius: 2}} />
        {/* frame + bezel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 64,
            background: FRAME,
            padding: BEZEL,
            boxSizing: 'border-box',
            boxShadow: `${SHADOW.card}, inset 0 0 0 1.5px ${FRAME_EDGE}, inset 0 0 0 4px #000`,
          }}
        >
          {/* screen */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: 52,
              overflow: 'hidden',
              background: WALLPAPER,
              filter: `brightness(${0.72 + 0.28 * wake})`,
            }}
          >
            {/* dynamic island */}
            <div
              style={{
                position: 'absolute',
                top: 13,
                left: '50%',
                width: 112,
                height: 32,
                marginLeft: -56,
                borderRadius: 999,
                background: '#000',
              }}
            />
            {/* status bar */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: 36,
                right: 30,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <StatusIcons />
            </div>

            {/* lock + date + clock */}
            <div style={{position: 'absolute', top: 76, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <LockGlyph />
              <div style={{marginTop: 14, color: 'rgba(255,255,255,0.82)', fontSize: 20, fontWeight: 500, letterSpacing: '0.005em'}}>{date}</div>
              <div
                style={{
                  marginTop: -2,
                  color: 'rgba(255,255,255,0.96)',
                  fontSize: 116,
                  fontWeight: 600,
                  letterSpacing: '-0.045em',
                  lineHeight: 1.05,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {time}
              </div>
            </div>

            {/* notification */}
            <div
              style={{
                position: 'absolute',
                top: 330,
                left: 14,
                width: NOTE_W,
                boxSizing: 'border-box',
                transform: `translateY(${-70 * (1 - nP)}px) scale(${0.96 + 0.04 * nP})`,
                opacity: nFade,
                background: 'rgba(244,244,242,0.97)',
                borderRadius: 24,
                padding: '16px 18px 18px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: C.uiBlue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MailGlyph />
                </div>
                <div style={{fontSize: 15, fontWeight: 600, color: C.textDim, flex: 1}}>Mail</div>
                <div style={{fontSize: 14, color: C.textDim}}>now</div>
              </div>
              <div style={{marginTop: 12, fontSize: 19, fontWeight: 700, color: C.text, letterSpacing: '-0.005em'}}>{from}</div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 17,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {subject}
              </div>
              {preview ? (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 16,
                    color: '#5E5E64',
                    lineHeight: 1.38,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {preview}
                </div>
              ) : null}

              {status && !hasApprove ? (
                <div style={{marginTop: 14, display: 'flex', justifyContent: 'flex-start'}}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: status.tone === 'alert' ? 'rgba(224,72,62,0.12)' : 'rgba(226,169,59,0.16)',
                      color: status.tone === 'alert' ? C.alert : '#A8740F',
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: '0.01em',
                      opacity: easeOutCubic(prog(t, status.at ?? 0, 0.35)),
                      transform: `translateY(${6 * (1 - easeOutCubic(prog(t, status.at ?? 0, 0.35)))}px)`,
                    }}
                  >
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: status.tone === 'alert' ? C.alert : C.accent,
                        opacity: 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 1.4)),
                      }}
                    />
                    {status.text}
                  </div>
                </div>
              ) : null}
              {hasApprove ? (
                <div style={{position: 'relative', marginTop: 16, height: 48, display: 'flex', justifyContent: 'center'}}>
                  <div
                    style={{
                      position: 'relative',
                      width: btnW,
                      height: 48,
                      borderRadius: 12 + 12 * morph,
                      background: btnBg,
                      overflow: 'hidden',
                      transform: `scale(${(1 - 0.05 * tapPress) * pillPop})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* ripple */}
                    {ripple > 0 && ripple < 1 ? (
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: 360,
                          height: 360,
                          marginLeft: -180,
                          marginTop: -180,
                          borderRadius: 999,
                          background: C.uiBlue,
                          transform: `scale(${ripple})`,
                          opacity: 0.35 * (1 - ripple),
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        position: 'absolute',
                        fontSize: 18,
                        fontWeight: 600,
                        color: C.uiBlue,
                        opacity: clamp01(1 - morph * 2),
                      }}
                    >
                      Approve
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        opacity: clamp01(morph * 2 - 1),
                      }}
                    >
                      <CheckIcon size={20} stroke={3} />
                      Approved
                    </div>
                  </div>
                  {/* fingertip */}
                  {tapDotIn > 0 ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 54,
                        height: 54,
                        marginLeft: -27,
                        marginTop: -27,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.4)',
                        border: '2px solid rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                        opacity: tapDotIn,
                        transform: `scale(${1.15 - 0.25 * tapPress})`,
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* bottom lock-screen controls */}
            <RoundControl side="left" />
            <RoundControl side="right" />
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                width: 136,
                height: 5,
                marginLeft: -68,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.8)',
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
