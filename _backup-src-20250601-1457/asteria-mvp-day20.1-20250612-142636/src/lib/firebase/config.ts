// ===============================
// PHASE 4.1: FIREBASE CONFIGURATION
// Authentication and member profile management
// ===============================

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration (you'll need to add your Firebase project credentials)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only connect to emulators on client side in development
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Emulators already connected or not available
    console.log('Firebase emulators not connected:', error);
  }
}

export { app };

// Firebase Admin SDK configuration (server-side only)
export const getFirebaseAdmin = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK should only be used on the server side');
  }

  const { initializeApp: initializeAdminApp, getApps, cert } = await import('firebase-admin/app');
  const { getAuth: getAdminAuth } = await import('firebase-admin/auth');
  const { getFirestore: getAdminFirestore } = await import('firebase-admin/firestore');

  // Check if admin app is already initialized
  const adminApps = getApps();
  let adminApp;

  if (adminApps.length === 0) {
    // Initialize Firebase Admin
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    adminApp = initializeAdminApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    adminApp = adminApps[0];
  }

  return {
    adminAuth: getAdminAuth(adminApp),
    adminDb: getAdminFirestore(adminApp),
    adminApp
  };
}; 