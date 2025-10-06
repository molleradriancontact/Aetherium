
'use server';

/**
 * @fileOverview A Genkit flow for modifying an image based on a text prompt.
 *
 * - modifyImage - A function that takes an image and a prompt, returns a modified image.
 * - ModifyImageInput - The input type for the function.
 * - ModifyImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ModifyImageInputSchema = z.object({
  imageDataUri: z.string().describe("The source image as a data URI."),
  prompt: z.string().describe("The text prompt describing the modification."),
});
export type ModifyImageInput = z.infer<typeof ModifyImageInputSchema>;


const ModifyImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The modified image encoded as a data URI.'),
});
export type ModifyImageOutput = z.infer<typeof ModifyImageOutputSchema>;


const modifyImageFlow = ai.defineFlow(
  {
    name: 'modifyImageFlow',
    inputSchema: ModifyImageInputSchema,
    outputSchema: ModifyImageOutputSchema,
  },
  async ({ imageDataUri, prompt }) => {

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image-preview'),
      prompt: [
        { media: { url: imageDataUri } },
        { text: prompt },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media.url) {
        throw new Error('Image modification failed: no media was returned.');
    }
    
    return {
      imageDataUri: media.url,
    };
  }
);

export async function modifyImage(input: ModifyImageInput): Promise<ModifyImageOutput> {
  return modifyImageFlow(input);
}
