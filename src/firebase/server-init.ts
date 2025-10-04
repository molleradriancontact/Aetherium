
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

let adminApp: App;

function initializeAdminApp(): App {
    if (getApps().some(app => app.name === 'admin')) {
        return getApp('admin');
    }

    // By not passing any credential, Firebase Admin SDK will use Application Default Credentials
    // which are automatically available in this environment.
    adminApp = initializeApp({}, 'admin');
    return adminApp;
}

export function getAdminApp(): App {
    if (!adminApp) {
        return initializeAdminApp();
    }
    return adminApp;
}

export function getAdminAuth(): Auth {
    return getAuth(getAdminApp());
}
