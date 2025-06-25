// ===============================
// ASTERIA N8N WORKFLOW INTEGRATION SERVICE
// ===============================
// Created: December 9, 2024
// Purpose: Bridge between Asteria app and n8n orchestration workflows
// Handles complex requests that require multi-agent coordination
// ===============================

import { AgentContext, AgentResponse, ServiceCategory, JourneyPhase } from '@/lib/agent/types';

// ===============================
// CONFIGURATION
// ===============================

const N8N_CONFIG = {
  baseUrl: process.env.N8N_ASTERIA_BASE_URL || 'http://localhost:5678',
  webhookPath: '/webhook/main-orchestrator', // Updated to use Main Orchestrator
  timeout: 30000, // 30 seconds
  retryAttempts: 2,
  complexityThreshold: 2, // Minimum complexity score to trigger n8n
};

// ===============================
// INTERFACES
// ===============================

interface N8NRequest {
  memberId: string;
  message: string;
  memberTier: string;
  authToken?: string;
  sessionId: string;
  conversationHistory?: any[];
  contextData?: Record<string, any>;
}

interface N8NResponse {
  success: boolean;
  response: string;
  metadata: {
    responseTime: number;
    agentsUsed: string[];
    orchestrationUsed: boolean;
    memberTier: string;
    workflowTriggered?: boolean;
    serviceCategory: string;
    complexityScore: number;
    personalizationApplied?: boolean;
  };
  tracking: {
    correlationId: string;
    serviceTicketId: string;
    estimatedCompletion: string;
  };
  personalization?: {
    recommendations: any[];
    communicationStyle: string;
    memberInsights: Record<string, any>;
  };
  nextSteps?: string[];
  error?: {
    message: string;
    escalated: boolean;
  };
}

interface ComplexityAssessment {
  score: number;
  indicators: {
    multiService: boolean;
    highValue: boolean;
    timeConstraint: boolean;
    coordination: boolean;
    memberTierComplex: boolean;
    goalSetting: boolean;
    paymentRequired: boolean;
  };
  requiresOrchestration: boolean;
  reasoning: string;
}

// ===============================
// COMPLEXITY ASSESSMENT
// ===============================

export function assessRequestComplexity(
  message: string, 
  memberTier: string = 'all-members'
): ComplexityAssessment {
  console.log(`🔍 Assessing complexity for: "${message.substring(0, 100)}..."`);
  
  const indicators = {
    multiService: /\b(flight|jet|hotel|restaurant|car|yacht|dining|transportation|event)\b.*\b(flight|jet|hotel|restaurant|car|yacht|dining|transportation|event)\b/i.test(message),
    highValue: /\$(\d{1,3},)*\d{4,}|premium|luxury|exclusive|private\s+jet|yacht|concierge/i.test(message),
    timeConstraint: /asap|urgent|immediately|right\s+away|today|tonight|tomorrow|this\s+week|time.{0,10}sensitive/i.test(message),
    coordination: /coordinate|arrange|plan|organize|manage|multiple|several|book.{0,30}(and|with|plus)/i.test(message),
    memberTierComplex: ['founding10', 'fifty-k'].includes(memberTier),
    goalSetting: /goal|objective|plan|strategy|milestone|achievement/i.test(message),
    paymentRequired: /pay|payment|charge|bill|invoice|cost/i.test(message)
  };

  const score = Object.values(indicators).filter(Boolean).length;
  const requiresOrchestration = score >= N8N_CONFIG.complexityThreshold;

  const reasoning = generateComplexityReasoning(indicators, score, memberTier);

  console.log(`📊 Complexity Assessment:`, {
    score,
    requiresOrchestration,
    indicators,
    reasoning
  });

  return {
    score,
    indicators,
    requiresOrchestration,
    reasoning
  };
}

function generateComplexityReasoning(
  indicators: any, 
  score: number, 
  memberTier: string
): string {
  const reasons = [];
  
  if (indicators.multiService) reasons.push("multiple service coordination required");
  if (indicators.highValue) reasons.push("high-value transaction detected");
  if (indicators.timeConstraint) reasons.push("time-sensitive request");
  if (indicators.coordination) reasons.push("complex coordination needed");
  if (indicators.memberTierComplex) reasons.push(`${memberTier} member tier requires premium handling`);
  if (indicators.goalSetting) reasons.push("strategic planning elements identified");
  if (indicators.paymentRequired) reasons.push("payment processing involved");

  if (reasons.length === 0) {
    return "Simple request suitable for standard agent processing";
  }

  return `Complex request requiring orchestration due to: ${reasons.join(", ")}`;
}

