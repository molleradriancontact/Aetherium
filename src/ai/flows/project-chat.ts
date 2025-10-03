
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message, ProjectChatRequestSchema, ProjectChatResponseSchema } from './schemas';

const projectChatFlow = ai.defineFlow(
  {
    name: 'projectChatFlow',
    inputSchema: ProjectChatRequestSchema,
    outputSchema: ProjectChatResponseSchema,
  },
  async ({ messages, analysisReport }) => {
    const systemInstruction = `You are an expert AI software architect, and you are having a conversation with a user about their project. You have already performed a detailed analysis.

You MUST use the provided analysis report as the primary source of truth and context for your answers. Your goal is to help the user understand the analysis, explore ideas, and decide on modifications.

Here is the full analysis report for the project:
---
${analysisReport}
---

Based on that report and the user's questions, provide clear, helpful, and concise answers. Be ready to elaborate on parts of the report, suggest code changes, and discuss architectural decisions.
`;

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      system: systemInstruction,
      prompt: messages.at(-1)?.content ?? '',
      history: messages.slice(0, -1),
    });

    const content = llmResponse.text ?? '';
    return { content };
  }
);

export async function projectChat(
  request: z.infer<typeof ProjectChatRequestSchema>
): Promise<z.infer<typeof ProjectChatResponseSchema>> {
  if (request.messages.length === 0) return { content: '' };
  return projectChatFlow(request);
}
