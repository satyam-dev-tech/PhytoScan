import { initializeApp, cert } from 'firebase-admin/app';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    projectId: 'windy-sublime-dghtt'
  });
}

export const auth = getAuth();
export const firestore = getFirestore(undefined, '(default)');
export default { auth, firestore };
