
'use server';

/**
 * @fileOverview A Genkit flow for generating an audio overview from text using a TTS model.
 *
 * - generateAudioOverview - A function that takes text and returns a WAV audio data URI.
 * - GenerateAudioOverviewOutput - The return type for the generateAudioOverview function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const GenerateAudioOverviewOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio encoded as a WAV data URI.'),
});
export type GenerateAudioOverviewOutput = z.infer<typeof GenerateAudioOverviewOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateAudioOverviewFlow = ai.defineFlow(
  {
    name: 'generateAudioOverviewFlow',
    inputSchema: z.string(),
    outputSchema: GenerateAudioOverviewOutputSchema,
  },
  async (reportText) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: reportText,
    });

    if (!media) {
      throw new Error('Audio generation failed: no media was returned.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

export async function generateAudioOverview(
  reportText: string
): Promise<GenerateAudioOverviewOutput> {
  return generateAudioOverviewFlow(reportText);
}
