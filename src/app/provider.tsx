
'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { AppStateContext, HistoryItem } from '@/hooks/use-app-state';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebase, useMemoFirebase, errorEmitter, FirestorePermissionError, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, collectionGroup, query, where, getDocs, getDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { generateInitialAnalysisReport } from '@/ai/flows/generate-initial-analysis-report';
import { generateProjectName } from '@/ai/flows/generate-project-name';
import type { Message } from '@/ai/flows/schemas';
import { chat } from '@/ai/flows/chat';

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
    id:string;
    userId: string;
    name: string;
    createdAt: any;
    projectType: 'analysis' | 'chat';
    isPublic?: boolean;
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
}


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

  const setProjectId = (id: string | null, path?: string | null) => {
    _setProjectId(id);
    if (typeof window !== 'undefined') {
      if (id) {
        sessionStorage.setItem('selectedProjectId', id);
        if (path) {
          sessionStorage.setItem(`projectPath_${id}`, path);
        }
      } else {
        sessionStorage.removeItem('selectedProjectId');
        if (projectId) { // Also remove old path if it exists
          sessionStorage.removeItem(`projectPath_${projectId}`);
        }
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
  const [projectOwnerId, setProjectOwnerId] = useState<string | null>(null);
  const [collaboratorDetails, setCollaboratorDetails] = useState<CollaboratorDetails[]>([]);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  const clearState = useCallback((forceNav = false) => {
    setProjectId(null); // This will also clear session storage
    setAnalysisReport(null);
    _setFrontendSuggestions(null);
    _setBackendSuggestions(null);
    setHistory([]);
    setUploadedFiles([]);
    setChatHistory([]);
    setProjectName('');
    setProjectType(null);
    setDetailedStatus(null);
    setProjectOwnerId(null);
    setCollaboratorDetails([]);
    if (forceNav) {
        router.push('/');
    }
  }, [router]);

  const setStateFromData = (projectData: ArchitectProject) => {
    setProjectName(projectData.name || '');
    setProjectType(projectData.projectType || null);
    setAnalysisReport(projectData.analysisReport || null);
    _setFrontendSuggestions(projectData.frontendSuggestions || null);
    _setBackendSuggestions(projectData.backendSuggestions || null);
    setUploadedFiles(projectData.uploadedFiles || []);
    setChatHistory(projectData.chatHistory || []);
    setProjectOwnerId(projectData.userId || null);
    setCollaboratorDetails(projectData.collaboratorDetails || []);
    const historyWithDates = (projectData.history || []).map(h => ({
        ...h,
        timestamp: (h.timestamp as any)?.toDate ? (h.timestamp as any).toDate() : new Date(h.timestamp)
    }));
    setHistory(historyWithDates);
  };


  useEffect(() => {
    if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
    }

    if (isUserLoading || !firestore) {
        if (!isUserLoading && projectId) {
            clearState(false);
        }
        return;
    }

    if (!projectId) {
        setDetailedStatus(null);
        return;
    }

    setDetailedStatus("Loading project details");

    const loadAndSubscribe = async () => {
        let docRef;
        const directPath = sessionStorage.getItem(`projectPath_${projectId}`);

        try {
            if (directPath) {
                docRef = doc(firestore, directPath);
            } else {
                console.warn(`Direct path for project ${projectId} not found in session storage. This should not happen with the new data model.`);
                clearState(true);
                return;
            }

            const docSnap = await getDoc(docRef);
             if (!docSnap.exists()) {
                 console.warn(`Project with direct path ${directPath} not found.`);
                 clearState(true);
                 return;
            }


            unsubscribeRef.current = onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const updatedData = doc.data() as ArchitectProject;
                    setStateFromData(updatedData);
                    setDetailedStatus(null); 
                } else {
                    console.warn(`Project with id ${projectId} was deleted.`);
                    clearState(true);
                }
            }, (error) => {
                console.error("Error listening to project:", error);
                clearState(true);
            });

        } catch (error) {
            console.error("Error loading project:", error);
            clearState(true);
        }
    };

    loadAndSubscribe();

    return () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }
    };
}, [firestore, projectId, isUserLoading, clearState]);


  const addHistory = useCallback(async (message: string) => {
    if (!user || !firestore || !projectId) return;

    const projectPath = sessionStorage.getItem(`projectPath_${projectId}`);
    if (!projectPath) return;

    const projectRef = doc(firestore, projectPath);

    const newHistoryItem = { id: Date.now(), message, timestamp: new Date() };
    
    // We don't need to set local state `setHistory` as onSnapshot will handle it.
    updateDocumentNonBlocking(projectRef, { history: [...history, newHistoryItem] });

  }, [user, firestore, projectId, history]);


  const startAnalysis = useCallback(async (files: UploadedFile[], isPublic: boolean = true) => {
    if (!user || !firestore) {
      throw new Error("User or Firestore not available.");
    }
    
    setDetailedStatus("Creating new analysis project");
    clearState(false);

    const collectionPath = 'projects';
    const projectRef = doc(collection(firestore, collectionPath));
    const newProjectId = projectRef.id;

    const userProfileRef = doc(firestore, 'users', user.uid);

    const initialProject: ArchitectProject = {
      id: newProjectId,
      userId: user.uid,
      name: `New Analysis - ${new Date().toLocaleString()}`,
      createdAt: serverTimestamp(),
      projectType: 'analysis',
      isPublic: isPublic,
      uploadedFiles: files,
      history: [{ id: Date.now(), message: 'Project created.', timestamp: new Date() }],
      collaborators: [user.uid],
      collaboratorDetails: [{
        id: user.uid,
        email: user.email!,
        username: user.displayName!,
        photoURL: user.photoURL
      }]
    };

    const batch = writeBatch(firestore);
    batch.set(projectRef, initialProject);
    batch.update(userProfileRef, {
        projects: arrayUnion({ projectId: newProjectId, projectPath: projectRef.path })
    });
    await batch.commit();
    
    setProjectId(newProjectId, projectRef.path);

    (async () => {
      try {
        const fileStructure = createTree(files.map(f => ({ path: f.path })));
        const codeSnippets = files.map(file => `--- ${file.path} ---\n${file.content}`).join('\n\n');

        setDetailedStatus('Generating project name...');
        await addHistory('Generating project name...');
        const nameResult = await generateProjectName({ fileContents: codeSnippets });
        updateDocumentNonBlocking(projectRef, { name: nameResult.projectName });

        setDetailedStatus('Generating analysis report...');
        await addHistory('Generating analysis report...');
        const reportResult = await generateInitialAnalysisReport({ fileStructure, codeSnippets });
        updateDocumentNonBlocking(projectRef, { analysisReport: reportResult.report });
        
        await addHistory('Analysis complete. You can now generate suggestions.');
      } catch (aiError: any) {
        console.error("AI analysis failed:", aiError);
        const errorMessage = aiError.message || "An unknown AI error occurred.";
        await addHistory(`Analysis failed: ${errorMessage}`);
      } finally {
        setDetailedStatus(null);
      }
    })();

    return newProjectId;
  }, [user, firestore, clearState, addHistory]);

  const startChat = useCallback(async (initialMessage: Message, isPublic: boolean = true): Promise<string> => {
    if (!user || !firestore) {
      throw new Error("User or Firestore not available.");
    }
  
    setDetailedStatus("Starting new chat...");
    clearState(false);
  
    const collectionPath = 'projects';
    const projectRef = doc(collection(firestore, collectionPath));
    const newProjectId = projectRef.id;
  
    const userProfileRef = doc(firestore, 'users', user.uid);

    setDetailedStatus("Thinking...");
    const result = await chat([initialMessage], initialMessage.content);
    const aiResponse: Message = { role: 'model', content: result.content };
    
    setDetailedStatus("Creating chat project...");
    const initialChatProject: ArchitectProject = {
      id: newProjectId,
      userId: user.uid,
      name: initialMessage.content.substring(0, 30),
      createdAt: serverTimestamp(),
      projectType: 'chat',
      isPublic: isPublic,
      chatHistory: [initialMessage, aiResponse],
      collaborators: [user.uid],
      collaboratorDetails: [{
        id: user.uid,
        email: user.email!,
        username: user.displayName!,
        photoURL: user.photoURL
      }]
    };
    
    const batch = writeBatch(firestore);
    batch.set(projectRef, initialChatProject);
    batch.update(userProfileRef, {
        projects: arrayUnion({ projectId: newProjectId, projectPath: projectRef.path })
    });
    await batch.commit();

    setProjectId(newProjectId, projectRef.path);
    return newProjectId;
  }, [user, firestore, clearState]);

  const addChatMessage = useCallback(async (projectId: string, message: Message) => {
    if (!firestore) return;
    
    const projectPath = sessionStorage.getItem(`projectPath_${projectId}`);
    if (!projectPath) return;

    const projectRef = doc(firestore, projectPath);
    
    const updatedHistory = [...(chatHistory || []), message];

    updateDocumentNonBlocking(projectRef, { chatHistory: updatedHistory });

  }, [firestore, chatHistory]);

  const setFrontendSuggestions = useCallback(async (suggestions: SuggestFrontendChangesFromAnalysisOutput | null) => {
      if (!projectId || !firestore) return;
      
      const projectPath = sessionStorage.getItem(`projectPath_${projectId}`);
      if (!projectPath) return;

      const projectRef = doc(firestore, projectPath);
      updateDocumentNonBlocking(projectRef, { frontendSuggestions: suggestions });
  }, [projectId, firestore]);

  const setBackendSuggestions = useCallback(async (suggestions: SuggestBackendChangesFromAnalysisOutput | null) => {
      if (!projectId || !firestore) return;
      const projectPath = sessionStorage.getItem(`projectPath_${projectId}`);
      if (!projectPath) return;

      const projectRef = doc(firestore, projectPath);
      updateDocumentNonBlocking(projectRef, { backendSuggestions: suggestions });
  }, [projectId, firestore]);

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
    addHistory,
    clearState,
    projectId,
    setProjectId,
    uploadedFiles,
    startAnalysis,
    chatHistory,
    startChat,
    addChatMessage,
    projectName,
    projectType,
    projectOwnerId,
    collaboratorDetails,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
