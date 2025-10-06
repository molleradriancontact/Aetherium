
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getSdks } from '@/firebase';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // getSdks is the source of truth for server-safe Firebase instances.
  const { firebaseApp, auth, firestore } = useMemo(() => getSdks(), []);
  
  // Storage and Analytics are client-side only and are initialized here.
  const storage = useMemo(() => getStorage(firebaseApp), [firebaseApp]);
  const [analytics, setAnalytics] = React.useState<any>(null);

  React.useEffect(() => {
    isSupported().then(supported => {
      if (supported) {
        setAnalytics(getAnalytics(firebaseApp));
      }
    });
  }, [firebaseApp]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
      storage={storage}
      analytics={analytics}
    >
      {children}
    </FirebaseProvider>
  );
}
