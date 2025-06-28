/**
 * ASTERIA Communication Guide Processor
 * Phase 2.5: Direct Communication Guide Integration
 * 
 * Automatically applies sophisticated luxury AI concierge standards to every ASTERIA response
 * Based on the enhanced ASTERIA_COMMUNICATION_GUIDE.md framework
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

interface CommunicationContext {
  memberMessage: string;
  originalResponse: string;
  conversationHistory?: Array<{role: string, content: string}>;
  serviceCategory?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  memberTier?: string;
  sessionContext?: any;
}

interface EnhancedResponse {
  enhancedMessage: string;
  communicationMetrics: {
    personalityScore: number;
    luxuryLanguageScore: number;
    anticipationScore: number;
    brevityScore: number;
    emotionalIntelligenceScore: number;
    overallScore: number;
  };
  appliedPatterns: string[];
  suggestedEnhancements: string[];
  responseCategory: 'greeting' | 'service_request' | 'information' | 'confirmation' | 'follow_up';
}

/**
 * Core Communication Guide Processor
 * Applies ASTERIA Doctrine standards to every response
 */
export class CommunicationGuideProcessor {
  private openai: OpenAI;
  private communicationGuide: string;
  private isInitialized: boolean = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.communicationGuide = '';
  }

  /**
   * Initialize the processor with the communication guide
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load the ASTERIA Communication Guide
      const guidePath = path.join(process.cwd(), 'ASTERIA_COMMUNICATION_GUIDE.md');
      this.communicationGuide = fs.readFileSync(guidePath, 'utf-8');
      this.isInitialized = true;
      console.log('✅ [COMM_GUIDE] Communication Guide Processor initialized');
    } catch (error) {
      console.error('❌ [COMM_GUIDE] Failed to load communication guide:', error);
      throw new Error('Communication Guide not found');
    }
  }

  /**
   * Main processing function - enhances any ASTERIA response
   */
  async enhanceResponse(context: CommunicationContext): Promise<EnhancedResponse> {
    await this.initialize();

    console.log('🎭 [COMM_GUIDE] Processing response enhancement...');
    console.log('🎭 [COMM_GUIDE] Service category:', context.serviceCategory);
    console.log('🎭 [COMM_GUIDE] Urgency:', context.urgency);

    try {
      // Step 1: Analyze the response category
      const responseCategory = await this.categorizeResponse(context);

      // Step 2: Apply ASTERIA Doctrine patterns
      const enhancedMessage = await this.applyAsteriaStandards(context, responseCategory);

      // Step 3: Evaluate communication quality
      const metrics = await this.evaluateCommunicationQuality(enhancedMessage, context);

      // Step 4: Generate improvement suggestions
      const suggestions = await this.generateSuggestions(enhancedMessage, context, metrics);

      console.log('✅ [COMM_GUIDE] Response enhanced successfully');
      console.log('✅ [COMM_GUIDE] Overall quality score:', metrics.overallScore);

      return {
        enhancedMessage,
        communicationMetrics: metrics,
        appliedPatterns: this.getAppliedPatterns(enhancedMessage),
        suggestedEnhancements: suggestions,
        responseCategory
      };

    } catch (error) {
      console.error('❌ [COMM_GUIDE] Enhancement failed:', error);
      // Return original response with basic metrics
      return {
        enhancedMessage: context.originalResponse,
        communicationMetrics: {
          personalityScore: 50,
          luxuryLanguageScore: 50,
          anticipationScore: 50,
          brevityScore: 50,
          emotionalIntelligenceScore: 50,
          overallScore: 50
        },
        appliedPatterns: [],
        suggestedEnhancements: ['Communication guide processing failed - using original response'],
        responseCategory: 'information'
      };
    }
  }

  /**
   * Categorize the response type for appropriate enhancement
   */
  private async categorizeResponse(context: CommunicationContext): Promise<EnhancedResponse['responseCategory']> {
    const { memberMessage, originalResponse } = context;

    // Pattern matching for quick categorization
    const greetingPatterns = /^(hello|hi|good morning|good evening|hey)/i;
    const confirmationPatterns = /(book|confirm|arrange|yes|let's do it|sounds good)/i;
    const servicePatterns = /(need|want|looking for|arrange|book|reserve|plan)/i;

    if (greetingPatterns.test(memberMessage)) return 'greeting';
    if (confirmationPatterns.test(memberMessage)) return 'confirmation';
    if (servicePatterns.test(memberMessage)) return 'service_request';
    if (context.conversationHistory && context.conversationHistory.length > 4) return 'follow_up';
    
    return 'information';
  }

  /**
   * Apply ASTERIA Doctrine standards to the response
   */
  private async applyAsteriaStandards(
    context: CommunicationContext, 
    category: EnhancedResponse['responseCategory']
  ): Promise<string> {
    
    const enhancementPrompt = this.buildEnhancementPrompt(context, category);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: `You are the ASTERIA Communication Enhancement Engine. Your role is to transform responses into sophisticated luxury AI concierge communications following the ASTERIA Doctrine.

${this.communicationGuide}

ENHANCEMENT RULES:
1. Apply the Four Pillars: Anticipation, Curated Brevity, Invisible Excellence, Emotional Intelligence
2. Use the ASTERIA Communication Framework: ACKNOWLEDGE → UNDERSTAND → CURATE → DELIVER → FOLLOW-THROUGH
3. Transform language using elevation patterns (dinner → culinary journey, hotel → exclusive sanctuary)
4. Apply signature phrases and exclusive access positioning
5. Never mention budget or cost
6. Maintain sophisticated ally personality (confident whisper, not eager shout)
7. Create anticipation and emotional connection
8. Suggest proactive enhancements when appropriate

Return ONLY the enhanced response text - no explanations or meta-commentary.`
        },
        { 
          role: 'user', 
          content: enhancementPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0].message.content || context.originalResponse;
  }

  /**
   * Build the enhancement prompt based on context
   */
  private buildEnhancementPrompt(context: CommunicationContext, category: string): string {
    const { memberMessage, originalResponse, serviceCategory, urgency, memberTier } = context;

    let prompt = `ENHANCE THIS RESPONSE using ASTERIA Doctrine standards:

MEMBER REQUEST: "${memberMessage}"
ORIGINAL RESPONSE: "${originalResponse}"
RESPONSE CATEGORY: ${category}
SERVICE CATEGORY: ${serviceCategory || 'general'}
URGENCY: ${urgency || 'MEDIUM'}
MEMBER TIER: ${memberTier || 'standard'}

ENHANCEMENT REQUIREMENTS:
`;

    // Category-specific enhancement instructions
    switch (category) {
      case 'greeting':
        prompt += `- Use time-aware or context-aware greeting (not generic "How can I help?")
- Position exclusive opportunities or curated experiences
- Create anticipation for extraordinary service`;
        break;
      
      case 'service_request':
        prompt += `- Apply the Three-Option Framework if suggesting choices
- Use elevation language (${this.getElevationExamples()})
- Position exclusive access and insider knowledge
- Suggest proactive enhancements
- Never ask about budget`;
        break;
      
      case 'confirmation':
        prompt += `- Use elegant confirmation language ("Consider it masterfully arranged...")
- Express confidence in exceptional execution
- Anticipate follow-up needs
- Create excitement for the experience`;
        break;
      
      case 'information':
        prompt += `- Apply curated brevity - every word serves purpose
- Use sophisticated information gathering techniques
- Position as curator of knowledge, not just information provider`;
        break;
      
      case 'follow_up':
        prompt += `- Reference previous interactions intelligently
- Show relationship progression
- Anticipate next logical needs
- Maintain connection continuity`;
        break;
    }

    prompt += `

Transform the response to embody ASTERIA's sophisticated ally personality with luxury language elevation and anticipatory service mindset.`;

    return prompt;
  }

  /**
   * Evaluate the communication quality against ASTERIA standards
   */
  private async evaluateCommunicationQuality(
    enhancedMessage: string, 
    context: CommunicationContext
  ): Promise<EnhancedResponse['communicationMetrics']> {
    
    try {
      const evaluationPrompt = `Evaluate this ASTERIA response against luxury AI concierge standards:

RESPONSE: "${enhancedMessage}"
ORIGINAL REQUEST: "${context.memberMessage}"

Rate each dimension (0-100):
1. PERSONALITY SCORE: Sophisticated ally vs eager servant, confident whisper vs loud enthusiasm
2. LUXURY LANGUAGE SCORE: Elevation language usage, exclusive positioning, premium assumptions
3. ANTICIPATION SCORE: Proactive vs reactive, anticipatory service, needs prediction
4. BREVITY SCORE: Curated brevity, every word serves purpose, information hierarchy
5. EMOTIONAL INTELLIGENCE SCORE: Reading between lines, energy matching, connection building

Return ONLY a JSON object with scores:
{"personalityScore": X, "luxuryLanguageScore": X, "anticipationScore": X, "brevityScore": X, "emotionalIntelligenceScore": X}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an ASTERIA communication quality evaluator. Return only valid JSON with numerical scores.' },
          { role: 'user', content: evaluationPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const scores = JSON.parse(response.choices[0].message.content || '{}');
      const overallScore = Math.round(
        (scores.personalityScore + scores.luxuryLanguageScore + scores.anticipationScore + 
         scores.brevityScore + scores.emotionalIntelligenceScore) / 5
      );

      return {
        personalityScore: scores.personalityScore || 70,
        luxuryLanguageScore: scores.luxuryLanguageScore || 70,
        anticipationScore: scores.anticipationScore || 70,
        brevityScore: scores.brevityScore || 70,
        emotionalIntelligenceScore: scores.emotionalIntelligenceScore || 70,
        overallScore
      };

    } catch (error) {
      console.error('⚠️ [COMM_GUIDE] Quality evaluation failed:', error);
      return {
        personalityScore: 75,
        luxuryLanguageScore: 75,
        anticipationScore: 75,
        brevityScore: 75,
        emotionalIntelligenceScore: 75,
        overallScore: 75
      };
    }
  }

  /**
   * Generate improvement suggestions
   */
  private async generateSuggestions(
    enhancedMessage: string,
    context: CommunicationContext,
    metrics: EnhancedResponse['communicationMetrics']
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Generate suggestions based on low scores
    if (metrics.personalityScore < 80) {
      suggestions.push('Strengthen sophisticated ally personality - avoid eager servant tone');
    }
    if (metrics.luxuryLanguageScore < 80) {
      suggestions.push('Apply more elevation language patterns (dinner → culinary journey)');
    }
    if (metrics.anticipationScore < 80) {
      suggestions.push('Add more proactive enhancements and anticipatory elements');
    }
    if (metrics.brevityScore < 80) {
      suggestions.push('Apply curated brevity - ensure every word serves a purpose');
    }
    if (metrics.emotionalIntelligenceScore < 80) {
      suggestions.push('Enhance emotional connection and energy matching');
    }

    return suggestions;
  }

  /**
   * Identify applied communication patterns
   */
  private getAppliedPatterns(enhancedMessage: string): string[] {
    const patterns: string[] = [];

    // Check for ASTERIA signature phrases
    const signaturePatterns = [
      { pattern: /absolute pleasure to arrange/i, name: 'Opening Elegance' },
      { pattern: /curate.*extraordinary/i, name: 'Experience Elevation' },
      { pattern: /exclusive.*access/i, name: 'Exclusive Access Positioning' },
      { pattern: /private.*connections/i, name: 'Insider Knowledge' },
      { pattern: /masterfully arranged/i, name: 'Elegant Confirmation' },
      { pattern: /culinary journey|exclusive sanctuary|seamless passage/i, name: 'Elevation Language' },
      { pattern: /anticipating.*preferences/i, name: 'Anticipatory Service' },
      { pattern: /three.*exceptional/i, name: 'Three-Option Framework' }
    ];

    signaturePatterns.forEach(({ pattern, name }) => {
      if (pattern.test(enhancedMessage)) {
        patterns.push(name);
      }
    });

    return patterns;
  }

  /**
   * Get elevation language examples for prompts
   */
  private getElevationExamples(): string {
    return `dinner reservation → culinary journey, hotel room → exclusive sanctuary, transportation → seamless passage, shopping → personal curation, vacation → transformative escape, meeting room → private boardroom, event tickets → exclusive access, gift → thoughtful gesture`;
  }
}

/**
 * Convenience function for direct response enhancement
 */
export async function enhanceAsteriaResponse(
  memberMessage: string,
  originalResponse: string,
  options: {
    conversationHistory?: Array<{role: string, content: string}>;
    serviceCategory?: string;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
    memberTier?: string;
    sessionContext?: any;
  } = {}
): Promise<EnhancedResponse> {
  const processor = new CommunicationGuideProcessor();
  
  return await processor.enhanceResponse({
    memberMessage,
    originalResponse,
    ...options
  });
}

/**
 * Quick response enhancement for chat API integration
 */
export async function quickEnhance(
  memberMessage: string,
  originalResponse: string,
  serviceCategory?: string
): Promise<string> {
  try {
    const enhanced = await enhanceAsteriaResponse(memberMessage, originalResponse, {
      serviceCategory,
      urgency: 'MEDIUM'
    });
    
    console.log(`🎭 [QUICK_ENHANCE] Quality score: ${enhanced.communicationMetrics.overallScore}/100`);
    console.log(`🎭 [QUICK_ENHANCE] Applied patterns: ${enhanced.appliedPatterns.join(', ')}`);
    
    return enhanced.enhancedMessage;
  } catch (error) {
    console.error('❌ [QUICK_ENHANCE] Failed, returning original:', error);
    return originalResponse;
  }
} 