import { IntentAnalysis } from './planner';
import { ExecutionResult } from './executor';
import { RunLog } from './reflector';

export interface GoalDefinition {
  primary: string;
  secondary: string[];
  successCriteria: {
    required: SuccessCriterion[];
    optional: SuccessCriterion[];
  };
  timeframe: {
    immediate: number; // milliseconds
    followUp: number; // milliseconds  
    ultimate: number; // milliseconds
  };
}

export interface SuccessCriterion {
  type: 'service_found' | 'ticket_created' | 'notification_sent' | 'member_satisfied' | 'human_escalated';
  description: string;
  validator: (executionResult: ExecutionResult, runLog?: RunLog) => boolean;
  weight: number; // 0-1, importance of this criterion
}

export interface GoalValidation {
  achieved: boolean;
  score: number; // 0-1, overall achievement score
  criteriaResults: Array<{
    criterion: SuccessCriterion;
    passed: boolean;
    impact: number;
  }>;
  missingElements: string[];
  retryRecommended: boolean;
  retryStrategy?: RetryStrategy;
}

export interface RetryStrategy {
  approach: 'same_tools' | 'alternative_tools' | 'escalate' | 'collect_more_info';
  modifications: string[];
  expectedImprovement: number;
  maxAttempts: number;
}

/**
 * GOAL CHECKER: Success validation with retry logic
 * Validates whether member goals were achieved and recommends retry strategies
 */
export class GoalChecker {

  /**
   * Main validation function - checks if goals were achieved
   */
  async validateGoalAchievement(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    runLog?: RunLog
  ): Promise<GoalValidation> {
    console.log(`[GOAL_CHECKER] Validating goals for ${intentAnalysis.primaryBucket} request`);
    
    // Define goals based on intent analysis
    const goalDefinition = this.defineGoals(intentAnalysis);
    
    // Validate each success criterion
    const criteriaResults = await this.validateCriteria(
      goalDefinition.successCriteria,
      executionResult,
      runLog
    );
    
    // Calculate overall achievement score
    const score = this.calculateAchievementScore(criteriaResults);
    
    // Determine if goals were achieved
    const achieved = this.determineAchievement(criteriaResults, score);
    
    // Identify missing elements
    const missingElements = this.identifyMissingElements(criteriaResults);
    
    // Determine retry recommendation
    const retryRecommended = this.shouldRetry(achieved, score, executionResult);
    
    // Generate retry strategy if needed
    const retryStrategy = retryRecommended 
      ? this.generateRetryStrategy(intentAnalysis, executionResult, missingElements)
      : undefined;

    const validation: GoalValidation = {
      achieved,
      score,
      criteriaResults,
      missingElements,
      retryRecommended,
      retryStrategy
    };

    console.log(`[GOAL_CHECKER] Goals ${achieved ? 'ACHIEVED' : 'NOT ACHIEVED'} (score: ${(score * 100).toFixed(1)}%)`);
    
    return validation;
  }

  /**
   * Validate goal achievement after follow-up period
   */
  async validateUltimateSuccess(
    originalValidation: GoalValidation,
    followUpData: {
      memberFeedback?: number; // 1-5 satisfaction score
      ticketStatus?: string;
      conciergeNotes?: string;
      actualOutcome?: string;
    }
  ): Promise<GoalValidation> {
    console.log(`[GOAL_CHECKER] Validating ultimate success with follow-up data`);
    
    // Update validation based on follow-up data
    let updatedScore = originalValidation.score;
    
    // Factor in member feedback
    if (followUpData.memberFeedback) {
      const feedbackScore = followUpData.memberFeedback / 5; // Normalize to 0-1
      updatedScore = (updatedScore + feedbackScore) / 2; // Average with original score
    }
    
    // Factor in actual outcome
    if (followUpData.actualOutcome === 'completed_successfully') {
      updatedScore = Math.max(updatedScore, 0.9); // Boost if actually completed
    } else if (followUpData.actualOutcome === 'cancelled' || followUpData.actualOutcome === 'failed') {
      updatedScore = Math.min(updatedScore, 0.3); // Reduce if cancelled/failed
    }
    
    return {
      ...originalValidation,
      achieved: updatedScore >= 0.8,
      score: updatedScore
    };
  }

