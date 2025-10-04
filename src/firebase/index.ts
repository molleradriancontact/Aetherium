'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app: FirebaseApp;
let appInitialized = false;

function ensureFirebaseInitialized() {
  if (appInitialized) return;

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  // Do not await this promise. It's a non-blocking call.
  // The onAuthStateChanged listener will handle the user state once persistence is resolved.
  setPersistence(auth, browserSessionPersistence);
  appInitialized = true;
}


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  ensureFirebaseInitialized();
  return getSdks();
}

export function getSdks() {
  ensureFirebaseInitialized();
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

    
