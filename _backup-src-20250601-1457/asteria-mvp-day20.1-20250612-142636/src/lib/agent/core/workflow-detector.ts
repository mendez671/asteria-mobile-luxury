// ===============================
// ENHANCED WORKFLOW DETECTOR
// Day 19: Smart workflow detection and triggering
// ===============================

import { ServiceCategory } from '../types';

export type MemberTier = 'founding10' | 'fifty-k' | 'corporate' | 'all-members';
export type ServiceIntent = ServiceCategory | string;
export type WorkflowType = 'travel' | 'events' | 'lifestyle' | 'investment' | 'brandDev';

export interface WorkflowTrigger {
  workflowType: WorkflowType;
  confidence: number;
  reasoning: string;
  estimatedSteps: number;
  estimatedDuration: string;
  memberTierRequired: MemberTier;
  valueThreshold: number;
}

export interface DetectionContext {
  intent: ServiceIntent;
  memberTier: MemberTier;
  messageText: string;
  conversationHistory?: any[];
  extractedEntities: {
    services?: string[];
    locations?: string[];
    dates?: string[];
    people?: number;
    budget?: number;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
  };
}

export class WorkflowDetector {
  private readonly WORKFLOW_PATTERNS = {
    travel: {
      triggers: [
        /\b(private\s+jet|aircraft|aviation|flight|fly)\b/i,
        /\b(travel|trip|journey)\s+.*\b(multiple|several|various)\b/i,
        /\b(departure|arrival|round\s*trip|return)\b/i,
        /\b(hotel|accommodation|lodging)\s+.*\b(flight|jet)\b/i
      ],
      valueIndicators: [
        /\b(private|luxury|premium|executive)\b/i,
        /\b(first\s*class|business\s*class)\b/i,
        /\b(multiple\s+passengers|group\s+of)\b/i,
        /\b(international|long\s*distance|cross\s*country)\b/i
      ],
      minimumValue: 10000,
      memberTiers: ['founding10', 'fifty-k', 'corporate', 'all-members']
    },
    events: {
      triggers: [
        /\b(event|celebration|party|gathering)\b/i,
        /\b(restaurant|dining|dinner)\s+.*\b(private|exclusive|michelin)\b/i,
        /\b(venue|location)\s+.*\b(book|reserve|arrange)\b/i,
        /\b(entertainment|show|performance)\s+.*\b(private|vip)\b/i
      ],
      valueIndicators: [
        /\b(michelin|starred|celebrity\s+chef)\b/i,
        /\b(private\s+dining|chef.s\s+table)\b/i,
        /\b(exclusive|vip|special\s+access)\b/i,
        /\b(multiple\s+courses|tasting\s+menu)\b/i
      ],
      minimumValue: 5000,
      memberTiers: ['founding10', 'fifty-k', 'corporate', 'all-members']
    },
    lifestyle: {
      triggers: [
        /\b(wellness|spa|massage|facial)\b/i,
        /\b(personal\s+shopping|styling|wardrobe)\b/i,
        /\b(concierge|personal\s+assistant)\b/i,
        /\b(lifestyle|experience|adventure)\b/i
      ],
      valueIndicators: [
        /\b(luxury|premium|high\s*end|exclusive)\b/i,
        /\b(personal|private|one\s*on\s*one)\b/i,
        /\b(multiple\s+sessions|package|comprehensive)\b/i,
        /\b(celebrity|world\s*class|renowned)\b/i
      ],
      minimumValue: 3000,
      memberTiers: ['founding10', 'fifty-k']
    },
    investment: {
      triggers: [
        /\b(investment|portfolio|wealth|financial)\b/i,
        /\b(advisor|consultation|planning)\b/i,
        /\b(real\s*estate|property|acquisition)\b/i,
        /\b(fund|capital|asset)\b/i
      ],
      valueIndicators: [
        /\b(million|substantial|significant)\b/i,
        /\b(private\s+banking|wealth\s+management)\b/i,
        /\b(portfolio\s+review|strategy)\b/i,
        /\b(exclusive\s+opportunities|high\s*net\s*worth)\b/i
      ],
      minimumValue: 50000,
      memberTiers: ['founding10', 'fifty-k']
    },
    brandDev: {
      triggers: [
        /\b(brand|marketing|pr|publicity)\b/i,
        /\b(business\s+development|networking)\b/i,
        /\b(partnership|collaboration|deal)\b/i,
        /\b(media|press|interview)\b/i
      ],
      valueIndicators: [
        /\b(campaign|strategy|comprehensive)\b/i,
        /\b(high\s*profile|celebrity|influencer)\b/i,
        /\b(national|international|global)\b/i,
        /\b(exclusive|premium|luxury\s+brand)\b/i
      ],
      minimumValue: 25000,
      memberTiers: ['founding10', 'fifty-k', 'corporate']
    }
  };

