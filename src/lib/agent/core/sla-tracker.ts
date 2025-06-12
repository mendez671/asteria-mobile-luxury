// ===============================
// WEEK 3 DAY 17: SLA TRACKING & COUNTDOWN TIMERS
// Advanced escalation management with real-time SLA monitoring
// ===============================

import { ToolExecutionStatus } from '@/lib/agent/types';
import { EscalationContext } from './execution-tracker';

export interface SLAThreshold {
  serviceType: 'aviation' | 'dining' | 'lifestyle' | 'events' | 'brandDev' | 'general';
  memberTier: 'founding10' | 'fifty-k' | 'corporate' | 'all-members';
  responseTime: number; // milliseconds
  escalationTime: number; // milliseconds 
  resolutionTime: number; // milliseconds
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SLAMetrics {
  startTime: number;
  responseTarget: number;
  escalationTarget: number;
  resolutionTarget: number;
  currentTime: number;
  timeElapsed: number;
  timeRemaining: {
    response: number;
    escalation: number;
    resolution: number;
  };
  status: 'on_time' | 'approaching_breach' | 'breached' | 'escalated';
  confidence: number; // Member confidence score 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CountdownTimer {
  target: string; // 'response' | 'escalation' | 'resolution'
  remaining: number; // milliseconds
  percentage: number; // 0-100
  status: 'active' | 'warning' | 'critical' | 'expired';
  urgency: 'normal' | 'urgent' | 'emergency';
  displayText: string; // Human-readable countdown
}

export interface PerformanceThreshold {
  metric: 'response_time' | 'escalation_rate' | 'tool_success' | 'member_satisfaction';
  current: number;
  target: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  trend: 'improving' | 'stable' | 'declining';
}

export class SLATracker {
  private slaThresholds: SLAThreshold[] = [
    // ===============================
    // FOUNDING TIER - PREMIUM SLA
    // ===============================
    {
      serviceType: 'aviation',
      memberTier: 'founding10',
      responseTime: 30000, // 30 seconds
      escalationTime: 120000, // 2 minutes  
      resolutionTime: 900000, // 15 minutes
      priority: 'critical'
    },
    {
      serviceType: 'dining',
      memberTier: 'founding10', 
      responseTime: 45000, // 45 seconds
      escalationTime: 180000, // 3 minutes
      resolutionTime: 1200000, // 20 minutes
      priority: 'high'
    },
    {
      serviceType: 'lifestyle',
      memberTier: 'founding10',
      responseTime: 60000, // 1 minute
      escalationTime: 300000, // 5 minutes
      resolutionTime: 1800000, // 30 minutes
      priority: 'high'
    },
    
    // ===============================
    // FIFTY-K TIER - HIGH SLA
    // ===============================
    {
      serviceType: 'aviation',
      memberTier: 'fifty-k',
      responseTime: 60000, // 1 minute
      escalationTime: 300000, // 5 minutes
      resolutionTime: 1800000, // 30 minutes
      priority: 'high'
    },
    {
      serviceType: 'dining',
      memberTier: 'fifty-k',
      responseTime: 90000, // 1.5 minutes
      escalationTime: 420000, // 7 minutes
      resolutionTime: 2400000, // 40 minutes
      priority: 'medium'
    },
    
    // ===============================
    // CORPORATE TIER - STANDARD SLA
    // ===============================
    {
      serviceType: 'general',
      memberTier: 'corporate',
      responseTime: 120000, // 2 minutes
      escalationTime: 600000, // 10 minutes
      resolutionTime: 3600000, // 1 hour
      priority: 'medium'
    },
    
    // ===============================
    // ALL-MEMBERS TIER - BASIC SLA
    // ===============================
    {
      serviceType: 'general',
      memberTier: 'all-members',
      responseTime: 300000, // 5 minutes
      escalationTime: 1200000, // 20 minutes
      resolutionTime: 7200000, // 2 hours
      priority: 'low'
    }
  ];

  private activeSLAs: Map<string, SLAMetrics> = new Map();
  private countdownTimers: Map<string, CountdownTimer[]> = new Map();
  private performanceMetrics: PerformanceThreshold[] = [];

  constructor() {
    this.initializePerformanceThresholds();
  }

  // ===============================
  // SLA INITIALIZATION & TRACKING
  // ===============================

