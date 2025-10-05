
// Use the configured `ai` object from genkit.ts to ensure consistency.
import { ai } from '@/ai/genkit';
import 'dotenv/config';

// This check prevents the flows from being re-registered during hot-reloading in development.
if (process.env.NODE_ENV === 'development' && (global as any).genkitFlowsRegistered) {
  // Flows are already registered, do nothing.
} else {
  // The following imports register the flows with the AI object.
  require('./flows/generate-initial-analysis-report.ts');
  require('./flows/suggest-backend-changes-from-analysis.ts');
  require('./flows/suggest-frontend-changes-from-analysis.ts');
  require('./flows/suggest-backend-modifications.ts');
  require('./flows/suggest-frontend-modifications.ts');
  require('./flows/generate-project-name.ts');
  require('./flows/hello.ts');
  require('./flows/chat.ts');
  require('./flows/research.ts');
  require('./flows/synthesize-debates.ts');
  require('./flows/generate-audio-overview.ts');
  require('./flows/generate-image.ts');
  require('./flows/generate-video.ts');
  require('./flows/modify-video-flow.ts');
  require('./flows/run-system-check.ts');

  if (process.env.NODE_ENV === 'development') {
    (global as any).genkitFlowsRegistered = true;
  }
}
