
'use server';

import { generateInitialAnalysisReport } from '@/ai/flows/generate-initial-analysis-report';
import { suggestBackendChangesFromAnalysis } from '@/ai/flows/suggest-backend-changes-from-analysis';
import { suggestFrontendChangesFromAnalysis } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { generateProjectName } from '@/ai/flows/generate-project-name';

interface AnalysisInput {
  fileStructure: string;
  codeSnippets: string;
}

export async function analyzeFilesAction(input: AnalysisInput) {
  let projectName: string = `New Analysis - ${new Date().toLocaleString()}`;
  let report: string | undefined;
  let frontendSuggestions: SuggestFrontendChangesFromAnalysisOutput | undefined;
  let backendSuggestions: SuggestBackendChangesFromAnalysisOutput | undefined;

  // Attempt to generate a project name first. Non-critical.
  try {
    const nameResult = await generateProjectName({ fileContents: input.codeSnippets });
    if (nameResult && nameResult.projectName) {
      projectName = nameResult.projectName;
    }
  } catch (error) {
    console.error('Could not generate project name:', error);
    // Non-fatal, we can proceed with a default name.
  }

  // Generate the main analysis report. This is critical.
  try {
    const analysisResult = await generateInitialAnalysisReport(input);
    if (!analysisResult || !analysisResult.report) {
      throw new Error('Failed to generate the main analysis report.');
    }
    report = analysisResult.report;
  } catch (error) {
    console.error('Error during initial analysis report generation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the core analysis.';
    return {
      success: false,
      error: errorMessage,
      projectName,
      report: undefined,
      frontendSuggestions: undefined,
      backendSuggestions: undefined,
    };
  }

  // After the main report is successfully generated, attempt to get suggestions.
  // These are non-critical; if they fail, we can proceed with just the report.
  try {
    frontendSuggestions = await suggestFrontendChangesFromAnalysis({
      analysisReport: report,
      userArchitecture: 'Modern, component-based web application',
    });
  } catch (error) {
    console.error('Could not generate frontend suggestions:', error);
    // Non-fatal, we can continue without them.
  }

  try {
    backendSuggestions = await suggestBackendChangesFromAnalysis({
      fileStructureAnalysis: report,
      userDefinedArchitecture: 'Scalable, maintainable, and performant backend services',
    });
  } catch (error) {
    console.error('Could not generate backend suggestions:', error);
    // Non-fatal, we can continue without them.
  }

  return {
    success: true,
    projectName,
    report,
    frontendSuggestions,
    backendSuggestions,
    error: null,
  };
}
