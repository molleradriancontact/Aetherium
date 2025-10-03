
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

let adminApp: App;
let adminAuth: Auth;

function initializeAdminApp(): App {
    if (getApps().some(app => app.name === 'admin')) {
        return getApp('admin');
    }

    const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? credential.applicationDefault()
        : undefined;

    return initializeApp({
        credential: creds,
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
