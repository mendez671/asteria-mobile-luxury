// ===============================
// PHASE 1: ENHANCED BOOKING PATTERN DETECTION
// Centralized library for intelligent booking intent recognition
// ===============================

export interface BookingDetectionResult {
  hasIntent: boolean;
  confidence: 'high' | 'medium' | 'low';
  matchedPhrase?: string;
  contextAware?: boolean;
}

// ===============================
// COMPREHENSIVE BOOKING PHRASES
// Exponentially expanded from 3 to 50+ natural expressions
// ===============================
export const BOOKING_INTENT_PHRASES = {
  // HIGH CONFIDENCE - Direct booking commands
  high: [
    'book it', 'let\'s book it', 'book this', 'please book', 'book now',
    'let\'s do it', 'let\'s proceed', 'make it happen', 'arrange this',
    'set it up', 'organize this', 'handle this', 'go ahead', 'proceed',
    'confirm', 'yes, book', 'book asap', 'do this now', 'rush this',
    'i approve', 'approved', 'confirmed', 'green light', 'proceed with this'
  ],
  
  // MEDIUM CONFIDENCE - Strong agreement phrases
  medium: [
    'perfect', 'excellent', 'sounds good', 'that works', 'absolutely',
    'exactly', 'that\'s perfect', 'let\'s go with that', 'wonderful',
    'great choice', 'sounds perfect', 'love it', 'that sounds wonderful',
    'i like this', 'this works for me', 'this is good', 'this is great',
    'i choose this', 'i want this', 'this is what i want', 'definitely',
    'for sure', 'without a doubt', 'let\'s go', 'i\'m down', 'i\'m in',
    'count me in', 'sign me up', 'i\'m ready', 'ready to go'
  ],
  
  // CONTEXT-AWARE - Requires service context from previous messages
  contextual: [
    'yes', 'sure', 'okay', 'alright', 'yep', 'yup', 'yeah',
    'sounds great', 'that sounds good', 'works for me', 'i like that',
    'option 1', 'option 2', 'the first one', 'the second one',
    'i\'ll take it', 'i\'ll go with that', 'that one', 'this one'
  ]
};

// ===============================
// SERVICE CONTEXT KEYWORDS
// Detect if previous messages mentioned services
// ===============================
const SERVICE_CONTEXT_KEYWORDS = [
  'arrange', 'book', 'coordinate', 'option', 'choice', 'recommend',
  'suggest', 'available', 'reserve', 'schedule', 'organize', 'handle',
  'curate', 'provide', 'offer', 'present', 'propose'
];

// ===============================
// SMART BOOKING DETECTION ENGINE
// Context-aware with confidence scoring
// ===============================
export function detectBookingIntent(
  message: string, 
  previousMessages: Array<{ content: string; sender: 'user' | 'asteria' }> = []
): BookingDetectionResult {
  const messageLower = message.toLowerCase().trim();
  
  // Step 1: Check for HIGH confidence phrases
  for (const phrase of BOOKING_INTENT_PHRASES.high) {
    if (messageLower.includes(phrase)) {
      return {
        hasIntent: true,
        confidence: 'high',
        matchedPhrase: phrase,
        contextAware: false
      };
    }
  }
  
  // Step 2: Check for MEDIUM confidence phrases
  for (const phrase of BOOKING_INTENT_PHRASES.medium) {
    if (messageLower.includes(phrase)) {
      return {
        hasIntent: true,
        confidence: 'medium',
        matchedPhrase: phrase,
        contextAware: false
      };
    }
  }
  
  // Step 3: Context-aware detection for simple responses
  const hasServiceContext = previousMessages
    .slice(-2) // Check last 2 messages
    .some(msg => 
      msg.sender === 'asteria' && 
      SERVICE_CONTEXT_KEYWORDS.some(keyword => 
        msg.content.toLowerCase().includes(keyword)
      )
    );
  
  if (hasServiceContext) {
    for (const phrase of BOOKING_INTENT_PHRASES.contextual) {
      if (messageLower.includes(phrase)) {
        return {
          hasIntent: true,
          confidence: 'medium',
          matchedPhrase: phrase,
          contextAware: true
        };
      }
    }
  }
  
  // Step 4: No booking intent detected
  return {
    hasIntent: false,
    confidence: 'low'
  };
}

// ===============================
// QUICK DETECTION FOR UI
// Optimized for MessageList component
// ===============================
export function hasBookingIntent(
  message: string, 
  previousMessages: Array<{ content: string; sender: 'user' | 'asteria' }> = []
): boolean {
  const result = detectBookingIntent(message, previousMessages);
  return result.hasIntent && (result.confidence === 'high' || result.confidence === 'medium');
}

// ===============================
// PATTERN ANALYTICS
// For future N8N integration and learning
// ===============================
export function getBookingPatternStats() {
  return {
    totalPhrases: BOOKING_INTENT_PHRASES.high.length + 
                  BOOKING_INTENT_PHRASES.medium.length + 
                  BOOKING_INTENT_PHRASES.contextual.length,
    highConfidencePhrases: BOOKING_INTENT_PHRASES.high.length,
    mediumConfidencePhrases: BOOKING_INTENT_PHRASES.medium.length,
    contextualPhrases: BOOKING_INTENT_PHRASES.contextual.length,
    serviceContextKeywords: SERVICE_CONTEXT_KEYWORDS.length
  };
} 