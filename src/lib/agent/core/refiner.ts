// ===============================
// WEEK 2: CORE FLOW OPTIMIZATION - Response Refinement System
// Quality assessment and enhancement for luxury concierge responses
// ===============================

interface QualityMetrics {
  specificity: number;
  tool_integration: number;
  personalization: number;
  completeness: number;
  luxury_language: number;
}

interface QualityAssessment {
  score: number;
  metrics: QualityMetrics;
  issues: string[];
  enhancements: string[];
  confidence: number;
}

interface RefinedResponse {
  message: string;
  refined: boolean;
  quality: number;
  enhancements: string[];
  original_score: number;
  improvement_delta: number;
}

interface LearningData {
  intent_accuracy: number;
  tool_effectiveness: number;
  response_personalization: number;
  member_satisfaction_predicted: number;
  timestamp: Date;
  member_tier: string;
  request_type: string;
}

export class ResponseRefiner {
  private qualityThresholds = {
    excellent: 8.5,
    good: 7.0,
    acceptable: 5.0,
    poor: 3.0
  };

  private luxuryIndicators = [
    'curate', 'arrange', 'coordinate', 'exceptional', 'bespoke',
    'masterfully', 'exquisite', 'premium', 'exclusive', 'sophisticated',
    'seamless', 'magnificent', 'extraordinary', 'distinguished'
  ];

  private genericPhrases = [
    'I can help you', 'Let me assist', 'I understand', 'Thank you for',
    'I will try to', 'I might be able', 'I will look into'
  ];

  async refineResponse(
    response: any,
    context: any,
    toolResults: any[]
  ): Promise<RefinedResponse> {
    console.log('🔧 [REFINER] Starting response refinement analysis');
    
    try {
      // Step 1: Quality assessment
      const quality = await this.assessQuality(response, context, toolResults);
      console.log(`📊 [REFINER] Quality score: ${quality.score.toFixed(2)}/10 (${this.getQualityLevel(quality.score)})`);
      
      let refinedMessage = response.message;
      let enhancements: string[] = [];
      const originalScore = quality.score;
      
      // Step 2: Enhancement if needed
      if (quality.score < this.qualityThresholds.good) {
        console.log(`🔧 [REFINER] Quality below threshold (${this.qualityThresholds.good}), enhancing response`);
        const enhanced = await this.enhance(response, quality.issues, toolResults, context);
        refinedMessage = enhanced.message;
        enhancements = enhanced.enhancements;
      }
      
      // Step 3: Learning extraction
      const learnings = {
        intent_accuracy: quality.metrics.tool_integration,
        tool_effectiveness: this.analyzeToolResults(toolResults),
        response_personalization: quality.metrics.personalization,
        member_satisfaction_predicted: quality.score,
        timestamp: new Date(),
        member_tier: context.memberTier || 'standard',
        request_type: context.intent?.category || 'unknown'
      };
      
      // Step 4: Store for continuous improvement
      await this.storeLearnings(learnings, context);
      
      // Calculate improvement
      const finalQuality = await this.assessQuality({ message: refinedMessage }, context, toolResults);
      const improvementDelta = finalQuality.score - originalScore;
      
      console.log(`✅ [REFINER] Refinement complete: ${originalScore.toFixed(2)} → ${finalQuality.score.toFixed(2)} (+${improvementDelta.toFixed(2)})`);
      
      return {
        message: refinedMessage,
        refined: enhancements.length > 0,
        quality: finalQuality.score,
        enhancements,
        original_score: originalScore,
        improvement_delta: improvementDelta
      };
      
    } catch (error) {
      console.error('❌ [REFINER] Refinement failed:', error);
      return {
        message: response.message,
        refined: false,
        quality: 5.0,
        enhancements: [],
        original_score: 5.0,
        improvement_delta: 0
      };
    }
  }

