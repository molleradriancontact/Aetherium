
import { z } from 'genkit';

export const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ResearchRequestSchema = z.object({
  messages: z.array(MessageSchema),
  // Analysis report is now optional for the research flow
  analysisReport: z.string().optional(),
});

export const ResearchResponseSchema = z.object({
  content: z.string(),
});
