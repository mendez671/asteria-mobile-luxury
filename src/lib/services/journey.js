// Member Journey Detection - determines conversation phase and confirmation status

// Confirmation phrases that indicate member wants to proceed with booking
const CONFIRMATION_PHRASES = [
  // Direct booking commands
  'book it',
  'let\'s book it',
  'book this',
  'please book',
  'proceed',
  'let\'s do it',
  'let\'s proceed',
  'confirm',
  'yes, book',
  'book now',
  
  // Agreement phrases
  'perfect',
  'sounds good',
  'that works',
  'yes please',
  'absolutely',
  'exactly',
  'that\'s perfect',
  'let\'s go with that',
  
  // Action phrases
  'arrange this',
  'make it happen',
  'set it up',
  'organize this',
  'handle this'
];

// Phrases that indicate member is still gathering info or considering
const CONSIDERING_PHRASES = [
  'tell me more',
  'what are the options',
  'i\'m thinking',
  'maybe',
  'possibly',
  'what about',
  'can you suggest',
  'what would you recommend',
  'i\'m not sure',
  'let me think'
];

function analyzeConversationPhase(message, conversationHistory = []) {
  const messageLower = message.toLowerCase();
  
  // Check if this is a confirmation message
  const isConfirming = CONFIRMATION_PHRASES.some(phrase => 
    messageLower.includes(phrase)
  );
  
  // Check if still considering/gathering info
  const isConsidering = CONSIDERING_PHRASES.some(phrase => 
    messageLower.includes(phrase)
  );
  
  // Analyze conversation context
  const conversationLength = conversationHistory.length;
  const hasServiceRequest = conversationHistory.some(entry => 
    entry.role === 'user' && containsServiceKeywords(entry.content)
  );
  
  // Determine phase
  let phase = 'initial';
  let readyForTicket = false;
  
  if (conversationLength === 0) {
    // First message
    if (isConfirming && containsServiceKeywords(message)) {
      phase = 'confirmation';
      readyForTicket = true;
    } else if (containsServiceKeywords(message)) {
      phase = 'initial_request';
      readyForTicket = false;
    }
  } else if (hasServiceRequest) {
    // Ongoing conversation with service context
    if (isConfirming) {
      phase = 'confirmation';
      readyForTicket = true;
    } else if (isConsidering) {
      phase = 'information_gathering';
      readyForTicket = false;
    } else if (conversationLength > 2) {
      // Multi-turn conversation with details
      phase = 'detailed_discussion';
      readyForTicket = false;
    } else {
      phase = 'information_gathering';
      readyForTicket = false;
    }
  }
  
  return {
    phase,
    readyForTicket,
    isConfirming,
    isConsidering,
    conversationLength,
    hasServiceContext: hasServiceRequest
  };
}

function containsServiceKeywords(message) {
  const serviceKeywords = [
    // Transportation
    'private jet', 'flight', 'car service', 'yacht', 'helicopter', 'transportation',
    
    // Dining & Events  
    'dinner', 'restaurant', 'table', 'reservation', 'event', 'nightclub',
    
    // Experiences
    'vip', 'champagne', 'bottle service', 'private', 'exclusive',
    
    // Booking language
    'book', 'reserve', 'arrange', 'need', 'want'
  ];
  
  const messageLower = message.toLowerCase();
  return serviceKeywords.some(keyword => messageLower.includes(keyword));
}

// Enhanced service detection that considers journey phase
function detectServiceWithJourney(message, conversationHistory = []) {
  const journeyAnalysis = analyzeConversationPhase(message, conversationHistory);
  const hasServiceKeywords = containsServiceKeywords(message);
  
  return {
    ...journeyAnalysis,
    isServiceRelated: hasServiceKeywords || journeyAnalysis.hasServiceContext,
    shouldCreateTicket: journeyAnalysis.readyForTicket && (hasServiceKeywords || journeyAnalysis.hasServiceContext)
  };
}

module.exports = {
  analyzeConversationPhase,
  detectServiceWithJourney,
  CONFIRMATION_PHRASES,
  CONSIDERING_PHRASES
}; 