
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getSdks } from '@/firebase';
import { getStorage } from 'firebase/storage';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // getSdks is now the single source of truth for getting Firebase instances.
  // It ensures Firebase is initialized only once.
  const { firebaseApp, auth, firestore, analytics, crashlytics } = useMemo(() => getSdks(), []);
  const storage = useMemo(() => getStorage(firebaseApp), [firebaseApp]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
      storage={storage}
      analytics={analytics}
      crashlytics={crashlytics}
    >
      {children}
    </FirebaseProvider>
  );
}
