import { ServiceBucket } from '@/lib/tools/services';

export interface IntentAnalysis {
  primaryBucket: keyof ServiceBucket;
  secondaryBuckets: Array<keyof ServiceBucket>;
  serviceType: string;
  urgency: 'standard' | 'urgent' | 'emergency';
  confidence: number;
  extractedEntities: {
    dates?: string[];
    locations?: string[];
    people?: string[];
    preferences?: string[];
    budgetHints?: string[];
  };
  suggestedTier: 'good' | 'better' | 'extraordinary';
}

export interface PlanningContext {
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  memberProfile?: {
    tier: string;
    preferences: string[];
    previousServices: string[];
  };
}

/**
 * PLANNER: Parse intent into service buckets
 * Core logic for understanding member requests and routing to appropriate services
 */
export class IntentPlanner {
  
  private readonly bucketKeywords = {
    transportation: [
      'travel', 'flight', 'fly', 'jet', 'aviation', 'private plane', 'charter',
      'car', 'car service', 'luxury car', 'driver', 'chauffeur', 'transport', 'limousine', 'uber', 'ride',
      'yacht', 'boat', 'marine', 'sailing', 'cruise', 'helicopter', 'air', 'airline', 'shuttle', 'aircraft', 'air shuttle', 'shuttle service', 'transportation service'
    ],
    events: [
      'event', 'party', 'celebration', 'gala', 'premiere', 'opening', 'show',
      'concert', 'festival', 'access', 'tickets', 'vip', 'backstage',
      'venue', 'private venue', 'event venue', 'reserve', 'book', 'private dining', 'entertainment',
      'cultural', 'museum', 'theater', 'theatre', 'opera', 'ballet', 'broadway'
    ],
    brandDev: [
      'brand', 'branding', 'marketing', 'pr', 'publicity', 'media',
      'reputation', 'image', 'profile', 'positioning', 'strategy',
      'digital', 'social media', 'linkedin', 'personal brand',
      'thought leadership', 'speaking', 'consulting', 'advisory'
    ],
    investments: [
      'invest', 'investment', 'portfolio', 'wealth', 'financial', 'advisor',
      'fund', 'equity', 'hedge fund', 'private equity', 'venture capital',
      'wealth management', 'asset management', 'financial planning',
      'alternative investments', 'real estate', 'art investment'
    ],
    taglades: [
      'exclusive', 'members only', 'private club', 'elite', 'founder',
      'founders circle', 'networking', 'connections', 'innovation', 'lab', 'startup',
      'legacy', 'impact', 'philanthropy', 'giving', 'board',
      'executive', 'c-level', 'leadership', 'mentorship'
    ],
    lifestyle: [
      'personal', 'lifestyle', 'shopping', 'stylist', 'fashion',
      'interior', 'design', 'home', 'wellness', 'health', 'fitness',
      'concierge', 'assistant', 'luxury', 'premium', 'bespoke',
      'custom', 'curation', 'optimization', 'enhancement'
    ]
  };

  private readonly urgencyKeywords = {
    emergency: ['emergency', 'urgent', 'asap', 'immediately', 'crisis', 'critical'],
    urgent: ['soon', 'quickly', 'fast', 'priority', 'rush', 'expedite'],
    standard: ['plan', 'future', 'consider', 'explore', 'research']
  };

  private readonly tierIndicators = {
    extraordinary: [
      'best', 'finest', 'ultimate', 'exclusive', 'private', 'bespoke',
      'custom', 'premium', 'luxury', 'elite', 'extraordinary', 'exceptional',
      'world-class', 'top-tier', 'high-end', 'sophisticated'
    ],
    better: [
      'good', 'quality', 'nice', 'professional', 'reliable', 'recommended',
      'excellent', 'superior', 'enhanced', 'upgraded', 'advanced'
    ],
    good: [
      'basic', 'simple', 'standard', 'regular', 'normal', 'affordable',
      'budget', 'economical', 'practical', 'efficient'
    ]
  };

  /**
   * Main planning function - analyzes intent and creates execution plan
   */
  async planExecution(context: PlanningContext): Promise<IntentAnalysis> {
    const { message, conversationHistory, memberProfile } = context;
    
    // Extract entities and analyze intent
    const extractedEntities = this.extractEntities(message);
    const bucketScores = this.calculateBucketScores(message);
    const urgency = this.determineUrgency(message);
    const suggestedTier = this.determineTier(message, memberProfile);
    
    // Determine primary and secondary buckets
    const sortedBuckets = Object.entries(bucketScores)
      .sort(([,a], [,b]) => b - a);
    
    const primaryBucket = sortedBuckets[0][0] as keyof ServiceBucket;
    const secondaryBuckets = sortedBuckets
      .slice(1, 3)
      .filter(([,score]) => score > 0.3)
      .map(([bucket]) => bucket as keyof ServiceBucket);

    // Calculate confidence based on keyword matches and context
    const confidence = this.calculateConfidence(bucketScores, conversationHistory);
    
    // Determine specific service type within bucket
    const serviceType = this.determineServiceType(primaryBucket, message);

    return {
      primaryBucket,
      secondaryBuckets,
      serviceType,
      urgency,
      confidence,
      extractedEntities,
      suggestedTier
    };
  }

