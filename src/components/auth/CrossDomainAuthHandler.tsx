'use client';

import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/components/chat/hooks/useFirebaseAuth';

interface CrossDomainAuthProps {
  targetDomain: string;
  onAuthComplete: (user: any) => void;
  onAuthError: (error: string) => void;
}

export function CrossDomainAuthHandler({ 
  targetDomain, 
  onAuthComplete, 
  onAuthError 
}: CrossDomainAuthProps) {
  const { user: currentUser, loading, signInWithToken } = useFirebaseAuth();
  const [authStep, setAuthStep] = useState<'idle' | 'authenticating' | 'redirecting'>('idle');
  const [inboundToken, setInboundToken] = useState<string | null>(null);

  // SURGICAL FIX: Add inbound authentication handler
  const handleInboundAuthentication = async (token: string, tier: string | null) => {
    try {
      console.log('🔄 Processing inbound authentication token...');
      setAuthStep('authenticating');
      
      // Use signInWithToken to authenticate
      await signInWithToken(token);
      
      // Clean URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      console.log('✅ Inbound authentication successful');
      
      // CRITICAL FIX: Wait for auth state to update, then call success
      // Don't call onAuthComplete immediately - let useEffect handle it when currentUser updates
      
    } catch (error: any) {
      console.error('❌ Inbound authentication failed:', error);
      onAuthError(error.message || 'Authentication failed');
      setAuthStep('idle');
    }
  };

  const handleCrossDomainAuth = async () => {
    setAuthStep('authenticating');
    
    try {
      // 1. Check if user is already authenticated
      if (!currentUser) {
        throw new Error('User must be authenticated first');
      }
      
      const user = currentUser;
      
      // 2. Get fresh ID token
      const idToken = await user.getIdToken(true);
      
      // 3. Validate token has custom claims
      const tokenResult = await user.getIdTokenResult();
      if (!tokenResult.claims.memberTier) {
        throw new Error('Member tier not found in token');
      }

      // 4. Prepare cross-domain redirect
      const redirectUrl = new URL('/auth/callback', targetDomain);
      redirectUrl.searchParams.set('token', idToken);
      redirectUrl.searchParams.set('tier', tokenResult.claims.memberTier as string);
      redirectUrl.searchParams.set('origin', window.location.origin);
      
      // Preserve original redirect URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const originalRedirect = urlParams.get('redirect');
      if (originalRedirect) {
        redirectUrl.searchParams.set('redirect', originalRedirect);
      }

      setAuthStep('redirecting');
      
      // 5. Redirect to target domain
      window.location.href = redirectUrl.toString();
      
    } catch (error: any) {
      console.error('Cross-domain auth failed:', error);
      onAuthError(error.message);
      setAuthStep('idle');
    }
  };

  // SURGICAL FIX: Handle both inbound and outbound authentication flows
  useEffect(() => {
    // Check for inbound token first
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const tier = urlParams.get('tier');
    
    if (token && !currentUser && !inboundToken) {
      // Inbound flow: process token from URL
      console.log('🔍 Detected inbound authentication token');
      setInboundToken(token);
      handleInboundAuthentication(token, tier);
    } else if (currentUser && authStep === 'idle' && !inboundToken) {
      // Outbound flow: redirect authenticated user
      console.log('🔄 Processing outbound authentication for authenticated user');
      handleCrossDomainAuth();
    }
  }, [currentUser, authStep, inboundToken]);

  // CRITICAL FIX: Handle successful authentication after user state updates
  useEffect(() => {
    if (currentUser && inboundToken && authStep === 'authenticating') {
      console.log('✅ Authentication completed, user state updated');
      onAuthComplete(currentUser);
      setAuthStep('idle');
      setInboundToken(null);
    }
  }, [currentUser, inboundToken, authStep]);

  return (
    <div className="auth-handler min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">ASTERIA Authentication</h1>
            <p className="text-white/70">Secure access to your luxury concierge services</p>
          </div>

          {authStep === 'idle' && (
            <div className="space-y-4">
              <button 
                onClick={handleCrossDomainAuth} 
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                disabled={loading}
              >
                {loading ? 'Initializing...' : 'Sign in to ASTERIA'}
              </button>
              <p className="text-xs text-white/50 text-center">
                Secure authentication powered by Firebase
              </p>
            </div>
          )}
          
          {authStep === 'authenticating' && inboundToken && (
            <div className="text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Processing Authentication...</h3>
                <p className="text-white/70">Signing you in with your credentials</p>
              </div>
            </div>
          )}
          
          {authStep === 'authenticating' && !inboundToken && (
            <div className="text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Authenticating...</h3>
                <p className="text-white/70">Verifying your credentials with ASTERIA</p>
              </div>
            </div>
          )}
          
          {authStep === 'redirecting' && (
            <div className="text-center space-y-4">
              <div className="inline-block animate-pulse rounded-full h-8 w-8 bg-green-400"></div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Authentication Successful</h3>
                <p className="text-white/70">Redirecting to ASTERIA dashboard...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 