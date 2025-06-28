// ===============================
// PHASE 3.2: ENHANCED AGENT HEADER
// Agent metrics, journey tracking, performance indicators
// ===============================

'use client';

import React, { useState } from 'react';
import { 
  MicrophoneIcon, 
  Bars3Icon, 
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/solid';
import { JourneyPhase, MemberProfile } from '@/lib/agent/types';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import LoginPanel from '../auth/LoginPanel';

interface ChatHeaderProps {
  journeyPhase: JourneyPhase;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  onClearChat: () => void;
  isListening?: boolean;
  isSpeaking?: boolean;
  memberProfile?: MemberProfile | null;
  agentMetrics?: {
    responseTime?: number;
    confidence?: number;
    serviceCategory?: string;
  };
  // ===============================
  // PHASE 5.2: WORKFLOW UI INTEGRATION
  // Enhanced header with workflow tracking
  // ===============================
  activeWorkflows?: Array<{
    id: string;
    type: string;
    status: string;
    progress?: number;
  }>;
  serviceRequests?: Array<{
    id: string;
    category: string;
    status: string;
    urgency: string;
  }>;
  className?: string;
}

const journeyPhaseLabels: Record<JourneyPhase, string> = {
  discovery: 'Discovering',
  information_gathering: 'Gathering Info',
  detailed_discussion: 'Discussing Details',
  confirmation: 'Confirming',
  execution: 'Executing',
  follow_up: 'Following Up',
  completed: 'Completed'
};

const journeyPhaseColors: Record<JourneyPhase, string> = {
  discovery: 'from-blue-500 to-purple-500',
  information_gathering: 'from-purple-500 to-pink-500',
  detailed_discussion: 'from-pink-500 to-rose-500',
  confirmation: 'from-rose-500 to-orange-500',
  execution: 'from-orange-500 to-yellow-500',
  follow_up: 'from-yellow-500 to-green-500',
  completed: 'from-green-500 to-emerald-500'
};

export function ChatHeader({
  journeyPhase,
  voiceEnabled,
  onVoiceToggle,
  onClearChat,
  isListening = false,
  isSpeaking = false,
  memberProfile,
  agentMetrics = {},
  activeWorkflows = [],
  serviceRequests = [],
  className = ''
}: ChatHeaderProps) {
  const { responseTime, confidence, serviceCategory } = agentMetrics;
  const { user, isAuthenticated, signOut } = useFirebaseAuth();
  const [showLogin, setShowLogin] = useState(false);
  
  return (
    <div className={`backdrop-blur-md bg-white/10 border-b border-white/20 px-3 py-3 xl:px-4 xl:py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Enhanced Avatar & Agent Status */}
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${journeyPhaseColors[journeyPhase]} flex items-center justify-center shadow-lg relative`}>
            <span className="text-white font-bold text-lg">A</span>
            {confidence && confidence > 0.8 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <BoltIcon className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
            <h2 className="font-semibold text-white text-lg">Asteria</h2>
              {serviceCategory && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {serviceCategory}
                </span>
              )}
            </div>
            
            <div className="text-blue-200 text-sm flex items-center gap-2">
              <span>{journeyPhaseLabels[journeyPhase]}</span>
              
              {confidence && (
                <div className="flex items-center gap-1">
                  <ChartBarIcon className="w-3 h-3" />
                  <span className="text-xs">{Math.round(confidence * 100)}%</span>
                </div>
              )}
              
              {responseTime && (
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  <span className="text-xs">{responseTime}ms</span>
                </div>
              )}
              
              {isListening && (
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-red-400 rounded animate-pulse"></div>
                  <div className="w-1 h-2 bg-red-400 rounded animate-pulse delay-100"></div>
                  <div className="w-1 h-4 bg-red-400 rounded animate-pulse delay-200"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Member Status & Controls */}
        <div className="flex items-center gap-3">
          {/* Authentication Status */}
          {isAuthenticated && user ? (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/30">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              <span className="text-teal-400 text-xs font-medium">
                {user.memberProfile?.tier === 'elite' ? 'Elite' : 
                 user.memberProfile?.tier === 'premium' ? 'Premium' : 
                 'Standard'} Member
              </span>
              <span className="text-teal-300 text-xs border-l border-teal-400/30 pl-2 ml-1">
                {user.memberProfile?.name?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Member'}
              </span>
              <button
                onClick={() => signOut()}
                className="ml-1 p-1 hover:bg-white/10 rounded text-teal-300 hover:text-white"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 hover:bg-purple-500/20 transition-colors"
            >
              <UserCircleIcon className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-xs font-medium">Sign In</span>
            </button>
          )}
          
          {/* Performance Indicator */}
          {responseTime && (
            <div className={`hidden xl:flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              responseTime < 1000 ? 'bg-green-500/20 text-green-300' :
              responseTime < 3000 ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              <BoltIcon className="w-3 h-3" />
              <span>{responseTime < 1000 ? 'Fast' : responseTime < 3000 ? 'Normal' : 'Slow'}</span>
          </div>
          )}
          
          {/* Voice Button with Enhanced States */}
          <button
            onClick={onVoiceToggle}
            disabled={!voiceEnabled}
            className={`p-3 rounded-full transition-all duration-200 relative ${
              isListening 
                ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse' 
                : isSpeaking
                ? 'bg-teal-500 shadow-lg shadow-teal-500/30'
                : voiceEnabled
                ? 'backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/20'
                : 'backdrop-blur-sm bg-gray-500/20 border border-gray-400/20 opacity-50 cursor-not-allowed'
            }`}
            title={
              !voiceEnabled ? 'Voice not available' :
              isListening ? 'Stop listening' : 
              isSpeaking ? 'Asteria is speaking' : 
              'Voice input'
            }
          >
            <MicrophoneIcon className="w-5 h-5 text-white" />
            {isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping"></div>
            )}
          </button>
          
          {/* Clear Chat Button */}
          <button
            onClick={onClearChat}
            className="p-3 rounded-full backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200"
            title="Clear conversation"
          >
            <Bars3Icon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Journey Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-blue-200/70 mb-1">
          <span>{journeyPhaseLabels[journeyPhase]} Your Request</span>
          {confidence && (
            <span>Confidence: {Math.round(confidence * 100)}%</span>
          )}
        </div>
        <div className="w-full bg-white/10 rounded-full h-1">
          <div 
            className={`h-1 rounded-full bg-gradient-to-r ${journeyPhaseColors[journeyPhase]} transition-all duration-500`}
            style={{ 
              width: `${
                journeyPhase === 'discovery' ? '14%' :
                journeyPhase === 'information_gathering' ? '28%' :
                journeyPhase === 'detailed_discussion' ? '42%' :
                journeyPhase === 'confirmation' ? '56%' :
                journeyPhase === 'execution' ? '70%' :
                journeyPhase === 'follow_up' ? '85%' :
                '100%'
              }` 
            }}
          />
        </div>
      </div>

      {/* ===============================
          PHASE 5.2: WORKFLOW & SERVICE REQUEST INDICATORS
          Real-time workflow and service request status
          =============================== */}
      
      {/* Active Workflows & Service Requests */}
      {(activeWorkflows.length > 0 || serviceRequests.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Active Workflows */}
          {activeWorkflows.map((workflow) => (
            <div 
              key={workflow.id}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-300 text-xs font-medium">
                🔄 {workflow.type}
              </span>
              <span className="text-blue-200/70 text-xs">
                {workflow.status}
              </span>
              {workflow.progress !== undefined && (
                <span className="text-blue-300 text-xs">
                  {workflow.progress}%
                </span>
              )}
            </div>
          ))}

          {/* Service Requests */}
          {serviceRequests.map((request) => (
            <div 
              key={request.id}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30"
            >
              <div className={`w-2 h-2 rounded-full ${
                request.urgency === 'HIGH' ? 'bg-red-400 animate-pulse' :
                request.urgency === 'MEDIUM' ? 'bg-yellow-400' : 'bg-green-400'
              }`}></div>
              <span className="text-emerald-300 text-xs font-medium">
                🎫 {request.id}
              </span>
              <span className="text-emerald-200/70 text-xs">
                {request.status}
              </span>
              <span className={`text-xs ${
                request.urgency === 'HIGH' ? 'text-red-300' :
                request.urgency === 'MEDIUM' ? 'text-yellow-300' : 'text-green-300'
              }`}>
                {request.urgency}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <LoginPanel onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}
    </div>
  );
} 