  /**
   * Extract entities like dates, locations, people from message
   */
  private extractEntities(message: string): IntentAnalysis['extractedEntities'] {
    const entities: IntentAnalysis['extractedEntities'] = {};

    // Extract dates
    const datePatterns = [
      /\b(today|tomorrow|tonight)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
      /\b(next|this)\s+(week|month|year)\b/gi
    ];
    
    entities.dates = [];
    datePatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        entities.dates!.push(...matches);
      }
    });

    // Extract locations
    const locationPattern = /\b(in|to|from|at)\s+([A-Z][a-zA-Z\s]+?)(?=\s|,|\.|\b)/g;
    const locationMatches = [...message.matchAll(locationPattern)];
    entities.locations = locationMatches.map(match => match[2].trim());

    // Extract number of people
    const peoplePattern = /\b(\d+)\s*(people|persons?|guests?|passengers?)\b/gi;
    const peopleMatches = [...message.matchAll(peoplePattern)];
    entities.people = peopleMatches.map(match => match[0]);

    // Extract preferences
    const preferenceKeywords = ['prefer', 'like', 'want', 'need', 'require', 'request'];
    entities.preferences = [];
    preferenceKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\s+([^.!?]+)`, 'gi');
      const matches = [...message.matchAll(regex)];
      entities.preferences!.push(...matches.map(match => match[1].trim()));
    });

    return entities;
  }

  /**
   * Calculate relevance scores for each service bucket
   */
  private calculateBucketScores(message: string): Record<keyof ServiceBucket, number> {
    const scores: Record<keyof ServiceBucket, number> = {
      transportation: 0,
      events: 0,
      brandDev: 0,
      investments: 0,
      taglades: 0,
      lifestyle: 0
    };

    const lowerMessage = message.toLowerCase();

    // Check for greetings and general inquiries first
    const greetingKeywords = [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'greetings', 'asteria', 'how are you', 'what can you do', 'help me',
      'assistance', 'services', 'what do you offer', 'capabilities'
    ];

    const isGreeting = greetingKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );

    // If it's a greeting, return lifestyle as primary with reasonable confidence
    if (isGreeting && lowerMessage.length < 50) {
      scores.lifestyle = 0.8;
      scores.taglades = 0.3;
      return scores;
    }

    Object.entries(this.bucketKeywords).forEach(([bucket, keywords]) => {
      let bucketScore = 0;
      
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        
        // Use word boundary matching for better precision
        let isMatch = false;
        
        if (keyword.includes(' ')) {
          // For phrases, use exact phrase matching
          isMatch = lowerMessage.includes(keywordLower);
        } else {
          // For single words, use word boundary regex
          const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i');
          isMatch = wordBoundaryRegex.test(lowerMessage);
        }
        
        if (isMatch) {
          // Base score for keyword match
          let keywordScore = 1;
          
          // Boost score for high-value keywords
          const highValueKeywords = {
            transportation: ['private jet', 'jet', 'aviation', 'private plane', 'charter', 'yacht', 'helicopter', 'air', 'airline', 'shuttle', 'aircraft', 'air shuttle', 'shuttle service', 'transportation service'],
            events: ['vip', 'exclusive', 'premiere', 'gala', 'private venue'],
            brandDev: ['personal brand', 'pr', 'media relations', 'reputation'],
            investments: ['investment', 'wealth management', 'portfolio', 'financial advisor'],
            taglades: ['exclusive', 'founders', 'elite', 'members only'],
            lifestyle: ['personal shopping', 'concierge', 'wellness', 'luxury']
          };
          
          if (highValueKeywords[bucket as keyof ServiceBucket]?.includes(keyword)) {
            keywordScore = 3; // 3x weight for high-value keywords
          }
          
          // Extra boost for exact phrase matches
          if (keyword.includes(' ') && lowerMessage.includes(keywordLower)) {
            keywordScore *= 2; // 2x bonus for phrase matches
          }
          
          bucketScore += keywordScore;
        }
      });
      
      // Normalize by keyword count but maintain higher scores
      scores[bucket as keyof ServiceBucket] = bucketScore / Math.sqrt(keywords.length);
    });

    // Find the maximum score to create relative confidence
    const maxScore = Math.max(...Object.values(scores));
    
    // Boost all scores if we have any matches to increase confidence
    if (maxScore > 0) {
      Object.keys(scores).forEach(bucket => {
        scores[bucket as keyof ServiceBucket] = scores[bucket as keyof ServiceBucket] / maxScore;
      });
    }

    return scores;
  }

  /**
   * Determine urgency level from message content
   */
  private determineUrgency(message: string): IntentAnalysis['urgency'] {
    const lowerMessage = message.toLowerCase();

    for (const [level, keywords] of Object.entries(this.urgencyKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return level as IntentAnalysis['urgency'];
      }
    }

    // Check for time-based urgency
    if (lowerMessage.includes('today') || lowerMessage.includes('tonight')) {
      return 'urgent';
    }
    if (lowerMessage.includes('tomorrow') || lowerMessage.includes('this week')) {
      return 'urgent';
    }

    return 'standard';
  }

  /**
   * Determine suggested service tier
   */
  private determineTier(
    message: string, 
    memberProfile?: PlanningContext['memberProfile']
  ): IntentAnalysis['suggestedTier'] {
    const lowerMessage = message.toLowerCase();

    // Check for explicit tier indicators
    for (const [tier, indicators] of Object.entries(this.tierIndicators)) {
      if (indicators.some(indicator => lowerMessage.includes(indicator))) {
        return tier as IntentAnalysis['suggestedTier'];
      }
    }

    // Use member profile to suggest tier
    if (memberProfile?.tier === 'founding' || memberProfile?.tier === 'elite') {
      return 'extraordinary';
    }
    if (memberProfile?.tier === 'premium') {
      return 'better';
    }

    // Default to 'better' for luxury service assumption
    return 'better';
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateConfidence(
    bucketScores: Record<keyof ServiceBucket, number>,
    conversationHistory: Array<{ role: string; content: string }>
  ): number {
    const maxScore = Math.max(...Object.values(bucketScores));
    
    // Base confidence on keyword matching strength
    let confidence = maxScore;
    
    // Boost confidence if there's clear conversation context
    if (conversationHistory.length > 2) {
      confidence += 0.1;
    }
    
    // Reduce confidence if multiple buckets have similar scores
    const highScoreBuckets = Object.values(bucketScores).filter(score => score > maxScore * 0.8);
    if (highScoreBuckets.length > 2) {
      confidence *= 0.8;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Determine specific service type within the identified bucket
   */
  private determineServiceType(bucket: keyof ServiceBucket, message: string): string {
    const lowerMessage = message.toLowerCase();

    const serviceTypeMap = {
      transportation: {
        'private aviation': ['jet', 'plane', 'aviation', 'flight', 'fly'],
        'ground transport': ['car', 'driver', 'chauffeur', 'limousine', 'ride'],
        'marine': ['yacht', 'boat', 'sailing', 'marine', 'cruise']
      },
      events: {
        'exclusive access': ['vip', 'access', 'tickets', 'backstage', 'premiere'],
        'private venue': ['venue', 'private', 'reserve', 'book', 'space'],
        'cultural': ['museum', 'theater', 'opera', 'cultural', 'art']
      },
      brandDev: {
        'personal brand': ['personal brand', 'image', 'reputation', 'profile'],
        'media relations': ['pr', 'publicity', 'media', 'press'],
        'digital presence': ['digital', 'social media', 'linkedin', 'online']
      },
      investments: {
        'wealth management': ['wealth', 'portfolio', 'financial planning'],
        'alternative investments': ['hedge fund', 'private equity', 'alternative'],
        'advisory': ['advisor', 'consulting', 'strategy', 'planning']
      },
      taglades: {
        'founders circle': ['founder', 'networking', 'connections', 'executive'],
        'innovation labs': ['innovation', 'startup', 'lab', 'technology'],
        'legacy programs': ['legacy', 'impact', 'philanthropy', 'giving']
      },
      lifestyle: {
        'personal shopping': ['shopping', 'stylist', 'fashion', 'wardrobe'],
        'interior design': ['interior', 'design', 'home', 'space'],
        'wellness': ['wellness', 'health', 'fitness', 'optimization']
      }
    };

    const bucketTypes = serviceTypeMap[bucket];
    if (!bucketTypes) return 'general';

    for (const [type, keywords] of Object.entries(bucketTypes)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return type;
      }
    }

    return 'general';
  }
} 