'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  const isSigningOut = useRef(false);

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }
  
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
        isSigningOut.current = false;
      } else {
        if (isSigningOut.current) {
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
        } else {
          signInAnonymously(auth).catch((error) => {
            console.error("FirebaseProvider: Anonymous sign-in failed.", error);
            setUserAuthState({ user: null, isUserLoading: false, userError: error });
          });
        }
      }
    }, (error) => {
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUserAuthState({ user: null, isUserLoading: false, userError: error });
    });

    const originalSignOut = auth.signOut.bind(auth);
    auth.signOut = async () => {
        isSigningOut.current = true;
        await originalSignOut();
    };
  
    return () => {
        unsubscribe();
        auth.signOut = originalSignOut;
    };
  }, [auth]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