  /**
   * Analyze a request and determine if it should trigger a workflow
   */
  async detectWorkflow(context: DetectionContext): Promise<WorkflowTrigger | null> {
    console.log('🔍 [WORKFLOW_DETECTOR] Analyzing request for workflow triggers...');
    
    // Check each workflow type
    const candidates: WorkflowTrigger[] = [];

    for (const [workflowType, pattern] of Object.entries(this.WORKFLOW_PATTERNS)) {
      const trigger = this.evaluateWorkflowPattern(workflowType as WorkflowType, pattern, context);
      if (trigger) {
        candidates.push(trigger);
      }
    }

    if (candidates.length === 0) {
      console.log('🔍 [WORKFLOW_DETECTOR] No workflow triggers detected');
      return null;
    }

    // Select the highest confidence workflow
    const bestCandidate = candidates.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    console.log(`🎯 [WORKFLOW_DETECTOR] Selected workflow: ${bestCandidate.workflowType} (confidence: ${bestCandidate.confidence})`);
    console.log(`🎯 [WORKFLOW_DETECTOR] Reasoning: ${bestCandidate.reasoning}`);

    return bestCandidate;
  }

  /**
   * Evaluate if a specific workflow pattern matches the request
   */
  private evaluateWorkflowPattern(
    workflowType: WorkflowType, 
    pattern: any, 
    context: DetectionContext
  ): WorkflowTrigger | null {
    let confidence = 0;
    const reasons: string[] = [];
    
    // Check member tier eligibility
    if (!pattern.memberTiers.includes(context.memberTier)) {
      return null;
    }

    // Check primary triggers
    const triggerMatches = pattern.triggers.filter((trigger: RegExp) => 
      trigger.test(context.messageText)
    ).length;
    
    if (triggerMatches > 0) {
      confidence += 0.4;
      reasons.push(`${triggerMatches} trigger pattern(s) matched`);
    } else {
      return null; // Must have at least one trigger match
    }

    // Check value indicators
    const valueMatches = pattern.valueIndicators.filter((indicator: RegExp) => 
      indicator.test(context.messageText)
    ).length;
    
    if (valueMatches > 0) {
      confidence += 0.3;
      reasons.push(`${valueMatches} value indicator(s) matched`);
    }

    // Check intent alignment
    if (this.intentAlignsWithWorkflow(context.intent, workflowType)) {
      confidence += 0.2;
      reasons.push('Intent alignment detected');
    }

    // Check entity complexity
    const entityComplexity = this.calculateEntityComplexity(context.extractedEntities);
    if (entityComplexity > 2) {
      confidence += 0.1;
      reasons.push(`Complex entities detected (${entityComplexity})`);
    }

    // Check urgency
    if (context.extractedEntities.urgency === 'urgent' || context.extractedEntities.urgency === 'high') {
      confidence += 0.1;
      reasons.push('High urgency detected');
    }

    // Member tier bonus
    const tierBonus = this.getTierBonus(context.memberTier);
    confidence += tierBonus;
    if (tierBonus > 0) {
      reasons.push(`Member tier bonus: ${context.memberTier}`);
    }

    // Threshold check
    if (confidence < 0.6) {
      return null;
    }

    return {
      workflowType,
      confidence: Math.min(confidence, 1.0),
      reasoning: reasons.join(', '),
      estimatedSteps: this.estimateWorkflowSteps(workflowType, entityComplexity),
      estimatedDuration: this.estimateWorkflowDuration(workflowType, entityComplexity),
      memberTierRequired: this.getRequiredTier(workflowType, pattern),
      valueThreshold: pattern.minimumValue
    };
  }

