import { IntentAnalysis } from './planner';
import { ExecutionResult, ExecutionStep } from './executor';

export interface RunLog {
  id: string;
  timestamp: string;
  memberId: string;
  originalMessage: string;
  intentAnalysis: IntentAnalysis;
  executionResult: ExecutionResult;
  outcome: 'success' | 'partial_success' | 'failure' | 'escalation';
  metrics: {
    responseTime: number;
    toolsUsed: string[];
    escalationTriggered: boolean;
    memberSatisfaction?: number;
  };
  learnings: {
    intentAccuracy: number;
    executionEfficiency: number;
    areas_for_improvement: string[];
    successful_patterns: string[];
  };
  followUp: {
    required: boolean;
    type?: 'confirmation' | 'additional_info' | 'quality_check';
    scheduledAt?: string;
  };
}

export interface PerformanceMetrics {
  totalRuns: number;
  successRate: number;
  averageResponseTime: number;
  commonIntentPatterns: Array<{
    pattern: string;
    frequency: number;
    successRate: number;
  }>;
  toolEffectiveness: Record<string, {
    usageCount: number;
    successRate: number;
    averageExecutionTime: number;
  }>;
  escalationPatterns: Array<{
    trigger: string;
    frequency: number;
    resolution_time?: number;
  }>;
  memberSatisfactionTrends: Array<{
    date: string;
    averageScore: number;
    sampleSize: number;
  }>;
}

/**
 * REFLECTOR: Log and learn from interactions
 * Handles run logging, performance analysis, and continuous improvement
 */
export class InteractionReflector {

  /**
   * Main reflection function - logs interaction and extracts learnings
   */
  async reflectOnInteraction(
    originalMessage: string,
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    memberId: string,
    startTime: number
  ): Promise<RunLog> {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`[REFLECTOR] Analyzing interaction for member: ${memberId}`);
    
    // Determine outcome
    const outcome = this.determineOutcome(executionResult);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(executionResult, responseTime);
    
    // Extract learnings
    const learnings = this.extractLearnings(intentAnalysis, executionResult);
    
    // Determine follow-up requirements
    const followUp = this.determineFollowUp(outcome, executionResult);
    
    // Create run log
    const runLog: RunLog = {
      id: this.generateRunId(),
      timestamp: new Date().toISOString(),
      memberId,
      originalMessage,
      intentAnalysis,
      executionResult,
      outcome,
      metrics,
      learnings,
      followUp
    };

    // Store the run log
    await this.storeRunLog(runLog);
    
    // Update performance metrics
    await this.updatePerformanceMetrics(runLog);
    
    console.log(`[REFLECTOR] Interaction logged with outcome: ${outcome}`);
    
