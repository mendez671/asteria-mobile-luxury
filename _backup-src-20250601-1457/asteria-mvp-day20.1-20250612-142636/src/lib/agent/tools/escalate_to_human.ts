// ===============================
// PHASE 8: ESCALATE TO HUMAN TOOL
// Agent tool for escalating complex requests to human concierge team
// ===============================

import { z } from 'zod';
import { notify_concierge } from '../../tools/notifications';
import { create_ticket } from '../../tools/tickets';

export const escalateToHumanSchema = z.object({
  reason: z.string().describe('Reason for escalation'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).describe('Escalation urgency level'),
  memberId: z.string().describe('Member ID requiring human assistance'),
  memberTier: z.string().describe('Member tier for prioritization'),
  serviceCategory: z.string().describe('Service category'),
  requestDetails: z.string().describe('Detailed description of the request'),
  conversationHistory: z.array(z.object({
    role: z.string(),
    content: z.string(),
    timestamp: z.string().optional()
  })).describe('Conversation history for context'),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).default('email').describe('Preferred contact method'),
  timeZone: z.string().optional().describe('Member timezone for scheduling')
});

export interface EscalateToHumanResult {
  success: boolean;
  escalationId?: string;
  ticketId?: string;
  estimatedResponseTime?: string;
  assignedConcierge?: string;
  priority?: string;
  error?: string;
}

/**
 * Escalate complex requests to human concierge team with priority routing
 * Integrates with ticket system and notification infrastructure
 */
export async function escalateToHuman(
  params: z.infer<typeof escalateToHumanSchema>
): Promise<EscalateToHumanResult> {
  try {
    console.log('🆙 [ESCALATION] Human escalation initiated:', {
      reason: params.reason,
      urgency: params.urgency,
      memberTier: params.memberTier,
      serviceCategory: params.serviceCategory
    });

    // Determine priority based on member tier and urgency
    const priority = calculatePriority(params.memberTier, params.urgency);
    
    // Generate escalation ID
    const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create ticket for the escalation
    const ticketResult = await create_ticket({
      memberId: params.memberId,
      serviceId: `escalation-${params.serviceCategory}`,
      requirements: {
        escalationReason: params.reason,
        requestDetails: params.requestDetails,
        urgency: params.urgency,
        priority,
        escalationId,
        conversationHistory: params.conversationHistory,
        preferredContactMethod: params.preferredContactMethod,
        timeZone: params.timeZone,
        escalatedAt: new Date().toISOString()
      },
      priority: params.urgency === 'critical' ? 'emergency' : params.urgency === 'high' ? 'urgent' : 'standard',
      timeline: getEstimatedResponseTime(priority, params.memberTier)
    });

    // Note: create_ticket returns the ticket directly, not a success/error object

    // Prepare escalation notification
    const escalationMessage = formatEscalationMessage(params, escalationId, priority);

    // Send notification to concierge team
    const notificationResult = await notify_concierge({
      message: escalationMessage,
      context: {
        urgency: params.urgency,
        category: 'escalation',
        member: {
          id: params.memberId,
          name: 'Member', // Default name since it's required
          tier: params.memberTier,
          preferences: {}
        },
        escalationId,
        ticketId: ticketResult.ticket.id,
        priority
      }
    });

    if (!notificationResult.sent) {
      console.warn('⚠️ [ESCALATION] Notification failed, but escalation recorded');
    }

    // Determine estimated response time based on priority
    const estimatedResponseTime = getEstimatedResponseTime(priority, params.memberTier);

    // Assign concierge based on tier and category
    const assignedConcierge = assignConcierge(params.memberTier, params.serviceCategory);

    console.log('✅ [ESCALATION] Human escalation completed:', {
      escalationId,
      ticketId: ticketResult.ticket.id,
      priority,
      estimatedResponseTime,
      assignedConcierge
    });

    return {
      success: true,
      escalationId,
      ticketId: ticketResult.ticket.id,
      estimatedResponseTime,
      assignedConcierge,
      priority
    };

  } catch (error) {
    console.error('❌ [ESCALATION] Human escalation failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Escalation failed'
    };
  }
}

/**
 * Calculate priority based on member tier and urgency
 */
function calculatePriority(memberTier: string, urgency: string): string {
  const tierPriority = {
    'founding10': 4,
    'fifty-k': 3,
    'corporate': 2,
    'all-members': 1
  };

  const urgencyPriority = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };

  const totalPriority = (tierPriority[memberTier as keyof typeof tierPriority] || 1) + 
                       (urgencyPriority[urgency as keyof typeof urgencyPriority] || 1);

  if (totalPriority >= 7) return 'P1-CRITICAL';
  if (totalPriority >= 5) return 'P2-HIGH';
  if (totalPriority >= 3) return 'P3-MEDIUM';
  return 'P4-LOW';
}

/**
 * Format escalation message for concierge team
 */
function formatEscalationMessage(params: z.infer<typeof escalateToHumanSchema>, escalationId: string, priority: string): string {
  return `🚨 ESCALATION: ${escalationId}

**Priority:** ${priority}
**Member Tier:** ${params.memberTier.toUpperCase()}
**Service Category:** ${params.serviceCategory}
**Urgency:** ${params.urgency.toUpperCase()}

**Escalation Reason:**
${params.reason}

**Request Details:**
${params.requestDetails}

**Preferred Contact:** ${params.preferredContactMethod}
${params.timeZone ? `**Timezone:** ${params.timeZone}` : ''}

**Conversation Context:**
${params.conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

**Action Required:** Immediate human concierge response needed`;
}

/**
 * Get estimated response time based on priority and member tier
 */
function getEstimatedResponseTime(priority: string, memberTier: string): string {
  if (priority === 'P1-CRITICAL') {
    return memberTier === 'founding10' ? '5 minutes' : '15 minutes';
  }
  if (priority === 'P2-HIGH') {
    return memberTier === 'founding10' ? '15 minutes' : '30 minutes';
  }
  if (priority === 'P3-MEDIUM') {
    return memberTier === 'founding10' ? '1 hour' : '2 hours';
  }
  return memberTier === 'founding10' ? '2 hours' : '4 hours';
}

/**
 * Assign concierge based on member tier and service category
 */
function assignConcierge(memberTier: string, serviceCategory: string): string {
  const tierAssignments = {
    'founding10': 'Senior Concierge - Priority Team',
    'fifty-k': 'Senior Concierge - Premium Team',
    'corporate': 'Concierge - Corporate Team',
    'all-members': 'Concierge - General Team'
  };

  const categorySpecialists = {
    'transportation': 'Travel Specialist',
    'events': 'Events Coordinator',
    'lifestyle': 'Lifestyle Specialist',
    'investments': 'Investment Advisor',
    'brandDev': 'Brand Development Specialist'
  };

  const baseAssignment = tierAssignments[memberTier as keyof typeof tierAssignments] || 'General Concierge';
  const specialist = categorySpecialists[serviceCategory as keyof typeof categorySpecialists];

  return specialist ? `${specialist} (${baseAssignment})` : baseAssignment;
} 