  /**
   * Check if intent aligns with workflow type
   */
  private intentAlignsWithWorkflow(intent: ServiceIntent, workflowType: WorkflowType): boolean {
    const alignments = {
      travel: ['transportation', 'transportation_aviation', 'transportation_ground', 'transportation_marine'],
      events: ['events', 'events_dining', 'events_entertainment', 'events_experiences'],
      lifestyle: ['lifestyle', 'lifestyle_services', 'lifestyle_wellness', 'lifestyle_shopping'],
      investment: ['investment', 'investment_wealth', 'investment_advisory'],
      brandDev: ['brand', 'brand_development', 'brand_marketing']
    };

    return alignments[workflowType]?.includes(intent) || false;
  }

  /**
   * Calculate complexity of extracted entities
   */
  private calculateEntityComplexity(entities: DetectionContext['extractedEntities']): number {
    let complexity = 0;
    
    if (entities.services && entities.services.length > 1) complexity += 2;
    if (entities.locations && entities.locations.length > 1) complexity += 1;
    if (entities.dates && entities.dates.length > 1) complexity += 1;
    if (entities.people && entities.people > 1) complexity += 1;
    if (entities.budget && entities.budget > 10000) complexity += 1;
    
    return complexity;
  }

  /**
   * Get member tier bonus for workflow confidence
   */
  private getTierBonus(memberTier: MemberTier): number {
    const bonuses = {
      'founding10': 0.15,
      'fifty-k': 0.10,
      'corporate': 0.05,
      'all-members': 0.0
    };
    
    return bonuses[memberTier] || 0;
  }

  /**
   * Estimate number of workflow steps
   */
  private estimateWorkflowSteps(workflowType: WorkflowType, complexity: number): number {
    const baseSteps = {
      travel: 5,
      events: 4,
      lifestyle: 3,
      investment: 6,
      brandDev: 7
    };
    
    return baseSteps[workflowType] + Math.floor(complexity / 2);
  }

  /**
   * Estimate workflow duration
   */
  private estimateWorkflowDuration(workflowType: WorkflowType, complexity: number): string {
    const baseDurations = {
      travel: 30, // minutes
      events: 20,
      lifestyle: 15,
      investment: 45,
      brandDev: 60
    };
    
    const totalMinutes = baseDurations[workflowType] + (complexity * 5);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  }

  /**
   * Get required member tier for workflow
   */
  private getRequiredTier(workflowType: WorkflowType, pattern: any): MemberTier {
    return pattern.memberTiers[0] as MemberTier;
  }

  /**
   * Multi-service detection for complex workflows
   */
  async detectMultiServiceWorkflow(context: DetectionContext): Promise<WorkflowTrigger | null> {
    const multiServiceIndicators = [
      /\b(and|plus|also|additionally|including|with)\b/gi,
      /\b(full\s+service|complete|comprehensive|end\s*to\s*end)\b/i,
      /\b(package|bundle|everything|all\s*inclusive)\b/i
    ];

    const multiServiceMatches = multiServiceIndicators.filter(indicator => 
      indicator.test(context.messageText)
    ).length;

    if (multiServiceMatches >= 2 || (context.extractedEntities.services && context.extractedEntities.services.length >= 3)) {
      return {
        workflowType: 'lifestyle', // Default to lifestyle for multi-service
        confidence: 0.8,
        reasoning: 'Multi-service request detected requiring comprehensive workflow',
        estimatedSteps: 8,
        estimatedDuration: '2-3 hours',
        memberTierRequired: 'fifty-k',
        valueThreshold: 15000
      };
    }

    return null;
  }
}

export const workflowDetector = new WorkflowDetector(); 