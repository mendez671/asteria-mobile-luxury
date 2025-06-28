import { IntentPlanner, IntentAnalysis, PlanningContext } from './planner';
import { ServiceExecutor, ExecutionContext, ExecutionResult } from './executor';
import { InteractionReflector, RunLog } from './reflector';
import { GoalChecker, GoalValidation } from './goal_checker';

// ===============================
// WEEK 2: CORE FLOW OPTIMIZATION
// Enhanced with response refinement
// ===============================
import { ResponseRefiner } from './refiner';

// ===============================
// WEEK 3 DAY 15: EXECUTION TRANSPARENCY
// Tool execution tracking for member visibility
// ===============================
import { executionTracker, ToolExecutionStatus, EscalationContext, ExecutionTimeline } from './execution-tracker';

// ===============================
// WEEK 3 DAY 17: SLA TRACKING & COUNTDOWN TIMERS
// Advanced escalation management with real-time monitoring
// ===============================
import { slaTracker, SLAMetrics, CountdownTimer } from './sla-tracker';

// ===============================
// WEEK 3 DAY 19: ENHANCED WORKFLOW TRIGGERS
// Smart workflow detection and triggering
// ===============================
import { workflowDetector, WorkflowTrigger, DetectionContext } from './workflow-detector';
import { workflowStatusTracker } from '../../workflow/status-tracker';
import { getEnhancedWorkflowTemplate } from '../../workflow/templates';

export interface AgentContext {
  memberId: string;
  memberName: string;
  memberTier: string;
  originalMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  retryCount?: number;
  maxRetries?: number;
}

