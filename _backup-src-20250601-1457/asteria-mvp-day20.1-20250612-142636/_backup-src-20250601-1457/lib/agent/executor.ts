import { IntentAnalysis } from './planner';
import { fetch_active_services, ServiceSearchParams } from '@/lib/tools/services';
import { create_ticket, CreateTicketParams, Ticket } from '@/lib/tools/tickets';
import { notify_concierge, NotificationParams } from '@/lib/tools/notifications';
import { searchWeb } from '@/lib/search';

export interface ExecutionContext {
  intentAnalysis: IntentAnalysis;
  memberInfo: {
    id: string;
    name: string;
    tier: string;
  };
  conversationHistory: Array<{ role: string; content: string }>;
  originalMessage: string;
}

export interface ExecutionStep {
  toolName: string;
  parameters: any;
  result?: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: string;
  executionTime?: number;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  strategy: 'direct_fulfillment' | 'guided_collection' | 'escalation' | 'research';
  expectedOutcome: string;
  fallbackOptions: string[];
}

export interface ExecutionResult {
  success: boolean;
  plan: ExecutionPlan;
  executedSteps: ExecutionStep[];
  finalResult: any;
  recommendations: string[];
  nextActions: string[];
  escalationNeeded: boolean;
}

/**
 * EXECUTOR: Tool orchestration and service execution
 * Handles the actual execution of planned actions using available tools
 */
export class ServiceExecutor {

  /**
   * Main execution function - orchestrates tools to fulfill member requests
   */
  async executeService(context: ExecutionContext): Promise<ExecutionResult> {
    const { intentAnalysis, memberInfo, originalMessage } = context;
    
    console.log(`[EXECUTOR] Starting execution for bucket: ${intentAnalysis.primaryBucket}`);
    
    // Create execution plan based on intent analysis
    const plan = await this.createExecutionPlan(intentAnalysis, originalMessage);
    
    // Execute the plan step by step
    const executedSteps: ExecutionStep[] = [];
    let finalResult: any = null;
    let escalationNeeded = false;

    for (const step of plan.steps) {
      try {
        const startTime = Date.now();
        step.status = 'executing';
        step.timestamp = new Date().toISOString();

        console.log(`[EXECUTOR] Executing step: ${step.toolName}`);

        // Execute the tool
        const result = await this.executeTool(step, memberInfo);
        
        step.result = result;
        step.status = 'completed';
        step.executionTime = Date.now() - startTime;
        
        executedSteps.push(step);
        
        // Store final result from the last meaningful step
        if (result && (step.toolName === 'create_ticket' || step.toolName === 'fetch_active_services')) {
          finalResult = result;
        }

        console.log(`[EXECUTOR] Step completed in ${step.executionTime}ms`);

      } catch (error) {
        console.error(`[EXECUTOR] Step failed:`, error);
        
        step.status = 'failed';
        step.result = { error: error instanceof Error ? error.message : 'Unknown error' };
        executedSteps.push(step);
        
        // Trigger escalation for critical failures
        if (step.toolName === 'create_ticket' || intentAnalysis.urgency === 'emergency') {
          escalationNeeded = true;
          await this.triggerEscalation(context, error as Error);
        }
      }
    }

    // Generate recommendations and next actions
    const recommendations = this.generateRecommendations(intentAnalysis, executedSteps);
    const nextActions = this.generateNextActions(intentAnalysis, executedSteps, finalResult);

    return {
      success: executedSteps.some(step => step.status === 'completed'),
      plan,
      executedSteps,
      finalResult,
      recommendations,
      nextActions,
      escalationNeeded
    };
  }

