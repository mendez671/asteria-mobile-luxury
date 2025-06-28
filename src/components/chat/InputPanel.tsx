// ===============================
// PHASE 2.1: MODULAR INPUT PANEL
// 80 lines max - Glass morphism, voice integration
// ===============================

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowUpIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { JourneyPhase, MemberProfile } from '@/lib/agent/types';

interface VoiceInterface {
  enabled: boolean;
  isListening: boolean;
  isTranscribing: boolean;
  toggle: () => void;
  error?: string;
}

interface InputPanelProps {
  onSendMessage: (message: string) => void;
  voiceInterface: VoiceInterface;
  isLoading: boolean;
  journeyPhase?: JourneyPhase;
  memberProfile?: MemberProfile | null;
  className?: string;
}

export function InputPanel({ onSendMessage, voiceInterface, isLoading, journeyPhase, memberProfile, className = '' }: InputPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Enhanced mobile detection with screen width check
  useEffect(() => {
    const checkMobile = () => {
      const mobileWidth = window.innerWidth < 769; // xl breakpoint
      const mobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobileWidth || mobileUserAgent);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isLoading, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const placeholder = useMemo(() => 
    voiceInterface.isListening 
      ? "🎤 Listening for your voice..." 
      : voiceInterface.isTranscribing 
      ? "✨ Transcribing your message..."
      : "Describe your luxury experience...",
    [voiceInterface.isListening, voiceInterface.isTranscribing]
  );

  return (
    <div className={`backdrop-blur-md bg-white/10 border-t border-white/20 shadow-lg shadow-purple-500/5 ${isMobile ? 'px-3 py-4 mobile-safe-bottom' : 'p-6'} ${className}`}>
      {/* Voice Status Display */}
      {voiceInterface.error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {voiceInterface.error}
        </div>
      )}
      
      {voiceInterface.isListening && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-2 text-sm">
          <MicrophoneIcon className="w-4 h-4 animate-pulse" />
          <span>Listening... Speak now</span>
          <div className="flex gap-1 ml-auto">
            <div className="w-1 h-4 bg-red-400 rounded animate-pulse"></div>
            <div className="w-1 h-3 bg-red-400 rounded animate-pulse delay-100"></div>
            <div className="w-1 h-5 bg-red-400 rounded animate-pulse delay-200"></div>
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <div className={`flex ${isMobile ? 'gap-3' : 'gap-4'} items-end`}>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full backdrop-blur-sm bg-white/10 border rounded-xl text-white placeholder-blue-200/70 resize-none focus:outline-none transition-all duration-300 p-4 shadow-lg ${
              isMobile ? 'mobile-input-enhanced' : ''
            } ${
              voiceInterface.isListening 
                ? 'border-red-500/60 shadow-lg shadow-red-500/20 bg-red-500/10' 
                : voiceInterface.isTranscribing
                ? 'border-blue-400/60 shadow-lg shadow-blue-400/20 bg-blue-500/10'
                : 'border-white/20 focus:border-blue-400/50 shadow-white/5'
            }`}
            rows={isMobile ? 2 : 2}
            disabled={isLoading}
            style={{ 
              fontSize: isMobile ? '16px' : '14px', // Prevent iOS zoom on mobile
              lineHeight: isMobile ? '1.4' : '1.5' 
            }}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 backdrop-blur-sm bg-white/10 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className={`${isMobile ? 'p-4 min-w-[56px] min-h-[56px] mobile-touch-target' : 'p-4 min-w-[60px]'} bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:shadow-lg active:scale-95 rounded-xl`}
        >
          <ArrowUpIcon className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
        </button>
      </div>
    </div>
  );
} 