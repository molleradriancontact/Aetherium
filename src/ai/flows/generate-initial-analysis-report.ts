
'use server';

/**
 * @fileOverview Generates a detailed analysis report of the uploaded file structure and code using AI.
 *
 * - generateInitialAnalysisReport - A function that generates the analysis report.
 * - GenerateInitialAnalysisReportInput - The input type for the generateInitialAnalysisReport function.
 * - GenerateInitialAnalysisReportOutput - The return type for the generateInitialAnalysisReport function.
 */
import 'dotenv/config';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateInitialAnalysisReportInputSchema = z.object({
  fileStructure: z
    .string()
    .describe('A string representation of the file structure.'),
  codeSnippets: z
    .string()
    .describe(
      'A string containing the content from the uploaded files, which may be text or data URIs.'
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
  prompt: `You are an AI expert in software architecture and information analysis.

  Your task is to analyze the content of the user's uploaded files—whether it's one file or many, organized or not—and produce a structured, helpful analysis. The content might be specifications, raw data, business plans, or even just a collection of notes.

  From the provided content, you must:
  1.  Thoroughly analyze the text and data. The content may be in various formats, including data URIs for file types like DOCX or PDF. You must interpret this content.
  2.  Identify and summarize the key topics, concepts, and entities present in the documents.
  3.  Structure this summary in a clear, organized manner. Use headings, lists, and other formatting to make the information easy to digest.
  4.  If the content suggests a clear purpose or goal, propose a high-level concept for a web application that would help the user achieve it. If the content is too disparate or abstract, focus on providing an excellent, structured summary of the information instead.
  
  This report is the blueprint for the entire prototyping process. Be thorough, clear, and flexible in your analysis.

  File Structure:
  {{{fileStructure}}}

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
    const {output} = await prompt(input, { model: googleAI.model('gemini-1.5-flash-latest') });
    if (!output?.report) {
      throw new Error("The AI failed to generate a valid analysis report. The output was empty.");
    }
    return output!;
  }
);
