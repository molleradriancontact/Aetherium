
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
    // firebase(), // Temporarily disabled to resolve build/runtime errors
  ],
  // flowStateStore: 'firebase',
  // traceStore: 'firebase',
  // cacheStore: 'firebase',
});
