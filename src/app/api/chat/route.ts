import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ===============================
// PHASE 6.2: AUTONOMOUS AGENT - SINGLE SOURCE OF TRUTH
// Removed all legacy systems - Agent loop is now the only decision maker
// ===============================

import { AsteriaAgentLoop } from '@/lib/agent/core/agent_loop';
import { processWithN8N } from '@/lib/services/n8n-integration';
import { 
  AgentContext, 
  AgentResponse, 
  Message, 
  MemberProfile, 
  JourneyPhase 
} from '@/lib/agent/types';
import { 
  convertToOldAgentContext, 
  convertToNewAgentResponse 
} from '@/lib/agent/utils/compatibility';
import { 
  extractMemberFromRequest,
  createGuestProfile,
  getEnhancedMemberProfile,
  updateMemberActivity,
  logServiceInteraction
} from '@/lib/middleware/auth';

// Secret Manager integration
import { getOpenAIKey } from '@/lib/utils/secrets';
import { createServiceTicket } from '@/lib/services/tickets';

// ONLY keep notification systems - remove all decision-making legacy code
const { sendSlackNotification } = require('../../../lib/notifications/slack.js');
const { sendSMSNotification } = require('../../../lib/notifications/sms.js');

// OpenAI client will be initialized with secret from GCP
let openai: OpenAI | null = null;

// ===============================
// OPENAI CLIENT INITIALIZATION
// ===============================

async function getOpenAIClient(): Promise<OpenAI> {
  if (!openai) {
    try {
      const apiKey = await getOpenAIKey();
      openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI client initialized with secret from GCP');
    } catch (error) {
      console.error('❌ Failed to get OpenAI API key from Secret Manager:', error);
      // Fallback to environment variable if Secret Manager fails
      if (process.env.OPENAI_API_KEY) {
        console.warn('⚠️ Using fallback OpenAI API key from environment');
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      } else {
        throw new Error('No OpenAI API key available');
      }
    }
  }
  return openai;
}

// ===============================
// ENHANCED ASTERIA SYSTEM PROMPT
// ===============================

const ASTERIA_SYSTEM_PROMPT = `You are Asteria, the personal concierge for TAG's elite members. You embody sophistication, anticipation, and curated excellence.

PERSONALITY:
- Sophisticated ally, not eager servant
- Confident whisper, not loud enthusiasm  
- Anticipate needs, don't just react
- Every word serves a purpose

CONVERSATION STYLE:
- Natural, flowing responses
- No corporate jargon or process explanations
- Acknowledge context elegantly
- Offer curated suggestions, not generic options

SERVICE CATEGORIES (recognize and respond appropriately):
- Transportation & Aviation (private jets, luxury cars, yachts)
- Events & Experiences (restaurants, shows, celebrations)
- Brand Development (marketing, partnerships)
- Investment Opportunities (financial introductions)
- TAGlades Rewards (member perks and benefits)
- Lifestyle Services (personal shopping, wellness)

RESPONSE EXAMPLES:
User: "I need a private jet to Miami tomorrow at 3pm for 4 people"
You: "Excellent choice. I'll arrange your private aviation to Miami for tomorrow at 3pm, accommodating your party of 4. Your request has been prioritized and our aviation specialist will confirm options within the hour. Any preference for departure location or special requirements?"

User: "Book dinner at a Michelin restaurant tonight"
You: "Of course. I have several exceptional Michelin-starred venues that can accommodate you this evening. Your dining request is being handled with priority, and I'll have options within 30 minutes. How many guests will be joining you?"

Remember: You are curating experiences, not just processing requests. Be naturally helpful, elegantly brief, and genuinely anticipatory. Always acknowledge the luxury nature of their requests.`;

// ===============================
// UTILITY FUNCTIONS
// ===============================

function createDefaultMemberProfile(sessionId: string): MemberProfile {
  return {
    id: 'member_' + sessionId.substring(0, 8),
    name: 'Valued Member',
    tier: 'elite',
    preferences: {},
    serviceHistory: [],
    contactMethods: []
  };
}

function convertToTypedMessages(history: any[]): Message[] {
  return history.map((msg, index) => ({
    id: `msg_${index}_${Date.now()}`,
    content: msg.content,
    sender: msg.role === 'user' ? 'user' : 'asteria',
    timestamp: new Date(),
    status: 'completed'
  }));
}

