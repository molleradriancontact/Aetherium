
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message, ResearchRequestSchema, ResearchResponseSchema } from './schemas';
import { googleAI } from '@genkit-ai/google-genai';

const deepResearchTool = ai.defineTool(
  {
    name: 'deepResearch',
    description: 'Performs a deep research on a given topic using web search to find the most relevant and up-to-date information. Use this for any user query that requires external knowledge.',
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


const researchFlow = ai.defineFlow(
  {
    name: 'researchFlow',
    inputSchema: ResearchRequestSchema,
    outputSchema: ResearchResponseSchema,
  },
  async ({ messages, analysisReport }) => {
    const systemInstruction = `You are an expert AI researcher. Your primary goal is to answer the user's questions by performing deep research using the tools available to you.
    
If the user has provided an analysis report, you can use it as conversational context, but you MUST prioritize using the 'deepResearch' tool to find the most current and relevant external information to answer the user's query. Do not rely solely on the report.

Your main function is to be a research assistant.

Analysis Report (if provided):
---
${analysisReport || "No project analysis report provided."}
---

Based on the user's question, perform the necessary research and provide a clear, helpful, and concise answer.
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

export async function research(
  request: z.infer<typeof ResearchRequestSchema>
): Promise<z.infer<typeof ResearchResponseSchema>> {
  if (request.messages.length === 0) return { content: '' };
  return researchFlow(request);
}
