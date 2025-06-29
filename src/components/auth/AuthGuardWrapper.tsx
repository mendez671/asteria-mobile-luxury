'use client';

import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/components/chat/hooks/useFirebaseAuth';
import { useTierValidation } from '@/hooks/useTierValidation';
import { CrossDomainAuthHandler } from './CrossDomainAuthHandler';

interface AuthGuardWrapperProps {
  children: React.ReactNode;
  requiredTier?: 'admin' | 'founding10' | 'fifty-k' | 'corporate' | 'tag-connect';
}

export function AuthGuardWrapper({ 
  children, 
  requiredTier = 'tag-connect'
}: AuthGuardWrapperProps) {
  const { user, loading: authLoading } = useFirebaseAuth();
  const { hasAccess, loading: tierLoading } = useTierValidation(requiredTier);
  
  const [authStep, setAuthStep] = useState<'checking' | 'cross_domain' | 'authorized'>('checking');

  useEffect(() => {
    // Still loading - show spinner
    if (authLoading || tierLoading) {
      setAuthStep('checking');
      return;
    }

    // User authenticated with proper tier - show app
    if (user && hasAccess) {
      setAuthStep('authorized');
      return;
    }

    // Check if we're coming back FROM authentication (has token params)
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.has('token') || urlParams.has('tier');
    
    if (hasAuthParams && !user) {
      setAuthStep('cross_domain'); // Handle return flow
      return;
    }

    // SURGICAL FIX: Redirect to main domain for authentication
    if (!user && typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      const authUrl = `https://thriveachievegrow.com/auth?redirect=${encodeURIComponent(currentUrl)}`;
      console.log('🔀 Redirecting to main domain for authentication:', authUrl);
      window.location.href = authUrl;
      return;
    }

  }, [user, hasAccess, authLoading, tierLoading]);

  // Loading state
  if (authStep === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">ASTERIA</h2>
          <p className="text-white/70">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Handle return from authentication
  if (authStep === 'cross_domain') {
    return (
      <CrossDomainAuthHandler
        targetDomain="https://innercircle.thriveachievegrow.com"
        onAuthComplete={() => setAuthStep('authorized')}
        onAuthError={(error) => {
          console.error('Auth error:', error);
          // Retry authentication
          const currentUrl = window.location.href.split('?')[0]; // Remove params
          const authUrl = `https://thriveachievegrow.com/auth?redirect=${encodeURIComponent(currentUrl)}`;
          window.location.href = authUrl;
        }}
      />
    );
  }

  // Authorized - show main app
  return <>{children}</>;
}

export default AuthGuardWrapper;
