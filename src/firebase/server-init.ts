
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

// IMPORTANT: Do not check this file into source control
// Your service account key should be stored securely (e.g., in environment variables)
// For this example, we are using a simplified setup.
// In a real production environment, you would use something like:
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Fallback for local development if environment variable is not set
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : {
        "projectId": "studio-8445938843-5d2ed",
        // This is a placeholder private key. Replace with your actual key for server-side operations.
        "privateKey": "-----BEGIN PRIVATE KEY-----\n...your...private...key...\n-----END PRIVATE KEY-----\n",
        "clientEmail": "firebase-adminsdk-....iam.gserviceaccount.com"
      };

const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApp();

export const db = getFirestore(app);
