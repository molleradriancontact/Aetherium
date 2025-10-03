
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

const SuggestBackendModificationsInputSchema = z.object({
  analysisReport: z.string().describe('The comprehensive analysis report of the existing backend file structure and architecture.'),
  userArchitecture: z.string().optional().describe('The user-defined architecture or intent for the backend.'),
});
export type SuggestBackendModificationsInput = z.infer<typeof SuggestBackendModificationsInputSchema>;

const SuggestBackendModificationsOutputSchema = z.object({
  suggestedChanges: z.string().describe('The AI-suggested modifications to the backend, based on the analysis and architecture.'),
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
  prompt: `Based on the following analysis report of the existing backend file structure and architecture:\n\n  {{analysisReport}}\n\n  And considering the following user-defined architecture or intent (if provided):\n\n  {{#if userArchitecture}}{{userArchitecture}}{{else}}No user-defined architecture provided.{{/if}}\n\n  Suggest specific modifications to the backend of the system. Explain your reasoning for each suggestion.\n\n  Format your response as follows:\n\n  Suggested Changes: [List of suggested changes]\n  Reasoning: [Explanation of why these changes are recommended]`,
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
