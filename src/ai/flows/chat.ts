
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message, MessageSchema } from './schemas';
import { googleAI } from '@genkit-ai/google-genai';

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
    inputSchema: z.object({
        history: z.array(MessageSchema),
        prompt: z.string(),
    }),
    outputSchema: z.object({
        content: z.string(),
        tool_code: z.string().optional(),
    }),
  },
  async ({ history, prompt }) => {
    
    const systemInstruction = `You are a helpful AI assistant for the Aetherium application. Your primary role is to communicate with the user and help them analyze their code or text. If the user provides a block of text and asks you to "save this" or "create a document from this", use the saveDocument tool to pass the content for saving. Do not add any commentary when using the tool, just call it. Otherwise, just respond as a helpful assistant.`;

    const llmResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      prompt: prompt,
      history: history,
      tools: [saveDocumentTool],
      system: systemInstruction,
    });

    const choice = llmResponse.choices[0];
    
    if (choice.finishReason === 'toolCode' && choice.message.toolCalls) {
      // Genkit returns tool-calling requests as `toolCode`. We'll pass the first one back to the client.
      const toolCall = choice.message.toolCalls[0];
      return {
          content: choice.text ?? '',
          tool_code: JSON.stringify(toolCall, null, 2),
      };
    }
    
    return {
        content: choice.text ?? '',
    };
  }
);

export async function chat(history: Message[], prompt: string) {
  const result = await chatFlow({ history, prompt });
  
  if (result.tool_code) {
    try {
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
    } catch (e) {
        console.error("Error parsing tool code:", e);
        // Fall through to return the text content if parsing fails
    }
  }
  
  return { content: result.content };
}