  /**
   * Create execution plan based on intent analysis
   */
  private async createExecutionPlan(intentAnalysis: IntentAnalysis, message: string): Promise<ExecutionPlan> {
    const { primaryBucket, confidence, urgency, extractedEntities } = intentAnalysis;
    
    let strategy: ExecutionPlan['strategy'];
    const steps: ExecutionStep[] = [];

    // Determine strategy based on confidence and completeness
    if (confidence > 0.8 && this.hasCompleteRequirements(intentAnalysis)) {
      strategy = 'direct_fulfillment';
    } else if (confidence > 0.6) {
      strategy = 'guided_collection';
    } else if (urgency === 'emergency' || confidence < 0.2) {
      strategy = 'escalation';
    } else {
      strategy = 'research';
    }

    // Build execution steps based on strategy
    switch (strategy) {
      case 'direct_fulfillment':
        steps.push(
          {
            toolName: 'fetch_active_services',
            parameters: {
              bucket: primaryBucket,
              tier: intentAnalysis.suggestedTier,
              searchTerm: intentAnalysis.serviceType
            },
            status: 'pending',
            timestamp: ''
          },
          {
            toolName: 'create_ticket',
            parameters: {
              serviceId: 'to_be_determined', // Will be set from search results
              requirements: this.buildRequirements(extractedEntities),
              priority: urgency === 'emergency' ? 'emergency' : urgency === 'urgent' ? 'urgent' : 'standard'
            },
            status: 'pending',
            timestamp: ''
          }
        );
        break;

      case 'guided_collection':
        steps.push(
          {
            toolName: 'fetch_active_services',
            parameters: {
              bucket: primaryBucket,
              tier: intentAnalysis.suggestedTier
            },
            status: 'pending',
            timestamp: ''
          }
        );
        break;

      case 'escalation':
        steps.push(
          {
            toolName: 'notify_concierge',
            parameters: {
              message: `High priority request requiring immediate attention: ${message}`,
              urgency: urgency === 'emergency' ? 'critical' : 'high',
              category: 'escalation'
            },
            status: 'pending',
            timestamp: ''
          }
        );
        break;

      case 'research':
        steps.push(
          {
            toolName: 'web_search',
            parameters: {
              query: `luxury ${intentAnalysis.serviceType} ${primaryBucket} services`
            },
            status: 'pending',
            timestamp: ''
          },
          {
            toolName: 'fetch_active_services',
            parameters: {
              bucket: primaryBucket,
              tier: 'better'
            },
            status: 'pending',
            timestamp: ''
          }
        );
        break;
    }

    return {
      steps,
      strategy,
      expectedOutcome: this.getExpectedOutcome(strategy, primaryBucket),
      fallbackOptions: this.getFallbackOptions(primaryBucket, strategy)
    };
  }

