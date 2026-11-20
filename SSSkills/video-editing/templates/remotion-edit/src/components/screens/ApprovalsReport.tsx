import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FPS, easeOutCubic, easeOutExpo} from '../../theme';
import {CARD_SHADOW, CheckIcon, ScreenPosition, ScreenStage, ScreenVariant, UI, WindowHeader, clamp01, easeOutBack, prog} from './ComposeMail';

export type ApprovalsRow = {file: string; status: string; zonal?: string};

export type ApprovalsReportProps = {
  dur: number;
  variant?: ScreenVariant;
  position?: ScreenPosition;
  title?: string;
  rows: ApprovalsRow[];
  rowStagger?: number;
  firstRowAt?: number;
  stampAt?: number;
  /** Overlay scrim opacity (solid black, clamped to <=0.3). Default 0.18. */
  scrim?: number;
};

const BASE_W = 1100;
const PAD_X = 44;
const COLS = '290px 1fr 260px';
const ROW_H = 84;

export const ApprovalsReport: React.FC<ApprovalsReportProps> = ({
  dur,
  variant = 'overlay',
  position = 'center',
  title = 'Approvals report · Rajasthan CV',
  rows,
  rowStagger = 0.9,
  firstRowAt = 0.5,
  stampAt,
  scrim,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const overlayW = position === 'center' ? 1000 : 880;

  const card = (
    <div style={{background: C.paper, borderRadius: UI.radius, overflow: 'hidden', boxShadow: CARD_SHADOW, fontFamily: FONT_SANS}}>
      <WindowHeader
        title={title}
        padX={PAD_X}
        right={
          <div style={{fontSize: 17, fontWeight: 500, color: C.textDim, paddingRight: 8, fontVariantNumeric: 'tabular-nums'}}>
            {rows.length} {rows.length === 1 ? 'file' : 'files'}
          </div>
        }
      />

      {/* column labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          alignItems: 'center',
          height: 54,
          padding: `0 ${PAD_X}px`,
          borderBottom: UI.hairline,
        }}
      >
        <div style={UI.colLabel}>File</div>
        <div style={UI.colLabel}>Status</div>
        <div style={UI.colLabel}>Zonal desk</div>
      </div>

      <div style={{minHeight: 3 * ROW_H}}>
        {rows.map((r, i) => {
          const at = firstRowAt + i * rowStagger;
          const p = easeOutExpo(prog(t, at, 0.55));
          // "being read" highlight: flashes in with the row, then settles.
          const read = Math.sin(Math.PI * prog(t, at, 0.9));
          const st = stampAt !== undefined ? stampAt + i * 0.15 : Infinity;
          const sp = prog(t, st, 0.3);
          const stamped = t >= st;
          const flash = stamped ? Math.sin(Math.PI * prog(t, st, 0.6)) : 0;
          const approved = /^approved/i.test(r.status);
          const m = r.status.match(/^(approved)\s+(.*)$/i);
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                alignItems: 'center',
                height: ROW_H,
                padding: `0 ${PAD_X}px`,
                borderBottom: i < rows.length - 1 ? UI.hairline : undefined,
                background: flash > 0.001 ? `rgba(224,72,62,${0.07 * flash})` : `rgba(47,111,235,${0.07 * read})`,
                opacity: p,
                transform: `translateX(${24 * (1 - p)}px)`,
              }}
            >
              <div style={{fontSize: 25, fontWeight: 600, color: C.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                {r.file}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, minWidth: 0}}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: approved ? C.uiBlue : C.line,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {approved ? <CheckIcon size={16} stroke={3.4} /> : null}
                </div>
                <div style={{fontSize: 22, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums'}}>
                  {m ? (
                    <>
                      <span style={{fontWeight: 500}}>{m[1]}</span> <span style={{color: C.textDim}}>{m[2]}</span>
                    </>
                  ) : (
                    r.status
                  )}
                </div>
              </div>
              <div style={{position: 'relative', height: 44, display: 'flex', alignItems: 'center'}}>
                <div style={{fontSize: 22, color: C.textDim, opacity: 1 - easeOutCubic(sp * 2)}}>{r.zonal ?? '—'}</div>
                {stamped ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      marginTop: -21,
                      height: 42,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 16px',
                      border: `2.5px solid ${C.alert}`,
                      borderRadius: 7,
                      background: 'rgba(224,72,62,0.06)',
                      color: C.alert,
                      fontSize: 18,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      transform: `rotate(${-6 + 2 * easeOutCubic(sp)}deg) scale(${1.8 - 0.8 * easeOutBack(sp, 1.6)})`,
                      transformOrigin: '30% 50%',
                      opacity: clamp01(sp * 2.5),
                    }}
                  >
                    Skipped
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <ScreenStage dur={dur} variant={variant} position={position} baseWidth={BASE_W} overlayWidth={overlayW} fullWidth={1280} scrim={scrim}>
      {card}
    </ScreenStage>
  );
};
