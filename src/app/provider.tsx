
'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { AppStateContext, HistoryItem } from '@/hooks/use-app-state';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebase } from '@/firebase'; // Using useFirebase now
import { collection, doc, onSnapshot, serverTimestamp, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

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
  
  const projectRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
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
            isUpdatingRef.current = true;
            setProjectId(finalProjectId);
            setAnalysisReport(projectData.analysisReport || null);
            setFrontendSuggestions(projectData.frontendSuggestions || null);
            setBackendSuggestions(projectData.backendSuggestions || null);
            setUploadedFiles(projectData.uploadedFiles || []);
            
            const historyWithDates = (projectData.history || []).map(h => ({...h, timestamp: (h.timestamp as any)?.toDate ? (h.timestamp as any).toDate() : new Date(h.timestamp)}));
            setHistory(historyWithDates);

            setTimeout(() => isUpdatingRef.current = false, 100);
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
}, [user, isUserLoading, firestore, projectId]);


  const addHistory = useCallback((message: string) => {
    setHistory(prev => [...prev, { id: Date.now(), message, timestamp: new Date() }]);
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
    projectId,
    setProjectId,
    uploadedFiles,
    setUploadedFiles,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
