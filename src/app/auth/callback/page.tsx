'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/components/chat/hooks/useFirebaseAuth';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signInWithToken } = useFirebaseAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token');
        const tier = searchParams.get('tier');
        const origin = searchParams.get('origin');
        const redirectTo = searchParams.get('redirect');

        if (!token) {
          throw new Error('No authentication token provided');
        }

        console.log('🔐 Processing auth callback:', { tier, origin, redirectTo });

        // Validate token and sign in
        await signInWithToken(token);
        
        setStatus('success');
        
        // Redirect back to original URL or main ASTERIA interface after brief success display
        setTimeout(() => {
          if (redirectTo && redirectTo.includes('innercircle.thriveachievegrow.com')) {
            // Redirect to original URL if it's safe (same domain)
            window.location.href = redirectTo;
          } else {
            // Fallback to main ASTERIA interface
            router.push('/');
          }
        }, 2000);

      } catch (error: any) {
        console.error('Auth callback failed:', error);
        setError(error.message);
        setStatus('error');
      }
    };

    processCallback();
  }, [searchParams, signInWithToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">A</span>
            </div>

            {status === 'processing' && (
              <div className="space-y-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400 mb-4"></div>
                <h2 className="text-2xl font-bold text-white mb-2">Completing authentication...</h2>
                <p className="text-white/70">Please wait while we verify your credentials.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="inline-block w-8 h-8 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Authentication successful!</h2>
                <p className="text-white/70">Redirecting to your ASTERIA dashboard...</p>
                <div className="mt-4">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-gradient-to-r from-gold-400 to-gold-600 h-2 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="inline-block w-8 h-8 mb-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Authentication failed</h2>
                <p className="text-white/70 mb-4">{error}</p>
                <button 
                  onClick={() => router.push('/auth')}
                  className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">A</span>
              </div>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400 mb-4"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
              <p className="text-white/70">Preparing authentication...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
} 