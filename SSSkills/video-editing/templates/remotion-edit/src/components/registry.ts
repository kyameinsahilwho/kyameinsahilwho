import React from 'react';
import * as cards from './cards';
import * as screens from './screens';
import * as fx from './fx';

// Every graphic usable from the timeline, by name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GRAPHICS: Record<string, React.FC<any>> = {...(cards as any), ...(screens as any), ...(fx as any)};
