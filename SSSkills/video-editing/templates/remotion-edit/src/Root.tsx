import React from 'react';
import {Composition} from 'remotion';
import {Main, layout} from './engine/Main';
import {timeline} from './timeline';
import {CAPTIONS} from './captions';
import {FPS, H, W} from './theme';

export const RemotionRoot: React.FC = () => {
  const {total} = layout(timeline);
  return (
    <>
      <Composition id="Main" component={Main} durationInFrames={Math.max(total, 1)} fps={FPS} width={W} height={H} defaultProps={{timeline, showVoChips: true, captions: CAPTIONS, showSubs: true}} />
      <Composition id="Clean" component={Main} durationInFrames={Math.max(total, 1)} fps={FPS} width={W} height={H} defaultProps={{timeline, showVoChips: false, captions: CAPTIONS, showSubs: true}} />
    </>
  );
};
