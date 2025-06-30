import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin'; // Adjust path as needed

/**
 * Main Domain Authentication Check Endpoint
 * Called by: innercircle.thriveachievegrow.com cross-domain auth flow
 * Purpose: Check if user has existing session and return token if authenticated
 * Route: GET /api/auth/check
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [MAIN_DOMAIN] Auth check requested from:', request.headers.get('referer'));
    
    // Method 1: Check session cookies
    const sessionCookie = request.cookies.get('__session')?.value;
    if (sessionCookie) {
      try {
        const { adminAuth } = await getFirebaseAdmin();
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        
        // Generate fresh ID token for cross-domain use
        const customToken = await adminAuth.createCustomToken(decodedToken.uid);
        
        console.log('✅ [MAIN_DOMAIN] Session cookie valid, returning token');
        return NextResponse.json({
          authenticated: true,
          token: customToken,
          uid: decodedToken.uid,
          email: decodedToken.email
        }, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.log('⚠️ [MAIN_DOMAIN] Session cookie invalid:', error);
      }
    }

    // Method 2: Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      try {
        const { adminAuth } = await getFirebaseAdmin();
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        console.log('✅ [MAIN_DOMAIN] Bearer token valid, returning fresh token');
        const customToken = await adminAuth.createCustomToken(decodedToken.uid);
        
        return NextResponse.json({
          authenticated: true,
          token: customToken,
          uid: decodedToken.uid,
          email: decodedToken.email
        }, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.log('⚠️ [MAIN_DOMAIN] Bearer token invalid:', error);
      }
    }

    // Method 3: Check Firebase Auth state (client-side token)
    const firebaseToken = request.cookies.get('firebase-token')?.value;
    if (firebaseToken) {
      try {
        const { adminAuth } = await getFirebaseAdmin();
        const decodedToken = await adminAuth.verifyIdToken(firebaseToken);
        
        console.log('✅ [MAIN_DOMAIN] Firebase token valid, returning custom token');
        const customToken = await adminAuth.createCustomToken(decodedToken.uid);
        
        return NextResponse.json({
          authenticated: true,
          token: customToken,
          uid: decodedToken.uid,
          email: decodedToken.email
        }, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.log('⚠️ [MAIN_DOMAIN] Firebase token invalid:', error);
      }
    }

    // No valid authentication found
    console.log('❌ [MAIN_DOMAIN] No valid authentication found');
    return NextResponse.json({
      authenticated: false,
      message: 'No valid authentication session found'
    }, {
      status: 200, // Return 200 even for unauthenticated (not an error)
      headers: {
        'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('💥 [MAIN_DOMAIN] Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Authentication check failed'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
} 