  private async assessQuality(
    response: any,
    context: any,
    toolResults: any[]
  ): Promise<QualityAssessment> {
    const message = response.message || '';
    
    const metrics: QualityMetrics = {
      specificity: this.measureSpecificity(message),
      tool_integration: this.measureToolIntegration(message, toolResults),
      personalization: this.measurePersonalization(message, context),
      completeness: this.measureCompleteness(response, context.request),
      luxury_language: this.measureLuxuryLanguage(message)
    };
    
    // Weighted scoring
    const weights = {
      specificity: 0.25,
      tool_integration: 0.25,
      personalization: 0.20,
      completeness: 0.15,
      luxury_language: 0.15
    };
    
    const score = Object.entries(metrics).reduce((total, [key, value]) => {
      return total + (value * weights[key as keyof QualityMetrics]);
    }, 0) * 10;
    
    const issues = this.identifyIssues(metrics, message);
    const enhancements = this.suggestEnhancements(metrics, issues);
    
    return {
      score,
      metrics,
      issues,
      enhancements,
      confidence: this.calculateConfidence(metrics)
    };
  }

  private measureSpecificity(message: string): number {
    // Score based on specific details vs generic language
    const specificIndicators = [
      /\$[\d,]+-[\d,]+/, // Price ranges
      /\d+\s*(passengers?|hours?|minutes?)/, // Quantities
      /(Citation|Gulfstream|Michelin|Suite|Presidential)/, // Specific names
      /(tonight|tomorrow|this weekend|next week)/, // Specific times
      /\d{1,2}:\d{2}\s*(AM|PM)/i // Specific times
    ];
    
    const genericCount = this.genericPhrases.filter(phrase => 
      message.toLowerCase().includes(phrase.toLowerCase())
    ).length;
    
    const specificCount = specificIndicators.filter(pattern => pattern.test(message)).length;
    
    // Penalty for generic phrases, bonus for specific details
    return Math.max(0, Math.min(1, 0.5 + (specificCount * 0.2) - (genericCount * 0.3)));
  }

  private measureToolIntegration(message: string, toolResults: any[]): number {
    if (!toolResults || toolResults.length === 0) return 0.3; // Base score for no tools
    
    const successfulTools = toolResults.filter(tool => tool.success && tool.data);
    if (successfulTools.length === 0) return 0.1;
    
    // Check if tool results are reflected in the response
    let integrationScore = 0;
    
    for (const tool of successfulTools) {
      if (tool.data.results || tool.data.services || tool.data.knowledge) {
        // Look for evidence of tool data in response
        if (this.containsToolEvidence(message, tool)) {
          integrationScore += 0.4;
        }
      }
    }
    
    return Math.min(1, integrationScore);
  }

  private containsToolEvidence(message: string, tool: any): boolean {
    if (!tool.data) return false;
    
    // Check for knowledge integration
    if (tool.data.results) {
      for (const result of tool.data.results) {
        if (result.content && this.hasContentOverlap(message, result.content)) {
          return true;
        }
      }
    }
    
    // Check for service integration
    if (tool.data.services && tool.data.services.length > 0) {
      const hasServiceTerms = message.includes('service') || message.includes('available') || message.includes('option');
      return hasServiceTerms;
    }
    
    return false;
  }

  private hasContentOverlap(message: string, content: string): boolean {
    const messageWords = message.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    const overlap = messageWords.filter(word => 
      word.length > 3 && contentWords.includes(word)
    );
    
    return overlap.length >= 2;
  }

  private measurePersonalization(message: string, context: any): number {
    const memberTier = context.memberTier || 'standard';
    const memberName = context.memberProfile?.name;
    
    let score = 0.3; // Base score
    
    // Tier-appropriate language
    if (memberTier === 'founding10' && message.includes('priority')) score += 0.3;
    if (memberTier === 'fifty-k' && message.includes('exclusive')) score += 0.2;
    if (message.includes('member') || message.includes('your')) score += 0.2;
    
    // Personal touch
    if (memberName && message.includes(memberName)) score += 0.3;
    
    return Math.min(1, score);
  }

