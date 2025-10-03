
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

let adminApp: App;
let adminAuth: Auth;

function initializeAdminApp(): App {
    if (getApps().some(app => app.name === 'admin')) {
        return getApp('admin');
    }

    // By not passing any credential, Firebase Admin SDK will use Application Default Credentials
    // which are automatically available in this environment.
    return initializeApp({}, 'admin');
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
