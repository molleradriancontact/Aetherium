
'use server';

/**
 * @fileOverview Generates a project name based on file contents using AI.
 *
 * - generateProjectName - A function that generates the project name.
 * - GenerateProjectNameInput - The input type for the generateProjectName function.
 * - GenerateProjectNameOutput - The return type for the generateProjectName function.
 */
import 'dotenv/config';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateProjectNameInputSchema = z.object({
  fileContents: z
    .string()
    .describe('A string containing the concatenated content of all uploaded files.'),
});
export type GenerateProjectNameInput = z.infer<
  typeof GenerateProjectNameInputSchema
>;

const GenerateProjectNameOutputSchema = z.object({
  projectName: z
    .string()
    .describe(
      'A short, descriptive project name derived from the file contents.'
    ),
});
export type GenerateProjectNameOutput = z.infer<
  typeof GenerateProjectNameOutputSchema
>;

export async function generateProjectName(
  input: GenerateProjectNameInput
): Promise<GenerateProjectNameOutput> {
  return generateProjectNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectNamePrompt',
  input: {schema: GenerateProjectNameInputSchema},
  output: {schema: GenerateProjectNameOutputSchema},
  prompt: `You are an expert in summarizing technical documents and code.
  
  Based on the content of the files provided below, generate a short and descriptive project name. The name should be 2-4 words long and capture the main purpose or topic of the files.

  File Contents:
  {{{fileContents}}}
  `,
});

const generateProjectNameFlow = ai.defineFlow(
  {
    name: 'generateProjectNameFlow',
    inputSchema: GenerateProjectNameInputSchema,
    outputSchema: GenerateProjectNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-1.5-flash-latest') });
    if (!output?.projectName) {
      throw new Error("The AI failed to generate a project name.");
    }
    return output!;
  }
);
