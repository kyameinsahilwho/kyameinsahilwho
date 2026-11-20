// Shared motion + type helpers for the cinematic card set. No gradients, no panels: shadow only.
import React from 'react';
import {FPS, SHADOW} from '../../theme';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Linear 0..1 progress of a window that starts at `startS` and lasts `lenS` seconds. */
export const prog = (frame: number, startS: number, lenS: number) => clamp01((frame - startS * FPS) / (Math.max(lenS, 1 / FPS) * FPS));
/** Accelerating ease for exits (things fall back into their mask). */
export const easeInCubic = (t: number) => Math.pow(clamp01(t), 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Drop-shadow filter equivalents of SHADOW.hero / SHADOW.text. Used on the WRAPPER of masked (clipped) type, so
 * the shadow follows the visible glyphs instead of being cut off at the mask edge.
 */
export const DS = {
  hero: 'drop-shadow(0 2px 2px rgba(0,0,0,0.45)) drop-shadow(0 6px 14px rgba(0,0,0,0.32)) drop-shadow(0 14px 36px rgba(0,0,0,0.26))',
  text: 'drop-shadow(0 1px 2px rgba(0,0,0,0.55)) drop-shadow(0 4px 12px rgba(0,0,0,0.38))',
};

/** Small tracked kickers on bright footage need a tighter dark halo than SHADOW.text alone. */
export const KICK_SHADOW =
  '0 0 1px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.55), 0 1px 5px rgba(0,0,0,0.6), 0 4px 18px rgba(0,0,0,0.55)';
/** Body copy on footage: SHADOW.text plus a tight halo so white Inter holds on bright skies/pavement. */
export const BODY_SHADOW = `0 0 2px rgba(0,0,0,0.5), ${SHADOW.text}, 0 8px 28px rgba(0,0,0,0.3)`;

/**
 * Mask-line reveal: children slide up from below an invisible horizontal line (bottom edge of this box) and,
 * on exit, slide back down into it. `inP`/`outP` are eased 0..1. Only the bottom edge clips.
 */
export const MaskUp: React.FC<{
  inP: number;
  outP?: number;
  /** distance travelled, in em of the current font size (or px when a number > 3) */
  travel?: number;
  /** extra px below the box that stays visible (e.g. to keep descenders) */
  bleed?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({inP, outP = 0, travel = 1.05, bleed = 0, style, children}) => {
  const d = travel > 3 ? `${travel}px` : `${travel}em`;
  const y = (1 - inP) + outP; // 1 = fully below the line, 0 = resting
  return (
    <span style={{display: 'inline-block', clipPath: `inset(-2em -2em ${-bleed}px -2em)`, verticalAlign: 'top', lineHeight: 1, ...style}}>
      <span style={{display: 'inline-block', verticalAlign: 'top', transform: `translateY(calc(${y} * ${d}))`}}>{children}</span>
    </span>
  );
};
