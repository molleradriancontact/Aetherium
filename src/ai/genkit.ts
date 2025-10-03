
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
    // firebase(), // Temporarily disabled to resolve build/runtime errors
  ],
  // flowStateStore: 'firebase',
  // traceStore: 'firebase',
  // cacheStore: 'firebase',
});
