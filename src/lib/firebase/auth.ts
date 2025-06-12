// ===============================
// PHASE 4.2: FIREBASE AUTHENTICATION SERVICE
// Luxury member authentication and profile management
// ===============================

import { 
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from './client';
import { MemberProfile } from '@/lib/agent/types';

export interface AuthUser extends FirebaseUser {
  memberProfile?: MemberProfile;
}

export interface LuxuryMemberData {
  uid: string;
  email: string;
  displayName: string;
  tier: 'elite' | 'premium' | 'standard';
  memberSince: Date;
  preferences: Record<string, any>;
  serviceHistory: any[];
  contactMethods: any[];
  lastActive: Date;
  totalServices: number;
  satisfactionScore: number;
  // TAG specific fields
  tagMemberId?: string;
  billingAddress?: any;
  emergencyContact?: any;
  conciergeNotes?: string[];
}

class FirebaseAuthService {
  private currentUser: AuthUser | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Listen for auth state changes only if Firebase is configured
    if (auth) {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const memberProfile = await this.getMemberProfile(firebaseUser.uid);
          this.currentUser = {
            ...firebaseUser,
            memberProfile
          } as AuthUser;
        } else {
          this.currentUser = null;
        }
        
        // Notify all listeners
        this.authStateListeners.forEach(listener => listener(this.currentUser));
      });
    } else {
      console.warn('Firebase not configured - authentication features disabled');
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthUser> {
    if (!auth) {
      throw new Error('Firebase not configured');
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const memberProfile = await this.getMemberProfile(userCredential.user.uid);
      
      // Update last active
      await this.updateLastActive(userCredential.user.uid);
      
      return {
        ...userCredential.user,
        memberProfile
      } as AuthUser;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Sign in with custom token (for existing TAG system integration)
  async signInWithToken(customToken: string): Promise<AuthUser> {
    if (!auth) {
      throw new Error('Firebase not configured');
    }
    
    try {
      const userCredential = await signInWithCustomToken(auth, customToken);
      const memberProfile = await this.getMemberProfile(userCredential.user.uid);
      
      return {
        ...userCredential.user,
        memberProfile
      } as AuthUser;
    } catch (error: any) {
      console.error('Token sign in error:', error);
      throw new Error(`Token authentication failed: ${error.message}`);
    }
  }

  // Create new luxury member account
  async createMember(
    email: string, 
    password: string, 
    memberData: Partial<LuxuryMemberData>
  ): Promise<AuthUser> {
    if (!auth || !db) {
      throw new Error('Firebase not configured');
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (memberData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: memberData.displayName
        });
      }

      // Create member profile in Firestore
      const luxuryMemberData: LuxuryMemberData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: memberData.displayName || 'Valued Member',
        tier: memberData.tier || 'standard',
        memberSince: new Date(),
        preferences: memberData.preferences || {},
        serviceHistory: [],
        contactMethods: [
          {
            type: 'email',
            value: userCredential.user.email!,
            preferred: true
          }
        ],
        lastActive: new Date(),
        totalServices: 0,
        satisfactionScore: 0,
        ...memberData
      };

      await setDoc(doc(db, 'members', userCredential.user.uid), luxuryMemberData);

      const memberProfile = await this.getMemberProfile(userCredential.user.uid);
      
      return {
        ...userCredential.user,
        memberProfile
      } as AuthUser;
    } catch (error: any) {
      console.error('Member creation error:', error);
      throw new Error(`Member creation failed: ${error.message}`);
    }
  }

  // Get member profile from Firestore
  async getMemberProfile(uid: string): Promise<MemberProfile | undefined> {
    if (!db) {
      console.warn('Firestore not configured - returning undefined profile');
      return undefined;
    }
    
    try {
      const docRef = doc(db, 'members', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as LuxuryMemberData;
        
        // Convert to agent system format
        return {
          id: data.uid,
          name: data.displayName,
          tier: data.tier,
          preferences: data.preferences,
          serviceHistory: data.serviceHistory.map(service => ({
            id: service.id || `service_${Date.now()}`,
            serviceType: service.serviceType || 'unknown',
            completedAt: service.completedAt || new Date(),
            satisfaction: service.satisfaction || 0,
            notes: service.notes
          })),
          contactMethods: data.contactMethods
        };
      }
      
      return undefined;
    } catch (error) {
      console.error('Error fetching member profile:', error);
      return undefined;
    }
  }

  // Update member profile
  async updateMemberProfile(uid: string, updates: Partial<LuxuryMemberData>): Promise<void> {
    if (!db) {
      console.warn('Firestore not configured - cannot update profile');
      return;
    }
    
    try {
      const docRef = doc(db, 'members', uid);
      await updateDoc(docRef, {
        ...updates,
        lastActive: new Date()
      });
    } catch (error) {
      console.error('Error updating member profile:', error);
      throw error;
    }
  }

  // Update last active timestamp
  async updateLastActive(uid: string): Promise<void> {
    if (!db) {
      return; // Silently return if not configured
    }
    
    try {
      const docRef = doc(db, 'members', uid);
      await updateDoc(docRef, {
        lastActive: new Date()
      });
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    if (!auth) {
      console.warn('Firebase not configured - cannot sign out');
      return;
    }
    
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Add auth state listener
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Verify member tier for service access
  verifyServiceAccess(requiredTier: 'standard' | 'premium' | 'elite'): boolean {
    const user = this.getCurrentUser();
    if (!user?.memberProfile) return false;

    const tierLevels = { standard: 1, premium: 2, elite: 3 };
    const userLevel = tierLevels[user.memberProfile.tier];
    const requiredLevel = tierLevels[requiredTier];

    return userLevel >= requiredLevel;
  }

  // Search members by TAG member ID (for migration)
  async findMemberByTagId(tagMemberId: string): Promise<LuxuryMemberData | null> {
    if (!db) {
      console.warn('Firestore not configured - cannot search members');
      return null;
    }
    
    try {
      const q = query(
        collection(db, 'members'), 
        where('tagMemberId', '==', tagMemberId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as LuxuryMemberData;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding member by TAG ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const firebaseAuth = new FirebaseAuthService();
export default firebaseAuth; 