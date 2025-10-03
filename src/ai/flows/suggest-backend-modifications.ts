
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting modifications to the backend of a system based on AI analysis.
 *
 * - suggestBackendModifications - A function that suggests modifications to the backend.
 * - SuggestBackendModificationsInput - The input type for the suggestBackendModifications function.
 * - SuggestBackendModificationsOutput - The output type for the suggestBackendModifications function.
 */
import 'dotenv/config';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GeneratedFileSchema = z.object({
    path: z.string().describe("The full path of the file to be created or modified."),
    content: z.string().describe("The complete code content for the file."),
});

const SuggestBackendModificationsInputSchema = z.object({
  analysisReport: z.string().describe('The comprehensive analysis report of the existing backend file structure and architecture.'),
  userArchitecture: z.string().optional().describe('The user-defined architecture or intent for the backend.'),
});
export type SuggestBackendModificationsInput = z.infer<typeof SuggestBackendModificationsInputSchema>;

const SuggestBackendModificationsOutputSchema = z.object({
  files: z.array(GeneratedFileSchema).describe("An array of files with their content and paths."),
  reasoning: z.string().describe('The AI reasoning behind the suggested changes.'),
});
export type SuggestBackendModificationsOutput = z.infer<typeof SuggestBackendModificationsOutputSchema>;

export async function suggestBackendModifications(
  input: SuggestBackendModificationsInput
): Promise<SuggestBackendModificationsOutput> {
  return suggestBackendModificationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBackendModificationsPrompt',
  input: {schema: SuggestBackendModificationsInputSchema},
  output: {schema: SuggestBackendModificationsOutputSchema},
  prompt: `You are an expert AI architect. Your task is to generate the necessary backend code based on an analysis report and user architecture.

  Based on the following analysis report of the existing backend file structure and architecture:
  {{analysisReport}}

  And considering the following user-defined architecture or intent (if provided):
  {{#if userArchitecture}}{{userArchitecture}}{{else}}No user-defined architecture provided.{{/if}}

  Your task is to:
  1.  Determine which files need to be created or modified.
  2.  Generate the complete, final code for each of those files.
  3.  Provide a clear reasoning for your changes.
  4.  Return the result as an array of file objects, each containing the full file path and its entire content.

  Ensure the generated code is complete and ready to be written to a file. Do not use placeholders or partial snippets.
  `,
});

const suggestBackendModificationsFlow = ai.defineFlow(
  {
    name: 'suggestBackendModificationsFlow',
    inputSchema: SuggestBackendModificationsInputSchema,
    outputSchema: SuggestBackendModificationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-1.5-flash') });
    return output!;
  }
);
