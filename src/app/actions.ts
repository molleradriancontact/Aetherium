
'use server';

import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase-admin/firestore';
import { db } from '@/firebase/server-init';
import { generateInitialAnalysisReport } from '@/ai/flows/generate-initial-analysis-report';
import { suggestBackendChangesFromAnalysis } from '@/ai/flows/suggest-backend-changes-from-analysis';
import { suggestFrontendChangesFromAnalysis } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { generateProjectName } from '@/ai/flows/generate-project-name';
import type { ArchitectProject, UploadedFile } from '@/app/provider';

interface AnalysisInput {
  userId: string;
  files: UploadedFile[];
}

/**
 * A robust, multi-step server action to handle the entire analysis workflow.
 * 1. Creates a project document in Firestore.
 * 2. Runs AI flows for name, report, and suggestions.
 * 3. Updates the Firestore document with the results as they become available.
 * This makes the process more resilient and provides a better UX.
 */
export async function startAnalysisAction(input: AnalysisInput) {
  const { userId, files } = input;

  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  // 1. Create the initial project document in Firestore
  const projectRef = doc(collection(db, 'users', userId, 'projects'));
  const initialProject: ArchitectProject = {
    id: projectRef.id,
    userId: userId,
    name: `New Project - ${new Date().toLocaleString()}`,
    createdAt: serverTimestamp(),
    uploadedFiles: files,
    history: [{ id: Date.now(), message: 'Project created.', timestamp: new Date() }],
  };

  try {
    await setDoc(projectRef, initialProject);
  } catch (e: any) {
    console.error('Firestore Error: Failed to create initial project document.', e);
    return { success: false, error: `Failed to create project: ${e.message}` };
  }

  // Prepare data for AI flows
  const fileStructure = createTree(files.map(f => ({ path: f.path })));
  const codeSnippets = files
    .map(file => `--- ${file.path} ---\n${file.content}`)
    .join('\n\n');

  // 2. Asynchronously run all AI flows. We don't need to block the response for these.
  // We'll update the document in Firestore as each completes.
  (async () => {
    try {
      // Generate project name
      await updateDoc(projectRef, { 'history': [...initialProject.history!, { id: Date.now(), message: 'Generating project name...', timestamp: new Date() }]});
      const nameResult = await generateProjectName({ fileContents: codeSnippets });
      await updateDoc(projectRef, { name: nameResult.projectName });

      // Generate analysis report
      await updateDoc(projectRef, { 'history': [...initialProject.history!, { id: Date.now(), message: 'Generating analysis report...', timestamp: new Date() }]});
      const reportResult = await generateInitialAnalysisReport({ fileStructure, codeSnippets });
      await updateDoc(projectRef, { analysisReport: reportResult.report });
      
      // Generate frontend suggestions
      await updateDoc(projectRef, { 'history': [...initialProject.history!, { id: Date.now(), message: 'Generating frontend suggestions...', timestamp: new Date() }]});
      const frontendResult = await suggestFrontendChangesFromAnalysis({ analysisReport: reportResult.report });
      await updateDoc(projectRef, { frontendSuggestions: frontendResult });

      // Generate backend suggestions
      await updateDoc(projectRef, { 'history': [...initialProject.history!, { id: Date.now(), message: 'Generating backend suggestions...', timestamp: new Date() }]});
      const backendResult = await suggestBackendChangesFromAnalysis({ fileStructureAnalysis: reportResult.report });
      await updateDoc(projectRef, { backendSuggestions: backendResult });

      await updateDoc(projectRef, { 'history': [...initialProject.history!, { id: Date.now(), message: 'Analysis complete.', timestamp: new Date() }]});

    } catch (aiError: any) {
        console.error("AI analysis failed:", aiError);
        const errorMessage = aiError.message || "An unknown AI error occurred.";
        try {
            await updateDoc(projectRef, {
                'history': [...initialProject.history!, { id: Date.now(), message: `Analysis failed: ${errorMessage}`, timestamp: new Date() }]
            });
        } catch (updateError) {
            console.error("Failed to write AI error to Firestore history:", updateError);
        }
    }
  })();

  // 3. Return immediately to the client.
  return { success: true, projectId: projectRef.id };
}

// Helper to create a file tree string
const createTree = (files: { path: string }[]): string => {
    const root: any = {};
    for (const file of files) {
      const path = file.path;
      if (typeof path !== 'string') continue;
  
      let current = root;
      const parts = path.split('/');
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = i === parts.length - 1 ? null : {};
        }
        current = current[part];
      }
    }
  
    function formatTree(node: any, prefix = ''): string {
      const entries = Object.entries(node);
      let result = '';
      entries.forEach(([key, value], index) => {
        const isLast = index === entries.length - 1;
        result += `${prefix}${isLast ? '└── ' : '├── '}${key}\n`;
        if (value !== null) {
          result += formatTree(value, `${prefix}${isLast ? '    ' : '│   '}`);
        }
      });
      return result;
    }
    return formatTree(root);
};
