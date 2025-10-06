
'use server';

/**
 * @fileOverview A Genkit flow for adding text to an image.
 *
 * - addTextToImage - A function that takes an image, text, and optional styling.
 * - AddTextToImageInput - The input type for the function.
 * - AddTextToImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AddTextToImageInputSchema = z.object({
  imageDataUri: z.string().describe("The source image as a data URI."),
  text: z.string().describe("The text to add to the image."),
  fontSize: z.number().optional().describe("The desired font size for the text."),
  fontColor: z.string().optional().describe("The desired color for the text (e.g., 'white', '#FF0000')."),
});
export type AddTextToImageInput = z.infer<typeof AddTextToImageInputSchema>;


const AddTextToImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The modified image with text, encoded as a data URI.'),
});
export type AddTextToImageOutput = z.infer<typeof AddTextToImageOutputSchema>;


const addTextToImageFlow = ai.defineFlow(
  {
    name: 'addTextToImageFlow',
    inputSchema: AddTextToImageInputSchema,
    outputSchema: AddTextToImageOutputSchema,
  },
  async ({ imageDataUri, text, fontSize, fontColor }) => {

    const prompt = `Add the following text to the image: "${text}".
    
    ${fontSize ? `Use a font size of approximately ${fontSize}px.` : ''}
    ${fontColor ? `The font color should be ${fontColor}.` : ''}

    Place the text in a visually appealing and legible location on the image.
    `;

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

export async function addTextToImage(input: AddTextToImageInput): Promise<AddTextToImageOutput> {
  return addTextToImageFlow(input);
}