  startTracking(
    requestId: string, 
    serviceType: string, 
    memberTier: string,
    executionContext?: any
  ): SLAMetrics {
    const threshold = this.getSLAThreshold(serviceType as any, memberTier as any);
    const startTime = Date.now();
    
    const slaMetrics: SLAMetrics = {
      startTime,
      responseTarget: threshold.responseTime,
      escalationTarget: threshold.escalationTime,
      resolutionTarget: threshold.resolutionTime,
      currentTime: startTime,
      timeElapsed: 0,
      timeRemaining: {
        response: threshold.responseTime,
        escalation: threshold.escalationTime,
        resolution: threshold.resolutionTime
      },
      status: 'on_time',
      confidence: 1.0, // Start with full confidence
      riskLevel: 'low'
    };

    this.activeSLAs.set(requestId, slaMetrics);
    this.initializeCountdownTimers(requestId, slaMetrics);
    
    console.log(`🎯 [SLA] Tracking started for ${requestId}: ${serviceType}/${memberTier}`);
    console.log(`🎯 [SLA] Targets - Response: ${threshold.responseTime/1000}s, Escalation: ${threshold.escalationTime/1000}s, Resolution: ${threshold.resolutionTime/60000}m`);
    
    return slaMetrics;
  }

  updateTracking(requestId: string, toolsExecuted?: ToolExecutionStatus[]): SLAMetrics | null {
    const sla = this.activeSLAs.get(requestId);
    if (!sla) return null;

    const currentTime = Date.now();
    const timeElapsed = currentTime - sla.startTime;
    
    // Update time calculations
    sla.currentTime = currentTime;
    sla.timeElapsed = timeElapsed;
    sla.timeRemaining = {
      response: Math.max(0, sla.responseTarget - timeElapsed),
      escalation: Math.max(0, sla.escalationTarget - timeElapsed), 
      resolution: Math.max(0, sla.resolutionTarget - timeElapsed)
    };

    // Update status based on time progression
    sla.status = this.calculateSLAStatus(sla);
    sla.confidence = this.calculateMemberConfidence(sla, toolsExecuted);
    sla.riskLevel = this.calculateRiskLevel(sla);

    // Update countdown timers
    this.updateCountdownTimers(requestId, sla);

    this.activeSLAs.set(requestId, sla);
    return sla;
  }

  // ===============================
  // COUNTDOWN TIMER MANAGEMENT
  // ===============================

  initializeCountdownTimers(requestId: string, sla: SLAMetrics): void {
    const timers: CountdownTimer[] = [
      {
        target: 'response',
        remaining: sla.timeRemaining.response,
        percentage: 100,
        status: 'active',
        urgency: 'normal',
        displayText: this.formatCountdown(sla.timeRemaining.response)
      },
      {
        target: 'escalation', 
        remaining: sla.timeRemaining.escalation,
        percentage: 100,
        status: 'active',
        urgency: 'normal',
        displayText: this.formatCountdown(sla.timeRemaining.escalation)
      },
      {
        target: 'resolution',
        remaining: sla.timeRemaining.resolution,
        percentage: 100,
        status: 'active',
        urgency: 'normal',
        displayText: this.formatCountdown(sla.timeRemaining.resolution)
      }
    ];

    this.countdownTimers.set(requestId, timers);
  }

  updateCountdownTimers(requestId: string, sla: SLAMetrics): void {
    const timers = this.countdownTimers.get(requestId);
    if (!timers) return;

    timers.forEach(timer => {
      const remaining = sla.timeRemaining[timer.target as keyof typeof sla.timeRemaining];
      const target = sla[`${timer.target}Target` as keyof SLAMetrics] as number;
      
      timer.remaining = remaining;
      timer.percentage = Math.max(0, (remaining / target) * 100);
      timer.displayText = this.formatCountdown(remaining);
      
      // Update status based on remaining time
      if (remaining <= 0) {
        timer.status = 'expired';
        timer.urgency = 'emergency';
      } else if (timer.percentage <= 10) {
        timer.status = 'critical';
        timer.urgency = 'emergency';
      } else if (timer.percentage <= 25) {
        timer.status = 'warning';
        timer.urgency = 'urgent';
      } else {
        timer.status = 'active';
        timer.urgency = 'normal';
      }
    });

    this.countdownTimers.set(requestId, timers);
  }

  getCountdownTimers(requestId: string): CountdownTimer[] {
    return this.countdownTimers.get(requestId) || [];
  }

