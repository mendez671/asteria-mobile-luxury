const SERVICE_BUCKETS = [
  {
    id: 'transportation',
    name: 'Private aviation & transportation',
    keywords: ['flight', 'jet', 'plane', 'car', 'yacht', 'helicopter', 'transport', 'travel', 'driver', 'chauffeur'],
    priority_keywords: ['emergency', 'urgent', 'asap', 'today', 'tomorrow', 'same day'],
    detail_fields: ['departure_date', 'departure_time', 'departure_location', 'destination', 'passengers', 'aircraft_type', 'special_requests']
  },
  {
    id: 'events',
    name: 'Events & exclusive experiences',
    keywords: ['event', 'party', 'celebration', 'dinner', 'restaurant', 'reservation', 'concert', 'show', 'gala', 'experience'],
    priority_keywords: ['tonight', 'today', 'last minute', 'sold out'],
    detail_fields: ['event_date', 'event_time', 'location', 'guests', 'occasion', 'preferences', 'special_requests']
  },
  {
    id: 'brand_dev',
    name: 'Brand development & partnerships',
    keywords: ['brand', 'marketing', 'partnership', 'collaboration', 'pr', 'publicity', 'strategy', 'networking'],
    priority_keywords: ['deadline', 'launch', 'urgent'],
    detail_fields: ['project_type', 'timeline', 'budget', 'goals', 'target_audience']
  },
  {
    id: 'investments',
    name: 'Investment opportunities & connections',
    keywords: ['investment', 'investor', 'funding', 'deal', 'portfolio', 'financial', 'venture', 'capital'],
    priority_keywords: ['closing', 'deadline', 'opportunity'],
    detail_fields: ['investment_type', 'amount', 'timeline', 'risk_profile', 'sector_preference']
  },
  {
    id: 'taglades',
    name: 'TAGlades rewards & perks',
    keywords: ['taglades', 'rewards', 'points', 'perks', 'exclusive', 'member', 'benefits'],
    priority_keywords: ['expiring', 'limited', 'today only'],
    detail_fields: ['reward_type', 'points_available', 'preferences', 'redemption_date']
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle & personal services',
    keywords: ['shopping', 'personal', 'wellness', 'spa', 'fitness', 'health', 'home', 'cleaning', 'assistant'],
    priority_keywords: ['today', 'urgent', 'emergency'],
    detail_fields: ['service_type', 'date', 'time', 'location', 'preferences', 'budget']
  },
  {
    id: 'custom',
    name: 'Custom & specialized requests',
    keywords: ['help', 'need', 'want', 'can you', 'could you', 'would you', 'please', 'assist', 'arrange', 'organize', 'handle', 'manage', 'coordinate', 'secure', 'obtain', 'get', 'find', 'source', 'provide', 'deliver', 'book', 'reserve', 'schedule'],
    priority_keywords: ['urgent', 'asap', 'emergency', 'critical', 'important', 'priority', 'rush', 'immediate'],
    detail_fields: ['request_type', 'timeline', 'location', 'budget', 'special_requirements', 'preferences']
  }
];

function classifyServiceRequest(message) {
  const lowerMessage = message.toLowerCase();
  
  // Calculate scores for each bucket
  const scores = SERVICE_BUCKETS.map(bucket => {
    const keywordMatches = bucket.keywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length;
    
    const priorityMatches = bucket.priority_keywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length;
    
    const confidence = (keywordMatches * 10) + (priorityMatches * 5);
    
    return {
      bucket,
      confidence,
      is_urgent: priorityMatches > 0
    };
  });
  
  // Find highest scoring bucket
  let bestMatch = scores.reduce((prev, current) => 
    current.confidence > prev.confidence ? current : prev
  );
  
  // ENHANCED: Universal fallback - if no strong match found, use custom category
  if (bestMatch.confidence === 0) {
    // Check if message contains any service-like intent
    const serviceIndicators = [
      'i need', 'i want', 'can you', 'could you', 'help me', 'arrange', 'book', 'get me', 
      'find me', 'organize', 'please', 'looking for', 'interested in', 'require'
    ];
    
    const hasServiceIntent = serviceIndicators.some(indicator => 
      lowerMessage.includes(indicator)
    );
    
    if (hasServiceIntent) {
      // Assign to custom category with medium confidence
      bestMatch = {
        bucket: SERVICE_BUCKETS.find(bucket => bucket.id === 'custom'),
        confidence: 15, // Medium confidence for catch-all
        is_urgent: false
      };
    }
  }
  
  return bestMatch;
}

module.exports = { classifyServiceRequest, SERVICE_BUCKETS }; 