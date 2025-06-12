// ===============================
// PHASE 5.4: AGENT-WORKFLOW INTEGRATION
// Bridge between Agent System and Workflow Engine
// ===============================

// Removed circular import - define AgentResult interface locally
import { IntentAnalysis } from '../core/planner';
import { WorkflowState, WorkflowTemplate, WorkflowStep } from '@/lib/workflow/types';
import { WorkflowEngine } from '@/lib/workflow/engine';
import { WorkflowStateManager } from '@/lib/workflow/state-admin';
import { MemberProfile } from '../types';

// Local interface to avoid circular dependency
interface AgentResult {
  success: boolean;
  response: string;
  intentAnalysis: IntentAnalysis;
  executionResult: any;
  goalValidation: any;
  runLog: any;
  recommendations: string[];
  nextSteps: string[];
  requiresFollowUp: boolean;
}

export interface WorkflowTrigger {
  type: 'payment' | 'booking' | 'travel' | 'approval' | 'complex_service';
  priority: 'low' | 'medium' | 'high' | 'critical';
  config: Record<string, any>;
  memberRequirements: {
    minimumTier: 'standard' | 'premium' | 'elite';
    requiresApproval: boolean;
    estimatedValue?: number;
  };
  serviceDetails: {
    category: string;
    subcategory: string;
    extractedEntities: Record<string, any>;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
  };
}

export interface ChatUpdate {
  sessionId: string;
  workflowId: string;
  type: 'workflow_started' | 'step_completed' | 'workflow_completed' | 'approval_required' | 'error';
  message: string;
  data: Record<string, any>;
  timestamp: Date;
}

/**
 * AGENT-WORKFLOW BRIDGE
 * Analyzes agent results and triggers appropriate workflows
 * Handles the transition from agent decision-making to workflow execution
 */
export class AgentWorkflowBridge {
  private workflowEngine: WorkflowEngine;
  private stateManager: WorkflowStateManager;

  constructor() {
    this.workflowEngine = new WorkflowEngine();
    this.stateManager = new WorkflowStateManager();
  }

  /**
   * Analyze agent result and determine if workflow needed
   */
  async analyzeForWorkflow(
    agentResult: AgentResult, 
    memberProfile: MemberProfile,
    originalMessage: string
  ): Promise<WorkflowTrigger | null> {
    const { intentAnalysis, executionResult, goalValidation } = agentResult;

    console.log(`[WORKFLOW_BRIDGE] Analyzing agent result for workflow triggers`);
    console.log(`[WORKFLOW_BRIDGE] Intent: ${intentAnalysis.primaryBucket}, Confidence: ${intentAnalysis.confidence}`);

    // Check if workflow is needed based on intent analysis
    const trigger = await this.determineWorkflowTrigger(intentAnalysis, memberProfile, originalMessage);
    
    if (!trigger) {
      console.log(`[WORKFLOW_BRIDGE] No workflow trigger detected`);
      return null;
    }

    // Validate member tier requirements
    if (!this.validateMemberTierAccess(memberProfile.tier, trigger.memberRequirements.minimumTier)) {
      console.log(`[WORKFLOW_BRIDGE] Member tier ${memberProfile.tier} insufficient for ${trigger.type} workflow`);
      return null;
    }

    // Check if execution result suggests workflow complexity
    if (this.requiresWorkflowComplexity(executionResult, trigger)) {
      console.log(`[WORKFLOW_BRIDGE] Workflow trigger confirmed: ${trigger.type}`);
      return trigger;
    }

    return null;
  }

