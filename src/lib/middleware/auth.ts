// ===============================
// PHASE 4.4: FIREBASE AUTH MIDDLEWARE
// Server-side authentication verification for API routes
// ===============================

import { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { MemberProfile } from '@/lib/agent/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    memberProfile?: MemberProfile;
    tier: 'elite' | 'premium' | 'standard';
  };
}

export interface AuthenticationResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    memberProfile?: MemberProfile;
    tier: 'elite' | 'premium' | 'standard';
  };
  error?: string;
}

// Verify Firebase ID token from request headers
export async function verifyFirebaseAuth(request: NextRequest): Promise<AuthenticationResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No authorization token provided'
      };
    }

    const idToken = authHeader.split('Bearer ')[1];
    const { adminAuth, adminDb } = await getFirebaseAdmin();

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Get member profile from Firestore
    const memberDoc = await adminDb.collection('members').doc(decodedToken.uid).get();
    
    let memberProfile: MemberProfile | undefined;
    let tier: 'elite' | 'premium' | 'standard' = 'standard';
    
    if (memberDoc.exists) {
      const memberData = memberDoc.data();
      tier = memberData?.tier || 'standard';
      
      // Convert to agent system format
      memberProfile = {
        id: decodedToken.uid,
        name: memberData?.displayName || decodedToken.name || 'Valued Member',
        tier: tier,
        preferences: memberData?.preferences || {},
        serviceHistory: memberData?.serviceHistory || [],
        contactMethods: memberData?.contactMethods || []
      };
    }

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        memberProfile,
        tier
      }
    };
  } catch (error: any) {
    console.error('Firebase auth verification failed:', error);
    return {
      success: false,
      error: `Authentication failed: ${error.message}`
    };
  }
}

// Extract member info from request body (for non-authenticated requests)
export function extractMemberFromRequest(body: any): {
  memberProfile?: MemberProfile;
  firebaseUid?: string;
  isAuthenticated: boolean;
} {
  return {
    memberProfile: body.memberProfile,
    firebaseUid: body.firebaseUid,
    isAuthenticated: body.isAuthenticated || false
  };
}

// Create default member profile for guest users
export function createGuestProfile(sessionId: string): MemberProfile {
  return {
    id: `guest_${sessionId.substring(0, 8)}`,
    name: 'Guest User',
    tier: 'standard',
    preferences: {},
    serviceHistory: [],
    contactMethods: []
  };
}

// Verify service access based on member tier
export function verifyServiceAccess(
  userTier: 'elite' | 'premium' | 'standard',
  requiredTier: 'elite' | 'premium' | 'standard'
): boolean {
  const tierLevels = { standard: 1, premium: 2, elite: 3 };
  const userLevel = tierLevels[userTier];
  const requiredLevel = tierLevels[requiredTier];
  
  return userLevel >= requiredLevel;
}

// Enhanced member profile for authenticated users
export async function getEnhancedMemberProfile(uid: string): Promise<MemberProfile | null> {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const memberDoc = await adminDb.collection('members').doc(uid).get();
    
    if (!memberDoc.exists) {
      return null;
    }
    
    const memberData = memberDoc.data();
    
    return {
      id: uid,
      name: memberData?.displayName || 'Valued Member',
      tier: memberData?.tier || 'standard',
      preferences: memberData?.preferences || {},
      serviceHistory: (memberData?.serviceHistory || []).map((service: any) => ({
        id: service.id || `service_${Date.now()}`,
        serviceType: service.serviceType || 'unknown',
        completedAt: service.completedAt || new Date(),
        satisfaction: service.satisfaction || 0,
        notes: service.notes
      })),
      contactMethods: memberData?.contactMethods || []
    };
  } catch (error) {
    console.error('Error fetching enhanced member profile:', error);
    return null;
  }
}

// Update member last active timestamp
export async function updateMemberActivity(uid: string): Promise<void> {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const { FieldValue } = await import('firebase-admin/firestore');
    await adminDb.collection('members').doc(uid).update({
      lastActive: new Date(),
      totalInteractions: FieldValue.increment(1)
    });
  } catch (error) {
    console.error('Error updating member activity:', error);
  }
}

// Log service interaction for analytics
export async function logServiceInteraction(
  uid: string,
  serviceType: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const { adminDb } = await getFirebaseAdmin();
    
    // Add to member's interaction log
    await adminDb.collection('members').doc(uid).collection('interactions').add({
      timestamp: new Date(),
      serviceType,
      details,
      sessionId: details.sessionId
    });
    
    // Update member statistics
    await adminDb.collection('members').doc(uid).update({
      lastServiceType: serviceType,
      lastServiceDate: new Date()
    });
  } catch (error) {
    console.error('Error logging service interaction:', error);
  }
} 