// ===============================
// AGENT COMPATIBILITY LAYER
// Phase 1.3: Bridge old and new type systems
// ===============================

import { 
  AgentContext as NewAgentContext,
  AgentResponse as NewAgentResponse,
  Message,
  ServiceIntent,
  JourneyPhase,
  AgentAction
} from '../types';

// Import existing agent types
import { 
  AgentContext as OldAgentContext,
  AgentResult as OldAgentResult
} from '../core/agent_loop';

// ===============================
// CONTEXT CONVERSION UTILITIES
// ===============================

export function convertToOldAgentContext(newContext: NewAgentContext): OldAgentContext {
  return {
    memberId: newContext.userId,
    memberName: newContext.memberProfile.name,
    memberTier: newContext.memberProfile.tier,
    originalMessage: newContext.conversationHistory[newContext.conversationHistory.length - 1]?.content || '',
    conversationHistory: newContext.conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    retryCount: newContext.retryCount || 0,
    maxRetries: 3
  };
}

export function convertToNewAgentResponse(oldResult: OldAgentResult): NewAgentResponse {
  // Map old journey phase to new journey phase
  const journeyPhase = mapToJourneyPhase(oldResult.intentAnalysis, oldResult.executionResult);
  
  // Create service intent from old intent analysis
  const intent: ServiceIntent = {
    category: mapServiceCategory(oldResult.intentAnalysis.primaryBucket),
    subcategory: oldResult.intentAnalysis.serviceType,
    urgency: mapUrgencyLevel(oldResult.intentAnalysis.urgency),
    confidence: oldResult.intentAnalysis.confidence,
    extractedDetails: oldResult.intentAnalysis.extractedEntities || {}
  };

  // Create agent actions from old next steps
  const nextActions: AgentAction[] = oldResult.nextSteps.map((step, index) => ({
    type: mapActionType(step),
    priority: oldResult.intentAnalysis.urgency === 'emergency' ? 'urgent' : 
             oldResult.intentAnalysis.urgency === 'urgent' ? 'high' : 'medium',
    data: {
      description: step,
      order: index + 1
    }
  }));

  // Add ticket creation action if execution was successful
  if (oldResult.executionResult.success && oldResult.executionResult.finalResult?.ticket) {
    nextActions.push({
      type: 'create_ticket',
      priority: intent.urgency === 'urgent' ? 'urgent' : 'high',
      data: {
        ticketId: oldResult.executionResult.finalResult.ticket.id,
        serviceType: intent.category
      }
    });
  }

  return {
    message: oldResult.response,
    intent,
    nextActions,
    journeyPhase,
    confidence: oldResult.goalValidation.score || oldResult.intentAnalysis.confidence,
    success: oldResult.success,
    metadata: {
      processingTime: 0, // Will be set by the calling function
      intentAnalysis: {
        primaryBucket: oldResult.intentAnalysis.primaryBucket,
        confidence: oldResult.intentAnalysis.confidence,
        urgency: mapUrgencyLevel(oldResult.intentAnalysis.urgency),
        entities: Object.entries(oldResult.intentAnalysis.extractedEntities || {}).map(([key, value]) => ({
          type: mapEntityType(key),
          value: String(value),
          confidence: 0.8,
          context: key
        })),
        sentiment: 'positive', // Default for now
        memberTone: 'professional' // Default for now
      },
      executionResult: {
        success: oldResult.executionResult.success,
        serviceTicketId: oldResult.executionResult.finalResult?.ticket?.id,
        notificationsSent: [], // Will be populated by calling function
        nextPhase: journeyPhase,
        timing: {
          started: new Date(),
          completed: new Date(),
          duration: 0
        }
      }
    }
  };
}

// ===============================
// MAPPING UTILITIES
// ===============================

function mapToJourneyPhase(intentAnalysis: any, executionResult: any): JourneyPhase {
  // Determine journey phase based on intent confidence and execution status
  if (executionResult.success && executionResult.finalResult?.ticket) {
    return 'execution';
  }
  
  if (intentAnalysis.confidence > 0.8 && intentAnalysis.extractedEntities && Object.keys(intentAnalysis.extractedEntities).length > 2) {
    return 'confirmation';
  }
  
  if (intentAnalysis.confidence > 0.6) {
    return 'detailed_discussion';
  }
  
  if (intentAnalysis.confidence > 0.3) {
    return 'information_gathering';
  }
  
  return 'discovery';
}

function mapServiceCategory(primaryBucket: string): ServiceIntent['category'] {
  switch (primaryBucket.toLowerCase()) {
    case 'transportation':
    case 'aviation':
    case 'travel':
      return 'transportation_aviation';
    
    case 'events':
    case 'experiences':
    case 'dining':
    case 'entertainment':
      return 'events_experiences';
    
    case 'brand':
    case 'marketing':
    case 'business':
      return 'brand_development';
    
    case 'investment':
    case 'financial':
    case 'opportunities':
      return 'investment_opportunities';
    
    case 'rewards':
    case 'perks':
    case 'benefits':
      return 'taglades_rewards';
    
    case 'lifestyle':
    case 'personal':
    case 'wellness':
    case 'shopping':
    default:
      return 'lifestyle_services';
  }
}

function mapUrgencyLevel(urgency: string): 'low' | 'medium' | 'high' | 'urgent' {
  switch (urgency.toLowerCase()) {
    case 'emergency':
      return 'urgent';
    case 'urgent':
      return 'urgent';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    default:
      return 'low';
  }
}

function mapActionType(step: string): AgentAction['type'] {
  const stepLower = step.toLowerCase();
  
  if (stepLower.includes('ticket') || stepLower.includes('book') || stepLower.includes('confirm')) {
    return 'create_ticket';
  }
  
  if (stepLower.includes('notify') || stepLower.includes('contact') || stepLower.includes('alert')) {
    return 'send_notification';
  }
  
  if (stepLower.includes('escalate') || stepLower.includes('human') || stepLower.includes('senior')) {
    return 'escalate';
  }
  
  if (stepLower.includes('complete') || stepLower.includes('finish') || stepLower.includes('close')) {
    return 'complete';
  }
  
  // Default to collect_info for information gathering steps
  return 'collect_info';
}

function mapEntityType(key: string): 'date' | 'location' | 'person' | 'service' | 'quantity' | 'preference' {
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes('date') || keyLower.includes('time') || keyLower.includes('when')) {
    return 'date';
  }
  
  if (keyLower.includes('location') || keyLower.includes('place') || keyLower.includes('where')) {
    return 'location';
  }
  
  if (keyLower.includes('person') || keyLower.includes('who') || keyLower.includes('guest')) {
    return 'person';
  }
  
  if (keyLower.includes('service') || keyLower.includes('type') || keyLower.includes('what')) {
    return 'service';
  }
  
  if (keyLower.includes('quantity') || keyLower.includes('number') || keyLower.includes('count')) {
    return 'quantity';
  }
  
  return 'preference';
}

// ===============================
// MESSAGE CONVERSION UTILITIES
// ===============================

export function convertConversationHistory(history: any[]): Message[] {
  return history.map((msg, index) => ({
    id: `msg_${index}_${Date.now()}`,
    content: msg.content,
    sender: msg.role === 'user' ? 'user' : 'asteria',
    timestamp: new Date(Date.now() - (history.length - index) * 60000), // Approximate timestamps
    status: 'completed'
  }));
} 