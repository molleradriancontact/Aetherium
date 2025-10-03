'use server';

/**
 * @fileOverview Generates a detailed analysis report of the uploaded file structure and code using AI.
 *
 * - generateInitialAnalysisReport - A function that generates the analysis report.
 * - GenerateInitialAnalysisReportInput - The input type for the generateInitialAnalysisReport function.
 * - GenerateInitialAnalysisReportOutput - The return type for the generateInitialAnalysisReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialAnalysisReportInputSchema = z.object({
  fileStructure: z
    .string()
    .describe('A string representation of the file structure.'),
  codeSnippets: z
    .string()
    .describe(
      'A string containing representative code snippets from the uploaded files.'
    ),
});
export type GenerateInitialAnalysisReportInput = z.infer<
  typeof GenerateInitialAnalysisReportInputSchema
>;

const GenerateInitialAnalysisReportOutputSchema = z.object({
  report: z
    .string()
    .describe(
      'A detailed analysis report highlighting potential improvements and code smells.'
    ),
});
export type GenerateInitialAnalysisReportOutput = z.infer<
  typeof GenerateInitialAnalysisReportOutputSchema
>;

export async function generateInitialAnalysisReport(
  input: GenerateInitialAnalysisReportInput
): Promise<GenerateInitialAnalysisReportOutput> {
  return generateInitialAnalysisReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialAnalysisReportPrompt',
  input: {schema: GenerateInitialAnalysisReportInputSchema},
  output: {schema: GenerateInitialAnalysisReportOutputSchema},
  prompt: `You are an AI expert in system architecture.

  Analyze the following file structure and code snippets to generate a detailed report.
  Highlight potential improvements, code smells, and areas for optimization. Provide actionable suggestions to improve the system's architecture and code quality.

  File Structure:
  {{fileStructure}}

  Code Snippets:
  {{codeSnippets}}
  `,
});

const generateInitialAnalysisReportFlow = ai.defineFlow(
  {
    name: 'generateInitialAnalysisReportFlow',
    inputSchema: GenerateInitialAnalysisReportInputSchema,
    outputSchema: GenerateInitialAnalysisReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
