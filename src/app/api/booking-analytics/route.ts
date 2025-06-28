// ===============================
// PHASE 1: BOOKING ANALYTICS API
// Monitoring endpoint for pattern detection performance
// Prepares data for future N8N integration
// ===============================

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Import analytics functions
    const { getBookingAnalyticsSummary, exportAnalyticsForN8N } = require('@/lib/services/booking-analytics');
    
    // Get query parameters
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'summary';
    
    // Return different formats based on request
    if (format === 'n8n') {
      // Format for N8N webhook integration
      const n8nData = exportAnalyticsForN8N();
      return NextResponse.json(n8nData);
    } else if (format === 'dashboard') {
      // Format for monitoring dashboard
      const summary = getBookingAnalyticsSummary();
      
      return NextResponse.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        analytics: summary,
        phase: 'PHASE_1_ENHANCED_PATTERNS',
        systemHealth: {
          patternDetectionActive: true,
          analyticsTracking: true,
          n8nReady: true
        }
      });
    } else {
      // Default summary format
      const summary = getBookingAnalyticsSummary();
      return NextResponse.json(summary);
    }
    
  } catch (error) {
    console.error('❌ Booking Analytics API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve booking analytics',
        phase: 'PHASE_1_ENHANCED_PATTERNS',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// ===============================
// PHASE 2 PREPARATION: N8N WEBHOOK HANDLER
// Currently returns 405, will be implemented in Phase 2
// ===============================
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'N8N webhook integration coming in Phase 2',
      phase: 'PHASE_1_ENHANCED_PATTERNS',
      nextPhase: 'PHASE_2_N8N_INTEGRATION'
    }, 
    { status: 405 }
  );
} 