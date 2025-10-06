
'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getSdks } from '@/firebase';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // getSdks is the source of truth for server-safe Firebase instances.
  const { firebaseApp, auth, firestore } = useMemo(() => getSdks(), []);
  
  // Storage, Analytics, and Crashlytics are client-side only and initialized here.
  const storage = useMemo(() => getStorage(firebaseApp), [firebaseApp]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [crashlytics, setCrashlytics] = useState<any>(null);

  useEffect(() => {
    isAnalyticsSupported().then(supported => {
      if (supported) {
        setAnalytics(getAnalytics(firebaseApp));
      }
    });
    
    if (firebaseApp) {
      import('firebase/crashlytics').then(({ getCrashlytics, isSupported }) => {
        isSupported().then((supported) => {
          if (supported) {
            setCrashlytics(getCrashlytics(firebaseApp));
          }
        });
      }).catch(err => console.error("Failed to load Firebase Crashlytics", err));
    }
  }, [firebaseApp]);

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
