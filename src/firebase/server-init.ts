
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

let adminApp: App;
let adminAuth: Auth;

function initializeAdminApp(): App {
    if (getApps().some(app => app.name === 'admin')) {
        return getApp('admin');
    }

    // In a real production environment, you would use applicationDefault()
    // or another secure way to provide credentials. For this environment,
    // we assume the necessary environment variables are set.
    return initializeApp({
        // projectId, etc. might be auto-discovered from the environment
    }, 'admin');
}

export function getAdminApp(): App {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

export function getAdminAuth(): Auth {
    if (!adminAuth) {
        adminAuth = getAuth(getAdminApp());
    }
    return adminAuth;
}
