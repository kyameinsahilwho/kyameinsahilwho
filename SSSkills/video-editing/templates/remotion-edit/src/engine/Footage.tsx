import React from 'react';
import {AbsoluteFill, Audio, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ENHANCED} from './enhanced';
import {FPS, GRADES} from '../theme';
import {ClipRef, GradeName} from './types';

export const proxy = (stem: string) => staticFile(`proxies/${stem}.mp4`);

// 1-frame (33ms) audio ramps at every boundary => no pops at cuts.
export const rampVolume = (len: number, vol: number) => (f: number) =>
  len < 3 ? vol : vol * interpolate(f, [0, 1, len - 1, len], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const Footage: React.FC<{
  clip: ClipRef;
  durFrames: number;
  grade?: GradeName;
  muted?: boolean;
  freezeLastFrames?: number;
}> = ({clip, durFrames, grade = 'none', muted, freezeLastFrames = 0}) => {
  const frame = useCurrentFrame();
  const zoom = clip.zoom ?? 1;
  const drift = clip.driftZoom ?? 0;
  const p = durFrames > 1 ? frame / (durFrames - 1) : 0;
  const scale = zoom * (1 + drift * p);
  const fx = (clip.focusX ?? 0.5) * 100;
  const fy = (clip.focusY ?? 0.5) * 100;
  const playFrames = Math.max(1, durFrames - freezeLastFrames);
  const rate = clip.rate ?? 1;
  const vol = muted || clip.mute || clip.freeze ? 0 : clip.volume ?? 1;
  // Dialogue comes from the cleaned track (public/enh/<stem>.wav) when one exists.
  const aStem = clip.audioSrc ?? clip.src;
  const useEnh = vol > 0 && !clip.rawAudio && ENHANCED.includes(aStem);
  const videoVol = useEnh ? 0 : vol;

  const video = (
    <OffthreadVideo
      src={proxy(clip.src)}
      trimBefore={Math.round(clip.from * FPS)}
      playbackRate={rate}
      volume={rampVolume(playFrames, videoVol)}
      muted={videoVol === 0}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: `${fx}% ${fy}%`,
        transform: `scale(${scale})`,
        transformOrigin: `${fx}% ${fy}%`,
        filter: GRADES[grade] ?? 'none',
      }}
    />
  );

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      {clip.freeze ? (
        <Freeze frame={0}>{video}</Freeze>
      ) : freezeLastFrames > 0 && frame >= playFrames ? (
        <Freeze frame={playFrames - 1}>{video}</Freeze>
      ) : (
        video
      )}
      {useEnh ? (
        <Sequence durationInFrames={playFrames}>
          <Audio
            src={staticFile(`enh/${aStem}.wav`)}
            trimBefore={Math.round(clip.from * FPS)}
            playbackRate={rate}
            volume={rampVolume(playFrames, vol)}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
