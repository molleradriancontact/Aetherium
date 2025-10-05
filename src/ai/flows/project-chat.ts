
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message, ProjectChatRequestSchema, ProjectChatResponseSchema } from './schemas';
import { googleAI } from '@genkit-ai/google-genai';

const deepResearchTool = ai.defineTool(
  {
    name: 'deepResearch',
    description: 'Performs a deep research on a given topic using web search to find the most relevant and up-to-date information. Use this when the user asks a question that cannot be answered from the provided analysis report.',
    inputSchema: z.object({
      query: z.string().describe('The topic or question to research.'),
    }),
    outputSchema: z.string(),
  },
  async ({ query }) => {
    // In a real implementation, this would call a search API (e.g., Google Search).
    // For this prototype, we'll return a detailed placeholder response.
    console.log(`AI initiated deep research for: "${query}"`);
    return `Deep research synthesis for "${query}":

- **Core Concept**: The Go programming language, often referred to as Golang, is a statically typed, compiled language designed at Google. It is known for its simplicity, efficiency, and strong support for concurrent programming.

- **Key Features**:
  - **Concurrency**: Go's goroutines and channels provide a simple and powerful model for concurrent programming, making it easy to build highly parallel systems.
  - **Performance**: As a compiled language, Go applications are incredibly fast, with performance comparable to C++ or Rust in many scenarios.
  - **Simplicity**: The language has a minimal and clean syntax, making it easy to learn and read.
  - **Standard Library**: It comes with a rich standard library that provides robust support for everything from networking to I/O.

- **Use Cases**: It is widely used for backend services, command-line tools, cloud infrastructure (e.g., Docker, Kubernetes), and network programming.

This information was synthesized from external sources to provide a comprehensive answer.`;
  }
);


const projectChatFlow = ai.defineFlow(
  {
    name: 'projectChatFlow',
    inputSchema: ProjectChatRequestSchema,
    outputSchema: ProjectChatResponseSchema,
  },
  async ({ messages, analysisReport }) => {
    const systemInstruction = `You are an expert AI software architect and researcher, and you are having a conversation with a user about their project. You have already performed a detailed analysis.

You MUST use the provided analysis report as the primary source of truth and context for your answers.

If the user asks a question that cannot be answered from the report, you MUST use the 'deepResearch' tool to find external information. Your goal is to help the user understand the analysis, explore ideas, and decide on modifications, using external knowledge when necessary.

Here is the full analysis report for the project:
---
${analysisReport}
---

Based on that report and the user's questions, provide clear, helpful, and concise answers. Be ready to elaborate on parts of the report, suggest code changes, discuss architectural decisions, and perform deep research when required.
`;

    const llmResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      prompt: messages.at(-1)?.content ?? '',
      history: messages.slice(0, -1),
      system: systemInstruction,
      tools: [deepResearchTool]
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
