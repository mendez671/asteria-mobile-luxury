// ===============================
// PHASE 4.1: FIREBASE CLIENT CONFIGURATION
// Client-side Firebase setup (no admin SDK)
// ===============================

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration (client-side only)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD-EHChC4FSxC6BolBqn-lFQrgRV_tGAlw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tag-inner-circle-v01.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tag-inner-circle-v01",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tag-inner-circle-v01.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "131840016551",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:131840016551:web:4e0d409289f0c451915b82",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VDVKDFHP47"
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
                             firebaseConfig.authDomain && 
                             firebaseConfig.projectId;

let app: any = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  // Initialize Firebase only if configured
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // FIX: Connect to the correct Firestore database name 'taginnercircle'
  db = getFirestore(app, 'taginnercircle');
} else {
  console.warn('Firebase configuration missing - running in development mode without Firebase');
}

export { app, auth, db };

// Connect to emulators in development (client-side only)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && auth && db) {
  // Only connect to emulators on client side in development
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Emulators already connected or not available
    console.log('Firebase emulators not connected:', error);
  }
} 