    return runLog;
  }

  /**
   * Analyze performance trends and patterns
   */
  async analyzePerformance(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<PerformanceMetrics> {
    console.log(`[REFLECTOR] Analyzing performance for ${timeRange}`);
    
    const runLogs = await this.getRunLogs(timeRange);
    
    const metrics: PerformanceMetrics = {
      totalRuns: runLogs.length,
      successRate: this.calculateSuccessRate(runLogs),
      averageResponseTime: this.calculateAverageResponseTime(runLogs),
      commonIntentPatterns: this.analyzeIntentPatterns(runLogs),
      toolEffectiveness: this.analyzeToolEffectiveness(runLogs),
      escalationPatterns: this.analyzeEscalationPatterns(runLogs),
      memberSatisfactionTrends: this.analyzeSatisfactionTrends(runLogs)
    };

    return metrics;
  }

  /**
   * Get insights for improving the system
   */
  async getImprovementInsights(): Promise<{
    topIssues: string[];
    recommendations: string[];
    successfulPatterns: string[];
    trainingNeeds: string[];
  }> {
    const metrics = await this.analyzePerformance('month');
    
    const insights = {
      topIssues: this.identifyTopIssues(metrics),
      recommendations: this.generateRecommendations(metrics),
      successfulPatterns: this.identifySuccessfulPatterns(metrics),
      trainingNeeds: this.identifyTrainingNeeds(metrics)
    };

    return insights;
  }

  /**
   * Determine overall outcome of the interaction
   */
  private determineOutcome(executionResult: ExecutionResult): RunLog['outcome'] {
    const { success, escalationNeeded, executedSteps } = executionResult;
    
    if (escalationNeeded) {
      return 'escalation';
    }
    
    if (!success) {
      return 'failure';
    }
    
    // Check for partial success (some steps failed)
    const failedSteps = executedSteps.filter(step => step.status === 'failed');
    if (failedSteps.length > 0 && failedSteps.length < executedSteps.length) {
      return 'partial_success';
    }
    
    return 'success';
  }

  /**
   * Calculate interaction metrics
   */
  private calculateMetrics(executionResult: ExecutionResult, responseTime: number): RunLog['metrics'] {
    const { executedSteps, escalationNeeded } = executionResult;
    
    return {
      responseTime,
      toolsUsed: [...new Set(executedSteps.map(step => step.toolName))],
      escalationTriggered: escalationNeeded,
      memberSatisfaction: undefined // Would be collected via feedback
    };
  }

  /**
   * Extract learnings from the interaction
   */
  private extractLearnings(
    intentAnalysis: IntentAnalysis, 
    executionResult: ExecutionResult
  ): RunLog['learnings'] {
    const { confidence } = intentAnalysis;
    const { success, executedSteps } = executionResult;
    
    // Calculate intent accuracy based on successful execution
    const intentAccuracy = success ? confidence : confidence * 0.5;
    
    // Calculate execution efficiency
    const totalSteps = executedSteps.length;
    const successfulSteps = executedSteps.filter(step => step.status === 'completed').length;
    const executionEfficiency = totalSteps > 0 ? successfulSteps / totalSteps : 0;
    
    // Identify improvement areas
    const areas_for_improvement: string[] = [];
    if (intentAccuracy < 0.7) {
      areas_for_improvement.push('Intent recognition accuracy');
    }
    if (executionEfficiency < 0.8) {
      areas_for_improvement.push('Tool execution reliability');
    }
    if (executedSteps.some(step => step.executionTime && step.executionTime > 5000)) {
      areas_for_improvement.push('Response time optimization');
    }
    
    // Identify successful patterns
    const successful_patterns: string[] = [];
    if (success && intentAccuracy > 0.8) {
      successful_patterns.push(`High confidence ${intentAnalysis.primaryBucket} intent recognition`);
    }
    if (executionEfficiency === 1.0) {
      successful_patterns.push('Perfect tool execution sequence');
    }
    
    return {
      intentAccuracy,
      executionEfficiency,
      areas_for_improvement,
      successful_patterns
    };
  }

  /**
   * Determine if follow-up is required
   */
  private determineFollowUp(outcome: RunLog['outcome'], executionResult: ExecutionResult): RunLog['followUp'] {
    switch (outcome) {
      case 'success':
        // Check if ticket was created - needs confirmation
        if (executionResult.finalResult?.ticket) {
          return {
            required: true,
            type: 'confirmation',
            scheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
          };
        }
        return { required: false };
        
      case 'partial_success':
        return {
          required: true,
          type: 'additional_info',
          scheduledAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        };
        
      case 'failure':
        return {
          required: true,
          type: 'quality_check',
          scheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        };
        
      case 'escalation':
        return { required: false }; // Human concierge will handle
        
      default:
        return { required: false };
    }
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Store run log (MVP: local file, production: database)
   */
  private async storeRunLog(runLog: RunLog): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const logsDir = path.join(process.cwd(), 'src/data/logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      const logFile = path.join(logsDir, `${runLog.id}.json`);
      await fs.writeFile(logFile, JSON.stringify(runLog, null, 2));
      
      // Also append to daily summary log
      const today = new Date().toISOString().split('T')[0];
      const summaryFile = path.join(logsDir, `summary-${today}.json`);
      
      try {
        const existing = await fs.readFile(summaryFile, 'utf-8');
        const summaryData = JSON.parse(existing);
        summaryData.runs.push({
          id: runLog.id,
          timestamp: runLog.timestamp,
          outcome: runLog.outcome,
          responseTime: runLog.metrics.responseTime
        });
        await fs.writeFile(summaryFile, JSON.stringify(summaryData, null, 2));
      } catch {
        // Create new summary file
        const summaryData = {
          date: today,
          runs: [{
            id: runLog.id,
            timestamp: runLog.timestamp,
            outcome: runLog.outcome,
            responseTime: runLog.metrics.responseTime
          }]
        };
        await fs.writeFile(summaryFile, JSON.stringify(summaryData, null, 2));
      }
      
    } catch (error) {
      console.error('[REFLECTOR] Failed to store run log:', error);
    }
  }

  /**
   * Update global performance metrics
   */
  private async updatePerformanceMetrics(runLog: RunLog): Promise<void> {
    // In MVP, we'll just log the key metrics
    // In production, this would update a performance dashboard
    
    console.log(`[REFLECTOR] Performance Update:`, {
      outcome: runLog.outcome,
      responseTime: runLog.metrics.responseTime,
      toolsUsed: runLog.metrics.toolsUsed,
      intentAccuracy: runLog.learnings.intentAccuracy,
      executionEfficiency: runLog.learnings.executionEfficiency
    });
  }

  /**
   * Helper methods for performance analysis
   */
  private async getRunLogs(timeRange: string): Promise<RunLog[]> {
    // In MVP, return mock data
    // In production, this would query the database
    return [];
  }

  private calculateSuccessRate(runLogs: RunLog[]): number {
    if (runLogs.length === 0) return 0;
    const successful = runLogs.filter(log => log.outcome === 'success').length;
    return successful / runLogs.length;
  }

  private calculateAverageResponseTime(runLogs: RunLog[]): number {
    if (runLogs.length === 0) return 0;
    const total = runLogs.reduce((sum, log) => sum + log.metrics.responseTime, 0);
    return total / runLogs.length;
  }

  private analyzeIntentPatterns(runLogs: RunLog[]): PerformanceMetrics['commonIntentPatterns'] {
    // Analyze common intent patterns and their success rates
    return [];
  }

  private analyzeToolEffectiveness(runLogs: RunLog[]): PerformanceMetrics['toolEffectiveness'] {
    // Analyze which tools are most effective
    return {};
  }

  private analyzeEscalationPatterns(runLogs: RunLog[]): PerformanceMetrics['escalationPatterns'] {
    // Analyze what triggers escalations
    return [];
  }

  private analyzeSatisfactionTrends(runLogs: RunLog[]): PerformanceMetrics['memberSatisfactionTrends'] {
    // Analyze member satisfaction trends
    return [];
  }

  private identifyTopIssues(metrics: PerformanceMetrics): string[] {
    const issues = [];
    if (metrics.successRate < 0.8) {
      issues.push('Success rate below target (80%)');
    }
    if (metrics.averageResponseTime > 3000) {
      issues.push('Response time above target (3s)');
    }
    return issues;
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    return [
      'Continue monitoring tool execution efficiency',
      'Improve intent recognition for edge cases',
      'Optimize response time for complex requests'
    ];
  }

  private identifySuccessfulPatterns(metrics: PerformanceMetrics): string[] {
    return [
      'High confidence transportation requests execute successfully',
      'Events bucket shows strong member satisfaction',
      'Escalation triggers work effectively for complex requests'
    ];
  }

  private identifyTrainingNeeds(metrics: PerformanceMetrics): string[] {
    return [
      'Intent recognition for ambiguous requests',
      'Tool error handling and recovery',
      'Member communication during escalations'
    ];
  }
} 