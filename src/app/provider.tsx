
'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { AppStateContext, HistoryItem } from '@/hooks/use-app-state';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebase } from '@/firebase'; // Using useFirebase now
import { collection, doc, onSnapshot, serverTimestamp, setDoc, query, orderBy, limit } from 'firebase/firestore';

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, firestore } = useFirebase();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [projectId, setProjectId] = useState<string | null>(null);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [frontendSuggestions, setFrontendSuggestions] = useState<SuggestFrontendChangesFromAnalysisOutput | null>(null);
  const [backendSuggestions, setBackendSuggestions] = useState<SuggestBackendChangesFromAnalysisOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const projectRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Effect to load the most recent project for the current user
  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      if (!isUserLoading) {
        setIsLoading(false);
        clearState();
      }
      return;
    }

    setIsLoading(true);
    const projectsColRef = collection(firestore, 'users', user.uid, 'projects');
    const q = query(projectsColRef, orderBy('createdAt', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const projectDoc = snapshot.docs[0];
        const projectData = projectDoc.data() as ArchitectProject;
        
        isUpdatingRef.current = true;
        setProjectId(projectDoc.id);
        setAnalysisReport(projectData.analysisReport || null);
        setFrontendSuggestions(projectData.frontendSuggestions || null);
        setBackendSuggestions(projectData.backendSuggestions || null);
        setUploadedFiles(projectData.uploadedFiles || []);
        
        // Firestore timestamps need to be converted to JS Dates
        const historyWithDates = (projectData.history || []).map(h => ({...h, timestamp: (h.timestamp as any).toDate ? (h.timestamp as any).toDate() : new Date(h.timestamp)}));
        setHistory(historyWithDates);

        projectRef.current = doc(firestore, 'users', user.uid, 'projects', projectDoc.id);

        setTimeout(() => isUpdatingRef.current = false, 100);
      } else {
        clearState(false);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error loading project:", error);
      setIsLoading(false);
      clearState(false);
    });

    return () => unsubscribe();
  }, [user, isUserLoading, firestore]);
  
  // Effect to save changes back to Firestore
  useEffect(() => {
    if (!projectRef.current || isUpdatingRef.current || isLoading) return;

    const dataToSave: Partial<ArchitectProject> = {
      analysisReport,
      frontendSuggestions,
      backendSuggestions,
      history,
      uploadedFiles,
    };
    
    // Using { merge: true } to avoid overwriting fields
    setDoc(projectRef.current, dataToSave, { merge: true })
      .catch(console.error);

  }, [analysisReport, frontendSuggestions, backendSuggestions, history, uploadedFiles, isLoading]);


  const addHistory = useCallback((message: string) => {
    setHistory(prev => [...prev, { id: Date.now(), message, timestamp: new Date() }]);
  }, []);

  const clearState = useCallback((resetLoading = true) => {
    projectRef.current = null;
    setProjectId(null);
    setAnalysisReport(null);
    setFrontendSuggestions(null);
    setBackendSuggestions(null);
    setHistory([]);
    setUploadedFiles([]);
    if (resetLoading) {
      setIsLoading(false);
    }
  }, []);

  const createProject = async (name: string, files: UploadedFile[]): Promise<string> => {
    if (!user || !firestore) throw new Error("User not authenticated or Firestore not available");
    
    const newProjectRef = doc(collection(firestore, 'users', user.uid, 'projects'));
    const newProject: ArchitectProject = {
      id: newProjectRef.id,
      userId: user.uid,
      name,
      createdAt: serverTimestamp(),
      history: [],
      uploadedFiles: files,
    };

    await setDoc(newProjectRef, newProject);
    projectRef.current = newProjectRef;
    setProjectId(newProjectRef.id);
    setUploadedFiles(files);
    return newProjectRef.id;
  };

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
    addHistory,
    clearState,
    createProject,
    projectId,
    uploadedFiles,
    setUploadedFiles,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
