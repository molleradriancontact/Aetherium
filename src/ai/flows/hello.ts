'use server';

// import the Genkit and Google AI plugin libraries
import { gemini15Flash } from '@genkit-ai/googleai';
import { ai } from '@/ai/genkit';


const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
  },
  async (name: string) => {
    // make a generation request
    const { text } = await ai.generate({
      model: gemini15Flash,
      prompt: `Hello Gemini, my name is ${name}`,
    });
    console.log(text);
    return text;
  }
);

if (process.env.NODE_ENV === 'development') {
  helloFlow('Chris');
}
