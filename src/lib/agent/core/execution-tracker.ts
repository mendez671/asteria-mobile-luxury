// ===============================
// WEEK 3 DAY 15: TOOL EXECUTION TRANSPARENCY SYSTEM
// Real-time tool monitoring for member-facing visibility
// ===============================

export interface ToolExecutionStatus {
  toolName: string;
  status: 'queued' | 'executing' | 'completed' | 'failed';
  startTime: number;
  duration?: number;
  displayName: string;
  description: string;
  memberVisible: boolean;
  progress?: number;
  error?: string;
  result?: any;
}

export interface EscalationContext {
  trigger: 'tool_failure' | 'complexity_threshold' | 'member_preference' | 'timeout';
  explanation: string;
  expectedResponse: string;
  slaEstimate: number;
  conciergeAssigned?: string;
  memberNotified: boolean;
}

export interface ExecutionTimeline {
  totalDuration: number;
  phases: Array<{
    phase: string;
    tools: ToolExecutionStatus[];
    startTime: number;
    endTime?: number;
    success: boolean;
  }>;
  coordinationScore: number;
  memberExperience: {
    clarity: number;
    transparency: number;
    satisfaction: number;
  };
}

export class ExecutionTracker {
  private activeExecutions: Map<string, ToolExecutionStatus> = new Map();
  private executionHistory: ToolExecutionStatus[] = [];
  private escalationContext?: EscalationContext;
  private startTime: number = 0;
  
  // Member-friendly tool metadata
  private toolMetadata: Record<string, { displayName: string; description: string; memberVisible: boolean }> = {
    'search_luxury_knowledge': {
      displayName: '🔍 Knowledge Search',
      description: 'Accessing luxury services database...',
      memberVisible: true
    },
    'amadeus_flight_search': {
      displayName: '✈️ Flight Search',
      description: 'Coordinating private aircraft options...',
      memberVisible: true
    },
    'fetch_active_services': {
      displayName: '🏨 Service Discovery',
      description: 'Arranging exclusive reservations...',
      memberVisible: true
    },
    'create_ticket': {
      displayName: '📋 Request Creation',
      description: 'Preparing your personalized request...',
      memberVisible: true
    },
    'notify_concierge': {
      displayName: '📞 Concierge Notification',
      description: 'Connecting with your dedicated concierge...',
      memberVisible: true
    },
    'stripe_payment_intent': {
      displayName: '💳 Payment Processing',
      description: 'Securing your payment arrangements...',
      memberVisible: false // Financial operations kept private
    },
    'luxury_aviation_complete': {
      displayName: '✈️ Aviation Coordination',
      description: 'Orchestrating comprehensive travel arrangements...',
      memberVisible: true
    },
    'luxury_dining_complete': {
      displayName: '🍽️ Dining Coordination',
      description: 'Curating exceptional dining experiences...',
      memberVisible: true
    }
  };

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Start tracking a tool execution
   */
  startExecution(toolName: string): string {
    const executionId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metadata = this.toolMetadata[toolName] || {
      displayName: this.formatToolName(toolName),
      description: 'Processing your request...',
      memberVisible: true
    };

    const status: ToolExecutionStatus = {
      toolName,
      status: 'queued',
      startTime: performance.now(),
      displayName: metadata.displayName,
      description: metadata.description,
      memberVisible: metadata.memberVisible,
      progress: 0
    };

    this.activeExecutions.set(executionId, status);
    console.log(`🔍 [EXECUTION_TRACKER] Started tracking: ${toolName} (${executionId})`);
    
    return executionId;
  }

