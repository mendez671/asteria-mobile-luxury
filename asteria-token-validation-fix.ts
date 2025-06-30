// ASTERIA Token Validation Fix
// File: src/app/api/asteria/validate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

// CORS Headers for ASTERIA
const ASTERIA_CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

export async function POST(request: NextRequest) {
  console.log('🔐 [ASTERIA_VALIDATE] Token validation request received');
  
  try {
    const body = await request.json();
    console.log('📝 [ASTERIA_VALIDATE] Request body keys:', Object.keys(body));
    
    // Extract token from multiple possible locations
    let token = body.token || body.idToken || body.firebaseToken;
    
    // Also check Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split('Bearer ')[1];
      }
    }
    
    if (!token) {
      console.log('❌ [ASTERIA_VALIDATE] No token provided in request');
      return NextResponse.json({
        valid: false,
        error: 'No authentication token provided'
      }, {
        status: 400,
        headers: ASTERIA_CORS_HEADERS
      });
    }
    
    console.log('🔍 [ASTERIA_VALIDATE] Token received, length:', token.length);
    console.log('🔍 [ASTERIA_VALIDATE] Token type:', typeof token);
    console.log('🔍 [ASTERIA_VALIDATE] Token preview:', token.substring(0, 50) + '...');
    
    // Ensure token is a string and trim whitespace
    const cleanToken = String(token).trim();
    
    if (!cleanToken || cleanToken.length < 10) {
      console.log('❌ [ASTERIA_VALIDATE] Invalid token format');
      return NextResponse.json({
        valid: false,
        error: 'Invalid token format'
      }, {
        status: 400,
        headers: ASTERIA_CORS_HEADERS
      });
    }
    
    try {
      const { adminAuth } = await getFirebaseAdmin();
      console.log('✅ [ASTERIA_VALIDATE] Firebase Admin initialized');
      
      // Handle both ID tokens and custom tokens
      let decodedToken;
      let tokenType = 'id_token';
      
      try {
        // Try as ID token first
        decodedToken = await adminAuth.verifyIdToken(cleanToken);
        console.log('✅ [ASTERIA_VALIDATE] ID token verified successfully');
      } catch (idTokenError) {
        console.log('⚠️ [ASTERIA_VALIDATE] ID token verification failed, trying custom token');
        
        try {
          // If ID token fails, it might be a custom token
          // Custom tokens need to be signed in on client-side first
          // For now, we'll treat this as an error and ask for proper ID token
          throw new Error('Please provide a valid Firebase ID token, not a custom token');
        } catch (customTokenError) {
          throw idTokenError; // Throw original ID token error
        }
      }
      
      console.log('✅ [ASTERIA_VALIDATE] Token validation successful for user:', decodedToken.email);
      
      return NextResponse.json({
        valid: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          authTime: decodedToken.auth_time,
          issuedAt: decodedToken.iat,
          expiresAt: decodedToken.exp
        },
        tokenType
      }, {
        status: 200,
        headers: ASTERIA_CORS_HEADERS
      });
      
    } catch (firebaseError: any) {
      console.error('💥 [ASTERIA_VALIDATE] Firebase verification error:', {
        code: firebaseError.code,
        message: firebaseError.message,
        errorInfo: firebaseError.errorInfo
      });
      
      return NextResponse.json({
        valid: false,
        error: 'Token verification failed',
        details: process.env.NODE_ENV === 'development' ? firebaseError.message : undefined
      }, {
        status: 401,
        headers: ASTERIA_CORS_HEADERS
      });
    }
    
  } catch (parseError: any) {
    console.error('💥 [ASTERIA_VALIDATE] Request parsing error:', parseError);
    
    return NextResponse.json({
      valid: false,
      error: 'Invalid request format',
      details: process.env.NODE_ENV === 'development' ? parseError.message : undefined
    }, {
      status: 400,
      headers: ASTERIA_CORS_HEADERS
    });
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: ASTERIA_CORS_HEADERS
  });
}

// USAGE NOTES:
// 1. This endpoint expects Firebase ID tokens, not custom tokens
// 2. Custom tokens from main domain should be signed in on client-side first
// 3. The client should then get an ID token and send that for validation
// 4. Token can be sent in body.token, body.idToken, or Authorization header 