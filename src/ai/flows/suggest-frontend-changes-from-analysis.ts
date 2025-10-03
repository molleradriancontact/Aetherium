
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting changes to the front end of a system based on AI analysis of the existing file structure and user-defined architecture.
 *
 * - suggestFrontendChangesFromAnalysis - A function that takes analysis data and suggests front-end changes.
 * - SuggestFrontendChangesFromAnalysisInput - The input type for the suggestFrontendChangesFromAnalysis function.
 * - SuggestFrontendChangesFromAnalysisOutput - The return type for the suggestFrontendChangesFromAnalysis function.
 */
import 'dotenv/config';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const SuggestFrontendChangesFromAnalysisInputSchema = z.object({
  analysisReport: z.string().describe('The comprehensive analysis report of the existing file structure and architecture.'),
  userArchitecture: z.string().optional().describe('The user-defined architecture or intent for the system.'),
});
export type SuggestFrontendChangesFromAnalysisInput = z.infer<typeof SuggestFrontendChangesFromAnalysisInputSchema>;

const SuggestFrontendChangesFromAnalysisOutputSchema = z.object({
  suggestedChanges: z.string().describe('The AI-suggested changes to the front end, based on the analysis and architecture.'),
  reasoning: z.string().describe('The AI reasoning behind the suggested changes.'),
});
export type SuggestFrontendChangesFromAnalysisOutput = z.infer<typeof SuggestFrontendChangesFromAnalysisOutputSchema>;

export async function suggestFrontendChangesFromAnalysis(
  input: SuggestFrontendChangesFromAnalysisInput
): Promise<SuggestFrontendChangesFromAnalysisOutput> {
  return suggestFrontendChangesFromAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFrontendChangesFromAnalysisPrompt',
  input: {schema: SuggestFrontendChangesFromAnalysisInputSchema},
  output: {schema: SuggestFrontendChangesFromAnalysisOutputSchema},
  prompt: `Based on the following analysis report of the existing file structure and architecture:

  {{analysisReport}}

  And considering the following user-defined architecture or intent (if provided):

  {{#if userArchitecture}}{{userArchitecture}}{{else}}No user-defined architecture provided.{{/if}}

  Suggest specific changes to the front end of the. Explain your reasoning for each suggestion.

  Format your response as follows:

  Suggested Changes: [List of suggested changes]
  Reasoning: [Explanation of why these changes are recommended]`,
});

const suggestFrontendChangesFromAnalysisFlow = ai.defineFlow(
  {
    name: 'suggestFrontendChangesFromAnalysisFlow',
    inputSchema: SuggestFrontendChangesFromAnalysisInputSchema,
    outputSchema: SuggestFrontendChangesFromAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: 'googleai/gemini-1.5-flash' });
    return output!;
  }
);
