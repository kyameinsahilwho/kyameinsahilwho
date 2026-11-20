import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FPS, easeInOutCubic, easeOutExpo} from '../../theme';
import {Avatar, CARD_SHADOW, ScreenPosition, ScreenStage, ScreenVariant, UI, WindowHeader, initialsOf, prog} from './ComposeMail';

export type InboxRow = {
  who: string;
  subject: string;
  meta?: string;
  status?: string;
  statusTone?: 'alert' | 'ok' | 'dim';
};

export type InboxProps = {
  dur: number;
  variant?: ScreenVariant;
  position?: ScreenPosition;
  title?: string;
  rows: InboxRow[];
  refreshAt?: number[];
  highlightRow?: number;
  /** Overlay scrim opacity (solid black, clamped to <=0.3). Default 0.18. */
  scrim?: number;
};

const BASE_W = 1100;
const PAD_X = 40;
const REFRESH_LEN = 0.6;
const SIDEBAR_W = 230;

const toneColor = (tone?: InboxRow['statusTone']) =>
  tone === 'ok' ? C.uiBlue : tone === 'dim' || !tone ? C.textDim : C.alert;

const RefreshIcon: React.FC<{angle: number; active: boolean}> = ({angle, active}) => (
  <svg width={26} height={26} viewBox="0 0 24 24" style={{display: 'block', transform: `rotate(${angle}deg)`}}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" stroke={active ? C.uiBlue : C.textDim} strokeWidth={2} strokeLinecap="round" />
    <path d="M20 3.5v5h-5" fill="none" stroke={active ? C.uiBlue : C.textDim} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg width={19} height={19} viewBox="0 0 24 24" style={{display: 'block'}}>
    <circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke={C.textDim} strokeWidth={2} />
    <path d="M15.5 15.5L21 21" stroke={C.textDim} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const FOLDERS = ['Inbox', 'Starred', 'Sent', 'Drafts', 'Archive'];

export const Inbox: React.FC<InboxProps> = ({
  dur,
  variant = 'overlay',
  position = 'center',
  title = 'Sent',
  rows,
  refreshAt = [],
  highlightRow,
  scrim,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // Active refresh window (if any).
  const activeRefresh = refreshAt.find((r) => t >= r && t < r + REFRESH_LEN);
  const rp = activeRefresh !== undefined ? prog(t, activeRefresh, REFRESH_LEN) : 0;
  const spins = refreshAt.filter((r) => t >= r + REFRESH_LEN).length;
  const angle = 360 * (spins + (activeRefresh !== undefined ? easeInOutCubic(rp) : 0));
  const flicker = activeRefresh !== undefined ? 1 - 0.5 * Math.abs(Math.sin(2 * Math.PI * rp)) : 1;
  // Status gives a tiny nudge right after each refresh completes ("still nothing").
  const lastDone = [...refreshAt].reverse().find((r) => t >= r + REFRESH_LEN);
  const nudge = lastDone !== undefined ? Math.sin(Math.PI * easeInOutCubic(prog(t, lastDone + REFRESH_LEN, 0.4))) : 0;

  const overlayW = position === 'center' ? 1000 : 880;
  const activeFolder = FOLDERS.findIndex((f) => f.toLowerCase() === title.toLowerCase());

  const card = (
    <div style={{background: C.paper, borderRadius: UI.radius, overflow: 'hidden', boxShadow: CARD_SHADOW, fontFamily: FONT_SANS}}>
      <WindowHeader
        title={
          <span style={{display: 'inline-flex', alignItems: 'baseline', gap: 12}}>
            <span style={{color: C.textDim, fontWeight: 500}}>Mail</span>
            <span style={{color: '#C4C4C0', fontWeight: 400}}>/</span>
            <span>{title}</span>
          </span>
        }
        padX={PAD_X}
        right={<RefreshIcon angle={angle} active={activeRefresh !== undefined} />}
      >
        {/* indeterminate progress bar during refresh */}
        {activeRefresh !== undefined ? (
          <div
            style={{
              position: 'absolute',
              left: `${-30 + 130 * easeInOutCubic(rp)}%`,
              bottom: -1,
              width: '30%',
              height: 3,
              background: C.uiBlue,
              borderRadius: 2,
            }}
          />
        ) : null}
      </WindowHeader>

      <div style={{display: 'flex'}}>
        {/* folder rail */}
        <div style={{width: SIDEBAR_W, flexShrink: 0, borderRight: UI.hairline, padding: '22px 14px', boxSizing: 'border-box', background: '#FBFBFA'}}>
          {FOLDERS.map((f, i) => {
            const on = i === activeFolder;
            return (
              <div
                key={f}
                style={{
                  height: 46,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  borderRadius: 10,
                  fontSize: 19,
                  fontWeight: on ? 600 : 500,
                  color: on ? C.text : C.textDim,
                  background: on ? '#EDEDEA' : undefined,
                  marginBottom: 2,
                }}
              >
                {f}
              </div>
            );
          })}
        </div>

        <div style={{flex: 1, minWidth: 0}}>
          {/* toolbar */}
          <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: `18px ${PAD_X - 10}px 18px ${PAD_X - 10}px`, borderBottom: UI.hairline}}>
            <div
              style={{
                flex: 1,
                height: 46,
                borderRadius: 10,
                background: '#F2F2F0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 16px',
                color: C.textDim,
                fontSize: 18,
              }}
            >
              <SearchIcon />
              Search mail
            </div>
            <div style={{fontSize: 16, color: C.textDim, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>
              {rows.length ? `1–${rows.length} of ${rows.length}` : '0 of 0'}
            </div>
          </div>

          {/* rows */}
          <div style={{minHeight: 290, opacity: flicker}}>
            {rows.map((r, i) => {
              const start = 0.35 + i * 0.12;
              const p = easeOutExpo(prog(t, start, 0.55));
              const hl = highlightRow === i ? easeOutExpo(prog(t, start + 0.45, 0.5)) : 0;
              const tone = toneColor(r.statusTone);
              return (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: `20px ${PAD_X - 10}px`,
                    borderBottom: UI.hairline,
                    background: `rgba(47,111,235,${0.06 * hl})`,
                    opacity: p,
                    transform: `translateX(${24 * (1 - p)}px)`,
                  }}
                >
                  <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: C.uiBlue, opacity: hl}} />
                  <Avatar text={initialsOf(r.who)} size={48} />
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 21,
                          fontWeight: 600,
                          color: C.text,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {r.who}
                      </div>
                      {r.meta ? (
                        <div style={{fontSize: 16, color: C.textDim, whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums'}}>{r.meta}</div>
                      ) : null}
                    </div>
                    <div style={{marginTop: 4, fontSize: 20, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {r.subject}
                    </div>
                    {r.status ? (
                      <div
                        style={{
                          marginTop: 10,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 9,
                          fontSize: 16,
                          fontWeight: 600,
                          color: tone,
                          padding: '5px 12px 5px 10px',
                          borderRadius: 999,
                          border: `1.5px solid ${tone}`,
                          transformOrigin: '0% 50%',
                          transform: `scale(${1 + 0.06 * nudge})`,
                        }}
                      >
                        <span style={{width: 8, height: 8, borderRadius: 999, background: tone, display: 'inline-block'}} />
                        {r.status}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ScreenStage dur={dur} variant={variant} position={position} baseWidth={BASE_W} overlayWidth={overlayW} fullWidth={1280} scrim={scrim}>
      {card}
    </ScreenStage>
  );
};
