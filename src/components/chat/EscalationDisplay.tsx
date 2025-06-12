// ===============================
// WEEK 3 DAY 16: ESCALATION TRANSPARENCY COMPONENT  
// Member-facing escalation communication with clear explanations
// ===============================

'use client';

import React from 'react';

interface EscalationDisplayProps {
  escalation: {
    active: boolean;
    explanation?: string;
    expectedResponse?: string;
    slaEstimate?: number; // in minutes
    trigger?: 'tool_failure' | 'complexity_threshold' | 'member_preference';
  };
  className?: string;
}

export function EscalationDisplay({ escalation, className = '' }: EscalationDisplayProps) {
  if (!escalation.active) return null;

  const getTriggerIcon = (trigger?: string) => {
    switch (trigger) {
      case 'tool_failure':
        return '🔧';
      case 'complexity_threshold':
        return '🧠';
      case 'member_preference':
        return '💎';
      default:
        return '👥';
    }
  };

  const getTriggerColor = (trigger?: string) => {
    switch (trigger) {
      case 'tool_failure':
        return 'border-orange-400/30 bg-orange-500/20';
      case 'complexity_threshold':
        return 'border-blue-400/30 bg-blue-500/20';
      case 'member_preference':
        return 'border-purple-400/30 bg-purple-500/20';
      default:
        return 'border-teal-400/30 bg-teal-500/20';
    }
  };

  const getTriggerText = (trigger?: string) => {
    switch (trigger) {
      case 'tool_failure':
        return 'Technical Support Required';
      case 'complexity_threshold':
        return 'Complex Request Detected';
      case 'member_preference':
        return 'Premium Service Activated';
      default:
        return 'Human Specialist Assigned';
    }
  };

  const formatSLATime = (minutes?: number) => {
    if (!minutes) return 'shortly';
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  };

  return (
    <div className={`rounded-lg border backdrop-blur-sm p-4 ${getTriggerColor(escalation.trigger)} ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 text-2xl">
          {getTriggerIcon(escalation.trigger)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">
              {getTriggerText(escalation.trigger)}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/80">
              Active
            </span>
          </div>
          
          {escalation.slaEstimate && (
            <div className="text-sm text-white/80">
              Expected response in {formatSLATime(escalation.slaEstimate)}
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      {escalation.explanation && (
        <div className="mb-3">
          <div className="text-sm text-white/90 leading-relaxed">
            {escalation.explanation}
          </div>
        </div>
      )}

      {/* Expected Response */}
      {escalation.expectedResponse && (
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xs font-medium text-white/70 mb-1">
            What happens next:
          </div>
          <div className="text-sm text-white/90">
            {escalation.expectedResponse}
          </div>
        </div>
      )}

      {/* SLA Progress Indicator */}
      {escalation.slaEstimate && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>Your request is being prioritized with our concierge team</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ===============================
// REAL-TIME STATUS INDICATOR
// Shows live updates during escalation process
// ===============================

interface EscalationStatusProps {
  isActive: boolean;
  timeElapsed?: number; // in minutes
  slaEstimate?: number; // in minutes
  className?: string;
}

export function EscalationStatus({ 
  isActive, 
  timeElapsed = 0, 
  slaEstimate, 
  className = '' 
}: EscalationStatusProps) {
  if (!isActive) return null;

  const progressPercentage = slaEstimate ? Math.min((timeElapsed / slaEstimate) * 100, 100) : 0;
  const isOverdue = slaEstimate ? timeElapsed > slaEstimate : false;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 ${className}`}>
      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
      
      <span className="text-sm text-teal-300">
        Escalated {timeElapsed > 0 ? `${timeElapsed}m ago` : 'now'}
      </span>
      
      {slaEstimate && (
        <div className="flex items-center gap-1">
          <div className="w-12 bg-teal-900/30 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${
                isOverdue ? 'bg-red-400' : 'bg-teal-400'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          
          <span className="text-xs text-teal-300/70">
            {isOverdue ? 'Processing' : `${Math.max(0, slaEstimate - timeElapsed)}m`}
          </span>
        </div>
      )}
    </div>
  );
} 