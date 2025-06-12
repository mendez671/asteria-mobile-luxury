// ===============================
// PHASE 2.1: MODULAR MESSAGE LIST
// 100 lines max - Glass morphism, elegant design
// ===============================

'use client';

import React, { useRef, useEffect } from 'react';
import { Message, JourneyPhase } from '@/lib/agent/types';
import { ToolExecutionPanel } from './ToolBadge';
import { EscalationDisplay } from './EscalationDisplay';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  journeyPhase?: JourneyPhase;
  agentMetrics?: {
    responseTime?: number;
    confidence?: number;
    serviceCategory?: string;
  };
  className?: string;
}

export function MessageList({ messages, isLoading, journeyPhase, agentMetrics, className = '' }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smart scroll management
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${className}`}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {/* Elegant Loading Indicator */}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4 max-w-xs">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

// ===============================
// MESSAGE BUBBLE COMPONENT
// ===============================

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
          : 'bg-gradient-to-br from-blue-500 to-blue-600'
      }`}>
        <span className="text-white font-bold">
          {isUser ? '👤' : 'A'}
        </span>
      </div>
      
      {/* Message Content */}
      <div className={`max-w-md ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`backdrop-blur-md border rounded-2xl p-4 ${
          isUser
            ? 'bg-purple-500/20 border-purple-400/30 text-white'
            : 'bg-white/10 border-white/20 text-white'
        }`}>
          <div className="leading-relaxed">{message.content}</div>
          
          {/* ===============================
              PHASE 5.2: ENHANCED MESSAGE INDICATORS
              Service Request, Workflow, and Tool Execution Display
              =============================== */}
          
          {/* Service Request Indicator */}
          {message.serviceRequest && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-400 text-sm font-semibold">🎫 Service Request</span>
                <span className="px-2 py-1 rounded bg-emerald-500/30 text-emerald-300 text-xs font-mono">
                  {message.serviceRequest.id}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-emerald-300/70">Category:</span>
                  <span className="text-emerald-300">{message.serviceRequest.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/70">Urgency:</span>
                  <span className={`${
                    message.serviceRequest.urgency === 'HIGH' ? 'text-red-300' :
                    message.serviceRequest.urgency === 'MEDIUM' ? 'text-yellow-300' : 'text-green-300'
                  }`}>
                    {message.serviceRequest.urgency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/70">Status:</span>
                  <span className="text-emerald-300">{message.serviceRequest.status}</span>
                </div>
                {message.serviceRequest.conciergeNotified && (
                  <div className="text-xs text-emerald-300/80 mt-2">
                    ✅ Concierge team notified
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workflow Status Indicator */}
          {message.workflow?.triggered && (
            <div className="mt-4 p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 text-sm font-semibold">🔄 Workflow Active</span>
                <span className="px-2 py-1 rounded bg-blue-500/30 text-blue-300 text-xs">
                  {message.workflow.workflowType}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-300/70">Status:</span>
                  <span className="text-blue-300">{message.workflow.status}</span>
                </div>
                {message.workflow.workflowId && (
                  <div className="flex justify-between">
                    <span className="text-blue-300/70">ID:</span>
                    <span className="text-blue-300 font-mono text-xs">{message.workflow.workflowId}</span>
                  </div>
                )}
                {message.workflow.progress !== undefined && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-300/70">Progress:</span>
                      <span className="text-blue-300">{message.workflow.progress}%</span>
                    </div>
                    <div className="w-full bg-blue-900/30 rounded-full h-1.5">
                      <div 
                        className="bg-blue-400 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${message.workflow.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===============================
              WEEK 3 DAY 16: REAL-TIME TOOL EXECUTION VISIBILITY
              Enhanced tool badges with member-facing transparency
              =============================== */}
          {message.toolExecution?.activeTools && message.toolExecution.activeTools.length > 0 && !isUser && (
            <div className="mt-4">
              <ToolExecutionPanel
                tools={message.toolExecution.activeTools}
                executionSummary={message.toolExecution.executionSummary}
                memberExperience={message.toolExecution.memberExperience}
              />
            </div>
          )}

          {/* Legacy Tool Execution (fallback for backward compatibility) */}
          {message.toolExecution && !message.toolExecution.activeTools && !isUser && (
            <div className="mt-4 p-3 rounded-lg bg-violet-500/20 border border-violet-400/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-violet-400 text-sm font-semibold">⚙️ Tool Execution</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  message.toolExecution.success 
                    ? 'bg-green-500/30 text-green-300' 
                    : 'bg-red-500/30 text-red-300'
                }`}>
                  {message.toolExecution.success ? 'Success' : 'Failed'}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-violet-300/70">Tools Used:</span>
                  <span className="text-violet-300">{message.toolExecution.toolsUsed.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-300/70">Results:</span>
                  <span className="text-violet-300">{message.toolExecution.resultsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-300/70">Time:</span>
                  <span className="text-violet-300">{message.toolExecution.executionTime}ms</span>
                </div>
                {message.toolExecution.toolsUsed.length > 0 && (
                  <div className="text-xs text-violet-300/80 mt-2">
                    <div className="flex flex-wrap gap-1">
                      {message.toolExecution.toolsUsed.map((tool, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===============================
              WEEK 3 DAY 16: ESCALATION TRANSPARENCY
              Member-facing escalation context and SLA tracking
              =============================== */}
          {message.escalation?.active && !isUser && (
            <div className="mt-4">
              <EscalationDisplay escalation={message.escalation} />
            </div>
          )}

          {/* Enhanced Luxury Status Indicator (Elegant Alternative to Technical Metrics) */}
          {message.agentMetrics && !isUser && (
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    message.agentMetrics.confidence > 0.8 ? 'bg-green-400 animate-pulse' :
                    message.agentMetrics.confidence > 0.6 ? 'bg-yellow-400' :
                    'bg-orange-400'
                  }`}></div>
                  <span className="text-purple-200 text-sm font-medium">
                    Request {message.agentMetrics.confidence > 0.8 ? 'Confirmed' : 
                            message.agentMetrics.confidence > 0.6 ? 'Processing' : 'Analyzing'}
                  </span>
                </div>
                
                {message.agentMetrics.journeyPhase && (
                  <span className="text-purple-300/70 text-xs capitalize">
                    {message.agentMetrics.journeyPhase.replace('_', ' ')}
                  </span>
                )}
              </div>
              
              {/* Elegant progress bar instead of raw numbers */}
              <div className="mt-2 w-full bg-white/10 rounded-full h-1">
                <div 
                  className="h-1 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-500"
                  style={{ 
                    width: `${Math.round(message.agentMetrics.confidence * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Legacy Service Category Badge (fallback) */}
          {message.serviceCategory && !message.agentMetrics && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-400 text-xs">
                {message.serviceCategory}
              </span>
              {message.urgency && message.urgency !== 'low' && (
                <span className={`px-3 py-1 rounded-full text-xs border ${
                  message.urgency === 'high'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                }`}>
                  {message.urgency} priority
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced Timestamp with Status */}
        <div className="text-xs text-blue-200/70 mt-2 px-1 flex justify-between">
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.status && (
            <span className={`${
              message.status === 'completed' ? 'text-green-300' :
              message.status === 'in_progress' ? 'text-yellow-300' : 'text-blue-300'
            }`}>
              {message.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 