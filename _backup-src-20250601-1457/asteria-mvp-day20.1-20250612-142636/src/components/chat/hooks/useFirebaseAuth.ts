// ===============================
// PHASE 4.3: FIREBASE AUTHENTICATION HOOK
// React hook for luxury member authentication
// ===============================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { firebaseAuth, AuthUser, LuxuryMemberData } from '@/lib/firebase/auth';
import { MemberProfile } from '@/lib/agent/types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signInWithToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  createMember: (email: string, password: string, memberData: Partial<LuxuryMemberData>) => Promise<void>;
  updateMemberProfile: (updates: Partial<LuxuryMemberData>) => Promise<void>;
  verifyServiceAccess: (requiredTier: 'standard' | 'premium' | 'elite') => boolean;
  clearError: () => void;
}

export function useFirebaseAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChange((user) => {
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        isAuthenticated: !!user,
        error: null // Clear error on successful auth state change
      }));
    });

    return unsubscribe;
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await firebaseAuth.signIn(email, password);
      // Auth state will be updated via the listener
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Authentication failed'
      }));
      throw error;
    }
  }, []);

  // Sign in with custom token (for existing TAG system integration)
  const signInWithToken = useCallback(async (token: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await firebaseAuth.signInWithToken(token);
      // Auth state will be updated via the listener
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Token authentication failed'
      }));
      throw error;
    }
  }, []);

  // Create new member account
  const createMember = useCallback(async (
    email: string, 
    password: string, 
    memberData: Partial<LuxuryMemberData>
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await firebaseAuth.createMember(email, password, memberData);
      // Auth state will be updated via the listener
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Member creation failed'
      }));
      throw error;
    }
  }, []);

  // Update member profile
  const updateMemberProfile = useCallback(async (updates: Partial<LuxuryMemberData>) => {
    if (!state.user) {
      throw new Error('No authenticated user');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await firebaseAuth.updateMemberProfile(state.user.uid, updates);
      
      // Refresh user data
      const updatedProfile = await firebaseAuth.getMemberProfile(state.user.uid);
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, memberProfile: updatedProfile } : null,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Profile update failed'
      }));
      throw error;
    }
  }, [state.user]);

  // Sign out
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await firebaseAuth.signOut();
      // Auth state will be updated via the listener
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Sign out failed'
      }));
      throw error;
    }
  }, []);

  // Verify service access based on tier
  const verifyServiceAccess = useCallback((requiredTier: 'standard' | 'premium' | 'elite') => {
    return firebaseAuth.verifyServiceAccess(requiredTier);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    signIn,
    signInWithToken,
    signOut,
    createMember,
    updateMemberProfile,
    verifyServiceAccess,
    clearError
  };
}

// Helper hook to get member profile in agent system format
export function useMemberProfile(): MemberProfile | null {
  const { user } = useFirebaseAuth();
  return user?.memberProfile || null;
}

// Helper hook to check if user has access to specific service tier
export function useServiceAccess(requiredTier: 'standard' | 'premium' | 'elite'): boolean {
  const { verifyServiceAccess } = useFirebaseAuth();
  return verifyServiceAccess(requiredTier);
} 