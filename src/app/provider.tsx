
'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { AppStateContext, HistoryItem } from '@/hooks/use-app-state';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebase } from '@/firebase';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { generateInitialAnalysisReport } from '@/ai/flows/generate-initial-analysis-report';
import { suggestBackendChangesFromAnalysis } from '@/ai/flows/suggest-backend-changes-from-analysis';
import { suggestFrontendChangesFromAnalysis } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { generateProjectName } from '@/ai/flows/generate-project-name';

export interface UploadedFile {
    path: string;
    content: string;
}

// This interface now aligns better with the JSON schema
export interface ArchitectProject {
    id: string;
    userId: string;
    name: string;
    createdAt: any; // Using 'any' for serverTimestamp flexibility
    analysisReport?: string | null;
    frontendSuggestions?: SuggestFrontendChangesFromAnalysisOutput | null;
    backendSuggestions?: SuggestBackendChangesFromAnalysisOutput | null;
    history?: HistoryItem[];
    uploadedFiles?: UploadedFile[];
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


export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [projectId, _setProjectId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('selectedProjectId');
    }
    return null;
  });

  const setProjectId = (id: string | null) => {
    _setProjectId(id);
    if (typeof window !== 'undefined') {
      if (id) {
        sessionStorage.setItem('selectedProjectId', id);
      } else {
        sessionStorage.removeItem('selectedProjectId');
      }
    }
  };

  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [frontendSuggestions, setFrontendSuggestions] = useState<SuggestFrontendChangesFromAnalysisOutput | null>(null);
  const [backendSuggestions, setBackendSuggestions] = useState<SuggestBackendChangesFromAnalysisOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  const clearState = useCallback((forceNav = false) => {
    setProjectId(null);
    setAnalysisReport(null);
    setFrontendSuggestions(null);
    setBackendSuggestions(null);
    setHistory([]);
    setUploadedFiles([]);
    setIsLoading(false);
    if (forceNav) {
        router.push('/');
    }
  }, [router]);

  // Effect to load the selected project
  useEffect(() => {
    if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
    }
    
    if (isUserLoading || !user || !firestore) {
        if (!isUserLoading) {
            setIsLoading(false);
            clearState(false);
        }
        return;
    }

    let queryToUse;
    if (projectId) {
      queryToUse = doc(firestore, 'users', user.uid, 'projects', projectId);
    } else {
      // Fallback to the most recent project if no ID is selected
      const projectsColRef = collection(firestore, 'users', user.uid, 'projects');
      queryToUse = query(projectsColRef, orderBy('createdAt', 'desc'), limit(1));
    }

    setIsLoading(true);

    const handleSnapshot = (snapshot: any) => {
        let projectData: ArchitectProject | null = null;
        let finalProjectId: string | null = null;

        if ('docs' in snapshot) { // This is a QuerySnapshot
            if (!snapshot.empty) {
                const projectDoc = snapshot.docs[0];
                projectData = projectDoc.data() as ArchitectProject;
                finalProjectId = projectDoc.id;
            }
        } else { // This is a DocumentSnapshot
            if (snapshot.exists()) {
                projectData = snapshot.data() as ArchitectProject;
                finalProjectId = snapshot.id;
            }
        }

        if (projectData && finalProjectId) {
            setProjectId(finalProjectId);
            setAnalysisReport(projectData.analysisReport || null);
            setFrontendSuggestions(projectData.frontendSuggestions || null);
            setBackendSuggestions(projectData.backendSuggestions || null);
            setUploadedFiles(projectData.uploadedFiles || []);
            
            const historyWithDates = (projectData.history || []).map(h => ({...h, timestamp: (h.timestamp as any)?.toDate ? (h.timestamp as any).toDate() : new Date(h.timestamp)}));
            setHistory(historyWithDates);

        } else {
             // If specific project not found or no projects exist
            if (projectId) setProjectId(null); // Clear invalid project ID
            clearState(false);
        }
        setIsLoading(false);
    };

    const handleError = (error: any) => {
        console.error("Error loading project:", error);
        setIsLoading(false);
        clearState(false);
        setProjectId(null); // Clear invalid ID
    };

    if (projectId) {
        unsubscribeRef.current = onSnapshot(doc(firestore, 'users', user.uid, 'projects', projectId), handleSnapshot, handleError);
    } else {
        const projectsColRef = collection(firestore, 'users', user.uid, 'projects');
        const q = query(projectsColRef, orderBy('createdAt', 'desc'), limit(1));
        unsubscribeRef.current = onSnapshot(q, handleSnapshot, handleError);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, isUserLoading, firestore, projectId, clearState]);


  const addHistory = useCallback(async (projectId: string, message: string) => {
    if (!user || !firestore) return;
    // We get the current history from state to avoid a read, but in a real-world concurrent
    // scenario, you might want to use a transaction or FieldValue.arrayUnion.
    const currentHistory = (history || []).map(h => ({...h, timestamp: h.timestamp}));

    const newHistoryItem = { id: Date.now(), message, timestamp: new Date() };

    const updatedHistory = [...currentHistory, newHistoryItem];
    
    const projectRef = doc(firestore, 'users', user.uid, 'projects', projectId);
    await updateDoc(projectRef, { history: updatedHistory });
    // The onSnapshot listener will update the local state.
  }, [user, firestore, history]);


  const startAnalysis = useCallback(async (files: UploadedFile[]) => {
    if (!user || !firestore) {
      throw new Error("User or Firestore not available.");
    }
    
    setIsLoading(true);
    clearState(false);

    // 1. Create the initial project document
    const projectRef = doc(collection(firestore, 'users', user.uid, 'projects'));
    const newProjectId = projectRef.id;

    const initialProject: ArchitectProject = {
      id: newProjectId,
      userId: user.uid,
      name: `New Project - ${new Date().toLocaleString()}`,
      createdAt: serverTimestamp(),
      uploadedFiles: files,
      history: [{ id: Date.now(), message: 'Project created.', timestamp: new Date() }],
    };

    await setDoc(projectRef, initialProject);
    setProjectId(newProjectId); // Switch to the new project

    // Prepare data for AI flows
    const fileStructure = createTree(files.map(f => ({ path: f.path })));
    const codeSnippets = files
      .map(file => `--- ${file.path} ---\n${file.content}`)
      .join('\n\n');

    // 2. Asynchronously run all AI flows and update the document
    (async () => {
      try {
        await addHistory(newProjectId, 'Generating project name...');
        const nameResult = await generateProjectName({ fileContents: codeSnippets });
        await updateDoc(projectRef, { name: nameResult.projectName });

        await addHistory(newProjectId, 'Generating analysis report...');
        const reportResult = await generateInitialAnalysisReport({ fileStructure, codeSnippets });
        await updateDoc(projectRef, { analysisReport: reportResult.report });
        
        await addHistory(newProjectId, 'Generating frontend suggestions...');
        const frontendResult = await suggestFrontendChangesFromAnalysis({ analysisReport: reportResult.report });
        await updateDoc(projectRef, { frontendSuggestions: frontendResult });

        await addHistory(newProjectId, 'Generating backend suggestions...');
        const backendResult = await suggestBackendChangesFromAnalysis({ fileStructureAnalysis: reportResult.report });
        await updateDoc(projectRef, { backendSuggestions: backendResult });

        await addHistory(newProjectId, 'Analysis complete.');
      } catch (aiError: any) {
        console.error("AI analysis failed:", aiError);
        const errorMessage = aiError.message || "An unknown AI error occurred.";
        try {
          await addHistory(newProjectId, `Analysis failed: ${errorMessage}`);
        } catch (updateError) {
          console.error("Failed to write AI error to Firestore history:", updateError);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return newProjectId;
  }, [user, firestore, clearState, addHistory]);

  const value = {
    isHydrated,
    isLoading,
    setIsLoading,
    analysisReport,
    setAnalysisReport,
    frontendSuggestions,
    setFrontendSuggestions,
    backendSuggestions,
    setBackendSuggestions,
    history,
    addHistory: (message: string) => {
      if (projectId) {
        addHistory(projectId, message);
      }
    },
    clearState,
    projectId,
    setProjectId,
    uploadedFiles,
    setUploadedFiles,
    startAnalysis,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

    
