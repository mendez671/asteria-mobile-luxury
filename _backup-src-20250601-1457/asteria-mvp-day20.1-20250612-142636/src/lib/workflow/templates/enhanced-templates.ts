// ===============================
// ENHANCED WORKFLOW TEMPLATES
// Day 19: Enhanced workflow templates for luxury services
// ===============================

import { WorkflowTemplate, WorkflowStep } from '../types';

// Define types locally since they're not exported from workflow types
export type MemberTier = 'founding10' | 'fifty-k' | 'corporate' | 'all-members';
export type ServiceIntent = 'transportation' | 'lifestyle' | 'events' | 'investment' | 'brandDev';

export interface EnhancedWorkflowStep extends WorkflowStep {
  memberTierRestrictions?: MemberTier[];
  valueThreshold?: number;
  conciergeEscalation?: boolean;
  notificationChannels?: ('slack' | 'sms' | 'email')[];
  luxuryIndicators?: string[];
}

export interface EnhancedWorkflowTemplate extends WorkflowTemplate {
  memberTierRequired: MemberTier;
  estimatedValue: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'premium';
  conciergeHandoffRequired: boolean;
  steps: EnhancedWorkflowStep[];
}

// ===============================
// SIMPLIFIED TEMPLATES FOR NOW
// ===============================
export const ENHANCED_WORKFLOW_TEMPLATES: Record<string, EnhancedWorkflowTemplate> = {
  luxury_travel: {
    id: 'luxury_travel',
    name: 'Premium Travel Coordination',
    description: 'End-to-end luxury travel planning',
    category: 'travel',
    version: '1.0',
    isActive: true,
    memberTierRequired: 'fifty-k',
    estimatedValue: 50000,
    complexity: 'premium',
    conciergeHandoffRequired: true,
    estimatedDurationMs: 7200000, // 2 hours
    defaultPriority: 'high',
    requiredMemberTier: 'premium',
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      {
        id: 'travel_analysis',
        name: 'Travel Requirements Analysis',
        description: 'Analyze travel requirements',
        type: 'custom',
        status: 'pending',
        config: { action: 'analyze_travel' },
        dependencies: [],
        timeoutMs: 300000
      }
    ]
  }
};

export function getEnhancedWorkflowTemplate(
  workflowType: string, 
  memberTier: MemberTier
): EnhancedWorkflowTemplate | null {
  const template = ENHANCED_WORKFLOW_TEMPLATES[workflowType];
  
  if (!template) {
    return null;
  }
  
  // Check member tier eligibility
  const tierOrder: MemberTier[] = ['all-members', 'corporate', 'fifty-k', 'founding10'];
  const memberTierIndex = tierOrder.indexOf(memberTier);
  const requiredTierIndex = tierOrder.indexOf(template.memberTierRequired);
  
  if (memberTierIndex < requiredTierIndex) {
    console.log(`❌ [WORKFLOW_TEMPLATES] Member tier ${memberTier} not eligible for ${workflowType} (requires ${template.memberTierRequired})`);
    return null;
  }
  
  return template;
}

export function calculateWorkflowComplexity(template: EnhancedWorkflowTemplate): number {
  const complexityScores = {
    simple: 1,
    moderate: 2,
    complex: 3,
    premium: 4
  };
  
  return complexityScores[template.complexity] || 1;
}

export default ENHANCED_WORKFLOW_TEMPLATES; 