  /**
   * Define goals based on intent analysis
   */
  private defineGoals(intentAnalysis: IntentAnalysis): GoalDefinition {
    const { primaryBucket, serviceType, urgency } = intentAnalysis;
    
    // Define goals based on service bucket
    const goalsByBucket: Record<string, Partial<GoalDefinition>> = {
      transportation: {
        primary: 'Arrange luxury transportation service',
        secondary: ['Confirm booking details', 'Provide travel itinerary', 'Ensure premium experience'],
        successCriteria: {
          required: [
            this.createCriterion('service_found', 'Appropriate transportation service identified', 0.8),
            this.createCriterion('ticket_created', 'Service booking ticket created', 0.9)
          ],
          optional: [
            this.createCriterion('notification_sent', 'Concierge team notified', 0.6),
            this.createCriterion('member_satisfied', 'Member expressed satisfaction', 0.7)
          ]
        }
      },
      events: {
        primary: 'Secure exclusive event access',
        secondary: ['Confirm event details', 'Arrange VIP amenities', 'Coordinate experience'],
        successCriteria: {
          required: [
            this.createCriterion('service_found', 'Event access option identified', 0.8),
            this.createCriterion('ticket_created', 'Event booking initiated', 0.9)
          ],
          optional: [
            this.createCriterion('notification_sent', 'Event specialist notified', 0.6)
          ]
        }
      },
      brandDev: {
        primary: 'Initiate brand development consultation',
        secondary: ['Understand objectives', 'Present strategy options', 'Schedule consultation'],
        successCriteria: {
          required: [
            this.createCriterion('service_found', 'Brand development service matched', 0.7),
            this.createCriterion('human_escalated', 'Brand specialist consultation scheduled', 0.9)
          ],
          optional: []
        }
      },
      investments: {
        primary: 'Connect with investment advisory services',
        secondary: ['Assess investment needs', 'Present opportunities', 'Schedule advisor meeting'],
        successCriteria: {
          required: [
            this.createCriterion('human_escalated', 'Investment advisor contacted', 1.0)
          ],
          optional: [
            this.createCriterion('service_found', 'Investment options presented', 0.6)
          ]
        }
      },
      taglades: {
        primary: 'Facilitate exclusive TAG community access',
        secondary: ['Verify membership eligibility', 'Present opportunities', 'Coordinate introduction'],
        successCriteria: {
          required: [
            this.createCriterion('human_escalated', 'Community specialist engaged', 0.9)
          ],
          optional: [
            this.createCriterion('service_found', 'Community opportunities identified', 0.7)
          ]
        }
      },
      lifestyle: {
        primary: 'Arrange lifestyle enhancement services',
        secondary: ['Understand preferences', 'Curate options', 'Coordinate service delivery'],
        successCriteria: {
          required: [
            this.createCriterion('service_found', 'Lifestyle service identified', 0.8),
            this.createCriterion('ticket_created', 'Service request created', 0.8)
          ],
          optional: [
            this.createCriterion('notification_sent', 'Lifestyle curator notified', 0.6)
          ]
        }
      }
    };

    const baseGoal = goalsByBucket[primaryBucket] || goalsByBucket.lifestyle;
    
    // Adjust timeframes based on urgency
    const timeframes = {
      emergency: { immediate: 5000, followUp: 900000, ultimate: 3600000 }, // 5s, 15m, 1h
      urgent: { immediate: 10000, followUp: 1800000, ultimate: 7200000 }, // 10s, 30m, 2h
      standard: { immediate: 30000, followUp: 3600000, ultimate: 86400000 } // 30s, 1h, 24h
    };

    return {
      primary: baseGoal.primary || 'Fulfill member request',
      secondary: baseGoal.secondary || [],
      successCriteria: baseGoal.successCriteria || { required: [], optional: [] },
      timeframe: timeframes[urgency]
    };
  }

  /**
   * Create a success criterion with validator
   */
  private createCriterion(
    type: SuccessCriterion['type'],
    description: string,
    weight: number
  ): SuccessCriterion {
    return {
      type,
      description,
      weight,
      validator: (executionResult: ExecutionResult, runLog?: RunLog) => {
        switch (type) {
          case 'service_found':
            return executionResult.executedSteps.some(
              step => step.toolName === 'fetch_active_services' && 
                      step.status === 'completed' &&
                      step.result?.totalFound > 0
            );
            
          case 'ticket_created':
            return executionResult.executedSteps.some(
              step => step.toolName === 'create_ticket' && 
                      step.status === 'completed' &&
                      step.result?.ticket?.id
            );
            
          case 'notification_sent':
            return executionResult.executedSteps.some(
              step => step.toolName === 'notify_concierge' && 
                      step.status === 'completed' &&
                      step.result?.sent === true
            );
            
          case 'human_escalated':
            return executionResult.escalationNeeded || 
                   executionResult.executedSteps.some(
                     step => step.toolName === 'notify_concierge' && 
                             step.status === 'completed'
                   );
            
          case 'member_satisfied':
            // Would be determined from follow-up feedback
            return runLog?.metrics.memberSatisfaction ? runLog.metrics.memberSatisfaction >= 4 : false;
            
          default:
            return false;
        }
      }
    };
  }

  /**
   * Validate all success criteria
   */
  private async validateCriteria(
    successCriteria: GoalDefinition['successCriteria'],
    executionResult: ExecutionResult,
    runLog?: RunLog
  ): Promise<GoalValidation['criteriaResults']> {
    const results: GoalValidation['criteriaResults'] = [];
    
    // Validate required criteria
    for (const criterion of successCriteria.required) {
      const passed = criterion.validator(executionResult, runLog);
      results.push({
        criterion,
        passed,
        impact: passed ? criterion.weight : -criterion.weight
      });
    }
    
    // Validate optional criteria
    for (const criterion of successCriteria.optional) {
      const passed = criterion.validator(executionResult, runLog);
      results.push({
        criterion,
        passed,
        impact: passed ? criterion.weight * 0.5 : 0 // Optional criteria have reduced impact
      });
    }
    
    return results;
  }