  /**
   * Create workflow from agent analysis
   */
  async createWorkflowFromAgent(
    trigger: WorkflowTrigger, 
    memberProfile: MemberProfile,
    sessionId: string
  ): Promise<WorkflowState> {
    console.log(`[WORKFLOW_BRIDGE] Creating ${trigger.type} workflow for member ${memberProfile.id}`);

    // Get appropriate workflow template
    const template = await this.getWorkflowTemplate(trigger.type, memberProfile.tier);
    
    // Create workflow steps with agent context
    const steps = await this.buildWorkflowSteps(template, trigger, memberProfile);

    // Create workflow state
    const workflowState: Omit<WorkflowState, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `${trigger.type}_${Date.now()}`,
      description: `Automated ${trigger.type} workflow triggered by agent analysis`,
      memberId: memberProfile.id,
      memberTier: memberProfile.tier,
      requestId: sessionId,
      serviceCategory: trigger.serviceDetails.category,
      priority: trigger.priority as any,
      status: 'pending',
      currentStepIndex: 0,
      steps,
      approvals: [],
      results: {},
      metadata: {
        triggeredBy: 'agent_system',
        originalMessage: trigger.config.originalMessage || '',
        agentConfidence: trigger.config.agentConfidence || 0,
        extractedEntities: trigger.serviceDetails.extractedEntities || {},
        sessionId
      },
      retryCount: 0,
      maxRetries: 3,
      startedAt: new Date(),
      completedAt: null, // FIX: Explicitly set to null for new workflows
      estimatedCompletionAt: new Date(Date.now() + template.estimatedDurationMs),
      totalExecutionTimeMs: 0,
      errorHistory: []
    };

    // Save workflow to Firebase
    const workflowId = await this.stateManager.createWorkflow(workflowState);
    
    console.log(`[WORKFLOW_BRIDGE] Workflow ${workflowId} created successfully`);
    
    // Return the complete workflow state with the generated ID
    const completeWorkflow: WorkflowState = {
      ...workflowState,
      id: workflowId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return completeWorkflow;
  }

