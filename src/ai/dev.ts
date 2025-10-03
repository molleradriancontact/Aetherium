import { config } from 'dotenv';
config();

import '@/ai/flows/generate-initial-analysis-report.ts';
import '@/ai/flows/suggest-backend-changes-from-analysis.ts';
import '@/ai/flows/suggest-frontend-changes-from-analysis.ts';
import '@/ai/flows/suggest-backend-modifications.ts';
import '@/ai/flows/suggest-frontend-modifications.ts';