  // ===============================
  // PERFORMANCE MONITORING
  // ===============================

  updatePerformanceMetrics(metrics: {
    responseTime?: number;
    escalationRate?: number;
    toolSuccessRate?: number;
    memberSatisfaction?: number;
  }): void {
    if (metrics.responseTime !== undefined) {
      this.updatePerformanceThreshold('response_time', metrics.responseTime, 2000); // 2s target
    }
    if (metrics.escalationRate !== undefined) {
      this.updatePerformanceThreshold('escalation_rate', metrics.escalationRate, 0.15); // 15% max
    }
    if (metrics.toolSuccessRate !== undefined) {
      this.updatePerformanceThreshold('tool_success', metrics.toolSuccessRate, 0.95); // 95% target
    }
    if (metrics.memberSatisfaction !== undefined) {
      this.updatePerformanceThreshold('member_satisfaction', metrics.memberSatisfaction, 0.9); // 90% target
    }
  }

  getPerformanceMetrics(): PerformanceThreshold[] {
    return this.performanceMetrics;
  }

  // ===============================
  // ESCALATION WORKFLOW AUTOMATION
  // ===============================

  checkEscalationTriggers(requestId: string): {
    shouldEscalate: boolean;
    reason: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    estimatedResponse: string;
  } {
    const sla = this.activeSLAs.get(requestId);
    if (!sla) {
      return { shouldEscalate: false, reason: 'No SLA found', urgency: 'low', estimatedResponse: '1 hour' };
    }

    // Critical: Resolution time breached
    if (sla.timeRemaining.resolution <= 0) {
      return {
        shouldEscalate: true,
        reason: 'Resolution time exceeded - immediate management intervention required',
        urgency: 'critical',
        estimatedResponse: '5 minutes'
      };
    }

    // High: Escalation time breached
    if (sla.timeRemaining.escalation <= 0) {
      return {
        shouldEscalate: true,
        reason: 'Escalation threshold reached - senior concierge assignment needed',
        urgency: 'high', 
        estimatedResponse: '10 minutes'
      };
    }

    // Medium: Approaching escalation (80% of time elapsed)
    const escalationProgress = 1 - (sla.timeRemaining.escalation / sla.escalationTarget);
    if (escalationProgress >= 0.8) {
      return {
        shouldEscalate: true,
        reason: 'Approaching escalation threshold - proactive concierge engagement',
        urgency: 'medium',
        estimatedResponse: '15 minutes'
      };
    }

    // Low confidence triggers escalation
    if (sla.confidence < 0.5) {
      return {
        shouldEscalate: true,
        reason: 'Member confidence declining - quality assurance required',
        urgency: 'medium',
        estimatedResponse: '20 minutes'
      };
    }

    return { shouldEscalate: false, reason: 'All metrics within acceptable thresholds', urgency: 'low', estimatedResponse: '30 minutes' };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private getSLAThreshold(serviceType: SLAThreshold['serviceType'], memberTier: SLAThreshold['memberTier']): SLAThreshold {
    // Try exact match first
    let threshold = this.slaThresholds.find(t => 
      t.serviceType === serviceType && t.memberTier === memberTier
    );

    // Fallback to general service type for the tier
    if (!threshold) {
      threshold = this.slaThresholds.find(t => 
        t.serviceType === 'general' && t.memberTier === memberTier
      );
    }

    // Ultimate fallback to all-members general
    if (!threshold) {
      threshold = this.slaThresholds.find(t => 
        t.serviceType === 'general' && t.memberTier === 'all-members'
      );
    }

    return threshold || this.slaThresholds[this.slaThresholds.length - 1];
  }

  private calculateSLAStatus(sla: SLAMetrics): SLAMetrics['status'] {
    if (sla.timeRemaining.resolution <= 0) return 'breached';
    if (sla.timeRemaining.escalation <= 0) return 'escalated';
    
    const escalationProgress = 1 - (sla.timeRemaining.escalation / sla.escalationTarget);
    if (escalationProgress >= 0.75) return 'approaching_breach';
    
    return 'on_time';
  }

  private calculateMemberConfidence(sla: SLAMetrics, toolsExecuted?: ToolExecutionStatus[]): number {
    let confidence = 1.0;

    // Time-based confidence decay
    const responseProgress = 1 - (sla.timeRemaining.response / sla.responseTarget);
    if (responseProgress > 0.5) confidence -= 0.1;
    if (responseProgress > 0.8) confidence -= 0.2;

    // Tool execution impact
    if (toolsExecuted) {
      const failedTools = toolsExecuted.filter(t => t.status === 'failed').length;
      const totalTools = toolsExecuted.length;
      if (totalTools > 0) {
        confidence -= (failedTools / totalTools) * 0.3;
      }
    }

    // Risk level impact
    if (sla.riskLevel === 'high') confidence -= 0.1;
    if (sla.riskLevel === 'critical') confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  private calculateRiskLevel(sla: SLAMetrics): SLAMetrics['riskLevel'] {
    const escalationProgress = 1 - (sla.timeRemaining.escalation / sla.escalationTarget);
    
    if (escalationProgress >= 0.9 || sla.confidence < 0.3) return 'critical';
    if (escalationProgress >= 0.7 || sla.confidence < 0.5) return 'high';
    if (escalationProgress >= 0.5 || sla.confidence < 0.7) return 'medium';
    return 'low';
  }

  private formatCountdown(milliseconds: number): string {
    if (milliseconds <= 0) return 'Expired';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private initializePerformanceThresholds(): void {
    this.performanceMetrics = [
      {
        metric: 'response_time',
        current: 0,
        target: 2000,
        status: 'excellent',
        trend: 'stable'
      },
      {
        metric: 'escalation_rate',
        current: 0,
        target: 0.15,
        status: 'excellent',
        trend: 'stable'
      },
      {
        metric: 'tool_success',
        current: 1,
        target: 0.95,
        status: 'excellent',
        trend: 'stable'
      },
      {
        metric: 'member_satisfaction',
        current: 1,
        target: 0.9,
        status: 'excellent',
        trend: 'stable'
      }
    ];
  }

  private updatePerformanceThreshold(
    metric: PerformanceThreshold['metric'], 
    current: number, 
    target: number
  ): void {
    const existing = this.performanceMetrics.find(m => m.metric === metric);
    if (existing) {
      const oldValue = existing.current;
      existing.current = current;
      existing.target = target;
      
      // Calculate status
      const ratio = current / target;
      if (metric === 'escalation_rate') {
        // Lower is better for escalation rate
        existing.status = ratio <= 0.5 ? 'excellent' : ratio <= 0.75 ? 'good' : ratio <= 1 ? 'fair' : 'poor';
      } else {
        // Higher is better for other metrics
        existing.status = ratio >= 1 ? 'excellent' : ratio >= 0.8 ? 'good' : ratio >= 0.6 ? 'fair' : 'poor';
      }
      
      // Calculate trend
      if (current > oldValue) {
        existing.trend = metric === 'escalation_rate' ? 'declining' : 'improving';
      } else if (current < oldValue) {
        existing.trend = metric === 'escalation_rate' ? 'improving' : 'declining';
      } else {
        existing.trend = 'stable';
      }
    }
  }

  // ===============================
  // PUBLIC API METHODS
  // ===============================

  getSLAMetrics(requestId: string): SLAMetrics | null {
    return this.activeSLAs.get(requestId) || null;
  }

  stopTracking(requestId: string): void {
    this.activeSLAs.delete(requestId);
    this.countdownTimers.delete(requestId);
    console.log(`🎯 [SLA] Tracking stopped for ${requestId}`);
  }

  getAllActiveSLAs(): Map<string, SLAMetrics> {
    return new Map(this.activeSLAs);
  }

  getSystemPerformanceSummary(): {
    totalActiveSLAs: number;
    onTime: number;
    approachingBreach: number;
    breached: number;
    escalated: number;
    averageConfidence: number;
    performanceMetrics: PerformanceThreshold[];
  } {
    const slas = Array.from(this.activeSLAs.values());
    
    return {
      totalActiveSLAs: slas.length,
      onTime: slas.filter(s => s.status === 'on_time').length,
      approachingBreach: slas.filter(s => s.status === 'approaching_breach').length,
      breached: slas.filter(s => s.status === 'breached').length,
      escalated: slas.filter(s => s.status === 'escalated').length,
      averageConfidence: slas.length > 0 ? slas.reduce((sum, s) => sum + s.confidence, 0) / slas.length : 1,
      performanceMetrics: this.performanceMetrics
    };
  }
}

// Global SLA tracker instance
export const slaTracker = new SLATracker(); 