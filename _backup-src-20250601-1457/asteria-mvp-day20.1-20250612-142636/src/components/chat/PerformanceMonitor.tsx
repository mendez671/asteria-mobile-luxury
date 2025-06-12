// ===============================
// PHASE 3.4: PERFORMANCE MONITORING COMPONENT
// Real-time agent performance tracking
// ===============================

'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon, BoltIcon } from '@heroicons/react/24/solid';

interface PerformanceMetrics {
  responseTime?: number;
  confidence?: number;
  serviceCategory?: string;
  successRate?: number;
  averageResponseTime?: number;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  isVisible?: boolean;
  className?: string;
}

export function PerformanceMonitor({ 
  metrics, 
  isVisible = false, 
  className = '' 
}: PerformanceMonitorProps) {
  const [sessionMetrics, setSessionMetrics] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    totalResponseTime: 0,
    averageConfidence: 0
  });

  // Update session metrics when new metrics arrive
  useEffect(() => {
    if (metrics.responseTime && metrics.confidence) {
      setSessionMetrics(prev => {
        const newTotal = prev.totalRequests + 1;
        const newSuccessful = metrics.confidence! > 0.7 
          ? prev.successfulRequests + 1 
          : prev.successfulRequests;
        
        return {
          totalRequests: newTotal,
          successfulRequests: newSuccessful,
          totalResponseTime: prev.totalResponseTime + metrics.responseTime!,
          averageConfidence: (prev.averageConfidence * prev.totalRequests + metrics.confidence!) / newTotal
        };
      });
    }
  }, [metrics]);

  if (!isVisible) return null;

  const successRate = sessionMetrics.totalRequests > 0 
    ? (sessionMetrics.successfulRequests / sessionMetrics.totalRequests) * 100 
    : 0;

  const averageResponseTime = sessionMetrics.totalRequests > 0 
    ? sessionMetrics.totalResponseTime / sessionMetrics.totalRequests 
    : 0;

  return (
    <div className={`fixed bottom-4 right-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-3 text-xs text-white max-w-xs z-50 ${className}`}>
      <div className="flex items-center gap-2 mb-2 border-b border-white/20 pb-2">
        <ChartBarIcon className="w-4 h-4 text-blue-400" />
        <span className="font-medium">Agent Performance</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Current Response Time */}
        {metrics.responseTime && (
          <div className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3 text-gray-400" />
            <span className={
              metrics.responseTime < 1000 ? 'text-green-400' :
              metrics.responseTime < 3000 ? 'text-yellow-400' :
              'text-red-400'
            }>
              {metrics.responseTime}ms
            </span>
          </div>
        )}

        {/* Current Confidence */}
        {metrics.confidence && (
          <div className="flex items-center gap-1">
            <BoltIcon className="w-3 h-3 text-gray-400" />
            <span className={
              metrics.confidence > 0.8 ? 'text-green-400' :
              metrics.confidence > 0.5 ? 'text-yellow-400' :
              'text-red-400'
            }>
              {Math.round(metrics.confidence * 100)}%
            </span>
          </div>
        )}

        {/* Session Success Rate */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Success:</span>
          <span className={
            successRate > 80 ? 'text-green-400' :
            successRate > 60 ? 'text-yellow-400' :
            'text-red-400'
          }>
            {Math.round(successRate)}%
          </span>
        </div>

        {/* Average Response Time */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Avg:</span>
          <span className={
            averageResponseTime < 1500 ? 'text-green-400' :
            averageResponseTime < 3000 ? 'text-yellow-400' :
            'text-red-400'
          }>
            {Math.round(averageResponseTime)}ms
          </span>
        </div>
      </div>

      {/* Service Category */}
      {metrics.serviceCategory && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <span className="text-gray-400">Category: </span>
          <span className="text-blue-300 capitalize">{metrics.serviceCategory}</span>
        </div>
      )}

      {/* Performance Status */}
      <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          (metrics.responseTime && metrics.responseTime < 2000 && 
           metrics.confidence && metrics.confidence > 0.7) 
            ? 'bg-green-400 animate-pulse'
            : (metrics.responseTime && metrics.responseTime < 4000)
            ? 'bg-yellow-400'
            : 'bg-red-400'
        }`}></div>
        <span className="text-gray-300">
          {(metrics.responseTime && metrics.responseTime < 2000 && 
            metrics.confidence && metrics.confidence > 0.7) 
            ? 'Optimal Performance'
            : (metrics.responseTime && metrics.responseTime < 4000)
            ? 'Normal Performance'
            : 'Performance Issues'
          }
        </span>
      </div>
    </div>
  );
} 