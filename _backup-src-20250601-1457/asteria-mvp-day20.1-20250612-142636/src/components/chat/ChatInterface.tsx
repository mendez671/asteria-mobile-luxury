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
    clearMessages
  } = useChatState();

  const voiceInterface = useVoiceInterface();
  
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
  // ELEGANT BLUE/PURPLE DESIGN
  // Enhanced glass morphism with agent status integration
  // ===============================

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-[#2D1B69] to-[#1E1142] ${className}`}>
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
      
      {/* Enhanced Message List with Agent Context */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        journeyPhase={journeyPhase}
        agentMetrics={agentMetrics}
      />

      {/* ===============================
          PHASE 5.2: SERVICE REQUEST PANEL
          Real-time workflow and service request tracking
          =============================== */}
      <ServiceRequestPanel
        serviceRequests={serviceRequests}
        activeWorkflows={activeWorkflows}
        className="mx-4 mb-3"
      />

      {/* Enhanced Input Panel with Agent Integration */}
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
      />
    </div>
  );
} 