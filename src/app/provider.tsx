
'use client';

import type { SuggestBackendChangesFromAnalysisOutput } from '@/ai/flows/suggest-backend-changes-from-analysis';
import type { SuggestFrontendChangesFromAnalysisOutput } from '@/ai/flows/suggest-frontend-changes-from-analysis';
import { AppStateContext } from '@/hooks/use-app-state';
import React, { useState, useEffect } from 'react';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [frontendSuggestions, setFrontendSuggestions] = useState<SuggestFrontendChangesFromAnalysisOutput | null>(null);
  const [backendSuggestions, setBackendSuggestions] = useState<SuggestBackendChangesFromAnalysisOutput | null>(null);
  const [history, setHistory] = useState<{ id: number, message: string; timestamp: Date }[]>([]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const addHistory = (message: string) => {
    setHistory(prev => [...prev, { id: Date.now(), message, timestamp: new Date() }]);
  };

  const clearState = () => {
    setIsLoading(false);
    setAnalysisReport(null);
    setFrontendSuggestions(null);
    setBackendSuggestions(null);
    setHistory([]);
  }

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
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
