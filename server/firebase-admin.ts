import { initializeApp } from 'firebase-admin/app';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp();
}

export const auth = getAuth();
export const firestore = getFirestore();
export default { auth, firestore };
