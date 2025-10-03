
import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1'}),
    // firebase(), // Temporarily disabled to resolve build/runtime errors
  ],
  // flowStateStore: 'firebase',
  // traceStore: 'firebase',
  // cacheStore: 'firebase',
});