// ===============================
// N8N WORKFLOW INTEGRATION
// ===============================

export async function callN8NWorkflow(
  context: AgentContext,
  message: string,
  complexity: ComplexityAssessment
): Promise<N8NResponse> {
  const startTime = Date.now();
  console.log(`🚀 Calling n8n workflow for complex request...`);

  // Prepare the request payload
  const n8nRequest: N8NRequest = {
    memberId: context.memberProfile.id,
    message: message,
    memberTier: mapMemberTierToN8N(context.memberProfile.tier),
    authToken: generateAuthToken(context),
    sessionId: context.sessionId,
    conversationHistory: context.conversationHistory.slice(-5), // Last 5 messages for context
    contextData: {
      retryCount: context.retryCount || 0,
      journeyPhase: context.activeJourney?.phase || 'discovery',
      timestamp: new Date().toISOString()
    }
  };

  try {
    const response = await fetchWithRetry(
      `${N8N_CONFIG.baseUrl}${N8N_CONFIG.webhookPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Asteria-Integration/1.0',
          'X-Request-Source': 'asteria-app'
        },
        body: JSON.stringify(n8nRequest)
      }
    );

    if (!response.ok) {
      throw new Error(`N8N workflow failed: ${response.status} ${response.statusText}`);
    }

    const result: N8NResponse = await response.json();
    const duration = Date.now() - startTime;

    console.log(`✅ N8N workflow completed successfully in ${duration}ms`);
    console.log(`📊 Orchestration result:`, {
      agentsUsed: result.metadata.agentsUsed,
      serviceTicketId: result.tracking.serviceTicketId,
      complexityScore: result.metadata.complexityScore
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ N8N workflow failed after ${duration}ms:`, error);
    
    // Return fallback response
    return createFallbackResponse(error as Error, context, complexity);
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

function mapMemberTierToN8N(tier: string): string {
  const tierMap: Record<string, string> = {
    'elite': 'founding10',
    'premium': 'fifty-k', 
    'standard': 'all-members'
  };
  return tierMap[tier] || 'all-members';
}

function generateAuthToken(context: AgentContext): string {
  // Generate a simple auth token based on session
  // In production, this should be a proper JWT or API key
  return `asteria_${context.sessionId}_${Date.now()}`;
}

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  attempts: number = N8N_CONFIG.retryAttempts
): Promise<Response> {
  let lastError: Error;

  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), N8N_CONFIG.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`🔄 N8N request attempt ${i + 1} failed:`, error);
      
      if (i < attempts - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError!;
}

function createFallbackResponse(
  error: Error, 
  context: AgentContext, 
  complexity: ComplexityAssessment
): N8NResponse {
  return {
    success: false,
    response: "I understand your request requires special coordination. Our concierge team has been notified and will personally assist you within the hour. Thank you for your patience.",
    metadata: {
      responseTime: 500,
      agentsUsed: ['fallback-handler'],
      orchestrationUsed: false,
      memberTier: mapMemberTierToN8N(context.memberProfile.tier),
      serviceCategory: 'general',
      complexityScore: complexity.score
    },
    tracking: {
      correlationId: `fallback_${Date.now()}`,
      serviceTicketId: `SR-${Date.now()}`,
      estimatedCompletion: 'Within 1 hour'
    },
    error: {
      message: error.message,
      escalated: true
    }
  };
}

// ===============================
// AGENT RESPONSE CONVERSION
// ===============================

export function convertN8NToAgentResponse(
  n8nResponse: N8NResponse,
  originalContext: AgentContext
): AgentResponse {
  return {
    message: n8nResponse.response,
    intent: {
      category: mapServiceCategory(n8nResponse.metadata.serviceCategory),
      urgency: determineUrgency(n8nResponse.metadata.complexityScore),
      confidence: n8nResponse.success ? 0.9 : 0.3,
      extractedDetails: n8nResponse.personalization?.memberInsights || {}
    },
    nextActions: generateNextActions(n8nResponse),
    journeyPhase: determineJourneyPhase(n8nResponse),
    confidence: n8nResponse.success ? 0.9 : 0.3,
    success: n8nResponse.success,
    metadata: {
      processingTime: n8nResponse.metadata.responseTime,
      workflowTriggered: n8nResponse.metadata.orchestrationUsed,
      workflowId: n8nResponse.tracking.correlationId,
      serviceRequestId: n8nResponse.tracking.serviceTicketId,
      serviceRequestCreated: n8nResponse.success,
      conciergeNotified: true,
      memberTier: n8nResponse.metadata.memberTier,
      urgencyLevel: determineUrgencyLevel(n8nResponse.metadata.complexityScore),
      firebaseStored: true, // n8n handles Firebase storage
      agentsUsed: n8nResponse.metadata.agentsUsed,
      executionResult: {
        success: n8nResponse.success,
        serviceTicketId: n8nResponse.tracking.serviceTicketId,
        notificationsSent: [],
        nextPhase: determineJourneyPhase(n8nResponse),
        timing: {
          started: new Date(),
          completed: new Date(),
          duration: n8nResponse.metadata.responseTime
        }
      }
    }
  };
}

