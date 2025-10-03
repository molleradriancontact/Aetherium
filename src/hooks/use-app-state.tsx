
'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import React, { createContext, useContext } from 'react';

export type HistoryItem = { id: number, message: string; timestamp: Date };

export type AppState = {
  isHydrated: boolean;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  analysisReport: string | null;
  setAnalysisReport: (report: string | null) => void;
  frontendSuggestions: SuggestFrontendChangesFromAnalysisOutput | null;
  setFrontendSuggestions: (suggestions: SuggestFrontendChangesFromAnalysisOutput | null) => void;
  backendSuggestions: SuggestBackendChangesFromAnalysisOutput | null;
  setBackendSuggestions: (suggestions: SuggestBackendChangesFromAnalysisOutput | null) => void;
  history: HistoryItem[];
  addHistory: (message: string) => void;
  clearState: () => void;
  createProject: (name: string) => Promise<string>;
  projectId: string | null;
};

export const AppStateContext = createContext<AppState | null>(null);

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
