// ===============================
// PHASE 3.3: ENHANCED CHATINTERFACE INTEGRATION
// Agent system integration with performance monitoring
// ===============================

'use client';

import React, { useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { InputPanel } from './InputPanel';
import { ServiceRequestPanel } from './ServiceRequestPanel';
import { useChatState } from './hooks/useChatState';
import { useVoiceInterface } from './hooks/useVoiceInterface';
import { useMobileKeyboard } from './hooks/useMobileKeyboard';


interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className = '' }: ChatInterfaceProps) {
  // ===============================
  // ENHANCED STATE MANAGEMENT
  // Integrated with agent system metrics
  // ===============================
  
  const {
    messages,
    isLoading,
    journeyPhase,
    memberProfile,
    agentMetrics,
    activeWorkflows,
    serviceRequests,
    sendMessage,
    clearMessages,
    confirmBooking
  } = useChatState();

  const voiceInterface = useVoiceInterface();
  const { isKeyboardVisible } = useMobileKeyboard();
  
  // ===============================
  // VOICE INPUT INTEGRATION
  // Enhanced event-driven approach with error handling
  // ===============================

  useEffect(() => {
    const handleVoiceInput = (event: CustomEvent) => {
      const transcript = event.detail.transcript;
      if (transcript?.trim()) {
        sendMessage(transcript.trim());
      }
    };

    const handleVoiceError = (event: CustomEvent) => {
      console.warn('Voice input error:', event.detail.error);
    };

    window.addEventListener('voiceInput', handleVoiceInput as EventListener);
    window.addEventListener('voiceError', handleVoiceError as EventListener);
    
    return () => {
      window.removeEventListener('voiceInput', handleVoiceInput as EventListener);
      window.removeEventListener('voiceError', handleVoiceError as EventListener);
    };
  }, [sendMessage]);

  // ===============================
  // TTS INTEGRATION
  // Smart response speaking with agent awareness
  // ===============================

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'asteria' && voiceInterface.enabled) {
        // Only auto-speak if confidence is high and it's not a long response
        if (agentMetrics.confidence && agentMetrics.confidence > 0.7 && 
            lastMessage.content.length < 200) {
          // Optional: Auto-speak high-confidence short responses
        // voiceInterface.speak(lastMessage.content);
    }
    }
    }
  }, [messages, voiceInterface, agentMetrics]);

  // ===============================
  // PERFORMANCE MONITORING
  // Log agent performance metrics for optimization
  // ===============================

  useEffect(() => {
    if (agentMetrics.responseTime) {
      // Log performance for analytics (non-blocking)
      console.log(`[AGENT_PERFORMANCE] Response: ${agentMetrics.responseTime}ms, Confidence: ${(agentMetrics.confidence || 0) * 100}%, Phase: ${journeyPhase}`);
      
      // Optional: Send metrics to monitoring service
      if (agentMetrics.responseTime > 5000) {
        console.warn('[AGENT_PERFORMANCE] Slow response detected:', agentMetrics);
      }
    }
  }, [agentMetrics, journeyPhase]);

  // ===============================
  // LUXURY BLUE/PURPLE DESIGN WITH GLASS MORPHISM
  // Enhanced glass morphism with agent status integration
  // ===============================

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-[#2D1B69] to-[#1E1142] ${isKeyboardVisible ? 'mobile-keyboard-visible' : ''} ${className}`}>

      
      {/* LUXURY ENHANCEMENT: Glass morphism container with elegant borders */}
      <div className="glass rounded-t-2xl border-b border-white/10 relative">
        {/* Enhanced Header with Agent Metrics */}
        <ChatHeader
          journeyPhase={journeyPhase}
          voiceEnabled={voiceInterface.enabled}
          onVoiceToggle={voiceInterface.toggle}
          onClearChat={clearMessages}
          isListening={voiceInterface.isListening}
          isSpeaking={voiceInterface.isSpeaking}
          memberProfile={memberProfile}
          agentMetrics={agentMetrics}
          activeWorkflows={activeWorkflows}
          serviceRequests={serviceRequests}
        />
      </div>
      
      {/* LUXURY ENHANCEMENT: Message List with sophisticated glass background */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          journeyPhase={journeyPhase}
          agentMetrics={agentMetrics}
          onBookingConfirmation={confirmBooking}
          className="h-full interactive-luxury"
        />
      </div>

      {/* ===============================
          PHASE 5.2: SERVICE REQUEST PANEL
          Real-time workflow and service request tracking with glass styling
          =============================== */}
      <ServiceRequestPanel
        serviceRequests={serviceRequests}
        activeWorkflows={activeWorkflows}
        className="mx-3 mb-3 xl:mx-4 xl:mb-3 glass rounded-xl"
      />

      {/* LUXURY ENHANCEMENT: Glass morphism input container */}
      <div className="glass rounded-b-2xl border-t border-white/10 backdrop-blur-md">
        <InputPanel
          onSendMessage={sendMessage}
          voiceInterface={{
            enabled: voiceInterface.enabled,
            isListening: voiceInterface.isListening,
            isTranscribing: voiceInterface.isTranscribing,
            toggle: voiceInterface.toggle,
            error: voiceInterface.error
          }}
          isLoading={isLoading}
          journeyPhase={journeyPhase}
          memberProfile={memberProfile}
          className="interactive-luxury"
        />
      </div>
    </div>
  );
} 