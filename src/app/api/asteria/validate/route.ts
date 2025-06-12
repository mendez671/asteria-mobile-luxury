import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { AsteriaMemberService } from '@/lib/services/asteria-member';

interface ValidationRequest {
  firebaseToken: string;
  memberContext?: {
    requestId?: string;
    sessionId?: string;
    serviceCategory?: string;
  };
}

interface ValidationResponse {
  success: boolean;
  asteriaToken?: string;
  memberData?: {
    uid: string;
    email?: string;
    tier: 'founding10' | 'corporate' | 'fifty-k' | 'all-members';
    tagRole?: string;
    memberSince?: string;
    profile: Record<string, any>;
    accessLevels?: Record<string, any>;
  };
  error?: string;
  requestId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ValidationResponse>> {
  try {
    const { firebaseToken, memberContext }: ValidationRequest = await request.json();

    if (!firebaseToken) {
      return NextResponse.json({
        success: false,
        error: 'Firebase token is required'
      }, { status: 400 });
    }

    // Verify Firebase token using Admin SDK
    const { adminAuth, adminDb } = await getFirebaseAdmin();
    const decodedToken = await adminAuth.verifyIdToken(firebaseToken);

    if (!decodedToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Firebase token'
      }, { status: 401 });
    }

    // Get ASTERIA member data using the unified service
    const asteriaMember = await AsteriaMemberService.getMemberByUid(decodedToken.uid);
    
    if (!asteriaMember) {
      return NextResponse.json({
        success: false,
        error: 'Member not found in ASTERIA system'
      }, { status: 404 });
    }

    // Validate service category access if provided
    if (memberContext?.serviceCategory) {
      const accessValidation = await AsteriaMemberService.validateMemberAccess(
        decodedToken.uid, 
        memberContext.serviceCategory
      );
      
      if (!accessValidation.allowed) {
        return NextResponse.json({
          success: false,
          error: accessValidation.reason || 'Access denied for service category'
        }, { status: 403 });
      }
    }

    // Generate ASTERIA custom token (JWT with member context)
    const asteriaTokenPayload = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      tier: asteriaMember.tier,
      tagRole: asteriaMember.tagRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iss: 'asteria-mvp',
      aud: 'asteria-backend',
      requestId: memberContext?.requestId || `req_${Date.now()}`,
      sessionId: memberContext?.sessionId || `sess_${Date.now()}`
    };

    // For MVP, we'll use a simple JWT-like structure
    // In production, use proper JWT signing
    const asteriaToken = Buffer.from(JSON.stringify(asteriaTokenPayload)).toString('base64');

    // Get tier access levels
    const accessLevels = AsteriaMemberService.getTierAccessLevels(asteriaMember.tier);

    // Prepare member data response
    const memberResponse = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      tier: asteriaMember.tier,
      tagRole: asteriaMember.tagRole,
      memberSince: asteriaMember.memberSince,
      profile: asteriaMember.profile,
      accessLevels
    };

    // Log successful validation
    console.log(`[ASTERIA_VALIDATE] Success: ${decodedToken.uid} (${asteriaMember.tagRole} → ${asteriaMember.tier})`);

    // Update member activity
    await AsteriaMemberService.updateMemberActivity(decodedToken.uid, {
      email: decodedToken.email
    });

    return NextResponse.json({
      success: true,
      asteriaToken,
      memberData: memberResponse,
      requestId: asteriaTokenPayload.requestId
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      }
    });

  } catch (error: any) {
    console.error('[ASTERIA_VALIDATE] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Token validation failed'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

export async function GET() {
  return NextResponse.json({
    service: 'ASTERIA Token Validation',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      validate: 'POST /api/asteria/validate',
      description: 'Exchange Firebase tokens for ASTERIA custom tokens'
    }
  });
} 