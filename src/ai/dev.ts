import * as admin from 'firebase-admin';
// admin.initializeApp();

import '@/ai/flows/generate-initial-analysis-report.ts';
import '@/ai/flows/suggest-backend-changes-from-analysis.ts';
import '@/ai/flows/suggest-frontend-changes-from-analysis.ts';
import '@/ai/flows/suggest-backend-modifications.ts';
import '@/ai/flows/suggest-frontend-modifications.ts';
import '@/ai/flows/generate-project-name.ts';
import '@/ai/flows/hello.ts';
