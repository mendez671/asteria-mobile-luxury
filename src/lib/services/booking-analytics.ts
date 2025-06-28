// ===============================
// PHASE 1: BOOKING PATTERN ANALYTICS
// Tracking system for N8N integration and continuous learning
// ===============================

import { BookingDetectionResult } from './booking-patterns';

export interface BookingAnalytics {
  sessionId: string;
  timestamp: Date;
  userMessage: string;
  detectionResult: BookingDetectionResult;
  previousMessages: number;
  userConfirmed?: boolean;
  falsePositive?: boolean;
}

// ===============================
// ANALYTICS STORAGE
// In-memory for Phase 1, will connect to Firebase/N8N later
// ===============================
const analyticsBuffer: BookingAnalytics[] = [];
const MAX_BUFFER_SIZE = 100;

// ===============================
// TRACK BOOKING DETECTION
// Log every pattern detection attempt
// ===============================
export function trackBookingDetection(
  sessionId: string,
  userMessage: string,
  detectionResult: BookingDetectionResult,
  previousMessagesCount: number
): void {
  const analytics: BookingAnalytics = {
    sessionId,
    timestamp: new Date(),
    userMessage,
    detectionResult,
    previousMessages: previousMessagesCount,
  };

  // Add to buffer
  analyticsBuffer.push(analytics);
  
  // Keep buffer size manageable
  if (analyticsBuffer.length > MAX_BUFFER_SIZE) {
    analyticsBuffer.shift();
  }

  // Console logging for development
  console.log('📊 Booking Pattern Analytics:', {
    confidence: detectionResult.confidence,
    matched: detectionResult.matchedPhrase,
    contextAware: detectionResult.contextAware,
    message: userMessage.substring(0, 50) + '...'
  });
}

// ===============================
// TRACK USER CONFIRMATION
// When user actually clicks the booking button
// ===============================
export function trackBookingConfirmation(sessionId: string): void {
  const lastDetection = analyticsBuffer
    .reverse()
    .find(a => a.sessionId === sessionId && !a.userConfirmed);
  
  if (lastDetection) {
    lastDetection.userConfirmed = true;
    console.log('✅ Booking Confirmed - Pattern Success:', {
      confidence: lastDetection.detectionResult.confidence,
      phrase: lastDetection.detectionResult.matchedPhrase
    });
  }
}

// ===============================
// GET ANALYTICS SUMMARY
// For N8N integration and performance monitoring
// ===============================
export function getBookingAnalyticsSummary() {
  const total = analyticsBuffer.length;
  const confirmed = analyticsBuffer.filter(a => a.userConfirmed).length;
  const highConfidence = analyticsBuffer.filter(a => a.detectionResult.confidence === 'high').length;
  const contextAware = analyticsBuffer.filter(a => a.detectionResult.contextAware).length;
  
  const phraseFrequency = analyticsBuffer.reduce((acc, a) => {
    if (a.detectionResult.matchedPhrase) {
      acc[a.detectionResult.matchedPhrase] = (acc[a.detectionResult.matchedPhrase] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    totalDetections: total,
    confirmationRate: total > 0 ? (confirmed / total * 100).toFixed(1) + '%' : '0%',
    highConfidenceRate: total > 0 ? (highConfidence / total * 100).toFixed(1) + '%' : '0%',
    contextAwareRate: total > 0 ? (contextAware / total * 100).toFixed(1) + '%' : '0%',
    topPhrases: Object.entries(phraseFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([phrase, count]) => ({ phrase, count })),
    recentDetections: analyticsBuffer.slice(-10)
  };
}

// ===============================
// EXPORT FOR N8N INTEGRATION
// Future webhook endpoint will use this
// ===============================
export function exportAnalyticsForN8N() {
  return {
    timestamp: new Date().toISOString(),
    summary: getBookingAnalyticsSummary(),
    rawData: analyticsBuffer.slice(-20), // Last 20 entries
    systemInfo: {
      bufferSize: analyticsBuffer.length,
      maxBufferSize: MAX_BUFFER_SIZE
    }
  };
} 