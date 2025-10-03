import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // flowStateStore: 'firebase',
  // traceStore: 'firebase',
  // cacheStore: 'firebase',
});
