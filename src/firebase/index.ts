
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  // Set persistence to session before returning the auth instance.
  setPersistence(auth, browserSessionPersistence);
    
  // App Check is disabled for now to prevent reCAPTCHA errors in development.
  // if (typeof window !== 'undefined') {
  //   initializeAppCheck(app, {
  //     provider: new ReCaptchaV3Provider('6Lce_v0pAAAAAP_Z1E9_eETI2aX2_5Y2tW_sKIbH'), // Replace with your reCAPTCHA v3 site key
  //     isTokenAutoRefreshEnabled: true
  //   });
  // }

  return getSdks(app);
}


export function getSdks(app?: FirebaseApp) {
  const firebaseApp = app || (getApps().length ? getApp() : initializeApp(firebaseConfig));
  const auth = getAuth(firebaseApp);
  return {
    firebaseApp,
    auth: auth,
    firestore: getFirestore(firebaseApp)
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
