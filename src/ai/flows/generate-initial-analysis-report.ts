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
      'A string containing the content from the uploaded files.'
    ),
});
export type GenerateInitialAnalysisReportInput = z.infer<
  typeof GenerateInitialAnalysisReportInputSchema
>;

const GenerateInitialAnalysisReportOutputSchema = z.object({
  report: z
    .string()
    .describe(
      'A detailed analysis of the provided documents, outlining a plan for a web application based on the content.'
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
  prompt: `You are an AI expert in software architecture and application design.

  Your task is to analyze the content of the user's uploaded files and generate a plan for a web application based on the knowledge within them.
  The user is not providing source code; they are providing documents (like specifications, experiment steps, business plans, etc.).

  From the provided content, you must:
  1.  Understand the core purpose and goals described in the documents.
  2.  Propose a clear, high-level concept for a web application that would help the user achieve those goals.
  3.  Outline the key features and structure of this proposed application.
  4.  Provide a summary of your understanding of the user's documents and how the proposed application addresses their needs.

  This initial report is the blueprint for the entire prototyping process. Be thorough and clear.

  File Content:
  {{{codeSnippets}}}
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
