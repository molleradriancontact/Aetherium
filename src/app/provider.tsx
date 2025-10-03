
'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { AppStateContext, HistoryItem } from '@/hooks/use-app-state';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, query, orderBy, limit } from 'firebase/firestore';

// Define the shape of a project document in Firestore
export interface ArchitectProject {
    id: string;
    userId: string;
    name: string;
    createdAt: any; // Using 'any' for serverTimestamp flexibility
    analysisReport?: string | null;
    frontendSuggestions?: SuggestFrontendChangesFromAnalysisOutput | null;
    backendSuggestions?: SuggestBackendChangesFromAnalysisOutput | null;
    history?: HistoryItem[];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [projectId, setProjectId] = useState<string | null>(null);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [frontendSuggestions, setFrontendSuggestions] = useState<SuggestFrontendChangesFromAnalysisOutput | null>(null);
  const [backendSuggestions, setBackendSuggestions] = useState<SuggestBackendChangesFromAnalysisOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const projectRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Effect to load the most recent project for the current user
  useEffect(() => {
    if (isUserLoading || !user) {
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
        
        const historyWithDates = (projectData.history || []).map(h => ({...h, timestamp: (h.timestamp as any).toDate()}));
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
      history: history.map(h => ({...h, timestamp: h.timestamp.toISOString() as any}))
    };
    
    setDoc(projectRef.current, dataToSave, { merge: true })
      .catch(console.error);

  }, [analysisReport, frontendSuggestions, backendSuggestions, history, isLoading]);


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
    if (resetLoading) {
      setIsLoading(false);
    }
  }, []);

  const createProject = async (name: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    
    const newProjectRef = doc(collection(firestore, 'users', user.uid, 'projects'));
    const newProject: ArchitectProject = {
      id: newProjectRef.id,
      userId: user.uid,
      name,
      createdAt: serverTimestamp(),
      history: [],
    };

    await setDoc(newProjectRef, newProject);
    projectRef.current = newProjectRef;
    setProjectId(newProjectRef.id);
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
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
