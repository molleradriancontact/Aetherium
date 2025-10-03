'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    
    // Initialize App Check
    if (typeof window !== 'undefined') {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6Lce_v0pAAAAAP_Z1E9_eETI2aX2_5Y2tW_sKIbH'), // Replace with your reCAPTCHA v3 site key
        isTokenAutoRefreshEnabled: true
      });
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