// ===============================
// WEEK 3 DAY 15: ENHANCED AGENT RESULT
// Extended with execution transparency data
// ===============================
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
  // Week 3 transparency enhancements
  toolsExecuted?: ToolExecutionStatus[];
  executionTimeline?: ExecutionTimeline;
  escalationContext?: EscalationContext;
  memberExperience?: {
    clarity: number;
    transparency: number;
    satisfaction: number;
  };
  // Week 3 Day 17: SLA tracking data
  slaMetrics?: SLAMetrics | null;
  countdownTimers?: CountdownTimer[];
  shouldEscalate?: boolean;
  escalationReason?: string;
  // Week 3 Day 19: Enhanced workflow triggers
  workflowTrigger?: WorkflowTrigger | null;
  workflowInitiated?: boolean;
  workflowId?: string;
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
  
  // ===============================
  // WEEK 2: CORE FLOW OPTIMIZATION
  // ===============================
  private responseRefiner: ResponseRefiner;

  constructor() {
    this.planner = new IntentPlanner();
    this.executor = new ServiceExecutor();
    this.reflector = new InteractionReflector();
    this.goalChecker = new GoalChecker();
    
    // ===============================
    // WEEK 2: CORE FLOW OPTIMIZATION
    // Initialize response refinement system
    // ===============================
    this.responseRefiner = new ResponseRefiner();
  }

  /**
   * Main agent loop - complete cycle for member request processing
   * Enhanced with Week 3 execution transparency
   */
  async processRequest(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const { memberId, memberName, memberTier, originalMessage, conversationHistory } = context;
    
    console.log(`[AGENT_LOOP] Starting request processing for member: ${memberName}`);
    console.log(`[AGENT_LOOP] Message: ${originalMessage.substring(0, 100)}...`);

    // ===============================
    // WEEK 3 DAY 15: EXECUTION TRACKING INITIALIZATION
    // Reset tracker for new conversation and start monitoring
    // ===============================
    executionTracker.reset();
    const trackingId = executionTracker.startExecution('agent_loop_processing');
    executionTracker.updateExecution(trackingId, { status: 'executing', progress: 10 });

    // ===============================
    // WEEK 3 DAY 17: SLA TRACKING INITIALIZATION
    // Start SLA monitoring for this request
    // ===============================
    const requestId = `req_${memberId}_${Date.now()}`;
    const serviceType = 'general'; // Will be updated after intent analysis
    let slaMetrics: SLAMetrics | null = null;
    
    try {
      // Verify slaTracker exists and has startTracking method
      if (slaTracker && typeof slaTracker.startTracking === 'function') {
        slaMetrics = slaTracker.startTracking(requestId, serviceType, memberTier, context);
        console.log(`✅ [SLA] Started tracking for ${requestId}`);
      } else {
        console.warn(`⚠️ [SLA] slaTracker.startTracking is not available`);
      }
    } catch (slaError) {
      console.warn(`⚠️ [SLA] Failed to start tracking: ${slaError}`);
      // Continue without SLA tracking rather than failing
    }

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

      // ===============================
      // WEEK 3 DAY 19: ENHANCED WORKFLOW DETECTION
      // Analyze if this request should trigger an advanced workflow
      // ===============================
      let workflowTrigger: WorkflowTrigger | null = null;
      let workflowInitiated = false;
      let workflowId: string | undefined;

      try {
        const detectionContext: DetectionContext = {
          intent: intentAnalysis.primaryBucket as any,
          memberTier: memberTier as any,
          messageText: originalMessage,
          conversationHistory,
          extractedEntities: {
            services: [], // Will be derived from intent analysis
            locations: intentAnalysis.extractedEntities?.locations || [],
            dates: intentAnalysis.extractedEntities?.dates || [],
            people: intentAnalysis.extractedEntities?.people?.length || 1,
            budget: undefined, // Can be extracted from budgetHints
            urgency: intentAnalysis.urgency as any
          }
        };

        workflowTrigger = await workflowDetector.detectWorkflow(detectionContext);
        
        if (workflowTrigger && workflowTrigger.confidence > 0.7) {
          console.log(`🎯 [WORKFLOW_DETECTION] High-value workflow detected: ${workflowTrigger.workflowType}`);
          console.log(`🎯 [WORKFLOW_DETECTION] Confidence: ${(workflowTrigger.confidence * 100).toFixed(1)}%`);
          console.log(`🎯 [WORKFLOW_DETECTION] Reasoning: ${workflowTrigger.reasoning}`);

          // Get enhanced workflow template
          const workflowTemplate = getEnhancedWorkflowTemplate(workflowTrigger.workflowType, memberTier as any);
          
          if (workflowTemplate) {
            workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Initialize workflow tracking
            await workflowStatusTracker.initializeTracking(workflowId, workflowTemplate as any);
            workflowInitiated = true;
            
            console.log(`✅ [WORKFLOW_DETECTION] Enhanced workflow initiated: ${workflowId}`);
          }
        } else if (workflowTrigger) {
          console.log(`📊 [WORKFLOW_DETECTION] Workflow detected but confidence too low: ${(workflowTrigger.confidence * 100).toFixed(1)}%`);
        }
      } catch (workflowError) {
        console.warn(`⚠️ [WORKFLOW_DETECTION] Error in workflow detection: ${workflowError}`);
        // Continue with normal processing
      }

      // ===============================
      // WEEK 3 DAY 17: UPDATE SLA TRACKING WITH SERVICE TYPE
      // Now that we know the service type, update SLA tracking
      // ===============================
      try {
        if (slaTracker && typeof slaTracker.stopTracking === 'function') {
          if (slaMetrics) {
            slaTracker.stopTracking(requestId); // Stop generic tracking
          }
          const actualServiceType = intentAnalysis.primaryBucket as any;
          slaMetrics = slaTracker.startTracking(requestId, actualServiceType, memberTier, context);
          console.log(`✅ [SLA] Updated tracking for ${actualServiceType}`);
        }
      } catch (slaError) {
        console.warn(`⚠️ [SLA] Failed to update tracking: ${slaError}`);
        // Continue without updated SLA tracking
      }

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
        originalMessage,
        sessionId: `session_${memberId}_${Date.now()}`
      };

      // ===============================
      // PHASE 5.4: ENHANCED EXECUTION WITH MEMBER PROFILE
      // Pass member profile for workflow triggering
      // ===============================
      const memberProfile = {
        id: memberId,
        name: memberName,
        tier: memberTier as 'standard' | 'premium' | 'elite',
        preferences: {},
        serviceHistory: [],
        contactMethods: []
      };
      
      const executionResult = await this.executor.executeService(executionContext, memberProfile);
      console.log(`[AGENT_LOOP] Execution: ${executionResult.success ? 'SUCCESS' : 'PARTIAL/FAILED'}`);
      
      // Log workflow information if triggered
      if (executionResult.workflowTriggered) {
        console.log(`[AGENT_LOOP] Workflow triggered: ${executionResult.workflowType} (ID: ${executionResult.workflowId})`);
      }

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
      // Enhanced in Week 2 with response refinement
      executionTracker.updateExecution(trackingId, { progress: 80 });
      
      const response = await this.generateResponse(
        intentAnalysis,
        executionResult,
        goalValidation,
        context,
        executionResult.executedSteps?.map(step => step.result) || []
      );

      // ===============================
      // WEEK 3 DAY 15: EXECUTION TRANSPARENCY COMPLETION
      // Collect execution data for member-facing transparency
      // ===============================
      executionTracker.completeExecution(trackingId, { success: goalValidation.achieved });
      
      const executionTimeline = executionTracker.getExecutionTimeline();
      const toolsExecuted = executionTracker.getMemberVisibleExecutions();
      const escalationContext = executionTracker.getEscalationContext();

      // ===============================
      // WEEK 3 DAY 17: SLA FINALIZATION & ESCALATION CHECK
      // Update SLA metrics and check for escalation triggers
      // ===============================
      let finalSlaMetrics: SLAMetrics | null = slaMetrics;
      let countdownTimers: CountdownTimer[] = [];
      let escalationCheck: { shouldEscalate: boolean; reason: string; urgency: 'low' | 'medium' | 'high' | 'critical'; estimatedResponse: string; } = { shouldEscalate: false, reason: 'No SLA tracking', urgency: 'low', estimatedResponse: '30 minutes' };
      
      try {
        if (slaTracker && typeof slaTracker.updateTracking === 'function') {
          finalSlaMetrics = slaTracker.updateTracking(requestId, toolsExecuted);
        }
        if (slaTracker && typeof slaTracker.getCountdownTimers === 'function') {
          countdownTimers = slaTracker.getCountdownTimers(requestId);
        }
        if (slaTracker && typeof slaTracker.checkEscalationTriggers === 'function') {
          escalationCheck = slaTracker.checkEscalationTriggers(requestId);
        }
        
        // Update performance metrics
        if (slaTracker && typeof slaTracker.updatePerformanceMetrics === 'function') {
          slaTracker.updatePerformanceMetrics({
            responseTime: Date.now() - startTime,
            toolSuccessRate: executionResult.success ? 1 : 0.5,
            memberSatisfaction: goalValidation.achieved ? 1 : 0.7
          });
        }
      } catch (slaError) {
        console.warn(`⚠️ [SLA] Failed to finalize tracking: ${slaError}`);
        // Use defaults and continue
      }

      // If escalation needed, update escalation context
      if (escalationCheck.shouldEscalate && !escalationContext) {
        executionTracker.recordEscalation({
          trigger: 'timeout',
          explanation: escalationCheck.reason,
          expectedResponse: escalationCheck.estimatedResponse,
          slaEstimate: 15 * 60 * 1000 // 15 minutes in milliseconds
        });
      }

      const agentResult: AgentResult = {
        success: goalValidation.achieved,
        response,
        intentAnalysis,
        executionResult,
        goalValidation,
        runLog,
        recommendations: executionResult.recommendations,
        nextSteps: executionResult.nextActions,
        requiresFollowUp: runLog.followUp.required,
        // Week 3 transparency enhancements
        toolsExecuted,
        executionTimeline,
        escalationContext,
        memberExperience: executionTimeline.memberExperience,
        // Week 3 Day 17: SLA tracking data
        slaMetrics: finalSlaMetrics,
        countdownTimers,
        shouldEscalate: escalationCheck.shouldEscalate,
        escalationReason: escalationCheck.reason,
        // Week 3 Day 19: Enhanced workflow triggers
        workflowTrigger,
        workflowInitiated,
        workflowId
      };

      const totalTime = Date.now() - startTime;
      console.log(`[AGENT_LOOP] Complete in ${totalTime}ms - Goals ${goalValidation.achieved ? 'ACHIEVED' : 'NOT ACHIEVED'}`);

      // ===============================
      // WEEK 3 DAY 17: CLEANUP SLA TRACKING
      // Stop tracking for completed requests
      // ===============================
      try {
        if (slaTracker && typeof slaTracker.stopTracking === 'function') {
          slaTracker.stopTracking(requestId);
        }
      } catch (slaError) {
        console.warn(`⚠️ [SLA] Failed to stop tracking: ${slaError}`);
      }

      return agentResult;

    } catch (error) {
      console.error(`[AGENT_LOOP] Critical error:`, error);
      
      // ===============================
      // WEEK 3 DAY 15: ESCALATION TRACKING
      // Record escalation context for transparency
      // ===============================
      executionTracker.recordEscalation({
        trigger: 'tool_failure',
        explanation: `System error occurred during processing: ${(error as Error).message}`,
        expectedResponse: 'Our technical team will resolve this issue immediately',
        slaEstimate: 900000 // 15 minutes for critical errors
      });
      
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
   * Enhanced in Week 2 with response refinement for quality optimization
   */
  private async generateResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation,
    context?: any,
    toolResults?: any[]
  ): Promise<string> {
    console.log(`🤖 [RESPONSE_GEN] DIAGNOSTIC - Response Generation:`);
    console.log(`🤖 [RESPONSE_GEN] Intent: ${intentAnalysis.primaryBucket}, Confidence: ${intentAnalysis.confidence}`);
    console.log(`🤖 [RESPONSE_GEN] Goals achieved: ${goalValidation.achieved}, Score: ${goalValidation.score}`);
    console.log(`🤖 [RESPONSE_GEN] Execution success: ${executionResult.success}`);
    
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

    // ===============================
    // FIXED: PERSONALIZED RESPONSE GENERATION
    // Replace generic templates with specific, contextual responses
    // ===============================
    
    console.log(`🤖 [RESPONSE_GEN] Generating personalized response for ${primaryBucket}...`);
    
    // Generate personalized opening based on bucket and execution results with enhanced diagnostics
    response += await this.generatePersonalizedOpening(
      intentAnalysis, 
      executionResult,
      goalValidation
    );

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

    // ===============================
    // WEEK 2: CORE FLOW OPTIMIZATION
    // Response Refinement for Quality Optimization
    // ===============================
    console.log(`🔧 [RESPONSE_GEN] Applying response refinement...`);
    
    try {
      // Fixed: Check if context exists before accessing properties
      const refinementContext = {
        memberTier: context?.memberTier || 'standard',
        memberProfile: context?.memberProfile || null,
        intent: intentAnalysis,
        request: context?.originalMessage || ''
      };
      
      const toolResultsData = executionResult.executedSteps?.map(step => ({
        tool: step.toolName,
        success: step.status === 'completed',
        data: step.result
      })) || [];
      
      const refinedResult = await this.responseRefiner.refineResponse(
        { message: response },
        refinementContext,
        toolResultsData
      );
      
      console.log(`📊 [RESPONSE_GEN] Refinement applied: quality ${refinedResult.quality.toFixed(2)}/10, enhanced: ${refinedResult.refined}`);
      
      if (refinedResult.refined) {
        console.log(`🎨 [RESPONSE_GEN] Enhancements applied: ${refinedResult.enhancements.join(', ')}`);
        console.log(`📈 [RESPONSE_GEN] Quality improvement: +${refinedResult.improvement_delta.toFixed(2)} points`);
      }
      
      console.log(`🤖 [RESPONSE_GEN] FINAL RESPONSE: "${refinedResult.message.substring(0, 100)}..."`);
      return refinedResult.message;
      
    } catch (refinementError) {
      console.error(`❌ [RESPONSE_GEN] Refinement failed, using original response:`, refinementError);
      console.log(`🤖 [RESPONSE_GEN] FINAL RESPONSE: "${response.substring(0, 100)}..."`);
      return response;
    }
  }

  /**
   * Generate personalized opening based on bucket and execution results with enhanced diagnostics
   */
  private async generatePersonalizedOpening(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): Promise<string> {
    const { primaryBucket, serviceType, confidence, extractedEntities } = intentAnalysis;
    const { achieved, score } = goalValidation;
    
    // 🔍 PHASE 2: RESPONSE GENERATION DIAGNOSTICS
    console.log(`📝 [RESPONSE_GEN] =================================`);
    console.log(`📝 [RESPONSE_GEN] Generating personalized response:`, {
      primaryBucket,
      serviceType,
      confidence,
      goalAchieved: achieved,
      goalScore: score,
      executionSuccess: executionResult.success,
      toolsExecuted: executionResult.executedSteps?.length || 0,
      completedTools: executionResult.executedSteps?.filter(s => s.status === 'completed').length || 0,
      hasFinalResult: !!executionResult.finalResult
    });
    
    // 🔍 TOOL EXECUTION ANALYSIS FOR RESPONSE GENERATION
    const hasServices = executionResult.executedSteps?.some(s => s.toolName === 'fetch_active_services' && s.status === 'completed');
    const hasTicket = executionResult.executedSteps?.some(s => s.toolName === 'create_ticket' && s.status === 'completed');
    const hasNotification = executionResult.executedSteps?.some(s => s.toolName === 'notify_concierge' && s.status === 'completed');
    
    console.log(`📝 [RESPONSE_GEN] Tool execution summary for response:`, {
      hasServices,
      hasTicket,
      hasNotification,
      shouldIncludeToolResults: hasServices || hasTicket || hasNotification
    });
    
    if (executionResult.executedSteps?.length === 0) {
      console.warn(`⚠️ [RESPONSE_GEN] NO TOOLS EXECUTED - This will generate generic response without tool results`);
    }
    
    console.log(`🤖 [RESPONSE_GEN] Generating for bucket: ${primaryBucket}, type: ${serviceType}`);
    
    let response = '';
    
    // Generate bucket-specific, contextual responses
    switch (primaryBucket) {
      case 'transportation':
        response = this.generateTransportationResponse(intentAnalysis, executionResult, goalValidation);
        break;
        
      case 'events':
        response = this.generateEventsResponse(intentAnalysis, executionResult, goalValidation);
        break;
        
      case 'lifestyle':
        response = this.generateLifestyleResponse(intentAnalysis, executionResult, goalValidation);
        break;
        
      case 'brandDev':
        response = this.generateBrandDevResponse(intentAnalysis, executionResult, goalValidation);
        break;
        
      case 'investments':
        response = this.generateInvestmentsResponse(intentAnalysis, executionResult, goalValidation);
        break;
        
      case 'taglades':
        response = this.generateTagladesResponse(intentAnalysis, executionResult, goalValidation);
        break;
        
      default:
        // Fallback to general personalized response
        response = this.generateGeneralResponse(intentAnalysis, executionResult, goalValidation);
    }
    
    // 🔍 ENHANCED TOOL RESULTS & RAG INTEGRATION
    const hasRAGResults = executionResult.executedSteps?.some(s => s.toolName === 'search_luxury_knowledge' && s.status === 'completed');
    
    if (hasServices || hasTicket || hasNotification || hasRAGResults) {
      console.log(`✅ [RESPONSE_GEN] Integrating tool results into response...`);
      
      // 1. RAG Knowledge Integration (HIGHEST PRIORITY)
      if (hasRAGResults) {
        const ragStep = executionResult.executedSteps?.find(s => s.toolName === 'search_luxury_knowledge');
        console.log(`🔍 [RAG_DEBUG] RAG step found:`, !!ragStep);
        console.log(`🔍 [RAG_DEBUG] RAG result structure:`, ragStep?.result ? Object.keys(ragStep.result) : 'No result');
        
        if (ragStep?.result && typeof ragStep.result === 'object' && 'data' in ragStep.result) {
          const ragData = ragStep.result.data;
          console.log(`🔍 [RAG_DEBUG] RAG data structure:`, ragData ? Object.keys(ragData) : 'No data');
          
          // Handle nested results structure: data.results contains the array
          const knowledgeChunks = ragData?.results || ragData;
          
          if (Array.isArray(knowledgeChunks) && knowledgeChunks.length > 0) {
            // Extract specific luxury knowledge for this service category
            const relevantKnowledge = knowledgeChunks.slice(0, 2); // Top 2 most relevant
            console.log(`🧠 [RESPONSE_GEN] Integrating ${relevantKnowledge.length} luxury knowledge chunks`);
            console.log(`🧠 [RESPONSE_GEN] Knowledge preview:`, relevantKnowledge.map(k => k.content?.substring(0, 50)).join(' | '));
            
            response = this.enhanceResponseWithLuxuryKnowledge(response, relevantKnowledge, primaryBucket);
          } else {
            console.warn(`⚠️ [RAG_DEBUG] RAG data is not an array or empty:`, knowledgeChunks);
          }
        } else {
          console.warn(`⚠️ [RAG_DEBUG] RAG step result missing or invalid structure`);
        }
      }
      
      // 2. Service Results Integration
      if (hasServices) {
        const serviceStep = executionResult.executedSteps?.find(s => s.toolName === 'fetch_active_services');
        if (serviceStep?.result && Array.isArray(serviceStep.result)) {
          const serviceCount = serviceStep.result.length;
          if (serviceCount > 0) {
            const serviceNames = serviceStep.result.slice(0, 3).map((s: any) => s.name).join(', ');
            response = `I've identified ${serviceCount} exceptional ${primaryBucket.replace('_', ' ')} options including ${serviceNames}. ` + response;
          }
        }
      }
      
      // 3. Ticket Creation Integration
      if (hasTicket) {
        const ticketStep = executionResult.executedSteps?.find(s => s.toolName === 'create_ticket');
        const ticketId = ticketStep?.result?.id || ticketStep?.result?.ticket?.id || 'SR-' + Date.now();
        response += ` I've created service request ${ticketId} with your specific requirements.`;
      }
      
      // 4. Concierge Notification Integration
      if (hasNotification) {
        response += ` Your dedicated concierge has been notified and will contact you within 2 hours with personalized recommendations.`;
      }
    } else {
      console.warn(`⚠️ [RESPONSE_GEN] No tool results to integrate - response will be conversation-only`);
    }
    
    // 🔍 FINAL RESPONSE ANALYSIS
    const isTemplateResponse = response.includes('I understand your interest in');
    const hasToolResultIndicators = /found \d+|created|sr-\d+|ticket|concierge|exceptional|luxury/i.test(response);
    
    console.log(`📝 [RESPONSE_GEN] Final response analysis:`, {
      responseLength: response.length,
      isTemplate: isTemplateResponse,
      hasToolIndicators: hasToolResultIndicators,
      responsePreview: response.substring(0, 100) + '...'
    });
    
    if (isTemplateResponse) {
      console.error(`🚨 [RESPONSE_GEN] GENERATED TEMPLATE RESPONSE!`);
      console.error(`🚨 [RESPONSE_GEN] This should not happen with personalized generation`);
    }
    
    if (!hasToolResultIndicators && (hasServices || hasTicket || hasNotification)) {
      console.warn(`⚠️ [RESPONSE_GEN] Tool execution occurred but no indicators in response`);
      console.warn(`⚠️ [RESPONSE_GEN] Tool results may not be properly integrated`);
    }
    
    return response;
  }

  /**
   * Generate transportation-specific responses
   */
  private generateTransportationResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): string {
    const { extractedEntities, serviceType, confidence } = intentAnalysis;
    const destinations = extractedEntities.locations || [];
    const dates = extractedEntities.dates || [];
    const people = extractedEntities.people || [];
    
    let response = '';
    
    // ===============================
    // ENHANCED: CONVERSATION CONTEXT AWARENESS
    // Build specific responses based on accumulated conversation context
    // ===============================
    const hasSpecificDetails = destinations.length > 0 || dates.length > 0 || people.length > 0;
    const hasAviationKeywords = serviceType.includes('aviation') || serviceType.includes('jet') || confidence > 0.7;
    
    if (hasAviationKeywords || serviceType.includes('private aviation')) {
      // Check if we have enough details for aircraft recommendation
      const hasDestination = destinations.some(dest => dest.toLowerCase().includes('vegas') || dest.toLowerCase().includes('henderson') || dest.toLowerCase().includes('miami'));
      const hasPassengers = people.length > 0 || /\b\d+\s*(of us|passengers?)\b/.test(extractedEntities.preferences?.join(' ') || '');
      const hasTiming = dates.length > 0;
      
      if (hasDestination && hasPassengers && hasTiming) {
        // We have all details - provide specific aircraft recommendation
        const passengerInfo = people.length > 0 ? people[0] : '4 passengers';
        const locationInfo = destinations.find(dest => dest.toLowerCase().includes('henderson')) ? 'Henderson Executive Airport' : 
                            destinations.find(dest => dest.toLowerCase().includes('vegas')) ? 'Las Vegas area' : destinations[0];
        const timeInfo = dates[0];
        
        response = `Excellent! Citation Latitude from ${locationInfo} ${timeInfo} for ${passengerInfo}. `;
        response += `This aircraft offers premium comfort with full cabin service, Rolls-Royce ground transportation, and direct routing to your destination. `;
        response += `What time would you prefer for departure?`;
        
      } else if (hasDestination || hasPassengers || hasTiming) {
        // We have some details - build on what we know
        response = `Perfect! Private aviation`;
        
        if (hasDestination) {
          const location = destinations.find(dest => dest.toLowerCase().includes('henderson')) ? 'from Henderson Executive Airport' :
                          destinations.find(dest => dest.toLowerCase().includes('vegas')) ? 'from Las Vegas' :
                          ` to ${destinations[0]}`;
          response += ` ${location}`;
        }
        
        if (hasTiming) {
          response += ` ${dates[0]}`;
        }
        
        if (hasPassengers) {
          const passengerCount = people.length > 0 ? people[0] : '4 passengers';
          response += ` for ${passengerCount}`;
        }
        
        response += `. Our Citation Latitude aircraft is ideal for this route with luxury cabin service. `;
        
        // Ask for missing details
        const missingDetails = [];
        if (!hasDestination) missingDetails.push('destination');
        if (!hasPassengers) missingDetails.push('number of passengers');
        if (!hasTiming) missingDetails.push('preferred departure time');
        
        if (missingDetails.length > 0) {
          response += `May I confirm the ${missingDetails.join(' and ')}?`;
        } else {
          response += `Shall I proceed with arrangements for your preferred departure time?`;
        }
        
      } else {
        // Initial aviation inquiry
        response = `I'd be delighted to arrange your private aviation experience`;
        if (destinations.length > 0) {
          response += ` to ${destinations[0]}`;
        }
        if (dates.length > 0) {
          response += ` for ${dates[0]}`;
        }
        response += `. To ensure I select the perfect aircraft, may I confirm the number of passengers?`;
      }
      
    } else if (serviceType.includes('ground') || serviceType.includes('car')) {
      response = `I'll arrange exceptional ground transportation for you`;
      if (destinations.length > 0) {
        response += ` to ${destinations[0]}`;
      }
      response += `. Would you prefer a luxury sedan, SUV, or perhaps our signature limousine service?`;
      
    } else {
      // Only use generic response as last resort
      response = `I understand you're seeking luxury transportation services. `;
      response += `Whether you need private aviation, luxury ground transport, or marine services, `;
      response += `I can arrange world-class options. What type of transportation would best serve you?`;
    }
    
    return response;
  }

  /**
   * Generate events-specific responses
   */
  private generateEventsResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): string {
    const { extractedEntities, serviceType } = intentAnalysis;
    const dates = extractedEntities.dates || [];
    const people = extractedEntities.people || [];
    
    let response = `I'm excited to help you access exclusive events and experiences. `;
    
    if (serviceType.includes('dining') || serviceType.includes('restaurant')) {
      response = `I'd be happy to secure your reservation`;
      if (people.length > 0) {
        response += ` for ${people[0]}`;
      }
      if (dates.length > 0) {
        response += ` ${dates[0]}`;
      }
      response += `. `;
      
      const questions = [];
      if (dates.length === 0) questions.push('your preferred date and time');
      if (people.length === 0) questions.push('your party size');
      
      if (questions.length > 0) {
        response += `May I confirm ${questions.join(' and ')}? `;
      }
      
      response += `I have access to exclusive tables at Michelin-starred establishments and private dining experiences.`;
      
    } else {
      response += `Whether you're seeking VIP access to premieres, private venue bookings, or cultural experiences, `;
      response += `I can open doors that typically remain closed. What type of event interests you?`;
    }

    return response;
  }

  /**
   * Generate lifestyle-specific responses
   */
  private generateLifestyleResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): string {
    const { confidence, extractedEntities } = intentAnalysis;
    
    // Check if this is a greeting (high confidence for lifestyle + low specifics)
    if (confidence < 0.5 && (!extractedEntities.preferences || extractedEntities.preferences.length === 0)) {
      const hour = new Date().getHours();
      let timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      
      return `${timeGreeting}! I'm Asteria, your AI luxury concierge. I specialize in creating extraordinary experiences across private aviation, exclusive dining, luxury shopping, wellness retreats, and elite networking. How may I elevate your day?`;
    }
    
    return `I'd be delighted to curate a bespoke lifestyle experience for you. Whether you're seeking personal shopping with renowned stylists, wellness optimization, interior design consultation, or luxury concierge services, I can arrange exceptional providers. What aspect of your lifestyle would you like to enhance?`;
  }

  /**
   * Enhance response with luxury knowledge from RAG system
   */
  private enhanceResponseWithLuxuryKnowledge(
    baseResponse: string, 
    knowledgeChunks: any[], 
    serviceCategory: string
  ): string {
    if (!knowledgeChunks || knowledgeChunks.length === 0) {
      return baseResponse;
    }

    console.log(`🧠 [RAG_ENHANCE] Enhancing ${serviceCategory} response with luxury knowledge...`);
    
    // Extract key details from knowledge chunks
    const luxuryDetails = [];
    
    for (const chunk of knowledgeChunks) {
      if (chunk.content) {
        // Extract specific details based on service category
        if (serviceCategory === 'transportation') {
          // Extract aviation details
                     const aviationMatch = chunk.content.match(/(Citation|Gulfstream|Global Express)[\w\s]+\(([\d-]+)\s*passengers[^)]*\$?([\d,]+[-\d,]*)\s*\/?\s*hour\)/g);
           if (aviationMatch) {
             aviationMatch.forEach((match: string) => luxuryDetails.push(match.replace(/[\(\)]/g, '')));
           }
          
          // Extract ground transportation
          const groundMatch = chunk.content.match(/(Rolls-Royce|Bentley|Mercedes)[\w\s]*/g);
          if (groundMatch) {
            luxuryDetails.push(...groundMatch.slice(0, 2));
          }
        } else if (serviceCategory === 'lifestyle') {
          // Extract dining details
          const diningMatch = chunk.content.match(/(\d-star Michelin|private dining|wine pairings|chef consultations)/g);
          if (diningMatch) {
            luxuryDetails.push(...diningMatch.slice(0, 3));
          }
          
          // Extract accommodation details
          const hotelMatch = chunk.content.match(/(ultra-luxury|presidential|penthouse|butler service)/g);
          if (hotelMatch) {
            luxuryDetails.push(...hotelMatch.slice(0, 2));
          }
        }
      }
    }
    
    // Integrate luxury details into response
    if (luxuryDetails.length > 0) {
      const details = luxuryDetails.slice(0, 3).join(', ');
      
      // Find the best insertion point in the response
      if (baseResponse.includes('I can arrange') || baseResponse.includes('I\'ll arrange')) {
        baseResponse = baseResponse.replace(
          /(I(?:'ll|can)\s+arrange[\w\s]*)/i,
          `$1, featuring ${details},`
        );
      } else if (baseResponse.includes('options')) {
        baseResponse = baseResponse.replace(
          /(options)/i,
          `options featuring ${details}`
        );
      } else {
        // Add at the end if no good insertion point
        const insertPoint = baseResponse.lastIndexOf('.');
        if (insertPoint > -1) {
          baseResponse = baseResponse.substring(0, insertPoint) + 
                        `, featuring ${details}` + 
                        baseResponse.substring(insertPoint);
        }
      }
      
      console.log(`🧠 [RAG_ENHANCE] Enhanced response with: ${details}`);
    }
    
    return baseResponse;
  }

  /**
   * Generate brand development responses
   */
  private generateBrandDevResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): string {
    return `I understand you're looking to elevate your personal or professional brand. Our network includes top-tier PR specialists, media strategists, and digital presence experts who work with C-level executives and thought leaders. Are you focusing on media relations, digital transformation, or thought leadership positioning?`;
  }

  /**
   * Generate investments responses
   */
  private generateInvestmentsResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): string {
    return `I can connect you with our exclusive network of wealth managers, alternative investment specialists, and financial strategists. Whether you're interested in private equity, hedge funds, real estate opportunities, or portfolio optimization, I have access to institutional-grade advisors. What type of investment strategy aligns with your objectives?`;
  }

  /**
   * Generate TAG Glades responses
   */
  private generateTagladesResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): string {
    return `I'm pleased you're interested in our exclusive TAG network. Our Founders Circle provides access to elite networking, innovation labs, executive mentorship, and legacy impact programs. Are you seeking strategic connections, board opportunities, or perhaps interested in our innovation ecosystem?`;
  }

  /**
   * Generate general fallback responses
   */
  private generateGeneralResponse(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    goalValidation: GoalValidation
  ): string {
    return `I'm here to assist you with any luxury service or exclusive experience you have in mind. My capabilities span private transportation, exclusive events, lifestyle curation, professional development, and elite networking. Please share more details about what you're looking to accomplish, and I'll provide tailored recommendations.`;
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