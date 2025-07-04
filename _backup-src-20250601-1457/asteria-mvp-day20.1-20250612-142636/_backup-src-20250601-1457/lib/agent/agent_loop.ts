import { IntentPlanner, IntentAnalysis, PlanningContext } from './planner';
import { ServiceExecutor, ExecutionContext, ExecutionResult } from './executor';
import { InteractionReflector, RunLog } from './reflector';
import { GoalChecker, GoalValidation } from './goal_checker';

export interface AgentContext {
  memberId: string;
  memberName: string;
  memberTier: string;
  originalMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  retryCount?: number;
  maxRetries?: number;
}

export interface AgentResult {
  success: boolean;
  response: string;
  intentAnalysis: IntentAnalysis;
  executionResult: ExecutionResult;
  goalValidation: GoalValidation;
  runLog: RunLog;
  recommendations: string[];
  nextSteps: string[];
  requiresFollowUp: boolean;
}

/**
 * AGENT LOOP: Main coordination engine
 * Orchestrates the complete Plan → Execute → Reflect → Check cycle
 */
export class AsteriaAgentLoop {
  private planner: IntentPlanner;
  private executor: ServiceExecutor;
  private reflector: InteractionReflector;
  private goalChecker: GoalChecker;

  constructor() {
    this.planner = new IntentPlanner();
    this.executor = new ServiceExecutor();
    this.reflector = new InteractionReflector();
    this.goalChecker = new GoalChecker();
  }

  /**
   * Main agent loop - complete cycle for member request processing
   */
  async processRequest(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const { memberId, memberName, memberTier, originalMessage, conversationHistory } = context;
    
    console.log(`[AGENT_LOOP] Starting request processing for member: ${memberName}`);
    console.log(`[AGENT_LOOP] Message: ${originalMessage.substring(0, 100)}...`);

    try {
      // STEP 1: PLAN - Analyze intent and create execution plan
      console.log(`[AGENT_LOOP] Phase 1: Intent Planning`);
      const planningContext: PlanningContext = {
        message: originalMessage,
        conversationHistory,
        memberProfile: {
          tier: memberTier,
          preferences: [],
          previousServices: []
        }
      };
      
      const intentAnalysis = await this.planner.planExecution(planningContext);
      console.log(`[AGENT_LOOP] Intent: ${intentAnalysis.primaryBucket} (confidence: ${(intentAnalysis.confidence * 100).toFixed(1)}%)`);

      // STEP 2: EXECUTE - Run the planned actions using tools
      console.log(`[AGENT_LOOP] Phase 2: Service Execution`);
      const executionContext: ExecutionContext = {
        intentAnalysis,
        memberInfo: {
          id: memberId,
          name: memberName,
          tier: memberTier
        },
        conversationHistory,
        originalMessage
      };
      
      const executionResult = await this.executor.executeService(executionContext);
      console.log(`[AGENT_LOOP] Execution: ${executionResult.success ? 'SUCCESS' : 'PARTIAL/FAILED'}`);

      // STEP 3: REFLECT - Log the interaction and extract learnings
      console.log(`[AGENT_LOOP] Phase 3: Interaction Reflection`);
      const runLog = await this.reflector.reflectOnInteraction(
        originalMessage,
        intentAnalysis,
        executionResult,
        memberId,
        startTime
      );

      // STEP 4: CHECK - Validate goal achievement and determine next actions
      console.log(`[AGENT_LOOP] Phase 4: Goal Validation`);
      const goalValidation = await this.goalChecker.validateGoalAchievement(
        intentAnalysis,
        executionResult,
        runLog
      );

      // STEP 5: RETRY LOGIC - If goals not achieved and retry recommended
      if (!goalValidation.achieved && goalValidation.retryRecommended && (context.retryCount || 0) < (context.maxRetries || 2)) {
        console.log(`[AGENT_LOOP] Retry recommended - attempting retry ${(context.retryCount || 0) + 1}`);
        
        return await this.handleRetry(context, goalValidation, intentAnalysis);
      }

      // STEP 6: GENERATE RESPONSE - Create final response for member
      const response = await this.generateResponse(
        intentAnalysis,
        executionResult,
        goalValidation
      );

      const agentResult: AgentResult = {
        success: goalValidation.achieved,
        response,
        intentAnalysis,
        executionResult,
        goalValidation,
        runLog,
        recommendations: executionResult.recommendations,
        nextSteps: executionResult.nextActions,
        requiresFollowUp: runLog.followUp.required
      };

      const totalTime = Date.now() - startTime;
      console.log(`[AGENT_LOOP] Complete in ${totalTime}ms - Goals ${goalValidation.achieved ? 'ACHIEVED' : 'NOT ACHIEVED'}`);

      return agentResult;

    } catch (error) {
      console.error(`[AGENT_LOOP] Critical error:`, error);
      
      // Create emergency response
      return await this.handleCriticalError(context, error as Error, startTime);
    }
  }

  /**
   * Handle retry logic when goals not achieved
   */
  private async handleRetry(
    context: AgentContext,
    goalValidation: GoalValidation,
    originalIntent: IntentAnalysis
  ): Promise<AgentResult> {
    const retryStrategy = goalValidation.retryStrategy!;
    
    console.log(`[AGENT_LOOP] Implementing retry strategy: ${retryStrategy.approach}`);
    
    // Modify context based on retry strategy
    const retryContext: AgentContext = {
      ...context,
      retryCount: (context.retryCount || 0) + 1,
      originalMessage: this.modifyMessageForRetry(context.originalMessage, retryStrategy)
    };

    // Recursive call with modified context
    return await this.processRequest(retryContext);
  }

