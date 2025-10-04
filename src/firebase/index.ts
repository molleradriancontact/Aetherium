'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app: FirebaseApp;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  // Set persistence to session before returning the auth instance.
  setPersistence(auth, browserSessionPersistence);
    
  return getSdks(app);
}

export function getSdks(app?: FirebaseApp) {
  if (!app) {
    if (getApps().length) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      setPersistence(auth, browserSessionPersistence);
    }
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
