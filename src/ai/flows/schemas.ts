
import { z } from 'genkit';

export const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ProjectChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  analysisReport: z.string(),
});

export const ProjectChatResponseSchema = z.object({
  content: z.string(),
});
