
// Use the configured `ai` object from genkit.ts to ensure consistency.
import { ai } from '@/ai/genkit';
import 'dotenv/config';

// The following imports register the flows with the AI object.
import './flows/generate-initial-analysis-report.ts';
import './flows/suggest-backend-changes-from-analysis.ts';
import './flows/suggest-frontend-changes-from-analysis.ts';
import './flows/suggest-backend-modifications.ts';
import './flows/suggest-frontend-modifications.ts';
import './flows/generate-project-name.ts';
import './flows/hello.ts';
import './flows/chat.ts';
import './flows/project-chat.ts';
import './flows/synthesize-debates.ts';
import './flows/generate-audio-overview.ts';
import './flows/generate-image.ts';
import './flows/generate-video.ts';
import './flows/modify-video-flow.ts';