  /**
   * Execute individual tool with parameters
   */
  private async executeTool(step: ExecutionStep, memberInfo: any): Promise<any> {
    const { toolName, parameters } = step;

    switch (toolName) {
      case 'fetch_active_services':
        return await fetch_active_services(parameters as ServiceSearchParams);

      case 'create_ticket':
        // If serviceId is 'to_be_determined', we need to get it from previous step
        let ticketParams = { ...parameters };
        if (parameters.serviceId === 'to_be_determined') {
          // This should be improved to use results from previous steps
          ticketParams.serviceId = 'luxury-ground-transport'; // Fallback
        }
        
        return await create_ticket({
          memberId: memberInfo.id,
          ...ticketParams
        } as CreateTicketParams);

      case 'notify_concierge':
        return await notify_concierge({
          message: parameters.message,
          context: {
            urgency: parameters.urgency,
            category: parameters.category,
            member: memberInfo
          }
        } as NotificationParams);

      case 'web_search':
        return await searchWeb(parameters.query);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Check if we have complete requirements for direct execution
   */
  private hasCompleteRequirements(intentAnalysis: IntentAnalysis): boolean {
    const { extractedEntities, primaryBucket } = intentAnalysis;

    const requiredEntitiesByBucket = {
      transportation: ['dates', 'locations'],
      events: ['dates'],
      brandDev: [],
      investments: [],
      taglades: [],
      lifestyle: []
    };

    const required = requiredEntitiesByBucket[primaryBucket] || [];
    return required.every(entity => 
      extractedEntities[entity as keyof typeof extractedEntities]?.length
    );
  }

  /**
   * Build requirements object from extracted entities
   */
  private buildRequirements(extractedEntities: IntentAnalysis['extractedEntities']): Record<string, any> {
    const requirements: Record<string, any> = {};

    if (extractedEntities.dates?.length) {
      requirements.date = extractedEntities.dates[0];
    }
    if (extractedEntities.locations?.length) {
      requirements.destination = extractedEntities.locations[0];
    }
    if (extractedEntities.people?.length) {
      requirements.passengers = extractedEntities.people[0];
    }

    return requirements;
  }

  /**
   * Generate recommendations based on execution results
   */
  private generateRecommendations(
    intentAnalysis: IntentAnalysis, 
    executedSteps: ExecutionStep[]
  ): string[] {
    const recommendations: string[] = [];
    const { primaryBucket, suggestedTier, confidence } = intentAnalysis;

    // Service-specific recommendations
    if (primaryBucket === 'transportation' && suggestedTier === 'better') {
      recommendations.push("Consider upgrading to our Extraordinary tier for enhanced privacy and luxury amenities");
    }

    if (primaryBucket === 'events' && confidence < 0.7) {
      recommendations.push("Provide specific event preferences to receive more targeted recommendations");
    }

    // Execution-based recommendations
    const failedSteps = executedSteps.filter(step => step.status === 'failed');
    if (failedSteps.length > 0) {
      recommendations.push("Some services may require additional information - our concierge team will follow up");
    }

    // General recommendations
    if (intentAnalysis.secondaryBuckets.length > 0) {
      recommendations.push(`Also consider our ${intentAnalysis.secondaryBuckets.join(' and ')} services for a complete experience`);
    }

    return recommendations;
  }

  /**
   * Generate next actions based on execution state
   */
  private generateNextActions(
    intentAnalysis: IntentAnalysis,
    executedSteps: ExecutionStep[],
    finalResult: any
  ): string[] {
    const nextActions: string[] = [];

    // If ticket was created successfully
    if (finalResult && finalResult.ticket) {
      nextActions.push(`Ticket ${finalResult.ticket.id} created - confirmation email sent`);
      nextActions.push("Dedicated concierge will contact you within 30 minutes");
      nextActions.push("You can track progress via your member portal");
    }

    // If only search was performed
    else if (executedSteps.some(step => step.toolName === 'fetch_active_services' && step.status === 'completed')) {
      nextActions.push("Review the curated service options presented");
      nextActions.push("Provide additional preferences for personalized recommendations");
      nextActions.push("Confirm your selection to proceed with booking");
    }

    // If escalation occurred
    else if (executedSteps.some(step => step.toolName === 'notify_concierge')) {
      nextActions.push("Priority escalation initiated");
      nextActions.push("Senior concierge will contact you directly");
      nextActions.push("Expect response within 15 minutes");
    }

    return nextActions;
  }

  /**
   * Trigger escalation for failed executions
   */
  private async triggerEscalation(context: ExecutionContext, error: Error): Promise<void> {
    try {
      await notify_concierge({
        message: `ESCALATION: Service execution failed for member ${context.memberInfo.name}. Error: ${error.message}. Original request: ${context.originalMessage}`,
        context: {
          urgency: 'critical',
          category: 'escalation',
          member: {
            ...context.memberInfo,
            preferences: {}
          }
        }
      });
    } catch (escalationError) {
      console.error('[EXECUTOR] Escalation notification failed:', escalationError);
    }
  }

  /**
   * Get expected outcome description
   */
  private getExpectedOutcome(strategy: ExecutionPlan['strategy'], bucket: string): string {
    const outcomes = {
      direct_fulfillment: `Complete ${bucket} service booking with confirmation`,
      guided_collection: `Curated ${bucket} service options with booking assistance`,
      escalation: `Priority human concierge assignment for complex ${bucket} request`,
      research: `Comprehensive ${bucket} service analysis and recommendations`
    };

    return outcomes[strategy];
  }

  /**
   * Get fallback options
   */
  private getFallbackOptions(bucket: string, strategy: ExecutionPlan['strategy']): string[] {
    const fallbacks = [
      'Human concierge consultation available',
      'Alternative service tiers can be explored',
      'Custom service arrangements possible'
    ];

    if (strategy !== 'escalation') {
      fallbacks.unshift('Escalate to senior concierge team');
    }

    return fallbacks;
  }
}
