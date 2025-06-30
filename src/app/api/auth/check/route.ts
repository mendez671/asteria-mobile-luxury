import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

/**
 * Main Domain Authentication Check Endpoint
 * Used by cross-domain authentication flow to verify existing sessions
 * Route: GET /api/auth/check
 */
export async function GET(request: NextRequest) {
  try {
    // Extract authorization header or cookies for existing session
    const authHeader = request.headers.get('authorization');
    const cookies = request.headers.get('cookie') || '';
    
    // Method 1: Check Authorization header
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      try {
        const { adminAuth } = await getFirebaseAdmin();
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        return NextResponse.json({ 
          authenticated: true, 
          token: token,
          uid: decodedToken.uid,
          email: decodedToken.email
        }, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type'
          }
        });
      } catch (tokenError) {
        console.log('Token validation failed:', tokenError);
        // Continue to check other methods
      }
    }
    
    // Method 2: Check session cookies (if implemented)
    // This would be for traditional session-based auth
    // For now, return not authenticated
    
    return NextResponse.json({ 
      authenticated: false,
      message: 'No valid authentication found'
    }, {
      status: 200, // Return 200 OK even for unauthenticated (expected behavior)
      headers: {
        'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'
      }
    });

  } catch (error: any) {
    console.error('Auth check endpoint error:', error);
    
    return NextResponse.json({ 
      authenticated: false,
      error: 'Authentication check failed'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'
      }
    });
  }
}

/**
 * CORS Preflight Handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 