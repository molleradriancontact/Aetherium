
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

const SuggestFrontendModificationsInputSchema = z.object({
  analysisReport: z.string().describe('The comprehensive analysis report of the existing file structure and architecture.'),
  userArchitecture: z.string().optional().describe('The user-defined architecture or intent for the system.'),
});
export type SuggestFrontendModificationsInput = z.infer<typeof SuggestFrontendModificationsInputSchema>;

const SuggestFrontendModificationsOutputSchema = z.object({
  suggestedChanges: z.string().describe('The AI-suggested modifications to the front end, based on the analysis and architecture.'),
  reasoning: z.string().describe('The AI reasoning behind the suggested modifications.'),
  visualDescription: z.string().describe('A detailed description of what the visual changes in the prototype will look like.'),
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
  prompt: `Based on the following analysis report of the existing file structure and architecture:\n\n  {{analysisReport}}\n\n  And considering the following user-defined architecture or intent (if provided):\n\n  {{#if userArchitecture}}{{userArchitecture}}{{else}}No user-defined architecture provided.{{/if}}\n\n  Suggest specific modifications to the front end of the system to enhance the design and improve the user experience. Explain your reasoning for each suggestion, and provide a description of the visual changes.\n\n  Format your response as follows:\n\n  Suggested Modifications: [List of suggested modifications]\n  Reasoning: [Explanation of why these modifications are recommended]\n  Visual Description: [A detailed description of the visual changes to the UI]`,
});

const suggestFrontendModificationsFlow = ai.defineFlow(
  {
    name: 'suggestFrontendModificationsFlow',
    inputSchema: SuggestFrontendModificationsInputSchema,
    outputSchema: SuggestFrontendModificationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-1.5-flash') });
    return output!;
  }
);
