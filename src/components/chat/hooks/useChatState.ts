// ===============================
// PHASE 3.1: ENHANCED AGENT INTEGRATION
// Optimize state management for agent system with performance tracking
// ===============================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, JourneyPhase, MemberProfile } from '@/lib/agent/types';
import { useFirebaseAuth } from './useFirebaseAuth';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  journeyPhase: JourneyPhase;
  sessionId: string | null;
  memberProfile: MemberProfile | null;
  agentMetrics: {
    responseTime?: number;
    confidence?: number;
    serviceCategory?: string;
  };
  // ===============================
  // PHASE 5.2: WORKFLOW UI TRACKING
  // Active workflow and service request state
  // ===============================
  activeWorkflows: Array<{
    id: string;
    type: string;
    status: string;
    progress?: number;
  }>;
  serviceRequests: Array<{
    id: string;
    category: string;
    status: string;
    urgency: string;
  }>;
}

interface ChatActions {
  sendMessage: (content: string) => Promise<void>;
  addMessage: (content: string, sender: 'user' | 'asteria') => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  updateJourneyPhase: (phase: JourneyPhase) => void;
  confirmBooking: (messageId: string) => Promise<void>;
}

export function useChatState(): ChatState & ChatActions {
  // Firebase authentication integration
  const { user, isAuthenticated } = useFirebaseAuth();
  
  // Enhanced unified state with agent system integration
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    journeyPhase: 'discovery',
    sessionId: null,
    memberProfile: null,
    agentMetrics: {},
    activeWorkflows: [],
    serviceRequests: []
  });

  const greetingAddedRef = useRef(false);
  const retryCountRef = useRef(0);

  // Generate session ID on first load
  useEffect(() => {
    if (!state.sessionId) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setState(prev => ({ ...prev, sessionId }));
    }
  }, [state.sessionId]);

  // Update member profile when Firebase auth state changes
  useEffect(() => {
    if (user?.memberProfile) {
      setState(prev => ({ 
        ...prev, 
        memberProfile: user.memberProfile || null 
      }));
    } else if (!isAuthenticated) {
      // Clear member profile if not authenticated
      setState(prev => ({ 
        ...prev, 
        memberProfile: null 
      }));
    }
  }, [user, isAuthenticated]);

  // Enhanced message addition with status tracking
  const addMessage = useCallback((content: string, sender: 'user' | 'asteria') => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      sender,
      timestamp: new Date(),
      status: sender === 'user' ? 'completed' : 'completed'
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  // Enhanced send message with agent integration and retry logic
  const sendMessage = useCallback(async (content: string) => {
    // Add user message immediately
    addMessage(content, 'user');
    
    setState(prev => ({ ...prev, isLoading: true }));

    const startTime = performance.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-ID': state.sessionId || ''
        },
        body: JSON.stringify({ 
          message: content,
          sessionId: state.sessionId,
          conversationHistory: state.messages.map(m => ({ 
            role: m.sender === "user" ? "user" : "assistant", 
            content: m.content 
          })),
          memberProfile: state.memberProfile,
          retryCount: retryCountRef.current,
          // Include Firebase auth info for backend verification
          firebaseUid: user?.uid,
          isAuthenticated: isAuthenticated
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = performance.now() - startTime;
      
      // 🔍 PHASE 1: COMPREHENSIVE RESPONSE PROCESSING DIAGNOSTICS
      console.log(`🔍 [FRONTEND] Response received:`, {
        hasResponse: !!data.response,
        hasMessage: !!data.message,
        responseType: typeof data.response,
        messageType: typeof data.message,
        responseLength: data.response?.length || 0,
        messageLength: data.message?.length || 0,
        autonomous: data.agent?.autonomous,
        confidence: data.agent?.confidence,
        workflowTriggered: data.workflow?.triggered || data.metadata?.workflowTriggered,
        executionResult: !!data.executionResult,
        sessionId: data.sessionId,
        success: data.success
      });

      // 🔍 CONTENT ANALYSIS
      const selectedContent = data.response || data.message;
      const isTemplateResponse = selectedContent?.includes('I understand your interest in');
      const hasToolResults = /found \d+|created|sr-\d+|ticket|concierge|exceptional|luxury/i.test(selectedContent || '');

      console.log(`🔍 [FRONTEND] Content analysis:`, {
        selectedContent: selectedContent?.substring(0, 100) + '...',
        isTemplate: isTemplateResponse,
        hasToolResults: hasToolResults,
        contentSelection: data.response ? 'using data.response' : 'using data.message',
        fullDataKeys: Object.keys(data)
      });

      if (isTemplateResponse) {
        console.error(`🚨 [FRONTEND] TEMPLATE RESPONSE DETECTED!`);
        console.error(`🚨 [FRONTEND] This should be tool results, not templates`);
        console.error(`🚨 [FRONTEND] Full response data:`, data);
        console.error(`🚨 [FRONTEND] Check server logs for request processing`);
      }

      if (!hasToolResults && !isTemplateResponse) {
        console.warn(`⚠️ [FRONTEND] No tool execution indicators found in response`);
        console.warn(`⚠️ [FRONTEND] Response may be generic fallback`);
      }
      
      if (data.success) {
        // ===============================
        // PHASE 5.2: ENHANCED MESSAGE CREATION WITH WORKFLOW DATA
        // Capture comprehensive workflow and service request information
        // ===============================
        
        // Create enhanced message with workflow tracking
        const enhancedMessage: Message = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: selectedContent,
          sender: 'asteria',
          timestamp: new Date(),
          status: 'completed',
          // Workflow information from backend
          workflow: data.metadata?.workflowTriggered ? {
            triggered: true,
            workflowId: data.metadata?.workflowId,
            workflowType: data.metadata?.workflowType,
            status: 'initiated',
            progress: 0,
            serviceRequestId: data.serviceRequestId || data.ticketId
          } : undefined,
          // Service request information (SR-XXXX format)
          serviceRequest: data.serviceRequestId || data.ticketId ? {
            id: data.serviceRequestId || data.ticketId,
            category: data.agent?.serviceCategory || data.serviceCategory,
            urgency: data.urgency || 'MEDIUM',
            status: 'CREATED',
            conciergeNotified: !!data.conciergeNotified || !!data.notifications?.slack,
            memberTier: data.memberProfile?.tier || state.memberProfile?.tier || 'standard'
          } : undefined,
          // ===============================
          // WEEK 3 DAY 16: ENHANCED TOOL EXECUTION TRANSPARENCY
          // Include real-time tool execution status and member experience data
          // ===============================
          toolExecution: data.agent?.toolsExecuted || data.executionResult ? {
            // Legacy data (backward compatibility)
            toolsUsed: data.executionResult?.toolsExecuted || [],
            resultsCount: data.executionResult?.resultCount || 0,
            executionTime: data.executionResult?.executionTime || Math.round(responseTime),
            success: data.executionResult?.success !== false,
            // NEW: Real-time tool execution visibility
            activeTools: data.agent?.toolsExecuted || [],
            executionSummary: data.agent?.executionSummary,
            memberExperience: data.agent?.memberExperience
          } : undefined,
          // ===============================
          // WEEK 3 DAY 16: ESCALATION TRANSPARENCY
          // Member-facing escalation context with SLA tracking
          // ===============================
          escalation: data.escalation || undefined,
          // Agent performance metrics
          agentMetrics: {
            confidence: data.agent?.confidence || data.confidence || 0,
            processingTime: Math.round(responseTime),
            autonomous: data.agent?.autonomous || data.autonomous || false,
            intentCategory: data.agent?.serviceCategory || data.serviceCategory || 'unknown',
            journeyPhase: data.agent?.journeyPhase || data.journeyPhase || state.journeyPhase
          }
        };

        // Add enhanced message to state with workflow tracking
        setState(prev => {
          // ===============================
          // PHASE 5.2: ENHANCED STATE MANAGEMENT
          // Update workflows and service requests from message metadata
          // ===============================
          
          // Update active workflows
          const updatedWorkflows = [...prev.activeWorkflows];
          if (enhancedMessage.workflow?.triggered) {
            const existingWorkflowIndex = updatedWorkflows.findIndex(w => w.id === enhancedMessage.workflow?.workflowId);
            const workflowData = {
              id: enhancedMessage.workflow.workflowId || 'unknown',
              type: enhancedMessage.workflow.workflowType || 'unknown',
              status: enhancedMessage.workflow.status || 'initiated',
              progress: enhancedMessage.workflow.progress
            };
            
            if (existingWorkflowIndex >= 0) {
              updatedWorkflows[existingWorkflowIndex] = workflowData;
            } else {
              updatedWorkflows.push(workflowData);
            }
          }

          // Update service requests
          const updatedServiceRequests = [...prev.serviceRequests];
          if (enhancedMessage.serviceRequest) {
            const existingRequestIndex = updatedServiceRequests.findIndex(r => r.id === enhancedMessage.serviceRequest?.id);
            const requestData = {
              id: enhancedMessage.serviceRequest.id,
              category: enhancedMessage.serviceRequest.category,
              status: enhancedMessage.serviceRequest.status,
              urgency: enhancedMessage.serviceRequest.urgency
            };
            
            if (existingRequestIndex >= 0) {
              updatedServiceRequests[existingRequestIndex] = requestData;
            } else {
              updatedServiceRequests.push(requestData);
            }
          }

          return {
            ...prev,
            messages: [...prev.messages, enhancedMessage],
            journeyPhase: data.agent?.journeyPhase || data.journeyPhase || prev.journeyPhase,
            sessionId: data.sessionId || prev.sessionId,
            memberProfile: data.memberProfile || prev.memberProfile,
            agentMetrics: {
              responseTime: Math.round(responseTime),
              confidence: data.agent?.confidence || data.confidence,
              serviceCategory: data.agent?.serviceCategory || data.serviceCategory
            },
            activeWorkflows: updatedWorkflows,
            serviceRequests: updatedServiceRequests,
            isLoading: false
          };
        });

        // Log workflow information for debugging
        if (enhancedMessage.workflow?.triggered) {
          console.log(`🔄 [FRONTEND] Workflow triggered:`, enhancedMessage.workflow);
        }
        if (enhancedMessage.serviceRequest) {
          console.log(`🎫 [FRONTEND] Service request created:`, enhancedMessage.serviceRequest);
        }

        // Reset retry count on success
        retryCountRef.current = 0;
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Implement smart retry logic
      if (retryCountRef.current < 2) {
        retryCountRef.current++;
        console.log(`Retrying... (attempt ${retryCountRef.current})`);
        
        // Brief delay before retry
        setTimeout(() => {
          sendMessage(content);
        }, 1000 * retryCountRef.current);
        
        return;
      }
      
      // Final fallback after retries
      const errorMessage = retryCountRef.current >= 2 
        ? "I apologize, but I'm experiencing connection difficulties. Our team has been notified and will reach out shortly."
        : "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
        
      addMessage(errorMessage, 'asteria');
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        agentMetrics: { ...prev.agentMetrics, responseTime: performance.now() - startTime }
      }));
      
      retryCountRef.current = 0;
    }
  }, [state.sessionId, state.messages, state.memberProfile, addMessage]);

  // Clear messages with full state reset
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      journeyPhase: 'discovery',
      agentMetrics: {}
    }));
    greetingAddedRef.current = false;
    retryCountRef.current = 0;
  }, []);

  // Enhanced loading state management
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Journey phase update
  const updateJourneyPhase = useCallback((phase: JourneyPhase) => {
    setState(prev => ({ ...prev, journeyPhase: phase }));
  }, []);

  // ===============================
  // BOOKING CONFIRMATION HANDLER
  // Handles "Let's Book It" button clicks with Slack notification
  // ===============================
  const confirmBooking = useCallback(async (messageId: string) => {
    console.log(`🎯 [BOOKING] Confirming booking for message: ${messageId}`);
    
    // PHASE 1: Track booking confirmation analytics
    const { trackBookingConfirmation } = require('@/lib/services/booking-analytics');
    trackBookingConfirmation(state.sessionId || 'unknown');
    
    // Update message to show confirmation state
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(message =>
        message.id === messageId
          ? { ...message, bookingConfirmed: true, showBookingButton: false }
          : message
      )
    }));

    try {
      // Find the message and gather context for the service request
      const message = state.messages.find(m => m.id === messageId);
      const conversationContext = state.messages.slice(-5).map(m => m.content).join('\n');
      
      // Send booking confirmation to backend (triggers Slack notification)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-ID': state.sessionId || ''
        },
        body: JSON.stringify({ 
          message: `BOOKING CONFIRMED: ${message?.content || 'Service request'}`,
          sessionId: state.sessionId,
          bookingConfirmation: true,
          originalMessage: message?.content,
          conversationContext: conversationContext,
          memberProfile: state.memberProfile,
          // Firebase auth info
          firebaseUid: user?.uid,
          isAuthenticated: isAuthenticated
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to confirm booking: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [BOOKING] Confirmation processed:`, data);

      // Show confirmation message
      addMessage("✨ Booking confirmed! Your concierge team has been notified and will handle all arrangements. You'll receive updates as we coordinate your luxury experience.", 'asteria');

    } catch (error) {
      console.error('❌ [BOOKING] Error confirming booking:', error);
      
      // Revert message state on error
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(message =>
          message.id === messageId
            ? { ...message, bookingConfirmed: false, showBookingButton: true }
            : message
        )
      }));
      
      addMessage("I apologize, but there was an issue confirming your booking. Please try again or our team will reach out to you directly.", 'asteria');
    }
  }, [state.sessionId, state.messages, state.memberProfile, addMessage, user?.uid, isAuthenticated]);

  // Enhanced greeting with personalization
  if (!greetingAddedRef.current && state.messages.length === 0 && state.sessionId) {
    greetingAddedRef.current = true;
    
    setTimeout(() => {
      const hour = new Date().getHours();
      const memberName = state.memberProfile?.name || '';
      const personalGreeting = memberName ? ` ${memberName}` : '';
      
      let greeting = '';
      if (hour < 6) greeting = `Good evening${personalGreeting}! How may I assist you tonight?`;
      else if (hour < 12) greeting = `Good morning${personalGreeting}! How may I elevate your day?`;
      else if (hour < 18) greeting = `Good afternoon${personalGreeting}! What can I help you achieve today?`;
      else greeting = `Good evening${personalGreeting}! How may I assist you tonight?`;
      
      addMessage(greeting, 'asteria');
    }, 500);
  }

  return {
    ...state,
    sendMessage,
    addMessage,
    clearMessages,
    setLoading,
    updateJourneyPhase,
    confirmBooking
  };
} 