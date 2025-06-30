'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase/client'; // Adjust path as needed

/**
 * Main Domain Authentication Page
 * Purpose: Handle user authentication and redirect back to ASTERIA with token
 * Route: /auth?redirect=https://innercircle.thriveachievegrow.com
 */
export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email');

  const auth = getAuth(app);

  // Handle successful authentication
  const handleAuthSuccess = async (user: any) => {
    try {
      console.log('✅ [MAIN_DOMAIN] Authentication successful for:', user.email);
      
      // Get fresh ID token
      const idToken = await user.getIdToken(true);
      
      // Determine user tier (you'll need to implement this based on your logic)
      const userTier = await determineUserTier(user);
      
      if (redirectUrl) {
        // Redirect back to ASTERIA with token and tier
        const redirectUrlWithParams = new URL(redirectUrl);
        redirectUrlWithParams.searchParams.set('token', idToken);
        redirectUrlWithParams.searchParams.set('tier', userTier);
        redirectUrlWithParams.searchParams.set('uid', user.uid);
        redirectUrlWithParams.searchParams.set('email', user.email);
        
        console.log('🔀 [MAIN_DOMAIN] Redirecting to ASTERIA with auth params');
        
        // Also send via PostMessage if in iframe/popup
        if (window.parent !== window || window.opener) {
          console.log('📬 [MAIN_DOMAIN] Sending token via PostMessage');
          const message = {
            type: 'AUTH_TOKEN_RESPONSE',
            token: idToken,
            tier: userTier,
            uid: user.uid,
            email: user.email
          };
          
          // Send to parent window (iframe case)
          if (window.parent !== window) {
            window.parent.postMessage(message, 'https://innercircle.thriveachievegrow.com');
          }
          
          // Send to opener window (popup case)
          if (window.opener) {
            window.opener.postMessage(message, 'https://innercircle.thriveachievegrow.com');
          }
        }
        
        // Perform the redirect
        window.location.href = redirectUrlWithParams.toString();
      } else {
        // No redirect URL, stay on main domain
        console.log('✅ [MAIN_DOMAIN] Authentication complete, no redirect URL');
        router.push('/dashboard'); // or wherever you want to redirect on main domain
      }
      
    } catch (error) {
      console.error('💥 [MAIN_DOMAIN] Post-auth processing error:', error);
      setError('Authentication processing failed. Please try again.');
      setLoading(false);
    }
  };

  // Determine user tier based on your business logic
  const determineUserTier = async (user: any): Promise<string> => {
    // TODO: Implement your tier determination logic
    // This might involve checking Firestore, Supabase, or other databases
    // For now, return a default tier
    
    try {
      // Example: Check user's email domain or custom claims
      if (user.email?.endsWith('@thriveachievegrow.com')) {
        return 'founding10';
      }
      
      // Check custom claims
      const tokenResult = await user.getIdTokenResult();
      if (tokenResult.claims.tier) {
        return tokenResult.claims.tier;
      }
      
      // Default tier
      return 'all-members';
      
    } catch (error) {
      console.error('⚠️ [MAIN_DOMAIN] Tier determination error:', error);
      return 'all-members';
    }
  };

  // Handle email/password authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleAuthSuccess(userCredential.user);
    } catch (error: any) {
      console.error('💥 [MAIN_DOMAIN] Email auth error:', error);
      setError(getErrorMessage(error.code));
      setLoading(false);
    }
  };

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthSuccess(userCredential.user);
    } catch (error: any) {
      console.error('💥 [MAIN_DOMAIN] Google auth error:', error);
      setError(getErrorMessage(error.code));
      setLoading(false);
    }
  };

  // Convert Firebase error codes to user-friendly messages
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Authentication popup was closed. Please try again.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  // Listen for PostMessage requests from ASTERIA
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://innercircle.thriveachievegrow.com') {
        return;
      }
      
      if (event.data.type === 'REQUEST_AUTH_TOKEN') {
        console.log('📬 [MAIN_DOMAIN] Received token request via PostMessage');
        
        // Check if user is already authenticated
        const currentUser = auth.currentUser;
        if (currentUser) {
          currentUser.getIdToken(true).then(token => {
            determineUserTier(currentUser).then(tier => {
              const response = {
                type: 'AUTH_TOKEN_RESPONSE',
                token: token,
                tier: tier,
                uid: currentUser.uid,
                email: currentUser.email
              };
              
              event.source?.postMessage(response, { targetOrigin: event.origin });
              console.log('✅ [MAIN_DOMAIN] Sent existing auth token via PostMessage');
            });
          }).catch(error => {
            console.error('💥 [MAIN_DOMAIN] Token generation error:', error);
          });
        } else {
          console.log('❌ [MAIN_DOMAIN] No authenticated user for PostMessage request');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome to ASTERIA
          </h2>
          <p className="text-white/70 mb-8">
            {redirectUrl ? 'Sign in to access your luxury concierge' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          {/* Authentication Method Toggle */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                authMethod === 'email'
                  ? 'bg-gold-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setAuthMethod('google')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                authMethod === 'google'
                  ? 'bg-gold-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Google
            </button>
          </div>

          {authMethod === 'email' ? (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-gold-400"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-gold-400"
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-white font-semibold rounded-lg hover:from-gold-500 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
          )}
        </div>

        {redirectUrl && (
          <div className="text-center">
            <p className="text-white/50 text-sm">
              You'll be redirected to ASTERIA after authentication
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 