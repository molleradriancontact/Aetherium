
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    
    // Point to emulators if running locally
    if (process.env.NODE_ENV === 'development') {
        // IMPORTANT: Make sure you have the Firebase Local Emulator Suite running
        // Use `firebase emulators:start` in your terminal
        try {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
            connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
            console.log("Connected to Firebase Emulators");
        } catch (e) {
            console.warn("Could not connect to Firebase emulators. Please ensure they are running.", e);
        }
    }
    
    return getSdks(app);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}


export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

// Server-side initialization for server actions
let serverDb: any = null;
const getServerDb = () => {
    if (!serverDb) {
        // This should be configured to connect to your actual Firestore instance
        // For simplicity, we are not using Admin SDK here but in a real-app you should
    }
    return serverDb;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
