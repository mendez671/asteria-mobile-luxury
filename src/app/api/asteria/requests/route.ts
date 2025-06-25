import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { AsteriaMemberService } from '@/lib/services/asteria-member';

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

// Standard CORS headers for ASTERIA endpoints
const ASTERIA_CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
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
  try {
    const { searchParams } = new URL(request.url);
    const asteriaToken = searchParams.get('token');
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!asteriaToken) {
      return NextResponse.json({ error: 'ASTERIA token required' }, { 
        status: 401,
        headers: ASTERIA_CORS_HEADERS
      });
    }

    const tokenData = await verifyAsteriaToken(asteriaToken);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid ASTERIA token' }, { 
        status: 401,
        headers: ASTERIA_CORS_HEADERS
      });
    }

    const { adminDb } = await getFirebaseAdmin();
    const requestsRef = adminDb.collection('service_requests');

    // Build query
    let query = requestsRef.orderBy('timestamps.created', 'desc').limit(limit);
    
    if (memberId) {
      query = query.where('memberId', '==', memberId);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      requests,
      total: requests.length,
      filter: { memberId, status, limit }
    }, {
      headers: ASTERIA_CORS_HEADERS
    });

  } catch (error: any) {
    console.error('[ASTERIA_REQUESTS] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { 
      status: 500,
      headers: ASTERIA_CORS_HEADERS
    });
  }
}

// POST: Create new request
export async function POST(request: NextRequest) {
  try {
    const { asteriaToken, request: requestData }: CreateRequestBody = await request.json();

    if (!asteriaToken) {
      return NextResponse.json({ error: 'ASTERIA token required' }, { status: 401 });
    }

    const tokenData = await verifyAsteriaToken(asteriaToken);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid ASTERIA token' }, { status: 401 });
    }

    const { adminDb } = await getFirebaseAdmin();
    const requestsRef = adminDb.collection('service_requests');

    // Create request document
    const newRequest: AsteriaRequest = {
      ...requestData,
      id: '', // Will be set by Firestore
      timestamps: {
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      metadata: {
        ...requestData.metadata,
        createdBy: 'asteria-backend',
        memberTier: tokenData.tier,
        version: '1.0.0'
      }
    };

    const docRef = await requestsRef.add(newRequest);
    newRequest.id = docRef.id;

    // Update document with ID
    await docRef.update({ id: docRef.id });

    console.log(`[ASTERIA_REQUESTS] Created: ${docRef.id} for member ${requestData.memberId}`);

    return NextResponse.json({
      success: true,
      request: newRequest,
      requestId: docRef.id
    }, {
      status: 201,
      headers: ASTERIA_CORS_HEADERS
    });

  } catch (error: any) {
    console.error('[ASTERIA_REQUESTS] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { 
      status: 500,
      headers: ASTERIA_CORS_HEADERS
    });
  }
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