function mapServiceCategory(category: string): ServiceCategory {
  const categoryMap: Record<string, ServiceCategory> = {
    'transportation': 'transportation_aviation',
    'aviation': 'transportation_aviation',
    'events': 'events_experiences',
    'dining': 'events_experiences',
    'lifestyle': 'lifestyle_services',
    'investment': 'investment_opportunities',
    'brand': 'brand_development',
    'general': 'lifestyle_services'
  };
  return categoryMap[category] || 'lifestyle_services';
}

function determineUrgency(complexityScore: number): 'low' | 'medium' | 'high' | 'urgent' {
  if (complexityScore >= 5) return 'urgent';
  if (complexityScore >= 3) return 'high';
  if (complexityScore >= 2) return 'medium';
  return 'low';
}

function determineUrgencyLevel(complexityScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (complexityScore >= 3) return 'HIGH';
  if (complexityScore >= 2) return 'MEDIUM';
  return 'LOW';
}

function determineJourneyPhase(n8nResponse: N8NResponse): JourneyPhase {
  if (n8nResponse.error) return 'discovery';
  if (n8nResponse.nextSteps && n8nResponse.nextSteps.length > 0) return 'execution';
  return 'confirmation';
}

function generateNextActions(n8nResponse: N8NResponse): any[] {
  const actions = [];
  
  if (n8nResponse.success) {
    actions.push({
      type: 'create_ticket',
      priority: 'high',
      data: {
        ticketId: n8nResponse.tracking.serviceTicketId,
        estimatedCompletion: n8nResponse.tracking.estimatedCompletion
      }
    });
  }
  
  if (n8nResponse.error?.escalated) {
    actions.push({
      type: 'escalate',
      priority: 'urgent',
      data: {
        reason: n8nResponse.error.message,
        correlationId: n8nResponse.tracking.correlationId
      }
    });
  }
  
  return actions;
}

// ===============================
// HEALTH CHECK
// ===============================

export async function checkN8NHealth(): Promise<{healthy: boolean, latency: number, error?: string}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${N8N_CONFIG.baseUrl}/healthz`, {
      method: 'GET',
      timeout: 5000
    });
    
    const latency = Date.now() - startTime;
    const healthy = response.ok;
    
    return { healthy, latency };
    
  } catch (error) {
    const latency = Date.now() - startTime;
    return { 
      healthy: false, 
      latency, 
      error: (error as Error).message 
    };
  }
}

// ===============================
// MAIN INTEGRATION FUNCTION
// ===============================

export async function processWithN8N(
  context: AgentContext,
  message: string
): Promise<AgentResponse | null> {
  console.log(`🎯 Evaluating request for n8n orchestration...`);
  
  // Step 1: Assess complexity
  const complexity = assessRequestComplexity(message, mapMemberTierToN8N(context.memberProfile.tier));
  
  // Step 2: Check if orchestration is needed
  if (!complexity.requiresOrchestration) {
    console.log(`✋ Request below complexity threshold (${complexity.score}/${N8N_CONFIG.complexityThreshold}) - using standard agent`);
    return null; // Use standard agent processing
  }
  
  console.log(`🚀 Request requires orchestration (${complexity.score}/${N8N_CONFIG.complexityThreshold}) - calling n8n workflow`);
  
  // Step 3: Call n8n workflow
  const n8nResponse = await callN8NWorkflow(context, message, complexity);
  
  // Step 4: Convert to agent response
  const agentResponse = convertN8NToAgentResponse(n8nResponse, context);
  
  console.log(`✅ N8N integration complete - orchestration: ${n8nResponse.metadata.orchestrationUsed}`);
  
  return agentResponse;
} 