  /**
   * Calculate overall achievement score
   */
  private calculateAchievementScore(criteriaResults: GoalValidation['criteriaResults']): number {
    if (criteriaResults.length === 0) return 0;
    
    let totalWeight = 0;
    let achievedWeight = 0;
    
    criteriaResults.forEach(result => {
      const weight = result.criterion.weight;
      totalWeight += weight;
      
      if (result.passed) {
        achievedWeight += weight;
      } else {
        // Partial credit for optional criteria that weren't met but tried
        if (weight < 0.8) {
          achievedWeight += weight * 0.3; // 30% partial credit for attempt
        }
      }
    });
    
    return totalWeight > 0 ? achievedWeight / totalWeight : 0;
  }

  /**
   * Determine if goals were achieved
   */
  private determineAchievement(
    criteriaResults: GoalValidation['criteriaResults'],
    score: number
  ): boolean {
    // More flexible achievement logic
    
    // Get required criteria (weight >= 0.8)
    const requiredCriteria = criteriaResults.filter(result => result.criterion.weight >= 0.8);
    const optionalCriteria = criteriaResults.filter(result => result.criterion.weight < 0.8);
    
    // Count passed criteria
    const requiredPassed = requiredCriteria.filter(result => result.passed).length;
    const optionalPassed = optionalCriteria.filter(result => result.passed).length;
    
    // Success thresholds
    const hasAllRequired = requiredPassed === requiredCriteria.length;
    const hasMostRequired = requiredPassed >= Math.ceil(requiredCriteria.length * 0.75); // 75% of required
    const hasGoodScore = score >= 0.6; // Lowered from 0.8 to 0.6
    const hasExcellentScore = score >= 0.8;
    
    // Achievement levels:
    // 1. EXCELLENT: All required + excellent score
    if (hasAllRequired && hasExcellentScore) {
      return true;
    }
    
    // 2. GOOD: Most required + good score + some optional
    if (hasMostRequired && hasGoodScore && optionalPassed > 0) {
      return true;
    }
    
    // 3. ACCEPTABLE: All required + good score (even if not excellent)
    if (hasAllRequired && hasGoodScore) {
      return true;
    }
    
    // 4. MINIMUM: Most required + excellent score
    if (hasMostRequired && hasExcellentScore) {
      return true;
    }
    
    return false;
  }

  /**
   * Identify missing elements
   */
  private identifyMissingElements(criteriaResults: GoalValidation['criteriaResults']): string[] {
    return criteriaResults
      .filter(result => !result.passed && result.criterion.weight >= 0.8)
      .map(result => result.criterion.description);
  }

  /**
   * Determine if retry is recommended
   */
  private shouldRetry(
    achieved: boolean,
    score: number,
    executionResult: ExecutionResult
  ): boolean {
    // Don't retry if goals achieved
    if (achieved) return false;
    
    // Don't retry if already escalated
    if (executionResult.escalationNeeded) return false;
    
    // Retry if score is close but not quite there
    if (score >= 0.6 && score < 0.8) return true;
    
    // Retry if some tools succeeded but others failed
    const hasSuccessfulSteps = executionResult.executedSteps.some(step => step.status === 'completed');
    const hasFailedSteps = executionResult.executedSteps.some(step => step.status === 'failed');
    
    return hasSuccessfulSteps && hasFailedSteps;
  }

  /**
   * Generate retry strategy
   */
  private generateRetryStrategy(
    intentAnalysis: IntentAnalysis,
    executionResult: ExecutionResult,
    missingElements: string[]
  ): RetryStrategy {
    const failedSteps = executionResult.executedSteps.filter(step => step.status === 'failed');
    
    if (failedSteps.length === 0) {
      // No failures, but goals not achieved - collect more info
      return {
        approach: 'collect_more_info',
        modifications: [
          'Gather additional member preferences',
          'Clarify specific requirements',
          'Refine service search criteria'
        ],
        expectedImprovement: 0.3,
        maxAttempts: 2
      };
    }
    
    if (failedSteps.some(step => step.toolName === 'create_ticket')) {
      // Ticket creation failed - try alternative approach
      return {
        approach: 'alternative_tools',
        modifications: [
          'Use escalation path instead of direct booking',
          'Gather missing requirements first',
          'Simplify ticket parameters'
        ],
        expectedImprovement: 0.4,
        maxAttempts: 2
      };
    }
    
    if (failedSteps.every(step => step.toolName === 'fetch_active_services')) {
      // Service search failed - try different search parameters
      return {
        approach: 'same_tools',
        modifications: [
          'Broaden search criteria',
          'Try different service tiers',
          'Search in secondary buckets'
        ],
        expectedImprovement: 0.5,
        maxAttempts: 3
      };
    }
    
    // Multiple types of failures - escalate
    return {
      approach: 'escalate',
      modifications: [
        'Route to human concierge',
        'Provide detailed failure context',
        'Flag for priority handling'
      ],
      expectedImprovement: 0.8,
      maxAttempts: 1
    };
  }
} 