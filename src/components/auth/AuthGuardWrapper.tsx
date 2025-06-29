'use client';

import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/components/chat/hooks/useFirebaseAuth';
import { useTierValidation } from '@/hooks/useTierValidation';
import { CrossDomainAuthHandler } from './CrossDomainAuthHandler';
import { handleAuthError, logAuthSuccess } from '@/lib/utils/auth-error-handler';

interface AuthGuardWrapperProps {
  children: React.ReactNode;
  requiredTier?: 'admin' | 'founding10' | 'fifty-k' | 'corporate' | 'tag-connect';
}

export function AuthGuardWrapper({ 
  children, 
  requiredTier = 'tag-connect'
}: AuthGuardWrapperProps) {
  const { user, loading: authLoading, signInWithToken } = useFirebaseAuth();
  const { hasAccess, loading: tierLoading } = useTierValidation(requiredTier);
  
  const [authStep, setAuthStep] = useState<'checking' | 'cross_domain_check' | 'cross_domain' | 'authorized'>('checking');

  // PHASE 1 FIX: Cross-domain session detection
  const checkMainDomainAuth = async (): Promise<boolean> => {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Checking main domain authentication status...');
      
      // Attempt to check if user is authenticated on main domain
      const response = await fetch('https://thriveachievegrow.com/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const { authenticated, token } = await response.json();
        
        if (authenticated && token) {
          console.log('✅ Main domain authentication found, using existing session');
          // Use token directly instead of redirecting
          await signInWithToken(token);
          logAuthSuccess('cross_domain_check', Date.now() - startTime);
          return true;
        }
      }
      
      // No authentication found, but not an error
      logAuthSuccess('cross_domain_check', Date.now() - startTime);
      return false;
    } catch (error) {
      const authError = handleAuthError(error, 'cross_domain_check');
      console.log('⚠️ Main domain auth check failed:', authError.userMessage);
      return false;
    }
  };

  // PHASE 2 FIX: PostMessage token request
  const requestTokenFromParent = (): Promise<string | null> => {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      console.log('📬 Requesting authentication token via postMessage...');
      
      const messageHandler = (event: MessageEvent) => {
        if (event.origin === 'https://thriveachievegrow.com' && event.data.type === 'AUTH_TOKEN_RESPONSE') {
          console.log('✅ Received auth token via postMessage');
          window.removeEventListener('message', messageHandler);
          logAuthSuccess('postmessage', Date.now() - startTime);
          resolve(event.data.token);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Request token from parent/opener window
      const targetWindows = [window.parent, window.opener].filter(Boolean);
      targetWindows.forEach(targetWindow => {
        if (targetWindow && targetWindow !== window) {
          targetWindow.postMessage(
            { type: 'REQUEST_AUTH_TOKEN', origin: window.location.origin }, 
            'https://thriveachievegrow.com'
          );
        }
      });
      
      // Timeout after 3 seconds
      setTimeout(() => {
        const timeoutError = { code: 'TIMEOUT', message: 'PostMessage timeout' };
        const authError = handleAuthError(timeoutError, 'postmessage');
        console.log('⏱️ PostMessage auth timeout:', authError.userMessage);
        window.removeEventListener('message', messageHandler);
        resolve(null);
      }, 3000);
    });
  };

  useEffect(() => {
    const handleAuthentication = async () => {
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

      // ENHANCED AUTHENTICATION LOGIC - PHASE 1 & 2 IMPLEMENTATION
      if (!user && typeof window !== 'undefined') {
        setAuthStep('cross_domain_check');
        
        try {
          // Phase 1: Try cross-domain session check
          const hasMainDomainAuth = await checkMainDomainAuth();
          if (hasMainDomainAuth) {
            // Authentication successful via main domain session
            return;
          }
          
          // Phase 2: Try postMessage token request
          const token = await requestTokenFromParent();
          if (token) {
            console.log('🎯 Using token from postMessage communication');
            await signInWithToken(token);
            return;
          }
          
          console.log('🔀 No existing authentication found, redirecting to main domain auth');
          
                 } catch (error) {
           const authError = handleAuthError(error, 'cross_domain_check');
           console.error('❌ Cross-domain authentication failed:', authError.userMessage);
         }
        
        // Phase 3: Fallback to normal redirect (existing logic)
        const currentUrl = window.location.href;
        const authUrl = `https://thriveachievegrow.com/auth?redirect=${encodeURIComponent(currentUrl)}`;
        console.log('🔀 Redirecting to main domain for authentication:', authUrl);
        window.location.href = authUrl;
        return;
      }
    };

    handleAuthentication();
  }, [user, hasAccess, authLoading, tierLoading, signInWithToken]);

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

  // Cross-domain authentication check state
  if (authStep === 'cross_domain_check') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">ASTERIA</h2>
          <p className="text-white/70">Checking existing authentication...</p>
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
          // Enhanced retry with cross-domain check
          const retryAuthentication = async () => {
            const hasMainDomainAuth = await checkMainDomainAuth();
            if (!hasMainDomainAuth) {
              const currentUrl = window.location.href.split('?')[0]; // Remove params
              const authUrl = `https://thriveachievegrow.com/auth?redirect=${encodeURIComponent(currentUrl)}`;
              window.location.href = authUrl;
            }
          };
          retryAuthentication();
        }}
      />
    );
  }

  // Authorized - show main app
  return <>{children}</>;
}

export default AuthGuardWrapper;
