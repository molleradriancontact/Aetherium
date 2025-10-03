
'use server';

import { generateInitialAnalysisReport } from '@/ai/flows/generate-initial-analysis-report';
import { suggestBackendChangesFromAnalysis } from '@/ai/flows/suggest-backend-changes-from-analysis';
import { suggestFrontendChangesFromAnalysis } from '@/ai/flows/suggest-frontend-changes-from-analysis';

interface AnalysisInput {
  fileStructure: string;
  codeSnippets: string;
}

export async function analyzeFilesAction(input: AnalysisInput) {
  try {
    const analysisResult = await generateInitialAnalysisReport(input);

    if (!analysisResult || !analysisResult.report) {
      throw new Error('Failed to generate analysis report.');
    }

    const [frontendResult, backendResult] = await Promise.all([
      suggestFrontendChangesFromAnalysis({
        analysisReport: analysisResult.report,
        userArchitecture: 'Modern, component-based web application',
      }),
      suggestBackendChangesFromAnalysis({
        fileStructureAnalysis: analysisResult.report,
        userDefinedArchitecture: 'Scalable, maintainable, and performant backend services',
      }),
    ]);
    
    return {
      success: true,
      report: analysisResult.report,
      frontendSuggestions: frontendResult,
      backendSuggestions: backendResult,
    };
  } catch (error) {
    console.error('Error during analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