  /**
   * Get workflow template based on service type and member tier
   */
  private async getWorkflowTemplate(serviceType: string, memberTier: string): Promise<WorkflowTemplate> {
    const templates: Record<string, WorkflowTemplate> = {
      payment: {
        id: 'payment_template_v1',
        name: 'Payment Processing Workflow',
        description: 'Handle payment requests with Stripe integration',
        category: 'financial_services',
        version: '1.0',
        isActive: true,
        steps: [
          {
            name: 'validate_payment_request',
            description: 'Validate payment parameters and member limits',
            type: 'custom',
            config: { validator: 'payment_validator' },
            dependencies: [],
            retryConfig: { maxRetries: 2, retryDelay: 1000, exponentialBackoff: true }
          },
          {
            name: 'create_stripe_payment_intent',
            description: 'Create Stripe payment intent',
            type: 'payment',
            config: { service: 'stripe', action: 'create_payment_intent' },
            dependencies: ['validate_payment_request']
          },
          {
            name: 'process_payment',
            description: 'Process payment and confirm',
            type: 'payment',
            config: { service: 'stripe', action: 'confirm_payment' },
            dependencies: ['create_stripe_payment_intent']
          },
          {
            name: 'notify_payment_success',
            description: 'Send payment confirmation notifications',
            type: 'notification',
            config: { channels: ['slack', 'sms'], template: 'payment_success' },
            dependencies: ['process_payment']
          }
        ],
        defaultPriority: 'high',
        estimatedDurationMs: 30000, // 30 seconds
        requiredMemberTier: 'standard',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      booking: {
        id: 'booking_template_v1',
        name: 'Calendar Booking Workflow',
        description: 'Handle booking requests with Google Calendar integration',
        category: 'lifestyle_services',
        version: '1.0',
        isActive: true,
        steps: [
          {
            name: 'validate_booking_request',
            description: 'Validate booking parameters and availability',
            type: 'custom',
            config: { validator: 'booking_validator' },
            dependencies: []
          },
          {
            name: 'check_calendar_availability',
            description: 'Check Google Calendar availability',
            type: 'booking',
            config: { service: 'google_calendar', action: 'check_availability' },
            dependencies: ['validate_booking_request']
          },
          {
            name: 'create_calendar_event',
            description: 'Create calendar event',
            type: 'booking',
            config: { service: 'google_calendar', action: 'create_event' },
            dependencies: ['check_calendar_availability']
          },
          {
            name: 'send_booking_confirmation',
            description: 'Send booking confirmation',
            type: 'notification',
            config: { channels: ['slack', 'sms'], template: 'booking_confirmed' },
            dependencies: ['create_calendar_event']
          }
        ],
        defaultPriority: 'medium',
        estimatedDurationMs: 45000, // 45 seconds
        requiredMemberTier: 'standard',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      travel: {
        id: 'travel_template_v1',
        name: 'Travel Search & Booking Workflow',
        description: 'Handle travel requests with Amadeus API integration',
        category: 'transportation',
        version: '1.0',
        isActive: true,
        steps: [
          {
            name: 'validate_travel_request',
            description: 'Validate travel parameters',
            type: 'custom',
            config: { validator: 'travel_validator' },
            dependencies: []
          },
          {
            name: 'search_flights',
            description: 'Search flights via Amadeus API',
            type: 'api_call',
            config: { service: 'amadeus', action: 'flight_search' },
            dependencies: ['validate_travel_request']
          },
          {
            name: 'search_hotels',
            description: 'Search hotels via Amadeus API',
            type: 'api_call',
            config: { service: 'amadeus', action: 'hotel_search' },
            dependencies: ['validate_travel_request']
          },
          {
            name: 'present_travel_options',
            description: 'Present curated travel options to member',
            type: 'approval',
            config: { 
              title: 'Travel Options Available',
              description: 'Please review and approve your travel selections',
              timeout: 86400000 // 24 hours
            },
            dependencies: ['search_flights', 'search_hotels']
          },
          {
            name: 'coordinate_booking',
            description: 'Coordinate travel booking with concierge',
            type: 'notification',
            config: { channels: ['slack'], template: 'travel_coordination', urgency: 'high' },
            dependencies: ['present_travel_options']
          }
        ],
        defaultPriority: 'high',
        estimatedDurationMs: 300000, // 5 minutes
        requiredMemberTier: 'premium',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    return templates[serviceType] || templates.booking; // Default to booking template
  }

  /**
   * Determine workflow trigger from intent analysis
   */
  private async determineWorkflowTrigger(
    intentAnalysis: IntentAnalysis,
    memberProfile: MemberProfile,
    originalMessage: string
  ): Promise<WorkflowTrigger | null> {
    const { primaryBucket, extractedEntities, urgency, confidence, serviceType } = intentAnalysis;

    console.log(`🔍 [WORKFLOW_BRIDGE] Phase 6.3: Analyzing workflow triggers for ${primaryBucket} (confidence: ${confidence})`);
    console.log(`🔍 [WORKFLOW_BRIDGE] Service type: ${serviceType}, Urgency: ${urgency}`);
    console.log(`🔍 [WORKFLOW_BRIDGE] Extracted entities:`, extractedEntities);

    // ===============================
    // PHASE 6.3: ELEVENLABS VOICE-ENABLED WORKFLOWS
    // ===============================
    if (primaryBucket === 'events' && confidence > 0.3) {
      console.log('🎤 [WORKFLOW_BRIDGE] ElevenLabs voice-enabled event workflow triggered');
      return {
        type: 'booking',
        priority: 'high',
        config: {
          voiceConfirmation: true, // Enable ElevenLabs voice confirmations
          voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - Professional female voice
          originalMessage,
          agentConfidence: confidence,
          bookingDetails: extractedEntities.dates || {}
        },
        memberRequirements: {
          minimumTier: 'standard',
          requiresApproval: false
        },
        serviceDetails: {
          category: 'events',
          subcategory: serviceType,
          extractedEntities,
          urgency: urgency === 'standard' ? 'low' : urgency === 'urgent' ? 'high' : urgency as 'emergency'
        }
      };
    }

    // ===============================
    // PHASE 6.3: AMADEUS TRAVEL WORKFLOWS
    // ===============================
    if (primaryBucket === 'transportation' && confidence > 0.3) {
      const hasFlightEntities = this.detectTravelTriggers(extractedEntities, 'transportation', serviceType);
      
      if (hasFlightEntities) {
        console.log('✈️ [WORKFLOW_BRIDGE] Amadeus travel workflow triggered');
        return {
          type: 'travel',
          priority: 'high',
          config: {
            useAmadeusAPI: true, // Enable Amadeus flight/hotel search
            searchType: 'flight',
            voiceConfirmation: true, // Also enable voice for travel bookings
            originalMessage,
            agentConfidence: confidence,
            travelDetails: extractedEntities.locations || {}
          },
                  memberRequirements: {
          minimumTier: 'standard',
          requiresApproval: urgency === 'emergency'
        },
          serviceDetails: {
            category: 'transportation',
            subcategory: 'aviation',
            extractedEntities,
            urgency: urgency === 'standard' ? 'low' : urgency === 'urgent' ? 'high' : urgency as 'emergency'
          }
        };
      }
    }

    // Payment workflow triggers
    if (this.detectPaymentTriggers(extractedEntities, primaryBucket, serviceType)) {
      return {
        type: 'payment',
        priority: urgency === 'emergency' ? 'critical' : urgency === 'urgent' ? 'high' : 'medium',
        config: {
          originalMessage,
          agentConfidence: confidence,
          paymentDetails: extractedEntities.budgetHints || []
        },
        memberRequirements: {
          minimumTier: 'standard',
          requiresApproval: false, // Will be determined by workflow logic
          estimatedValue: undefined
        },
        serviceDetails: {
          category: primaryBucket,
          subcategory: serviceType,
          extractedEntities,
          urgency: urgency === 'standard' ? 'low' : urgency === 'urgent' ? 'high' : urgency as 'emergency'
        }
      };
    }

    // Booking workflow triggers
    if (this.detectBookingTriggers(extractedEntities, primaryBucket, serviceType)) {
      return {
        type: 'booking',
        priority: urgency === 'emergency' ? 'critical' : 'medium',
        config: {
          originalMessage,
          agentConfidence: confidence,
          bookingDetails: extractedEntities.dates || {}
        },
        memberRequirements: {
          minimumTier: 'standard',
          requiresApproval: false
        },
        serviceDetails: {
          category: primaryBucket,
          subcategory: serviceType,
          extractedEntities,
          urgency: urgency === 'standard' ? 'low' : urgency === 'urgent' ? 'high' : urgency as 'emergency'
        }
      };
    }

    // Travel workflow triggers
    if (this.detectTravelTriggers(extractedEntities, primaryBucket, serviceType)) {
      return {
        type: 'travel',
        priority: 'high',
        config: {
          originalMessage,
          agentConfidence: confidence,
          travelDetails: extractedEntities.locations || {}
        },
        memberRequirements: {
          minimumTier: 'standard',
          requiresApproval: urgency === 'emergency'
        },
        serviceDetails: {
          category: primaryBucket,
          subcategory: serviceType,
          extractedEntities,
          urgency: urgency === 'standard' ? 'low' : urgency === 'urgent' ? 'high' : urgency as 'emergency'
        }
      };
    }

    return null;
  }

  /**
   * Build workflow steps with agent context - FIX UNDEFINED FIELDS
   */
  private async buildWorkflowSteps(
    template: WorkflowTemplate,
    trigger: WorkflowTrigger,
    memberProfile: MemberProfile
  ): Promise<WorkflowStep[]> {
    return template.steps.map((stepTemplate, index) => ({
      id: `step_${Date.now()}_${index}`,
      name: stepTemplate.name,
      description: stepTemplate.description,
      type: stepTemplate.type,
      status: 'pending',
      config: {
        ...stepTemplate.config,
        // Inject member context
        memberId: memberProfile.id,
        memberTier: memberProfile.tier,
        // Inject trigger context
        triggerType: trigger.type,
        extractedEntities: trigger.serviceDetails.extractedEntities,
        originalMessage: trigger.config.originalMessage
      },
      dependencies: stepTemplate.dependencies || [],
      // FIX: Convert undefined to null for Firebase compatibility
      retryConfig: stepTemplate.retryConfig || null,
      timeoutMs: stepTemplate.timeoutMs || 30000
    }));
  }

  /**
   * Detection methods for different workflow types
   */
  private detectPaymentTriggers(entities: any, bucket: string, serviceType: string): boolean {
    return (
      entities.payment ||
      entities.cost ||
      entities.price ||
      bucket === 'financial_services' ||
      serviceType.includes('payment') ||
      serviceType.includes('billing') ||
      serviceType.includes('invoice')
    );
  }

  private detectBookingTriggers(entities: any, bucket: string, serviceType: string): boolean {
    return (
      entities.dates ||
      entities.time ||
      entities.calendar ||
      serviceType.includes('booking') ||
      serviceType.includes('appointment') ||
      serviceType.includes('reservation') ||
      serviceType.includes('schedule')
    );
  }

  private detectTravelTriggers(entities: any, bucket: string, serviceType: string): boolean {
    // ===============================
    // PHASE 6.3: ENHANCED AMADEUS TRAVEL DETECTION
    // ===============================
    const hasAmadeusKeywords = (
      entities.locations ||
      entities.destinations ||
      entities.airports ||
      entities.cities ||
      bucket === 'transportation' ||
      serviceType.includes('flight') ||
      serviceType.includes('hotel') ||
      serviceType.includes('travel') ||
      serviceType.includes('trip') ||
      serviceType.includes('jet') ||
      serviceType.includes('aviation') ||
      serviceType.includes('airline')
    );

    if (hasAmadeusKeywords) {
      console.log('✈️ [WORKFLOW_BRIDGE] Amadeus travel triggers detected:', {
        hasLocations: !!entities.locations,
        hasDestinations: !!entities.destinations,
        bucket,
        serviceType,
        isTransportation: bucket === 'transportation'
      });
    }

    return hasAmadeusKeywords;
  }

  /**
   * Utility methods
   */
  private validateMemberTierAccess(memberTier: string, requiredTier: string): boolean {
    // ASTERIA tier hierarchy mapping (primary system)
    const asteriaTierLevels = { 
      'all-members': 1, 
      'corporate': 2, 
      'fifty-k': 3, 
      'founding10': 4 
    };
    
    // Legacy tier support for backward compatibility
    const legacyTierLevels = { 
      standard: 1, 
      premium: 2, 
      elite: 3 
    };
    
    const memberLevel = asteriaTierLevels[memberTier as keyof typeof asteriaTierLevels] || legacyTierLevels[memberTier as keyof typeof legacyTierLevels] || 0;
    const requiredLevel = legacyTierLevels[requiredTier as keyof typeof legacyTierLevels] || asteriaTierLevels[requiredTier as keyof typeof asteriaTierLevels] || 999;
    
    console.log(`🔧 [TIER_VALIDATION] Member: ${memberTier} (level: ${memberLevel}) vs Required: ${requiredTier} (level: ${requiredLevel}) → ${memberLevel >= requiredLevel ? 'ALLOWED' : 'BLOCKED'}`);
    
    return memberLevel >= requiredLevel;
  }

  private requiresWorkflowComplexity(executionResult: any, trigger: WorkflowTrigger): boolean {
    // Always use workflow for payment, travel, and high-priority requests
    if (trigger.type === 'payment' || trigger.type === 'travel' || trigger.priority === 'critical') {
      return true;
    }

    // Use workflow if agent execution had failures or escalations
    if (executionResult.escalationNeeded || !executionResult.success) {
      return true;
    }

    // Use workflow for complex booking requests
    if (trigger.type === 'booking' && trigger.serviceDetails.extractedEntities.complexity === 'high') {
      return true;
    }

    return false;
  }

  /**
   * Handle workflow completion back to chat
   */
  async handleWorkflowCompletion(workflowId: string, results: Record<string, any>): Promise<ChatUpdate> {
    const workflow = await this.stateManager.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    return {
      sessionId: workflow.metadata.sessionId,
      workflowId,
      type: 'workflow_completed',
      message: `Your ${workflow.serviceCategory} request has been completed successfully.`,
      data: {
        results,
        completedAt: new Date(),
        totalDuration: workflow.totalExecutionTimeMs
      },
      timestamp: new Date()
    };
  }
} 