  /**
   * Update execution status with progress
   */
  updateExecution(executionId: string, updates: Partial<ToolExecutionStatus>): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      console.warn(`⚠️ [EXECUTION_TRACKER] Execution not found: ${executionId}`);
      return;
    }

    // Update the execution status
    Object.assign(execution, updates);

    // Auto-calculate duration if completed or failed
    if ((updates.status === 'completed' || updates.status === 'failed') && !execution.duration) {
      execution.duration = performance.now() - execution.startTime;
    }

    console.log(`📊 [EXECUTION_TRACKER] Updated ${execution.toolName}: ${execution.status} (${execution.progress || 0}%)`);
  }

  /**
   * Complete tool execution
   */
  completeExecution(executionId: string, result?: any, error?: string): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    execution.status = error ? 'failed' : 'completed';
    execution.duration = performance.now() - execution.startTime;
    execution.progress = 100;
    execution.result = result;
    execution.error = error;

    // Move to history
    this.executionHistory.push({ ...execution });
    this.activeExecutions.delete(executionId);

    console.log(`✅ [EXECUTION_TRACKER] Completed ${execution.toolName}: ${execution.status} (${execution.duration?.toFixed(0)}ms)`);
  }

  /**
   * Track escalation context
   */
  recordEscalation(context: Omit<EscalationContext, 'memberNotified'>): void {
    this.escalationContext = {
      ...context,
      memberNotified: false
    };

    console.log(`🚨 [EXECUTION_TRACKER] Escalation recorded: ${context.trigger} - ${context.explanation}`);
  }

  /**
   * Get current execution status for member interface
   */
  getMemberVisibleExecutions(): ToolExecutionStatus[] {
    const active = Array.from(this.activeExecutions.values())
      .filter(exec => exec.memberVisible);
    
    const recentCompleted = this.executionHistory
      .filter(exec => exec.memberVisible && (performance.now() - exec.startTime) < 10000) // Last 10 seconds
      .slice(-3); // Last 3 completed

    return [...active, ...recentCompleted];
  }

  /**
   * Generate execution timeline for analysis
   */
  getExecutionTimeline(): ExecutionTimeline {
    const totalDuration = performance.now() - this.startTime;
    const allExecutions = [...this.executionHistory, ...Array.from(this.activeExecutions.values())];

    // Group executions by phases (parallel vs sequential)
    const phases = this.groupExecutionsByPhases(allExecutions);
    
    // Calculate coordination score
    const coordinationScore = this.calculateCoordinationScore(allExecutions);
    
    // Calculate member experience metrics
    const memberExperience = this.calculateMemberExperience(allExecutions, totalDuration);

    return {
      totalDuration,
      phases,
      coordinationScore,
      memberExperience
    };
  }

  /**
   * Get escalation context for member communication
   */
  getEscalationContext(): EscalationContext | undefined {
    return this.escalationContext;
  }

  /**
   * Generate member-friendly execution summary
   */
  generateExecutionSummary(): string {
    const visibleExecutions = this.getMemberVisibleExecutions();
    const completed = visibleExecutions.filter(e => e.status === 'completed');
    const active = visibleExecutions.filter(e => e.status === 'executing');
    const failed = visibleExecutions.filter(e => e.status === 'failed');

    if (active.length > 0) {
      const primaryActive = active[0];
      return `${primaryActive.displayName}: ${primaryActive.description}`;
    }

    if (completed.length > 0) {
      const toolNames = completed.map(e => e.displayName.replace(/[🔍✈️🏨📋📞💳🍽️]/g, '').trim());
      return `Completed ${toolNames.join(', ')} successfully`;
    }

    if (failed.length > 0) {
      return 'Processing your request through alternative methods...';
    }

    return 'Analyzing your request...';
  }

  /**
   * Format tool name for display
   */
  private formatToolName(toolName: string): string {
    return toolName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Group executions by execution phases
   */
  private groupExecutionsByPhases(executions: ToolExecutionStatus[]): ExecutionTimeline['phases'] {
    // Simple phase grouping - can be enhanced with actual execution planning
    const phases: ExecutionTimeline['phases'] = [];
    
    if (executions.length === 0) return phases;

    // Group by similar start times (parallel execution)
    const phaseThreshold = 100; // 100ms threshold for parallel execution
    let currentPhase: { phase: string; tools: ToolExecutionStatus[]; startTime: number; endTime?: number; success: boolean } | null = null;

    for (const execution of executions.sort((a, b) => a.startTime - b.startTime)) {
      if (!currentPhase || (execution.startTime - currentPhase.startTime) > phaseThreshold) {
        // Start new phase
        if (currentPhase) {
          currentPhase.endTime = Math.max(...currentPhase.tools.map(t => t.startTime + (t.duration || 0)));
          phases.push(currentPhase);
        }
        
        currentPhase = {
          phase: execution.toolName.includes('search') ? 'Discovery' : 
                 execution.toolName.includes('create') ? 'Service Creation' : 
                 execution.toolName.includes('notify') ? 'Coordination' : 'Processing',
          tools: [execution],
          startTime: execution.startTime,
          success: execution.status === 'completed'
        };
      } else {
        // Add to current phase
        currentPhase.tools.push(execution);
        currentPhase.success = currentPhase.success && execution.status === 'completed';
      }
    }

    if (currentPhase) {
      currentPhase.endTime = Math.max(...currentPhase.tools.map(t => t.startTime + (t.duration || 0)));
      phases.push(currentPhase);
    }

    return phases;
  }

  /**
   * Calculate coordination effectiveness score
   */
  private calculateCoordinationScore(executions: ToolExecutionStatus[]): number {
    if (executions.length === 0) return 1.0;

    const completed = executions.filter(e => e.status === 'completed').length;
    const total = executions.length;
    const successRate = completed / total;

    // Factor in execution efficiency
    const avgDuration = executions
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length;
    
    const efficiencyScore = avgDuration < 2000 ? 1.0 : Math.max(0.5, 2000 / avgDuration);
    
    return (successRate * 0.7) + (efficiencyScore * 0.3);
  }

  /**
   * Calculate member experience metrics
   */
  private calculateMemberExperience(executions: ToolExecutionStatus[], totalDuration: number): ExecutionTimeline['memberExperience'] {
    const visibleExecutions = executions.filter(e => e.memberVisible);
    
    // Clarity: How clear the process was to the member
    const clarity = visibleExecutions.length > 0 ? 
      Math.min(1.0, visibleExecutions.length / Math.max(1, executions.length)) : 0.5;
    
    // Transparency: How much of the process was visible
    const transparency = visibleExecutions.length / Math.max(1, executions.length);
    
    // Satisfaction: Based on success rate and reasonable timing
    const successRate = visibleExecutions.filter(e => e.status === 'completed').length / Math.max(1, visibleExecutions.length);
    const timingScore = totalDuration < 5000 ? 1.0 : Math.max(0.3, 5000 / totalDuration);
    const satisfaction = (successRate * 0.6) + (timingScore * 0.4);

    return {
      clarity: Math.round(clarity * 100) / 100,
      transparency: Math.round(transparency * 100) / 100,
      satisfaction: Math.round(satisfaction * 100) / 100
    };
  }

  /**
   * Reset tracker for new conversation
   */
  reset(): void {
    this.activeExecutions.clear();
    this.executionHistory = [];
    this.escalationContext = undefined;
    this.startTime = performance.now();
    console.log('🔄 [EXECUTION_TRACKER] Reset for new conversation');
  }
}

// Singleton instance for global use
export const executionTracker = new ExecutionTracker(); 