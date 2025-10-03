'use server';

// import the Genkit and Google AI plugin libraries
import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (name) => {
    // make a generation request
    const { text } = await ai.generate({
      prompt: `Hello Gemini, my name is ${name}`,
    });
    console.log(text);
    return text;
  }
);
