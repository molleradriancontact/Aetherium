
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting modifications to the front end of a system based on AI analysis and architectural guidelines.
 *
 * - suggestFrontendModifications - A function that takes analysis data and suggests front-end changes.
 * - SuggestFrontendModificationsInput - The input type for the suggestFrontendModifications function.
 * - SuggestFrontendModificationsOutput - The return type for the suggestFrontendModifications function.
 */
import 'dotenv/config';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GeneratedFileSchema = z.object({
    path: z.string().describe("The full path of the file to be created or modified."),
    content: z.string().describe("The complete code content for the file."),
    visualDescription: z.string().optional().describe('A detailed description of what the visual changes in the prototype will look like. This should only be provided for user-facing files (e.g., .tsx).'),
});


const SuggestFrontendModificationsInputSchema = z.object({
  analysisReport: z.string().describe('The comprehensive analysis report of the existing file structure and architecture.'),
  userArchitecture: z.string().optional().describe('The user-defined architecture or intent for the system.'),
});
export type SuggestFrontendModificationsInput = z.infer<typeof SuggestFrontendModificationsInputSchema>;

const SuggestFrontendModificationsOutputSchema = z.object({
    files: z.array(GeneratedFileSchema).describe("An array of files with their content and paths."),
    reasoning: z.string().describe('The AI reasoning behind the suggested modifications.'),
});
export type SuggestFrontendModificationsOutput = z.infer<typeof SuggestFrontendModificationsOutputSchema>;

export async function suggestFrontendModifications(
  input: SuggestFrontendModificationsInput
): Promise<SuggestFrontendModificationsOutput> {
  return suggestFrontendModificationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFrontendModificationsPrompt',
  input: {schema: SuggestFrontendModificationsInputSchema},
  output: {schema: SuggestFrontendModificationsOutputSchema},
  prompt: `You are an expert AI architect and frontend developer. Your task is to generate the necessary frontend code based on an analysis report and user architecture.

  Based on the following analysis report of the existing file structure and architecture:
  {{analysisReport}}

  And considering the following user-defined architecture or intent (if provided):
  {{#if userArchitecture}}{{userArchitecture}}{{else}}No user-defined architecture provided.{{/if}}

  Your task is to:
  1.  Determine which frontend files (e.g., .tsx, .css) need to be created or modified.
  2.  Generate the complete, final code for each of those files.
  3.  For any user-facing files (like .tsx components), provide a detailed 'visualDescription' of the UI changes.
  4.  Provide a clear 'reasoning' for your overall changes.
  5.  Return the result as an object containing the reasoning and an array of file objects, where each file object has the full file path, its entire content, and an optional visual description.

  Ensure the generated code is complete and ready to be written to a file. Do not use placeholders or partial snippets.
  `,
});

const suggestFrontendModificationsFlow = ai.defineFlow(
  {
    name: 'suggestFrontendModificationsFlow',
    inputSchema: SuggestFrontendModificationsInputSchema,
    outputSchema: SuggestFrontendModificationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-1.5-flash-latest') });
    return output!;
  }
);
