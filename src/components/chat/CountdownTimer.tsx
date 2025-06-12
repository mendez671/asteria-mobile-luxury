// ===============================
// WEEK 3 DAY 17: COUNTDOWN TIMER COMPONENT
// Real-time SLA countdown with visual progress indicators
// ===============================

'use client';

import React, { useState, useEffect } from 'react';
import { CountdownTimer, SLAMetrics } from '@/lib/agent/core/sla-tracker';

interface CountdownTimerProps {
  timers: CountdownTimer[];
  slaMetrics?: SLAMetrics;
  className?: string;
}

interface CountdownDisplayProps {
  timer: CountdownTimer;
  isActive: boolean;
}

function CountdownDisplay({ timer, isActive }: CountdownDisplayProps) {
  const getStatusColor = (status: CountdownTimer['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      case 'expired':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getProgressBarColor = (status: CountdownTimer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      case 'expired':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'response':
        return '⚡ Response';
      case 'escalation':
        return '🚨 Escalation';
      case 'resolution':
        return '✅ Resolution';
      default:
        return '⏱️ Target';
    }
  };

  const shouldPulse = timer.status === 'critical' || timer.status === 'warning';

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg bg-violet-500/10 border border-violet-400/20 ${
      isActive ? 'ring-2 ring-violet-400/30' : ''
    }`}>
      {/* Target Label */}
      <div className="flex items-center gap-2 min-w-[100px]">
        <span className="text-sm font-medium text-violet-300">
          {getTargetLabel(timer.target)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 relative">
        <div className="w-full bg-gray-700/50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${getProgressBarColor(timer.status)} ${
              shouldPulse ? 'animate-pulse' : ''
            }`}
            style={{ width: `${Math.max(0, Math.min(100, timer.percentage))}%` }}
          />
        </div>
        
        {/* Status Indicator */}
        {timer.status === 'expired' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-red-200 bg-red-900/80 px-2 py-0.5 rounded">
              EXPIRED
            </span>
          </div>
        )}
      </div>

      {/* Countdown Display */}
      <div className={`min-w-[80px] text-right ${getStatusColor(timer.status)} ${
        shouldPulse ? 'animate-pulse' : ''
      }`}>
        <span className="text-sm font-mono font-bold">
          {timer.displayText}
        </span>
        <div className="text-xs opacity-70">
          {Math.round(timer.percentage)}%
        </div>
      </div>

      {/* Urgency Indicator */}
      {timer.urgency === 'emergency' && (
        <div className="flex items-center">
          <span className="text-red-400 animate-bounce">🚨</span>
        </div>
      )}
      {timer.urgency === 'urgent' && (
        <div className="flex items-center">
          <span className="text-yellow-400 animate-pulse">⚠️</span>
        </div>
      )}
    </div>
  );
}

export function CountdownTimerPanel({ timers, slaMetrics, className = '' }: CountdownTimerProps) {
  const [activeTimer, setActiveTimer] = useState<string>('response');
  const [localTime, setLocalTime] = useState(Date.now());

  // Update local time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-switch to most urgent timer
  useEffect(() => {
    const urgentTimer = timers.find(t => t.urgency === 'emergency') || 
                       timers.find(t => t.urgency === 'urgent');
    if (urgentTimer) {
      setActiveTimer(urgentTimer.target);
    }
  }, [timers]);

  if (timers.length === 0) return null;

  const getOverallStatus = () => {
    const hasExpired = timers.some(t => t.status === 'expired');
    const hasCritical = timers.some(t => t.status === 'critical');
    const hasWarning = timers.some(t => t.status === 'warning');

    if (hasExpired) return 'expired';
    if (hasCritical) return 'critical';
    if (hasWarning) return 'warning';
    return 'active';
  };

  const overallStatus = getOverallStatus();

  const getHeaderColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'text-red-400 border-red-400/30';
      case 'critical':
        return 'text-red-300 border-red-400/30';
      case 'warning':
        return 'text-yellow-300 border-yellow-400/30';
      default:
        return 'text-violet-300 border-violet-400/30';
    }
  };

  return (
    <div className={`glass-morphism rounded-lg border ${getHeaderColor(overallStatus)} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-violet-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <h3 className="text-sm font-semibold">SLA Tracking</h3>
          </div>
          
          {slaMetrics && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-violet-400">Confidence:</span>
                <span className={`font-mono ${
                  slaMetrics.confidence >= 0.8 ? 'text-green-400' :
                  slaMetrics.confidence >= 0.6 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {Math.round(slaMetrics.confidence * 100)}%
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-violet-400">Risk:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  slaMetrics.riskLevel === 'low' ? 'bg-green-500/20 text-green-300' :
                  slaMetrics.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                  slaMetrics.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {slaMetrics.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timer List */}
      <div className="p-4 space-y-3">
        {timers.map((timer) => (
          <CountdownDisplay
            key={timer.target}
            timer={timer}
            isActive={activeTimer === timer.target}
          />
        ))}
      </div>

      {/* Footer with Overall Status */}
      <div className="p-3 border-t border-violet-400/20 bg-violet-500/5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-violet-400">Overall Status:</span>
            <span className={`px-2 py-1 rounded font-medium ${
              overallStatus === 'active' ? 'bg-green-500/20 text-green-300' :
              overallStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
              overallStatus === 'critical' ? 'bg-red-500/20 text-red-300' :
              'bg-red-600/20 text-red-200'
            }`}>
              {overallStatus.toUpperCase().replace('_', ' ')}
            </span>
          </div>

          {slaMetrics && (
            <div className="text-violet-400">
              Elapsed: {Math.round(slaMetrics.timeElapsed / 1000)}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for chat messages
export function CompactCountdownTimer({ timers, className = '' }: CountdownTimerProps) {
  if (timers.length === 0) return null;

  const mostUrgent = timers.reduce((prev, current) => {
    const urgencyOrder = { emergency: 4, urgent: 3, normal: 2 };
    const prevScore = urgencyOrder[prev.urgency] || 1;
    const currentScore = urgencyOrder[current.urgency] || 1;
    return currentScore > prevScore ? current : prev;
  });

  const getStatusIcon = (status: CountdownTimer['status']) => {
    switch (status) {
      case 'active': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      case 'expired': return '❌';
      default: return '⏱️';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 ${className}`}>
      <span className="text-xs">
        {getStatusIcon(mostUrgent.status)}
      </span>
      <span className="text-xs font-medium text-violet-300">
        {mostUrgent.target}: {mostUrgent.displayText}
      </span>
      <div className="w-12 bg-gray-700/50 rounded-full h-1">
        <div 
          className={`h-1 rounded-full ${
            mostUrgent.status === 'active' ? 'bg-green-500' :
            mostUrgent.status === 'warning' ? 'bg-yellow-500' :
            mostUrgent.status === 'critical' ? 'bg-red-500' :
            'bg-red-600'
          }`}
          style={{ width: `${Math.max(0, Math.min(100, mostUrgent.percentage))}%` }}
        />
      </div>
    </div>
  );
} 