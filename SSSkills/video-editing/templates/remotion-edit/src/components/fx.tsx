import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeInOutCubic, FPS} from '../theme';

// Cinematic 2.39:1 letterbox bars that ease in/out.
export const Letterbox: React.FC<{dur: number; inSec?: number; outSec?: number; fadeToBlack?: number}> = ({dur, inSec = 1.2, outSec = 0, fadeToBlack = 0}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const pin = easeInOutCubic(t / inSec);
  const pout = outSec > 0 ? easeInOutCubic((dur - t) / outSec) : 1;
  const bar = 138 * Math.min(pin, pout); // 1080 - 1920/2.39 ≈ 277 => 138 each
  const black = fadeToBlack > 0 ? Math.min(1, Math.max(0, (t - (dur - fadeToBlack)) / fadeToBlack)) : 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000'}} />
      <AbsoluteFill style={{background: '#000', opacity: easeInOutCubic(black)}} />
    </AbsoluteFill>
  );
};