  /**
   * Handle critical errors with graceful degradation
   */
  private async handleCriticalError(
    context: AgentContext,
    error: Error,
    startTime: number
  ): Promise<AgentResult> {
    console.error(`[AGENT_LOOP] Emergency escalation due to critical error`);
    
    // Create minimal intent analysis for emergency
    const emergencyIntent: IntentAnalysis = {
      primaryBucket: 'lifestyle',
      secondaryBuckets: [],
      serviceType: 'emergency',
      urgency: 'emergency',
      confidence: 1.0,
      extractedEntities: {},
      suggestedTier: 'extraordinary'
    };

    // Create emergency execution result
    const emergencyExecution: ExecutionResult = {
      success: false,
      plan: {
        steps: [],
        strategy: 'escalation',
        expectedOutcome: 'Human concierge emergency response',
        fallbackOptions: []
      },
      executedSteps: [],
      finalResult: null,
      recommendations: ['Emergency escalation initiated'],
      nextActions: ['Senior concierge will contact you immediately'],
      escalationNeeded: true
    };

    // Log the error
    const errorLog = await this.reflector.reflectOnInteraction(
      context.originalMessage,
      emergencyIntent,
      emergencyExecution,
      context.memberId,
      startTime
    );

    // Emergency goal validation
    const emergencyValidation: GoalValidation = {
      achieved: false,
      score: 0,
      criteriaResults: [],
      missingElements: ['Service execution failed'],
      retryRecommended: false
    };

    return {
      success: false,
      response: `I apologize, but I'm experiencing technical difficulties. I've immediately escalated your request to our senior concierge team who will contact you within 5 minutes to ensure your needs are met. Reference: ${errorLog.id}`,
      intentAnalysis: emergencyIntent,
      executionResult: emergencyExecution,
      goalValidation: emergencyValidation,
      runLog: errorLog,
      recommendations: ['Emergency human intervention'],
      nextSteps: ['Await senior concierge contact'],
      requiresFollowUp: true
    };
  }

  /**
   * Generate the final response for the member
   */
  private async generateResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): Promise<string> {
    const { primaryBucket, serviceType, urgency, confidence } = intentAnalysis;
    const { success, finalResult, recommendations, nextActions } = executionResult;
    const { achieved, score } = goalValidation;

    let response = '';

    // Check if this is a greeting or general inquiry (low confidence + no specific services)
    const isGreeting = confidence < 0.9 && primaryBucket === 'lifestyle' && 
                       (!finalResult?.ticket && serviceType !== 'emergency');

    if (isGreeting) {
      // Generate appropriate greeting response
      const hour = new Date().getHours();
      let timeGreeting = '';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 17) timeGreeting = 'Good afternoon';
      else timeGreeting = 'Good evening';

      response = `${timeGreeting}! I'm Asteria, your AI luxury concierge. It's my pleasure to assist you today.\n\n`;
      response += `I specialize in creating extraordinary experiences across luxury transportation, exclusive events, lifestyle curation, investment opportunities, and access to our elite TAG network.\n\n`;
      response += `How may I elevate your day? Whether you need private aviation, restaurant reservations, event access, or something uniquely yours, I'm here to make it exceptional.`;
      
      return response;
    }

    // Opening based on achievement level
    if (achieved) {
      response += `Excellent! I've successfully arranged your ${serviceType} request. `;
    } else if (score > 0.6) {
      response += `I've made significant progress on your ${serviceType} request. `;
    } else {
      response += `I understand your interest in our ${primaryBucket} services. `;
    }

    // Add specific results
    if (finalResult?.ticket) {
      response += `Your service request ${finalResult.ticket.id} has been created with all details confirmed. `;
      response += `Total investment: $${finalResult.ticket.pricing.totalPrice.toLocaleString()}. `;
    } else if (finalResult?.services?.length > 0) {
      response += `I've curated ${finalResult.services.length} exceptional options that align with your preferences: ${finalResult.services.map((s: any) => s.name).join(", ")} `;
    }

    // Add urgency-appropriate messaging
    if (urgency === 'emergency') {
      response += `Given the urgent nature of your request, I've prioritized immediate attention. `;
    } else if (urgency === 'urgent') {
      response += `I've expedited this request for prompt handling. `;
    }

    // Add next steps
    if (nextActions.length > 0) {
      response += `Next steps: ${nextActions.slice(0, 2).join(', ')}. `;
    }

    // Add recommendations if any
    if (recommendations.length > 0 && achieved) {
      response += `I also recommend considering ${recommendations[0].toLowerCase()}. `;
    }

    // Closing with anticipation
    response += `I'll continue monitoring your request to ensure everything proceeds seamlessly. Is there anything else I can elevate for you?`;

    return response;
  }

  /**
   * Modify message for retry based on strategy
   */
  private modifyMessageForRetry(
    originalMessage: string,
    retryStrategy: GoalValidation['retryStrategy']
  ): string {
    if (!retryStrategy) return originalMessage;

    switch (retryStrategy.approach) {
      case 'collect_more_info':
        return `${originalMessage} [Retry: Need more specific details]`;
      
      case 'alternative_tools':
        return `${originalMessage} [Retry: Using alternative approach]`;
      
      case 'same_tools':
        return `${originalMessage} [Retry: Broadened search criteria]`;
      
      case 'escalate':
        return `${originalMessage} [Retry: Escalating to human concierge]`;
      
      default:
        return originalMessage;
    }
  }

  /**
   * Get agent performance metrics
   */
  async getPerformanceMetrics() {
    return await this.reflector.analyzePerformance('week');
  }

  /**
   * Get improvement insights
   */
  async getImprovementInsights() {
    return await this.reflector.getImprovementInsights();
  }
} 