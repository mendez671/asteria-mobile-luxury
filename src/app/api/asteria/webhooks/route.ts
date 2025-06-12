import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

interface WebhookPayload {
  event: 'request_created' | 'request_updated' | 'request_completed' | 'status_changed';
  timestamp: string;
  requestId: string;
  memberId: string;
  data: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    progress?: number;
    message?: string;
    metadata?: Record<string, any>;
  };
  source: 'asteria-backend' | 'asteria-agent' | 'concierge-team';
}

interface WebhookRegistration {
  id: string;
  callbackUrl: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastCall?: string;
  failureCount: number;
}

// POST: Receive webhook from ASTERIA backend
export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();
    
    // Validate webhook payload
    if (!payload.event || !payload.requestId || !payload.memberId) {
      return NextResponse.json({
        error: 'Invalid webhook payload'
      }, { status: 400 });
    }

    console.log(`[ASTERIA_WEBHOOK] Received: ${payload.event} for request ${payload.requestId}`);

    const { adminDb } = await getFirebaseAdmin();

    // Update the request in Firestore
    const requestRef = adminDb.collection('service_requests').doc(payload.requestId);
    const requestDoc = await requestRef.get();

    if (requestDoc.exists) {
      const updateData: any = {
        'timestamps.updated': payload.timestamp,
        'metadata.lastWebhookEvent': payload.event,
        'metadata.lastWebhookTimestamp': payload.timestamp
      };

      // Update specific fields based on webhook data
      if (payload.data.status) {
        updateData.status = payload.data.status;
      }
      if (payload.data.priority) {
        updateData.priority = payload.data.priority;
      }
      if (payload.data.assignedTo) {
        updateData.assignedTo = payload.data.assignedTo;
      }
      if (payload.data.progress !== undefined) {
        updateData['metadata.progress'] = payload.data.progress;
      }

      // Add activity log entry
      const currentData = requestDoc.data();
      const activityLog = currentData?.metadata?.activityLog || [];
      
      updateData['metadata.activityLog'] = [
        ...activityLog,
        {
          event: payload.event,
          timestamp: payload.timestamp,
          source: payload.source,
          data: payload.data,
          message: payload.data.message || `Request ${payload.event.replace('_', ' ')}`
        }
      ];

      await requestRef.update(updateData);

      // Store webhook event for dashboard real-time updates
      await adminDb.collection('asteria_webhook_events').add({
        ...payload,
        processedAt: new Date().toISOString(),
        status: 'processed'
      });

      console.log(`[ASTERIA_WEBHOOK] Processed: ${payload.event} for ${payload.requestId}`);
    } else {
      console.warn(`[ASTERIA_WEBHOOK] Request not found: ${payload.requestId}`);
    }

    // Send notifications based on event type
    if (payload.event === 'request_completed') {
      await sendCompletionNotification(payload);
    } else if (payload.event === 'status_changed' && payload.data.priority === 'critical') {
      await sendUrgentNotification(payload);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      eventId: payload.requestId,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error: any) {
    console.error('[ASTERIA_WEBHOOK] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET: Retrieve webhook events for dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const since = searchParams.get('since'); // ISO timestamp
    const limit = parseInt(searchParams.get('limit') || '20');

    const { adminDb } = await getFirebaseAdmin();
    let query = adminDb.collection('asteria_webhook_events')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (memberId) {
      query = query.where('memberId', '==', memberId);
    }

    if (since) {
      query = query.where('timestamp', '>', since);
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      events,
      total: events.length,
      filter: { memberId, since, limit }
    }, {
      headers: {
        'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error: any) {
    console.error('[ASTERIA_WEBHOOK] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Send completion notification
async function sendCompletionNotification(payload: WebhookPayload) {
  try {
    // Use existing notification system
    const { sendSlackNotification } = await import('@/lib/notifications/slack');
    
    const message = {
      text: `✅ ASTERIA Request Completed`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *ASTERIA Request Completed*
Request ID: ${payload.requestId}
Member: ${payload.memberId}
Completed: ${new Date(payload.timestamp).toLocaleString()}

${payload.data.message || 'Request has been successfully completed.'}

View details in the member dashboard.`
          }
        }
      ]
    };

    // Note: In production, you'd call sendSlackNotification with proper parameters
    console.log('[ASTERIA_WEBHOOK] Completion notification:', message);

  } catch (error) {
    console.error('[ASTERIA_WEBHOOK] Notification error:', error);
  }
}

// Send urgent notification
async function sendUrgentNotification(payload: WebhookPayload) {
  try {
    const message = {
      text: `🚨 URGENT: ASTERIA Request Needs Attention`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚨 *URGENT: ASTERIA Request Needs Attention*
Request ID: ${payload.requestId}
Member: ${payload.memberId}
Priority: ${payload.data.priority?.toUpperCase()}
Status: ${payload.data.status}

${payload.data.message || 'This request requires immediate attention.'}

Please review and take action immediately.`
          }
        }
      ]
    };

    console.log('[ASTERIA_WEBHOOK] Urgent notification:', message);

  } catch (error) {
    console.error('[ASTERIA_WEBHOOK] Urgent notification error:', error);
  }
}

// OPTIONS: CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
} 