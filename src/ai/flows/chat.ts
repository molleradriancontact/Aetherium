'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
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
        tool_code: z.string().optional(),
    }),
  },
  async (messages) => {
    
    const systemInstruction = `You are a helpful AI assistant for the Aetherium application. Your primary role is to communicate with the user and help them analyze their code or text. If the user provides a block of text and asks you to "save this" or "create a document from this", use the saveDocument tool to pass the content for saving. Do not add any commentary when using the tool, just call it. Otherwise, just respond as a helpful assistant.`;

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      tools: [saveDocumentTool],
      prompt: `${systemInstruction}\n\nHere is the conversation history:\n${JSON.stringify(messages.slice(0, -1))}\n\nHere is the latest message:\n${messages.at(-1)?.content ?? ''}`,
    });

    const choice = llmResponse.choices[0];
    const toolCall = choice.message.toolCalls?.[0];

    if (toolCall) {
        return {
            content: choice.text,
            tool_code: JSON.stringify(toolCall, null, 2),
        };
    }
    
    return {
        content: choice.text,
    };
  }
);

export async function chat(messages: Message[]) {
  if (messages.length === 0) return { content: '' };
  const result = await chatFlow(messages);
  
  if (result.tool_code) {
    const toolData = JSON.parse(result.tool_code);
    if (toolData.function?.name === 'saveDocument') {
        return {
            content: result.content,
            functionCall: {
                name: toolData.function.name,
                args: toolData.function.args,
            },
        };
    }
  }
  
  return { content: result.content };
}
