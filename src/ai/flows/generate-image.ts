
'use server';

/**
 * @fileOverview A Genkit flow for generating an image from a text prompt.
 *
 * - generateImage - A function that takes a text prompt and returns an image data URI.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image encoded as a data URI.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: z.string(),
    outputSchema: GenerateImageOutputSchema,
  },
  async (prompt) => {
    if (!prompt) {
        throw new Error('A text prompt is required for image generation.');
    }

    const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: prompt,
    });

    if (!media.url) {
      throw new Error('Image generation failed: no media was returned.');
    }

    return {
      imageDataUri: media.url,
    };
  }
);

export async function generateImage(prompt: string): Promise<GenerateImageOutput> {
  return generateImageFlow(prompt);
}
