
'use server';

// import the Genkit and Google AI plugin libraries
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';


const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (name) => {
    // make a generation request
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Hello Gemini, my name is ${name}`,
    });
    console.log(text);
    return text;
  }
);
