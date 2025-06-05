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
  const bestMatch = scores.reduce((prev, current) => 
    current.confidence > prev.confidence ? current : prev
  );
  
  return bestMatch;
}

module.exports = { classifyServiceRequest, SERVICE_BUCKETS }; 