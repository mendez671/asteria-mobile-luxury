import { ServiceBucket } from '@/lib/tools/services';
import OpenAI from 'openai';

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

export interface ToolExecutionPlan {
  toolName: string;
  parameters: Record<string, any>;
  priority: number;
  reasoning: string;
  expectedOutput: string;
}

export interface EnhancedExecutionPlan {
  primaryAction: string;
  strategy: 'direct_fulfillment' | 'research_first' | 'multi_step' | 'escalation';
  tools: ToolExecutionPlan[];
  searchStrategy?: {
    webSearchNeeded: boolean;
    internalDocsNeeded: boolean;
    ragKnowledgeNeeded: boolean;
    searchQueries: string[];
  };
  expectedOutcome: string;
  fallbackActions: string[];
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
      'yacht', 'boat', 'marine', 'sailing', 'cruise', 'helicopter', 'air', 'airline', 'shuttle', 'aircraft', 'air shuttle', 'shuttle service', 'transportation service',
      // Enhanced aircraft types and manufacturers
      'gulfstream', 'citation', 'bombardier', 'global express', 'hawker', 'learjet', 'falcon', 'embraer', 'phenom', 'legacy',
      // Luxury aviation terms
      'private aviation', 'executive jet', 'corporate jet', 'luxury jet', 'business jet', 'turboprop', 'midsize jet', 'heavy jet', 'light jet'
    ],
    events: [
      'event', 'party', 'celebration', 'gala', 'premiere', 'opening', 'show',
      'concert', 'festival', 'access', 'tickets', 'vip', 'backstage',
      'venue', 'private venue', 'event venue', 'reserve', 'book', 'private dining', 'entertainment',
      'cultural', 'museum', 'theater', 'theatre', 'opera', 'ballet', 'broadway',
      'dining', 'restaurant', 'reservation', 'chef', 'sommelier', 'wine', 'food', 'culinary', 'tasting', 'michelin',
      'michelin star', 'fine dining', 'haute cuisine', 'gastronomy', 'epicurean', 'gourmet', 'breakfast', 'lunch', 'dinner',
      'brunch', 'anniversary dinner', 'date night', 'romantic dinner', 'business dinner', 'celebration dinner'
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
      'custom', 'curation', 'optimization', 'enhancement',
      'romantic', 'getaway', 'vacation', 'retreat', 'spa', 'couples',
      'anniversary', 'honeymoon', 'romance', 'weekend', 'escape',
      // CRITICAL FIX: Add hotel keywords and remove dining duplicates
      'hotel', 'suite', 'accommodation', 'stay', 'lodge', 'resort', 'presidential suite', 'royal suite',
      'luxury hotel', 'five star', 'ritz', 'four seasons', 'mandarin oriental', 'peninsula', 'palace hotel'
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
    
    console.log(`🧠 [PLANNER] DIAGNOSTIC: Analyzing message: "${message}"`);
    console.log(`🧠 [PLANNER] Context: history=${conversationHistory.length}, member=${memberProfile?.tier || 'guest'}`);
    
    // ===============================
    // ENHANCED: CONVERSATION CONTEXT ANALYSIS
    // Check if this is a follow-up message that should inherit context
    // ===============================
    const conversationContext = this.analyzeConversationContext(conversationHistory);
    console.log(`🧠 [PLANNER] Conversation context:`, conversationContext);
    
    // Extract entities from current message AND conversation history
    const extractedEntities = this.extractEntitiesWithHistory(message, conversationHistory);
    console.log(`🧠 [PLANNER] Extracted entities:`, extractedEntities);
    
    // Calculate bucket scores with conversation context boost
    const bucketScores = this.calculateBucketScoresWithContext(message, conversationContext);
    console.log(`🧠 [PLANNER] Bucket scores:`, bucketScores);
    
    const urgency = this.determineUrgency(message);
    console.log(`🧠 [PLANNER] Urgency: ${urgency}`);
    
    const suggestedTier = this.determineTier(message, memberProfile);
    console.log(`🧠 [PLANNER] Suggested tier: ${suggestedTier}`);
    
    // Determine primary and secondary buckets
    const sortedBuckets = Object.entries(bucketScores)
      .sort(([,a], [,b]) => b - a);
    
    console.log(`🧠 [PLANNER] Sorted buckets:`, sortedBuckets);
    
    const primaryBucket = sortedBuckets[0][0] as keyof ServiceBucket;
    const secondaryBuckets = sortedBuckets
      .slice(1, 3)
      .filter(([,score]) => score > 0.3)
      .map(([bucket]) => bucket as keyof ServiceBucket);

    console.log(`🧠 [PLANNER] Primary bucket: ${primaryBucket}`);
    console.log(`🧠 [PLANNER] Secondary buckets:`, secondaryBuckets);

    // Calculate confidence with conversation context awareness
    const confidence = this.calculateConfidenceWithContext(bucketScores, conversationHistory, conversationContext);
    console.log(`🧠 [PLANNER] Confidence: ${confidence}`);
    
    // Determine specific service type within bucket
    const serviceType = this.determineServiceTypeWithContext(primaryBucket, message, conversationContext);
    console.log(`🧠 [PLANNER] Service type: ${serviceType}`);

    const result = {
      primaryBucket,
      secondaryBuckets,
      serviceType,
      urgency,
      confidence,
      extractedEntities,
      suggestedTier
    };

    console.log(`🧠 [PLANNER] FINAL RESULT:`, result);
    return result;
  }

  /**
   * ===============================
   * ENHANCED CONVERSATION CONTEXT METHODS
   * ===============================
   */

  /**
   * Analyze conversation history for context patterns
   */
  private analyzeConversationContext(conversationHistory: Array<{ role: string; content: string }>) {
    const allMessages = conversationHistory.map(m => m.content.toLowerCase()).join(' ');
    
    return {
      hasAviationContext: /\b(flight|jet|aviation|private plane|charter|aircraft|plane|fly|gulfstream|citation|bombardier)\b/.test(allMessages),
      hasDiningContext: /\b(restaurant|dining|michelin|chef|reservation|food|culinary|tasting)\b/.test(allMessages),
      hasLocationContext: /\b(las vegas|henderson|miami|paris|london|new york)\b/.test(allMessages),
      hasTimingContext: /\b(tomorrow|tonight|next week|morning|evening)\b/.test(allMessages),
      hasPassengerContext: /\b(\d+\s*(passengers?|people|guests?))\b/.test(allMessages),
      isFollowUpMessage: conversationHistory.length > 0,
      dominantBucket: this.getDominantBucketFromHistory(allMessages),
      contextStrength: Math.min(conversationHistory.length * 0.2, 1.0)
    };
  }

  /**
   * Get the dominant bucket from conversation history
   */
  private getDominantBucketFromHistory(allMessages: string): keyof ServiceBucket | null {
    const scores = this.calculateBucketScores(allMessages);
    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore > 0.3) {
      const dominantBucket = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
      return dominantBucket as keyof ServiceBucket;
    }
    
    return null;
  }

  /**
   * Extract entities with conversation history awareness
   */
  private extractEntitiesWithHistory(
    message: string, 
    conversationHistory: Array<{ role: string; content: string }>
  ): IntentAnalysis['extractedEntities'] {
    // Get entities from current message
    const currentEntities = this.extractEntities(message);
    
    // Get entities from conversation history
    const allMessages = conversationHistory.map(m => m.content).join(' ') + ' ' + message;
    const historicalEntities = this.extractEntities(allMessages);
    
    // Merge and prioritize
    return {
      dates: [...(currentEntities.dates || []), ...(historicalEntities.dates || [])].filter((v, i, a) => a.indexOf(v) === i),
      locations: [...(currentEntities.locations || []), ...(historicalEntities.locations || [])].filter((v, i, a) => a.indexOf(v) === i),
      people: [...(currentEntities.people || []), ...(historicalEntities.people || [])].filter((v, i, a) => a.indexOf(v) === i),
      preferences: [...(currentEntities.preferences || []), ...(historicalEntities.preferences || [])].filter((v, i, a) => a.indexOf(v) === i),
      budgetHints: [...(currentEntities.budgetHints || []), ...(historicalEntities.budgetHints || [])].filter((v, i, a) => a.indexOf(v) === i)
    };
  }

  /**
   * Calculate bucket scores with conversation context boost
   */
  private calculateBucketScoresWithContext(
    message: string, 
    conversationContext: any
  ): Record<keyof ServiceBucket, number> {
    // Get base scores from current message
    const baseScores = this.calculateBucketScores(message);
    
    // Apply conversation context boosts
    if (conversationContext.isFollowUpMessage) {
      // Boost the dominant bucket from conversation history
      if (conversationContext.dominantBucket && conversationContext.dominantBucket in baseScores) {
        const bucket = conversationContext.dominantBucket as keyof ServiceBucket;
        baseScores[bucket] = Math.max(
          baseScores[bucket] + conversationContext.contextStrength,
          0.8 // Minimum boost for follow-up messages in context
        );
      }
      
      // Apply specific context boosts
      if (conversationContext.hasAviationContext) {
        baseScores.transportation = Math.max(baseScores.transportation + 0.7, 0.8);
      }
      
      if (conversationContext.hasDiningContext) {
        baseScores.lifestyle = Math.max(baseScores.lifestyle + 0.5, 0.7);
      }
    }
    
    return baseScores;
  }

  /**
   * Calculate confidence with conversation context awareness
   */
  private calculateConfidenceWithContext(
    bucketScores: Record<keyof ServiceBucket, number>,
    conversationHistory: Array<{ role: string; content: string }>,
    conversationContext: any
  ): number {
    // Get base confidence
    const baseConfidence = this.calculateConfidence(bucketScores, conversationHistory);
    
    // Apply conversation context boost
    if (conversationContext.isFollowUpMessage) {
      const maxScore = Math.max(...Object.values(bucketScores));
      
      // High boost if we have strong context match
      if (conversationContext.hasAviationContext || conversationContext.hasDiningContext) {
        return Math.max(baseConfidence + 0.4, 0.8);
      }
      
      // Medium boost for any follow-up with context
      if (maxScore > 0.5) {
        return Math.max(baseConfidence + 0.3, 0.7);
      }
    }
    
    return baseConfidence;
  }

  /**
   * Determine service type with conversation context
   */
  private determineServiceTypeWithContext(
    bucket: keyof ServiceBucket, 
    message: string, 
    conversationContext: any
  ): string {
    // Get base service type
    const baseServiceType = this.determineServiceType(bucket, message);
    
    // Apply conversation context enhancements
    if (conversationContext.hasAviationContext && bucket === 'transportation') {
      return 'private aviation';
    }
    
    if (conversationContext.hasDiningContext && bucket === 'lifestyle') {
      return 'fine dining';
    }
    
    return baseServiceType;
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
    const locationPattern = /\b(in|to|from|at|closest to)\s+([A-Z][a-zA-Z\s]+?)(?=\s|,|\.|\b)/g;
    const locationMatches = [...message.matchAll(locationPattern)];
    entities.locations = locationMatches.map(match => match[2].trim());
    
    // Also extract location names directly (for cities like henderson, vegas)
    const directLocationPattern = /\b(henderson|vegas|miami|paris|london|new york|los angeles|chicago)\b/gi;
    const directMatches = [...message.matchAll(directLocationPattern)];
    if (directMatches.length > 0) {
      entities.locations = [...(entities.locations || []), ...directMatches.map(match => match[0])];
    }

    // Extract number of people
    const peoplePattern = /\b(\d+)\s*(people|persons?|guests?|passengers?|of us)\b/gi;
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
            transportation: ['private jet', 'jet', 'aviation', 'private plane', 'charter', 'yacht', 'helicopter', 'air', 'airline', 'shuttle', 'aircraft', 'air shuttle', 'shuttle service', 'transportation service', 'gulfstream', 'citation', 'bombardier', 'global express', 'private aviation', 'executive jet', 'corporate jet', 'luxury jet', 'business jet'],
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

  /**
   * ===============================
   * ENHANCED EXECUTION PLANNING WITH OpenAI INTEGRATION
   * Creates intelligent tool execution plans based on intent analysis and context
   * ===============================
   */
  async createEnhancedExecutionPlan(
    intentAnalysis: IntentAnalysis,
    context: PlanningContext
  ): Promise<EnhancedExecutionPlan> {
    console.log('🧠 [ENHANCED_PLANNER] Creating OpenAI-powered execution plan...');
    console.log('🧠 [ENHANCED_PLANNER] Intent:', intentAnalysis.primaryBucket, '-', intentAnalysis.serviceType);
    console.log('🧠 [ENHANCED_PLANNER] Confidence:', intentAnalysis.confidence);

    try {
      // Step 1: Create OpenAI execution plan
      const aiPlan = await this.generateAIExecutionPlan(intentAnalysis, context);
      
      // Step 2: Map AI plan to actual tools available in the system
      const toolPlan = this.mapAIPlanToTools(aiPlan, intentAnalysis, context);
      
      // Step 3: Add search strategy if needed
      const searchStrategy = this.createSearchStrategy(intentAnalysis, context, aiPlan);
      
      console.log('✅ [ENHANCED_PLANNER] Generated plan with', toolPlan.tools.length, 'tools');
      
      return {
        ...toolPlan,
        searchStrategy
      };

    } catch (error) {
      console.error('⚠️ [ENHANCED_PLANNER] AI planning failed, using fallback:', error);
      return this.createFallbackExecutionPlan(intentAnalysis, context);
    }
  }

  /**
   * Generate AI-powered execution plan using OpenAI
   */
  private async generateAIExecutionPlan(
    intentAnalysis: IntentAnalysis,
    context: PlanningContext
  ): Promise<any> {
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not available');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an AI assistant for a luxury concierge service called ASTERIA. 
Create an intelligent execution plan for member requests.

Available tools:
- web_search: Real-time web search with Tavily API and internal documentation
- search_luxury_knowledge: RAG search of luxury service knowledge base
- fetch_active_services: Get available luxury services by category
- amadeus_flight_search: Search flights with Amadeus API
- stripe_payment_intent: Create payment processing workflows
- notify_concierge: Alert human concierge team
- escalate_to_human: Escalate complex requests
- create_service_ticket: Create service request tickets

Member context:
- Tier: ${context.memberProfile?.tier || 'standard'}
- Primary intent: ${intentAnalysis.primaryBucket}
- Service type: ${intentAnalysis.serviceType}
- Confidence: ${intentAnalysis.confidence}
- Urgency: ${intentAnalysis.urgency}

Provide a JSON response with:
- primaryAction: main action to take
- strategy: execution approach (direct_fulfillment, research_first, multi_step, escalation)
- recommendedTools: array of {toolName, reasoning, priority}
- searchQueries: array of search terms if research needed
- expectedOutcome: what should be achieved`;

    const userPrompt = `Member request: "${context.message}"

Conversation history: ${context.conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

Create an execution plan that leverages available tools effectively.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const aiResponse = response.choices[0].message.content;
    console.log('🧠 [AI_PLAN] Raw response:', aiResponse);

    try {
      // Clean the response - remove markdown code blocks if present
      const cleanResponse = aiResponse?.replace(/```json\s*|\s*```/g, '').trim() || '{}';
      return JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('⚠️ [AI_PLAN] Failed to parse JSON, extracting key info');
      // Fallback: extract key information from text response
      return {
        primaryAction: this.extractAction(aiResponse || ''),
        strategy: this.extractStrategy(aiResponse || ''),
        recommendedTools: this.extractTools(aiResponse || ''),
        searchQueries: this.extractSearchQueries(aiResponse || ''),
        expectedOutcome: 'Luxury service fulfillment'
      };
    }
  }

  /**
   * Map AI plan to actual available tools
   */
  private mapAIPlanToTools(
    aiPlan: any,
    intentAnalysis: IntentAnalysis,
    context: PlanningContext
  ): EnhancedExecutionPlan {
    
    const tools: ToolExecutionPlan[] = [];
    let priority = 1;

    // Always start with knowledge search for luxury context
    if (intentAnalysis.confidence > 0.6) {
      tools.push({
        toolName: 'search_luxury_knowledge',
        parameters: {
          query: context.message,
          serviceCategory: intentAnalysis.primaryBucket,
          memberTier: context.memberProfile?.tier || 'all-members',
          intent: intentAnalysis.primaryBucket
        },
        priority: priority++,
        reasoning: 'Search luxury knowledge base for premium service options',
        expectedOutput: 'Curated luxury service recommendations'
      });
    }

    // Add web search if research is needed
    if (aiPlan.strategy === 'research_first' || aiPlan.searchQueries?.length > 0) {
      tools.push({
        toolName: 'web_search',
        parameters: {
          query: aiPlan.searchQueries?.[0] || context.message,
          maxResults: 6,
          memberTier: context.memberProfile?.tier || 'all-members',
          intent: intentAnalysis.primaryBucket,
          includeInternalDocs: true,
          realTimeData: true
        },
        priority: priority++,
        reasoning: 'Gather current information and internal documentation',
        expectedOutput: 'Real-time information and internal service guides'
      });
    }

    // Add service-specific tools based on intent
    switch (intentAnalysis.primaryBucket) {
      case 'transportation':
        if (intentAnalysis.serviceType.includes('aviation') || intentAnalysis.serviceType.includes('flight')) {
          tools.push({
            toolName: 'amadeus_flight_search',
            parameters: {
              origin: intentAnalysis.extractedEntities.locations?.[0] || 'LAS',
              destination: intentAnalysis.extractedEntities.locations?.[1] || 'MIA',
              departureDate: intentAnalysis.extractedEntities.dates?.[0] || 'tomorrow',
              passengers: intentAnalysis.extractedEntities.people?.[0] || '1'
            },
            priority: priority++,
            reasoning: 'Search available flights for transportation request',
            expectedOutput: 'Flight options with pricing and availability'
          });
        }
        break;

      case 'events':
      case 'lifestyle':
        tools.push({
          toolName: 'fetch_active_services',
          parameters: {
            bucket: intentAnalysis.primaryBucket,
            tier: context.memberProfile?.tier || 'all-members',
            searchTerm: intentAnalysis.serviceType
          },
          priority: priority++,
          reasoning: 'Find available luxury services matching request',
          expectedOutput: 'Curated service options and providers'
        });
        break;
    }

    // Add escalation if confidence is low or urgency is high
    if (intentAnalysis.confidence < 0.4 || intentAnalysis.urgency === 'urgent') {
      tools.push({
        toolName: 'notify_concierge',
        parameters: {
          message: context.message,
          urgency: intentAnalysis.urgency,
          category: intentAnalysis.primaryBucket,
          memberTier: context.memberProfile?.tier || 'standard'
        },
        priority: priority++,
        reasoning: 'Alert concierge team for personalized assistance',
        expectedOutput: 'Human concierge engagement'
      });
    }

    return {
      primaryAction: aiPlan.primaryAction || `Fulfill ${intentAnalysis.primaryBucket} request`,
      strategy: aiPlan.strategy || 'multi_step',
      tools,
      expectedOutcome: aiPlan.expectedOutcome || 'Exceptional luxury service delivery',
      fallbackActions: [
        'Escalate to senior concierge',
        'Schedule consultation call',
        'Provide alternative service options'
      ]
    };
  }

  /**
   * Create search strategy based on intent and AI plan
   */
  private createSearchStrategy(
    intentAnalysis: IntentAnalysis,
    context: PlanningContext,
    aiPlan: any
  ) {
    const hasComplexRequirements = (intentAnalysis.extractedEntities.locations?.length || 0) > 1 ||
                                   (intentAnalysis.extractedEntities.dates?.length || 0) > 0 ||
                                   (intentAnalysis.extractedEntities.people?.length || 0) > 0;

    const searchQueries = [
      context.message,
      `luxury ${intentAnalysis.primaryBucket} services`,
      `${intentAnalysis.serviceType} premium options`,
      ...(aiPlan.searchQueries || [])
    ].slice(0, 3); // Limit to 3 queries

    return {
      webSearchNeeded: hasComplexRequirements || intentAnalysis.confidence < 0.7,
      internalDocsNeeded: true, // Always search internal docs for luxury context
      ragKnowledgeNeeded: intentAnalysis.confidence > 0.5,
      searchQueries
    };
  }

  /**
   * Create fallback execution plan when AI planning fails
   */
  private createFallbackExecutionPlan(
    intentAnalysis: IntentAnalysis,
    context: PlanningContext
  ): EnhancedExecutionPlan {
    
    const tools: ToolExecutionPlan[] = [
      {
        toolName: 'search_luxury_knowledge',
        parameters: {
          query: context.message,
          serviceCategory: intentAnalysis.primaryBucket,
          memberTier: context.memberProfile?.tier || 'all-members'
        },
        priority: 1,
        reasoning: 'Fallback: Search luxury knowledge base',
        expectedOutput: 'Basic service information'
      },
      {
        toolName: 'fetch_active_services',
        parameters: {
          bucket: intentAnalysis.primaryBucket,
          tier: context.memberProfile?.tier || 'all-members'
        },
        priority: 2,
        reasoning: 'Fallback: Get available services',
        expectedOutput: 'Service options list'
      }
    ];

    return {
      primaryAction: `Process ${intentAnalysis.primaryBucket} request`,
      strategy: 'direct_fulfillment',
      tools,
      searchStrategy: {
        webSearchNeeded: false,
        internalDocsNeeded: true,
        ragKnowledgeNeeded: true,
        searchQueries: [context.message]
      },
      expectedOutcome: 'Basic service fulfillment',
      fallbackActions: ['Escalate to human concierge']
    };
  }

  /**
   * Helper methods for parsing AI responses when JSON parsing fails
   */
  private extractAction(response: string): string {
    const actionMatch = response.match(/(?:primaryAction|action)["']?\s*:?\s*["']?([^",\n]+)/i);
    return actionMatch?.[1]?.trim() || 'Process request';
  }

  private extractStrategy(response: string): EnhancedExecutionPlan['strategy'] {
    const strategyMatch = response.match(/(?:strategy)["']?\s*:?\s*["']?([^",\n]+)/i);
    const strategy = strategyMatch?.[1]?.trim().toLowerCase();
    
    if (strategy?.includes('research')) return 'research_first';
    if (strategy?.includes('multi')) return 'multi_step';
    if (strategy?.includes('escalat')) return 'escalation';
    return 'direct_fulfillment';
  }

  private extractTools(response: string): string[] {
    const toolMatches = response.match(/(?:tool|toolName)["']?\s*:?\s*["']?([^",\n]+)/gi);
    return toolMatches?.map(match => 
      match.replace(/(?:tool|toolName)["']?\s*:?\s*["']?/i, '').trim()
    ) || [];
  }

  private extractSearchQueries(response: string): string[] {
    const queryMatches = response.match(/(?:search|query)["']?\s*:?\s*["']?([^",\n]+)/gi);
    return queryMatches?.map(match => 
      match.replace(/(?:search|query)["']?\s*:?\s*["']?/i, '').trim()
    ) || [];
  }
} 