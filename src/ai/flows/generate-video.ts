
'use server';

/**
 * @fileOverview A Genkit flow for generating a video from a text prompt using Veo.
 *
 * - generateVideo - A function that takes a text prompt and returns a video data URI.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { MediaPart } from 'genkit/media';

const GenerateVideoOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video encoded as a data URI.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;


async function downloadVideo(video: MediaPart): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    // Add API key before fetching the video.
    const videoDownloadResponse = await fetch(
      `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
    );
    if (
      !videoDownloadResponse ||
      videoDownloadResponse.status !== 200 ||
      !videoDownloadResponse.body
    ) {
      throw new Error('Failed to fetch video');
    }
    
    const buffer = await videoDownloadResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Veo returns mp4, but contentType might not be populated
    const contentType = video.media?.contentType || 'video/mp4';

    return `data:${contentType};base64,${base64}`;
}


const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: z.string(),
    outputSchema: GenerateVideoOutputSchema,
  },
  async (prompt) => {
    if (!prompt) {
        throw new Error('A text prompt is required for video generation.');
    }

    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
      });
    
      if (!operation) {
        throw new Error('Expected the model to return an operation');
      }
    
      // Wait until the operation completes.
      while (!operation.done) {
        // Sleep for 5 seconds before checking again.
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
      }
    
      if (operation.error) {
        throw new Error('Failed to generate video: ' + operation.error.message);
      }
    
      const video = operation.output?.message?.content.find((p) => !!p.media);
      if (!video) {
        throw new Error('Failed to find the generated video');
      }
      
      const videoDataUri = await downloadVideo(video);

      return {
          videoDataUri
      }
  }
);

export async function generateVideo(prompt: string): Promise<GenerateVideoOutput> {
  return generateVideoFlow(prompt);
}
