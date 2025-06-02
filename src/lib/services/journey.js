// Member Journey Detection - determines conversation phase and confirmation status

// ENHANCED: Comprehensive confirmation phrases that indicate member wants to proceed
const CONFIRMATION_PHRASES = [
  // Direct booking commands
  'book it', 'let\'s book it', 'book this', 'please book', 'proceed', 'let\'s do it', 'let\'s proceed', 'confirm', 'yes, book', 'book now',
  
  // Agreement phrases  
  'perfect', 'sounds good', 'that works', 'yes please', 'absolutely', 'exactly', 'that\'s perfect', 'let\'s go with that',
  
  // Action phrases
  'arrange this', 'make it happen', 'set it up', 'organize this', 'handle this',
  
  // NEW: Intent to proceed phrases
  'go ahead', 'move forward', 'yes', 'yeah', 'sure', 'ok', 'okay', 'alright', 'sounds great', 'love it', 'do it', 'make it happen',
  
  // NEW: Commitment phrases
  'i\'m ready', 'ready to go', 'let\'s move', 'i\'m in', 'count me in', 'sign me up', 'i\'m interested', 'yes to this',
  
  // NEW: Decision phrases
  'i want this', 'this is what i want', 'this works for me', 'i like this', 'this is good', 'this is great', 'i choose this',
  
  // NEW: Action requests
  'send it', 'submit it', 'process this', 'take care of it', 'handle it', 'get this done', 'make this happen',
  
  // NEW: Urgency confirmations
  'book asap', 'do this now', 'urgent', 'rush this', 'priority', 'important', 'need this done',
  
  // NEW: Casual confirmations
  'yep', 'yup', 'for sure', 'definitely', 'without a doubt', 'let\'s go', 'i\'m down', 'sounds perfect',
  
  // NEW: Formal confirmations
  'i approve', 'approved', 'confirmed', 'authorization granted', 'green light', 'proceed with this',
  
  // NEW: Completion requests
  'finish this', 'complete this', 'wrap this up', 'close this out', 'finalize', 'seal the deal'
];

// Enhanced considering phrases for more nuanced detection
const CONSIDERING_PHRASES = [
  'tell me more', 'what are the options', 'i\'m thinking', 'maybe', 'possibly', 'what about', 'can you suggest', 'what would you recommend', 'i\'m not sure', 'let me think',
  
  // NEW: Information gathering
  'more details', 'additional info', 'clarification', 'explain', 'help me understand', 'what else', 'other options', 'alternatives',
  
  // NEW: Hesitation indicators
  'hmm', 'well', 'i don\'t know', 'uncertain', 'unsure', 'on the fence', 'torn between', 'weighing options'
];

function analyzeConversationPhase(message, conversationHistory = []) {
  const messageLower = message.toLowerCase();
  
  // ENHANCED: More sophisticated confirmation detection
  const isConfirming = CONFIRMATION_PHRASES.some(phrase => {
    // Exact phrase match or phrase at word boundaries
    const regex = new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    return regex.test(messageLower) || messageLower.includes(phrase);
  });
  
  // Check if still considering/gathering info
  const isConsidering = CONSIDERING_PHRASES.some(phrase => 
    messageLower.includes(phrase)
  );
  
  // ENHANCED: Better service keyword detection
  const hasServiceKeywords = containsServiceKeywords(message);
  
  // Analyze conversation context
  const conversationLength = conversationHistory.length;
  const hasServiceRequest = conversationHistory.some(entry => 
    entry.role === 'user' && containsServiceKeywords(entry.content)
  );
  
  // ENHANCED: More inclusive phase determination
  let phase = 'initial';
  let readyForTicket = false;
  
  if (conversationLength === 0) {
    // First message
    if (isConfirming && hasServiceKeywords) {
      phase = 'confirmation';
      readyForTicket = true;
    } else if (hasServiceKeywords) {
      phase = 'initial_request';
      readyForTicket = false;
    }
  } else if (hasServiceRequest || hasServiceKeywords) {
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
    hasServiceContext: hasServiceRequest || hasServiceKeywords
  };
}

function containsServiceKeywords(message) {
  const serviceKeywords = [
    // Transportation
    'private jet', 'flight', 'car service', 'yacht', 'helicopter', 'transportation', 'travel', 'ride', 'driver',
    
    // Dining & Events  
    'dinner', 'restaurant', 'table', 'reservation', 'event', 'nightclub', 'party', 'celebration',
    
    // Experiences
    'vip', 'champagne', 'bottle service', 'private', 'exclusive', 'luxury', 'premium',
    
    // Booking language
    'book', 'reserve', 'arrange', 'need', 'want', 'get', 'find', 'organize', 'handle', 'manage',
    
    // NEW: Universal service indicators
    'help with', 'assist with', 'coordinate', 'secure', 'obtain', 'source', 'provide', 'deliver', 'schedule',
    
    // NEW: Request patterns
    'can you', 'could you', 'would you', 'i need', 'i want', 'looking for', 'interested in', 'require'
  ];
  
  const messageLower = message.toLowerCase();
  return serviceKeywords.some(keyword => messageLower.includes(keyword));
}

// Enhanced service detection that considers journey phase
function detectServiceWithJourney(message, conversationHistory = []) {
  const journeyAnalysis = analyzeConversationPhase(message, conversationHistory);
  const hasServiceKeywords = containsServiceKeywords(message);
  
  // UNIVERSAL: Ensure every service-related conversation gets the journey treatment
  const isServiceRelated = hasServiceKeywords || journeyAnalysis.hasServiceContext || 
                          (journeyAnalysis.isConfirming && conversationHistory.length > 0);
  
  return {
    ...journeyAnalysis,
    isServiceRelated,
    shouldCreateTicket: journeyAnalysis.readyForTicket && isServiceRelated
  };
}

module.exports = {
  analyzeConversationPhase,
  detectServiceWithJourney,
  CONFIRMATION_PHRASES,
  CONSIDERING_PHRASES
}; 