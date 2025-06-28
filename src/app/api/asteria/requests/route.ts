import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { AsteriaMemberService } from '@/lib/services/asteria-member';
import { withAuthGuard } from '@/lib/middleware/enhanced-auth-guard';

interface AsteriaRequest {
  id: string;
  memberId: string;
  serviceType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  details: {
    title: string;
    description: string;
    requirements?: string[];
    preferences?: Record<string, any>;
    timeline?: string;
    budget?: string;
  };
  timestamps: {
    created: string;
    updated: string;
    completed?: string;
  };
  assignedTo?: string;
  notes?: Array<string | { content: string; timestamp: string; author: string; }>;
  metadata: Record<string, any>;
}

interface CreateRequestBody {
  asteriaToken: string;
  request: Omit<AsteriaRequest, 'id' | 'timestamps'>;
}

interface UpdateRequestBody {
  asteriaToken: string;
  requestId: string;
  updates: Partial<AsteriaRequest>;
  note?: string;
}

// ASTERIA CORS Headers - Unified for all endpoints
const ASTERIA_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// Verify ASTERIA token (simple validation for MVP)
async function verifyAsteriaToken(token: string): Promise<{ uid: string; tier: string } | null> {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Basic validation
    if (decoded.iss !== 'asteria-mvp' || decoded.aud !== 'asteria-backend') {
      return null;
    }

    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { uid: decoded.uid, tier: decoded.tier };
  } catch {
    return null;
  }
}

// GET: Retrieve requests for a member
export async function GET(request: NextRequest) {
  return withAuthGuard(
    request,
    async (request: NextRequest, authResult) => {
      const { user, memberTier } = authResult;
      
      return NextResponse.json({
        status: 'ASTERIA API operational',
        user: {
          uid: user.uid,
          memberTier
        },
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: ASTERIA_CORS_HEADERS
      });
    },
    {
      requiredTier: 'tag-connect'
    }
  );
}

// POST: Create new request
export async function POST(request: NextRequest) {
  return withAuthGuard(
    request,
    async (request: NextRequest, authResult) => {
      try {
        const { user, memberTier } = authResult;
        const body = await request.json();

        console.log(`🔐 Authenticated request from user: ${user.uid}, tier: ${memberTier}`);

        // Process the request with authenticated user context
        const response = {
          success: true,
          message: 'Request processed successfully',
          user: {
            uid: user.uid,
            email: user.email,
            memberTier
          },
          data: body,
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, {
          status: 200,
          headers: ASTERIA_CORS_HEADERS
        });

      } catch (error: any) {
        console.error('❌ ASTERIA requests processing failed:', error);
        
        return NextResponse.json(
          { 
            error: 'Request processing failed',
            details: error.message 
          },
          { 
            status: 500,
            headers: ASTERIA_CORS_HEADERS
          }
        );
      }
    },
    {
      requiredTier: 'tag-connect',
      allowedDomains: [
        'https://innercircle.thriveachievegrow.com',
        'https://thriveachievegrow.com',
        'http://localhost:3000'
      ]
    }
  );
}

// PUT: Update existing request
export async function PUT(request: NextRequest) {
  try {
    const { asteriaToken, requestId, updates, note }: UpdateRequestBody = await request.json();

    if (!asteriaToken || !requestId) {
      return NextResponse.json({ 
        error: 'ASTERIA token and request ID required' 
      }, { status: 400 });
    }

    const tokenData = await verifyAsteriaToken(asteriaToken);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid ASTERIA token' }, { status: 401 });
    }

    const { adminDb } = await getFirebaseAdmin();
    const requestRef = adminDb.collection('service_requests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const currentData = requestDoc.data() as AsteriaRequest;

    // Prepare updates
    const updateData = {
      ...updates,
      timestamps: {
        ...currentData.timestamps,
        updated: new Date().toISOString(),
        ...(updates.status === 'completed' && { completed: new Date().toISOString() })
      }
    };

    // Add note if provided
    if (note) {
      updateData.notes = [
        ...(currentData.notes || []),
        {
          content: note,
          timestamp: new Date().toISOString(),
          author: 'asteria-backend'
        }
      ];
    }

    await requestRef.update(updateData);

    const updatedRequest = {
      ...currentData,
      ...updateData
    };

    console.log(`[ASTERIA_REQUESTS] Updated: ${requestId} - Status: ${updates.status || 'no change'}`);

    return NextResponse.json({
      success: true,
      request: updatedRequest
    }, {
      headers: ASTERIA_CORS_HEADERS
    });

  } catch (error: any) {
    console.error('[ASTERIA_REQUESTS] PUT Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE: Remove request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asteriaToken = searchParams.get('token');
    const requestId = searchParams.get('requestId');

    if (!asteriaToken || !requestId) {
      return NextResponse.json({ 
        error: 'ASTERIA token and request ID required' 
      }, { status: 400 });
    }

    const tokenData = await verifyAsteriaToken(asteriaToken);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid ASTERIA token' }, { status: 401 });
    }

    const { adminDb } = await getFirebaseAdmin();
    const requestRef = adminDb.collection('service_requests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Soft delete by updating status
    await requestRef.update({
      status: 'cancelled',
      'timestamps.updated': new Date().toISOString(),
      'metadata.deletedAt': new Date().toISOString(),
      'metadata.deletedBy': 'asteria-backend'
    });

    console.log(`[ASTERIA_REQUESTS] Deleted: ${requestId}`);

    return NextResponse.json({
      success: true,
      message: 'Request cancelled successfully'
    }, {
      headers: ASTERIA_CORS_HEADERS
    });

  } catch (error: any) {
    console.error('[ASTERIA_REQUESTS] DELETE Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// OPTIONS: CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: ASTERIA_CORS_HEADERS
  });
} 