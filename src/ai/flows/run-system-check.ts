
'use server';

/**
 * @fileOverview A Genkit flow for running a system health check on a project.
 *
 * - runSystemCheck - A function that takes an analysis report and provides improvement suggestions.
 * - SystemCheckInput - The input type for the runSystemCheck function.
 * - SystemCheckOutput - The return type for the runSystemCheck function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const SystemCheckInputSchema = z.object({
  analysisReport: z.string().describe('The existing analysis report for the project.'),
});
export type SystemCheckInput = z.infer<typeof SystemCheckInputSchema>;

const SystemCheckOutputSchema = z.object({
  refactoringSuggestions: z.string().describe('Suggestions for refactoring the code to improve its structure and readability.'),
  performanceOptimizations: z.string().describe('Recommendations for optimizing the performance of the application.'),
  featureIdeas: z.string().describe('Ideas for new features or capabilities based on the project context.'),
});
export type SystemCheckOutput = z.infer<typeof SystemCheckOutputSchema>;

export async function runSystemCheck(
  input: SystemCheckInput
): Promise<SystemCheckOutput> {
  return runSystemCheckFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runSystemCheckPrompt',
  input: { schema: SystemCheckInputSchema },
  output: { schema: SystemCheckOutputSchema },
  prompt: `You are an expert software architect and performance engineer.

  Your task is to conduct a "health check" on a software project based on its analysis report.
  Analyze the report thoroughly and provide actionable recommendations in three key areas:
  1.  **Refactoring Suggestions**: Identify areas in the code or architecture that could be improved for better readability, maintainability, or adherence to best practices. Suggest specific refactoring patterns or changes.
  2.  **Performance Optimizations**: Pinpoint potential performance bottlenecks. Suggest caching strategies, database query optimizations, component rendering improvements, or other techniques to make the application faster.
  3.  **New Feature Ideas**: Based on the project's purpose and existing structure, propose innovative yet relevant new features that would add value for the end-user.

  Provide a detailed and helpful response for each category.

  Analysis Report:
  {{{analysisReport}}}
  `,
});

const runSystemCheckFlow = ai.defineFlow(
  {
    name: 'runSystemCheckFlow',
    inputSchema: SystemCheckInputSchema,
    outputSchema: SystemCheckOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model: googleAI.model('gemini-1.5-flash') });
    if (!output) {
      throw new Error('The AI failed to generate a system health check report.');
    }
    return output;
  }
);
