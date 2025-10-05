
'use server';

/**
 * @fileOverview A Genkit flow for synthesizing debates between different AI expert personas based on multiple project analysis reports.
 *
 * - synthesizeDebates - A function that takes multiple analysis reports and generates a debate and constructive solutions.
 * - SynthesizeDebatesInput - The input type for the synthesizeDebates function.
 * - SynthesizeDebatesOutput - The return type for the synthesizeDebates function.
 */

import 'dotenv/config';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const SynthesizeDebatesInputSchema = z.object({
  analysisReports: z.array(z.object({
    projectName: z.string(),
    report: z.string(),
  })).describe('An array of analysis reports from different projects, each with its name.'),
});
export type SynthesizeDebatesInput = z.infer<typeof SynthesizeDebatesInputSchema>;

const SynthesizeDebatesOutputSchema = z.object({
  debate: z.string().describe("A formatted debate between AI expert personas based on the provided reports."),
  synthesis: z.string().describe("A synthesized conclusion with constructive solutions and alternatives derived from the debate."),
});
export type SynthesizeDebatesOutput = z.infer<typeof SynthesizeDebatesOutputSchema>;

export async function synthesizeDebates(
  input: SynthesizeDebatesInput
): Promise<SynthesizeDebatesOutput> {
  return synthesizeDebatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'synthesizeDebatesPrompt',
  input: { schema: SynthesizeDebatesInputSchema },
  output: { schema: SynthesizeDebatesOutputSchema },
  prompt: `You are a master architect overseeing a debate between several expert AI consultants.
  
  Your task is to analyze multiple project analysis reports, facilitate a debate between different AI personas, and synthesize the results into a constructive solution.

  Here are the analysis reports from the projects:
  ---
  {{#each analysisReports}}
  Project Name: {{{this.projectName}}}
  Report:
  {{{this.report}}}
  ---
  {{/each}}

  Instructions:
  1.  **Assign Personas**: For each project report, create a distinct AI expert persona. For example, "The Pragmatist", "The Visionary", "The Security Expert", "The Scalability Guru".
  2.  **Stage a Debate**: Based on the provided reports, script a debate between these personas. Each persona should advocate for the ideas in their respective reports, challenge others' assumptions, and find common ground. The debate should be structured, insightful, and highlight the pros and cons of different approaches.
  3.  **Synthesize a Conclusion**: After the debate, you (the Master Architect) must step in and synthesize the discussion. Your synthesis should identify the strongest ideas, propose a hybrid approach that combines the best of all worlds, and present clear, actionable, and constructive solutions or alternatives.

  The output must be formatted into two sections: "Debate" and "Synthesis".
  `,
});

const synthesizeDebatesFlow = ai.defineFlow(
  {
    name: 'synthesizeDebatesFlow',
    inputSchema: SynthesizeDebatesInputSchema,
    outputSchema: SynthesizeDebatesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model: googleAI.model('gemini-1.5-flash') });
    if (!output?.debate || !output?.synthesis) {
        throw new Error("The AI failed to generate a valid debate and synthesis.");
    }
    return output;
  }
);
