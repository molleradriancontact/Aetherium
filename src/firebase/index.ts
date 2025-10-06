
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { DependencyList, useMemo } from 'react';

let app: FirebaseApp;
let appInitialized = false;

function ensureFirebaseInitialized() {
  if (appInitialized) return;

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  appInitialized = true;
}


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  ensureFirebaseInitialized();
  const auth = getAuth(app);
  // Do not await this promise. It's a non-blocking call.
  // The onAuthStateChanged listener will handle the user state once persistence is resolved.
  setPersistence(auth, inMemoryPersistence);
  return getSdks();
}

export function getSdks() {
  ensureFirebaseInitialized();
  const services = {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    analytics: undefined,
  };

  if (typeof window !== 'undefined') {
    isAnalyticsSupported().then(supported => {
        if (supported) {
            (services as any).analytics = getAnalytics(app);
        }
    });
  }

  return services;
}

type MemoFirebase<T> = T & { __memo?: boolean };

/**
 * A hook to memoize Firebase queries or references.
 * It adds a non-enumerable property `__memo` to the returned object,
 * which is used by `useCollection` and `useDoc` to enforce memoization.
 * 
 * @param factory A function that creates the Firebase query or reference.
 * @param deps The dependency array for the `useMemo` hook.
 * @returns The memoized Firebase object.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);

  if (typeof memoized === 'object' && memoized !== null) {
    Object.defineProperty(memoized, '__memo', {
      value: true,
      enumerable: false,
      configurable: true,
    });
  }

  return memoized;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
