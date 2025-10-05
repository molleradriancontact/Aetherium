'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import type { UploadedFile, CollaboratorDetails } from '@/app/provider';
import React, { createContext, useContext } from 'react';
import type { Message } from '@/ai/flows/schemas';

export type HistoryItem = { id: number, message: string; timestamp: Date };

export type AppState = {
  isHydrated: boolean;
  detailedStatus: string | null;
  setDetailedStatus: (status: string | null) => void;
  analysisReport: string | null;
  setAnalysisReport: (report: string | null) => void;
  frontendSuggestions: SuggestFrontendChangesFromAnalysisOutput | null;
  setFrontendSuggestions: (suggestions: SuggestFrontendChangesFromAnalysisOutput | null) => void;
  backendSuggestions: SuggestBackendChangesFromAnalysisOutput | null;
  setBackendSuggestions: (suggestions: SuggestBackendChangesFromAnalysisOutput | null) => void;
  history: HistoryItem[];
  addHistory: (message: string) => void;
  clearState: (forceNav?: boolean) => void;
  projectId: string | null;
  setProjectId: (id: string | null, path?: string | null) => void;
  uploadedFiles: UploadedFile[];
  startAnalysis: (files: UploadedFile[], isPublic?: boolean) => Promise<string>;
  chatHistory: Message[];
  startChat: (initialMessage: Message, isPublic?: boolean) => Promise<string>;
  addChatMessage: (projectId: string, message: Message) => Promise<void>;
  projectName: string;
  projectType: 'analysis' | 'chat' | null;
  projectOwnerId: string | null;
  collaboratorDetails: CollaboratorDetails[];
};

export const AppStateContext = createContext<AppState | null>(null);

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