function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===============================
// BOOKING CONFIRMATION HELPER FUNCTIONS
// ===============================

function determineUrgency(serviceCategory: string, memberTier: string): string {
  // High urgency for top-tier members or time-sensitive services
  if (memberTier === 'founding10' || serviceCategory === 'transportation') {
    return 'HIGH';
  }
  // Medium urgency for premium services
  if (memberTier === 'fifty-k' || ['events', 'lifestyle'].includes(serviceCategory)) {
    return 'MEDIUM';
  }
  return 'STANDARD';
}

function extractDates(message: string): string {
  // Simple date extraction - can be enhanced with proper date parsing
  const datePatterns = [
    /tomorrow/i,
    /today/i,
    /tonight/i,
    /this weekend/i,
    /next week/i,
    /\d{1,2}\/\d{1,2}/,
    /\d{1,2}-\d{1,2}/,
    /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  ];
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return 'Not specified';
}

function extractBudget(message: string): string {
  // Simple budget extraction
  const budgetPatterns = [
    /\$[\d,]+/,
    /\d+\s*k/i,
    /budget.*\$[\d,]+/i,
    /spend.*\$[\d,]+/i,
    /(budget|spend|cost).*(\d+)/i
  ];
  
  for (const pattern of budgetPatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return 'Not specified';
}

// ===============================
// MAIN API HANDLER
// ===============================

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  // ===============================
  // DIAGNOSTIC LOGGING - TRACK EVERYTHING
  // ===============================
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n🚨 DIAGNOSTIC [${requestId}] ================================`);
  console.log(`🚨 CHAT API CALLED: ${new Date().toISOString()}`);
  console.log(`🚨 Request URL: ${request.url}`);
  console.log(`🚨 Request Method: ${request.method}`);
  
  try {
    const body = await request.json();
    const { message, conversationHistory = [], sessionId } = body;

    console.log(`🚨 DIAGNOSTIC [${requestId}] Request Body:`);
    console.log(`   ├─ Message: "${message}"`);
    console.log(`   ├─ Session ID: ${sessionId || 'none'}`);
    console.log(`   ├─ History Length: ${conversationHistory.length}`);
    console.log(`   └─ Full Body Keys: ${Object.keys(body).join(', ')}`);

    if (!message) {
      console.log(`🚨 DIAGNOSTIC [${requestId}] ERROR: No message provided`);
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || generateSessionId();

    // ===============================
    // PHASE 4.5: FIREBASE AUTH INTEGRATION
    // Enhanced member profile management
    // ===============================

    // Extract member info from request
    const { memberProfile: clientMemberProfile, firebaseUid, isAuthenticated } = extractMemberFromRequest(body);
    
    // Convert conversation history to typed messages
    const typedHistory = convertToTypedMessages(conversationHistory);
    
    // Enhanced member profile handling
    let memberProfile: MemberProfile;
    
    if (isAuthenticated && firebaseUid) {
      // Get enhanced profile from Firebase for authenticated users
      const enhancedProfile = await getEnhancedMemberProfile(firebaseUid);
      memberProfile = enhancedProfile || clientMemberProfile || createGuestProfile(currentSessionId);
      
      // Update member activity
      await updateMemberActivity(firebaseUid);
      
      console.log(`🔐 Authenticated member: ${memberProfile.name} (${memberProfile.tier})`);
    } else {
      // Use client-provided profile or create guest profile
      memberProfile = clientMemberProfile || createGuestProfile(currentSessionId);
      console.log(`👤 Guest user: ${memberProfile.name}`);
    }

    // Create unified agent context
    const agentContext: AgentContext = {
      userId: memberProfile.id,
      sessionId: currentSessionId,
      conversationHistory: typedHistory,
      memberProfile: memberProfile,
      metadata: {
        requestTimestamp: new Date(),
        clientInfo: request.headers.get('user-agent') || 'unknown'
      }
    };

    // ===============================
    // N8N ORCHESTRATION EVALUATION - NEW LAYER
    // ===============================

    console.log(`🚨 DIAGNOSTIC [${requestId}] EVALUATING N8N ORCHESTRATION...`);

    let agentResponse: AgentResponse;
    let oldResult: any; // Store the full agent loop result for optimization metrics
    let useN8NResponse = false;
    
    // Try n8n orchestration for complex requests first
    try {
      const n8nResponse = await processWithN8N(agentContext, message);
      
      if (n8nResponse) {
        console.log(`✅ N8N ORCHESTRATION SUCCESS - Using n8n workflow response`);
        agentResponse = n8nResponse;
        useN8NResponse = true;
        
        // Log successful n8n orchestration
        console.log(`🎯 N8N Orchestration COMPLETE:`);
        console.log(`   ├─ Time: ${agentResponse.metadata?.processingTime || 'unknown'}ms`);
        console.log(`   ├─ Phase: ${agentResponse.journeyPhase}`);
        console.log(`   ├─ Confidence: ${agentResponse.confidence}`);
        console.log(`   ├─ Intent: ${agentResponse.intent?.category}`);
        console.log(`   ├─ Workflow ID: ${agentResponse.metadata?.workflowId}`);
        console.log(`   └─ Service Ticket: ${agentResponse.metadata?.serviceRequestId}`);
        
        // Skip standard agent processing - n8n handled it
        console.log(`🔄 N8N handled request - skipping standard agent processing`);
        
      } else {
        console.log(`✋ N8N ORCHESTRATION SKIPPED - Using standard agent processing`);
      }
      
    } catch (n8nError) {
      console.warn(`⚠️ N8N orchestration failed, falling back to standard agent:`, n8nError);
    }
    
    // ===============================
    // AUTONOMOUS AGENT EXECUTION - SINGLE SOURCE OF TRUTH (fallback)
    // ===============================
    
    if (!useN8NResponse) {
      console.log(`🚨 DIAGNOSTIC [${requestId}] STARTING AGENT PROCESSING`);
      console.log(`🤖 AUTONOMOUS AGENT: Processing "${message.substring(0, 50)}..."`);
    
    try {
      console.log(`🚨 DIAGNOSTIC [${requestId}] Initializing AsteriaAgentLoop...`);
      // Initialize agent loop
      const agentLoop = new AsteriaAgentLoop();
      console.log(`🚨 DIAGNOSTIC [${requestId}] Agent loop created successfully`);
      
      // ===============================
      // FIXED: DIRECT AGENT CONTEXT - NO CONVERSION NEEDED
      // The compatibility layer was corrupting the message!
      // ===============================
      console.log(`🚨 DIAGNOSTIC [${requestId}] Creating direct agent context...`);
      const oldContext = {
        memberId: agentContext.userId,
        memberName: agentContext.memberProfile.name,
        memberTier: agentContext.memberProfile.tier,
        originalMessage: message, // DIRECT MESSAGE - NOT FROM CONVERSION!
        conversationHistory: agentContext.conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        retryCount: 0,
        maxRetries: 3
      };
      console.log(`🚨 DIAGNOSTIC [${requestId}] Direct context created:`, {
        memberId: oldContext.memberId,
        memberName: oldContext.memberName,
        memberTier: oldContext.memberTier,
        messageLength: oldContext.originalMessage.length,
        actualMessage: oldContext.originalMessage.substring(0, 50) + '...'
      });
      
      // Execute with performance monitoring
      console.log(`🚀 Agent Loop: Starting autonomous processing...`);
      console.log(`🚨 DIAGNOSTIC [${requestId}] Calling agentLoop.processRequest()...`);
      console.log(`🔍 DIAGNOSTIC [${requestId}] Input Context:`, {
        messageLength: oldContext.originalMessage.length,
        memberTier: oldContext.memberTier,
        hasHistory: oldContext.conversationHistory.length > 0
      });
      
      oldResult = await agentLoop.processRequest(oldContext);
      
      console.log(`🚨 DIAGNOSTIC [${requestId}] Agent loop returned:`, {
        success: oldResult.success,
        responseLength: oldResult.response?.length || 0,
        intentAnalysis: oldResult.intentAnalysis?.primaryBucket || 'none',
        executionResult: oldResult.executionResult?.success || false
      });
      
      // 🎯 ENHANCED EXECUTION ANALYSIS
      console.log(`🔧 EXECUTION DIAGNOSTIC [${requestId}]:`, {
        hasExecutionResult: !!oldResult.executionResult,
        executionSuccess: oldResult.executionResult?.success,
        executedStepsCount: oldResult.executionResult?.executedSteps?.length || 0,
        completedSteps: oldResult.executionResult?.executedSteps?.filter((s: any) => s.status === 'completed').length || 0,
        escalationNeeded: oldResult.executionResult?.escalationNeeded,
        workflowTriggered: oldResult.executionResult?.workflowTriggered,
        workflowId: oldResult.executionResult?.workflowId,
        workflowType: oldResult.executionResult?.workflowType,
        hasFinalResult: !!oldResult.executionResult?.finalResult
      });
      
      // 🎯 RESPONSE TYPE ANALYSIS  
      const responseText = oldResult.response || '';
      const isGenericTemplate = responseText.includes('I understand your interest in');
      const hasTicketReference = /sr-\d+|ticket|request/i.test(responseText);
      const hasServiceCount = /found \d+|located \d+/i.test(responseText);
      
             console.log(`💬 RESPONSE ANALYSIS [${requestId}]:`, {
         isGenericTemplate,
         hasTicketReference,
         hasServiceCount,
         responseType: isGenericTemplate ? 'TEMPLATE' : 'DYNAMIC',
         likelyToolExecution: hasTicketReference || hasServiceCount
       });
       
       // 🔧 TOOL EXECUTION ANALYSIS
       if (oldResult.executionResult?.executedSteps?.length > 0) {
         console.log(`⚙️ TOOL EXECUTION [${requestId}]:`, {
           stepsExecuted: oldResult.executionResult.executedSteps.map((step: any) => ({
             tool: step.toolName,
             status: step.status,
             duration: step.executionTime,
             hasResult: !!step.result
           }))
         });
       } else {
         console.log(`❌ NO TOOLS EXECUTED [${requestId}] - This is likely why you're getting generic responses!`);
       }
      
      // Convert back to new agent response format
      agentResponse = convertToNewAgentResponse(oldResult);
      agentResponse.metadata!.processingTime = performance.now() - startTime;
      
      console.log(`🎯 Agent Loop COMPLETE:`);
      console.log(`   ├─ Time: ${agentResponse.metadata?.processingTime || 'unknown'}ms`);
      console.log(`   ├─ Phase: ${agentResponse.journeyPhase}`);
      console.log(`   ├─ Confidence: ${agentResponse.confidence}`);
      console.log(`   ├─ Intent: ${agentResponse.intent?.category}`);
      console.log(`   └─ Actions: ${agentResponse.nextActions.length}`);
      
      // ===============================
      // WORKFLOW INTEGRATION CHECK
      // ===============================
      if (oldResult.executionResult?.workflowTriggered) {
        console.log(`🔄 WORKFLOW TRIGGERED: ${oldResult.executionResult.workflowType} (${oldResult.executionResult.workflowId})`);
        
        // Enhance agent response with workflow information
        agentResponse.metadata = {
          ...agentResponse.metadata,
          workflowTriggered: true,
          workflowId: oldResult.executionResult.workflowId,
          workflowType: oldResult.executionResult.workflowType
        };
        
        // Update response message to include workflow status
        agentResponse.message = oldResult.executionResult.finalResult?.message || agentResponse.message;
      }

      // ===============================
      // BOOKING CONFIRMATION DETECTION
      // Enhanced service ticket creation for confirmed bookings
      // MOVED TO EARLY DETECTION FOR FASTER NOTIFICATIONS
      // ===============================
      
      console.log(`🔍 [API ${requestId}] Analyzing message for booking confirmation...`);
      
      // EARLY DETECTION: Check before agent processing for speed
      const hasBookingIntent = (message: string) => {
        const quickBookingKeywords = [
          'perfect', 'excellent', 'sounds good', 'that works', 'absolutely',
          'lets book', 'let\'s book', 'book it', 'go ahead', 'confirm',
          'yes thank you', 'thank you lets', 'when i arrive', 'pickup when'
        ];
        return quickBookingKeywords.some(keyword => 
          message.toLowerCase().includes(keyword)
        );
      };
      
      // Force early notification for clear booking intent - TEMPORARILY DISABLED
      if (false && hasBookingIntent(message) && conversationHistory.length > 2) {
        console.log(`🚀 [API ${requestId}] EARLY BOOKING DETECTION - TEMPORARILY DISABLED FOR STABILITY`);
      }
      
      const bookingKeywords = [
        // Strong confirmation phrases
        'lets book it', 'let\'s book it', 'book it', 'book this', 'proceed', 
        'yes book', 'confirm booking', 'go ahead', 'lets do it', 'let\'s do it',
        'please book', 'I confirm', 'yes please', 'submit request', 'make the reservation',
        'reserve it', 'book now', 'confirm this', 'yes do it', 'go for it',
        // Additional aggressive triggers
        'perfect', 'excellent', 'sounds good', 'that works', 'yes that\'s perfect',
        'absolutely', 'definitely', 'for sure', 'perfect thank you', 'yes thank you',
        'thank you lets', 'thank you let\'s', 'okay got it', 'okay lets', 'okay let\'s',
        'yup let', 'yep let', 'yes let', 'sure let', 'okay book', 'yes continue',
        // Contextual confirmations in travel/aviation
        'when i arrive', 'upon arrival', 'pickup when', 'ground transportation',
        'private jet please', 'citation latitude', 'miami tomorrow'
      ];

      const isBookingConfirmation = bookingKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );

      if (isBookingConfirmation && agentResponse.intent?.category) {
        console.log(`🎯 [API ${requestId}] Booking confirmation detected for ${agentResponse.intent.category}`);
        
        // Create service ticket with booking confirmation
        const ticketId = `SR-${Date.now().toString().slice(-6)}`;
        
        try {
          // Create enhanced service ticket for concierge follow-up
          const ticketData = {
            id: ticketId,
            member_id: memberProfile.id,
            member_name: memberProfile.name || 'VIP Member',
            member_tier: memberProfile.tier,
            service_name: agentResponse.intent.category,
            urgency: determineUrgency(agentResponse.intent.category, memberProfile.tier),
            status: 'CONFIRMED',
            details: {
              originalRequest: message,
              agentResponse: agentResponse.message,
              conversationHistory: agentContext.conversationHistory.slice(-3),
              memberConfirmation: message,
              timestamp: new Date().toISOString(),
              dates: extractDates(message),
              budget: extractBudget(message)
            },
            rawText: message,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          // Import and use enhanced concierge notification
          const slackModule = await import('@/lib/notifications/slack');
          
          // Send notification to concierge team with proper context
          await (slackModule as any).notifyConciergeDirect({
            type: 'service_request',
            ticketData: ticketData,
            memberProfile: memberProfile,
            userMessage: message,
            serviceCategory: agentResponse.intent?.category || 'luxury_services',
            intentAnalysis: {
              primaryBucket: agentResponse.intent?.category || 'lifestyle',
              extractedEntities: agentResponse.metadata?.intentAnalysis?.entities || []
            }
          });

          // Enhance agent response with confirmation
          agentResponse.message += `\n\n✅ **Your request has been confirmed and escalated to our concierge team.** You'll receive direct contact within 2 hours with personalized options and next steps.`;
          
          // Add service request metadata to response
          agentResponse.metadata = {
            ...agentResponse.metadata,
            serviceRequestId: ticketId,
            serviceRequestCreated: true,
            conciergeNotified: true
          };
          
          console.log(`✅ [API ${requestId}] Service ticket ${ticketId} created and concierge notified`);
          
        } catch (error) {
          console.log(`❌ [API ${requestId}] Failed to create service ticket: ${error}`);
        }
      }
      
    } catch (agentError) {
      console.log(`🚨 DIAGNOSTIC [${requestId}] AGENT LOOP FAILED!`);
      console.error('❌ Agent loop error, falling back to OpenAI:', agentError);
      console.error('❌ Full error stack:', agentError instanceof Error ? agentError.stack : String(agentError));
      
      console.log(`🚨 DIAGNOSTIC [${requestId}] USING FALLBACK SYSTEM - THIS IS WHY YOU'RE GETTING GENERIC RESPONSES!`);
      // Fallback to direct OpenAI processing
      agentResponse = await fallbackToOpenAI(message, conversationHistory);
      console.log(`🚨 DIAGNOSTIC [${requestId}] Fallback response:`, agentResponse.message.substring(0, 100) + '...');
    }

    // ===============================
    // SERVICE TICKET CREATION - AGENT-DRIVEN ONLY
    // ===============================
    
    let ticketId = null;
    let extractedDetails = null;
    
    const hasCreateTicketAction = agentResponse.nextActions.some(action => action.type === 'create_ticket');
    console.log(`🎫 [API ${requestId}] Ticket creation check:`, {
      agentSuccess: agentResponse.success,
      hasCreateTicketAction,
      nextActionsCount: agentResponse.nextActions.length,
      nextActionsTypes: agentResponse.nextActions.map(a => a.type)
    });
    
    if (agentResponse.success && hasCreateTicketAction) {
      try {
        console.log(`🎫 [API ${requestId}] Creating service ticket with Firebase storage...`);
        console.log(`🎫 [API ${requestId}] Parameters:`, {
          message: message.substring(0, 50) + '...',
          memberId: memberProfile.id,
          memberTier: memberProfile.tier,
          useFirebase: true
        });
        
        // Use Firebase-enabled ticket creation with member tier
        const ticket = await createServiceTicket(message, memberProfile.id, memberProfile.tier);
        console.log(`🎫 [API ${requestId}] Ticket created with Firebase storage:`, ticket?.id || 'FAILED');
        
        if (ticket?.firebase_doc_id) {
          console.log(`🔥 [API ${requestId}] Firebase document ID: ${ticket.firebase_doc_id}`);
        } else {
          console.warn(`⚠️ [API ${requestId}] No Firebase document ID in ticket response`);
        }
        
        ticketId = ticket.id;
        extractedDetails = ticket.details;
        
        // Enhanced notifications with member context
        await sendSlackNotification(ticket, message, agentResponse.message);
        await sendSMSNotification(ticket);
        
        // Log service interaction for authenticated users
        if (isAuthenticated && firebaseUid) {
          await logServiceInteraction(firebaseUid, ticket.service_bucket || 'unknown', {
            ticketId: ticket.id,
            sessionId: currentSessionId,
            message: message,
            confidence: agentResponse.confidence,
            firebaseDocId: ticket.firebase_doc_id // Include Firebase reference
          });
        }
        
        // Add enhanced ticket information to agent response metadata
        agentResponse.metadata = {
          ...agentResponse.metadata,
          serviceRequestId: ticket.id,
          serviceRequestCreated: true,
          conciergeNotified: true,
          firebaseStored: !!ticket.firebase_doc_id,
          memberTier: ticket.member_tier,
          urgencyLevel: ticket.urgency
        };
        
        console.log(`🎫 [API ${requestId}] Service ticket created: ${ticket.id} for ${memberProfile.name} (tier: ${memberProfile.tier})`);
        
      } catch (ticketCreationError) {
        console.error(`❌ [API ${requestId}] FIREBASE TICKET CREATION ERROR:`, ticketCreationError);
        console.error(`❌ [API ${requestId}] Error type:`, typeof ticketCreationError);
        console.error(`❌ [API ${requestId}] Error message:`, ticketCreationError instanceof Error ? ticketCreationError.message : String(ticketCreationError));
        console.error(`❌ [API ${requestId}] Error stack:`, ticketCreationError instanceof Error ? ticketCreationError.stack : 'No stack trace');
        
        // Continue processing even if ticket creation fails
        console.warn(`⚠️ [API ${requestId}] Continuing without ticket creation due to Firebase error`);
      }
    } else {
      console.log(`🎫 [API ${requestId}] Skipping ticket creation:`, {
        agentSuccess: agentResponse.success,
        hasCreateTicketAction: hasCreateTicketAction,
        reason: !agentResponse.success ? 'Agent failed' : !hasCreateTicketAction ? 'No create_ticket action' : 'Unknown'
      });
    }

    // ===============================
    // CLEAN AGENT-DRIVEN RESPONSE
    // ===============================

    const processingTime = performance.now() - startTime;
    
    // 🔍 PHASE 1: FINAL RESPONSE ANALYSIS BEFORE SENDING TO FRONTEND
    const finalResponseContent = agentResponse.message;
    const isTemplateResponse = finalResponseContent?.includes('I understand your interest in');
    const hasToolResults = /found \d+|created|sr-\d+|ticket|concierge|exceptional|luxury/i.test(finalResponseContent || '');

    console.log(`📤 [API ${requestId}] Final response analysis:`, {
      messageLength: finalResponseContent?.length || 0,
      isTemplate: isTemplateResponse,
      hasToolResults: hasToolResults,
      agentSuccess: agentResponse.success,
      toolsUsed: agentResponse.nextActions?.length || 0,
      confidence: agentResponse.confidence,
      processingTime: Math.round(processingTime),
      autonomous: true,
      journeyPhase: agentResponse.journeyPhase,
      workflowTriggered: agentResponse.metadata?.workflowTriggered
    });

    if (isTemplateResponse) {
      console.error(`🚨 [API ${requestId}] SENDING TEMPLATE RESPONSE TO FRONTEND!`);
      console.error(`🚨 [API ${requestId}] Content: "${finalResponseContent?.substring(0, 150)}..."`);
      console.error(`🚨 [API ${requestId}] This indicates agent tool execution failed`);
      console.error(`🚨 [API ${requestId}] Check agent loop and tool execution logs above`);
    }

    if (!hasToolResults && !isTemplateResponse) {
      console.warn(`⚠️ [API ${requestId}] No tool execution indicators in final response`);
      console.warn(`⚠️ [API ${requestId}] Response may be generic fallback or incomplete tool execution`);
    }

    console.log(`📤 [API ${requestId}] Sending to frontend - response field: "${finalResponseContent?.substring(0, 80)}..."`);
    
    // ===============================
    // BACKEND DIAGNOSTIC LOGGING
    // Technical details for backend monitoring and Slack notifications ONLY
    // ===============================
    
    console.log(`🔧 [API ${requestId}] BACKEND TECHNICAL SUMMARY:`, {
      agentSuccess: agentResponse.success,
      journeyPhase: agentResponse.journeyPhase,
      nextActions: agentResponse.nextActions?.map(a => a.type),
      intent: agentResponse.intent?.category,
      workflowId: agentResponse.metadata?.workflowId,
      workflowType: agentResponse.metadata?.workflowType,
      serviceCategory: agentResponse.intent?.category,
      urgency: agentResponse.intent?.urgency,
      extractedDetails: extractedDetails,
      toolsExecuted: agentResponse.nextActions?.length || 0,
      conciergeNotified: agentResponse.metadata?.conciergeNotified
    });
    
    // ===============================
    // CLEAN MEMBER-FACING RESPONSE
    // Only include what the luxury member should see
    // ===============================
    
    return NextResponse.json({
      success: true,
      
      // The only thing the member should see: ASTERIA's elegant response
      response: agentResponse.message,
      
      // Minimal member context (needed for frontend functionality)
      sessionId: currentSessionId,
      memberProfile: {
        id: memberProfile.id,
        tier: memberProfile.tier
      },
      
      // Clean conversation history for chat interface
      conversationHistory: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: agentResponse.message }
      ],
      
      // Essential agent metrics (minimal technical info)
      agent: {
        confidence: agentResponse.confidence,
        processingTime: Math.round(processingTime),
        autonomous: true,
        success: agentResponse.success,
        
        // ===============================
        // WEEK 2: CORE FLOW OPTIMIZATION
        // Include optimization metrics for frontend validation
        // ===============================
        executedSteps: oldResult?.executionResult?.executedSteps?.map((step: any) => ({
          toolName: step.toolName,
          status: step.status,
          executionTime: step.executionTime
        })) || [],
        
        // Response refinement metrics
        quality: oldResult?.quality || undefined,
        refined: oldResult?.refined || false,
        
        // Journey information
        journeyPhase: agentResponse.journeyPhase,
        intent: agentResponse.intent?.category,
        
        // ===============================
        // WEEK 3 DAY 15: EXECUTION TRANSPARENCY
        // Member-facing tool execution visibility
        // ===============================
        toolsExecuted: oldResult?.toolsExecuted?.filter((tool: any) => tool.memberVisible) || [],
        executionSummary: oldResult?.executionTimeline ? {
          totalDuration: oldResult.executionTimeline.totalDuration,
          phasesCompleted: oldResult.executionTimeline.phases.length,
          coordinationScore: oldResult.executionTimeline.coordinationScore
        } : undefined,
        memberExperience: oldResult?.memberExperience || {
          clarity: 0.8,
          transparency: 0.8,
          satisfaction: agentResponse.success ? 0.9 : 0.6
        }
      },
      
      // Service status (needed for UI state management)
      serviceRequestId: agentResponse.metadata?.serviceRequestId || ticketId,
      bookingConfirmed: agentResponse.metadata?.serviceRequestCreated || false,
      
      // Workflow status (if needed for UI)
      workflow: agentResponse.metadata?.workflowTriggered ? {
        triggered: true,
        message: `Your ${agentResponse.metadata.workflowType} request is being processed by our concierge team.`
      } : {
        triggered: false
      },
      
      // ===============================
      // WEEK 3 DAY 15: ESCALATION TRANSPARENCY
      // Member-facing escalation context when needed
      // ===============================
      escalation: oldResult?.escalationContext ? {
        active: true,
        explanation: oldResult.escalationContext.explanation,
        expectedResponse: oldResult.escalationContext.expectedResponse,
        slaEstimate: Math.round(oldResult.escalationContext.slaEstimate / 60000) // Convert to minutes
      } : {
        active: false
      },

      // ===============================
      // WEEK 3 DAY 17: SLA TRACKING DATA
      // Real-time SLA metrics and countdown timers
      // ===============================
      slaTracking: oldResult?.slaMetrics ? {
        active: true,
        status: oldResult.slaMetrics.status,
        confidence: oldResult.slaMetrics.confidence,
        riskLevel: oldResult.slaMetrics.riskLevel,
        timeRemaining: {
          response: Math.max(0, Math.round(oldResult.slaMetrics.timeRemaining.response / 1000)), // seconds
          escalation: Math.max(0, Math.round(oldResult.slaMetrics.timeRemaining.escalation / 1000)), // seconds
          resolution: Math.max(0, Math.round(oldResult.slaMetrics.timeRemaining.resolution / 60000)) // minutes
        },
        countdownTimers: oldResult.countdownTimers || []
      } : {
        active: false
      }
    });

  } catch (error) {
    console.error('❌ Chat API critical error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      response: "I apologize, but I'm experiencing a brief interruption. Please try again in a moment.",
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
      agent: {
        confidence: 0,
        journeyPhase: 'discovery' as JourneyPhase,
        nextActions: [],
        processingTime: 0,
        autonomous: false
      }
    }, { status: 500 });
  }
}

