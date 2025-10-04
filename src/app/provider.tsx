
'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { AppStateContext, HistoryItem } from '@/hooks/use-app-state';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebase } from '@/firebase';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { generateInitialAnalysisReport } from '@/ai/flows/generate-initial-analysis-report';
import { generateProjectName } from '@/ai/flows/generate-project-name';
import type { Message } from '@/ai/flows/schemas';

export interface UploadedFile {
    path: string;
    content: string;
}

export interface CollaboratorDetails {
  id: string;
  email: string;
  username: string;
  photoURL?: string | null;
}

export interface ArchitectProject {
    id: string;
    userId: string;
    name: string;
    createdAt: any;
    projectType: 'analysis' | 'chat';
    analysisReport?: string | null;
    frontendSuggestions?: SuggestFrontendChangesFromAnalysisOutput | null;
    backendSuggestions?: SuggestBackendChangesFromAnalysisOutput | null;
    history?: HistoryItem[];
    uploadedFiles?: UploadedFile[];
    chatHistory?: Message[];
    collaborators?: string[];
    collaboratorDetails?: CollaboratorDetails[];
}

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
  const [detailedStatus, setDetailedStatus] = useState<string | null>(null);
  
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
  const [frontendSuggestions, _setFrontendSuggestions] = useState<SuggestFrontendChangesFromAnalysisOutput | null>(null);
  const [backendSuggestions, _setBackendSuggestions] = useState<SuggestBackendChangesFromAnalysisOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [projectType, setProjectType] = useState<'analysis' | 'chat' | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  const clearState = useCallback((forceNav = false) => {
    setProjectId(null);
    setAnalysisReport(null);
    _setFrontendSuggestions(null);
    _setBackendSuggestions(null);
    setHistory([]);
    setUploadedFiles([]);
    setChatHistory([]);
    setProjectName('');
    setProjectType(null);
    setDetailedStatus(null);
    if (forceNav) {
        router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
    }
    
    if (isUserLoading || !user || !firestore) {
        if (!isUserLoading) {
            setDetailedStatus(null);
            if (projectId) clearState(false);
        }
        return;
    }

    if (!projectId) {
      // clearState(false); No need to clear if no project is selected
      setDetailedStatus(null);
      return;
    }

    setDetailedStatus("Loading project details");

    const docRef = doc(firestore, 'users', user.uid, 'projects', projectId);
    
    unsubscribeRef.current = onSnapshot(docRef, (snapshot: any) => {
        if (snapshot.exists()) {
            const projectData = snapshot.data() as ArchitectProject;
            setProjectName(projectData.name);
            setProjectType(projectData.projectType);
            setAnalysisReport(projectData.analysisReport || null);
            _setFrontendSuggestions(projectData.frontendSuggestions || null);
            _setBackendSuggestions(projectData.backendSuggestions || null);
            setUploadedFiles(projectData.uploadedFiles || []);
            setChatHistory(projectData.chatHistory || []);
            
            const historyWithDates = (projectData.history || []).map(h => ({...h, timestamp: (h.timestamp as any)?.toDate ? (h.timestamp as any).toDate() : new Date(h.timestamp)}));
            setHistory(historyWithDates);
        } else {
            console.warn(`Project with id ${projectId} not found.`);
            clearState(true);
        }
        setDetailedStatus(null);
    }, (error: any) => {
        console.error("Error loading project:", error);
        setDetailedStatus(null);
        clearState(true);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, isUserLoading, firestore, projectId, clearState]);


  const addHistory = useCallback(async (projectId: string, message: string) => {
    if (!user || !firestore) return;
    const currentHistory = (history || []).map(h => ({...h, timestamp: h.timestamp}));

    const newHistoryItem = { id: Date.now(), message, timestamp: new Date() };

    const updatedHistory = [...currentHistory, newHistoryItem];
    
    const projectRef = doc(firestore, 'users', user.uid, 'projects', projectId);
    await updateDoc(projectRef, { history: updatedHistory });
  }, [user, firestore, history]);


  const startAnalysis = useCallback(async (files: UploadedFile[]) => {
    if (!user || !firestore) {
      throw new Error("User or Firestore not available.");
    }
    
    setDetailedStatus("Creating new analysis project");
    clearState(false);

    const projectRef = doc(collection(firestore, 'users', user.uid, 'projects'));
    const newProjectId = projectRef.id;

    const initialProject: ArchitectProject = {
      id: newProjectId,
      userId: user.uid,
      name: `New Analysis - ${new Date().toLocaleString()}`,
      createdAt: serverTimestamp(),
      projectType: 'analysis',
      uploadedFiles: files,
      history: [{ id: Date.now(), message: 'Project created.', timestamp: new Date() }],
    };

    await setDoc(projectRef, initialProject);
    setProjectId(newProjectId);

    (async () => {
      try {
        const fileStructure = createTree(files.map(f => ({ path: f.path })));
        const codeSnippets = files.map(file => `--- ${file.path} ---\n${file.content}`).join('\n\n');

        setDetailedStatus('Generating project name...');
        await addHistory(newProjectId, 'Generating project name...');
        const nameResult = await generateProjectName({ fileContents: codeSnippets });
        await updateDoc(projectRef, { name: nameResult.projectName });

        setDetailedStatus('Generating analysis report...');
        await addHistory(newProjectId, 'Generating analysis report...');
        const reportResult = await generateInitialAnalysisReport({ fileStructure, codeSnippets });
        await updateDoc(projectRef, { analysisReport: reportResult.report });
        
        await addHistory(newProjectId, 'Analysis complete. You can now generate suggestions.');
      } catch (aiError: any) {
        console.error("AI analysis failed:", aiError);
        const errorMessage = aiError.message || "An unknown AI error occurred.";
        await addHistory(newProjectId, `Analysis failed: ${errorMessage}`);
      } finally {
        setDetailedStatus(null);
      }
    })();

    return newProjectId;
  }, [user, firestore, clearState, addHistory]);

  const startChat = useCallback(async (initialMessage: Message) => {
    if (!user || !firestore) throw new Error("User or Firestore not available.");
    
    setDetailedStatus("Starting new chat");

    const projectRef = doc(collection(firestore, 'users', user.uid, 'projects'));
    const newProjectId = projectRef.id;

    const initialChatProject: ArchitectProject = {
        id: newProjectId,
        userId: user.uid,
        name: initialMessage.content.substring(0, 30),
        createdAt: serverTimestamp(),
        projectType: 'chat',
        chatHistory: [initialMessage]
    };

    await setDoc(projectRef, initialChatProject);
    setProjectId(newProjectId);
    setDetailedStatus(null);
    return newProjectId;
  }, [user, firestore]);

  const addChatMessage = useCallback(async (projectId: string, message: Message) => {
    if (!user || !firestore) return;
    const projectRef = doc(firestore, 'users', user.uid, 'projects', projectId);
    const updatedHistory = [...(chatHistory || []), message];
    await updateDoc(projectRef, { chatHistory: updatedHistory });
  }, [user, firestore, chatHistory]);

  const setFrontendSuggestions = useCallback(async (suggestions: SuggestFrontendChangesFromAnalysisOutput | null) => {
      _setFrontendSuggestions(suggestions);
      if (projectId && user && firestore) {
          const projectRef = doc(firestore, 'users', user.uid, 'projects', projectId);
          await updateDoc(projectRef, { frontendSuggestions: suggestions });
      }
  }, [projectId, user, firestore]);

  const setBackendSuggestions = useCallback(async (suggestions: SuggestBackendChangesFromAnalysisOutput | null) => {
      _setBackendSuggestions(suggestions);
      if (projectId && user && firestore) {
          const projectRef = doc(firestore, 'users', user.uid, 'projects', projectId);
          await updateDoc(projectRef, { backendSuggestions: suggestions });
      }
  }, [projectId, user, firestore]);

  const value = {
    isHydrated,
    detailedStatus,
    setDetailedStatus,
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
    chatHistory,
    startChat,
    addChatMessage,
    projectName,
    projectType,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