  private measureCompleteness(response: any, request: any): number {
    // Basic completeness based on response length and structure
    const message = response.message || '';
    
    if (message.length < 50) return 0.2;
    if (message.length < 100) return 0.5;
    if (message.length < 200) return 0.7;
    
    // Bonus for including next steps or actions
    if (message.includes('shall I') || message.includes('would you like') || message.includes('next step')) {
      return Math.min(1, 0.8 + 0.2);
    }
    
    return 0.8;
  }

  private measureLuxuryLanguage(message: string): number {
    const luxuryCount = this.luxuryIndicators.filter(indicator =>
      message.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    const genericCount = this.genericPhrases.filter(phrase =>
      message.toLowerCase().includes(phrase.toLowerCase())
    ).length;
    
    // More luxury language = higher score, generic language = penalty
    return Math.max(0, Math.min(1, (luxuryCount * 0.2) - (genericCount * 0.2) + 0.3));
  }

  private identifyIssues(metrics: QualityMetrics, message: string): string[] {
    const issues: string[] = [];
    
    if (metrics.specificity < 0.4) issues.push('Response lacks specific details');
    if (metrics.tool_integration < 0.3) issues.push('Tool results not integrated');
    if (metrics.personalization < 0.3) issues.push('Response not personalized');
    if (metrics.completeness < 0.5) issues.push('Response incomplete');
    if (metrics.luxury_language < 0.3) issues.push('Language not sufficiently sophisticated');
    
    // Check for specific problems
    if (this.genericPhrases.some(phrase => message.includes(phrase))) {
      issues.push('Contains generic language');
    }
    
    if (message.length < 80) {
      issues.push('Response too brief');
    }
    
    return issues;
  }

  private suggestEnhancements(metrics: QualityMetrics, issues: string[]): string[] {
    const enhancements: string[] = [];
    
    if (issues.includes('Response lacks specific details')) {
      enhancements.push('Add specific pricing, timing, or service details');
    }
    
    if (issues.includes('Tool results not integrated')) {
      enhancements.push('Incorporate available service options and knowledge');
    }
    
    if (issues.includes('Response not personalized')) {
      enhancements.push('Include member tier benefits and personalization');
    }
    
    if (issues.includes('Language not sufficiently sophisticated')) {
      enhancements.push('Elevate language to luxury concierge standards');
    }
    
    return enhancements;
  }

  private async enhance(
    response: any,
    issues: string[],
    toolResults: any[],
    context: any
  ): Promise<{ message: string; enhancements: string[] }> {
    console.log('🎨 [REFINER] Enhancing response for issues:', issues);
    
    let enhancedMessage = response.message;
    const appliedEnhancements: string[] = [];
    
    // Enhancement 1: Add luxury language
    if (issues.includes('Language not sufficiently sophisticated')) {
      enhancedMessage = this.enhanceLuxuryLanguage(enhancedMessage);
      appliedEnhancements.push('Enhanced luxury language');
    }
    
    // Enhancement 2: Integrate tool results
    if (issues.includes('Tool results not integrated') && toolResults.length > 0) {
      enhancedMessage = this.integrateToolResults(enhancedMessage, toolResults);
      appliedEnhancements.push('Integrated tool results');
    }
    
    // Enhancement 3: Add personalization
    if (issues.includes('Response not personalized')) {
      enhancedMessage = this.addPersonalization(enhancedMessage, context);
      appliedEnhancements.push('Added personalization');
    }
    
    // Enhancement 4: Add specificity
    if (issues.includes('Response lacks specific details')) {
      enhancedMessage = this.addSpecificDetails(enhancedMessage, context, toolResults);
      appliedEnhancements.push('Added specific details');
    }
    
    return {
      message: enhancedMessage,
      enhancements: appliedEnhancements
    };
  }

  private enhanceLuxuryLanguage(message: string): string {
    // Replace generic phrases with luxury equivalents
    const replacements = {
      'I can help you': 'I\'d be delighted to arrange',
      'Let me assist': 'Allow me to curate',
      'I understand': 'I appreciate your discerning taste',
      'I will try': 'I shall ensure',
      'available': 'accessible through our exclusive network',
      'good': 'exceptional',
      'nice': 'exquisite',
      'book': 'arrange'
    };
    
    let enhanced = message;
    for (const [generic, luxury] of Object.entries(replacements)) {
      enhanced = enhanced.replace(new RegExp(generic, 'gi'), luxury);
    }
    
    return enhanced;
  }

  private integrateToolResults(message: string, toolResults: any[]): string {
    // Add tool-derived information to the response
    const successfulTools = toolResults.filter(tool => tool.success && tool.data);
    
    if (successfulTools.length === 0) return message;
    
    let enhanced = message;
    
    // Add service count if available
    const serviceResults = successfulTools.find(tool => tool.data.services);
    if (serviceResults && serviceResults.data.services.length > 0) {
      enhanced += ` We have ${serviceResults.data.services.length} premium options available.`;
    }
    
    // Add knowledge-based details
    const knowledgeResults = successfulTools.find(tool => tool.data.results);
    if (knowledgeResults && knowledgeResults.data.results.length > 0) {
      enhanced += ' Our expertise includes exclusive access to premier establishments.';
    }
    
    return enhanced;
  }

  private addPersonalization(message: string, context: any): string {
    const memberTier = context.memberTier || 'standard';
    
    const tierBenefits: { [key: string]: string } = {
      'founding10': 'with priority access and complimentary coordination',
      'fifty-k': 'with exclusive member benefits',
      'corporate': 'with professional business coordination',
      'all-members': 'with personalized attention'
    };
    
    const benefit = tierBenefits[memberTier] || tierBenefits['all-members'];
    return message + ` ${benefit}.`;
  }

  private addSpecificDetails(message: string, context: any, toolResults: any[]): string {
    // Add timing and next steps
    const hasBooking = message.toLowerCase().includes('book') || message.toLowerCase().includes('arrange');
    
    if (hasBooking) {
      return message + ' I can coordinate all details within the hour and provide comprehensive confirmation.';
    }
    
    return message + ' Would you like me to proceed with the arrangements?';
  }

  private analyzeToolResults(toolResults: any[]): number {
    if (!toolResults || toolResults.length === 0) return 0.5;
    
    const successRate = toolResults.filter(tool => tool.success).length / toolResults.length;
    const dataQuality = toolResults.filter(tool => tool.success && tool.data).length / toolResults.length;
    
    return (successRate * 0.6) + (dataQuality * 0.4);
  }

  private async storeLearnings(learnings: LearningData, context: any): Promise<void> {
    try {
      console.log('📚 [REFINER] Storing learning data for continuous improvement');
      // In production, this would store to a learning database
      // For now, we'll just log the insights
      console.log('📊 [REFINER] Learning insights:', {
        satisfaction_predicted: learnings.member_satisfaction_predicted.toFixed(2),
        tool_effectiveness: learnings.tool_effectiveness.toFixed(2),
        intent_accuracy: learnings.intent_accuracy.toFixed(2),
        member_tier: learnings.member_tier,
        request_type: learnings.request_type
      });
    } catch (error) {
      console.error('❌ [REFINER] Failed to store learnings:', error);
    }
  }

  private calculateConfidence(metrics: QualityMetrics): number {
    // Calculate confidence based on metric consistency
    const values = Object.values(metrics);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
    
    // Lower variance = higher confidence
    return Math.max(0.5, 1 - variance);
  }

  private getQualityLevel(score: number): string {
    if (score >= this.qualityThresholds.excellent) return 'Excellent';
    if (score >= this.qualityThresholds.good) return 'Good';
    if (score >= this.qualityThresholds.acceptable) return 'Acceptable';
    return 'Needs Improvement';
  }

  // Public utility methods
  getQualityThresholds() {
    return this.qualityThresholds;
  }

  async getSystemMetrics(): Promise<any> {
    return {
      threshold_config: this.qualityThresholds,
      luxury_indicators_count: this.luxuryIndicators.length,
      generic_phrases_monitored: this.genericPhrases.length,
      enhancement_categories: [
        'luxury_language',
        'tool_integration', 
        'personalization',
        'specificity'
      ]
    };
  }
} 