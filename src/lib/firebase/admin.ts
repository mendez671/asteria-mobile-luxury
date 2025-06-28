// ===============================
// PHASE 7.1: FIREBASE ADMIN CONFIGURATION - AUTHENTICATION FIX
// Server-side only Firebase Admin SDK setup with GCP Secret Manager integration
// ===============================

import { getSecretJSON } from '../utils/secrets';

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
    try {
      // FIX: Use service account credentials from GCP Secret Manager
      console.log('🔐 Loading Firebase service account credentials from GCP Secret Manager...');
      const serviceAccountKey = await getSecretJSON('firebase-service-account-key');
      
      // Initialize with service account credentials
      adminApp = initializeAdminApp({
        credential: cert(serviceAccountKey),
        projectId: 'tag-inner-circle-v01'
      });
      
      console.log('✅ Firebase Admin initialized with service account credentials from GCP Secret Manager');
    } catch (error) {
      console.error('❌ Firebase service account initialization failed:', error);
      
      // Fallback to local service account file
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Look for the newest service account file
        const serviceAccountPath = './firebase-service-account-20250628_003557.json';
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          adminApp = initializeAdminApp({
            credential: cert(serviceAccountKey),
            projectId: 'tag-inner-circle-v01'
          });
          console.log('✅ Firebase Admin initialized with local service account file');
        } else {
          throw new Error('Service account file not found');
        }
      } catch (localError) {
        console.error('❌ Local service account failed:', localError);
        
        // Final fallback to Application Default Credentials if available
        try {
          const { applicationDefault } = await import('firebase-admin/app');
          adminApp = initializeAdminApp({
            credential: applicationDefault(),
            projectId: 'tag-inner-circle-v01'
          });
          console.log('⚠️ Using fallback Application Default Credentials');
        } catch (fallbackError) {
          console.error('❌ Firebase initialization completely failed:', fallbackError);
          throw new Error('Firebase Admin SDK initialization failed - no valid credentials found');
        }
      }
    }
  } else {
    adminApp = adminApps[0];
  }

  return {
    adminAuth: getAdminAuth(adminApp),
    // Connect to the correct Firestore database name 'taginnercircle'
    adminDb: getAdminFirestore(adminApp, 'taginnercircle'),
    adminApp
  };
}; 