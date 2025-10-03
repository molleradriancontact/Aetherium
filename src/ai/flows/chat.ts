
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { Message, MessageSchema } from './schemas';

const saveDocumentTool = ai.defineTool(
  {
    name: 'saveDocument',
    description: 'Saves the provided text content as a document for analysis in the user\'s library. Only use this when the user explicitly asks to save, create, or convert text into a document.',
    inputSchema: z.object({
      content: z.string().describe('The full text content to be saved as a document.'),
    }),
    outputSchema: z.void(),
  },
  async () => {
    // This function is a placeholder. The actual logic is handled on the client
    // which checks for the 'saveDocument' function call in the AI's response.
  }
);

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.array(MessageSchema),
    outputSchema: z.object({
        content: z.string(),
        functionCall: z.optional(z.any()),
    }),
  },
  async (messages) => {
    const systemInstruction = `You are a helpful AI assistant for the OS Architect application. 
      Your primary role is to communicate with the user and help them analyze their code or text.
      If the user provides a block of text and asks you to "save this" or "create a document from this",
      use the saveDocument tool to pass the content for saving. Do not add any commentary when using the tool, just call it.
      Otherwise, just respond as a helpful assistant.`;

    const llmResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      tools: [saveDocumentTool],
      system: systemInstruction,
      prompt: messages.at(-1)?.content ?? '',
      history: messages.slice(0, -1),
    });

    const choice = llmResponse.choices[0];
    const functionCall = choice.message.toolCalls?.[0]?.function;
    
    return {
        content: choice.message.content?.map(p => p.text).join('') ?? '',
        functionCall: functionCall
          ? {
              name: functionCall.name,
              args: functionCall.args,
            }
          : undefined,
    };
  }
);

export async function chat(messages: Message[]) {
  if (messages.length === 0) return { content: '' };
  return chatFlow(messages);
}