// ===============================
// FALLBACK FUNCTION
// ===============================

async function fallbackToOpenAI(message: string, conversationHistory: any[]): Promise<AgentResponse> {
  console.log('🔄 Using OpenAI fallback');
  
  try {
    const openaiClient = await getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: ASTERIA_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: message }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content || "I apologize, but I'm having difficulty processing your request at the moment.";

    // Create basic agent response structure
    return {
      message: response,
      intent: {
        category: 'lifestyle_services',
        urgency: 'low',
        confidence: 0.5,
        extractedDetails: {}
      },
      nextActions: [{
        type: 'collect_info',
        priority: 'low',
        data: {}
      }],
      journeyPhase: 'discovery',
      confidence: 0.7,
      success: true,
      metadata: {
        processingTime: 0,
        fallback: true
      }
    };
    
  } catch (openaiError) {
    console.error('❌ OpenAI fallback failed:', openaiError);
    
    return {
      message: "I apologize, but I'm currently experiencing technical difficulties. Please try again in a moment.",
      intent: {
        category: 'lifestyle_services',
        urgency: 'low',
        confidence: 0,
        extractedDetails: {}
      },
      nextActions: [],
      journeyPhase: 'discovery',
      confidence: 0,
      success: false,
      metadata: {
        processingTime: 0,
        fallback: true,
        error: 'Both agent and OpenAI failed'
      }
    };
  }
}

// ===============================
// OPTIONS HANDLER
// ===============================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 