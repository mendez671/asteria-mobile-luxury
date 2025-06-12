// ===============================
// WEEK 3 DAY 16: REAL-TIME TOOL BADGE COMPONENT
// Member-facing tool execution visibility with luxury styling
// ===============================

'use client';

import React from 'react';
import { ToolExecutionStatus } from '@/lib/agent/types';

interface ToolBadgeProps {
  tool: ToolExecutionStatus;
  className?: string;
}

export function ToolBadge({ tool, className = '' }: ToolBadgeProps) {
  // Don't render non-member-visible tools
  if (!tool.memberVisible) return null;

  const getStatusIcon = (status: ToolExecutionStatus['status']) => {
    switch (status) {
      case 'queued':
        return '⏳';
      case 'executing':
        return '⚡';
      case 'completed':
        return '✅';
      case 'failed':
        return '⚠️';
      default:
        return '🔍';
    }
  };

  const getStatusColor = (status: ToolExecutionStatus['status']) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300';
      case 'executing':
        return 'bg-blue-500/20 border-blue-400/30 text-blue-300';
      case 'completed':
        return 'bg-green-500/20 border-green-400/30 text-green-300';
      case 'failed':
        return 'bg-red-500/20 border-red-400/30 text-red-300';
      default:
        return 'bg-purple-500/20 border-purple-400/30 text-purple-300';
    }
  };

  const getStatusText = (status: ToolExecutionStatus['status']) => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'executing':
        return 'Processing';
      case 'completed':
        return 'Complete';
      case 'failed':
        return 'Retrying';
      default:
        return 'Processing';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm transition-all duration-300 ${getStatusColor(tool.status)} ${className}`}>
      <span className="text-lg">{getStatusIcon(tool.status)}</span>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{tool.displayName}</span>
          <span className="text-xs opacity-70">{getStatusText(tool.status)}</span>
        </div>
        
        <div className="text-xs opacity-80 mt-0.5 truncate">
          {tool.description}
        </div>

        {/* Progress bar for executing tools */}
        {tool.status === 'executing' && tool.progress !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-70">Progress</span>
              <span className="opacity-70">{tool.progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div 
                className="bg-current h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${tool.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Duration for completed tools */}
        {tool.status === 'completed' && tool.duration && (
          <div className="text-xs opacity-60 mt-1">
            Completed in {tool.duration < 1000 ? `${Math.round(tool.duration)}ms` : `${(tool.duration / 1000).toFixed(1)}s`}
          </div>
        )}

        {/* Error message for failed tools */}
        {tool.status === 'failed' && tool.error && (
          <div className="text-xs opacity-80 mt-1 text-red-300">
            Processing through alternative methods...
          </div>
        )}
      </div>

      {/* Pulsing animation for active tools */}
      {tool.status === 'executing' && (
        <div className="absolute inset-0 rounded-lg bg-current opacity-10 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
}

// ===============================
// TOOL EXECUTION PANEL COMPONENT
// Container for multiple tool badges with coordination info
// ===============================

interface ToolExecutionPanelProps {
  tools: ToolExecutionStatus[];
  executionSummary?: {
    totalDuration: number;
    phasesCompleted: number;
    coordinationScore: number;
  };
  memberExperience?: {
    clarity: number;
    transparency: number;
    satisfaction: number;
  };
  className?: string;
}

export function ToolExecutionPanel({ 
  tools, 
  executionSummary, 
  memberExperience,
  className = '' 
}: ToolExecutionPanelProps) {
  const memberVisibleTools = tools.filter(tool => tool.memberVisible);
  
  if (memberVisibleTools.length === 0) return null;

  const activeTools = memberVisibleTools.filter(tool => tool.status === 'executing');
  const completedTools = memberVisibleTools.filter(tool => tool.status === 'completed');
  const hasActiveExecution = activeTools.length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-purple-300">
            {hasActiveExecution ? '⚡ Processing Your Request' : '✨ Request Analysis Complete'}
          </span>
          {executionSummary && (
            <span className="text-xs text-purple-300/60">
              {executionSummary.phasesCompleted} phase{executionSummary.phasesCompleted !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {memberExperience && (
          <div className="text-xs text-purple-300/70">
            Transparency: {Math.round(memberExperience.transparency * 100)}%
          </div>
        )}
      </div>

      {/* Tool badges */}
      <div className="space-y-2">
        {memberVisibleTools.map((tool, index) => (
          <ToolBadge 
            key={`${tool.toolName}-${tool.startTime}-${index}`} 
            tool={tool}
            className="w-full"
          />
        ))}
      </div>

      {/* Execution summary for completed processes */}
      {!hasActiveExecution && executionSummary && completedTools.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-400/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-300/80">Processing completed</span>
            <span className="text-purple-300">
              {executionSummary.totalDuration < 1000 
                ? `${Math.round(executionSummary.totalDuration)}ms`
                : `${(executionSummary.totalDuration / 1000).toFixed(1)}s`
              }
            </span>
          </div>
          
          {memberExperience && (
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-purple-300/70">
                Clarity: {Math.round(memberExperience.clarity * 100)}%
              </span>
              <span className="text-purple-300/70">
                Satisfaction: {Math.round(memberExperience.satisfaction * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 