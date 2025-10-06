
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const DesignIdeaSchema = z.object({
  title: z.string().describe('A short, catchy title for the design concept.'),
  description: z.string().describe('A one or two-sentence description of the design idea.'),
  imageUrl: z.string().url().describe('A placeholder image URL for the concept. Use picsum.photos for this.'),
});
export type DesignIdea = z.infer<typeof DesignIdeaSchema>;


const GenerateDesignIdeasInputSchema = z.object({
  styleDescription: z.string().optional().describe("A description of the client's visual style and typical requests."),
  brandKeywords: z.array(z.string()).optional().describe('A list of keywords that define the client\'s brand (e.g., "modern", "minimalist").'),
});

const GenerateDesignIdeasOutputSchema = z.object({
  ideas: z.array(DesignIdeaSchema).describe('An array of 4 unique design ideas.'),
});

export async function generateDesignIdeas(
  input: z.infer<typeof GenerateDesignIdeasInputSchema>
): Promise<z.infer<typeof GenerateDesignIdeasOutputSchema>> {
  return generateDesignIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDesignIdeasPrompt',
  input: { schema: GenerateDesignIdeasInputSchema },
  output: { schema: GenerateDesignIdeasOutputSchema },
  prompt: `You are an expert creative director for a graphic design agency.

  A designer has provided information about their client. Your task is to brainstorm 4 distinct and creative design concepts that the designer could pitch to their client. For each concept, provide a title, a short description, and a placeholder image URL from picsum.photos.

  Client's Style Description:
  {{{styleDescription}}}

  Client's Brand Keywords:
  {{#if brandKeywords}}
    {{#each brandKeywords}} - {{{this}}} {{/each}}
  {{else}}
    No keywords provided.
  {{/if}}

  Generate 4 unique ideas based on this information.
  `,
});


const generateDesignIdeasFlow = ai.defineFlow(
  {
    name: 'generateDesignIdeasFlow',
    inputSchema: GenerateDesignIdeasInputSchema,
    outputSchema: GenerateDesignIdeasOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model: googleAI.model('gemini-1.5-flash')});
    
    if (!output || !output.ideas || output.ideas.length === 0) {
      throw new Error('The AI failed to generate any design ideas.');
    }

    // Ensure all image URLs are valid and using a consistent size for the UI
    const validatedIdeas = output.ideas.map((idea, index) => ({
      ...idea,
      imageUrl: `https://picsum.photos/seed/${params.id}${index}/600/400`,
    }));

    return { ideas: validatedIdeas };
  }
);
