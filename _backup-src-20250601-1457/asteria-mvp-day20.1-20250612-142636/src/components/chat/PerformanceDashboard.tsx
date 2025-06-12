// ===============================
// WEEK 3 DAY 17: PERFORMANCE DASHBOARD COMPONENT
// Real-time performance monitoring with threshold tracking
// ===============================

'use client';

import React from 'react';
import { PerformanceThreshold } from '@/lib/agent/core/sla-tracker';

interface PerformanceDashboardProps {
  metrics: PerformanceThreshold[];
  systemSummary?: {
    totalActiveSLAs: number;
    onTime: number;
    approachingBreach: number;
    breached: number;
    escalated: number;
    averageConfidence: number;
  };
  className?: string;
}

interface MetricCardProps {
  metric: PerformanceThreshold;
}

function MetricCard({ metric }: MetricCardProps) {
  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'response_time':
        return '⚡';
      case 'escalation_rate':
        return '🚨';
      case 'tool_success':
        return '🔧';
      case 'member_satisfaction':
        return '😊';
      default:
        return '📊';
    }
  };

  const getMetricLabel = (metricType: string) => {
    switch (metricType) {
      case 'response_time':
        return 'Response Time';
      case 'escalation_rate':
        return 'Escalation Rate';
      case 'tool_success':
        return 'Tool Success';
      case 'member_satisfaction':
        return 'Satisfaction';
      default:
        return metricType;
    }
  };

  const getStatusColor = (status: PerformanceThreshold['status']) => {
    switch (status) {
      case 'excellent':
        return 'text-green-400 border-green-400/30 bg-green-500/10';
      case 'good':
        return 'text-blue-400 border-blue-400/30 bg-blue-500/10';
      case 'fair':
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      case 'poor':
        return 'text-red-400 border-red-400/30 bg-red-500/10';
      default:
        return 'text-gray-400 border-gray-400/30 bg-gray-500/10';
    }
  };

  const getTrendIcon = (trend: PerformanceThreshold['trend']) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '📊';
    }
  };

  const formatValue = (metricType: string, value: number) => {
    switch (metricType) {
      case 'response_time':
        return `${(value / 1000).toFixed(1)}s`;
      case 'escalation_rate':
        return `${(value * 100).toFixed(1)}%`;
      case 'tool_success':
        return `${(value * 100).toFixed(1)}%`;
      case 'member_satisfaction':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return value.toFixed(2);
    }
  };

  const formatTarget = (metricType: string, target: number) => {
    switch (metricType) {
      case 'response_time':
        return `${(target / 1000).toFixed(1)}s`;
      case 'escalation_rate':
        return `${(target * 100).toFixed(0)}%`;
      case 'tool_success':
        return `${(target * 100).toFixed(0)}%`;
      case 'member_satisfaction':
        return `${(target * 100).toFixed(0)}%`;
      default:
        return target.toString();
    }
  };

  const calculateProgress = () => {
    if (metric.metric === 'escalation_rate') {
      // For escalation rate, lower is better
      return Math.max(0, Math.min(100, (1 - (metric.current / metric.target)) * 100));
    }
    // For other metrics, higher is better
    return Math.max(0, Math.min(100, (metric.current / metric.target) * 100));
  };

  const progress = calculateProgress();

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor(metric.status)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getMetricIcon(metric.metric)}</span>
          <h4 className="text-sm font-semibold">{getMetricLabel(metric.metric)}</h4>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-xs">{getTrendIcon(metric.trend)}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(metric.status)}`}>
            {metric.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Current Value */}
      <div className="text-center mb-3">
        <div className="text-2xl font-bold font-mono">
          {formatValue(metric.metric, metric.current)}
        </div>
        <div className="text-xs opacity-70">
          Target: {formatTarget(metric.metric, metric.target)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-2">
        <div className="w-full bg-gray-700/50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              metric.status === 'excellent' ? 'bg-green-500' :
              metric.status === 'good' ? 'bg-blue-500' :
              metric.status === 'fair' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Target Line */}
        <div className="absolute top-0 left-0 w-full h-2 flex items-center">
          <div 
            className="w-0.5 h-4 bg-white/50"
            style={{ marginLeft: '100%', transform: 'translateX(-1px)' }}
          />
        </div>
      </div>

      {/* Progress Percentage */}
      <div className="text-center text-xs opacity-70">
        {progress.toFixed(1)}% of target
      </div>
    </div>
  );
}

