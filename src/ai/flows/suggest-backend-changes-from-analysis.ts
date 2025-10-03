
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting backend changes based on the analysis of the existing file structure and user-defined architecture.
 *
 * - suggestBackendChangesFromAnalysis - A function that takes analysis input and suggests backend changes.
 * - SuggestBackendChangesFromAnalysisInput - The input type for the suggestBackendChangesFromAnalysis function.
 * - SuggestBackendChangesFromAnalysisOutput - The output type for the suggestBackendChangesFromAnalysis function.
 */
import 'dotenv/config';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const SuggestBackendChangesFromAnalysisInputSchema = z.object({
  analysisReport: z.string().describe('The analysis of the existing backend file structure.'),
});
export type SuggestBackendChangesFromAnalysisInput = z.infer<typeof SuggestBackendChangesFromAnalysisInputSchema>;

const SuggestBackendChangesFromAnalysisOutputSchema = z.object({
  suggestedChanges: z.string().describe('The suggested changes to the backend configuration or code.'),
  reasoning: z.string().describe('The reasoning behind the suggested changes.'),
});
export type SuggestBackendChangesFromAnalysisOutput = z.infer<typeof SuggestBackendChangesFromAnalysisOutputSchema>;

export async function suggestBackendChangesFromAnalysis(input: SuggestBackendChangesFromAnalysisInput): Promise<SuggestBackendChangesFromAnalysisOutput> {
  return suggestBackendChangesFromAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBackendChangesFromAnalysisPrompt',
  input: {schema: SuggestBackendChangesFromAnalysisInputSchema},
  output: {schema: SuggestBackendChangesFromAnalysisOutputSchema},
  prompt: `You are an AI architect specializing in backend systems.

  Based on the analysis of the existing file structure and the user-defined architecture, suggest changes to the backend to improve its structure, maintainability, and performance.

  Analysis Report: {{{analysisReport}}}

  Consider code smells, potential improvements, and alignment with the user-defined architecture.
  Provide clear and actionable suggestions with reasoning.

  Format your response as follows:
  Suggested Changes: [The suggested changes to the backend configuration or code]
  Reasoning: [The reasoning behind the suggested changes]`,
});

const suggestBackendChangesFromAnalysisFlow = ai.defineFlow(
  {
    name: 'suggestBackendChangesFromAnalysisFlow',
    inputSchema: SuggestBackendChangesFromAnalysisInputSchema,
    outputSchema: SuggestBackendChangesFromAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: 'googleai/gemini-1.5-flash' });
    return output!;
  }
);
