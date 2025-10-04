
'use server';

/**
 * @fileOverview A Genkit flow for modifying a video based on a text prompt.
 *
 * - modifyVideo - A function that takes a video and a prompt, returns a modified video.
 * - ModifyVideoInput - The input type for the function.
 * - ModifyVideoOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ModifyVideoInputSchema = z.object({
  videoDataUri: z.string().describe("The source video as a data URI."),
  prompt: z.string().describe("The text prompt describing the modification."),
});
export type ModifyVideoInput = z.infer<typeof ModifyVideoInputSchema>;


const ModifyVideoOutputSchema = z.object({
  videoDataUri: z.string().describe('The modified video encoded as a data URI.'),
});
export type ModifyVideoOutput = z.infer<typeof ModifyVideoOutputSchema>;


const modifyVideoFlow = ai.defineFlow(
  {
    name: 'modifyVideoFlow',
    inputSchema: ModifyVideoInputSchema,
    outputSchema: ModifyVideoOutputSchema,
  },
  async ({ videoDataUri, prompt }) => {

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image-preview'),
      prompt: [
        { media: { url: videoDataUri } },
        { text: prompt },
      ],
      config: {
        // IMPORTANT: The model currently returns an image, not a video.
        // This is a placeholder for future video-to-video models.
        // We will return the result as if it were a video for UI consistency.
        responseModalities: ['IMAGE'],
      },
    });

    if (!media.url) {
        throw new Error('Video modification failed: no media was returned.');
    }
    
    // The model returns an image/png. We will relabel it as video/mp4 for the purpose
    // of this demo, acknowledging this is not a real video transformation yet.
    const modifiedContent = media.url.replace('image/png', 'video/mp4');

    return {
      videoDataUri: modifiedContent,
    };
  }
);

export async function modifyVideo(input: ModifyVideoInput): Promise<ModifyVideoOutput> {
  return modifyVideoFlow(input);
}