function SystemSummaryCard({ systemSummary }: { systemSummary: PerformanceDashboardProps['systemSummary'] }) {
  if (!systemSummary) return null;

  const { totalActiveSLAs, onTime, approachingBreach, breached, escalated, averageConfidence } = systemSummary;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-lg bg-violet-500/10 border border-violet-400/20">
      <div className="text-center">
        <div className="text-lg font-bold text-violet-300">{totalActiveSLAs}</div>
        <div className="text-xs text-violet-400">Active SLAs</div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-bold text-green-400">{onTime}</div>
        <div className="text-xs text-violet-400">On Time</div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-bold text-yellow-400">{approachingBreach}</div>
        <div className="text-xs text-violet-400">At Risk</div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-bold text-red-400">{breached}</div>
        <div className="text-xs text-violet-400">Breached</div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-bold text-orange-400">{escalated}</div>
        <div className="text-xs text-violet-400">Escalated</div>
      </div>
      
      <div className="text-center">
        <div className={`text-lg font-bold ${getConfidenceColor(averageConfidence)}`}>
          {Math.round(averageConfidence * 100)}%
        </div>
        <div className="text-xs text-violet-400">Confidence</div>
      </div>
    </div>
  );
}

export function PerformanceDashboard({ metrics, systemSummary, className = '' }: PerformanceDashboardProps) {
  if (metrics.length === 0) return null;

  const getOverallHealth = () => {
    const excellentCount = metrics.filter(m => m.status === 'excellent').length;
    const goodCount = metrics.filter(m => m.status === 'good').length;
    const totalCount = metrics.length;
    
    const healthScore = (excellentCount * 100 + goodCount * 80) / totalCount;
    
    if (healthScore >= 90) return { status: 'excellent', color: 'text-green-400' };
    if (healthScore >= 70) return { status: 'good', color: 'text-blue-400' };
    if (healthScore >= 50) return { status: 'fair', color: 'text-yellow-400' };
    return { status: 'poor', color: 'text-red-400' };
  };

  const overallHealth = getOverallHealth();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h2 className="text-lg font-semibold text-violet-300">Performance Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-violet-400">System Health:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-violet-500/20 ${overallHealth.color}`}>
            {overallHealth.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* System Summary */}
      {systemSummary && (
        <div>
          <h3 className="text-sm font-medium text-violet-300 mb-3">System Overview</h3>
          <SystemSummaryCard systemSummary={systemSummary} />
        </div>
      )}

      {/* Performance Metrics */}
      <div>
        <h3 className="text-sm font-medium text-violet-300 mb-3">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.metric} metric={metric} />
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-400/20">
        <h3 className="text-sm font-medium text-violet-300 mb-2">Performance Insights</h3>
        <div className="text-xs text-violet-400 space-y-1">
          {metrics.some(m => m.trend === 'declining') && (
            <div className="flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              <span>Some metrics are declining - consider performance optimization</span>
            </div>
          )}
          {metrics.some(m => m.trend === 'improving') && (
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Performance improvements detected in key metrics</span>
            </div>
          )}
          {metrics.every(m => m.status === 'excellent') && (
            <div className="flex items-center gap-2">
              <span className="text-green-400">🎉</span>
              <span>All performance metrics exceeding targets - excellent system health</span>
            </div>
          )}
          {systemSummary && systemSummary.averageConfidence < 0.7 && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">🔍</span>
              <span>Member confidence below optimal - review escalation processes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebar or header
export function CompactPerformanceDashboard({ metrics, className = '' }: { metrics: PerformanceThreshold[]; className?: string }) {
  if (metrics.length === 0) return null;

  const criticalMetrics = metrics.filter(m => m.status === 'poor' || m.status === 'fair');
  const excellentMetrics = metrics.filter(m => m.status === 'excellent');

  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg bg-violet-500/10 border border-violet-400/20 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">📊</span>
        <span className="text-sm font-medium text-violet-300">Performance</span>
      </div>
      
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-green-400">●</span>
          <span className="text-violet-400">{excellentMetrics.length} Excellent</span>
        </div>
        
        {criticalMetrics.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-red-400">●</span>
            <span className="text-violet-400">{criticalMetrics.length} Needs Attention</span>
          </div>
        )}
      </div>
    </div>
  );
} 